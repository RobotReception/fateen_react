import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { X, UserPlus, Eye, EyeOff, Loader2, Shield } from "lucide-react"
import { createUser } from "../services/users-service"
import { useAuthStore } from "@/stores/auth-store"
import { useRoles } from "../hooks/useRoles"

interface CreateUserFormData {
    email: string
    first_name: string
    last_name: string
    phone: string
    role: string
    password: string
    send_invitation: boolean
}

interface CreateUserDialogProps {
    open: boolean
    onClose: () => void
    onSuccess: () => void
}

const CSS = `@keyframes dlgSlide{from{opacity:0;transform:translateY(16px) scale(0.97)}to{opacity:1;transform:none}}`

const inputCls = `w-full rounded-lg border border-gray-200 bg-[var(--t-surface,var(--t-card-hover))] px-3.5 py-2.5 text-sm text-[var(--t-text,var(--t-text))]
    outline-none transition-all placeholder:text-gray-400
    focus:border-[var(--t-accent)] focus:bg-white focus:ring-2 focus:ring-[var(--t-accent)]/10`

export function CreateUserDialog({ open, onClose, onSuccess }: CreateUserDialogProps) {
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const { user } = useAuthStore()
    const { roles, loading: rolesLoading } = useRoles()

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CreateUserFormData>({
        defaultValues: {
            email: "",
            first_name: "",
            last_name: "",
            phone: "",
            role: "",
            password: "",
            send_invitation: true,
        },
    })

    useEffect(() => {
        if (roles.length > 0) {
            reset((prev) => ({
                ...prev,
                role: prev.role || roles[0].id,
            }))
        }
    }, [roles, reset])

    const onSubmit = async (formData: CreateUserFormData) => {
        if (!user?.tenant_id) {
            toast.error("لم يتم العثور على معرف المؤسسة")
            return
        }

        setLoading(true)
        try {
            const result = await createUser(
                {
                    email: formData.email,
                    tenant_id: user.tenant_id,
                    role: formData.role,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    phone: formData.phone || undefined,
                    password: formData.password || undefined,
                    send_invitation: formData.send_invitation,
                    is_active: true,
                },
                user.tenant_id
            )

            if (result.success) {
                toast.success(result.message || "تم إنشاء المستخدم بنجاح")
                if (result.data.temp_password) {
                    toast.info(`كلمة المرور المؤقتة: ${result.data.temp_password}`, { duration: 10000 })
                }
                reset()
                onSuccess()
                onClose()
            }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } }
            toast.error(error.response?.data?.message || "فشل إنشاء المستخدم")
        } finally {
            setLoading(false)
        }
    }

    if (!open) return null

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
                    background: "var(--t-brand-orange)",
                    padding: "16px 20px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: "rgba(255,255,255,0.15)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <UserPlus size={18} style={{ color: "#fff" }} />
                        </div>
                        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>إضافة مستخدم جديد</h2>
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

                {/* ── Form ── */}
                <form onSubmit={handleSubmit(onSubmit)} style={{ padding: "20px 20px 16px" }}>
                    <div className="space-y-4">
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
                                    placeholder="أحمد"
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
                                    placeholder="محمد"
                                />
                                {errors.last_name && <p className="mt-1 text-xs text-red-500">{errors.last_name.message}</p>}
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-gray-600">البريد الإلكتروني *</label>
                            <input
                                {...register("email", {
                                    required: "مطلوب",
                                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "بريد غير صالح" },
                                })}
                                type="email"
                                dir="ltr"
                                className={inputCls}
                                placeholder="user@example.com"
                            />
                            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                        </div>

                        {/* Phone & Role row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-600">رقم الهاتف</label>
                                <input
                                    {...register("phone")}
                                    dir="ltr"
                                    className={inputCls}
                                    placeholder="+967..."
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                                    <Shield size={12} style={{ color: "var(--t-accent)" }} />
                                    الدور *
                                </label>
                                {rolesLoading ? (
                                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                                        <Loader2 size={14} className="animate-spin text-gray-400" />
                                        <span className="text-sm text-gray-400">تحميل...</span>
                                    </div>
                                ) : (
                                    <select
                                        {...register("role", { required: "مطلوب" })}
                                        className={inputCls}
                                    >
                                        <option value="" disabled>اختر الدور</option>
                                        {roles.map((r) => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                )}
                                {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>}
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                                كلمة المرور <span className="text-gray-400 font-normal">(اختياري — يتم توليدها تلقائياً)</span>
                            </label>
                            <div className="relative">
                                <input
                                    {...register("password")}
                                    type={showPassword ? "text" : "password"}
                                    dir="ltr"
                                    className={`${inputCls} pl-10`}
                                    placeholder="اتركه فارغاً للتوليد التلقائي"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        {/* Send invitation */}
                        <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                                type="checkbox"
                                {...register("send_invitation")}
                                style={{ accentColor: "var(--t-accent)" }}
                                className="h-4 w-4 rounded"
                            />
                            <span className="text-xs text-gray-600 font-medium">إرسال دعوة بالبريد الإلكتروني</span>
                        </label>
                    </div>

                    {/* ── Actions ── */}
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "flex-end",
                        gap: 8, marginTop: 18, paddingTop: 14,
                        borderTop: "1px solid var(--t-border-light, #eaedf0)",
                    }}>
                        <button type="button" onClick={onClose} style={{
                            padding: "8px 18px", borderRadius: 9, border: "1px solid var(--t-border, #dcdfe3)",
                            background: "var(--t-card, #fff)", color: "var(--t-text-secondary, var(--t-text-muted))",
                            fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                        }}>إلغاء</button>
                        <button type="submit" disabled={loading || rolesLoading} style={{
                            padding: "8px 20px", borderRadius: 9, border: "none",
                            background: "var(--t-brand-orange)", color: "#fff",
                            fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                            display: "flex", alignItems: "center", gap: 5,
                            opacity: (loading || rolesLoading) ? 0.5 : 1,
                            boxShadow: "0 1px 3px rgba(27,80,145,0.15)",
                        }}>
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                            إنشاء المستخدم
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
