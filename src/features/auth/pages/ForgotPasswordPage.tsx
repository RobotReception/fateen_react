import { useState, useEffect, useRef, type FormEvent, type KeyboardEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { KeyRound, Loader2, RotateCcw, ShieldCheck, CheckCircle2, Eye, EyeOff } from "lucide-react"
import {
    requestPasswordReset,
    verifyEmail,
    confirmPasswordReset,
} from "@/features/auth/services/auth-service"
import { AuthLayout } from "@/features/auth/components/AuthLayout"

const OTP_LENGTH = 6

export function ForgotPasswordPage() {
    const navigate = useNavigate()
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1) // 1=email, 2=otp, 3=new password, 4=done
    const [email, setEmail] = useState("")
    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""))
    const [verificationToken, setVerificationToken] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [countdown, setCountdown] = useState(0)

    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    // Countdown timer
    useEffect(() => {
        if (countdown <= 0) return
        const timer = setInterval(() => setCountdown((c) => c - 1), 1000)
        return () => clearInterval(timer)
    }, [countdown])

    /* ── Step 1: Request OTP ── */
    const handleRequestOtp = async (e: FormEvent) => {
        e.preventDefault()
        if (!email) { setError("يرجى إدخال البريد الإلكتروني"); return }
        setError("")
        setLoading(true)
        try {
            await requestPasswordReset(email)
            setStep(2)
            setCountdown(60)
        } catch (err: any) {
            const status = err.response?.status
            if (status === 404) setError("البريد الإلكتروني غير مسجل")
            else if (status === 429) setError("لقد تجاوزت الحد المسموح. انتظر 10 دقائق")
            else if (!err.response) setError("لا يمكن الاتصال بالخادم. تحقق من اتصال الإنترنت")
            else setError("حدث خطأ. حاول مرة أخرى")
        } finally {
            setLoading(false)
        }
    }

    /* ── Step 2: Verify OTP ── */
    const handleVerifyOtp = async () => {
        const code = otp.join("")
        if (code.length !== OTP_LENGTH) { setError("يرجى إدخال الرمز كاملاً"); return }
        setError("")
        setLoading(true)
        try {
            const res = await verifyEmail({
                email,
                verification_token: code,
                purpose: "reset_password",
            })
            setVerificationToken(res.data.verification_token || "")
            setStep(3)
        } catch (err: any) {
            setError(err.response?.data?.message || "رمز التحقق غير صحيح")
            setOtp(Array(OTP_LENGTH).fill(""))
            inputRefs.current[0]?.focus()
        } finally {
            setLoading(false)
        }
    }

    /* ── Step 3: Set new password ── */
    const handleResetPassword = async (e: FormEvent) => {
        e.preventDefault()
        if (!newPassword || newPassword.length < 8) {
            setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل")
            return
        }
        if (newPassword !== confirmPassword) {
            setError("كلمتا المرور غير متطابقتين")
            return
        }
        setError("")
        setLoading(true)
        try {
            await confirmPasswordReset(email, verificationToken, newPassword)
            setStep(4)
        } catch (err: any) {
            setError(err.response?.data?.message || "فشل في تغيير كلمة المرور. حاول مرة أخرى")
        } finally {
            setLoading(false)
        }
    }

    /* ── OTP Helpers ── */
    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return
        const newOtp = [...otp]
        newOtp[index] = value.slice(-1)
        setOtp(newOtp)
        if (value && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus()
    }

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus()
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault()
        const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH)
        if (!text) return
        const newOtp = [...otp]
        text.split("").forEach((ch, i) => { newOtp[i] = ch })
        setOtp(newOtp)
        inputRefs.current[Math.min(text.length, OTP_LENGTH - 1)]?.focus()
    }

    const handleResend = async () => {
        if (countdown > 0) return
        setLoading(true)
        setError("")
        try {
            await requestPasswordReset(email)
            setCountdown(60)
            setOtp(Array(OTP_LENGTH).fill(""))
            inputRefs.current[0]?.focus()
        } catch {
            setError("فشل في إعادة إرسال الرمز")
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout>
            {/* ─── Step 1: Enter Email ─── */}
            {step === 1 && (
                <>
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0098d6]/10 to-[#004786]/10">
                        <KeyRound className="h-8 w-8 text-[#0098d6]" />
                    </div>
                    <div className="mb-8 text-center">
                        <h1 className="mb-2 text-2xl font-bold text-gray-900">نسيت كلمة المرور؟</h1>
                        <p className="text-sm text-gray-500">أدخل بريدك الإلكتروني لإرسال رمز التحقق</p>
                    </div>

                    {error && (
                        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
                    )}

                    <form onSubmit={handleRequestOtp} className="space-y-5">
                        <div>
                            <label htmlFor="reset-email" className="mb-1.5 block text-sm font-medium text-gray-700">البريد الإلكتروني</label>
                            <input
                                id="reset-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="example@company.com"
                                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 outline-none transition-all duration-300 placeholder:text-gray-400 focus:border-[#0098d6]/50 focus:bg-white focus:ring-2 focus:ring-[#0098d6]/10"
                                dir="ltr"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-l from-[#0098d6] to-[#004786] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#0098d6]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[#0098d6]/30 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                                {loading ? "جاري الإرسال..." : "إرسال رمز التحقق"}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-l from-[#00b4ff] to-[#0066aa] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                        </button>
                    </form>
                </>
            )}

            {/* ─── Step 2: Enter OTP ─── */}
            {step === 2 && (
                <>
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0098d6]/10 to-[#004786]/10">
                        <ShieldCheck className="h-8 w-8 text-[#0098d6]" />
                    </div>
                    <div className="mb-8 text-center">
                        <h1 className="mb-2 text-2xl font-bold text-gray-900">أدخل رمز التحقق</h1>
                        <p className="text-sm text-gray-500">تم إرسال رمز التحقق إلى</p>
                        <p className="mt-1 text-sm font-medium text-[#0098d6]" dir="ltr">{email}</p>
                    </div>

                    {error && (
                        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
                    )}

                    <div className="mb-6 flex items-center justify-center gap-3" dir="ltr" onPaste={handlePaste}>
                        {otp.map((digit, i) => (
                            <input
                                key={i}
                                ref={(el) => { inputRefs.current[i] = el }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(i, e)}
                                className="h-14 w-12 rounded-xl border border-gray-200 bg-gray-50/50 text-center text-xl font-bold text-gray-900 outline-none transition-all duration-300 focus:border-[#0098d6]/50 focus:bg-white focus:ring-2 focus:ring-[#0098d6]/10"
                            />
                        ))}
                    </div>

                    <button
                        onClick={handleVerifyOtp}
                        disabled={loading || otp.some((d) => !d)}
                        className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-l from-[#0098d6] to-[#004786] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#0098d6]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[#0098d6]/30 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                            {loading ? "جاري التحقق..." : "تأكيد الرمز"}
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-l from-[#00b4ff] to-[#0066aa] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    </button>

                    <div className="mt-6 text-center">
                        {countdown > 0 ? (
                            <p className="text-sm text-gray-400">إعادة إرسال خلال <span className="font-semibold text-gray-600">{countdown}</span> ثانية</p>
                        ) : (
                            <button onClick={handleResend} disabled={loading} className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0098d6] hover:text-[#004786] disabled:opacity-50">
                                <RotateCcw className="h-3.5 w-3.5" /> إعادة إرسال الرمز
                            </button>
                        )}
                    </div>
                </>
            )}

            {/* ─── Step 3: New Password ─── */}
            {step === 3 && (
                <>
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0098d6]/10 to-[#004786]/10">
                        <KeyRound className="h-8 w-8 text-[#0098d6]" />
                    </div>
                    <div className="mb-8 text-center">
                        <h1 className="mb-2 text-2xl font-bold text-gray-900">كلمة مرور جديدة</h1>
                        <p className="text-sm text-gray-500">أدخل كلمة المرور الجديدة</p>
                    </div>

                    {error && (
                        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
                    )}

                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700">كلمة المرور الجديدة</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="8 أحرف على الأقل"
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 pl-12 text-sm text-gray-900 outline-none transition-all duration-300 placeholder:text-gray-400 focus:border-[#0098d6]/50 focus:bg-white focus:ring-2 focus:ring-[#0098d6]/10"
                                    dir="ltr"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700">تأكيد كلمة المرور</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="أعد كتابة كلمة المرور"
                                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 outline-none transition-all duration-300 placeholder:text-gray-400 focus:border-[#0098d6]/50 focus:bg-white focus:ring-2 focus:ring-[#0098d6]/10"
                                dir="ltr"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative mt-2 w-full overflow-hidden rounded-xl bg-gradient-to-l from-[#0098d6] to-[#004786] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#0098d6]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[#0098d6]/30 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                                {loading ? "جاري التحديث..." : "تحديث كلمة المرور"}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-l from-[#00b4ff] to-[#0066aa] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                        </button>
                    </form>
                </>
            )}

            {/* ─── Step 4: Success ─── */}
            {step === 4 && (
                <div className="text-center">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                    </div>
                    <h1 className="mb-2 text-2xl font-bold text-gray-900">تم بنجاح!</h1>
                    <p className="mb-8 text-sm text-gray-500">تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن</p>
                    <Link
                        to="/login"
                        className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-l from-[#0098d6] to-[#004786] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#0098d6]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[#0098d6]/30 hover:-translate-y-0.5"
                    >
                        <span className="relative z-10">تسجيل الدخول</span>
                        <div className="absolute inset-0 bg-gradient-to-l from-[#00b4ff] to-[#0066aa] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    </Link>
                </div>
            )}

            {/* Back to login (steps 1-3) */}
            {step < 4 && (
                <div className="mt-6 text-center">
                    <Link to="/login" className="text-sm text-gray-500 transition-colors hover:text-[#0098d6]">
                        ← العودة لتسجيل الدخول
                    </Link>
                </div>
            )}
        </AuthLayout>
    )
}
