import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { rolesKeys } from "./query-keys"
import {
    getRoles,
    createRole,
    deleteRole,
    getRolePermissions,
    addRolePermissions,
    removeRolePermissions,
    getUsersWithRole,
    assignUserRole,
    removeUserRole,
    getAllPermissions,
} from "../services/roles-service"
import type {
    Role,
    Permission,
    PermissionSection,
    CreateRolePayload,
    AssignRolePayload,
} from "../types"
import { useAuthStore } from "@/stores/auth-store"

/* ─── helpers ─── */
function useTenantId() {
    return useAuthStore(s => s.user?.tenant_id || "")
}

/** Group flat Permission[] into PermissionSection[] for grid display */
function groupPermissions(flat: Permission[]): PermissionSection[] {
    const map = new Map<string, PermissionSection>()

    for (const p of flat) {
        let section = map.get(p.section)
        if (!section) {
            section = { section: p.section, actions: [] }
            map.set(p.section, section)
        }
        section.actions.push({
            action: p.action,
            id: p.id,
            name: p.name || p.name_ar || p.id,
        })
    }

    return Array.from(map.values())
}

/* ============================================================
   QUERIES
   ============================================================ */

/** List all roles */
export function useRoles() {
    const tenantId = useTenantId()
    const isAuth = useAuthStore(s => s.isAuthenticated)

    return useQuery({
        queryKey: rolesKeys.list(),
        queryFn: () => getRoles(tenantId),
        enabled: !!tenantId && isAuth,
        select: (res): Role[] => {
            const raw = res?.data?.roles ?? res?.data ?? []
            if (!Array.isArray(raw)) return []

            return raw.map((item: any): Role => {
                if (typeof item === "string") {
                    return { role: item, name_ar: item, name_en: item }
                }
                return {
                    role: item.role || item.id || "",
                    name_ar: item.name_ar || item.name || item.role || "",
                    name_en: item.name_en || item.name || item.role || "",
                    description_ar: item.description_ar,
                    description_en: item.description_en,
                }
            })
        },
        staleTime: 2 * 60 * 1000,
    })
}

/** Fetch ALL system permissions — this is the master list */
export function useAllPermissions() {
    const tenantId = useTenantId()
    const isAuth = useAuthStore(s => s.isAuthenticated)

    return useQuery({
        queryKey: rolesKeys.allPermissions(),
        queryFn: () => getAllPermissions(tenantId),
        enabled: !!tenantId && isAuth,
        select: (res): PermissionSection[] => {
            const raw = res?.data?.permissions ?? res?.data ?? []
            if (!Array.isArray(raw)) return []
            return groupPermissions(raw as Permission[])
        },
        staleTime: 5 * 60 * 1000, // permissions schema rarely changes
    })
}

/** Get active permission IDs for a specific role — returns a Set<string> */
export function useRoleActivePermissionIds(role: string) {
    const tenantId = useTenantId()
    const isAuth = useAuthStore(s => s.isAuthenticated)

    return useQuery({
        queryKey: rolesKeys.permissions(role),
        queryFn: () => getRolePermissions(role, tenantId),
        enabled: !!role && !!tenantId && isAuth,
        select: (res): Set<string> => {
            const raw = res?.data?.permissions ?? res?.data ?? []
            if (!Array.isArray(raw)) return new Set()
            return new Set(raw.map((p: any) => p.id || `${p.section}:${p.action}`))
        },
        staleTime: 60 * 1000,
    })
}

/** Get permissions for a specific role — grouped by section (legacy) */
export function useRolePermissions(role: string) {
    const tenantId = useTenantId()
    const isAuth = useAuthStore(s => s.isAuthenticated)

    return useQuery({
        queryKey: rolesKeys.permissions(role),
        queryFn: () => getRolePermissions(role, tenantId),
        enabled: !!role && !!tenantId && isAuth,
        select: (res): PermissionSection[] => {
            const raw = res?.data?.permissions ?? res?.data ?? []
            if (!Array.isArray(raw)) return []

            if (raw.length > 0 && raw[0].id) {
                return groupPermissions(raw as Permission[])
            }

            return raw.map((g: any) => ({
                section: g.section || "",
                actions: (g.codes || []).map((c: string) => ({
                    action: c,
                    id: `${g.section}:${c}`,
                    name: c.replace(/_/g, " "),
                })),
            }))
        },
        staleTime: 60 * 1000,
    })
}

/** Get users assigned to a role */
export function useUsersWithRole(role: string) {
    const tenantId = useTenantId()
    const isAuth = useAuthStore(s => s.isAuthenticated)

    return useQuery({
        queryKey: rolesKeys.usersWithRole(role),
        queryFn: () => getUsersWithRole(role, tenantId),
        enabled: !!role && !!tenantId && isAuth,
        select: (res) => {
            const users = res?.data?.users ?? res?.data ?? []
            return Array.isArray(users) ? users : []
        },
        staleTime: 60 * 1000,
    })
}

/* ============================================================
   MUTATIONS
   ============================================================ */

/** Create a new role */
export function useCreateRole() {
    const tenantId = useTenantId()
    const qc = useQueryClient()

    return useMutation({
        mutationFn: (payload: CreateRolePayload) => createRole(payload, tenantId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: rolesKeys.list() })
            toast.success("تم إنشاء الدور بنجاح")
        },
        onError: () => toast.error("فشل إنشاء الدور"),
    })
}

/** Delete a role */
export function useDeleteRole() {
    const tenantId = useTenantId()
    const qc = useQueryClient()

    return useMutation({
        mutationFn: (role: string) => deleteRole(role, tenantId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: rolesKeys.all })
            toast.success("تم حذف الدور بنجاح")
        },
        onError: () => toast.error("فشل حذف الدور"),
    })
}

/** Add permissions to a role */
export function useAddRolePermissions(role: string) {
    const tenantId = useTenantId()
    const qc = useQueryClient()

    return useMutation({
        mutationFn: (permissionIds: string[]) =>
            addRolePermissions(role, permissionIds, tenantId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: rolesKeys.permissions(role) })
            toast.success("تم إضافة الصلاحية")
        },
        onError: () => toast.error("فشل إضافة الصلاحية"),
    })
}

/** Remove permissions from a role */
export function useRemoveRolePermissions(role: string) {
    const tenantId = useTenantId()
    const qc = useQueryClient()

    return useMutation({
        mutationFn: (permissionIds: string[]) =>
            removeRolePermissions(role, permissionIds, tenantId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: rolesKeys.permissions(role) })
            toast.success("تم إزالة الصلاحية")
        },
        onError: () => toast.error("فشل إزالة الصلاحية"),
    })
}

/** Assign a role to a user */
export function useAssignUserRole() {
    const tenantId = useTenantId()
    const qc = useQueryClient()

    return useMutation({
        mutationFn: (payload: AssignRolePayload) => assignUserRole(payload, tenantId),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: rolesKeys.usersWithRole(vars.role) })
            toast.success("تم تعيين الدور للمستخدم")
        },
        onError: () => toast.error("فشل تعيين الدور"),
    })
}

/** Remove a role from a user */
export function useRemoveUserRole() {
    const tenantId = useTenantId()
    const qc = useQueryClient()

    return useMutation({
        mutationFn: (payload: AssignRolePayload) => removeUserRole(payload, tenantId),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: rolesKeys.usersWithRole(vars.role) })
            toast.success("تم إزالة الدور من المستخدم")
        },
        onError: () => toast.error("فشل إزالة الدور"),
    })
}
