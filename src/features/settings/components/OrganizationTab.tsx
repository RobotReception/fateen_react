import { useState, useCallback } from "react"
import {
    Edit3, Save, X, Loader2, AlertCircle, ExternalLink,
    Crown, RefreshCw, Building2,
    CheckCircle2, XCircle, Briefcase, Mail,
} from "lucide-react"
import { useOrganization, useUpdateOrganization } from "../hooks/use-settings"
import { useAuthStore } from "@/stores/auth-store"
import { FetchingBar } from "@/components/ui/FetchingBar"
import type { UpdateOrganizationPayload } from "../types"

/* ─── skeleton ─── */
function Skeleton() {
    return (
        <div className="animate-pulse space-y-5">
            <div className="rounded-xl border border-gray-200 bg-white p-7">
                <div className="flex items-center gap-5">
                    <div className="h-[76px] w-[76px] rounded-2xl bg-gray-100" />
                    <div className="space-y-3 flex-1">
                        <div className="h-6 w-48 rounded-lg bg-gray-100" />
                        <div className="h-4 w-36 rounded bg-gray-100" />
                    </div>
                </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-7">
                <div className="h-5 w-32 rounded bg-gray-100 mb-6" />
                <div className="grid grid-cols-2 gap-8">
                    {[1, 2, 3, 4].map(j => (
                        <div key={j}>
                            <div className="h-3 w-16 rounded bg-gray-100 mb-2" />
                            <div className="h-5 w-32 rounded bg-gray-50" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

/* ─── field row (view) ─── */
function DataRow({ label, value, mono, dir, link }: {
    label: string; value?: string | null; mono?: boolean; dir?: string; link?: boolean
}) {
    const empty = !value
    return (
        <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <span className="text-[13px] font-medium text-gray-500">{label}</span>
            {link && value ? (
                <a href={value} target="_blank" rel="noopener noreferrer"
                    className="text-[13px] font-medium text-gray-900 hover:text-black transition-colors flex items-center gap-1.5 truncate max-w-[60%]" dir={dir}>
                    {value} <ExternalLink size={11} className="text-gray-400 shrink-0" />
                </a>
            ) : (
                <span className={`text-[13px] font-medium truncate max-w-[60%] ${empty ? "text-gray-300" : "text-gray-900"} ${mono ? "font-mono text-[12px]" : ""}`} dir={dir}>
                    {value || "—"}
                </span>
            )}
        </div>
    )
}

/* ─── edit field ─── */
function Input({ label, name, value, onChange, placeholder, dir, type = "text", area }: {
    label: string; name: string; value: string; onChange: (n: string, v: string) => void
    placeholder?: string; dir?: string; type?: string; area?: boolean
}) {
    const base = `w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-[14px] text-gray-900
                  placeholder:text-gray-400 outline-none transition-all
                  focus:border-gray-900 focus:ring-2 focus:ring-gray-100`
    return (
        <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-2">{label}</label>
            {area ? (
                <textarea value={value} onChange={e => onChange(name, e.target.value)}
                    placeholder={placeholder} dir={dir} rows={3}
                    className={`${base} resize-none`} />
            ) : (
                <input type={type} value={value} onChange={e => onChange(name, e.target.value)}
                    placeholder={placeholder} dir={dir} className={base} />
            )}
        </div>
    )
}

/* ─── section card ─── */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white">
            <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-[15px] font-bold text-gray-900">{title}</h3>
            </div>
            <div className="px-6 py-5">{children}</div>
        </div>
    )
}

/* ═══════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════ */
export function OrganizationTab() {
    const user = useAuthStore(s => s.user)
    const tenantId = user?.tenant_id || ""
    const { data: org, isLoading, isFetching, isError, refetch } = useOrganization(tenantId)
    const mut = useUpdateOrganization(tenantId)

    const [editing, setEditing] = useState(false)
    const [errors, setErrors] = useState<Array<{ field: string; message: string }>>([])
    const [form, setForm] = useState({
        logo: "", industry: "", country: "", timezone: "",
        language: "", phone: "", address: "", website: "", description: "",
    })

    const bg = isFetching && !isLoading

    const startEdit = useCallback(() => {
        if (!org) return
        setErrors([])
        setForm({
            logo: org.logo || "", industry: org.industry || "", country: org.country || "",
            timezone: org.timezone || "", language: org.language || "", phone: org.phone || "",
            address: org.address || "", website: org.website || "", description: org.description || "",
        })
        setEditing(true)
    }, [org])

    const cancel = useCallback(() => { setEditing(false); setErrors([]) }, [])

    const change = useCallback((n: string, v: string) => {
        setForm(p => ({ ...p, [n]: v }))
        setErrors(p => p.filter(e => e.field !== n))
    }, [])

    const save = useCallback(() => {
        if (!org) return
        setErrors([])
        const payload: UpdateOrganizationPayload = {}
        for (const f of ["logo", "industry", "country", "timezone", "language", "phone", "address", "website", "description"] as const) {
            (payload as any)[f] = form[f]?.trim() || null
        }
        mut.mutate(payload, {
            onSuccess: () => cancel(),
            onError: (e: any) => { if (e.validationErrors?.length) setErrors(e.validationErrors) },
        })
    }, [org, form, mut, cancel])

    if (isLoading) return <Skeleton />

    if (isError || !org) return (
        <div className="rounded-xl border border-gray-200 bg-white flex flex-col items-center justify-center py-20">
            <AlertCircle size={20} className="text-gray-400" />
            <p className="mt-3 text-[14px] font-medium text-gray-600">فشل تحميل بيانات المؤسسة</p>
            <button onClick={() => refetch()}
                className="mt-4 rounded-lg border border-gray-200 px-5 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                <RefreshCw size={13} /> إعادة المحاولة
            </button>
        </div>
    )

    return (
        <div className="space-y-5">
            <FetchingBar visible={bg} />

            {/* ── HEADER CARD ── */}
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="h-1 bg-gray-900" />

                <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-5">
                            {/* logo */}
                            {org.logo ? (
                                <img src={org.logo} alt="" className="h-[76px] w-[76px] rounded-2xl border-2 border-gray-200 object-cover" />
                            ) : (
                                <div className="h-[76px] w-[76px] rounded-2xl bg-gray-900 flex items-center justify-center">
                                    <Building2 size={28} className="text-white" />
                                </div>
                            )}

                            <div>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-bold text-gray-900">{org.name}</h2>
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase ${org.is_active
                                        ? "bg-gray-900 text-white"
                                        : "bg-gray-200 text-gray-500"
                                        }`}>
                                        {org.is_active ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                                        {org.is_active ? "نشطة" : "غير نشطة"}
                                    </span>
                                </div>

                                <div className="mt-1.5 flex items-center gap-3 text-[13px] text-gray-600 font-medium">
                                    {org.domain && <span className="font-mono" dir="ltr">{org.domain}</span>}
                                    {org.type && (
                                        <>
                                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                                            <span className="capitalize">{org.type}</span>
                                        </>
                                    )}
                                    {(org.industry || org.metadata?.industry) && (
                                        <>
                                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                                            <span>{org.industry || org.metadata?.industry}</span>
                                        </>
                                    )}
                                </div>

                                {/* plan + verification */}
                                <div className="mt-3 flex items-center gap-3 text-[12px]">
                                    <span className="rounded-lg bg-gray-100 px-2.5 py-1 font-bold text-gray-700">
                                        {org.plan_snapshot?.plan_name || org.plan || "—"}
                                    </span>
                                    <span className={`flex items-center gap-1 font-semibold ${org.is_verified ? "text-gray-700" : "text-gray-400"}`}>
                                        {org.is_verified ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                                        {org.is_verified ? "موثقة" : "غير موثقة"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {!editing && (
                            <button onClick={startEdit}
                                className="rounded-lg bg-gray-900 px-5 py-2.5 text-[13px] font-bold text-white
                                           hover:bg-gray-800 active:bg-gray-700 transition-all shrink-0
                                           flex items-center gap-2 shadow-sm">
                                <Edit3 size={14} /> تعديل البيانات
                            </button>
                        )}
                    </div>

                    {/* owner strip */}
                    {org.owner && (
                        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-6 text-[13px]">
                            <span className="flex items-center gap-2 text-gray-700 font-semibold">
                                <Crown size={13} className="text-gray-400" />
                                {org.owner.name}
                            </span>
                            <span className="flex items-center gap-2 font-mono text-[12px] text-gray-600" dir="ltr">
                                <Mail size={12} className="text-gray-400" />
                                {org.owner.email}
                            </span>
                            {org.owner.position && (
                                <span className="flex items-center gap-2 text-gray-600">
                                    <Briefcase size={12} className="text-gray-400" />
                                    {org.owner.position}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── EDIT MODE ── */}
            {editing ? (
                <div className="rounded-xl border border-gray-200 bg-white overflow-hidden" style={{ animation: "orgSlide .2s ease-out" }}>
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-[15px] font-bold text-gray-900">تعديل بيانات المؤسسة</h3>
                        <div className="flex items-center gap-2">
                            <button onClick={cancel} disabled={mut.isPending}
                                className="rounded-lg border border-gray-200 px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 flex items-center gap-1.5">
                                <X size={13} /> إلغاء
                            </button>
                            <button onClick={save} disabled={mut.isPending}
                                className="rounded-lg bg-gray-900 px-5 py-2 text-[13px] font-bold text-white hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm">
                                {mut.isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                                حفظ التغييرات
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        <p className="text-[13px] text-gray-500 mb-6 leading-relaxed">
                            يمكنك تعديل الحقول التالية. لا يمكن تعديل اسم المؤسسة أو النطاق.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                            <Input label="رابط الشعار" name="logo" value={form.logo} onChange={change} placeholder="https://..." dir="ltr" />
                            <Input label="القطاع" name="industry" value={form.industry} onChange={change} placeholder="مثال: Technology" />
                            <Input label="الدولة" name="country" value={form.country} onChange={change} placeholder="مثال: SA" />
                            <Input label="المنطقة الزمنية" name="timezone" value={form.timezone} onChange={change} placeholder="Asia/Riyadh" dir="ltr" />
                            <Input label="اللغة" name="language" value={form.language} onChange={change} placeholder="ar" />
                            <Input label="رقم الهاتف" name="phone" value={form.phone} onChange={change} placeholder="+966500000000" dir="ltr" type="tel" />
                            <Input label="العنوان" name="address" value={form.address} onChange={change} placeholder="العنوان الكامل" />
                            <Input label="الموقع الإلكتروني" name="website" value={form.website} onChange={change} placeholder="https://example.com" dir="ltr" />
                        </div>
                        <div className="mt-5">
                            <Input label="وصف المؤسسة" name="description" value={form.description} onChange={change} placeholder="وصف مختصر عن المؤسسة..." area />
                        </div>

                        {/* errors */}
                        {errors.length > 0 && (
                            <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4" style={{ animation: "orgSlide .15s ease-out" }}>
                                <p className="text-[13px] font-bold text-gray-800 mb-2 flex items-center gap-2">
                                    <AlertCircle size={14} className="text-gray-500" /> أخطاء
                                </p>
                                <ul className="space-y-1 mr-5">
                                    {errors.map((e, i) => (
                                        <li key={i} className="text-[13px] text-gray-600">
                                            <span className="font-bold text-gray-800">{e.field}:</span> {e.message}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {mut.isError && errors.length === 0 && (
                            <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4 flex items-center gap-2">
                                <AlertCircle size={14} className="text-gray-500 shrink-0" />
                                <span className="text-[13px] text-gray-700 font-medium">{(mut.error as any)?.message || "فشل التحديث"}</span>
                            </div>
                        )}
                    </div>
                </div>

            ) : (
                /* ── VIEW MODE ── */
                <Card title="معلومات المؤسسة">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12">
                        <div>
                            <DataRow label="القطاع" value={org.industry || org.metadata?.industry} />
                            <DataRow label="الدولة" value={org.country || org.billing_info?.country} />
                            <DataRow label="المنطقة الزمنية" value={org.timezone} mono dir="ltr" />
                            <DataRow label="اللغة" value={org.language} />
                            <DataRow label="النطاق" value={org.domain} mono dir="ltr" />
                        </div>
                        <div>
                            <DataRow label="الهاتف" value={org.phone || org.contact_info?.phone} mono dir="ltr" />
                            <DataRow label="البريد الإلكتروني" value={org.contact_info?.email} mono dir="ltr" />
                            <DataRow label="العنوان" value={org.address} />
                            <DataRow label="الموقع الإلكتروني" value={org.website} link dir="ltr" />
                        </div>
                    </div>
                    {org.description && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-[12px] font-semibold text-gray-500 mb-1.5">الوصف</p>
                            <p className="text-[14px] text-gray-700 leading-relaxed">{org.description}</p>
                        </div>
                    )}
                </Card>
            )}

            <style>{`@keyframes orgSlide{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    )
}
