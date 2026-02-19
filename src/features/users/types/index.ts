// ============================================
// User Management Types — synced with API v2
// ============================================

/** User item as returned by GET /admin/get-all-users */
export interface AdminUser {
    user_id: string
    email: string
    tenant_id: string
    role: string
    full_name: string
    first_name?: string
    last_name?: string
    phone: string | null
    profile_picture: string | null
    created_at: string
    updated_at: string
    is_active: boolean
    /** Virtual — derived in the frontend from full_name when needed */
    username?: string
}

/** Pagination metadata from list endpoints */
export interface Pagination {
    totalCount: number
    totalPages: number
    hasPrevious: boolean
    hasNext: boolean
    currentPage: number
    pageSize: number
}

/** Response shape for GET /admin/get-all-users */
export interface GetAllUsersResponse {
    success: boolean
    message: string
    data: {
        items: AdminUser[]
        pagination: Pagination
    }
}

// ── Create User ──
export interface CreateUserPayload {
    email: string
    tenant_id: string
    role: string
    first_name: string
    last_name: string
    phone?: string
    profile_picture?: string
    is_active?: boolean
    password?: string
    issue_reset_link?: boolean
    send_invitation?: boolean
}

export interface CreateUserResponse {
    success: boolean
    message: string
    data: {
        user_id: string
        email: string
        first_name: string
        last_name: string
        role: string
        temp_password: string | null
        reset_password_token: string | null
    }
}

// ── Update User ──
export interface UpdateUserPayload {
    user_id: string
    username_login: string
    first_name?: string
    last_name?: string
    phone?: string
    profile_picture?: string
    is_active?: boolean
}

export interface UpdateUserResponse {
    success: boolean
    message: string
    data: Record<string, unknown>
}

// ── Delete User ──
export interface DeleteUserPayload {
    user_id: string
}

export interface DeleteUserResponse {
    success: boolean
    message: string
    data: { user_id: string }
}

// ── Update User Status ──
export interface UpdateUserStatusPayload {
    user_id: string
    is_active: boolean
}

export interface UpdateUserStatusResponse {
    success: boolean
    message: string
    data: { user_id: string; is_active: boolean }
}

// ── User Brief (detailed info) ──
export interface UserBriefResponse {
    success: boolean
    message: string
    data: AdminUser
}

// ── Session Info ──
export interface SessionInfo {
    session_handle: string
    user_id?: string
    tenant_id?: string
    created_at: string
    expires_at: string
    last_accessed: string
    device_info?: {
        user_agent: string
        ip_address: string
    }
    device?: string
    ip_address?: string
    is_current?: boolean
}

export interface GetSessionInfoResponse {
    success: boolean
    message: string
    data: { session: SessionInfo }
}

export interface GetUserSessionsResponse {
    success: boolean
    message: string
    data: { sessions: SessionInfo[] }
}

// ── Revoke Session ──
export interface RevokeSessionPayload {
    session_handle: string
}

export interface RevokeSessionResponse {
    success: boolean
    message: string
    data: {
        session_handle: string
        requires_relogin: boolean
    }
}

// ── Revoke Multiple Sessions ──
export interface RevokeMultipleSessionsPayload {
    session_handles: string[]
}

export interface RevokeMultipleSessionsResponse {
    success: boolean
    message: string
    data: {
        revoked_count: number
        failed_count: number
        requires_relogin: boolean
    }
}

// ── Revoke All Sessions ──
export interface RevokeAllSessionsResponse {
    success: boolean
    message: string
    data: {
        user_id: string
        revoked_count: number
    }
}

// ── Admin Set Password ──
export interface AdminSetPasswordPayload {
    user_id: string
    new_password: string
}

export interface AdminSetPasswordResponse {
    success: boolean
    message: string
    data: {
        message: string
        user_id: string
    }
}

// ── Roles ──
export interface GetRolesResponse {
    success: boolean
    message: string
    data: {
        roles: string[]
    }
}

export interface AssignRolePayload {
    user_id: string
    role: string
    tenant_id?: string
}

export interface AssignRoleResponse {
    success: boolean
    message: string
    data: {
        user_id: string
        role: string
        tenant_id: string
        did_user_already_have_role: boolean
    }
}

// ── Admin Me (current user) ──
export interface CurrentUserSession {
    session_handle: string
    created_at: string
    expires_at: string
    login_time: string
    ip_address: string
    user_agent: string
}

export interface PermissionEntry {
    pageValue: number
    totalValue: number
}

export interface MeData {
    user_id: string
    email: string
    tenant_id: string
    first_name: string
    last_name: string
    full_name: string
    phone: string | null
    profile_picture: string | null
    position: string | null
    role: string
    roles: string[]
    email_verified: boolean
    is_active: boolean
    is_owner: boolean
    permissions: {
        totalPages: number
        permissions: PermissionEntry[]
    }
    session: CurrentUserSession
}

export interface MeResponse {
    success: boolean
    message: string
    data: MeData
}

// ── Generic API Response ──
export interface ApiResponse<T> {
    success: boolean
    data: T
    message: string
}
