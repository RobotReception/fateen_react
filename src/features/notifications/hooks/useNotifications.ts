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
   - لا manual fetch عند فتح الـ panel
═══════════════════════════════════════════════════════════ */

const WS_PROTOCOL = window.location.protocol === "https:" ? "wss:" : "ws:"
const WS_NOTIFICATIONS_URL = `${WS_PROTOCOL}//${window.location.host}/api/backend/v2/notifications/ws`

export function useNotifications() {
    const { token } = useAuthStore()
    const { play: playChime } = useNotificationSound()

    const [notifications, setNotifications] = useState<NotificationItem[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [totalCount, setTotalCount] = useState(0)
    const [initialLoading, setInitialLoading] = useState(false) // only first load
    const [hasFetched, setHasFetched] = useState(false)

    const wsRef = useRef<WebSocket | null>(null)
    const shouldReconnect = useRef(true)
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const lastUnread = useRef(0)
    const isFetching = useRef(false) // prevent concurrent fetches

    // ── Silent background list refresh (no spinner) ───────
    const silentRefresh = useCallback(async () => {
        if (!token || isFetching.current) return
        isFetching.current = true
        try {
            const d = await getNotifications(20, 0)
            setNotifications(d.notifications ?? [])
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
            const d = await getNotifications(20, 0)
            setNotifications(d.notifications ?? [])
            setHasFetched(true)
        } catch (err) {
            console.error("Failed to fetch notifications:", err)
        } finally {
            setInitialLoading(false)
            isFetching.current = false
        }
    }, [token, hasFetched])

    // ── WebSocket connect ─────────────────────────────────
    const connectWS = useCallback(() => {
        if (!token) return
        if (wsRef.current?.readyState === WebSocket.OPEN) return

        const ws = new WebSocket(WS_NOTIFICATIONS_URL)
        wsRef.current = ws

        ws.onopen = () => {
            // إرسال التوكن كأول رسالة للمصادقة (خلال 10 ثوان)
            ws.send(`auth:${token}`)
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
        markAsRead: handleMarkAsRead,
        markAllAsRead: handleMarkAllAsRead,
    }
}
