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

    // Set default role when roles load
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
                            <UserPlus size={20} className="text-white" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-800">إضافة مستخدم جديد</h2>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <X size={20} />
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
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition-all focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20"
                                placeholder="أحمد"
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
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition-all focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20"
                                placeholder="محمد"
                            />
                            {errors.last_name && <p className="mt-1 text-xs text-red-500">{errors.last_name.message}</p>}
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">البريد الإلكتروني *</label>
                        <input
                            {...register("email", {
                                required: "مطلوب",
                                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "بريد غير صالح" },
                            })}
                            type="email"
                            dir="ltr"
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition-all focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20"
                            placeholder="user@example.com"
                        />
                        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                    </div>

                    {/* Phone & Role row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">رقم الهاتف</label>
                            <input
                                {...register("phone")}
                                dir="ltr"
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition-all focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20"
                                placeholder="+967..."
                            />
                        </div>
                        <div>
                            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Shield size={14} className="text-cyan-500" />
                                الدور *
                            </label>
                            {rolesLoading ? (
                                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                                    <Loader2 size={14} className="animate-spin text-gray-400" />
                                    <span className="text-sm text-gray-400">تحميل...</span>
                                </div>
                            ) : (
                                <select
                                    {...register("role", { required: "مطلوب" })}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition-all focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20"
                                >
                                    <option value="" disabled>
                                        اختر الدور
                                    </option>
                                    {roles.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>}
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">كلمة المرور <span className="text-xs text-gray-400">(اختياري — يتم توليدها تلقائياً)</span></label>
                        <div className="relative">
                            <input
                                {...register("password")}
                                type={showPassword ? "text" : "password"}
                                dir="ltr"
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 pl-10 text-sm outline-none transition-all focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20"
                                placeholder="اتركه فارغاً للتوليد التلقائي"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Send invitation */}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            {...register("send_invitation")}
                            className="h-4 w-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500/20"
                        />
                        <span className="text-sm text-gray-600">إرسال دعوة بالبريد الإلكتروني</span>
                    </label>

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
                            disabled={loading || rolesLoading}
                            className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-gray-800 disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                            إنشاء المستخدم
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
