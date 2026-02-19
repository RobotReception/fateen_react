import type { ApiResponse } from "../types"

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/backend/v2"

/* ─── auth helpers ─── */
function getToken(): string | null {
    return localStorage.getItem("access_token")
}

function authHeaders(tenantId?: string, lang = "ar"): Record<string, string> {
    const token = getToken()
    const h: Record<string, string> = { "Accept-Language": lang }
    if (token) h["Authorization"] = `Bearer ${token}`
    if (tenantId) h["X-Tenant-ID"] = tenantId
    return h
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const method = (options.method || "GET").toUpperCase()
    const hasBody = method !== "GET" && method !== "HEAD"

    const merged: Record<string, string> = {
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        ...(options.headers as Record<string, string> || {}),
    }

    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers: merged })
    const text = await res.text()

    let data: any
    try { data = JSON.parse(text) }
    catch { throw new Error(`Invalid JSON: ${res.status} ${text.slice(0, 100)}`) }

    if (!res.ok) {
        const err = new Error(data.message || `HTTP ${res.status}`) as any
        err.validationErrors = data.data?.validation_errors || null
        err.status = res.status
        throw err
    }
    return data as T
}

/* ─── Types ─── */
export interface AdminUser {
    user_id: string
    email: string
    tenant_id: string
    role: string
    full_name: string
    phone?: string
    profile_picture?: string
    created_at: string
    updated_at?: string
    is_active: boolean
}

export interface AdminUsersPagination {
    totalCount: number
    totalPages: number
    hasPrevious: boolean
    hasNext: boolean
    currentPage: number
    pageSize: number
}

export interface GetAllUsersParams {
    page?: number
    page_size?: number
    search?: string
    role?: string
    is_active?: boolean
    email?: string
    phone?: string
}

type GetAllUsersResponse = ApiResponse<{
    items: AdminUser[]
    pagination: AdminUsersPagination
}>

type UserBriefResponse = ApiResponse<AdminUser>

/* ─── Endpoints ─── */

/** GET /admin/get-all-users */
export function getAllUsers(
    params: GetAllUsersParams,
    tenantId: string
): Promise<GetAllUsersResponse> {
    const qs = new URLSearchParams()
    if (params.page) qs.set("page", String(params.page))
    if (params.page_size) qs.set("page_size", String(params.page_size))
    if (params.search) qs.set("search", params.search)
    if (params.role) qs.set("role", params.role)
    if (params.is_active !== undefined) qs.set("is_active", String(params.is_active))
    if (params.email) qs.set("email", params.email)
    if (params.phone) qs.set("phone", params.phone)

    const query = qs.toString() ? `?${qs.toString()}` : ""
    return apiFetch(`/admin/get-all-users${query}`, {
        headers: authHeaders(tenantId),
    })
}

/** GET /admin/brief/{user_id} */
export function getUserBrief(userId: string, tenantId: string): Promise<UserBriefResponse> {
    return apiFetch(`/admin/brief/${encodeURIComponent(userId)}`, {
        headers: authHeaders(tenantId),
    })
}
