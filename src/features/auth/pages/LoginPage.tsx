import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Eye, EyeOff, LogIn, Loader2, Building2, ArrowRight, ShieldCheck, User, Crown } from "lucide-react"
import { login, type TenantInfo } from "@/features/auth/services/auth-service"
import { useAuthStore } from "@/stores/auth-store"
import { AuthLayout } from "@/features/auth/components/AuthLayout"

/* ── Role badge helper ── */
const ROLE_CONFIG: Record<string, { label: string; icon: typeof Crown; color: string; bg: string }> = {
    owner: { label: "مالك", icon: Crown, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    admin: { label: "مدير", icon: ShieldCheck, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
    user: { label: "مستخدم", icon: User, color: "text-gray-600", bg: "bg-gray-50 border-gray-200" },
}

function getRoleConfig(role: string) {
    return ROLE_CONFIG[role] || ROLE_CONFIG.user
}

export function LoginPage() {
    const navigate = useNavigate()
    const { login: authLogin, setRegistrationData } = useAuthStore()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    // ── Multi-tenant state ──
    const [tenants, setTenants] = useState<TenantInfo[]>([])
    const [showTenantPicker, setShowTenantPicker] = useState(false)
    const [selectingTenantId, setSelectingTenantId] = useState<string | null>(null)

    /** Completes login using standard user+token response */
    const completeLogin = (data: any) => {
        const { user, token, refresh_token } = data

        if (!user.onboarding_complete) {
            setRegistrationData(user.id, user.email)
            navigate("/onboarding")
            return
        }

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
    }

    /** First login attempt — may return tenant selection */
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError("")

        if (!email || !password) {
            setError("يرجى ملء جميع الحقول")
            return
        }

        setLoading(true)
        try {
            const result = await login({ email, password })

            if ("requires_tenant_selection" in result.data && result.data.requires_tenant_selection) {
                // Multi-tenant — show picker
                setTenants(result.data.tenants)
                setShowTenantPicker(true)
            } else {
                // Single tenant — direct login
                completeLogin(result.data)
            }
        } catch (err: any) {
            const msg = err.response?.data?.message
            const status = err.response?.status
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

    /** Second login — with selected tenant_id */
    const handleTenantSelect = async (tenantId: string) => {
        setError("")
        setSelectingTenantId(tenantId)
        try {
            const result = await login({ email, password, tenant_id: tenantId })

            if ("token" in result.data) {
                completeLogin(result.data)
                // Clear password from memory after successful login
                setPassword("")
            }
        } catch (err: any) {
            const msg = err.response?.data?.message
            setError(msg || "حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى")
        } finally {
            setSelectingTenantId(null)
        }
    }

    /** Go back from tenant picker to login form */
    const handleBackToLogin = () => {
        setShowTenantPicker(false)
        setTenants([])
        setSelectingTenantId(null)
        setError("")
    }

    // ═══════════════════════════════════════════════
    //  RENDER — Tenant Picker
    // ═══════════════════════════════════════════════
    if (showTenantPicker) {
        return (
            <AuthLayout>
                <div className="mb-6 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0098d6]/10 to-[#004786]/10">
                        <Building2 className="h-7 w-7 text-[#0098d6]" />
                    </div>
                    <h1 className="mb-1.5 text-xl font-bold text-gray-900">
                        اختر الشركة
                    </h1>
                    <p className="text-sm text-gray-500">
                        حسابك مرتبط بعدة شركات، اختر الشركة التي تريد الدخول إليها
                    </p>
                </div>

                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <div className="space-y-3">
                    {tenants.map((tenant) => {
                        const roleConfig = getRoleConfig(tenant.role)
                        const RoleIcon = roleConfig.icon
                        const isSelecting = selectingTenantId === tenant.tenant_id
                        const isDisabled = selectingTenantId !== null

                        return (
                            <button
                                key={tenant.tenant_id}
                                onClick={() => handleTenantSelect(tenant.tenant_id)}
                                disabled={isDisabled}
                                className={`group relative w-full rounded-xl border-2 p-4 text-right transition-all duration-300 ${isSelecting
                                    ? "border-[#0098d6] bg-[#0098d6]/5 shadow-md shadow-[#0098d6]/10"
                                    : isDisabled
                                        ? "cursor-not-allowed border-gray-100 bg-gray-50/50 opacity-60"
                                        : "border-gray-100 bg-white hover:border-[#0098d6]/40 hover:bg-[#0098d6]/[0.02] hover:shadow-md hover:shadow-[#0098d6]/5"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    {/* Company icon */}
                                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${isSelecting
                                        ? "bg-[#0098d6] text-white"
                                        : "bg-gray-100 text-gray-500 group-hover:bg-[#0098d6]/10 group-hover:text-[#0098d6]"
                                        }`}>
                                        {isSelecting ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <Building2 className="h-5 w-5" />
                                        )}
                                    </div>

                                    {/* Company info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                            {tenant.organization_name}
                                        </p>
                                        <p className="text-xs text-gray-400 truncate mt-0.5" dir="ltr">
                                            {tenant.tenant_id}
                                        </p>
                                        <div className="mt-1 flex items-center gap-1.5">
                                            <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${roleConfig.bg} ${roleConfig.color}`}>
                                                <RoleIcon className="h-3 w-3" />
                                                {roleConfig.label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <ArrowRight className={`h-4 w-4 shrink-0 rotate-180 text-gray-300 transition-all duration-300 ${!isDisabled ? "group-hover:text-[#0098d6] group-hover:-translate-x-1" : ""
                                        }`} />
                                </div>
                            </button>
                        )
                    })}
                </div>

                {/* Back button */}
                <button
                    onClick={handleBackToLogin}
                    disabled={selectingTenantId !== null}
                    className="mt-5 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-600 transition-all duration-300 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    رجوع لتسجيل الدخول
                </button>
            </AuthLayout>
        )
    }

    // ═══════════════════════════════════════════════
    //  RENDER — Login Form (original, unchanged)
    // ═══════════════════════════════════════════════
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
