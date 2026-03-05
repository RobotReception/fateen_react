import { useState, useCallback } from "react"
import {
    Edit3, Save, X, Loader2, AlertCircle, ExternalLink,
    Crown, RefreshCw, Building2, Globe, Phone, MapPin,
    CheckCircle2, XCircle, Briefcase, Mail, Clock,
    Languages, Layers, Copy, Check,
} from "lucide-react"
import { useOrganization, useUpdateOrganization } from "../hooks/use-settings"
import { useAuthStore } from "@/stores/auth-store"
import { FetchingBar } from "@/components/ui/FetchingBar"
import type { UpdateOrganizationPayload } from "../types"
import { ActionGuard } from "@/components/guards/ActionGuard"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"

const CSS = `
@keyframes orgFade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
@keyframes orgShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
`

const card: React.CSSProperties = {
    background: "var(--t-card, #fff)",
    borderRadius: 14,
    border: "1px solid var(--t-border-light, #e8eaed)",
    overflow: "hidden",
}

/* ─── skeleton ─── */
function Skeleton() {
    const shimmer: React.CSSProperties = {
        background: "linear-gradient(90deg, var(--t-surface,#f5f5f5) 25%, #eee 50%, var(--t-surface,#f5f5f5) 75%)",
        backgroundSize: "200% 100%",
        animation: "orgShimmer 1.5s infinite",
        borderRadius: 8,
    }
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "orgFade .3s" }}>
            <style>{CSS}</style>
            <div style={{ ...card, padding: 24 }}>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <div style={{ ...shimmer, width: 64, height: 64, borderRadius: 16 }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ ...shimmer, width: 180, height: 20, marginBottom: 8 }} />
                        <div style={{ ...shimmer, width: 120, height: 14 }} />
                    </div>
                </div>
            </div>
            <div style={{ ...card, padding: 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} style={{ ...shimmer, height: 42 }} />)}
                </div>
            </div>
        </div>
    )
}

/* ─── copy button ─── */
function CopyBtn({ value }: { value: string }) {
    const [ok, setOk] = useState(false)
    return (
        <button onClick={() => { navigator.clipboard.writeText(value); setOk(true); setTimeout(() => setOk(false), 1500) }}
            style={{
                background: "none", border: "none", cursor: "pointer", padding: 2,
                color: ok ? "#16a34a" : "var(--t-text-faint, #9ca3af)",
                transition: "color .15s",
            }}>
            {ok ? <Check size={12} /> : <Copy size={12} />}
        </button>
    )
}

/* ─── data row with icon ─── */
function Row({ icon: Icon, label, value, mono, dir, link, copyable }: {
    icon: typeof Mail; label: string; value?: string | null; mono?: boolean; dir?: string; link?: boolean; copyable?: boolean
}) {
    const empty = !value
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 0",
            borderBottom: "1px solid var(--t-border-light, #f0f1f3)",
        }}>
            <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "rgba(0,71,134,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
                <Icon size={14} style={{ color: "#004786" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: "var(--t-text-faint, #9ca3af)", marginBottom: 2 }}>{label}</div>
                {link && value ? (
                    <a href={value} target="_blank" rel="noopener noreferrer"
                        style={{
                            fontSize: 13, fontWeight: 600, color: "var(--t-text, #1f2937)",
                            textDecoration: "none", display: "flex", alignItems: "center", gap: 4,
                        }} dir={dir}>
                        {value} <ExternalLink size={10} style={{ color: "var(--t-text-faint, #9ca3af)" }} />
                    </a>
                ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{
                            fontSize: 13, fontWeight: empty ? 400 : 600,
                            color: empty ? "var(--t-text-faint, #c4c9d0)" : "var(--t-text, #1f2937)",
                            fontFamily: mono ? "monospace" : "inherit",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }} dir={dir}>
                            {value || "—"}
                        </span>
                        {copyable && value && <CopyBtn value={value} />}
                    </div>
                )}
            </div>
        </div>
    )
}

/* ─── edit field ─── */
function EField({ label, name, value, onChange, placeholder, dir, type = "text", area }: {
    label: string; name: string; value: string; onChange: (n: string, v: string) => void
    placeholder?: string; dir?: string; type?: string; area?: boolean
}) {
    const base: React.CSSProperties = {
        width: "100%", borderRadius: 10,
        border: "1px solid var(--t-border-light, #e0e3e7)",
        background: "var(--t-surface, #fafafa)",
        padding: "10px 14px", fontSize: 13, color: "var(--t-text, #1f2937)",
        outline: "none", transition: "border-color .15s, box-shadow .15s",
        fontFamily: dir === "ltr" ? "monospace" : "inherit",
    }
    return (
        <div>
            <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "var(--t-text-secondary, #6b7280)", marginBottom: 6 }}>{label}</label>
            {area ? (
                <textarea value={value} onChange={e => onChange(name, e.target.value)}
                    placeholder={placeholder} dir={dir} rows={3}
                    style={{ ...base, resize: "none" }}
                    onFocus={e => { e.target.style.borderColor = "#004786"; e.target.style.boxShadow = "0 0 0 3px rgba(0,71,134,0.08)" }}
                    onBlur={e => { e.target.style.borderColor = "var(--t-border-light, #e0e3e7)"; e.target.style.boxShadow = "none" }} />
            ) : (
                <input type={type} value={value} onChange={e => onChange(name, e.target.value)}
                    placeholder={placeholder} dir={dir} style={base}
                    onFocus={e => { e.target.style.borderColor = "#004786"; e.target.style.boxShadow = "0 0 0 3px rgba(0,71,134,0.08)" }}
                    onBlur={e => { e.target.style.borderColor = "var(--t-border-light, #e0e3e7)"; e.target.style.boxShadow = "none" }} />
            )}
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
        <div style={{ ...card, padding: "48px 24px", textAlign: "center", animation: "orgFade .3s" }}>
            <style>{CSS}</style>
            <AlertCircle size={28} style={{ color: "#dc2626", margin: "0 auto 10px" }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--t-text, #1f2937)", margin: "0 0 4px" }}>فشل تحميل بيانات المؤسسة</p>
            <p style={{ fontSize: 12, color: "var(--t-text-faint, #9ca3af)", margin: "0 0 14px" }}>تحقق من اتصالك وأعد المحاولة</p>
            <button onClick={() => refetch()} style={{
                padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer",
                background: "#004786", color: "#fff", fontSize: 12, fontWeight: 600,
                display: "inline-flex", alignItems: "center", gap: 5,
            }}>
                <RefreshCw size={12} /> إعادة المحاولة
            </button>
        </div>
    )

    const initials = (org.name || "O").charAt(0).toUpperCase()

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "orgFade .3s ease-out" }}>
            <style>{CSS}</style>
            <FetchingBar visible={bg} />

            {/* ═══ 1. IDENTITY CARD ═══ */}
            <div style={card}>
                {/* Gradient accent bar */}
                <div style={{ height: 4, background: "linear-gradient(90deg, #004786, #0072b5, #0098d6)" }} />

                <div style={{ padding: "20px 24px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            {/* Logo */}
                            {org.logo ? (
                                <img src={org.logo} alt="" style={{
                                    width: 64, height: 64, borderRadius: 16, objectFit: "cover",
                                    border: "2px solid var(--t-border-light, #eaedf0)",
                                }} />
                            ) : (
                                <div style={{
                                    width: 64, height: 64, borderRadius: 16,
                                    background: "linear-gradient(135deg, #004786, #0072b5)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <span style={{ fontSize: 26, fontWeight: 800, color: "#fff" }}>{initials}</span>
                                </div>
                            )}

                            {/* Name + meta */}
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--t-text, #111827)", margin: 0, letterSpacing: "-0.01em" }}>
                                        {org.name}
                                    </h2>
                                    {org.is_verified && <CheckCircle2 size={15} style={{ color: "#004786" }} />}
                                </div>
                                <div style={{ fontSize: 12.5, color: "var(--t-text-faint, #9ca3af)", marginTop: 3, fontFamily: "monospace" }} dir="ltr">
                                    {org.domain || "—"}
                                </div>
                                {/* Badges */}
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                                    <span style={{
                                        display: "inline-flex", alignItems: "center", gap: 4,
                                        padding: "3px 10px", borderRadius: 6,
                                        background: org.is_active ? "#004786" : "var(--t-surface, #f0f0f0)",
                                        color: org.is_active ? "#fff" : "var(--t-text-faint, #9ca3af)",
                                        fontSize: 10, fontWeight: 700,
                                    }}>
                                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: org.is_active ? "#22c55e" : "#d1d5db" }} />
                                        {org.is_active ? "نشطة" : "غير نشطة"}
                                    </span>
                                    {org.type && (
                                        <span style={{
                                            padding: "3px 10px", borderRadius: 6,
                                            background: "rgba(0,71,134,0.06)", color: "#004786",
                                            fontSize: 10, fontWeight: 600, textTransform: "capitalize",
                                        }}>{org.type}</span>
                                    )}
                                    <span style={{
                                        padding: "3px 10px", borderRadius: 6,
                                        background: "var(--t-surface, #f5f5f5)", color: "var(--t-text-secondary, #6b7280)",
                                        fontSize: 10, fontWeight: 600,
                                    }}>{org.plan_snapshot?.plan_name || org.plan || "—"}</span>
                                    <span style={{
                                        display: "inline-flex", alignItems: "center", gap: 3,
                                        padding: "3px 10px", borderRadius: 6,
                                        background: org.is_verified ? "rgba(22,163,74,0.06)" : "var(--t-surface, #f5f5f5)",
                                        color: org.is_verified ? "#16a34a" : "var(--t-text-faint, #9ca3af)",
                                        fontSize: 10, fontWeight: 600,
                                    }}>
                                        {org.is_verified ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
                                        {org.is_verified ? "موثقة" : "غير موثقة"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Edit button */}
                        {!editing && (
                            <ActionGuard pageBit={PAGE_BITS.ORGANIZATION} actionBit={ACTION_BITS.UPDATE_ORGANIZATION}>
                                <button onClick={startEdit} style={{
                                    padding: "8px 18px", borderRadius: 9, border: "none", cursor: "pointer",
                                    background: "#004786", color: "#fff", fontSize: 12, fontWeight: 600,
                                    display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                                    boxShadow: "0 1px 3px rgba(0,71,134,0.15)",
                                    transition: "background .15s",
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "#003a6e" }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "#004786" }}>
                                    <Edit3 size={13} /> تعديل البيانات
                                </button>
                            </ActionGuard>
                        )}
                    </div>

                    {/* Owner strip */}
                    {org.owner && (
                        <div style={{
                            marginTop: 16, paddingTop: 14,
                            borderTop: "1px solid var(--t-border-light, #eaedf0)",
                            display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "var(--t-text, #1f2937)" }}>
                                <Crown size={13} style={{ color: "#d97706" }} />
                                {org.owner.name}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--t-text-secondary, #6b7280)", fontFamily: "monospace" }} dir="ltr">
                                <Mail size={12} style={{ color: "var(--t-text-faint, #9ca3af)" }} />
                                {org.owner.email}
                            </div>
                            {org.owner.position && (
                                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--t-text-secondary, #6b7280)" }}>
                                    <Briefcase size={12} style={{ color: "var(--t-text-faint, #9ca3af)" }} />
                                    {org.owner.position}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ 2. EDIT MODE ═══ */}
            {editing && (
                <div style={{ ...card, animation: "orgFade .15s" }}>
                    <div style={{
                        padding: "14px 24px",
                        background: "var(--t-surface, #f9fafb)",
                        borderBottom: "1px solid var(--t-border-light, #eaedf0)",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text, #111827)" }}>تعديل بيانات المؤسسة</span>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={cancel} disabled={mut.isPending} style={{
                                padding: "7px 16px", borderRadius: 8, cursor: "pointer",
                                border: "1px solid var(--t-border, #dcdfe3)", background: "var(--t-card, #fff)",
                                color: "#6b7280", fontSize: 12, fontWeight: 500,
                                display: "flex", alignItems: "center", gap: 4,
                                opacity: mut.isPending ? 0.4 : 1,
                            }}><X size={12} /> إلغاء</button>
                            <button onClick={save} disabled={mut.isPending} style={{
                                padding: "7px 20px", borderRadius: 8, cursor: "pointer",
                                border: "none", background: "#004786", color: "#fff",
                                fontSize: 12, fontWeight: 600,
                                display: "flex", alignItems: "center", gap: 4,
                                opacity: mut.isPending ? 0.5 : 1, boxShadow: "0 1px 3px rgba(0,71,134,0.15)",
                            }}>
                                {mut.isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                حفظ التغييرات
                            </button>
                        </div>
                    </div>
                    <div style={{ padding: "20px 24px" }}>
                        <p style={{ fontSize: 12, color: "var(--t-text-faint, #9ca3af)", marginBottom: 18 }}>
                            يمكنك تعديل الحقول التالية. لا يمكن تعديل اسم المؤسسة أو النطاق.
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <EField label="رابط الشعار" name="logo" value={form.logo} onChange={change} placeholder="https://..." dir="ltr" />
                            <EField label="القطاع" name="industry" value={form.industry} onChange={change} placeholder="مثال: Technology" />
                            <EField label="الدولة" name="country" value={form.country} onChange={change} placeholder="مثال: SA" />
                            <EField label="المنطقة الزمنية" name="timezone" value={form.timezone} onChange={change} placeholder="Asia/Riyadh" dir="ltr" />
                            <EField label="اللغة" name="language" value={form.language} onChange={change} placeholder="ar" />
                            <EField label="رقم الهاتف" name="phone" value={form.phone} onChange={change} placeholder="+966500000000" dir="ltr" type="tel" />
                            <EField label="العنوان" name="address" value={form.address} onChange={change} placeholder="العنوان الكامل" />
                            <EField label="الموقع الإلكتروني" name="website" value={form.website} onChange={change} placeholder="https://example.com" dir="ltr" />
                        </div>
                        <div style={{ marginTop: 16 }}>
                            <EField label="وصف المؤسسة" name="description" value={form.description} onChange={change} placeholder="وصف مختصر عن المؤسسة..." area />
                        </div>

                        {errors.length > 0 && (
                            <div style={{ marginTop: 16, borderRadius: 10, padding: 14, background: "#fef2f2", border: "1px solid #fecaca" }}>
                                <p style={{ fontSize: 12, fontWeight: 600, color: "#dc2626", margin: "0 0 6px", display: "flex", alignItems: "center", gap: 4 }}><AlertCircle size={12} /> أخطاء في البيانات</p>
                                <ul style={{ margin: 0, paddingRight: 16 }}>
                                    {errors.map((e, i) => (
                                        <li key={i} style={{ fontSize: 12, color: "#7f1d1d", marginBottom: 2 }}>
                                            <strong>{e.field}:</strong> {e.message}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {mut.isError && errors.length === 0 && (
                            <div style={{ marginTop: 16, borderRadius: 10, padding: 14, background: "#fef2f2", border: "1px solid #fecaca", display: "flex", alignItems: "center", gap: 6 }}>
                                <AlertCircle size={13} style={{ color: "#dc2626", flexShrink: 0 }} />
                                <span style={{ fontSize: 12, color: "#7f1d1d", fontWeight: 500 }}>{(mut.error as any)?.message || "فشل التحديث"}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══ 3. INFO CARDS (view mode) ═══ */}
            {!editing && (
                <>
                    {/* Business Details */}
                    <div style={card}>
                        <div style={{
                            padding: "14px 24px",
                            borderBottom: "1px solid var(--t-border-light, #eaedf0)",
                            display: "flex", alignItems: "center", gap: 8,
                        }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: 7,
                                background: "rgba(0,71,134,0.06)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <Building2 size={13} style={{ color: "#004786" }} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text, #111827)" }}>معلومات المؤسسة</span>
                        </div>
                        <div style={{ padding: "4px 24px 16px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
                                <Row icon={Layers} label="القطاع" value={org.industry || org.metadata?.industry} />
                                <Row icon={Globe} label="الدولة" value={org.country || org.billing_info?.country} />
                                <Row icon={Clock} label="المنطقة الزمنية" value={org.timezone} mono dir="ltr" />
                                <Row icon={Languages} label="اللغة" value={org.language} />
                                <Row icon={Globe} label="النطاق" value={org.domain} mono dir="ltr" copyable />
                            </div>
                        </div>
                    </div>

                    {/* Contact Details */}
                    <div style={card}>
                        <div style={{
                            padding: "14px 24px",
                            borderBottom: "1px solid var(--t-border-light, #eaedf0)",
                            display: "flex", alignItems: "center", gap: 8,
                        }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: 7,
                                background: "rgba(0,71,134,0.06)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <Phone size={13} style={{ color: "#004786" }} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text, #111827)" }}>معلومات الاتصال</span>
                        </div>
                        <div style={{ padding: "4px 24px 16px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
                                <Row icon={Phone} label="الهاتف" value={org.phone || org.contact_info?.phone} mono dir="ltr" copyable />
                                <Row icon={Mail} label="البريد الإلكتروني" value={org.contact_info?.email} mono dir="ltr" copyable />
                                <Row icon={MapPin} label="العنوان" value={org.address} />
                                <Row icon={Globe} label="الموقع الإلكتروني" value={org.website} link dir="ltr" />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {org.description && (
                        <div style={card}>
                            <div style={{ padding: "16px 24px" }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--t-text-faint, #9ca3af)", marginBottom: 6 }}>الوصف</div>
                                <p style={{ fontSize: 13, color: "var(--t-text, #1f2937)", lineHeight: 1.7, margin: 0 }}>{org.description}</p>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
