import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useMyPermissions } from "@/features/roles/hooks/use-roles"
import { rolesKeys } from "@/features/roles/hooks/query-keys"
import { useAuthStore } from "@/stores/auth-store"
import apiClient from "@/lib/api-client"

/**
 * مزامنة الصلاحيات — React Query بدل setInterval
 * يُستدعى مرة في App.tsx لتفعيل الجلب التلقائي
 * يُحدّث auth-store عبر useEffect (بدون side-effects في select)
 */
export function usePermissionsSync() {
    const { data: pwp } = useMyPermissions()
    const prevRef = useRef<string>("")

    useEffect(() => {
        if (!pwp) return

        const serialized = JSON.stringify(pwp)
        if (serialized === prevRef.current) return
        prevRef.current = serialized

        const { user, setUser } = useAuthStore.getState()
        if (user) {
            setUser({ ...user, pageWithPermission: pwp })
        }
    }, [pwp])
}

/**
 * تحديث فوري عند mount (مثلاً عند فتح صفحة الإعدادات)
 * يُبطل الكاش ويُجبر React Query على إعادة الجلب
 */
export function usePermissionsRefresh() {
    const qc = useQueryClient()
    useEffect(() => {
        qc.invalidateQueries({ queryKey: rolesKeys.myPermissions() })
    }, [])
}

/**
 * تحديث فوري يدوي — يمكن استدعاؤها من أي مكان (خارج React)
 */
export async function syncPermissionsNow() {
    const { user, setUser, isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated || !user?.tenant_id) return

    try {
        const { data: json } = await apiClient.get("/roles/get-my-permissions")

        if (!json.success || !json.data?.pageWithPermission) return

        const newPwp = json.data.pageWithPermission
        const currentUser = useAuthStore.getState().user
        if (!currentUser) return

        const oldPwp = currentUser.pageWithPermission
        const changed = oldPwp?.totalPages !== newPwp.totalPages ||
            JSON.stringify(oldPwp?.permissions) !== JSON.stringify(newPwp.permissions)

        if (changed) {
            setUser({ ...currentUser, pageWithPermission: newPwp })
        }
    } catch {
        // interceptor يتعامل مع 401 تلقائياً
    }
}
