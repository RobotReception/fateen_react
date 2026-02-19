import apiClient from "@/lib/api-client"
import type {
    AdminUser,
    GetAllUsersResponse,
    CreateUserPayload,
    CreateUserResponse,
    UpdateUserPayload,
    UpdateUserResponse,
    DeleteUserPayload,
    DeleteUserResponse,
    UpdateUserStatusPayload,
    UpdateUserStatusResponse,
    UserBriefResponse,
    GetSessionInfoResponse,
    GetUserSessionsResponse,
    RevokeSessionPayload,
    RevokeSessionResponse,
    RevokeMultipleSessionsPayload,
    RevokeMultipleSessionsResponse,
    RevokeAllSessionsResponse,
    AdminSetPasswordPayload,
    AdminSetPasswordResponse,
    GetRolesResponse,
    AssignRolePayload,
    AssignRoleResponse,
    MeResponse,
} from "../types"

// Re-export AdminUser for convenience
export type { AdminUser }

// ── Helper: get tenant headers ──
function tenantHeaders(tenantId: string) {
    return { "X-Tenant-ID": tenantId }
}

/* ============================================================
   ADMIN USER MANAGEMENT API
   ============================================================ */

// ── Query Params interface for listing ──
export interface GetAllUsersParams {
    page?: number
    page_size?: number
    search?: string
    role?: string
    is_active?: boolean
    email?: string
    phone?: string
    created_from?: string
    created_to?: string
}

/** 1️⃣ GET /admin/get-all-users — fetch users with pagination */
export async function getAllUsers(
    params: GetAllUsersParams,
    tenantId: string
): Promise<GetAllUsersResponse> {
    const { data } = await apiClient.get("/admin/get-all-users", {
        params,
        headers: tenantHeaders(tenantId),
    })
    return data
}

/** 6️⃣ GET /admin/brief/{user_id} — get detailed user info */
export async function getUserBrief(
    userId: string,
    tenantId: string
): Promise<UserBriefResponse> {
    const { data } = await apiClient.get(`/admin/brief/${encodeURIComponent(userId)}`, {
        headers: tenantHeaders(tenantId),
    })
    return data
}

/** GET /admin/me — get current admin user info */
export async function getCurrentUser(
    tenantId: string
): Promise<UserBriefResponse> {
    const { data } = await apiClient.get("/admin/me", {
        headers: tenantHeaders(tenantId),
    })
    return data
}

/** 2️⃣ POST /admin/create-user — add a new user */
export async function createUser(
    payload: CreateUserPayload,
    tenantId: string
): Promise<CreateUserResponse> {
    const { data } = await apiClient.post<CreateUserResponse>(
        "/admin/create-user",
        payload,
        { headers: tenantHeaders(tenantId) }
    )
    return data
}

/** 3️⃣ PUT /admin/update-user — update user info */
export async function updateUser(
    payload: UpdateUserPayload,
    tenantId: string
): Promise<UpdateUserResponse> {
    const { data } = await apiClient.put<UpdateUserResponse>(
        "/admin/update-user",
        payload,
        { headers: tenantHeaders(tenantId) }
    )
    return data
}

/** 4️⃣ DELETE /admin/delete-user — permanently delete a user */
export async function deleteUser(
    payload: DeleteUserPayload,
    tenantId: string
): Promise<DeleteUserResponse> {
    const { data } = await apiClient.delete<DeleteUserResponse>(
        "/admin/delete-user",
        {
            data: payload,
            headers: tenantHeaders(tenantId),
        }
    )
    return data
}

/** 5️⃣ PATCH /admin/update-user-status — toggle active/inactive */
export async function updateUserStatus(
    payload: UpdateUserStatusPayload,
    tenantId: string
): Promise<UpdateUserStatusResponse> {
    const { data } = await apiClient.patch<UpdateUserStatusResponse>(
        "/admin/update-user-status",
        payload,
        { headers: tenantHeaders(tenantId) }
    )
    return data
}

/* ============================================================
   SESSION MANAGEMENT
   ============================================================ */

/** 7️⃣ GET /admin/get-session-info — get single session details */
export async function getSessionInfo(
    sessionHandle: string,
    tenantId: string
): Promise<GetSessionInfoResponse> {
    const { data } = await apiClient.get("/admin/get-session-info", {
        params: { session_handle: sessionHandle },
        headers: tenantHeaders(tenantId),
    })
    return data
}

/** 8️⃣ GET /admin/get-all-session-handles-for-user — get all sessions */
export async function getUserSessions(
    userId: string,
    tenantId: string
): Promise<GetUserSessionsResponse> {
    const { data } = await apiClient.get("/admin/get-all-session-handles-for-user", {
        params: { user_id: userId },
        headers: tenantHeaders(tenantId),
    })
    return data
}

/** 9️⃣ POST /admin/revoke-user-session — revoke one session */
export async function revokeSession(
    payload: RevokeSessionPayload,
    tenantId: string
): Promise<RevokeSessionResponse> {
    const { data } = await apiClient.post<RevokeSessionResponse>(
        "/admin/revoke-user-session",
        payload,
        { headers: tenantHeaders(tenantId) }
    )
    return data
}

/** 🔟 POST /admin/revoke-multiple-user-sessions */
export async function revokeMultipleSessions(
    payload: RevokeMultipleSessionsPayload,
    tenantId: string
): Promise<RevokeMultipleSessionsResponse> {
    const { data } = await apiClient.post<RevokeMultipleSessionsResponse>(
        "/admin/revoke-multiple-user-sessions",
        payload,
        { headers: tenantHeaders(tenantId) }
    )
    return data
}

/** 1️⃣1️⃣ POST /admin/revoke-all-sessions-for-user */
export async function revokeAllSessionsForUser(
    userId: string,
    tenantId: string
): Promise<RevokeAllSessionsResponse> {
    const { data } = await apiClient.post<RevokeAllSessionsResponse>(
        `/admin/revoke-all-sessions-for-user?user_id=${encodeURIComponent(userId)}`,
        null,
        { headers: tenantHeaders(tenantId) }
    )
    return data
}

/* ============================================================
   ROLES API
   ============================================================ */

/** 1️⃣2️⃣ GET /roles/get-roles — list available roles */
export async function getRoles(
    tenantId: string
): Promise<GetRolesResponse> {
    const { data } = await apiClient.get("/roles/get-roles", {
        headers: tenantHeaders(tenantId),
    })
    return data
}

/** 1️⃣3️⃣ POST /roles/assign-role — assign a role to a user */
export async function assignRole(
    payload: AssignRolePayload,
    tenantId: string
): Promise<AssignRoleResponse> {
    const { data } = await apiClient.post<AssignRoleResponse>(
        "/roles/assign-role",
        payload,
        { headers: tenantHeaders(tenantId) }
    )
    return data
}

/* ============================================================
   AUTH / PASSWORD
   ============================================================ */

/** 1️⃣4️⃣ POST /auth/admin/set — admin sets user password */
export async function adminSetPassword(
    payload: AdminSetPasswordPayload,
    tenantId: string
): Promise<AdminSetPasswordResponse> {
    const { data } = await apiClient.post<AdminSetPasswordResponse>(
        "/auth/admin/set",
        payload,
        { headers: tenantHeaders(tenantId) }
    )
    return data
}

/** 1️⃣5️⃣ GET /admin/me — current logged-in user info */
export async function getMe(
    tenantId: string
): Promise<MeResponse> {
    const { data } = await apiClient.get<MeResponse>(
        "/admin/me",
        { headers: tenantHeaders(tenantId) }
    )
    return data
}
