// ─── Notification Item ──────────────────────────────────
export interface NotificationItem {
    id: string
    user_id: string
    title: string
    body: string
    data: Record<string, string> | null
    status: "sent" | "delivered" | "failed"
    is_read: boolean
    created_at: string
}

// ─── API Responses ──────────────────────────────────────
export interface NotificationsResponse {
    notifications: NotificationItem[]
    total: number
    limit: number
    offset: number
}

export interface DeviceInfo {
    user_id: string
    device_token: string
    device_type: "web" | "android" | "ios"
    device_name: string
    created_at: string
}

export interface DeviceRegistrationPayload {
    device_token: string
    device_type?: "web" | "android" | "ios"
    device_name?: string
}

export interface SendNotificationPayload {
    user_id: string
    title: string
    body: string
    data?: Record<string, string>
}

export interface BroadcastPayload {
    user_ids: string[]
    title: string
    body: string
    data?: Record<string, string>
}

// ─── Notification type icons ────────────────────────────
export type NotificationType =
    | "order_created"
    | "order_updated"
    | "message"
    | "security_alert"
    | "system_update"
    | "announcement"
    | "reminder"
    | "assignment"
    | "test"
    | string
