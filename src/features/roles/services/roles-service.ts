import type {
    RolesListResponse,
    RoleCreatedResponse,
    RoleDeletedResponse,
    RolePermissionsResponse,
    PermissionsAddedResponse,
    PermissionsRemovedResponse,
    RolesByPermissionResponse,
    AssignRoleResponse,
    RemoveRoleResponse,
    UserRolesResponse,
    UsersWithRoleResponse,
    AllPermissionsResponse,
    CreateRolePayload,
    AssignRolePayload,
} from "../types"

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/backend/v2"

/* ─── auth helpers (same pattern as settings-service) ─── */

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

/* ============================================================
   ROLES API
   ============================================================ */

/** GET /roles/get-roles */
export function getRoles(tenantId: string): Promise<RolesListResponse> {
    return apiFetch("/roles/get-roles", { headers: authHeaders(tenantId) })
}

/** POST /roles/create-role */
export function createRole(payload: CreateRolePayload, tenantId: string): Promise<RoleCreatedResponse> {
    return apiFetch("/roles/create-role", {
        method: "POST",
        headers: authHeaders(tenantId),
        body: JSON.stringify(payload),
    })
}

/** DELETE /roles/delete-role/{role} */
export function deleteRole(role: string, tenantId: string): Promise<RoleDeletedResponse> {
    return apiFetch(`/roles/delete-role/${encodeURIComponent(role)}`, {
        method: "DELETE",
        headers: authHeaders(tenantId),
    })
}

/** GET /roles/get-role-permissions/{role} */
export function getRolePermissions(role: string, tenantId: string): Promise<RolePermissionsResponse> {
    return apiFetch(`/roles/get-role-permissions/${encodeURIComponent(role)}`, {
        headers: authHeaders(tenantId),
    })
}

/** POST /roles/add-role-permissions/{role} */
export function addRolePermissions(
    role: string, permissionIds: string[], tenantId: string
): Promise<PermissionsAddedResponse> {
    return apiFetch(`/roles/add-role-permissions/${encodeURIComponent(role)}`, {
        method: "POST",
        headers: authHeaders(tenantId),
        body: JSON.stringify({ permissions: permissionIds }),
    })
}

/** DELETE /roles/remove-role-permissions/{role} */
export function removeRolePermissions(
    role: string, permissionIds: string[], tenantId: string
): Promise<PermissionsRemovedResponse> {
    return apiFetch(`/roles/remove-role-permissions/${encodeURIComponent(role)}`, {
        method: "DELETE",
        headers: authHeaders(tenantId),
        body: JSON.stringify({ permissions: permissionIds }),
    })
}

/** GET /roles/get-roles-by-permission/{permission} */
export function getRolesByPermission(permission: string, tenantId: string): Promise<RolesByPermissionResponse> {
    return apiFetch(`/roles/get-roles-by-permission/${encodeURIComponent(permission)}`, {
        headers: authHeaders(tenantId),
    })
}

/** POST /roles/assign-role */
export function assignUserRole(payload: AssignRolePayload, tenantId: string): Promise<AssignRoleResponse> {
    return apiFetch("/roles/assign-role", {
        method: "POST",
        headers: authHeaders(tenantId),
        body: JSON.stringify(payload),
    })
}

/** DELETE /roles/remove-role */
export function removeUserRole(payload: AssignRolePayload, tenantId: string): Promise<RemoveRoleResponse> {
    return apiFetch("/roles/remove-role", {
        method: "DELETE",
        headers: authHeaders(tenantId),
        body: JSON.stringify(payload),
    })
}

/** GET /roles/get-user-roles/{user_id} */
export function getUserRoles(userId: string, tenantId: string): Promise<UserRolesResponse> {
    return apiFetch(`/roles/get-user-roles/${encodeURIComponent(userId)}`, {
        headers: authHeaders(tenantId),
    })
}

/** GET /roles/get-users-with-role/{role} */
export function getUsersWithRole(role: string, tenantId: string): Promise<UsersWithRoleResponse> {
    return apiFetch(`/roles/get-users-with-role/${encodeURIComponent(role)}`, {
        headers: authHeaders(tenantId),
    })
}

/** GET /permissions/get-permission-admin-permissions — all system permissions */
export function getAllPermissions(tenantId: string): Promise<AllPermissionsResponse> {
    return apiFetch("/permissions/get-permission-admin-permissions", {
        headers: authHeaders(tenantId),
    })
}
