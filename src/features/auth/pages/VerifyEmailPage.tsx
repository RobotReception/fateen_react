import { useState, useRef, useEffect, type KeyboardEvent } from "react"
import { useNavigate } from "react-router-dom"
import { ShieldCheck, Loader2, RotateCcw } from "lucide-react"
import { verifyEmail, resendVerificationEmail } from "@/features/auth/services/auth-service"
import { useAuthStore } from "@/stores/auth-store"
import { AuthLayout } from "@/features/auth/components/AuthLayout"

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 60

export function VerifyEmailPage() {
    const navigate = useNavigate()
    const { registrationEmail, registrationUserId } = useAuthStore()

    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""))
    const [loading, setLoading] = useState(false)
    const [resending, setResending] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [countdown, setCountdown] = useState(RESEND_COOLDOWN)

    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    // Redirect if no registration data
    useEffect(() => {
        if (!registrationEmail) {
            navigate("/register")
        }
    }, [registrationEmail, navigate])

    // Countdown timer
    useEffect(() => {
        if (countdown <= 0) return
        const timer = setInterval(() => setCountdown((c) => c - 1), 1000)
        return () => clearInterval(timer)
    }, [countdown])

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return

        const newOtp = [...otp]
        newOtp[index] = value.slice(-1)
        setOtp(newOtp)

        // Auto-focus next input
        if (value && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
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

    const handleSubmit = async () => {
        const code = otp.join("")
        if (code.length !== OTP_LENGTH) {
            setError("يرجى إدخال الرمز كاملاً")
            return
        }

        setError("")
        setLoading(true)
        try {
            await verifyEmail({
                email: registrationEmail!,
                verification_token: code,
                purpose: "email_verification",
            })
            setSuccess("تم التحقق من البريد الإلكتروني بنجاح!")
            setTimeout(() => navigate("/onboarding"), 1500)
        } catch (err: any) {
            setError(err.response?.data?.message || "رمز التحقق غير صحيح. حاول مرة أخرى")
            setOtp(Array(OTP_LENGTH).fill(""))
            inputRefs.current[0]?.focus()
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        if (countdown > 0 || resending) return
        setResending(true)
        setError("")
        try {
            await resendVerificationEmail(registrationEmail!)
            setSuccess("تم إرسال رمز جديد إلى بريدك الإلكتروني")
            setCountdown(RESEND_COOLDOWN)
            setOtp(Array(OTP_LENGTH).fill(""))
            inputRefs.current[0]?.focus()
            setTimeout(() => setSuccess(""), 3000)
        } catch (err: any) {
            const status = err.response?.status
            if (status === 429) {
                setError("لقد تجاوزت الحد المسموح. انتظر 10 دقائق")
            } else {
                setError("فشل في إرسال الرمز. حاول مرة أخرى")
            }
        } finally {
            setResending(false)
        }
    }

    // Auto-submit when all digits entered
    useEffect(() => {
        if (otp.every((d) => d !== "") && !loading) {
            handleSubmit()
        }
    }, [otp])

    const maskedEmail = registrationEmail
        ? registrationEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3")
        : ""

    return (
        <AuthLayout>
            {/* Icon */}
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0098d6]/10 to-[#004786]/10">
                <ShieldCheck className="h-8 w-8 text-[#0098d6]" />
            </div>

            <div className="mb-8 text-center">
                <h1 className="mb-2 text-2xl font-bold text-gray-900">التحقق من البريد</h1>
                <p className="text-sm text-gray-500">
                    أدخل رمز التحقق المرسل إلى
                </p>
                <p className="mt-1 text-sm font-medium text-[#0098d6]" dir="ltr">{maskedEmail}</p>
            </div>

            {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
                    {success}
                </div>
            )}

            {/* OTP Inputs */}
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

            {/* Verify button */}
            <button
                onClick={handleSubmit}
                disabled={loading || otp.some((d) => !d)}
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-l from-[#0098d6] to-[#004786] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#0098d6]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[#0098d6]/30 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
                <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    {loading ? "جاري التحقق..." : "تأكيد الرمز"}
                </span>
                <div className="absolute inset-0 bg-gradient-to-l from-[#00b4ff] to-[#0066aa] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </button>

            {/* Resend */}
            <div className="mt-6 text-center">
                {countdown > 0 ? (
                    <p className="text-sm text-gray-400">
                        إعادة إرسال الرمز خلال{" "}
                        <span className="font-semibold text-gray-600">{countdown}</span> ثانية
                    </p>
                ) : (
                    <button
                        onClick={handleResend}
                        disabled={resending}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0098d6] transition-colors hover:text-[#004786] disabled:opacity-50"
                    >
                        {resending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                        إعادة إرسال الرمز
                    </button>
                )}
            </div>
        </AuthLayout>
    )
}
