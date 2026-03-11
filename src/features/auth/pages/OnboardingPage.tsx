import { useState, useEffect, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Building2, Loader2, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react"
import {
    completeOnboarding,
    getOnboardingOptions,
    type OnboardingOption,
} from "@/features/auth/services/auth-service"
import { useAuthStore } from "@/stores/auth-store"
import { AuthLayout } from "@/features/auth/components/AuthLayout"

interface Options {
    industries: OnboardingOption[]
    employee_counts: OnboardingOption[]
    primary_customers: OnboardingOption[]
    customer_acquisitions: OnboardingOption[]
    contact_reasons: OnboardingOption[]
    data_storages: OnboardingOption[]
    user_positions: OnboardingOption[]
}

export function OnboardingPage() {
    const navigate = useNavigate()
    const { registrationUserId } = useAuthStore()

    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [optionsLoading, setOptionsLoading] = useState(true)
    const [error, setError] = useState("")
    const [options, setOptions] = useState<Options | null>(null)
    const [onboardingComplete, setOnboardingComplete] = useState(false)

    // Form fields
    const [organizationName, setOrganizationName] = useState("")
    const [phone, setPhone] = useState("")
    const [domain, setDomain] = useState("")
    const [industry, setIndustry] = useState("")
    const [employeeCount, setEmployeeCount] = useState("")
    const [primaryCustomer, setPrimaryCustomer] = useState("")
    const [customerAcquisition, setCustomerAcquisition] = useState("")
    const [contactReason, setContactReason] = useState("")
    const [dataStorage, setDataStorage] = useState("")
    const [userPosition, setUserPosition] = useState("")

    // Redirect if no registration data
    useEffect(() => {
        if (!registrationUserId) {
            navigate("/register")
        }
    }, [registrationUserId, navigate])

    // Fetch onboarding options
    useEffect(() => {
        async function load() {
            try {
                const res = await getOnboardingOptions()
                setOptions(res.data)
            } catch {
                setError("فشل في تحميل الخيارات. يرجى إعادة تحميل الصفحة")
            } finally {
                setOptionsLoading(false)
            }
        }
        load()
    }, [])

    const phoneRegex = /^\+?[0-9]{9,15}$/

    const step1Errors = {
        organizationName: !organizationName.trim() ? "اسم المؤسسة مطلوب" : organizationName.trim().length < 2 ? "اسم المؤسسة قصير جداً" : "",
        phone: !phone.trim() ? "رقم الهاتف مطلوب" : !phoneRegex.test(phone.replace(/\s/g, "")) ? "رقم الهاتف غير صحيح" : "",
        industry: !industry ? "القطاع مطلوب" : "",
        userPosition: !userPosition ? "المنصب مطلوب" : "",
    }

    const [touched, setTouched] = useState<Record<string, boolean>>({})
    const [step1Submitted, setStep1Submitted] = useState(false)

    const showStep1Error = (field: keyof typeof step1Errors) =>
        (step1Submitted || touched[field]) && step1Errors[field]

    const step1Class = (field: keyof typeof step1Errors, extra = "") =>
        `w-full rounded-xl border ${showStep1Error(field) ? "border-red-400 bg-red-50/30" : "border-gray-200 bg-gray-50/50"} px-4 py-3 text-sm text-gray-900 outline-none transition-all duration-300 placeholder:text-gray-400 focus:border-[var(--t-accent-light)]/50 focus:bg-white focus:ring-2 focus:ring-[var(--t-accent-light)]/10 ${extra}`

    const handleBlur = (field: string) => setTouched(p => ({ ...p, [field]: true }))

    const canProceedStep1 = !step1Errors.organizationName && !step1Errors.phone && !step1Errors.industry && !step1Errors.userPosition
    const canProceedStep2 = employeeCount && primaryCustomer && customerAcquisition && contactReason && dataStorage

    const handleNext = () => {
        setStep1Submitted(true)
        if (step === 1 && canProceedStep1) setStep(2)
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (!canProceedStep2) {
            setError("يرجى ملء جميع الحقول المطلوبة")
            return
        }

        setError("")
        setLoading(true)
        try {
            await completeOnboarding({
                user_id: registrationUserId!,
                organization_name: organizationName,
                phone,
                industry,
                employee_count: employeeCount,
                primary_customer: primaryCustomer,
                customer_acquisition: customerAcquisition,
                contact_reason: contactReason,
                data_storage: dataStorage,
                user_position: userPosition,
                domain: domain || undefined,
            })

            setOnboardingComplete(true)
        } catch (err: any) {
            const msg = err.response?.data?.message
            const errType = err.response?.data?.error_type
            if (errType === "organization_already_exists") {
                setError("اسم المؤسسة مستخدم بالفعل. اختر اسمًا آخر")
            } else if (!err.response) {
                setError("لا يمكن الاتصال بالخادم. تحقق من اتصال الإنترنت")
            } else {
                setError(msg || "حدث خطأ غير متوقع. حاول مرة أخرى")
            }
        } finally {
            setLoading(false)
        }
    }

    const SelectField = ({
        label,
        value,
        onChange,
        options: opts,
        placeholder,
    }: {
        label: string
        value: string
        onChange: (v: string) => void
        options: OnboardingOption[]
        placeholder: string
    }) => (
        <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 outline-none transition-all duration-300 focus:border-[var(--t-accent-light)]/50 focus:bg-white focus:ring-2 focus:ring-[var(--t-accent-light)]/10"
            >
                <option value="">{placeholder}</option>
                {opts.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label_ar}
                    </option>
                ))}
            </select>
        </div>
    )

    if (optionsLoading) {
        return (
            <AuthLayout>
                <div className="flex flex-col items-center gap-3 py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-[var(--t-accent-light)]" />
                    <p className="text-sm text-gray-500">جاري التحميل...</p>
                </div>
            </AuthLayout>
        )
    }

    if (onboardingComplete) {
        return (
            <AuthLayout>
                <div className="flex flex-col items-center text-center py-6">
                    <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-100">
                        <CheckCircle2 className="h-10 w-10 text-green-500" />
                    </div>
                    <h1 className="mb-2 text-2xl font-bold text-gray-900">تم إنشاء المؤسسة بنجاح!</h1>
                    <p className="mb-1 text-sm text-gray-500">مؤسستك <strong className="text-gray-700">{organizationName}</strong> جاهزة للاستخدام</p>
                    <p className="mb-8 text-sm text-gray-400">سجّل دخولك للوصول إلى لوحة التحكم</p>
                    <button
                        onClick={() => navigate("/login")}
                        className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-l from-[var(--t-accent-light)] to-[var(--t-accent)] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[var(--t-accent-light)]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[var(--t-accent-light)]/30 hover:-translate-y-0.5"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">تسجيل الدخول</span>
                        <div className="absolute inset-0 bg-gradient-to-l from-[#00b4ff] to-[#0066aa] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    </button>
                </div>
            </AuthLayout>
        )
    }

    return (
        <AuthLayout>
            {/* Icon + Header */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--t-accent-light)]/10 to-[var(--t-accent)]/10">
                <Building2 className="h-7 w-7 text-[var(--t-accent-light)]" />
            </div>
            <div className="mb-6 text-center">
                <h1 className="mb-1 text-2xl font-bold text-gray-900">إعداد المؤسسة</h1>
                <p className="text-sm text-gray-500">أكمل بيانات مؤسستك لبدء الاستخدام</p>
            </div>

            {/* Progress */}
            <div className="mb-8 flex items-center gap-2">
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? "bg-[var(--t-accent-light)]" : "bg-gray-200"}`} />
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? "bg-[var(--t-accent-light)]" : "bg-gray-200"}`} />
            </div>

            {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {step === 1 && (
                    <div className="space-y-4">
                        {/* Org name */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                اسم المؤسسة <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={organizationName}
                                onChange={(e) => setOrganizationName(e.target.value)}
                                onBlur={() => handleBlur("organizationName")}
                                placeholder="مثال: شركة فاتن"
                                className={step1Class("organizationName")}
                            />
                            {showStep1Error("organizationName") && <p className="mt-1 text-xs text-red-500">{step1Errors.organizationName}</p>}
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                رقم الهاتف <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                onBlur={() => handleBlur("phone")}
                                placeholder="+967771234567"
                                className={step1Class("phone")}
                                dir="ltr"
                            />
                            {showStep1Error("phone") && <p className="mt-1 text-xs text-red-500">{step1Errors.phone}</p>}
                        </div>

                        {/* Domain (optional) */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                النطاق <span className="text-xs text-gray-400">(اختياري)</span>
                            </label>
                            <input
                                type="text"
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
                                placeholder="example.com"
                                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 outline-none transition-all duration-300 placeholder:text-gray-400 focus:border-[var(--t-accent-light)]/50 focus:bg-white focus:ring-2 focus:ring-[var(--t-accent-light)]/10"
                                dir="ltr"
                            />
                        </div>

                        {/* Industry */}
                        {options && (
                            <SelectField
                                label="القطاع *"
                                value={industry}
                                onChange={setIndustry}
                                options={options.industries}
                                placeholder="اختر القطاع"
                            />
                        )}

                        {/* Position */}
                        {options && (
                            <SelectField
                                label="المنصب *"
                                value={userPosition}
                                onChange={setUserPosition}
                                options={options.user_positions}
                                placeholder="اختر منصبك"
                            />
                        )}

                        <button
                            type="button"
                            onClick={handleNext}
                            disabled={!canProceedStep1}
                            className="group relative mt-2 w-full overflow-hidden rounded-xl bg-gradient-to-l from-[var(--t-accent-light)] to-[var(--t-accent)] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[var(--t-accent-light)]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[var(--t-accent-light)]/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                التالي
                                <ChevronLeft className="h-4 w-4" />
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-l from-[#00b4ff] to-[#0066aa] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                        </button>
                    </div>
                )}

                {step === 2 && options && (
                    <div className="space-y-4">
                        <SelectField label="عدد الموظفين *" value={employeeCount} onChange={setEmployeeCount} options={options.employee_counts} placeholder="اختر النطاق" />
                        <SelectField label="العميل الأساسي *" value={primaryCustomer} onChange={setPrimaryCustomer} options={options.primary_customers} placeholder="اختر النوع" />
                        <SelectField label="قناة اكتساب العملاء *" value={customerAcquisition} onChange={setCustomerAcquisition} options={options.customer_acquisitions} placeholder="اختر القناة" />
                        <SelectField label="سبب التواصل *" value={contactReason} onChange={setContactReason} options={options.contact_reasons} placeholder="اختر السبب" />
                        <SelectField label="تخزين البيانات *" value={dataStorage} onChange={setDataStorage} options={options.data_storages} placeholder="اختر الطريقة" />

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-300 hover:border-gray-300 hover:shadow-md"
                            >
                                <ChevronRight className="h-4 w-4" />
                                السابق
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !canProceedStep2}
                                className="group relative flex-1 overflow-hidden rounded-xl bg-gradient-to-l from-[var(--t-accent-light)] to-[var(--t-accent)] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[var(--t-accent-light)]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[var(--t-accent-light)]/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
                                    {loading ? "جاري الإنشاء..." : "إنشاء المؤسسة"}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-l from-[#00b4ff] to-[#0066aa] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </AuthLayout>
    )
}
