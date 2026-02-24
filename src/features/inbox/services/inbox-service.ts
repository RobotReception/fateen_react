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
}) {
    const { data } = await apiClient.patch(`/customers/${customerId}/close-conversation`, payload)
    return data.data
}

// PATCH /customers/{id}/reopen-conversation
export async function reopenConversation(customerId: string, payload: {
    user_id: string
}) {
    const { data } = await apiClient.patch(`/customers/${customerId}/reopen-conversation`, payload)
    return data.data
}

// PATCH /customers/{id}/assign
export async function assignCustomerAgent(customerId: string, payload: {
    assigned_to: string | null; is_assigned: boolean; performed_by_name?: string
}) {
    const { data } = await apiClient.patch(`/customers/${customerId}/assign`, payload)
    return data.data
}

// PATCH /customers/{id}/lifecycle
export async function updateCustomerLifecycle(customerId: string, lifecycleCode: string) {
    const { data } = await apiClient.patch(`/customers/${customerId}/lifecycle`, {
        lifecycle_code: lifecycleCode,
    })
    return data.data
}

// PATCH /customers/{id}/enable-ai
export async function toggleCustomerAI(customerId: string, enableAi: boolean) {
    const { data } = await apiClient.patch(`/customers/${customerId}/enable-ai`, {
        enable_ai: enableAi,
    })
    return data.data
}

// PATCH /customers/{id}/session-status
export async function updateSessionStatus(customerId: string, sessionStatus: SessionStatus) {
    const { data } = await apiClient.patch(`/customers/${customerId}/session-status`, {
        session_status: sessionStatus,
    })
    return data.data
}

// POST /customers/{id}/teams
export async function assignCustomerTeams(customerId: string, teamIds: string[]) {
    const { data } = await apiClient.post(`/customers/${customerId}/teams`, {
        teams: teamIds, is_assigned_team: true,
    })
    return data.data
}

// DELETE /customers/{id}/teams
export async function removeCustomerTeams(customerId: string, teamIds: string[]) {
    const { data } = await apiClient.delete(`/customers/${customerId}/teams`, {
        data: { teams: teamIds },
    })
    return data.data
}
