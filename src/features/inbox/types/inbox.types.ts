// ═══════════════════════════════════════════
//  Inbox Types — aligned with full API docs (2026-02-24)
// ═══════════════════════════════════════════

// ─── Enums ────────────────────────────────
export type SessionStatus = "open" | "closed" | "pending"
export type MessageDirection = "inbound" | "outbound" | "system" | "internal"
export type MessageType = "text" | "image" | "audio" | "video" | "document" | "interactive" | "comment" | "activity"
export type InboxFilter = "all" | "open" | "closed" | "pending"
export type MediaType = "image" | "document" | "audio" | "video"
export type MessageStatus = "received" | "sent" | "delivered" | "read" | "failed" | "notified"
export type SenderType = "customer" | "agent" | "ai" | "user" | "system"

// Activity event types
export type ActivityEventType =
    | "customer_assigned"
    | "teams_assigned"
    | "lifecycle_changed"
    | "conversation_closed"
    | "conversation_reopened"
    | "session_status_changed"

// ─── Pagination ───────────────────────────
export interface Pagination {
    totalCount: number
    totalPages: number
    currentPage?: number
    page?: number          // some endpoints use `page`
    pageSize: number
    hasNext: boolean
    hasPrevious: boolean
}

// ─── Customer (GET /inbox/customers) ──────
export interface CustomerAssignment {
    assigned_to: string | null
    assigned_to_username: string | null
    is_assigned: boolean
    updated_at?: string
}

export interface CustomerTeamIds {
    teams: string[]
    is_assigned_team: boolean
}

export interface CustomerLifecycle {
    code: string
    name: string
    icon?: string | null
}

export interface ConversationStatus {
    is_closed: boolean
    close_reason: string
    close_category: string
    closed_at: string
}

export interface Customer {
    id: string
    customer_id: string
    session_id?: string | null
    sender_name: string
    email?: string | null
    phone_number?: string | null
    platform: string
    platform_icon?: string
    profile_photo?: string
    username?: string
    assigned: CustomerAssignment | null
    assigned_to?: string | null
    team_ids: CustomerTeamIds | null
    session_status: SessionStatus
    lifecycle: CustomerLifecycle | null
    enable_ai: boolean
    conversation_status: ConversationStatus | null
    last_message: string | null
    last_direction?: MessageDirection
    last_message_type?: string
    last_message_status?: MessageStatus
    last_timestamp: string | null
    sender_type?: string
    unread_count: number
    isRead?: boolean
    favorite: boolean
    muted: boolean
    created_at: string
    updated_at?: string
    tenant_id?: string
}

// ─── Sidebar Summary ──────────────────────
export interface SidebarLifecycle { name: string; code: string; icon: string | null; count: number }
export interface SidebarTeam {
    _id?: string; team_id: string; name: string; description?: string
    icon?: string | null; members?: string[]; color?: string
    created_at?: string; updated_at?: string; customers?: string[]
    members_count?: number; customers_count?: number; assigned_count?: number
}
export interface SidebarSummary { all: number; mine: number; unassigned: number; lifecycles: SidebarLifecycle[]; teams: SidebarTeam[] }

// ─── Available Filters ────────────────────
export interface AvailableFilters {
    platforms: string[]; assigned_to: string[]; lifecycles: string[]; teams: string[]; tags: string[]
}

// ─── Message Content ──────────────────────
// Content varies by message_type
export interface MessageContent {
    // text / interactive
    text?: string

    // image / video / document — from API, content uses `url` field
    url?: string
    caption?: string
    file_size?: number | null
    mime_type?: string | null
    upload_status?: string   // "pending" | "completed" | "failed"
    original_url?: string | null
    upload_error?: string | null
    retry_count?: number
    last_retry?: string | null
    thumbnail_url?: string | null
    width?: number | null
    height?: number | null
    filename?: string

    // audio
    transcript?: string
    duration?: number | null

    // comment
    mentions?: string[]

    // activity
    event_type?: ActivityEventType
    metadata?: Record<string, any>

    // send-message payload fields (different from received)
    image_url?: string
    audio_url?: string
}

// ─── Message (from GET /inbox/customers/{id}/messages) ──
export interface MessageSenderInfo {
    name?: string
    profile_picture?: string | null
}

export interface Message {
    id?: string              // MongoDB ObjectId
    message_id?: string      // platform message id
    session_id?: string
    customer_id?: string
    platform?: string
    sender_id?: string
    sender_type?: SenderType
    sender_info?: MessageSenderInfo | null
    direction: MessageDirection
    message_type: MessageType
    content: MessageContent
    timestamp?: string
    status?: MessageStatus
    response_to?: string | null
    is_internal?: boolean
    isRead?: boolean
    created_at?: string
    updated_at?: string
    tenant_id?: string
    _key?: string            // virtual key for list rendering
}

// ─── Inline customer info in messages response ──
export interface MessagesCustomerInfo {
    customer_id: string
    sender_name: string
    platform: string
    profile_photo?: string
    username?: string
    enable_ai: boolean
    session_status: SessionStatus
    assigned?: { assigned_to: string | null; is_assigned: boolean }
}

// ─── API Responses ────────────────────────
export interface CustomersResponse {
    items: Customer[]
    count: number
    pagination: Pagination
    filters: AvailableFilters | null
}

export interface MessagesResponse {
    messages: Message[]
    pagination?: Pagination
    customer?: MessagesCustomerInfo
}

// ─── Payloads ─────────────────────────────
export interface SendMessagePayload {
    platform: string
    recipient_id: string
    sender_id: string
    responder: string
    original_msg_id?: string | null
    message_type: MessageType
    content: MessageContent
    sender_info: { name: string; profile_picture?: string | null }
}

// POST /media/upload
export interface MediaUploadResponse {
    media_id: string
    proxy_url: string
    public_url: string
    filename: string
    original_filename: string
    saved_filename: string
    file_size: number
}
