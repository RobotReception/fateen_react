import { apiClient } from "@/lib/api-client"

/* ═══════════════════════════════════════════════════════════ */
/*   Notification Service — /api/backend/v2/notifications      */
/*   Auth: Authorization: Bearer JWT_TOKEN (via apiClient)     */
/* ═══════════════════════════════════════════════════════════ */

// ── Types ─────────────────────────────────────────────────
export interface NotificationItem {
    id: string
    user_id: string
    title: string
    body: string
    data: { type?: string;[key: string]: string | undefined } | null
    status: string
    is_read: boolean
    created_at: string
}

export interface NotificationsListResponse {
    notifications: NotificationItem[]
    total: number
    limit: number
    offset: number
}

export interface NotificationCount {
    user_id: string
    total: number
    unread: number
}

// ── 2. جلب الإشعارات ─────────────────────────────────────
// GET /notifications?limit=20&offset=0
export async function getNotifications(
    limit = 20,
    offset = 0
): Promise<NotificationsListResponse> {
    const { data } = await apiClient.get("/notifications", {
        params: { limit, offset },
    })
    return data.data
}

// ── 3. تحديد إشعار كمقروء ─────────────────────────────
// POST /notifications/{id}/mark-read  (no body)
export async function markNotificationRead(notificationId: string) {
    const { data } = await apiClient.post(
        `/notifications/${notificationId}/mark-read`
    )
    return data.data
}

// ── 4. تحديد جميع الإشعارات كمقروءة ──────────────────
// POST /notifications/mark-all-read  (no body)
export async function markAllNotificationsRead() {
    const { data } = await apiClient.post("/notifications/mark-all-read")
    return data.data
}

// ── 5. عداد الإشعارات (HTTP Polling fallback) ─────────
// GET /notifications/count
export async function getNotificationCount(): Promise<NotificationCount> {
    const { data } = await apiClient.get("/notifications/count")
    return data.data
}
