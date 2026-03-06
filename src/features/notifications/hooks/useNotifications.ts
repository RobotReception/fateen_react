import { useState, useEffect, useCallback, useRef } from "react"
import { useAuthStore } from "@/stores/auth-store"
import {
    getNotifications,
    markAllNotificationsRead,
    type NotificationItem,
} from "../services/notification-service"
import { useNotificationSound } from "./use-notification-sound"

/* ═══════════════════════════════════════════════════════════
   useNotifications Hook

   Strategy:
   - List جلب مرة عند أول تحميل (cached)
   - WS يرسل count → إذا زاد الـ unread → silent background refresh
   - Panel يفتح فوراً بدون loading (من الـ cache)
   - loadMore() يجلب الصفحة التالية ويدمجها
═══════════════════════════════════════════════════════════ */

const PAGE_SIZE = 20
const WS_PROTOCOL = window.location.protocol === "https:" ? "wss:" : "ws:"
const WS_NOTIFICATIONS_URL = `${WS_PROTOCOL}//${window.location.host}/api/backend/v2/notifications/ws`

export function useNotifications() {
    const { token } = useAuthStore()
    const { play: playChime } = useNotificationSound()

    const [notifications, setNotifications] = useState<NotificationItem[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [totalCount, setTotalCount] = useState(0)
    const [initialLoading, setInitialLoading] = useState(false) // only first load
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasFetched, setHasFetched] = useState(false)

    const wsRef = useRef<WebSocket | null>(null)
    const shouldReconnect = useRef(true)
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const lastUnread = useRef(0)
    const isFetching = useRef(false) // prevent concurrent fetches

    // Derive hasMore from total vs loaded count
    const hasMore = notifications.length < totalCount

    // ── Silent background list refresh (no spinner) ───────
    const silentRefresh = useCallback(async () => {
        if (!token || isFetching.current) return
        isFetching.current = true
        try {
            const d = await getNotifications(PAGE_SIZE, 0)
            setNotifications(d.notifications ?? [])
            setTotalCount(d.total ?? 0)
            setHasFetched(true)
        } catch { /* silent — don't disrupt UI */ }
        finally { isFetching.current = false }
    }, [token])

    // ── Initial load (with loading state, once only) ──────
    const initialLoad = useCallback(async () => {
        if (!token || hasFetched || isFetching.current) return
        isFetching.current = true
        setInitialLoading(true)
        try {
            const d = await getNotifications(PAGE_SIZE, 0)
            setNotifications(d.notifications ?? [])
            setTotalCount(d.total ?? 0)
            setHasFetched(true)
        } catch (err) {
            console.error("Failed to fetch notifications:", err)
        } finally {
            setInitialLoading(false)
            isFetching.current = false
        }
    }, [token, hasFetched])

    // ── Load more (append next page) ─────────────────────
    const loadMore = useCallback(async () => {
        if (!token || loadingMore || isFetching.current || !hasMore) return
        isFetching.current = true
        setLoadingMore(true)
        try {
            const offset = notifications.length
            const d = await getNotifications(PAGE_SIZE, offset)
            const newItems = d.notifications ?? []
            // Deduplicate by id (safety)
            setNotifications(prev => {
                const existingIds = new Set(prev.map(n => n.id))
                const unique = newItems.filter(n => !existingIds.has(n.id))
                return [...prev, ...unique]
            })
            setTotalCount(d.total ?? totalCount)
        } catch (err) {
            console.error("Failed to load more notifications:", err)
        } finally {
            setLoadingMore(false)
            isFetching.current = false
        }
    }, [token, loadingMore, hasMore, notifications.length, totalCount])

    // ── WebSocket connect ─────────────────────────────────
    const connectWS = useCallback(() => {
        if (!token) return
        if (wsRef.current?.readyState === WebSocket.OPEN) return

        const ws = new WebSocket(WS_NOTIFICATIONS_URL)
        wsRef.current = ws

        ws.onopen = () => {
            // استخدم أحدث توكن من localStorage (يُحدّث عند التجديد التلقائي)
            const freshToken = localStorage.getItem("access_token") || token
            ws.send(`auth:${freshToken}`)
            // Fetch list now if not already fetched
            initialLoad()
        }

        ws.onmessage = ({ data }) => {
            try {
                const msg = JSON.parse(data as string)
                if (msg.type === "count") {
                    const newUnread = msg.unread ?? 0
                    const newTotal = msg.total ?? 0

                    setUnreadCount(newUnread)
                    setTotalCount(newTotal)

                    // If new notifications arrived → silent background refresh + chime
                    if (newUnread > lastUnread.current) {
                        silentRefresh()
                        playChime()
                    }

                    lastUnread.current = newUnread
                }
            } catch { /* pong or plain text */ }
        }

        ws.onclose = (event) => {
            wsRef.current = null
            if (event.code === 4001) {
                console.warn("🔐 WS: invalid token")
                return
            }
            if (shouldReconnect.current) {
                reconnectTimer.current = setTimeout(connectWS, 3000)
            }
        }

        ws.onerror = () => ws.close()
    }, [token, initialLoad, silentRefresh])

    // ── Lifecycle ─────────────────────────────────────────
    useEffect(() => {
        if (!token) return
        shouldReconnect.current = true
        connectWS()

        return () => {
            shouldReconnect.current = false
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
            wsRef.current?.close()
        }
    }, [token, connectWS])

    // ── Mark single as read (optimistic + WS) ─────────────
    const handleMarkAsRead = useCallback(async (notificationId: string) => {
        setNotifications((prev) =>
            prev.map((n) => n.id === notificationId ? { ...n, is_read: true } : n)
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(`mark_read:${notificationId}`)
        }
    }, [])

    // ── Mark ALL as read (optimistic + HTTP + WS) ─────────
    const handleMarkAllAsRead = useCallback(async () => {
        if (unreadCount === 0) return

        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
        setUnreadCount(0)

        try {
            await markAllNotificationsRead()
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send("refresh")
            }
        } catch (err) {
            console.error("mark_all_read failed:", err)
        }
    }, [unreadCount])

    return {
        notifications,
        unreadCount,
        totalCount,
        loading: initialLoading, // only true on very first load
        loadingMore,
        hasMore,
        loadMore,
        markAsRead: handleMarkAsRead,
        markAllAsRead: handleMarkAllAsRead,
    }
}
