import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { settingsKeys } from "./query-keys"
import {
    getOrganization,
    updateOrganization,
    getUserProfile,
    updateUserProfile,
} from "../services/settings-service"
import type {
    UpdateOrganizationPayload,
    UpdateUserProfilePayload,
} from "../types"
import { useAuthStore } from "@/stores/auth-store"

/* ============================================================
   ORGANIZATION HOOKS
   ============================================================ */

/** Fetch organization details */
export function useOrganization(tenantId: string) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

    return useQuery({
        queryKey: settingsKeys.organization(tenantId),
        queryFn: () => getOrganization(tenantId),
        enabled: !!tenantId && isAuthenticated,
        select: (res) => res.data,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    })
}

/** Update organization (partial) */
export function useUpdateOrganization(tenantId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: UpdateOrganizationPayload) =>
            updateOrganization(payload, tenantId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: settingsKeys.organization(tenantId),
            })
            toast.success("تم تحديث بيانات المؤسسة بنجاح")
        },
        onError: () => {
            toast.error("فشل تحديث بيانات المؤسسة")
        },
    })
}

/* ============================================================
   USER PROFILE HOOKS
   ============================================================ */

/** Fetch current user profile */
export function useUserProfile() {
    const user = useAuthStore((s) => s.user)
    const tenantId = user?.tenant_id || ""
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

    return useQuery({
        queryKey: settingsKeys.profile(),
        queryFn: () => getUserProfile(tenantId),
        enabled: !!tenantId && isAuthenticated,
        select: (res) => res.data,
        staleTime: 5 * 60 * 1000,
    })
}

/** Update user profile (partial) — also syncs auth store */
export function useUpdateUserProfile() {
    const queryClient = useQueryClient()
    const setUser = useAuthStore((s) => s.setUser)
    const currentUser = useAuthStore((s) => s.user)
    const tenantId = currentUser?.tenant_id || ""

    return useMutation({
        mutationFn: (payload: UpdateUserProfilePayload) =>
            updateUserProfile(payload, tenantId),
        onSuccess: (res) => {
            queryClient.invalidateQueries({
                queryKey: settingsKeys.profile(),
            })
            // Sync auth store so sidebar/header reflect changes immediately
            if (currentUser && res.data) {
                const d = res.data
                setUser({
                    ...currentUser,
                    first_name: d.first_name ?? currentUser.first_name,
                    last_name: d.last_name ?? currentUser.last_name,
                    phone: d.phone ?? currentUser.phone,
                    profile_picture: d.profile_picture ?? currentUser.profile_picture,
                })
            }
            toast.success("تم تحديث الملف الشخصي بنجاح")
        },
        onError: () => {
            toast.error("فشل تحديث الملف الشخصي")
        },
    })
}
