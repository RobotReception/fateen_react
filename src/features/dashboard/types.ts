/* ── Analytics Types ── */

export interface AnalyticsData {
    total_customers: number
    total_users: number
    total_messages: number
    total_channels: number
    total_teams: number
    total_tags: number
    total_departments: number
    total_categories: number
    total_agents: number
    total_lifecycles: number
    total_snippets: number
    total_menus: number
    total_dynamic_fields: number
    open_sessions: number
    closed_sessions: number
    assigned_customers: number
    unassigned_customers: number
    ai_enabled_customers: number
    platforms: Record<string, number>
}

export interface AnalyticsResponse {
    success: boolean
    message: string
    data: AnalyticsData
}
