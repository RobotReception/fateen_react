import { useState, useCallback, useMemo, useRef } from "react"
import {
    Edit3, Save, X, Loader2, AlertCircle,
    RefreshCw, CheckCircle2, XCircle,
    Shield, Mail, Phone, Building2,
    Clock, Wifi, CalendarClock, Briefcase,
    Copy, Check, Camera,
} from "lucide-react"
import { useUserProfile, useUpdateUserProfile } from "../hooks/use-settings"
import { uploadMedia } from "@/features/inbox/services/inbox-service"
import { FetchingBar } from "@/components/ui/FetchingBar"
import type { UpdateUserProfilePayload } from "../types"
import { ActionGuard } from "@/components/guards/ActionGuard"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"

const CSS = `
@keyframes profFade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
@keyframes profShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
`

function fmtDateTime(d: string | null | undefined): string {
    if (!d) return "—"
    try {
        return new Intl.DateTimeFormat("ar-SA", {
            year: "numeric", month: "short", day: "numeric",
            hour: "2-digit", minute: "2-digit", timeZone: "Asia/Aden",
        }).format(new Date(d))
    } catch { return d }
}

/* ── skeleton ── */
function Skeleton() {
    const b = (w: string, h = 14) => ({
        width: w, height: h, borderRadius: 8,
        background: "linear-gradient(110deg,#eee 30%,#f7f7f7 50%,#eee 70%)",
        backgroundSize: "200% 100%", animation: "profShimmer 1.6s ease-in-out infinite",
    }) as React.CSSProperties
    return (
        <div style={{ animation: "profFade .3s" }}>
            <style>{CSS}</style>
            <div style={{ ...card, padding: 24, display: "flex", alignItems: "center", gap: 16 }}>
                <div style={b("64px", 64)} />
                <div style={{ flex: 1 }}><div style={b("140px", 16)} /><div style={{ ...b("200px", 12), marginTop: 8 }} /></div>
            </div>
            <div style={{ ...card, padding: 24, marginTop: 12 }}>
                {[0, 1, 2].map(i => <div key={i} style={{ ...b("100%", 44), marginTop: i ? 8 : 0 }} />)}
            </div>
        </div>
    )
}

/* ── shared card style ── */
const card: React.CSSProperties = {
    borderRadius: 12, background: "var(--t-card, #fff)",
    border: "1px solid var(--t-border-light, #eaedf0)",
}

/* ── copy to clipboard button ── */
function CopyBtn({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)
    return (
        <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
            title="نسخ"
            style={{
                border: "none", background: "none", cursor: "pointer", padding: 2,
                color: copied ? "#16a34a" : "var(--t-text-faint, #c0c4cc)", transition: "color .15s",
                display: "flex", alignItems: "center",
            }}>
            {copied ? <Check size={11} /> : <Copy size={11} />}
        </button>
    )
}

/* ═══════════════════════════════════════
   MAIN
   ═══════════════════════════════════════ */
export function ProfileTab() {
    const { data: profile, isLoading, isFetching, isError, refetch } = useUserProfile()
    const mut = useUpdateUserProfile()
    const [editing, setEditing] = useState(false)
    const [errors, setErrors] = useState<Array<{ field: string; message: string }>>([])
    const [form, setForm] = useState({ first_name: "", last_name: "", phone: "", profile_picture: "" })
    const [uploading, setUploading] = useState(false)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const fileRef = useRef<HTMLInputElement>(null)
    const bg = isFetching && !isLoading

    const startEdit = useCallback(() => {
        if (!profile) return; setErrors([])
        setForm({ first_name: profile.first_name || "", last_name: profile.last_name || "", phone: profile.phone || "", profile_picture: profile.profile_picture || "" })
        setAvatarPreview(null)
        setEditing(true)
    }, [profile])
    const cancel = useCallback(() => { setEditing(false); setErrors([]); setAvatarPreview(null) }, [])
    const change = useCallback((n: string, v: string) => { setForm(p => ({ ...p, [n]: v })); setErrors(p => p.filter(e => e.field !== n)) }, [])

    const handleAvatarPick = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !profile) return
        // Show local preview immediately
        const localUrl = URL.createObjectURL(file)
        setAvatarPreview(localUrl)
        setUploading(true)
        try {
            const res = await uploadMedia(file)
            const url = res.public_url || res.proxy_url || ""
            if (url) {
                // Update form state if in edit mode
                setForm(p => ({ ...p, profile_picture: url }))
                // Immediately save to API
                mut.mutate({
                    user_id: profile.user_id, username_login: profile.email,
                    first_name: profile.first_name || null, last_name: profile.last_name || null,
                    phone: profile.phone || null, profile_picture: url,
                } as UpdateUserProfilePayload)
            }
        } catch (err) {
            console.error("Avatar upload failed:", err)
            setAvatarPreview(null)
        } finally {
            setUploading(false)
            if (fileRef.current) fileRef.current.value = ""
        }
    }, [profile, mut])
    const save = useCallback(() => {
        if (!profile) return; setErrors([])
        mut.mutate({
            user_id: profile.user_id, username_login: profile.email,
            first_name: form.first_name?.trim() || null, last_name: form.last_name?.trim() || null,
            phone: form.phone?.trim() || null, profile_picture: form.profile_picture?.trim() || null,
        } as UpdateUserProfilePayload, {
            onSuccess: () => cancel(),
            onError: (e: any) => { if (e.validationErrors?.length) setErrors(e.validationErrors) },
        })
    }, [profile, form, mut, cancel])

    const sessionDate = useMemo(() => fmtDateTime(profile?.session?.login_time), [profile?.session?.login_time])

    if (isLoading) return <Skeleton />
    if (isError) return (
        <div style={{ ...card, padding: "48px 24px", textAlign: "center", animation: "profFade .3s" }}>
            <style>{CSS}</style>
            <AlertCircle size={28} style={{ color: "#dc2626", margin: "0 auto 10px" }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "#1f2937", margin: "0 0 4px" }}>فشل تحميل البيانات</p>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 14px" }}>تحقق من اتصالك وأعد المحاولة</p>
            <button onClick={() => refetch()} style={{ padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", background: "#004786", color: "#fff", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
                <RefreshCw size={12} /> إعادة المحاولة
            </button>
        </div>
    )

    const roleMap: Record<string, string> = { owner: "مالك", admin: "مدير", user: "مستخدم" }
    const initials = (profile?.first_name || "U").charAt(0).toUpperCase()
    const fullName = profile?.full_name || `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim()

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "profFade .3s ease-out" }}>
            <style>{CSS}</style>
            <FetchingBar visible={bg} />

            {/* Hidden file input */}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={handleAvatarPick} />

            {/* ═══ 1. IDENTITY CARD ═══ */}
            <div style={card}>
                <div style={{ padding: "20px 22px", display: "flex", alignItems: "center", gap: 16 }}>
                    {/* Avatar */}
                    <div
                        style={{ position: "relative", flexShrink: 0, cursor: "pointer" }}
                        onClick={() => fileRef.current?.click()}
                    >
                        {(() => {
                            const imgSrc = avatarPreview || (editing ? form.profile_picture : null) || profile?.profile_picture
                            return imgSrc ? (
                                <img src={imgSrc} alt="" style={{
                                    width: 60, height: 60, borderRadius: 14, objectFit: "cover",
                                    border: "2px solid var(--t-border-light, #eaedf0)",
                                    opacity: uploading ? 0.5 : 1, transition: "opacity .2s",
                                }} />
                            ) : (
                                <div style={{
                                    width: 60, height: 60, borderRadius: 14,
                                    background: "linear-gradient(135deg, #004786, #0072b5)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    opacity: uploading ? 0.5 : 1, transition: "opacity .2s",
                                }}>
                                    <span style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{initials}</span>
                                </div>
                            )
                        })()}
                        {/* Upload overlay — always visible on hover */}
                        <div style={{
                            position: "absolute", inset: 0, borderRadius: 14,
                            background: uploading ? "rgba(0,71,134,0.4)" : "rgba(0,0,0,0.0)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "background .2s",
                        }}
                            onMouseEnter={e => { if (!uploading) e.currentTarget.style.background = "rgba(0,0,0,0.35)" }}
                            onMouseLeave={e => { if (!uploading) e.currentTarget.style.background = "rgba(0,0,0,0.0)" }}
                        >
                            {uploading ? (
                                <Loader2 size={18} className="animate-spin" style={{ color: "#fff" }} />
                            ) : (
                                <Camera size={16} style={{ color: "#fff", opacity: 0.9 }} />
                            )}
                        </div>
                        {!uploading && (
                            <div style={{
                                position: "absolute", bottom: -2, left: -2,
                                width: 14, height: 14, borderRadius: "50%",
                                background: profile?.is_active ? "#22c55e" : "#d1d5db",
                                border: "2.5px solid var(--t-card, #fff)",
                            }} />
                        )}
                    </div>

                    {/* Identity */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--t-text, #111827)", margin: 0, letterSpacing: "-0.01em" }}>
                                {fullName}
                            </h2>
                            {profile?.email_verified && <CheckCircle2 size={14} style={{ color: "#004786", flexShrink: 0 }} />}
                        </div>
                        <div style={{ fontSize: 12.5, color: "var(--t-text-faint, #9ca3af)", marginTop: 2, fontFamily: "monospace" }} dir="ltr">
                            {profile?.email}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                            <span style={{
                                display: "inline-flex", alignItems: "center", gap: 3,
                                padding: "3px 10px", borderRadius: 6,
                                background: "#004786", color: "#fff",
                                fontSize: 10, fontWeight: 700,
                            }}>
                                <Shield size={9} />
                                {roleMap[profile?.role || ""] || profile?.role}
                            </span>
                            {profile?.is_owner && (
                                <span style={{
                                    padding: "3px 10px", borderRadius: 6,
                                    background: "rgba(0,71,134,0.06)", color: "#004786",
                                    fontSize: 10, fontWeight: 700,
                                }}>مالك المؤسسة</span>
                            )}
                            <span style={{
                                display: "inline-flex", alignItems: "center", gap: 4,
                                padding: "3px 10px", borderRadius: 6,
                                background: profile?.is_active ? "rgba(34,197,94,0.08)" : "var(--t-surface, #f5f5f5)",
                                color: profile?.is_active ? "#16a34a" : "#9ca3af",
                                fontSize: 10, fontWeight: 600,
                            }}>
                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor" }} />
                                {profile?.is_active ? "متصل" : "غير متصل"}
                            </span>
                        </div>
                    </div>

                    {/* Action button */}
                    {!editing && (
                        <ActionGuard pageBit={PAGE_BITS.USER_PROFILE} actionBit={ACTION_BITS.UPDATE_PROFILE}>
                            <button onClick={startEdit} style={{
                                padding: "8px 16px", borderRadius: 8, cursor: "pointer",
                                border: "1px solid var(--t-border, #dcdfe3)", background: "var(--t-card, #fff)",
                                color: "var(--t-text-secondary, #4b5563)", fontSize: 12, fontWeight: 600,
                                display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
                                transition: "all .12s",
                            }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = "#004786"; e.currentTarget.style.color = "#004786" }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--t-border, #dcdfe3)"; e.currentTarget.style.color = "var(--t-text-secondary, #4b5563)" }}
                            >
                                <Edit3 size={13} /> تعديل
                            </button>
                        </ActionGuard>
                    )}
                </div>
            </div>

            {/* ═══ 2. EDIT MODE ═══ */}
            {editing && (
                <div style={{ ...card, overflow: "hidden", animation: "profFade .15s" }}>
                    <div style={{
                        padding: "12px 22px",
                        background: "var(--t-surface, #f9fafb)",
                        borderBottom: "1px solid var(--t-border-light, #eaedf0)",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text, #111827)" }}>تعديل البيانات الشخصية</span>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={cancel} disabled={mut.isPending} style={{
                                padding: "6px 14px", borderRadius: 7, cursor: "pointer",
                                border: "1px solid var(--t-border, #dcdfe3)", background: "var(--t-card, #fff)",
                                color: "#6b7280", fontSize: 12, fontWeight: 500,
                                display: "flex", alignItems: "center", gap: 4,
                                opacity: mut.isPending ? 0.4 : 1,
                            }}><X size={12} /> إلغاء</button>
                            <button onClick={save} disabled={mut.isPending} style={{
                                padding: "6px 18px", borderRadius: 7, cursor: "pointer",
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
                    <div style={{ padding: "18px 22px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                            <EField label="الاسم الأول" name="first_name" value={form.first_name} onChange={change} />
                            <EField label="اسم العائلة" name="last_name" value={form.last_name} onChange={change} />
                            <EField label="رقم الهاتف" name="phone" value={form.phone} onChange={change} placeholder="+967..." dir="ltr" type="tel" />
                        </div>
                        {errors.length > 0 && (
                            <div style={{ marginTop: 14, borderRadius: 8, padding: 12, background: "#fef2f2", border: "1px solid #fecaca" }}>
                                <p style={{ fontSize: 12, fontWeight: 600, color: "#dc2626", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 4 }}><AlertCircle size={12} /> أخطاء في البيانات</p>
                                <ul style={{ margin: 0, paddingRight: 16 }}>
                                    {errors.map((e, i) => <li key={i} style={{ fontSize: 11, color: "#6b7280" }}><b>{e.field}:</b> {e.message}</li>)}
                                </ul>
                            </div>
                        )}
                        {mut.isError && errors.length === 0 && (
                            <div style={{ marginTop: 14, borderRadius: 8, padding: 12, background: "#fef2f2", border: "1px solid #fecaca", display: "flex", alignItems: "center", gap: 6 }}>
                                <AlertCircle size={12} style={{ color: "#dc2626" }} />
                                <span style={{ fontSize: 12, color: "#6b7280" }}>{(mut.error as any)?.message || "فشل التحديث"}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══ 3. ACCOUNT DETAILS ═══ */}
            {!editing && (
                <div style={card}>
                    <div style={{
                        padding: "14px 22px",
                        borderBottom: "1px solid var(--t-border-light, #eaedf0)",
                        display: "flex", alignItems: "center", gap: 8,
                    }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text, #111827)" }}>معلومات الحساب</span>
                    </div>
                    <div style={{ padding: "0 22px" }}>
                        <Row icon={Mail} label="البريد الإلكتروني" value={profile?.email} mono dir="ltr" copy />
                        <Row icon={Phone} label="رقم الهاتف" value={profile?.phone} mono dir="ltr" copy />
                        <Row icon={Shield} label="الدور" value={roleMap[profile?.role || ""] || profile?.role} />
                        <Row icon={Briefcase} label="المنصب" value={profile?.position} />
                        <Row icon={Building2} label="المؤسسة" value={profile?.tenant_id} mono dir="ltr" copy last />
                    </div>
                </div>
            )}

            {/* ═══ 4. SESSION ═══ */}
            {!editing && profile?.session && (
                <div style={card}>
                    <div style={{
                        padding: "14px 22px",
                        borderBottom: "1px solid var(--t-border-light, #eaedf0)",
                        display: "flex", alignItems: "center", gap: 8,
                    }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text, #111827)" }}>الجلسة الحالية</span>
                        <span style={{
                            width: 6, height: 6, borderRadius: "50%",
                            background: "#22c55e", flexShrink: 0,
                            boxShadow: "0 0 0 2px rgba(34,197,94,0.15)",
                        }} />
                    </div>
                    <div style={{ padding: "0 22px" }}>
                        <Row icon={Clock} label="وقت الدخول" value={sessionDate} />
                        <Row icon={Wifi} label="عنوان IP" value={profile.session.ip_address} mono dir="ltr" copy />
                        <Row icon={CalendarClock} label="انتهاء الجلسة" value={
                            profile.session.expires_at
                                ? new Date(profile.session.expires_at).toLocaleDateString("ar-SA", { timeZone: "Asia/Aden" })
                                : null
                        } last />
                    </div>
                </div>
            )}

            {/* ═══ 5. VERIFICATION STATUS ═══ */}
            {!editing && (
                <div style={card}>
                    <div style={{
                        padding: "14px 22px",
                        borderBottom: "1px solid var(--t-border-light, #eaedf0)",
                    }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text, #111827)" }}>حالة التحقق</span>
                    </div>
                    <div style={{ padding: "14px 22px", display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: profile?.email_verified ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.06)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            {profile?.email_verified
                                ? <CheckCircle2 size={18} style={{ color: "#16a34a" }} />
                                : <XCircle size={18} style={{ color: "#dc2626" }} />}
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t-text, #111827)" }}>
                                {profile?.email_verified ? "البريد الإلكتروني مؤكد" : "البريد الإلكتروني غير مؤكد"}
                            </div>
                            <div style={{ fontSize: 11.5, color: "var(--t-text-faint, #9ca3af)", marginTop: 1 }}>
                                {profile?.email_verified
                                    ? "تم التحقق من بريدك الإلكتروني بنجاح"
                                    : "يرجى تأكيد بريدك الإلكتروني لتفعيل جميع الميزات"}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

/* ═══ Sub-components ═══ */

function Row({ icon: Icon, label, value, mono, dir, copy, last }: {
    icon: typeof Mail; label: string; value?: string | null; mono?: boolean
    dir?: string; copy?: boolean; last?: boolean
}) {
    const empty = !value
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "13px 0",
            borderBottom: last ? "none" : "1px solid var(--t-border-light, #f2f3f5)",
        }}>
            <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: "var(--t-surface, #f5f6f8)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
                <Icon size={13} style={{ color: "var(--t-text-faint, #9ca3af)" }} />
            </div>
            <span style={{ fontSize: 12.5, color: "var(--t-text-faint, #9ca3af)", width: 120, flexShrink: 0, fontWeight: 500 }}>{label}</span>
            <span style={{
                flex: 1, fontSize: 13, fontWeight: 500,
                color: empty ? "var(--t-border, #d1d5db)" : "var(--t-text, #1f2937)",
                fontFamily: mono ? "monospace" : "inherit",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }} dir={dir}>
                {value || "—"}
            </span>
            {copy && value && <CopyBtn text={value} />}
        </div>
    )
}

function EField({ label, name, value, onChange, placeholder, dir, type = "text" }: {
    label: string; name: string; value: string; onChange: (n: string, v: string) => void
    placeholder?: string; dir?: string; type?: string
}) {
    const [f, setF] = useState(false)
    return (
        <div>
            <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#9ca3af", marginBottom: 5 }}>{label}</label>
            <input type={type} value={value} onChange={e => onChange(name, e.target.value)}
                placeholder={placeholder} dir={dir}
                onFocus={() => setF(true)} onBlur={() => setF(false)}
                style={{
                    width: "100%", padding: "9px 12px", borderRadius: 8,
                    border: `1.5px solid ${f ? "#004786" : "#e5e7eb"}`,
                    background: "var(--t-card, #fff)", fontSize: 13, color: "#1f2937", outline: "none",
                    transition: "border-color .15s, box-shadow .15s",
                    boxShadow: f ? "0 0 0 3px rgba(0,71,134,0.06)" : "none",
                }} />
        </div>
    )
}
