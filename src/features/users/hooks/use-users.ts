import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { toast } from "sonner"
import { usersKeys } from "./query-keys"
import {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus,
    getRoles,
    assignRole,
} from "../services/users-service"
import type { GetAllUsersParams } from "../services/users-service"
import type {
    CreateUserPayload,
    UpdateUserPayload,
    DeleteUserPayload,
    UpdateUserStatusPayload,
    AssignRolePayload,
} from "../types"

/* ─── Queries ─── */

/** Paginated users list with keepPreviousData for smooth transitions */
export function useUsersList(tenantId: string, params: GetAllUsersParams) {
    return useQuery({
        queryKey: usersKeys.list(tenantId, params as Record<string, unknown>),
        queryFn: () => getAllUsers(params, tenantId),
        enabled: !!tenantId,
        staleTime: 5 * 60 * 1000,
        placeholderData: keepPreviousData,
    })
}

/** Available roles lookup */
export function useRolesList(tenantId: string) {
    return useQuery({
        queryKey: usersKeys.roles(tenantId),
        queryFn: () => getRoles(tenantId),
        enabled: !!tenantId,
        staleTime: 10 * 60 * 1000,
    })
}

/* ─── Mutations ─── */

export function useCreateUser(tenantId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (payload: CreateUserPayload) => createUser(payload, tenantId),
        onSuccess: (res) => {
            if (res.success) {
                toast.success(res.message || "تم إنشاء المستخدم بنجاح")
                qc.invalidateQueries({ queryKey: usersKeys.all(tenantId) })
            } else {
                toast.error(res.message || "فشل إنشاء المستخدم")
            }
        },
        onError: () => toast.error("حدث خطأ أثناء إنشاء المستخدم"),
    })
}

export function useUpdateUser(tenantId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (payload: UpdateUserPayload) => updateUser(payload, tenantId),
        onSuccess: (res) => {
            if (res.success) {
                toast.success(res.message || "تم تحديث المستخدم بنجاح")
                qc.invalidateQueries({ queryKey: usersKeys.all(tenantId) })
            } else {
                toast.error(res.message || "فشل تحديث المستخدم")
            }
        },
        onError: () => toast.error("حدث خطأ أثناء تحديث المستخدم"),
    })
}

export function useDeleteUser(tenantId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (payload: DeleteUserPayload) => deleteUser(payload, tenantId),
        onSuccess: (res) => {
            if (res.success) {
                toast.success(res.message || "تم حذف المستخدم بنجاح")
                qc.invalidateQueries({ queryKey: usersKeys.all(tenantId) })
            } else {
                toast.error(res.message || "فشل حذف المستخدم")
            }
        },
        onError: () => toast.error("حدث خطأ أثناء حذف المستخدم"),
    })
}

export function useToggleUserStatus(tenantId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (payload: UpdateUserStatusPayload) => updateUserStatus(payload, tenantId),
        onSuccess: (res) => {
            if (res.success) {
                toast.success(res.message || "تم تحديث حالة المستخدم")
                qc.invalidateQueries({ queryKey: usersKeys.all(tenantId) })
            } else {
                toast.error(res.message || "فشل تحديث الحالة")
            }
        },
        onError: () => toast.error("حدث خطأ أثناء تحديث الحالة"),
    })
}

export function useAssignRole(tenantId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (payload: AssignRolePayload) => assignRole(payload, tenantId),
        onSuccess: (res) => {
            if (res.success) {
                toast.success(res.message || "تم تعيين الدور بنجاح")
                qc.invalidateQueries({ queryKey: usersKeys.all(tenantId) })
            } else {
                toast.error(res.message || "فشل تعيين الدور")
            }
        },
        onError: () => toast.error("حدث خطأ أثناء تعيين الدور"),
    })
}
