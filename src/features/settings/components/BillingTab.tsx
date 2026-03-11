import { useMemo } from "react"
import {
    AlertCircle, RefreshCw,
    Calendar, CreditCard, BarChart3,
    Users, MessageCircle, Database, Zap, HardDrive,
    Crown, Shield, Clock, TrendingUp,
} from "lucide-react"
import { useOrganization } from "../hooks/use-settings"
import { useAuthStore } from "@/stores/auth-store"
import { FetchingBar } from "@/components/ui/FetchingBar"
import type { LimitItem } from "../types"

const CSS = `
@keyframes blIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes blBar{from{width:0}to{width:var(--pct)}}
@keyframes blPulse{0%,100%{opacity:1}50%{opacity:.6}}
@keyframes spin{to{transform:rotate(360deg)}}

.bl-card{border-radius:14px;border:1px solid var(--t-border);background:#fff;overflow:hidden;animation:blIn .2s ease-out}
.bl-card-header{display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid #f0f1f3}
.bl-card-body{padding:16px 18px}

.bl-usage-item{padding:12px 14px;border-radius:10px;border:1px solid var(--t-border);background:#fafbfc;transition:all .12s}
.bl-usage-item:hover{border-color:var(--t-border-medium);background:var(--t-surface)}

.bl-bar-track{height:6px;width:100%;border-radius:4px;background:var(--t-border);overflow:hidden}
.bl-bar-fill{height:100%;border-radius:4px;transition:width .8s ease-out}

.bl-data-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f0f1f3}
.bl-data-row:last-child{border-bottom:none}

.bl-skeleton{animation:blPulse 1.5s infinite;border-radius:8px;background:#f0f1f3}
`

function fmtDate(d: string | null | undefined): string {
    if (!d) return "—"
    try { return new Intl.DateTimeFormat("ar", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Aden" }).format(new Date(d)) }
    catch { return d }
}

const USAGE_ICONS: Record<string, React.ElementType> = {
    المستخدمون: Users, "جهات الاتصال": MessageCircle, الرسائل: MessageCircle,
    التخزين: HardDrive, "طلبات API": Zap,
}

const USAGE_COLORS: Record<string, string> = {
    المستخدمون: "var(--t-accent)", "جهات الاتصال": "var(--t-accent-secondary)", الرسائل: "#6366f1",
    التخزين: "#8b5cf6", "طلبات API": "var(--t-warning)",
}

function UsageItem({ label, limit }: { label: string; limit: LimitItem | undefined }) {
    if (!limit) return null
    const max = limit.max_count ?? limit.max_per_month ?? limit.max_size_gb ?? limit.max_requests_per_day ?? 0
    const cur = limit.current_count ?? limit.current_month_count ?? limit.current_size_gb ?? limit.current_requests_today ?? 0
    const pct = max > 0 ? Math.min((cur / max) * 100, 100) : 0
    const unit = limit.max_size_gb !== undefined ? " GB" : ""
    const isHigh = pct > 85
    const isMedium = pct > 60
    const color = USAGE_COLORS[label] || "var(--t-accent)"
    const Icon = USAGE_ICONS[label] || Database

    const barColor = isHigh ? "var(--t-danger)" : isMedium ? "var(--t-warning)" : color

    return (
        <div className="bl-usage-item">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}08`, border: `1px solid ${color}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={13} style={{ color }} />
                    </div>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--t-text)" }}>{label}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--t-text)", fontFamily: "monospace", direction: "ltr" as const }}>
                    {cur}{unit} <span style={{ color: "#b0b7c3", fontWeight: 500 }}>/ {max}{unit}</span>
                </span>
            </div>
            <div className="bl-bar-track">
                <div className="bl-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)` }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: isHigh ? "var(--t-danger)" : "var(--t-text-faint)" }}>
                    {pct.toFixed(0)}% مستخدم
                </span>
                {isHigh && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: "var(--t-danger)", background: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.1)", padding: "2px 7px", borderRadius: 5 }}>
                        يقترب من الحد
                    </span>
                )}
            </div>
        </div>
    )
}

function DataRow({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
    return (
        <div className="bl-data-row">
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {icon && <span style={{ color: "#b0b7c3" }}>{icon}</span>}
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t-text-muted)" }}>{label}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: value ? "var(--t-text)" : "var(--t-border-medium)" }}>{value || "—"}</span>
        </div>
    )
}

function Card({ title, icon: Icon, accent, children }: { title: string; icon: typeof CreditCard; accent?: string; children: React.ReactNode }) {
    const c = accent || "var(--t-accent)"
    return (
        <div className="bl-card">
            <div style={{ height: 3, background: `linear-gradient(90deg, ${c}, ${c}99)` }} />
            <div className="bl-card-header">
                <div style={{ width: 30, height: 30, borderRadius: 9, background: `linear-gradient(135deg, ${c}, ${c}cc)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={13} style={{ color: "#fff" }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)" }}>{title}</span>
            </div>
            <div className="bl-card-body">{children}</div>
        </div>
    )
}

function SkeletonBlock() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[1, 2, 3].map(i => (
                <div key={i} className="bl-card" style={{ padding: 20 }}>
                    <div className="bl-skeleton" style={{ width: 120, height: 18, marginBottom: 18 }} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {[1, 2].map(j => (
                            <div key={j} style={{ padding: 14, borderRadius: 10, background: "#fafbfc" }}>
                                <div className="bl-skeleton" style={{ width: 80, height: 14, marginBottom: 10 }} />
                                <div className="bl-skeleton" style={{ height: 6, width: "100%" }} />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

export function BillingTab() {
    const user = useAuthStore(s => s.user)
    const tenantId = user?.tenant_id || ""
    const { data: org, isLoading, isFetching, isError, refetch } = useOrganization(tenantId)
    const bg = isFetching && !isLoading

    const trialDays = useMemo(() => {
        if (!org?.trial_ends_at) return null
        const d = new Date(org.trial_ends_at).getTime() - Date.now()
        return d > 0 ? Math.ceil(d / 86_400_000) : 0
    }, [org?.trial_ends_at])

    if (isLoading) return <><style>{CSS}</style><SkeletonBlock /></>

    if (isError || !org) return (
        <div style={{ direction: "rtl" }}>
            <style>{CSS}</style>
            <div className="bl-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--t-surface)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                    <AlertCircle size={22} style={{ color: "var(--t-border-medium)" }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)", marginBottom: 4 }}>فشل تحميل بيانات الاشتراك</div>
                <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginBottom: 16 }}>تحقق من الاتصال بالإنترنت وأعد المحاولة</div>
                <button onClick={() => refetch()} style={{
                    display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 18px", borderRadius: 8,
                    border: "1.5px solid var(--t-border)", background: "#fff", color: "var(--t-text)", fontSize: 12, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit", transition: "all .12s",
                }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--t-accent)"; e.currentTarget.style.color = "var(--t-accent)" }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--t-border)"; e.currentTarget.style.color = "var(--t-text)" }}>
                    <RefreshCw size={12} /> إعادة المحاولة
                </button>
            </div>
        </div>
    )

    const limits = org.plan_snapshot?.limits || org.effective_limits
    const planName = org.plan_snapshot?.plan_name || org.plan || "—"
    const status = org.status

    const statusColor = status === "active" ? "#16a34a" : status === "trial" ? "var(--t-warning)" : "var(--t-text-faint)"
    const statusLabel = status === "active" ? "نشط" : status === "trial" ? "تجريبي" : status === "expired" ? "منتهي" : status || "—"

    return (
        <div style={{ direction: "rtl", display: "flex", flexDirection: "column", gap: 14 }}>
            <style>{CSS}</style>
            <FetchingBar visible={bg} />

            {/* Trial Notice */}
            {trialDays !== null && (
                <div style={{
                    borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
                    border: trialDays > 0 ? "1px solid var(--t-border)" : "1px solid var(--t-danger)",
                    background: trialDays > 0 ? "#fafbfc" : "rgba(239,68,68,.04)",
                    animation: "blIn .2s ease-out",
                }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: 9,
                        background: trialDays > 0 ? "linear-gradient(135deg, var(--t-warning), #fbbf24)" : "linear-gradient(135deg, var(--t-danger), #f87171)",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                        <Calendar size={15} style={{ color: "#fff" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: trialDays > 0 ? "var(--t-text)" : "var(--t-danger)" }}>
                            {trialDays > 0 ? `${trialDays} يوم متبقي في الفترة التجريبية` : "انتهت الفترة التجريبية"}
                        </div>
                        {org.trial_ends_at && <div style={{ fontSize: 10, color: "var(--t-text-faint)", marginTop: 1 }}>حتى {fmtDate(org.trial_ends_at)}</div>}
                    </div>
                    {trialDays === 0 && (
                        <button style={{
                            display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 8,
                            border: "none", background: "var(--t-brand-orange)", color: "#fff",
                            fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                            boxShadow: "0 2px 8px rgba(27,80,145,.15)",
                        }}>
                            <Crown size={11} /> ترقية الآن
                        </button>
                    )}
                </div>
            )}

            {/* Plan Overview — Hero */}
            <div className="bl-card">
                <div style={{
                    height: 3, background: "linear-gradient(90deg, var(--t-accent), var(--t-accent-secondary))",
                }} />
                <div style={{
                    padding: "20px 20px 16px", display: "flex", alignItems: "center", gap: 14,
                    borderBottom: "1px solid #f0f1f3",
                }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 14,
                        background: "var(--t-brand-orange)",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        boxShadow: "0 4px 16px rgba(27,80,145,.2)",
                    }}>
                        <Crown size={22} style={{ color: "#fff" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 20, fontWeight: 800, color: "var(--t-text)" }}>{planName}</span>
                            <span style={{
                                fontSize: 10, fontWeight: 700, color: statusColor,
                                background: `${statusColor}08`, border: `1px solid ${statusColor}18`,
                                padding: "2px 8px", borderRadius: 6,
                            }}>
                                {statusLabel}
                            </span>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginTop: 2 }}>خطة الاشتراك الحالية للمؤسسة</div>
                    </div>
                </div>
                <div style={{ padding: "14px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                    <div>
                        <DataRow label="بداية التجربة" value={fmtDate(org.trial_started_at)} icon={<Clock size={11} />} />
                        <DataRow label="نهاية التجربة" value={fmtDate(org.trial_ends_at)} icon={<Calendar size={11} />} />
                    </div>
                    <div style={{ borderRight: "1px solid #f0f1f3", paddingRight: 16, marginRight: 16 }}>
                        <DataRow label="تاريخ الإنشاء" value={fmtDate(org.created_at)} icon={<Shield size={11} />} />
                        <DataRow label="آخر تحديث" value={fmtDate(org.updated_at)} icon={<RefreshCw size={11} />} />
                    </div>
                </div>
            </div>

            {/* Usage & Limits */}
            {limits && (
                <Card title="الاستخدام والحدود" icon={BarChart3} accent="var(--t-accent-secondary)">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <UsageItem label="المستخدمون" limit={limits.users} />
                        <UsageItem label="جهات الاتصال" limit={limits.contacts} />
                        <UsageItem label="الرسائل" limit={limits.messages} />
                        <UsageItem label="التخزين" limit={limits.storage} />
                        <UsageItem label="طلبات API" limit={limits.api} />
                    </div>
                    {/* Quick summary */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: 6, marginTop: 12,
                        padding: "8px 12px", borderRadius: 8, background: "#fafbfc", border: "1px solid var(--t-border)",
                    }}>
                        <TrendingUp size={12} style={{ color: "var(--t-accent)" }} />
                        <span style={{ fontSize: 10, color: "var(--t-text-muted)" }}>
                            يتم تحديث بيانات الاستخدام تلقائياً. تواصل معنا لترقية خطتك.
                        </span>
                    </div>
                </Card>
            )}
        </div>
    )
}
