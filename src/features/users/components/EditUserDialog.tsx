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

const CSS = `@keyframes dlgSlide{from{opacity:0;transform:translateY(16px) scale(0.97)}to{opacity:1;transform:none}}`

const inputCls = `w-full rounded-lg border border-gray-200 bg-[var(--t-surface,#fafafa)] px-3.5 py-2.5 text-sm text-[var(--t-text,#111827)]
    outline-none transition-all placeholder:text-gray-400
    focus:border-[#004786] focus:bg-white focus:ring-2 focus:ring-[#004786]/10`

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
            <style>{CSS}</style>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div
                className="relative z-10 w-full max-w-lg bg-white shadow-2xl"
                dir="rtl"
                style={{ animation: "dlgSlide .25s ease-out", borderRadius: 16, overflow: "hidden" }}
            >
                {/* ── Gradient header ── */}
                <div style={{
                    background: "linear-gradient(135deg, #004786, #0072b5)",
                    padding: "16px 20px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: "rgba(255,255,255,0.15)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <UserCog size={18} style={{ color: "#fff" }} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>تعديل المستخدم</h2>
                            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", margin: "2px 0 0", fontFamily: "monospace" }} dir="ltr">{editingUser.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 8,
                        padding: 5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "background .12s",
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.25)" }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)" }}>
                        <X size={16} style={{ color: "#fff" }} />
                    </button>
                </div>

                <div style={{ padding: "16px 20px" }}>
                    {/* ── Status toggle ── */}
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 14px", borderRadius: 10, marginBottom: 16,
                        background: "var(--t-surface, #f9fafb)",
                        border: "1px solid var(--t-border-light, #eaedf0)",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{
                                width: 8, height: 8, borderRadius: "50%",
                                background: editingUser.is_active ? "#16a34a" : "#dc2626",
                            }} />
                            <div>
                                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--t-text, #111827)", margin: 0 }}>
                                    حالة الحساب: <span style={{ color: editingUser.is_active ? "#16a34a" : "#dc2626" }}>
                                        {editingUser.is_active ? "نشط" : "معطل"}
                                    </span>
                                </p>
                                <p style={{ fontSize: 10.5, color: "var(--t-text-faint, #9ca3af)", margin: "2px 0 0" }}>
                                    {editingUser.is_active ? "يمكن للمستخدم تسجيل الدخول" : "لا يمكن للمستخدم تسجيل الدخول"}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleToggleStatus}
                            disabled={statusLoading}
                            style={{
                                display: "flex", alignItems: "center", gap: 5,
                                padding: "6px 12px", borderRadius: 7, border: "none", cursor: "pointer",
                                background: editingUser.is_active ? "rgba(239,68,68,0.06)" : "rgba(22,163,74,0.06)",
                                color: editingUser.is_active ? "#dc2626" : "#16a34a",
                                fontSize: 11, fontWeight: 600, fontFamily: "inherit",
                                opacity: statusLoading ? 0.5 : 1,
                            }}
                        >
                            {statusLoading ? <Loader2 size={14} className="animate-spin" /> :
                                editingUser.is_active ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                            {editingUser.is_active ? "تعطيل" : "تفعيل"}
                        </button>
                    </div>

                    {/* ── Form ── */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Name row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-600">الاسم الأول *</label>
                                <input
                                    {...register("first_name", {
                                        required: "مطلوب",
                                        minLength: { value: 2, message: "على الأقل حرفين" },
                                    })}
                                    className={inputCls}
                                />
                                {errors.first_name && <p className="mt-1 text-xs text-red-500">{errors.first_name.message}</p>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-600">اسم العائلة *</label>
                                <input
                                    {...register("last_name", {
                                        required: "مطلوب",
                                        minLength: { value: 2, message: "على الأقل حرفين" },
                                    })}
                                    className={inputCls}
                                />
                                {errors.last_name && <p className="mt-1 text-xs text-red-500">{errors.last_name.message}</p>}
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-gray-600">رقم الهاتف</label>
                            <input
                                {...register("phone")}
                                dir="ltr"
                                className={inputCls}
                                placeholder="+967..."
                            />
                        </div>

                        {/* Role */}
                        <div>
                            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                                <Shield size={12} style={{ color: "#004786" }} />
                                الدور *
                            </label>
                            {rolesLoading ? (
                                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                                    <Loader2 size={14} className="animate-spin text-gray-400" />
                                    <span className="text-sm text-gray-400">جاري تحميل الأدوار...</span>
                                </div>
                            ) : (
                                <select
                                    {...register("role", { required: "مطلوب" })}
                                    className={inputCls}
                                >
                                    {roles.length === 0 && (
                                        <option value={editingUser.role}>{editingUser.role}</option>
                                    )}
                                    {roles.map((r) => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            )}
                            {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>}
                        </div>

                        {/* ── Actions ── */}
                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: "flex-end",
                            gap: 8, paddingTop: 14,
                            borderTop: "1px solid var(--t-border-light, #eaedf0)",
                        }}>
                            <button type="button" onClick={onClose} style={{
                                padding: "8px 18px", borderRadius: 9, border: "1px solid var(--t-border, #dcdfe3)",
                                background: "var(--t-card, #fff)", color: "var(--t-text-secondary, #6b7280)",
                                fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                            }}>إلغاء</button>
                            <button type="submit" disabled={loading} style={{
                                padding: "8px 20px", borderRadius: 9, border: "none",
                                background: "#004786", color: "#fff",
                                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                                display: "flex", alignItems: "center", gap: 5,
                                opacity: loading ? 0.5 : 1,
                                boxShadow: "0 1px 3px rgba(0,71,134,0.15)",
                            }}>
                                {loading ? <Loader2 size={14} className="animate-spin" /> : <UserCog size={14} />}
                                حفظ التعديلات
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
