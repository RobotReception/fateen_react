/**
 * useInboxSocket — Patch-first, Scoped-delivery real-time inbox events.
 *
 * Official Event Policy for Fateen:
 *
 *   ┌─────────────────────────────┬──────────────────────────────────────────────┐
 *   │ Event                       │ Frontend Action                              │
 *   ├─────────────────────────────┼──────────────────────────────────────────────┤
 *   │ message.created             │ Patch list (last_msg, move-to-top, unread+1) │
 *   │                             │ + invalidate ONLY the open conversation      │
 *   │ conversation.unread_changed │ Patch only                                   │
 *   │ conversation.status_changed │ Patch only + invalidate sidebar-summary      │
 *   │ conversation.assigned       │ Patch only + invalidate sidebar-summary      │
 *   │ conversation.created        │ Invalidate list + sidebar-summary            │
 *   │ conversation.updated        │ Patch if payload enough, else invalidate     │
 *   │ reconnect                   │ Full resync (self only)                      │
 *   └─────────────────────────────┴──────────────────────────────────────────────┘
 *
 * Production features:
 *   ✅ Patch-first — most events update cache directly, zero API calls
 *   ✅ Move-to-top — new messages reorder the conversation list
 *   ✅ Scoped invalidation — messages refetch only for the open conversation
 *   ✅ Debounced invalidation — batches rapid events into single API call
 *   ✅ Event dedup via event_id
 *   ✅ Heartbeat ping 25s / server timeout 60s
 *   ✅ Auto-reconnect with full resync
 *   ✅ Frontend metrics tracking
 */
import { useEffect, useRef, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "@/stores/auth-store"
import type { Customer, CustomersResponse } from "@/features/inbox/types/inbox.types"

// ── Derive WebSocket URL from API base URL ──────────────────
// In production: VITE_API_BASE_URL = "https://fateen-backend-dashboard.prideidea.com/api/backend/v2"
// → WS URL = "wss://fateen-backend-dashboard.prideidea.com/api/backend/v2/ws/inbox"
// In dev: no env var → fallback to window.location.host (Vite proxy handles it)
function buildWsUrl(): string {
    const apiBase = import.meta.env.VITE_API_BASE_URL as string | undefined
    if (apiBase) {
        // Convert https://host/path → wss://host/path/ws/inbox
        const wsBase = apiBase.replace(/^https:/, "wss:").replace(/^http:/, "ws:")
        return `${wsBase}/ws/inbox`
    }
    // Fallback: same host (dev mode with Vite proxy)
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    return `${protocol}//${window.location.host}/api/backend/v2/ws/inbox`
}
const WS_INBOX_URL = buildWsUrl()

const RECONNECT_DELAY_MS = 3_000
const HEARTBEAT_INTERVAL_MS = 25_000
const EVENT_DEDUP_SIZE = 200
const DEBOUNCE_MS = 300

/** Inbox event shape pushed by the server */
interface InboxEvent {
    type: string
    event_id?: string
    sequence?: number
    conversation_id?: string
    customer_id?: string
    message_id?: string
    tenant_id?: string
    timestamp?: number
    occurred_at?: string
    source?: string
    routing_scope?: {
        team_ids?: string[]
        assigned_to?: string
    }
    payload?: Record<string, unknown>
}

// ── Frontend metrics (accessible via console) ───────────────
const _metrics = {
    events_patched: 0,
    events_invalidated: 0,
    refetches_triggered: 0,
    reconnect_count: 0,
    dedup_hits: 0,
}
    ; (window as unknown as Record<string, unknown>).__inbox_metrics = _metrics

export function useInboxSocket() {
    const { token } = useAuthStore()
    const queryClient = useQueryClient()

    const wsRef = useRef<WebSocket | null>(null)
    const shouldReconnect = useRef(true)
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null)
    const seenEvents = useRef<Set<string>>(new Set())
    const isReconnecting = useRef(false)

    // Debounce timers
    const summaryDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
    const customersDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

    // ── Dedup ───────────────────────────────────────────────
    const isDuplicate = useCallback((eventId: string | undefined): boolean => {
        if (!eventId) return false
        if (seenEvents.current.has(eventId)) {
            _metrics.dedup_hits++
            return true
        }
        seenEvents.current.add(eventId)
        if (seenEvents.current.size > EVENT_DEDUP_SIZE) {
            const first = seenEvents.current.values().next().value
            if (first) seenEvents.current.delete(first)
        }
        return false
    }, [])

    // ── Debounced invalidate sidebar summary ────────────────
    const invalidateSummary = useCallback(() => {
        if (summaryDebounce.current) clearTimeout(summaryDebounce.current)
        summaryDebounce.current = setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["inbox-summary"] })
            _metrics.events_invalidated++
            _metrics.refetches_triggered++
        }, DEBOUNCE_MS)
    }, [queryClient])

    // ── Debounced invalidate customer list ───────────────────
    const invalidateCustomers = useCallback(() => {
        if (customersDebounce.current) clearTimeout(customersDebounce.current)
        customersDebounce.current = setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["inbox-customers"] })
            _metrics.events_invalidated++
            _metrics.refetches_triggered++
        }, DEBOUNCE_MS)
    }, [queryClient])

    // ── Cache patching: update customer in list directly ─────
    const patchCustomerInCache = useCallback((
        customerId: string,
        patcher: (customer: Customer) => Customer,
    ) => {
        queryClient.setQueriesData<CustomersResponse>(
            { queryKey: ["inbox-customers"] },
            (old) => {
                if (!old?.items) return old
                return {
                    ...old,
                    items: old.items.map(c =>
                        c.customer_id === customerId ? patcher(c) : c
                    ),
                }
            },
        )
        _metrics.events_patched++
    }, [queryClient])

    // ── Move customer to top of list ─────────────────────────
    const moveCustomerToTop = useCallback((customerId: string) => {
        queryClient.setQueriesData<CustomersResponse>(
            { queryKey: ["inbox-customers"] },
            (old) => {
                if (!old?.items) return old
                const idx = old.items.findIndex(c => c.customer_id === customerId)
                if (idx <= 0) return old // already first or not found
                const items = [...old.items]
                const [moved] = items.splice(idx, 1)
                items.unshift(moved)
                return { ...old, items }
            },
        )
    }, [queryClient])

    // ── Resync: invalidate everything after reconnect ────────
    const resyncAll = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ["inbox-customers"] })
        queryClient.invalidateQueries({ queryKey: ["customer-messages"] })
        queryClient.invalidateQueries({ queryKey: ["inbox-summary"] })
        _metrics.refetches_triggered += 3
    }, [queryClient])

    // ── Handle event by type (Patch-first policy) ────────────
    const handleEvent = useCallback((event: InboxEvent) => {
        if (isDuplicate(event.event_id)) return

        const payload = event.payload || {}

        switch (event.type) {
            // ─── Level 2: Patch list + invalidate open conversation only ──
            case "message.created": {
                if (event.customer_id) {
                    // ★ Patch customer list directly (zero API call)
                    patchCustomerInCache(event.customer_id, (c) => ({
                        ...c,
                        last_message: String(payload.preview || c.last_message),
                        last_timestamp: String(payload.last_message_at || event.occurred_at || c.last_timestamp),
                        unread_count: (payload.direction === "inbound")
                            ? (payload.unread_count !== undefined
                                ? Number(payload.unread_count)
                                : (c.unread_count ?? 0) + 1)
                            : c.unread_count,
                    }))

                    // ★ Move to top of list (most recent conversation first)
                    moveCustomerToTop(event.customer_id)

                    // ★ Invalidate messages for this specific customer (1 targeted refetch)
                    queryClient.invalidateQueries({
                        queryKey: ["customer-messages", event.customer_id],
                    })
                    _metrics.refetches_triggered++
                }
                // ⛔ لا يُحدّث sidebar-summary — الرسالة لا تغيّر الأعداد
                break
            }

            // ─── Level 1: Patch only (zero API calls) ────────
            case "conversation.unread_changed": {
                if (event.customer_id && payload.unread_count !== undefined) {
                    patchCustomerInCache(event.customer_id, (c) => ({
                        ...c,
                        unread_count: Number(payload.unread_count),
                    }))
                }
                break
            }

            case "conversation.status_changed": {
                if (event.customer_id) {
                    patchCustomerInCache(event.customer_id, (c) => ({
                        ...c,
                        conversation_status: {
                            ...c.conversation_status,
                            is_closed: Boolean(payload.is_closed ?? c.conversation_status?.is_closed),
                            close_reason: String(payload.close_reason ?? c.conversation_status?.close_reason ?? ""),
                            close_category: String(payload.close_category ?? c.conversation_status?.close_category ?? ""),
                            closed_at: String(payload.closed_at ?? c.conversation_status?.closed_at ?? ""),
                        },
                        session_status: payload.is_closed ? "closed" : "open",
                    }))
                }
                // ★ Sidebar يتحدث — عداد المفتوح/المغلق تغيّر
                invalidateSummary()
                break
            }

            case "conversation.assigned": {
                if (event.customer_id) {
                    patchCustomerInCache(event.customer_id, (c) => ({
                        ...c,
                        assigned: {
                            ...c.assigned,
                            assigned_to: String(payload.assigned_to ?? c.assigned?.assigned_to ?? ""),
                            assigned_to_username: String(payload.assigned_to_username ?? c.assigned?.assigned_to_username ?? ""),
                            is_assigned: Boolean(payload.is_assigned ?? c.assigned?.is_assigned),
                        },
                    }))
                }
                // ★ Sidebar يتحدث — عداد "معيّنة لي" تغيّر
                invalidateSummary()
                break
            }

            // ─── Level 3: Invalidate (rare/complex events) ──
            case "conversation.created": {
                invalidateCustomers()
                invalidateSummary()
                break
            }

            case "conversation.updated": {
                // If payload has enough data to patch, do so
                if (event.customer_id && payload.last_message) {
                    patchCustomerInCache(event.customer_id, (c) => ({
                        ...c,
                        last_message: String(payload.last_message),
                        last_timestamp: String(payload.last_timestamp || c.last_timestamp),
                    }))
                } else {
                    // Payload not rich enough → invalidate
                    invalidateCustomers()
                }
                break
            }

            // ─── Level 1: Patch only (new event types) ──────
            case "conversation.ai_toggled": {
                if (event.customer_id) {
                    patchCustomerInCache(event.customer_id, (c) => ({
                        ...c,
                        enable_ai: Boolean(payload.enable_ai),
                    }))
                }
                // Sidebar يتحدث — عداد AI مفعّل/معطّل تغيّر
                invalidateSummary()
                break
            }

            case "conversation.lifecycle_changed": {
                if (event.customer_id) {
                    patchCustomerInCache(event.customer_id, (c) => ({
                        ...c,
                        lifecycle: {
                            ...(c.lifecycle || { code: "", name: "" }),
                            code: String(payload.new_lifecycle || c.lifecycle?.code || ""),
                            name: String(payload.new_lifecycle_name || c.lifecycle?.name || ""),
                        },
                    }))
                }
                // Sidebar يتحدث — أعداد المراحل تغيّرت
                invalidateSummary()
                break
            }

            default:
                break
        }
    }, [queryClient, isDuplicate, invalidateSummary, invalidateCustomers, patchCustomerInCache, moveCustomerToTop])

    // ── Heartbeat ───────────────────────────────────────────
    const startHeartbeat = useCallback(() => {
        stopHeartbeat()
        heartbeatTimer.current = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send("ping")
            }
        }, HEARTBEAT_INTERVAL_MS)
    }, [])

    const stopHeartbeat = useCallback(() => {
        if (heartbeatTimer.current) {
            clearInterval(heartbeatTimer.current)
            heartbeatTimer.current = null
        }
    }, [])

    // ── Connect ─────────────────────────────────────────────
    const connect = useCallback(() => {
        if (!token) return
        if (wsRef.current?.readyState === WebSocket.OPEN) return

        const ws = new WebSocket(WS_INBOX_URL)
        wsRef.current = ws

        ws.onopen = () => {
            console.log("📡 Inbox socket connected")
            if (token) ws.send(`auth:${token}`)
            startHeartbeat()

            if (isReconnecting.current) {
                console.log("🔄 Inbox socket reconnected — resyncing all")
                _metrics.reconnect_count++
                resyncAll()
                isReconnecting.current = false
            }
        }

        ws.onmessage = ({ data }) => {
            try {
                const event: InboxEvent = JSON.parse(data as string)
                if (event.type === "connected") return
                handleEvent(event)
            } catch {
                // plain text like "pong" — ignore
            }
        }

        ws.onclose = (ev) => {
            wsRef.current = null
            stopHeartbeat()

            if (ev.code === 4001) {
                console.warn("🔐 Inbox WS: unauthorized")
                return
            }
            if (shouldReconnect.current) {
                isReconnecting.current = true
                reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS)
            }
        }

        ws.onerror = () => ws.close()
    }, [token, handleEvent, startHeartbeat, stopHeartbeat, resyncAll])

    // ── Lifecycle ───────────────────────────────────────────
    useEffect(() => {
        if (!token) return
        shouldReconnect.current = true
        isReconnecting.current = false
        connect()

        return () => {
            shouldReconnect.current = false
            stopHeartbeat()
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
            if (summaryDebounce.current) clearTimeout(summaryDebounce.current)
            if (customersDebounce.current) clearTimeout(customersDebounce.current)
            wsRef.current?.close()
        }
    }, [token, connect, stopHeartbeat])
}
