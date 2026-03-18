import { useAuthStore } from "@/stores/auth-store"

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/backend/v2"

function getToken(): string | null {
    return useAuthStore.getState().token
}

function authHeaders(tenantId?: string): Record<string, string> {
    const token = getToken()
    const headers: Record<string, string> = { "Accept-Language": "ar" }
    if (token) headers["Authorization"] = `Bearer ${token}`
    if (tenantId) headers["X-Tenant-ID"] = tenantId
    return headers
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        credentials: "include",
    })
    const text = await res.text()
    let data: any
    try { data = JSON.parse(text) } catch { throw new Error(`Invalid JSON: ${res.status}`) }
    if (!res.ok) {
        const err = new Error(data.message || `HTTP ${res.status}`) as any
        err.status = res.status
        throw err
    }
    return data as T
}

/* ── Types ── */

export interface AuditLogEntry {
    id: string
    user_id: string | null
    username: string | null
    role: string | null
    action: string
    status: string
    ip: string | null
    user_agent: string | null
    endpoint: string | null
    tenant_id: string | null
    details: Record<string, any> | null
    timestamp: string
    ts_epoch: number
}

export interface AuditLogsPagination {
    totalCount: number
    totalPages: number
    currentPage: number
    pageSize: number
    hasNext: boolean
    hasPrevious: boolean
}

export interface AuditLogsListResponse {
    success: boolean
    data: {
        pagination: AuditLogsPagination
        logs: AuditLogEntry[]
    }
    message: string
}

export interface AuditLogDetailResponse {
    success: boolean
    data: { log: AuditLogEntry }
    message: string
}

export interface AuditLogsFilters {
    page?: number
    page_size?: number
    username?: string
    action?: string
    status?: string
    ip?: string
    endpoint?: string
    date_from?: string
    date_to?: string
}

/* ── API calls ── */

export async function getAuditLogs(
    tenantId: string,
    filters: AuditLogsFilters = {},
): Promise<AuditLogsListResponse> {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") params.set(k, String(v))
    })
    const qs = params.toString()
    return apiFetch<AuditLogsListResponse>(`/audit-logs/list${qs ? `?${qs}` : ""}`, {
        headers: authHeaders(tenantId),
    })
}

export async function getAuditLogDetail(
    tenantId: string,
    logId: string,
): Promise<AuditLogDetailResponse> {
    return apiFetch<AuditLogDetailResponse>(`/audit-logs/details/${logId}`, {
        headers: authHeaders(tenantId),
    })
}
