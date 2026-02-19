import { type ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { usePermissions } from "@/lib/usePermissions"
import type { PageBit } from "@/lib/permissions"

interface PermissionGuardProps {
    /** الـ base_bit للصفحة المطلوبة */
    pageBit: PageBit | number
    /** المحتوى المحمي */
    children: ReactNode
    /** المسار الذي يُوجَّه إليه عند عدم وجود صلاحية (افتراضي: /dashboard) */
    fallbackPath?: string
}

/**
 * مكون حماية الـ Routes — يمنع الوصول للصفحة إذا لم يملك المستخدم الصلاحية
 * 
 * @example
 * <Route path="users" element={
 *   <PermissionGuard pageBit={PAGE_BITS.ADMIN_USERS}>
 *     <UsersPage />
 *   </PermissionGuard>
 * } />
 */
export function PermissionGuard({
    pageBit,
    children,
    fallbackPath = "/dashboard",
}: PermissionGuardProps) {
    const { canAccessPage, hasPermissionData } = usePermissions()

    // إذا لا توجد بيانات صلاحيات (مثلاً owner بدون قيود) → اسمح
    if (!hasPermissionData) return <>{children}</>

    if (!canAccessPage(pageBit)) {
        return <Navigate to={fallbackPath} replace />
    }

    return <>{children}</>
}
