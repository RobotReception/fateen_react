import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import {
    MoreVertical,
    UserCog,
    KeyRound,
    Trash2,
    Power,
    PowerOff,
    LogOut,
    Loader2,
} from "lucide-react"
import type { AdminUser } from "../types"
import { deleteUser, updateUserStatus, revokeAllSessionsForUser } from "../services/users-service"
import { useAuthStore } from "@/stores/auth-store"
import { ActionGuard } from "@/components/guards/ActionGuard"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"

interface UserActionsMenuProps {
    user: AdminUser
    onEdit: (user: AdminUser) => void
    onSetPassword: (user: AdminUser) => void
    onRefresh: () => void
}

export function UserActionsMenu({ user: targetUser, onEdit, onSetPassword, onRefresh }: UserActionsMenuProps) {
    const [open, setOpen] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [loading, setLoading] = useState<string | null>(null)
    const menuRef = useRef<HTMLDivElement>(null)
    const { user: currentUser } = useAuthStore()

    // Close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false)
                setConfirmDelete(false)
            }
        }
        if (open) document.addEventListener("mousedown", handleClick)
        return () => document.removeEventListener("mousedown", handleClick)
    }, [open])

    const tenantId = currentUser?.tenant_id || ""

    const handleToggleStatus = async () => {
        setLoading("status")
        try {
            const result = await updateUserStatus(
                { user_id: targetUser.user_id, is_active: !targetUser.is_active },
                tenantId
            )
            if (result.success) {
                toast.success(result.message || (targetUser.is_active ? "تم تعطيل المستخدم" : "تم تفعيل المستخدم"))
                onRefresh()
            }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } }
            toast.error(error.response?.data?.message || "فشلت العملية")
        } finally {
            setLoading(null)
            setOpen(false)
        }
    }

    const handleDelete = async () => {
        if (!confirmDelete) {
            setConfirmDelete(true)
            return
        }
        setLoading("delete")
        try {
            const result = await deleteUser({ user_id: targetUser.user_id }, tenantId)
            if (result.success) {
                toast.success(result.message || "تم حذف المستخدم بنجاح")
                onRefresh()
            }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } }
            toast.error(error.response?.data?.message || "فشل حذف المستخدم")
        } finally {
            setLoading(null)
            setConfirmDelete(false)
            setOpen(false)
        }
    }

    const handleRevokeSessions = async () => {
        setLoading("revoke")
        try {
            const result = await revokeAllSessionsForUser(targetUser.user_id, tenantId)
            if (result.success) {
                toast.success(result.message || "تم إلغاء جميع جلسات المستخدم")
            }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } }
            toast.error(error.response?.data?.message || "فشلت العملية")
        } finally {
            setLoading(null)
            setOpen(false)
        }
    }

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => { setOpen(!open); setConfirmDelete(false) }}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
                <MoreVertical size={16} />
            </button>

            {open && (
                <div
                    className="absolute left-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-xl"
                    style={{ animation: "menuPop 0.15s ease-out" }}
                >
                    {/* Edit */}
                    <ActionGuard pageBit={PAGE_BITS.ADMIN_USERS} actionBit={ACTION_BITS.UPDATE_USER}>
                        <button
                            onClick={() => { onEdit(targetUser); setOpen(false) }}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                        >
                            <UserCog size={15} className="text-amber-500" />
                            تعديل البيانات
                        </button>
                    </ActionGuard>

                    {/* Set Password */}
                    <ActionGuard pageBit={PAGE_BITS.ADMIN_USERS} actionBit={ACTION_BITS.UPDATE_USER}>
                        <button
                            onClick={() => { onSetPassword(targetUser); setOpen(false) }}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                        >
                            <KeyRound size={15} className="text-purple-500" />
                            تعيين كلمة مرور
                        </button>
                    </ActionGuard>

                    {/* Toggle Status */}
                    <ActionGuard pageBit={PAGE_BITS.ADMIN_USERS} actionBit={ACTION_BITS.UPDATE_USER_STATUS}>
                        <button
                            onClick={handleToggleStatus}
                            disabled={loading === "status"}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                        >
                            {loading === "status" ? (
                                <Loader2 size={15} className="animate-spin text-gray-400" />
                            ) : targetUser.is_active ? (
                                <PowerOff size={15} className="text-orange-500" />
                            ) : (
                                <Power size={15} className="text-green-500" />
                            )}
                            {targetUser.is_active ? "تعطيل المستخدم" : "تفعيل المستخدم"}
                        </button>
                    </ActionGuard>

                    {/* Revoke Sessions */}
                    <ActionGuard pageBit={PAGE_BITS.ADMIN_USERS} actionBit={ACTION_BITS.REVOKE_ALL_SESSIONS}>
                        <button
                            onClick={handleRevokeSessions}
                            disabled={loading === "revoke"}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                        >
                            {loading === "revoke" ? (
                                <Loader2 size={15} className="animate-spin text-gray-400" />
                            ) : (
                                <LogOut size={15} className="text-blue-500" />
                            )}
                            إلغاء جميع الجلسات
                        </button>
                    </ActionGuard>

                    <div className="my-1 border-t border-gray-100" />

                    {/* Delete */}
                    <ActionGuard pageBit={PAGE_BITS.ADMIN_USERS} actionBit={ACTION_BITS.DELETE_USER}>
                        <button
                            onClick={handleDelete}
                            disabled={loading === "delete"}
                            className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors disabled:opacity-50 ${confirmDelete
                                ? "bg-red-50 font-medium text-red-600"
                                : "text-red-500 hover:bg-red-50"
                                }`}
                        >
                            {loading === "delete" ? (
                                <Loader2 size={15} className="animate-spin" />
                            ) : (
                                <Trash2 size={15} />
                            )}
                            {confirmDelete ? "تأكيد الحذف نهائياً؟" : "حذف المستخدم"}
                        </button>
                    </ActionGuard>
                </div>
            )}

            <style>{`
                @keyframes menuPop {
                    from { opacity: 0; transform: scale(0.95) translateY(-4px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>
    )
}
