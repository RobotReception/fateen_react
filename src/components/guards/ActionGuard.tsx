import { type ReactNode } from "react"
import { usePermissions } from "@/lib/usePermissions"
import type { PageBit, ActionBit } from "@/lib/permissions"

interface ActionGuardProps {
    /** الـ base_bit للصفحة */
    pageBit: PageBit | number
    /** الـ action weight للإجراء */
    actionBit: ActionBit | number
    /** المحتوى المحمي (زر، قائمة، إلخ) */
    children: ReactNode
    /** محتوى بديل يُعرض عند عدم الصلاحية (اختياري) */
    fallback?: ReactNode
}

/**
 * مكون حماية الإجراءات — يُخفي العنصر إذا لم يملك المستخدم صلاحية الإجراء
 *
 * @example
 * <ActionGuard pageBit={PAGE_BITS.ADMIN_USERS} actionBit={ACTION_BITS.CREATE_USER}>
 *   <button>إنشاء مستخدم</button>
 * </ActionGuard>
 */
export function ActionGuard({
    pageBit,
    actionBit,
    children,
    fallback = null,
}: ActionGuardProps) {
    const { canPerformAction, hasPermissionData } = usePermissions()

    // إذا لا توجد بيانات صلاحيات → اسمح (owner بدون قيود)
    if (!hasPermissionData) return <>{children}</>

    if (!canPerformAction(pageBit, actionBit)) {
        return <>{fallback}</>
    }

    return <>{children}</>
}
