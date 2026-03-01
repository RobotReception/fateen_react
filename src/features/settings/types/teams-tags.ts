// ============================================================
// Types: Teams + backward-compatible re-exports
// API: /api/backend/v2  — v3.0
// ============================================================

// ── Backward-compatible re-exports ──
// These allow existing "import ... from 'teams-tags'" to keep working
export type { Tag, TagsListData, TagsFlatData, CreateTagPayload, UpdateTagPayload } from "./tags.types"
export type { Snippet, SnippetContent, SnippetMessageType, SnippetsListData, CreateSnippetPayload, UpdateSnippetPayload, MediaUploadResponse } from "./snippets.types"
export type { Lifecycle, LifecyclesListData, CreateLifecyclePayload, UpdateLifecyclePayload, DeleteLifecycleParams, ChangeCustomerLifecyclePayload, ChangeCustomerLifecycleResponse } from "./lifecycles.types"
export type { DynamicField, DynamicFieldType, DynamicFieldsListData, CreateDynamicFieldPayload, UpdateDynamicFieldPayload } from "./contact-fields.types"

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
    is_active?: boolean          // soft-delete flag
    deactivated_at?: string      // timestamp when deactivated
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

/* Cache View ── GET /teams/cache-view */
export interface CacheViewTeam {
    team_id: string
    name: string
}

export interface CacheViewData {
    teams: CacheViewTeam[]
    count: number
    source: string      // "db" | "cache"
}

/* Team Members ── GET /teams/{team_id}/members */
export interface TeamMemberDetail {
    user_id: string
    email: string
    full_name: string
    phone: string
    profile_picture: string
    role: string
    is_active: boolean
}

export interface TeamMembersResponse {
    success: boolean
    team_id: string
    team_name: string
    members: TeamMemberDetail[]
    total_members: number
}
