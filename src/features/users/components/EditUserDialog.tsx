import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { X, UserCog, Loader2, Shield, ToggleLeft, ToggleRight } from "lucide-react"
import { updateUser, updateUserStatus, assignRole } from "../services/users-service"
import { useAuthStore } from "@/stores/auth-store"
import { useRoles } from "../hooks/useRoles"
import type { AdminUser } from "../types"

interface EditUserFormData {
    first_name: string
    last_name: string
    phone: string
    role: string
}

interface EditUserDialogProps {
    open: boolean
    user: AdminUser | null
    onClose: () => void
    onSuccess: () => void
}

/** Split full_name into first and last */
function splitName(u: AdminUser): { first: string; last: string } {
    if (u.first_name) return { first: u.first_name, last: u.last_name || "" }
    if (u.full_name) {
        const parts = u.full_name.split(" ")
        return { first: parts[0] || "", last: parts.slice(1).join(" ") }
    }
    return { first: "", last: "" }
}

export function EditUserDialog({ open, user: editingUser, onClose, onSuccess }: EditUserDialogProps) {
    const [loading, setLoading] = useState(false)
    const [statusLoading, setStatusLoading] = useState(false)
    const { user: currentUser } = useAuthStore()
    const { roles, loading: rolesLoading } = useRoles()

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, dirtyFields },
    } = useForm<EditUserFormData>()

    useEffect(() => {
        if (editingUser) {
            const { first, last } = splitName(editingUser)
            reset({
                first_name: first,
                last_name: last,
                phone: editingUser.phone || "",
                role: editingUser.role || "",
            })
        }
    }, [editingUser, reset])

    const handleToggleStatus = async () => {
        if (!currentUser?.tenant_id || !editingUser) return
        setStatusLoading(true)
        try {
            const result = await updateUserStatus(
                { user_id: editingUser.user_id, is_active: !editingUser.is_active },
                currentUser.tenant_id
            )
            if (result.success) {
                toast.success(editingUser.is_active ? "تم تعطيل المستخدم" : "تم تفعيل المستخدم")
                onSuccess()
                onClose()
            }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } }
            toast.error(error.response?.data?.message || "فشل تحديث حالة المستخدم")
        } finally {
            setStatusLoading(false)
        }
    }

    const onSubmit = async (formData: EditUserFormData) => {
        if (!currentUser?.tenant_id || !editingUser) return

        setLoading(true)
        try {
            // 1) Update basic user info if name/phone changed
            const hasInfoChanges = dirtyFields.first_name || dirtyFields.last_name || dirtyFields.phone
            if (hasInfoChanges) {
                const result = await updateUser(
                    {
                        user_id: editingUser.user_id,
                        username_login: editingUser.email,
                        first_name: formData.first_name,
                        last_name: formData.last_name,
                        phone: formData.phone || undefined,
                    },
                    currentUser.tenant_id
                )
                if (!result.success) {
                    toast.error(result.message || "فشل تحديث البيانات الأساسية")
                    return
                }
            }

            // 2) Assign new role if changed
            if (dirtyFields.role && formData.role !== editingUser.role) {
                const roleResult = await assignRole(
                    { user_id: editingUser.user_id, role: formData.role },
                    currentUser.tenant_id
                )
                if (!roleResult.success) {
                    toast.error(roleResult.message || "فشل تحديث الدور")
                    return
                }
            }

            toast.success("تم تحديث بيانات المستخدم بنجاح")
            onSuccess()
            onClose()
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } }
            toast.error(error.response?.data?.message || "فشل تحديث المستخدم")
        } finally {
            setLoading(false)
        }
    }

    if (!open || !editingUser) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div
                className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
                dir="rtl"
                style={{ animation: "fadeSlideUp 0.3s ease-out" }}
            >
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900">
                            <UserCog size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">تعديل المستخدم</h2>
                            <p className="text-xs text-gray-400">{editingUser.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Status toggle card */}
                <div className="mb-5 flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center gap-3">
                        <div className={`h-2.5 w-2.5 rounded-full ${editingUser.is_active ? "bg-emerald-500" : "bg-red-400"}`} />
                        <div>
                            <p className="text-sm font-medium text-gray-700">
                                حالة الحساب: <span className={editingUser.is_active ? "text-emerald-600" : "text-red-500"}>
                                    {editingUser.is_active ? "نشط" : "معطل"}
                                </span>
                            </p>
                            <p className="text-xs text-gray-400">
                                {editingUser.is_active ? "يمكن للمستخدم تسجيل الدخول" : "لا يمكن للمستخدم تسجيل الدخول"}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleToggleStatus}
                        disabled={statusLoading}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${editingUser.is_active
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            } disabled:opacity-50`}
                    >
                        {statusLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : editingUser.is_active ? (
                            <ToggleLeft size={16} />
                        ) : (
                            <ToggleRight size={16} />
                        )}
                        {editingUser.is_active ? "تعطيل" : "تفعيل"}
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Name row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">الاسم الأول *</label>
                            <input
                                {...register("first_name", {
                                    required: "مطلوب",
                                    minLength: { value: 2, message: "على الأقل حرفين" },
                                })}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                            />
                            {errors.first_name && <p className="mt-1 text-xs text-red-500">{errors.first_name.message}</p>}
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">اسم العائلة *</label>
                            <input
                                {...register("last_name", {
                                    required: "مطلوب",
                                    minLength: { value: 2, message: "على الأقل حرفين" },
                                })}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                            />
                            {errors.last_name && <p className="mt-1 text-xs text-red-500">{errors.last_name.message}</p>}
                        </div>
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">رقم الهاتف</label>
                        <input
                            {...register("phone")}
                            dir="ltr"
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                            placeholder="+967..."
                        />
                    </div>

                    {/* Role */}
                    <div>
                        <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Shield size={14} className="text-amber-500" />
                            الدور *
                        </label>
                        {rolesLoading ? (
                            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                                <Loader2 size={14} className="animate-spin text-gray-400" />
                                <span className="text-sm text-gray-400">جاري تحميل الأدوار...</span>
                            </div>
                        ) : (
                            <select
                                {...register("role", { required: "مطلوب" })}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                            >
                                {roles.length === 0 && (
                                    <option value={editingUser.role}>{editingUser.role}</option>
                                )}
                                {roles.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.name}
                                    </option>
                                ))}
                            </select>
                        )}
                        {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white  transition-all  disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <UserCog size={16} />}
                            حفظ التعديلات
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.96); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    )
}
