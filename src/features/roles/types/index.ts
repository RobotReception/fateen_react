/* ============================================================
   ROLES & PERMISSIONS FEATURE — TYPE DEFINITIONS
   ============================================================ */

// ── Role ──

export interface Role {
    role: string
    name_ar: string
    name_en: string
    description_ar?: string
    description_en?: string
}

// ── Flat Permission (from API) ──

export interface Permission {
    id: string               // e.g. "contact_fields:view_page"
    section: string          // e.g. "contact_fields"
    action: string           // e.g. "view_page"
    action_code: number
    section_code: number
    code: number
    name: string             // localized display name
    name_ar?: string         // optional — role-permissions has it, all-permissions may not
    name_en?: string
}

// ── Grouped permissions (for grid display) ──

export interface PermissionAction {
    action: string
    id: string
    name: string
}

export interface PermissionSection {
    section: string
    actions: PermissionAction[]
}

// ── Legacy grouped format (for add/remove API calls) ──

export interface PermissionGroup {
    section: string
    codes: string[]
}

// ── Page Permissions (bitwise) ──

export interface PagePermissionEntry {
    pageValue: number
    totalValue: number
}

export interface PageWithPermission {
    totalPages: number
    permissions: PagePermissionEntry[]
}

// ── Payloads ──

export interface CreateRolePayload {
    role: string
    name_ar: string
    name_en: string
    description_ar?: string
    description_en?: string
    permission_ids?: string[]
}

export interface AssignRolePayload {
    user_id: string
    role: string
    tenant_id?: string
}

export interface RolePermsPayload {
    permissions: PermissionGroup[]
}

// ── API Responses ──

export interface ApiResponse<T = unknown> {
    success: boolean
    data: T
    message: string
}

export type RolesListResponse = ApiResponse<{ roles: Role[] }>
export type RoleCreatedResponse = ApiResponse<{ role: string; created: boolean }>
export type RoleDeletedResponse = ApiResponse<{ role: string; deleted: boolean }>
export type RolePermissionsResponse = ApiResponse<{
    role: string
    permissions: Permission[]
    pageWithPermission?: PageWithPermission
}>
export type AllPermissionsResponse = ApiResponse<{ permissions: Permission[] }>
export type PermissionsAddedResponse = ApiResponse<{ role: string; permissions_added: boolean }>
export type PermissionsRemovedResponse = ApiResponse<{ role: string; permissions_removed: boolean }>
export type RolesByPermissionResponse = ApiResponse<{ permission: string; roles: string[] }>
export type AssignRoleResponse = ApiResponse<{ user_id: string; role: string; assigned: boolean }>
export type RemoveRoleResponse = ApiResponse<{ user_id: string; role: string; removed: boolean }>
export type UserRolesResponse = ApiResponse<{ user_id: string; roles: string[] }>
export type UsersWithRoleResponse = ApiResponse<{ role: string; users: string[] }>
