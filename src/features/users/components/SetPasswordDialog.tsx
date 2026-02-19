import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { X, KeyRound, Eye, EyeOff, Loader2 } from "lucide-react"
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

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div
                className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                dir="rtl"
                style={{ animation: "fadeSlideUp 0.3s ease-out" }}
            >
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900">
                            <KeyRound size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">تعيين كلمة مرور</h2>
                            <p className="text-xs text-gray-400">{targetUser.full_name || `${targetUser.first_name || ""} ${targetUser.last_name || ""}`.trim() || targetUser.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Warning */}
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-xs text-amber-700">
                        ⚠️ سيتم تغيير كلمة مرور المستخدم مباشرة بدون الحاجة لرمز تحقق.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* New Password */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">كلمة المرور الجديدة *</label>
                        <div className="relative">
                            <input
                                {...register("new_password", {
                                    required: "مطلوب",
                                    minLength: { value: 8, message: "على الأقل 8 أحرف" },
                                })}
                                type={showPassword ? "text" : "password"}
                                dir="ltr"
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 pl-10 text-sm outline-none transition-all focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.new_password && <p className="mt-1 text-xs text-red-500">{errors.new_password.message}</p>}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">تأكيد كلمة المرور *</label>
                        <input
                            {...register("confirm_password", {
                                required: "مطلوب",
                                validate: (val) => val === watch("new_password") || "كلمتا المرور غير متطابقتين",
                            })}
                            type={showPassword ? "text" : "password"}
                            dir="ltr"
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition-all focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20"
                        />
                        {errors.confirm_password && <p className="mt-1 text-xs text-red-500">{errors.confirm_password.message}</p>}
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
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                            تعيين كلمة المرور
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
