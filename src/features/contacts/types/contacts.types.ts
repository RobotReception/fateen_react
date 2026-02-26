// ═══════════════════════════════════════════
//  Contacts Types — aligned with /contacts API (v2)
// ═══════════════════════════════════════════

export interface ContactAssignment {
    assigned_to: string | null
    assigned_to_username: string | null
    is_assigned: boolean
}

export interface ContactTeamIds {
    teams: string[]
    is_assigned_team: boolean
}

export interface ContactConversationStatus {
    is_closed: boolean
    close_reason: string
    close_category: string
    closed_at: string
}

export interface Contact {
    id: string
    customer_id: string
    session_id?: string | null
    is_contacts: boolean
    sender_name: string
    platform: string
    platform_icon?: string | null
    contact_fields: Record<string, string>
    custom_fields: Record<string, string>
    notes: string
    assigned: ContactAssignment | null
    team_ids: ContactTeamIds | null
    session_status: string
    lifecycle: string
    tags: string[]
    enable_ai: boolean
    platform_metadata?: Record<string, any>
    conversation_summary?: string
    conversation_opened_at?: string
    conversation_status: ContactConversationStatus | null
    last_message: string
    last_direction: string
    created_at: string
    updated_at: string
    last_timestamp: string
}

export interface ContactsPagination {
    totalCount: number
    totalPages: number
    hasPrevious: boolean
    hasNext: boolean
    currentPage: number
    pageSize: number
}

export interface ContactsResponse {
    contacts: Contact[]
    pagination: ContactsPagination
}

export interface ContactsQueryParams {
    skip?: number
    limit?: number
    search?: string
    platform?: string
    session_status?: string
    assigned_to?: string
    lifecycle?: string
    tags?: string
    enable_ai?: boolean
    conversation_status?: string
    sort_by?: string
    sort_order?: "asc" | "desc"
}

export interface UpdateContactPayload {
    sender_name?: string
    session_id?: string
    platform?: string
    platform_icon?: string
    contact_fields?: Record<string, string>
    custom_fields?: Record<string, string>
    notes?: string
    assigned?: { assigned_to: string | null; is_assigned: boolean }
    session_status?: string
    lifecycle?: string
    tags?: string[]
    enable_ai?: boolean
    conversation_summary?: string
    conversation_status?: { is_closed: boolean }
    last_message?: string
    last_direction?: string
}
