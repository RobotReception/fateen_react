import { useState, useCallback, useMemo } from "react"
import {
    Edit3, Save, X, Loader2, AlertCircle,
    Hash, RefreshCw, CheckCircle2,
    XCircle, Globe, Shield,
} from "lucide-react"
import { useUserProfile, useUpdateUserProfile } from "../hooks/use-settings"
import { FetchingBar } from "@/components/ui/FetchingBar"
import type { UpdateUserProfilePayload } from "../types"

/* ── CSS keyframes ── */
const CSS = `
@keyframes profFadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes profShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
`

/* ─── helpers ─── */
function fmtDateTime(d: string | null | undefined): string {
    if (!d) return "—"
    try {
        return new Intl.DateTimeFormat("ar-SA", {
            year: "numeric", month: "short", day: "numeric",
            hour: "2-digit", minute: "2-digit",
            timeZone: "Asia/Aden",
        }).format(new Date(d))
    } catch { return d }
}

/* ─── shimmer skeleton ─── */
function sk(w: string, h = 14, r = 8) {
    return {
        width: w, height: h, borderRadius: r,
        background: "linear-gradient(110deg, var(--t-border) 30%, var(--t-border-light) 50%, var(--t-border) 70%)",
        backgroundSize: "200% 100%",
        animation: "profShimmer 1.6s ease-in-out infinite",
    } as React.CSSProperties
}

function Skeleton() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "profFadeUp .3s ease-out" }}>
            <style>{CSS}</style>
            {/* Header skeleton */}
            <div style={{ borderRadius: 12, padding: 24, background: "var(--t-card)", border: "1px solid var(--t-border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={sk("72px", 72, 14)} />
                    <div style={{ flex: 1 }}>
                        <div style={sk("150px", 18)} />
                        <div style={{ ...sk("200px", 12), marginTop: 8 }} />
                        <div style={{ ...sk("120px", 10), marginTop: 8 }} />
                    </div>
                    <div style={sk("80px", 36, 9)} />
                </div>
            </div>
            {/* Cards skeleton */}
            {[0, 1].map(i => (
                <div key={i} style={{ borderRadius: 12, padding: 24, background: "var(--t-card)", border: "1px solid var(--t-border)" }}>
                    <div style={{ ...sk("100px", 14), marginBottom: 16 }} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                        {[0, 1, 2, 3].map(j => (
                            <div key={j}>
                                <div style={{ ...sk("60px", 10), marginBottom: 6 }} />
                                <div style={sk("130px", 14)} />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

/* ─── data row (view) ─── */
function DataRow({ label, value, mono, dir }: {
    label: string; value?: string | null; mono?: boolean; dir?: string
}) {
    const empty = !value
    return (
        <div style={{
            display: "flex", alignItems: "baseline", justifyContent: "space-between",
            padding: "10px 0", borderBottom: "1px solid var(--t-border-light)",
        }}>
            <span style={{ fontSize: 13, color: "var(--t-text-faint)", flexShrink: 0 }}>{label}</span>
            <span style={{
                fontSize: mono ? 12 : 13, color: empty ? "var(--t-border)" : "var(--t-text-secondary)",
                fontFamily: mono ? "monospace" : "inherit", maxWidth: "60%",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }} dir={dir}>
                {value || "—"}
            </span>
        </div>
    )
}

/* ─── edit field ─── */
function InputField({ label, name, value, onChange, placeholder, dir, type = "text" }: {
    label: string; name: string; value: string; onChange: (n: string, v: string) => void
    placeholder?: string; dir?: string; type?: string
}) {
    const [focused, setFocused] = useState(false)
    return (
        <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--t-text-faint)", marginBottom: 6 }}>{label}</label>
            <input type={type} value={value} onChange={e => onChange(name, e.target.value)}
                placeholder={placeholder} dir={dir}
                onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10,
                    border: "1px solid", outline: "none",
                    borderColor: focused ? "var(--t-accent)" : "var(--t-border)",
                    background: "var(--t-surface)", fontSize: 13, color: "var(--t-text)",
                    transition: "border-color .2s, box-shadow .2s",
                    boxShadow: focused ? "0 0 0 3px var(--t-accent-muted)" : "none",
                }} />
        </div>
    )
}

/* ─── section wrapper ─── */
function Card({ title, dim, children }: { title: string; dim?: boolean; children: React.ReactNode }) {
    return (
        <div style={{
            borderRadius: 12, background: "var(--t-card)", border: "1px solid var(--t-border)",
            transition: "opacity .2s", opacity: dim ? 0.5 : 1,
        }}>
            <div style={{ padding: "16px 20px 4px" }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)", letterSpacing: "-0.01em", margin: 0 }}>{title}</h3>
            </div>
            <div style={{ padding: "0 20px 18px" }}>{children}</div>
        </div>
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
    const [form, setForm] = useState({
        first_name: "", last_name: "", phone: "", profile_picture: "",
    })

    const bg = isFetching && !isLoading

    const startEdit = useCallback(() => {
        if (!profile) return
        setErrors([])
        setForm({
            first_name: profile.first_name || "",
            last_name: profile.last_name || "",
            phone: profile.phone || "",
            profile_picture: profile.profile_picture || "",
        })
        setEditing(true)
    }, [profile])

    const cancel = useCallback(() => { setEditing(false); setErrors([]) }, [])

    const change = useCallback((n: string, v: string) => {
        setForm(p => ({ ...p, [n]: v }))
        setErrors(p => p.filter(e => e.field !== n))
    }, [])

    const save = useCallback(() => {
        if (!profile) return
        setErrors([])
        const payload: UpdateUserProfilePayload = {
            user_id: profile.user_id,
            username_login: profile.email,
            first_name: form.first_name?.trim() || null,
            last_name: form.last_name?.trim() || null,
            phone: form.phone?.trim() || null,
            profile_picture: form.profile_picture?.trim() || null,
        }
        mut.mutate(payload, {
            onSuccess: () => cancel(),
            onError: (e: any) => { if (e.validationErrors?.length) setErrors(e.validationErrors) },
        })
    }, [profile, form, mut, cancel])

    const sessionDate = useMemo(() => fmtDateTime(profile?.session?.login_time), [profile?.session?.login_time])

    /* loading */
    if (isLoading) return <Skeleton />

    /* error */
    if (isError) return (
        <div style={{
            borderRadius: 14, background: "var(--t-danger-soft)", border: "1px solid var(--t-danger-soft)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "48px 24px", textAlign: "center", animation: "profFadeUp .3s ease-out",
        }}>
            <style>{CSS}</style>
            <div style={{
                width: 48, height: 48, borderRadius: 12, background: "var(--t-danger-soft)",
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12,
            }}>
                <AlertCircle size={20} style={{ color: "var(--t-danger)" }} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--t-text)", margin: "0 0 4px" }}>فشل تحميل بيانات الملف الشخصي</p>
            <p style={{ fontSize: 12, color: "var(--t-text-faint)", margin: "0 0 14px" }}>تحقق من اتصالك وأعد المحاولة</p>
            <button onClick={() => refetch()} style={{
                padding: "8px 18px", borderRadius: 9, border: "none", cursor: "pointer",
                background: "var(--t-accent)", color: "var(--t-text-on-accent)",
                fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5,
            }}>
                <RefreshCw size={12} /> إعادة المحاولة
            </button>
        </div>
    )

    const roleLabels: Record<string, string> = { owner: "مالك", admin: "مدير", user: "مستخدم" }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "profFadeUp .3s ease-out" }}>
            <style>{CSS}</style>
            <FetchingBar visible={bg} />

            {/* ── HEADER ── */}
            <div style={{
                borderRadius: 12, background: "var(--t-card)", border: "1px solid var(--t-border)", overflow: "hidden",
            }}>
                {/* Top accent bar */}
                <div style={{ height: 2, background: "linear-gradient(to left, var(--t-border), var(--t-accent), var(--t-border))" }} />

                <div style={{ padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            {/* Avatar */}
                            {profile?.profile_picture ? (
                                <img src={profile.profile_picture} alt=""
                                    style={{ width: 72, height: 72, borderRadius: 14, border: "1px solid var(--t-border)", objectFit: "cover" }} />
                            ) : (
                                <div style={{
                                    width: 72, height: 72, borderRadius: 14,
                                    background: "var(--t-accent-muted)", border: "1px solid var(--t-border)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <span style={{ fontSize: 26, fontWeight: 800, color: "var(--t-accent)" }}>
                                        {(profile?.first_name || "U").charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}

                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.02em", margin: 0 }}>
                                        {profile?.full_name || `${profile?.first_name} ${profile?.last_name}`}
                                    </h2>
                                    <span style={{
                                        display: "inline-flex", alignItems: "center", gap: 3,
                                        padding: "2px 8px", borderRadius: 6,
                                        background: "var(--t-accent-muted)", fontSize: 10, fontWeight: 600,
                                        color: "var(--t-text-muted)", textTransform: "uppercase",
                                    }}>
                                        <Shield size={9} />
                                        {roleLabels[profile?.role || ""] || profile?.role || "—"}
                                    </span>
                                    {profile?.is_owner && (
                                        <span style={{
                                            display: "inline-flex", alignItems: "center", gap: 3,
                                            padding: "2px 8px", borderRadius: 6,
                                            background: "var(--t-surface)", border: "1px solid var(--t-border-light)",
                                            fontSize: 10, fontWeight: 600, color: "var(--t-text-muted)", textTransform: "uppercase",
                                        }}>
                                            مالك المؤسسة
                                        </span>
                                    )}
                                </div>

                                <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--t-text-faint)" }}>
                                    <span style={{ fontFamily: "monospace" }} dir="ltr">{profile?.email}</span>
                                    {profile?.position && (
                                        <>
                                            <span style={{ width: 1, height: 12, background: "var(--t-border)" }} />
                                            <span>{profile.position}</span>
                                        </>
                                    )}
                                </div>

                                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: "var(--t-text-faint)" }}>
                                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                        {profile?.email_verified
                                            ? <><CheckCircle2 size={10} style={{ color: "var(--t-success)" }} /> البريد مؤكد</>
                                            : <><XCircle size={10} style={{ color: "var(--t-danger)" }} /> البريد غير مؤكد</>}
                                    </span>
                                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                        <span style={{
                                            width: 6, height: 6, borderRadius: "50%",
                                            background: profile?.is_active ? "var(--t-success)" : "var(--t-border)",
                                        }} />
                                        {profile?.is_active ? "نشط" : "غير نشط"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {!editing && (
                            <button onClick={startEdit} style={{
                                padding: "9px 18px", borderRadius: 9, cursor: "pointer",
                                border: "1px solid var(--t-border)", background: "var(--t-card)",
                                color: "var(--t-text-secondary)", fontSize: 13, fontWeight: 600,
                                display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                                boxShadow: "0 1px 2px var(--t-shadow)", transition: "all .15s",
                            }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--t-text-faint)"; e.currentTarget.style.background = "var(--t-card-hover)" }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--t-border)"; e.currentTarget.style.background = "var(--t-card)" }}>
                                <Edit3 size={14} /> تعديل
                            </button>
                        )}
                    </div>

                    {/* Meta strip */}
                    <div style={{
                        marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--t-border-light)",
                        display: "flex", alignItems: "center", gap: 16, fontSize: 11, color: "var(--t-text-faint)",
                    }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "monospace" }} dir="ltr">
                            <Hash size={10} style={{ color: "var(--t-text-faint)" }} />
                            {profile?.user_id?.slice(0, 12)}…
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "monospace" }} dir="ltr">
                            <Globe size={10} style={{ color: "var(--t-text-faint)" }} />
                            {profile?.tenant_id}
                        </span>
                        {profile?.roles && profile.roles.length > 0 && (
                            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <Shield size={10} style={{ color: "var(--t-text-faint)" }} />
                                {profile.roles.join("، ")}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ── EDIT MODE ── */}
            {editing ? (
                <div style={{
                    borderRadius: 12, background: "var(--t-card)", border: "1px solid var(--t-border)",
                    overflow: "hidden", animation: "profFadeUp .2s ease-out",
                }}>
                    <div style={{
                        padding: "14px 20px", borderBottom: "1px solid var(--t-border-light)",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)", margin: 0 }}>تعديل الملف الشخصي</h3>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <button onClick={cancel} disabled={mut.isPending} style={{
                                padding: "8px 16px", borderRadius: 9, cursor: "pointer",
                                border: "1px solid var(--t-border)", background: "transparent",
                                color: "var(--t-text-muted)", fontSize: 13, fontWeight: 500,
                                display: "flex", alignItems: "center", gap: 5,
                                opacity: mut.isPending ? 0.4 : 1, transition: "all .12s",
                            }}>
                                <X size={13} /> إلغاء
                            </button>
                            <button onClick={save} disabled={mut.isPending} style={{
                                padding: "8px 20px", borderRadius: 9, cursor: "pointer",
                                border: "none", background: "var(--t-accent)",
                                color: "var(--t-text-on-accent)", fontSize: 13, fontWeight: 600,
                                display: "flex", alignItems: "center", gap: 5,
                                opacity: mut.isPending ? 0.5 : 1, boxShadow: "0 1px 3px var(--t-shadow)",
                                transition: "all .12s",
                            }}>
                                {mut.isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                                حفظ التغييرات
                            </button>
                        </div>
                    </div>

                    <div style={{ padding: 20 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <InputField label="الاسم الأول" name="first_name" value={form.first_name} onChange={change} placeholder="الاسم الأول" />
                            <InputField label="اسم العائلة" name="last_name" value={form.last_name} onChange={change} placeholder="اسم العائلة" />
                            <InputField label="رقم الهاتف" name="phone" value={form.phone} onChange={change} placeholder="+967771234567" dir="ltr" type="tel" />
                            <InputField label="رابط الصورة" name="profile_picture" value={form.profile_picture} onChange={change} placeholder="https://..." dir="ltr" />
                        </div>

                        {errors.length > 0 && (
                            <div style={{
                                marginTop: 16, borderRadius: 10, padding: 14,
                                border: "1px solid var(--t-danger-soft)", background: "var(--t-danger-soft)",
                                animation: "profFadeUp .15s ease-out",
                            }}>
                                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--t-danger)", margin: "0 0 6px", display: "flex", alignItems: "center", gap: 5 }}>
                                    <AlertCircle size={13} /> أخطاء
                                </p>
                                <ul style={{ margin: 0, paddingRight: 16, display: "flex", flexDirection: "column", gap: 3 }}>
                                    {errors.map((e, i) => (
                                        <li key={i} style={{ fontSize: 12, color: "var(--t-text-muted)" }}>
                                            <span style={{ fontWeight: 600, color: "var(--t-text-secondary)" }}>{e.field}:</span> {e.message}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {mut.isError && errors.length === 0 && (
                            <div style={{
                                marginTop: 16, borderRadius: 10, padding: 14,
                                border: "1px solid var(--t-danger-soft)", background: "var(--t-danger-soft)",
                                display: "flex", alignItems: "center", gap: 8,
                            }}>
                                <AlertCircle size={13} style={{ color: "var(--t-danger)", flexShrink: 0 }} />
                                <span style={{ fontSize: 12, color: "var(--t-text-muted)" }}>{(mut.error as any)?.message || "فشل التحديث"}</span>
                            </div>
                        )}
                    </div>
                </div>

            ) : (
                /* ── VIEW MODE ── */
                <>
                    {/* Details */}
                    <Card title="معلومات الحساب" dim={bg}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px", marginTop: 8 }}>
                            <div>
                                <DataRow label="البريد الإلكتروني" value={profile?.email} mono dir="ltr" />
                                <DataRow label="الهاتف" value={profile?.phone} mono dir="ltr" />
                                <DataRow label="المنصب" value={profile?.position} />
                            </div>
                            <div>
                                <DataRow label="الدور" value={roleLabels[profile?.role || ""] || profile?.role} />
                                <DataRow label="المؤسسة" value={profile?.tenant_id} mono dir="ltr" />
                            </div>
                        </div>
                    </Card>

                    {/* Session */}
                    {profile?.session && (
                        <Card title="الجلسة الحالية" dim={bg}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px", marginTop: 8 }}>
                                <div>
                                    <DataRow label="وقت الدخول" value={sessionDate} />
                                    <DataRow label="عنوان IP" value={profile.session.ip_address} mono dir="ltr" />
                                </div>
                                <div>
                                    <DataRow label="انتهاء الجلسة" value={
                                        profile.session.expires_at
                                            ? new Date(profile.session.expires_at).toLocaleDateString("ar-SA", { timeZone: "Asia/Aden" })
                                            : null
                                    } />
                                </div>
                            </div>
                        </Card>
                    )}
                </>
            )}
        </div>
    )
}
