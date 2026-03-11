import {
    Shield, Monitor, Clock, Wifi, Globe,
    CheckCircle2, AlertCircle,
} from "lucide-react"
import { useUserProfile } from "../hooks/use-settings"

const CSS = `@keyframes secFade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}`

const card: React.CSSProperties = {
    borderRadius: 12, background: "var(--t-card, #fff)",
    border: "1px solid var(--t-border-light, #eaedf0)",
}

const sectionHeader: React.CSSProperties = {
    padding: "14px 22px",
    borderBottom: "1px solid var(--t-border-light, #eaedf0)",
    display: "flex", alignItems: "center", gap: 8,
}

function fmtDateTime(d: string | null | undefined): string {
    if (!d) return "—"
    try {
        return new Intl.DateTimeFormat("ar-SA", {
            year: "numeric", month: "short", day: "numeric",
            hour: "2-digit", minute: "2-digit", timeZone: "Asia/Aden",
        }).format(new Date(d))
    } catch { return d }
}

function parseUA(ua?: string): string {
    if (!ua) return "—"
    if (ua.includes("Chrome") && !ua.includes("Edg")) return "Google Chrome"
    if (ua.includes("Edg")) return "Microsoft Edge"
    if (ua.includes("Firefox")) return "Mozilla Firefox"
    if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari"
    return "متصفح آخر"
}

export function SecurityTab() {
    const { data: profile } = useUserProfile()
    const session = profile?.session

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "secFade .3s ease-out" }}>
            <style>{CSS}</style>

            {/* ═══ 1. ACTIVE SESSION ═══ */}
            <div style={card}>
                <div style={sectionHeader}>
                    <div style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: "rgba(34,197,94,0.06)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <Monitor size={14} style={{ color: "#16a34a" }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text, var(--t-text))" }}>الجلسة النشطة</span>
                    <span style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: "#22c55e", flexShrink: 0,
                        boxShadow: "0 0 0 2px rgba(34,197,94,0.15)",
                    }} />
                </div>
                <div style={{ padding: "16px 22px" }}>
                    {session ? (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <InfoBox icon={Clock} label="وقت الدخول" value={fmtDateTime(session.login_time)} />
                            <InfoBox icon={Wifi} label="عنوان IP" value={session.ip_address} mono dir="ltr" />
                            <InfoBox icon={Globe} label="المتصفح" value={parseUA(session.user_agent)} />
                            <InfoBox icon={Clock} label="انتهاء الجلسة" value={fmtDateTime(session.expires_at)} />
                        </div>
                    ) : (
                        <p style={{ fontSize: 12, color: "var(--t-text-faint)", margin: 0 }}>لا توجد بيانات جلسة متاحة</p>
                    )}
                </div>
            </div>

            {/* ═══ 2. EMAIL VERIFICATION ═══ */}
            <div style={card}>
                <div style={sectionHeader}>
                    <div style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: "linear-gradient(135deg, rgba(27,80,145,0.08), rgba(77,166,232,0.06))",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <Shield size={14} style={{ color: "var(--t-accent)" }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text, var(--t-text))" }}>حالة التحقق</span>
                </div>
                <div style={{ padding: "14px 22px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: profile?.email_verified ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.06)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        {profile?.email_verified
                            ? <CheckCircle2 size={18} style={{ color: "#16a34a" }} />
                            : <AlertCircle size={18} style={{ color: "var(--t-danger)" }} />}
                    </div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t-text, var(--t-text))" }}>
                            {profile?.email_verified ? "البريد الإلكتروني مؤكد" : "البريد الإلكتروني غير مؤكد"}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginTop: 1 }}>
                            {profile?.email} — {profile?.email_verified ? "تم التحقق بنجاح" : "يرجى تأكيد بريدك الإلكتروني"}
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ 3. ACCOUNT INFO ═══ */}
            <div style={card}>
                <div style={sectionHeader}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text, var(--t-text))" }}>معلومات الحساب</span>
                </div>
                <div style={{ padding: "14px 22px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <InfoBox icon={Shield} label="الدور" value={
                            ({ owner: "مالك", admin: "مدير", user: "مستخدم" } as Record<string, string>)[profile?.role || ""] || profile?.role || "—"
                        } />
                        <InfoBox icon={CheckCircle2} label="حالة الحساب" value={profile?.is_active ? "نشط" : "معطّل"} />
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ── Sub-component ── */
function InfoBox({ icon: Icon, label, value, mono, dir }: {
    icon: typeof Clock; label: string; value?: string | null; mono?: boolean; dir?: string
}) {
    return (
        <div style={{
            padding: 12, borderRadius: 8,
            background: "var(--t-surface, var(--t-page))",
            border: "1px solid var(--t-border-light, #f2f3f5)",
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                <Icon size={11} style={{ color: "var(--t-text-faint)" }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--t-text-faint)" }}>{label}</span>
            </div>
            <div style={{
                fontSize: 12.5, fontWeight: 600, color: "var(--t-text, #1f2937)",
                fontFamily: mono ? "monospace" : "inherit",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }} dir={dir}>
                {value || "—"}
            </div>
        </div>
    )
}
