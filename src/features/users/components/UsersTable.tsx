import { useState } from "react"
import { toast } from "sonner"
import type { AdminUser } from "../types"
import {
    Shield,
    Mail,
    Phone,
    CheckCircle,
    XCircle,
    Pencil,
    KeyRound,
    ToggleLeft,
    ToggleRight,
    Monitor,
    Trash2,
    Loader2,
} from "lucide-react"
import { updateUserStatus, deleteUser } from "../services/users-service"
import { useAuthStore } from "@/stores/auth-store"
import { UserSessionsDialog } from "./UserSessionsDialog"

interface UsersTableProps {
    users: AdminUser[]
    loading: boolean
    onEdit: (user: AdminUser) => void
    onSetPassword: (user: AdminUser) => void
    onRefresh: () => void
}

const ROLE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    owner: { bg: "bg-purple-50", text: "text-purple-700", label: "مالك" },
    admin: { bg: "bg-blue-50", text: "text-blue-700", label: "مدير" },
    manager: { bg: "bg-cyan-50", text: "text-cyan-700", label: "مشرف" },
    analyst: { bg: "bg-amber-50", text: "text-amber-700", label: "محلل" },
    user: { bg: "bg-gray-50", text: "text-gray-600", label: "مستخدم" },
}

function getRoleStyle(role: string) {
    return ROLE_STYLES[role] || { bg: "bg-gray-50", text: "text-gray-600", label: role }
}

/** Extract display name — API returns full_name from list endpoint */
function getDisplayName(u: AdminUser): string {
    if (u.full_name) return u.full_name
    if (u.first_name || u.last_name) return `${u.first_name || ""} ${u.last_name || ""}`.trim()
    return u.email
}

/** Get initials for avatar */
function getInitials(u: AdminUser): string {
    if (u.first_name && u.last_name) return `${u.first_name.charAt(0)}${u.last_name.charAt(0)}`
    if (u.full_name) {
        const parts = u.full_name.split(" ")
        return parts.length >= 2 ? `${parts[0].charAt(0)}${parts[1].charAt(0)}` : u.full_name.charAt(0)
    }
    return u.email.charAt(0).toUpperCase()
}

export function UsersTable({ users, loading, onEdit, onSetPassword, onRefresh }: UsersTableProps) {
    const { user: currentUser } = useAuthStore()
    const tenantId = currentUser?.tenant_id || ""

    const [actionLoading, setActionLoading] = useState<Record<string, string | null>>({})
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
    const [sessionsUser, setSessionsUser] = useState<AdminUser | null>(null)

    const setUserLoading = (userId: string, action: string | null) => {
        setActionLoading((prev) => ({ ...prev, [userId]: action }))
    }

    const handleToggleStatus = async (user: AdminUser) => {
        if (!tenantId) return
        setUserLoading(user.user_id, "status")
        try {
            const result = await updateUserStatus(
                { user_id: user.user_id, is_active: !user.is_active },
                tenantId
            )
            if (result.success) {
                toast.success(user.is_active ? "تم تعطيل المستخدم" : "تم تفعيل المستخدم")
                onRefresh()
            }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } }
            toast.error(error.response?.data?.message || "فشل تحديث الحالة")
        } finally {
            setUserLoading(user.user_id, null)
        }
    }



    const handleDelete = async (user: AdminUser) => {
        if (confirmDelete !== user.user_id) {
            setConfirmDelete(user.user_id)
            setTimeout(() => setConfirmDelete((prev) => (prev === user.user_id ? null : prev)), 3000)
            return
        }
        if (!tenantId) return
        setUserLoading(user.user_id, "delete")
        setConfirmDelete(null)
        try {
            const result = await deleteUser({ user_id: user.user_id }, tenantId)
            if (result.success) {
                toast.success("تم حذف المستخدم نهائياً")
                onRefresh()
            }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } }
            toast.error(error.response?.data?.message || "فشل حذف المستخدم")
        } finally {
            setUserLoading(user.user_id, null)
        }
    }

    if (loading) {
        return (
            <div className="space-y-3 p-6">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                        <div className="h-10 w-10 rounded-full bg-gray-200" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-1/3 rounded bg-gray-200" />
                            <div className="h-3 w-1/4 rounded bg-gray-100" />
                        </div>
                        <div className="h-6 w-16 rounded-full bg-gray-200" />
                        <div className="h-6 w-16 rounded-full bg-gray-200" />
                    </div>
                ))}
            </div>
        )
    }

    if (users.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                    <Shield size={32} className="text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600">لا يوجد مستخدمين</h3>
                <p className="mt-1 text-sm text-gray-400">أضف مستخدمين جدد للبدء</p>
            </div>
        )
    }

    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-100 text-right">
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">المستخدم</th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">البريد</th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">الهاتف</th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">الدور</th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">الحالة</th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {users.map((u, idx) => {
                            const roleStyle = getRoleStyle(u.role)
                            const userLoading = actionLoading[u.user_id]
                            const displayName = getDisplayName(u)
                            const initials = getInitials(u)
                            return (
                                <tr
                                    key={u.user_id}
                                    className="transition-colors hover:bg-gray-50/80"
                                    style={{ animation: `rowFadeIn 0.3s ease-out ${idx * 0.04}s both` }}
                                >
                                    {/* User avatar + name */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`
                                                flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white
                                                ${u.is_active
                                                    ? "bg-gray-900"
                                                    : "bg-gray-300"
                                                }
                                            `}>
                                                {initials}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{displayName}</p>
                                                <p className="text-xs text-gray-400">{u.username || u.email}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Email */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5 text-sm text-gray-600" dir="ltr">
                                            <Mail size={13} className="text-gray-300" />
                                            {u.email}
                                        </div>
                                    </td>

                                    {/* Phone */}
                                    <td className="px-4 py-3">
                                        {u.phone ? (
                                            <div className="flex items-center gap-1.5 text-sm text-gray-600" dir="ltr">
                                                <Phone size={13} className="text-gray-300" />
                                                {u.phone}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-300">—</span>
                                        )}
                                    </td>

                                    {/* Role badge */}
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${roleStyle.bg} ${roleStyle.text}`}>
                                            <Shield size={10} />
                                            {roleStyle.label}
                                        </span>
                                    </td>

                                    {/* Status */}
                                    <td className="px-4 py-3">
                                        {u.is_active ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
                                                <CheckCircle size={10} />
                                                نشط
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-500">
                                                <XCircle size={10} />
                                                معطل
                                            </span>
                                        )}
                                    </td>

                                    {/* Inline action buttons */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            {/* Edit */}
                                            <button
                                                onClick={() => onEdit(u)}
                                                title="تعديل البيانات"
                                                className="rounded-lg p-2 text-gray-400 transition-all hover:bg-amber-50 hover:text-amber-600"
                                            >
                                                <Pencil size={15} />
                                            </button>

                                            {/* Set Password */}
                                            <button
                                                onClick={() => onSetPassword(u)}
                                                title="تعيين كلمة المرور"
                                                className="rounded-lg p-2 text-gray-400 transition-all hover:bg-blue-50 hover:text-blue-600"
                                            >
                                                <KeyRound size={15} />
                                            </button>

                                            {/* Toggle Status */}
                                            <button
                                                onClick={() => handleToggleStatus(u)}
                                                disabled={userLoading === "status"}
                                                title={u.is_active ? "تعطيل المستخدم" : "تفعيل المستخدم"}
                                                className={`rounded-lg p-2 transition-all disabled:opacity-50 ${u.is_active
                                                    ? "text-gray-400 hover:bg-orange-50 hover:text-orange-500"
                                                    : "text-gray-400 hover:bg-emerald-50 hover:text-emerald-500"
                                                    }`}
                                            >
                                                {userLoading === "status" ? (
                                                    <Loader2 size={15} className="animate-spin" />
                                                ) : u.is_active ? (
                                                    <ToggleLeft size={15} />
                                                ) : (
                                                    <ToggleRight size={15} />
                                                )}
                                            </button>

                                            {/* View Sessions */}
                                            <button
                                                onClick={() => setSessionsUser(u)}
                                                title="عرض الجلسات"
                                                className="rounded-lg p-2 text-gray-400 transition-all hover:bg-purple-50 hover:text-purple-500"
                                            >
                                                <Monitor size={15} />
                                            </button>

                                            {/* Delete */}
                                            <button
                                                onClick={() => handleDelete(u)}
                                                disabled={userLoading === "delete"}
                                                title={confirmDelete === u.user_id ? "اضغط مرة أخرى للتأكيد" : "حذف المستخدم"}
                                                className={`rounded-lg p-2 transition-all disabled:opacity-50 ${confirmDelete === u.user_id
                                                    ? "bg-red-100 text-red-600 animate-pulse"
                                                    : "text-gray-400 hover:bg-red-50 hover:text-red-500"
                                                    }`}
                                            >
                                                {userLoading === "delete" ? (
                                                    <Loader2 size={15} className="animate-spin" />
                                                ) : (
                                                    <Trash2 size={15} />
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                <style>{`
                    @keyframes rowFadeIn {
                        from { opacity: 0; transform: translateY(8px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}</style>
            </div>

            {/* Sessions Dialog */}
            <UserSessionsDialog
                open={!!sessionsUser}
                user={sessionsUser}
                onClose={() => setSessionsUser(null)}
            />
        </>
    )
}
