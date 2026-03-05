import { apiClient } from "@/lib/api-client"
import type {
    SidebarSummary,
    CustomersResponse,
    MessagesResponse,
    SendMessagePayload,
    MediaUploadResponse,
    SessionStatus,
} from "../types/inbox.types"

// ─── Sidebar Summary ────────────────────────────────────
// GET /inbox/sidebar-summary
export async function getSidebarSummary(userId?: string): Promise<SidebarSummary> {
    const { data } = await apiClient.get("/inbox/sidebar-summary", {
        params: userId ? { user_id: userId } : undefined,
    })
    return data.data
}

// ─── Accounts List ──────────────────────────────────────
// GET /customers/accounts
export interface AccountInfo {
    account_id: string
    platform: string
    customer_count: number
    last_activity: string
}

export interface AccountsResponse {
    total_accounts: number
    total_customers: number
    platforms_summary: Record<string, { accounts: number; customers: number }>
    accounts: AccountInfo[]
}

export async function getAccounts(platform?: string): Promise<AccountsResponse> {
    const { data } = await apiClient.get("/customers/accounts", {
        params: platform ? { platform } : undefined,
    })
    return data.data
}

// ─── Customers (unified list) ───────────────────────────
// GET /inbox/customers
export async function getCustomers(params?: {
    page?: number
    page_size?: number
    platform?: string
    lifecycle?: string
    assigned_to?: string
    session_status?: SessionStatus
    account_id?: string
    team_id?: string
    is_assigned_team?: string
    is_assigned?: string
    enable_ai_q?: string
    start_date?: string
    end_date?: string
    unread_only?: boolean
    is_open?: boolean
    favorite?: boolean
    muted?: boolean
    search?: string
    include_filters?: boolean
}): Promise<CustomersResponse> {
    const { data } = await apiClient.get("/inbox/customers", { params })
    return data.data
}

// ─── Messages ───────────────────────────────────────────
// GET /inbox/customers/{customer_id}/messages
export async function getCustomerMessages(customerId: string, params?: {
    page?: number
    page_size?: number
    account_id?: string
}): Promise<MessagesResponse> {
    const { data } = await apiClient.get(`/inbox/customers/${customerId}/messages`, { params })
    return data.data
}

// ─── Send Message ───────────────────────────────────────
// POST /inbox/send-message
export async function sendMessage(payload: SendMessagePayload) {
    const { data } = await apiClient.post("/inbox/send-message", payload)
    return data.data
}

// ─── Add Comment (internal) ─────────────────────────────
// POST /inbox/comments
export async function addComment(payload: {
    customer_id: string
    session_id: string
    platform: string
    sender_id: string
    sender_type?: string
    sender_info: { name: string; profile_picture?: string | null }
    content: { text: string; mentions?: string[] }
}) {
    const { data } = await apiClient.post("/inbox/comments", payload)
    return data.data
}

// ─── Media Upload ───────────────────────────────────────
// POST /media/upload
export async function uploadMedia(file: File, options?: {
    platform?: string
    owner_type?: string
    source?: string
    tags?: string
}): Promise<MediaUploadResponse> {
    const form = new FormData()
    form.append("file", file, file.name)
    form.append("platform", options?.platform ?? "whatsapp")
    if (options?.owner_type) form.append("owner_type", options.owner_type)
    form.append("source", options?.source ?? "user_upload")
    if (options?.tags) form.append("tags", options.tags)
    const { data } = await apiClient.post("/media/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
    })
    return data.data
}

// ─── Customer Actions ───────────────────────────────────

// PATCH /customers/{id}/close-conversation
export async function closeConversation(customerId: string, payload: {
    reason: string; category: string; lang?: string
}, accountId?: string) {
    const { data } = await apiClient.patch(`/customers/${customerId}/close-conversation`, payload, {
        params: accountId ? { account_id: accountId } : undefined,
    })
    return data.data
}

// PATCH /customers/{id}/reopen-conversation
export async function reopenConversation(customerId: string, payload: {
    user_id: string
}, accountId?: string) {
    const { data } = await apiClient.patch(`/customers/${customerId}/reopen-conversation`, payload, {
        params: accountId ? { account_id: accountId } : undefined,
    })
    return data.data
}

// PATCH /customers/{id}/assign
export async function assignCustomerAgent(customerId: string, payload: {
    assigned_to: string | null; is_assigned: boolean; performed_by_name?: string
}, accountId?: string) {
    const { data } = await apiClient.patch(`/customers/${customerId}/assign`, payload, {
        params: accountId ? { account_id: accountId } : undefined,
    })
    return data.data
}

// PATCH /customers/{id}/lifecycle
export async function updateCustomerLifecycle(customerId: string, lifecycleCode: string, accountId?: string) {
    const { data } = await apiClient.patch(`/customers/${customerId}/lifecycle`, {
        lifecycle_code: lifecycleCode,
    }, {
        params: accountId ? { account_id: accountId } : undefined,
    })
    return data.data
}

// PATCH /customers/{id}/enable-ai  (account_id في الـ Body — الاستثناء الوحيد)
export async function toggleCustomerAI(customerId: string, enableAi: boolean, accountId?: string) {
    const { data } = await apiClient.patch(`/customers/${customerId}/enable-ai`, {
        enable_ai: enableAi,
        ...(accountId && { account_id: accountId }),
    })
    return data.data
}

// PATCH /customers/{id}/favorite
export async function toggleFavorite(customerId: string, favorite: boolean, accountId?: string) {
    const { data } = await apiClient.patch(
        `/customers/${customerId}/favorite`,
        { favorite },
        { params: accountId ? { account_id: accountId } : undefined },
    )
    return data.data
}

// PATCH /customers/{id}/mute
export async function toggleMuted(customerId: string, muted: boolean, accountId?: string) {
    const { data } = await apiClient.patch(
        `/customers/${customerId}/mute`,
        { muted },
        { params: accountId ? { account_id: accountId } : undefined },
    )
    return data.data
}

// PATCH /customers/{id}/session-status
export async function updateSessionStatus(customerId: string, sessionStatus: SessionStatus, accountId?: string) {
    const { data } = await apiClient.patch(`/customers/${customerId}/session-status`, {
        session_status: sessionStatus,
    }, {
        params: accountId ? { account_id: accountId } : undefined,
    })
    return data.data
}

// PUT /customers/{id}/teams — assign teams
export async function assignCustomerTeams(customerId: string, teamIds: string[], accountId?: string) {
    const { data } = await apiClient.put(`/customers/${customerId}/teams`, {
        teams: teamIds,
        is_assigned_team: true,
    }, {
        params: accountId ? { account_id: accountId } : undefined,
    })
    return data.data
}

// DELETE /customers/{id}/teams — remove teams
export async function removeCustomerTeams(customerId: string, teamIds: string[], accountId?: string) {
    const { data } = await apiClient.delete(`/customers/${customerId}/teams`, {
        data: { teams: teamIds },
        params: accountId ? { account_id: accountId } : undefined,
    })
    return data.data
}

// GET /customers/{id}/teams — fetch customer teams
export async function getCustomerTeams(customerId: string, accountId?: string) {
    const { data } = await apiClient.get(`/customers/${customerId}/teams`, {
        params: accountId ? { account_id: accountId } : undefined,
    })
    return data.data
}

// POST /customers/{id}/tags
export async function addCustomerTags(customerId: string, tags: string[], accountId?: string) {
    const { data } = await apiClient.post(`/customers/${customerId}/tags`, { tags }, {
        params: accountId ? { account_id: accountId } : undefined,
    })
    return data.data
}

// DELETE /customers/{id}/tags
export async function removeCustomerTags(customerId: string, tags: string[], accountId?: string) {
    const { data } = await apiClient.delete(`/customers/${customerId}/tags`, {
        data: { tags },
        params: accountId ? { account_id: accountId } : undefined,
    })
    return data.data
}

// ─── New Endpoints ──────────────────────────────────────

// GET /customers/{id}/basic-info
export async function getCustomerBasicInfo(customerId: string, accountId?: string) {
    const { data } = await apiClient.get(`/customers/${customerId}/basic-info`, {
        params: accountId ? { account_id: accountId } : undefined,
    })
    return data.data
}

// GET /customers/{id}/ai-check
export async function getCustomerAICheck(customerId: string, accountId?: string) {
    const { data } = await apiClient.get(`/customers/${customerId}/ai-check`, {
        params: accountId ? { account_id: accountId } : undefined,
    })
    return data.data
}

// PUT /contacts/{id}/custom-fields — Smart Update (updates only existing fields)
export async function updateContactCustomFields(customerId: string, customFields: Record<string, string>) {
    const { data } = await apiClient.put(`/contacts/${customerId}/custom-fields`, {
        custom_fields: customFields,
    })
    return data
}

// ─── Brief Users (for assign dropdown) ──────────────────
// GET /backend/v2/admin/brief
export interface BriefUser {
    user_id: string
    name: string
    profile_picture: string
}

export async function getBriefUsers(page = 1, pageSize = 50): Promise<{
    users: BriefUser[]
    pagination: { totalCount: number; totalPages: number; currentPage: number }
}> {
    const { data } = await apiClient.get("/admin/brief", {
        params: { page, page_size: pageSize },
    })
    return data.data
}

// ─── Session Activity ────────────────────────────────────

export interface ActivityEvent {
    event_id?: string
    event_type: string
    timestamp: string
    // Real API uses a flat `metadata` object with all details
    metadata: Record<string, unknown>
}

export interface SessionActivityResponse {
    success: boolean
    lookup_by: string
    session_id?: string
    customer_id?: string
    total_events: number
    source: string
    events: ActivityEvent[]
}

// GET /activity?session_id={sessionId}
export async function getSessionActivity(sessionId: string): Promise<SessionActivityResponse> {
    const { data } = await apiClient.get("/activity", {
        params: { session_id: sessionId },
    })
    return data
}
