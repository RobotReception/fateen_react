import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { X, KeyRound, Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react"
import { adminSetPassword } from "../services/users-service"
import { useAuthStore } from "@/stores/auth-store"
import type { AdminUser } from "../types"

interface SetPasswordFormData {
    new_password: string
    confirm_password: string
}

interface SetPasswordDialogProps {
    open: boolean
    targetUser: AdminUser | null
    onClose: () => void
}

const CSS = `@keyframes dlgSlide{from{opacity:0;transform:translateY(16px) scale(0.97)}to{opacity:1;transform:none}}`

const inputCls = `w-full rounded-lg border border-gray-200 bg-[var(--t-surface,#fafafa)] px-3.5 py-2.5 text-sm text-[var(--t-text,#111827)]
    outline-none transition-all placeholder:text-gray-400
    focus:border-[#004786] focus:bg-white focus:ring-2 focus:ring-[#004786]/10`

export function SetPasswordDialog({ open, targetUser, onClose }: SetPasswordDialogProps) {
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const { user } = useAuthStore()

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<SetPasswordFormData>()

    const onSubmit = async (formData: SetPasswordFormData) => {
        if (!user?.tenant_id || !targetUser) return

        setLoading(true)
        try {
            const result = await adminSetPassword(
                {
                    user_id: targetUser.user_id,
                    new_password: formData.new_password,
                },
                user.tenant_id
            )

            if (result.success) {
                toast.success(result.message || "تم تعيين كلمة المرور بنجاح")
                reset()
                onClose()
            }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } }
            toast.error(error.response?.data?.message || "فشل تعيين كلمة المرور")
        } finally {
            setLoading(false)
        }
    }

    if (!open || !targetUser) return null

    const userName = targetUser.full_name || `${targetUser.first_name || ""} ${targetUser.last_name || ""}`.trim() || targetUser.email

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <style>{CSS}</style>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div
                className="relative z-10 w-full max-w-md bg-white shadow-2xl"
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
                            <KeyRound size={18} style={{ color: "#fff" }} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>تعيين كلمة مرور</h2>
                            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", margin: "2px 0 0" }}>{userName}</p>
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
                    {/* ── Warning ── */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "10px 12px", borderRadius: 9, marginBottom: 16,
                        background: "rgba(217,119,6,0.06)",
                        border: "1px solid rgba(217,119,6,0.15)",
                    }}>
                        <AlertTriangle size={14} style={{ color: "#d97706", flexShrink: 0 }} />
                        <p style={{ fontSize: 11, color: "#92400e", margin: 0, lineHeight: 1.5 }}>
                            سيتم تغيير كلمة مرور المستخدم مباشرة بدون الحاجة لرمز تحقق.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* New Password */}
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-gray-600">كلمة المرور الجديدة *</label>
                            <div className="relative">
                                <input
                                    {...register("new_password", {
                                        required: "مطلوب",
                                        minLength: { value: 8, message: "على الأقل 8 أحرف" },
                                    })}
                                    type={showPassword ? "text" : "password"}
                                    dir="ltr"
                                    className={`${inputCls} pl-10`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                            {errors.new_password && <p className="mt-1 text-xs text-red-500">{errors.new_password.message}</p>}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-gray-600">تأكيد كلمة المرور *</label>
                            <input
                                {...register("confirm_password", {
                                    required: "مطلوب",
                                    validate: (val) => val === watch("new_password") || "كلمتا المرور غير متطابقتين",
                                })}
                                type={showPassword ? "text" : "password"}
                                dir="ltr"
                                className={inputCls}
                            />
                            {errors.confirm_password && <p className="mt-1 text-xs text-red-500">{errors.confirm_password.message}</p>}
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
                                {loading ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                                تعيين كلمة المرور
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
