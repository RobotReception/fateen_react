import { useAuthStore } from "@/stores/auth-store"
import {
    hasPageAccess,
    hasActionAccess,
    getAccessiblePages,
    type PageBit,
    type ActionBit,
} from "@/lib/permissions"

/**
 * React Hook للتحقق من صلاحيات المستخدم الحالي
 */
export function usePermissions() {
    const user = useAuthStore((s) => s.user)
    const pwp = user?.pageWithPermission

    /**
     * هل يملك المستخدم صلاحية دخول صفحة؟
     */
    function canAccessPage(pageBit: PageBit | number): boolean {
        if (!pwp) return false
        return hasPageAccess(pwp.totalPages, pageBit)
    }

    /**
     * هل يملك المستخدم إجراء معين في صفحة معينة؟
     */
    function canPerformAction(pageBit: PageBit | number, actionBit: ActionBit | number): boolean {
        if (!pwp) return false
        // يجب أولاً أن يملك صلاحية الصفحة
        if (!hasPageAccess(pwp.totalPages, pageBit)) return false
        return hasActionAccess(pwp.permissions, pageBit, actionBit)
    }

    /**
     * قائمة الصفحات المتاحة
     */
    function accessiblePages(): number[] {
        if (!pwp) return []
        return getAccessiblePages(pwp.totalPages)
    }

    return {
        canAccessPage,
        canPerformAction,
        accessiblePages,
        /** هل توجد بيانات صلاحيات أصلاً */
        hasPermissionData: !!pwp,
    }
}
