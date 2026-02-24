// ============================================================
// Channels Types — synced with Channels API v1.0 (Feb 2026)
// ============================================================

// ── Supported Platforms ──
export type Platform = "facebook" | "instagram" | "whatsapp" | "appchat" | "webchat"
export const PLATFORMS: Platform[] = ["facebook", "instagram", "whatsapp", "appchat", "webchat"]

// ── Platform display metadata ──
export interface PlatformInfo {
    id: Platform
    label: string
    labelAr: string
    icon: string
    color: string
    description: string
}

export const PLATFORM_META: Record<Platform, PlatformInfo> = {
    whatsapp: { id: "whatsapp", label: "WhatsApp", labelAr: "واتساب", icon: "💬", color: "#25D366", description: "أرسل واستقبل رسائل عبر واتساب للأعمال" },
    facebook: { id: "facebook", label: "Facebook", labelAr: "فيسبوك", icon: "📘", color: "#1877F2", description: "إدارة رسائل صفحة فيسبوك الخاصة بك" },
    instagram: { id: "instagram", label: "Instagram", labelAr: "انستقرام", icon: "📸", color: "#E4405F", description: "ردّ على الرسائل الخاصة في انستقرام" },
    appchat: { id: "appchat", label: "App Chat", labelAr: "دردشة التطبيق", icon: "📱", color: "#6366F1", description: "دردشة مباشرة داخل تطبيقك الخاص" },
    webchat: { id: "webchat", label: "Web Chat", labelAr: "دردشة الويب", icon: "🌐", color: "#0EA5E9", description: "ويدجت دردشة تضمّها في موقعك" },
}

// ── Communication flags structure ──
export interface CommunicationFlags {
    inherit: boolean
    overrides: {
        message_types?: Record<string, boolean>
        response_types?: Record<string, boolean>
        response_capabilities?: Record<string, { enabled: boolean }>
    }
}

// ── Core Channel entity ──
export interface Channel {
    id?: string
    platform: Platform
    identifier: string
    tenant_id: string
    name?: string
    enabled?: boolean
    agent_ids?: string[]
    created_at?: string
    updated_at?: string
    // Platform-specific
    page_id?: string
    ig_account_id?: string
    phone_number_id?: string
    waba_id?: string
    app_id?: string
    site_id?: string          // webchat (identifier alias, read-only)
    access_token?: string
    META_APP_SECRET?: string
    allowed_origins?: string[]
    icon?: string
    color?: string
    script_url?: string       // webchat — auto-generated, read-only
    departments?: string[]
    categories?: string[]
    communication_flags?: CommunicationFlags
    extra_data?: Record<string, unknown>
}

// ── Generic API wrapper ──
export interface ApiResponse<T> {
    success: boolean
    data: T
    message: string
}

// ── List / detail / delete responses ──
export interface ChannelListData {
    items: Channel[]
    count: number
    platform: Platform
    tenant_id: string
}
export type ChannelListResponse = ApiResponse<ChannelListData>
export type ChannelDetailResponse = ApiResponse<Channel>
export type ChannelDeleteResponse = ApiResponse<null>

// ── Platform toggle response (endpoint 6) ──
export interface PlatformToggleData {
    platform: Platform
    enabled: boolean
    affected_channels: number
}
export type PlatformToggleResponse = ApiResponse<PlatformToggleData>

// ── Channel toggle response (endpoint 7) ──
export interface ChannelToggleData {
    platform: Platform
    identifier: string
    enabled: boolean
}
export type ChannelToggleResponse = ApiResponse<ChannelToggleData>

// ── Flags (endpoints 8 & 9) ──
export interface FlagsSection {
    message_types?: Record<string, boolean>
    response_types?: Record<string, boolean>
    response_capabilities?: Record<string, { enabled: boolean }>
}

export interface ChannelFlagsData {
    platform: Platform
    identifier: string
    tenant_id: string
    communication_flags: CommunicationFlags
    global_flags: FlagsSection
    effective_flags: FlagsSection
}
export type ChannelFlagsResponse = ApiResponse<ChannelFlagsData>

export interface UpdateFlagsPayload {
    inherit: boolean
    overrides?: CommunicationFlags["overrides"]
}

// ── /data/flags response (endpoint 10) ──
export interface DataFlagsData {
    communication_flags: CommunicationFlags
    global_flags: FlagsSection
    effective_flags: FlagsSection
}
export type DataFlagsResponse = ApiResponse<DataFlagsData>

// ── /data/flags/platforms response (endpoint 11) ──
export interface PlatformsStatusData {
    platforms: Record<Platform, boolean>
    enabled_platforms: Platform[]
    total_platforms: number
    enabled_count: number
}
export type PlatformsStatusResponse = ApiResponse<PlatformsStatusData>

// ── Create payloads ──
export interface CreateWhatsAppPayload {
    phone_number_id: string
    waba_id: string
    access_token: string
    META_APP_SECRET: string
    name?: string
    agent_ids?: string[]
}
export interface CreateFacebookPayload {
    page_id: string
    access_token: string
    META_APP_SECRET: string
    name?: string
    agent_ids?: string[]
}
export interface CreateInstagramPayload {
    page_id: string
    access_token: string
    META_APP_SECRET: string
    name?: string
    ig_account_id?: string
    agent_ids?: string[]
}
export interface CreateAppChatPayload {
    app_id: string
    allowed_origins: string[]
    name?: string
    agent_ids?: string[]
}
export interface CreateWebChatPayload {
    // no site_id — it's auto-generated by the API
    allowed_origins: string[]
    name?: string
    icon?: string
    color?: string
    agent_ids?: string[]
}

export type CreateChannelPayload =
    | CreateWhatsAppPayload
    | CreateFacebookPayload
    | CreateInstagramPayload
    | CreateAppChatPayload
    | CreateWebChatPayload

// ── Update payload — all fields optional (PATCH) ──
export interface UpdateChannelPayload {
    name?: string
    access_token?: string
    page_id?: string
    phone_number_id?: string
    waba_id?: string
    app_id?: string
    META_APP_SECRET?: string
    ig_account_id?: string
    allowed_origins?: string[]
    icon?: string
    color?: string
    agent_ids?: string[]
}

// ── Toggle payload ──
export interface TogglePayload {
    enabled: boolean
}
