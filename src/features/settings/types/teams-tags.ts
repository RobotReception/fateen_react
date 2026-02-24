// ============================================================
// Types: Teams, Tags, Snippets, Lifecycles
// API: /api/backend/v2  — v3.0
// ============================================================

/* ── Shared wrapper ── */
export interface ApiResponse<T> {
    success: boolean
    message: string
    data: T
}

/* ── Shared pagination (GET /get_teams) ── */
export interface TeamsPagination {
    total: number
    page: number
    page_size: number
    total_pages: number
    has_next: boolean
    has_previous: boolean
}

/* ── Shared pagination (GET /customers-by-team) ── */
export interface CustomersPagination {
    current_page: number
    total_pages: number
    total_count: number
    page_size: number
    has_next: boolean
    has_prev: boolean
}

// Keep legacy alias so other files that import `Pagination` don't break
export type Pagination = TeamsPagination

/* ════════════════════════════════════
   TEAMS
════════════════════════════════════ */
export interface Team {
    id: string          // MongoDB _id
    team_id: string          // e.g. "team_3f8a2c01"
    name: string          // localised name
    name_ar?: string
    name_en?: string
    description?: string
    members?: string[]
    created_at?: string
    updated_at?: string
}

/* Statistics ── GET /teams/statistics */
export interface TeamStatRow {
    team_name: string
    customers_count: number
    members_count: number
}

export interface GeneralStatistics {
    total_customers: number
    assigned_customers: number
    unassigned_customers: number
    assignment_rate: number
}

export interface TeamStatisticsData {
    teams_statistics: TeamStatRow[]
    general_statistics: GeneralStatistics
}

/** @deprecated use TeamStatisticsData */
export type TeamStatistics = TeamStatisticsData

/* Paginated list ── GET /get_teams */
export interface TeamsListData {
    items: Team[]
    total: number
    page: number
    page_size: number
    total_pages: number
    has_next: boolean
    has_previous: boolean
}

/* Full list ── GET /teams */
export interface TeamListAllData {
    items: Team[]
    total: number
}

/* Payloads */
export interface CreateTeamPayload {
    name: string          // required
    name_ar?: string
    name_en?: string
    description?: string
    members?: string[]
    // NOTE: do NOT send team_id — generated server-side as "team_<8hex>"
}

export interface UpdateTeamPayload {
    name?: string
    name_ar?: string
    name_en?: string
    description?: string
}

export interface UpdateTeamMembersPayload {
    members: string[]             // replaces the full list
}

/* Assign customer ── PATCH /teams/assign-customer */
export interface AssignCustomerPayload {
    customer_id: string
    team_ids: string[]
}

export interface AssignCustomerResponse {
    customer_id: string
    teams: string[]
    is_assigned_team: boolean
    teams_updated: number
    invalid_teams: string[]
}

/* Assign customers bulk ── PATCH /teams/assign-customers-bulk */
export interface AssignCustomersBulkPayload {
    customer_ids: string[]
    team_ids: string[]
}

export interface AssignCustomersBulkResponse {
    updated_count: number
    team_ids: {
        teams: string[]
        is_assigned_team: boolean
    }
}

/* Customers by team ── GET /customers-by-team */
export interface CustomersByTeamParams {
    team_name: string
    is_assigned_team?: boolean
    page?: number
    page_size?: number
}

export interface CustomerByTeam {
    customer_id: string
    name: string
    phone: string
    is_assigned_team: boolean
}

export interface CustomersByTeamData {
    customers: CustomerByTeam[]
    pagination: CustomersPagination
    team_name: string
    is_assigned_team: boolean | null
}

/* ════════════════════════════════════
   TAGS
════════════════════════════════════ */
export interface Tag {
    id: string          // MongoDB _id
    tag_id?: string          // legacy field (may not be present)
    name: string          // localised name
    name_ar?: string
    name_en?: string
    emoji?: string
    description?: string
    category?: string
    source?: string
    created_by?: string
    created_at?: string
    last_edited_by?: string
    last_edited_at?: string
    // legacy compat
    updated_at?: string
}

/** Paginated response — GET /tags */
export interface TagsListData {
    items: Tag[]
    total: number
    page: number
    page_size: number
    total_pages: number
}

/** @deprecated use TagsListData (paginated) */
export interface TagsFlatData {
    tags: Tag[]
}

export interface CreateTagPayload {
    name: string          // required
    name_ar?: string
    name_en?: string
    emoji?: string          // max 8 bytes
    description?: string          // max 200 chars
    category?: string          // max 30 chars
    source?: string          // default: "User", max 30 chars
    // NOTE: do NOT send id — generated server-side
    // created_by injected from JWT
}

export interface UpdateTagPayload {
    name?: string          // max 50 chars
    name_ar?: string          // max 50 chars
    name_en?: string          // max 50 chars
    emoji?: string          // max 8 bytes
    description?: string          // max 200 chars
    category?: string          // max 30 chars
    source?: string          // max 30 chars
    // last_edited_by injected from JWT
}

/* ════════════════════════════════════
   SNIPPETS
════════════════════════════════════ */
export type SnippetMessageType = "text" | "image" | "audio" | "video" | "file" | "document"

export interface SnippetContent {
    // text
    text?: string
    // media
    url?: string
    caption?: string
    filename?: string
    size?: number
    mime_type?: string
    // audio/video extras
    duration?: number
    transcript?: string
    // any other keys
    [key: string]: unknown
}

export interface Snippet {
    id: string          // MongoDB _id
    field_id: string          // e.g. "snip_193a8ce7" (auto-generated)
    name: string
    title?: string          // localised title
    title_ar?: string
    title_en?: string
    topic?: string
    created_by?: string
    message_type: SnippetMessageType
    content?: SnippetContent
    content_ar?: string          // localised text shorthand
    content_en?: string
    created_at?: string
    updated_at?: string
    // legacy compat
    message?: string
}

/** Paginated list — GET /snippets */
export interface SnippetsListData {
    items: Snippet[]
    total: number
}

export interface CreateSnippetPayload {
    name: string              // required
    title_ar?: string
    title_en?: string
    message_type: SnippetMessageType  // required
    content: SnippetContent      // required, shape depends on message_type
    content_ar?: string
    content_en?: string
    topic?: string
    // NOTE: do NOT send field_id — server generates "snip_<8hex>"
    // created_by injected from JWT
}

export interface UpdateSnippetPayload {
    name?: string
    title_ar?: string
    title_en?: string
    message_type?: SnippetMessageType
    content?: SnippetContent
    content_ar?: string
    content_en?: string
    topic?: string
}

/* Media Upload — POST /media/upload */
export interface MediaUploadResponse {
    media_id: string
    proxy_url: string
    public_url: string
    filename: string
    original_filename: string
    saved_filename: string
    file_size: number
}


/* ════════════════════════════════════
   LIFECYCLES
════════════════════════════════════ */
export interface Lifecycle {
    id: string          // MongoDB _id
    code: string          // e.g. "lc_c384f0ab" (auto-generated)
    name: string          // localised name
    name_ar?: string
    name_en?: string
    description?: string          // localised description
    description_ar?: string
    description_en?: string
    icon?: string
    color?: string          // HEX, e.g. "#53b1df"
    order?: number
    is_active?: boolean
    created_at?: string
    updated_at?: string
}

/** Full list — GET /lifecycles */
export interface LifecyclesListData {
    items: Lifecycle[]
    total: number
}

export interface CreateLifecyclePayload {
    name: string          // required
    name_ar?: string
    name_en?: string
    description?: string
    description_ar?: string
    description_en?: string
    icon?: string          // default: ""
    color?: string          // HEX, default: "#53b1df"
    order?: number          // default: 1
    // NOTE: do NOT send code — generated server-side as "lc_<8hex>"
}

export interface UpdateLifecyclePayload {
    name?: string
    name_ar?: string
    name_en?: string
    description?: string
    description_ar?: string
    description_en?: string
    icon?: string
    color?: string          // must start with # and be 7 chars
    order?: number
    is_active?: boolean
}

/** DELETE /lifecycles/{code} uses query param */
export interface DeleteLifecycleParams {
    reassign_to?: string            // code of fallback lifecycle
}

/** PATCH /lifecycles/customers/{customer_id}/lifecycle */
export interface ChangeCustomerLifecyclePayload {
    lifecycle_code: string          // required
    performed_by?: string          // injected from JWT if omitted
}

export interface ChangeCustomerLifecycleResponse {
    success: boolean
    customer_id: string
    new_lifecycle: string
}
