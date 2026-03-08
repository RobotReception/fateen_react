import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Eye, EyeOff, UserPlus, Loader2 } from "lucide-react"
import { registerInitial } from "@/features/auth/services/auth-service"
import { useAuthStore } from "@/stores/auth-store"
import { AuthLayout } from "@/features/auth/components/AuthLayout"

export function RegisterPage() {
    const navigate = useNavigate()
    const setRegistrationData = useAuthStore((s) => s.setRegistrationData)

    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [touched, setTouched] = useState<Record<string, boolean>>({})
    const [submitted, setSubmitted] = useState(false)

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    const fieldErrors = {
        firstName: !firstName.trim() ? "الاسم الأول مطلوب" : firstName.trim().length < 2 ? "الاسم قصير جداً" : "",
        lastName: !lastName.trim() ? "الاسم الأخير مطلوب" : lastName.trim().length < 2 ? "الاسم قصير جداً" : "",
        email: !email.trim() ? "البريد الإلكتروني مطلوب" : !emailRegex.test(email) ? "صيغة البريد غير صحيحة" : "",
        password: !password ? "كلمة المرور مطلوبة" : password.length < 8 ? "يجب أن تكون 8 أحرف على الأقل" : !/[a-zA-Z]/.test(password) || !/\d/.test(password) ? "يجب أن تحتوي على أحرف وأرقام" : "",
        confirmPassword: !confirmPassword ? "تأكيد كلمة المرور مطلوب" : password !== confirmPassword ? "كلمتا المرور غير متطابقتين" : "",
    }

    const showFieldError = (field: keyof typeof fieldErrors) =>
        (submitted || touched[field]) && fieldErrors[field]

    const fieldClass = (field: keyof typeof fieldErrors, extra = "") =>
        `w-full rounded-xl border ${showFieldError(field) ? "border-red-400 bg-red-50/30" : "border-gray-200 bg-gray-50/50"} px-4 py-3 text-sm text-gray-900 outline-none transition-all duration-300 placeholder:text-gray-400 focus:border-[#0098d6]/50 focus:bg-white focus:ring-2 focus:ring-[#0098d6]/10 ${extra}`

    const handleBlur = (field: string) => setTouched(p => ({ ...p, [field]: true }))

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError("")

        setSubmitted(true)

        const hasErrors = Object.values(fieldErrors).some(e => e)
        if (hasErrors) return

        setLoading(true)
        try {
            const res = await registerInitial({
                email,
                password,
                first_name: firstName,
                last_name: lastName,
            })

            // Store registration data for verification step
            setRegistrationData(res.data.user_id, res.data.email)
            navigate("/verify-email")
        } catch (err: any) {
            const status = err.response?.status
            if (status === 409) {
                setError("البريد الإلكتروني مسجّل مسبقًا. يمكنك تسجيل الدخول")
            } else if (!err.response) {
                setError("لا يمكن الاتصال بالخادم. تحقق من اتصال الإنترنت")
            } else {
                setError(err.response?.data?.message || "حدث خطأ غير متوقع. حاول مرة أخرى")
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout>
            <div className="mb-8 text-center">
                <h1 className="mb-2 text-2xl font-bold text-gray-900">إنشاء حساب جديد</h1>
                <p className="text-sm text-gray-500">ابدأ رحلتك مع فطين في دقائق</p>
            </div>

            {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name row */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-gray-700">
                            الاسم الأول
                        </label>
                        <input
                            id="firstName"
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            onBlur={() => handleBlur("firstName")}
                            placeholder="أحمد"
                            className={fieldClass("firstName")}
                        />
                        {showFieldError("firstName") && <p className="mt-1 text-xs text-red-500">{fieldErrors.firstName}</p>}
                    </div>
                    <div>
                        <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-gray-700">
                            الاسم الأخير
                        </label>
                        <input
                            id="lastName"
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            onBlur={() => handleBlur("lastName")}
                            placeholder="محمد"
                            className={fieldClass("lastName")}
                        />
                        {showFieldError("lastName") && <p className="mt-1 text-xs text-red-500">{fieldErrors.lastName}</p>}
                    </div>
                </div>

                {/* Email */}
                <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                        البريد الإلكتروني
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => handleBlur("email")}
                        placeholder="example@company.com"
                        className={fieldClass("email")}
                        dir="ltr"
                    />
                    {showFieldError("email") && <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>}
                </div>

                {/* Password */}
                <div>
                    <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                        كلمة المرور
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onBlur={() => handleBlur("password")}
                            placeholder="8 أحرف على الأقل"
                            className={fieldClass("password", "pl-12")}
                            dir="ltr"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {showFieldError("password") && <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                    <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-gray-700">
                        تأكيد كلمة المرور
                    </label>
                    <input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onBlur={() => handleBlur("confirmPassword")}
                        placeholder="أعد كتابة كلمة المرور"
                        className={fieldClass("confirmPassword")}
                        dir="ltr"
                    />
                    {showFieldError("confirmPassword") && <p className="mt-1 text-xs text-red-500">{fieldErrors.confirmPassword}</p>}
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="group relative mt-2 w-full overflow-hidden rounded-xl bg-gradient-to-l from-[#0098d6] to-[#004786] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#0098d6]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[#0098d6]/30 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <UserPlus className="h-4 w-4" />
                        )}
                        {loading ? "جاري الإنشاء..." : "إنشاء الحساب"}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-l from-[#00b4ff] to-[#0066aa] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs text-gray-400">أو</span>
                <div className="h-px flex-1 bg-gray-200" />
            </div>

            {/* Login link */}
            <p className="text-center text-sm text-gray-500">
                لديك حساب بالفعل؟{" "}
                <Link to="/login" className="font-semibold text-[#0098d6] transition-colors hover:text-[#004786]">
                    سجّل الدخول
                </Link>
            </p>
        </AuthLayout>
    )
}
