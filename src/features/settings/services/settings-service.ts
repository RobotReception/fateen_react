import type {
    OrganizationResponse,
    UpdateOrganizationPayload,
    UserProfileResponse,
    UpdateUserProfilePayload,
} from "../types"

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/backend/v2"

/** Get current access token from localStorage */
function getToken(): string | null {
    return localStorage.getItem("access_token")
}

/** Build standard auth headers */
function authHeaders(tenantId?: string, lang = "ar"): Record<string, string> {
    const token = getToken()
    const headers: Record<string, string> = {
        "Accept-Language": lang,
    }
    if (token) headers["Authorization"] = `Bearer ${token}`
    if (tenantId) headers["X-Tenant-ID"] = tenantId
    return headers
}

/** Generic fetch helper with error handling */
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const method = (options.method || "GET").toUpperCase()
    const hasBody = method !== "GET" && method !== "HEAD"

    const mergedHeaders: Record<string, string> = {
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        ...(options.headers as Record<string, string> || {}),
    }

    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: mergedHeaders,
    })

    const text = await res.text()

    let data: any
    try {
        data = JSON.parse(text)
    } catch {
        throw new Error(`Invalid JSON response: ${res.status} ${text.slice(0, 100)}`)
    }

    if (!res.ok) {
        const err = new Error(data.message || `HTTP ${res.status}`) as any
        err.validationErrors = data.data?.validation_errors || null
        err.status = res.status
        throw err
    }
    return data as T
}

/* ============================================================
   ORGANIZATION API
   ============================================================ */

/** GET /organization — full organization details */
export async function getOrganization(
    tenantId: string
): Promise<OrganizationResponse> {
    return apiFetch<OrganizationResponse>("/organization", {
        headers: authHeaders(tenantId),
    })
}

/** PATCH /organization — partial update */
export async function updateOrganization(
    payload: UpdateOrganizationPayload,
    tenantId: string
): Promise<OrganizationResponse> {
    return apiFetch<OrganizationResponse>("/organization", {
        method: "PATCH",
        headers: authHeaders(tenantId),
        body: JSON.stringify(payload),
    })
}

/* ============================================================
   USER PROFILE API  (/admin/me)
   ============================================================ */

/** GET /admin/me — current user profile */
export async function getUserProfile(tenantId: string): Promise<UserProfileResponse> {
    return apiFetch<UserProfileResponse>("/admin/me", {
        headers: authHeaders(tenantId),
    })
}

/** PATCH /admin/update-user — update user profile */
export async function updateUserProfile(
    payload: UpdateUserProfilePayload,
    tenantId: string
): Promise<UserProfileResponse> {
    return apiFetch<UserProfileResponse>("/admin/update-user", {
        method: "PUT",
        headers: authHeaders(tenantId),
        body: JSON.stringify(payload),
    })
}
