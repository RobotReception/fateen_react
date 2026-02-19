import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react"
import { login } from "@/features/auth/services/auth-service"
import { useAuthStore } from "@/stores/auth-store"
import { AuthLayout } from "@/features/auth/components/AuthLayout"

export function LoginPage() {
    const navigate = useNavigate()
    const { login: authLogin, setRegistrationData } = useAuthStore()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError("")

        if (!email || !password) {
            setError("يرجى ملء جميع الحقول")
            return
        }

        setLoading(true)
        try {
            const res = await login({ email, password })
            const { user, token, refresh_token } = res.data

            // Route based on account state
            if (!user.email_verified) {
                setRegistrationData(user.id, user.email)
                navigate("/verify-email")
                return
            }

            if (!user.onboarding_complete) {
                setRegistrationData(user.id, user.email)
                navigate("/onboarding")
                return
            }

            // Fully onboarded user — store and go to dashboard
            authLogin(
                {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    tenant_id: user.tenant_id,
                    role: user.role,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    phone: user.phone,
                    profile_picture: user.profile_picture,
                    email_verified: user.email_verified,
                    onboarding_complete: user.onboarding_complete,
                    pageWithPermission: user.pageWithPermission,
                },
                token,
                refresh_token
            )

            navigate("/dashboard")
        } catch (err: any) {
            const status = err.response?.status
            const msg = err.response?.data?.message
            if (status === 400) {
                setError("البريد الإلكتروني أو كلمة المرور غير صحيحة")
            } else if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
                setError("انتهت مهلة الاتصال. تحقق من اتصال الإنترنت")
            } else if (!err.response) {
                setError("لا يمكن الاتصال بالخادم. تحقق من اتصال الإنترنت")
            } else {
                setError(msg || "حدث خطأ غير متوقع. حاول مرة أخرى")
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout>
            <div className="mb-8 text-center">
                <h1 className="mb-2 text-2xl font-bold text-gray-900">مرحبًا بعودتك</h1>
                <p className="text-sm text-gray-500">سجّل دخولك للوصول إلى لوحة التحكم</p>
            </div>

            {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
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
                        placeholder="example@company.com"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 outline-none transition-all duration-300 placeholder:text-gray-400 focus:border-[#0098d6]/50 focus:bg-white focus:ring-2 focus:ring-[#0098d6]/10"
                        dir="ltr"
                    />
                </div>

                {/* Password */}
                <div>
                    <div className="mb-1.5 flex items-center justify-between">
                        <label htmlFor="password" className="text-sm font-medium text-gray-700">
                            كلمة المرور
                        </label>
                        <Link
                            to="/forgot-password"
                            className="text-xs text-[#0098d6] transition-colors hover:text-[#004786]"
                        >
                            نسيت كلمة المرور؟
                        </Link>
                    </div>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 pl-12 text-sm text-gray-900 outline-none transition-all duration-300 placeholder:text-gray-400 focus:border-[#0098d6]/50 focus:bg-white focus:ring-2 focus:ring-[#0098d6]/10"
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
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-l from-[#0098d6] to-[#004786] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#0098d6]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[#0098d6]/30 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <LogIn className="h-4 w-4" />
                        )}
                        {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
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

            {/* Register link */}
            <p className="text-center text-sm text-gray-500">
                ليس لديك حساب؟{" "}
                <Link to="/register" className="font-semibold text-[#0098d6] transition-colors hover:text-[#004786]">
                    أنشئ حساب جديد
                </Link>
            </p>
        </AuthLayout>
    )
}
