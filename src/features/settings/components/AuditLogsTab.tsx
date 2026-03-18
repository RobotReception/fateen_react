import { useState, useMemo, useCallback } from "react"
import {
    Search, RefreshCw, AlertCircle, Clock, User, Shield,
    ChevronLeft, ChevronRight, Filter, X, Activity, Eye,
    CheckCircle2, XCircle, AlertTriangle, Loader2,
    Globe, Monitor, Hash, Timer, ArrowLeft,
} from "lucide-react"
import { useAuditLogs } from "../hooks/use-audit-logs"
import type { AuditLogsFilters, AuditLogEntry } from "../services/audit-logs-service"

/* ── Styles ── */
const CSS = `
@keyframes auditFade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
@keyframes auditSlideIn{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:none}}
@keyframes auditShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
`
const card: React.CSSProperties = {
    background: "var(--t-card, #fff)",
    borderRadius: 14,
    border: "1px solid var(--t-border-light, #e8eaed)",
    overflow: "hidden",
}

/* ── Status helpers ── */
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
    success:      { label: "ناجح",      color: "#16a34a", bg: "rgba(22,163,74,.08)",  icon: CheckCircle2 },
    fail:         { label: "فاشل",      color: "#dc2626", bg: "rgba(220,38,38,.08)",  icon: XCircle },
    error:        { label: "خطأ",       color: "#dc2626", bg: "rgba(220,38,38,.08)",  icon: AlertCircle },
    unauthorized: { label: "غير مصرح",  color: "#d97706", bg: "rgba(217,119,6,.08)",  icon: AlertTriangle },
}

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] || { label: status, color: "var(--t-text-faint)", bg: "var(--t-surface)", icon: Activity }
    const Icon = cfg.icon
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 10px", borderRadius: 6,
            background: cfg.bg, color: cfg.color,
            fontSize: 10.5, fontWeight: 600,
        }}>
            <Icon size={10} />
            {cfg.label}
        </span>
    )
}

/* ── Method badge ── */
function MethodBadge({ method }: { method: string }) {
    const colors: Record<string, string> = {
        GET: "#2563eb", POST: "#16a34a", PUT: "#d97706",
        PATCH: "#d97706", DELETE: "#dc2626",
    }
    return (
        <span style={{
            fontSize: 10, fontWeight: 700, fontFamily: "monospace",
            color: colors[method] || "var(--t-text-faint)",
            padding: "2px 6px", borderRadius: 4,
            background: "var(--t-surface, #f5f5f5)",
        }}>
            {method}
        </span>
    )
}

/* ── Format date — local timezone (device time) ── */
function fmtDate(iso: string | null | undefined): string {
    if (!iso) return "—"
    try {
        // Ensure UTC parsing by appending Z if no timezone info
        let raw = iso
        if (!raw.endsWith("Z") && !raw.includes("+") && !/\d{2}:\d{2}$/.test(raw.slice(-6))) {
            raw += "Z"
        }
        const d = new Date(raw)
        // Use the browser's local timezone automatically
        return d.toLocaleString("ar-SA", {
            year: "numeric", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit", second: "2-digit",
            hour12: false,
        })
    } catch { return iso }
}

/* ── Short local time (HH:mm) ── */
function fmtTime(iso: string | null | undefined): string {
    if (!iso) return "—"
    try {
        let raw = iso
        if (!raw.endsWith("Z") && !raw.includes("+") && !/\d{2}:\d{2}$/.test(raw.slice(-6))) {
            raw += "Z"
        }
        const d = new Date(raw)
        return d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", hour12: false })
    } catch { return "—" }
}

/* ── Time ago ── */
function timeAgo(iso: string | null | undefined): string {
    if (!iso) return ""
    try {
        let raw = iso
        if (!raw.endsWith("Z") && !raw.includes("+") && !/\d{2}:\d{2}$/.test(raw.slice(-6))) {
            raw += "Z"
        }
        const diff = Date.now() - new Date(raw).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 1) return "الآن"
        if (mins < 60) return `منذ ${mins} د`
        const hrs = Math.floor(mins / 60)
        if (hrs < 24) return `منذ ${hrs} س`
        const days = Math.floor(hrs / 24)
        return `منذ ${days} يوم`
    } catch { return "" }
}

/* ── Short endpoint path ── */
function shortPath(path: string | null | undefined): string {
    if (!path) return "—"
    // Remove common prefixes for better readability
    return path
        .replace(/^\/api\/backend\/v\d+/, "")
        .replace(/^\/api\/v\d+/, "")
        || path
}

/* ── Get display username ── */
function displayUser(log: AuditLogEntry): string {
    // Prefer readable username, skip UUIDs
    const u = log.username
    if (u && !/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(u)) return u
    // Check details for better info
    const details = log.details || {}
    const stEmail = details?.st_session?.claims?.email_or_username
    if (stEmail && !/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(stEmail)) return stEmail
    const jwtSub = details?.user_info?.sub
    if (jwtSub) return jwtSub
    const authAttempt = details?.auth_attempt_user
    if (authAttempt) return authAttempt
    // Fallback to username or user_id
    return u || log.user_id || "مجهول"
}


/* ── Skeleton ── */
function TableSkeleton() {
    const shimmer: React.CSSProperties = {
        background: "linear-gradient(90deg, var(--t-surface,#f5f5f5) 25%, #eee 50%, var(--t-surface,#f5f5f5) 75%)",
        backgroundSize: "200% 100%", animation: "auditShimmer 1.5s infinite", borderRadius: 6,
    }
    return (
        <div style={{ padding: 20 }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ display: "flex", gap: 16, padding: "12px 0", borderBottom: "1px solid var(--t-border-light,#f0f0f0)" }}>
                    <div style={{ ...shimmer, width: 120, height: 16 }} />
                    <div style={{ ...shimmer, flex: 1, height: 16 }} />
                    <div style={{ ...shimmer, width: 80, height: 16 }} />
                    <div style={{ ...shimmer, width: 100, height: 16 }} />
                </div>
            ))}
        </div>
    )
}

/* ── Detail drawer ── */
function DetailDrawer({ log, onClose }: { log: AuditLogEntry; onClose: () => void }) {
    const [method, ...pathParts] = (log.action || "").split(" ")
    const path = pathParts.join(" ")
    const details = log.details || {}

    // Organized sections
    const userSection = [
        { label: "المستخدم", value: displayUser(log), icon: User },
        { label: "الدور", value: log.role, icon: Shield },
        { label: "معرف المستخدم", value: log.user_id, mono: true, icon: Hash },
    ]

    const requestSection = [
        { label: "المسار", value: path || log.endpoint, mono: true, icon: Globe },
        { label: "الحالة", value: log.status, icon: Activity },
        { label: "كود الاستجابة", value: details?.status_code?.toString(), mono: true, icon: Hash },
        { label: "مدة التنفيذ", value: details?.duration_ms != null ? `${details.duration_ms} ms` : null, icon: Timer },
    ]

    const clientSection = [
        { label: "IP", value: log.ip, mono: true, icon: Globe },
        { label: "Tenant", value: log.tenant_id, mono: true, icon: Monitor },
        { label: "المتصفح", value: log.user_agent, icon: Monitor },
        { label: "الوقت", value: fmtDate(log.timestamp), icon: Clock },
    ]

    function SectionTitle({ title }: { title: string }) {
        return (
            <div style={{
                fontSize: 11, fontWeight: 700, color: "var(--t-text-faint)",
                padding: "12px 0 6px", textTransform: "uppercase", letterSpacing: "0.5px",
            }}>{title}</div>
        )
    }

    function InfoRow({ label, value, mono, icon: Icon }: { label: string; value: string | null | undefined; mono?: boolean; icon: typeof User }) {
        if (!value) return null
        return (
            <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 0", borderBottom: "1px solid var(--t-border-light,#f5f5f5)",
            }}>
                <span style={{ fontSize: 12, color: "var(--t-text-faint)", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon size={11} style={{ opacity: 0.5 }} />
                    {label}
                </span>
                <span style={{
                    fontSize: 12, fontWeight: 600, color: "var(--t-text)",
                    fontFamily: mono ? "monospace" : "inherit",
                    maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }} dir="ltr">{value}</span>
            </div>
        )
    }

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 1000,
            display: "flex", justifyContent: "flex-start",
        }}>
            {/* backdrop */}
            <div onClick={onClose} style={{
                position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)",
                animation: "auditFade .15s",
            }} />
            {/* panel */}
            <div style={{
                position: "relative", width: 520, maxWidth: "90vw",
                background: "var(--t-card, #fff)", height: "100%",
                boxShadow: "-4px 0 20px rgba(0,0,0,0.08)",
                overflowY: "auto", animation: "auditSlideIn .2s",
                display: "flex", flexDirection: "column",
            }} dir="rtl">
                {/* header */}
                <div style={{
                    padding: "14px 20px", borderBottom: "1px solid var(--t-border-light,#eaedf0)",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: "var(--t-surface, var(--t-page))",
                    position: "sticky", top: 0, zIndex: 1,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Eye size={14} style={{ color: "var(--t-accent)" }} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)" }}>تفاصيل السجل</span>
                    </div>
                    <button onClick={onClose} style={{
                        background: "var(--t-surface, #f5f5f5)", border: "none", cursor: "pointer",
                        padding: "6px 12px", borderRadius: 6, color: "var(--t-text-faint)",
                        display: "flex", alignItems: "center", gap: 4, fontSize: 11,
                    }}>
                        <ArrowLeft size={12} /> إغلاق
                    </button>
                </div>

                {/* action header */}
                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--t-border-light,#f0f0f0)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <MethodBadge method={method} />
                        <StatusBadge status={log.status} />
                        <span style={{
                            fontSize: 10, color: "var(--t-text-faint)", fontFamily: "monospace",
                        }}>{timeAgo(log.timestamp)}</span>
                    </div>
                    <code style={{
                        fontSize: 12, fontFamily: "monospace", color: "var(--t-text-secondary)",
                        wordBreak: "break-all",
                    }} dir="ltr">{path || log.endpoint}</code>
                </div>

                {/* info sections */}
                <div style={{ padding: "0 20px", flex: 1 }}>
                    <SectionTitle title="معلومات المستخدم" />
                    {userSection.map((r, i) => <InfoRow key={i} {...r} />)}

                    <SectionTitle title="معلومات الطلب" />
                    {requestSection.map((r, i) => <InfoRow key={i} {...r} />)}

                    <SectionTitle title="معلومات العميل" />
                    {clientSection.map((r, i) => <InfoRow key={i} {...r} />)}
                </div>

                {/* raw details */}
                {details && Object.keys(details).length > 0 && (
                    <div style={{ padding: "16px 20px" }}>
                        <SectionTitle title="البيانات الخام" />
                        <pre style={{
                            background: "var(--t-surface, #f8f9fa)", borderRadius: 10,
                            padding: 14, fontSize: 10.5, fontFamily: "monospace",
                            color: "var(--t-text-secondary)", lineHeight: 1.6,
                            overflow: "auto", maxHeight: 300, margin: 0,
                            border: "1px solid var(--t-border-light,#eaedf0)",
                        }} dir="ltr">
                            {JSON.stringify(details, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
export function AuditLogsTab() {
    const [filters, setFilters] = useState<AuditLogsFilters>({ page: 1, page_size: 15 })
    const [showFilters, setShowFilters] = useState(false)
    const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null)

    // Filter form state
    const [fUsername, setFUsername] = useState("")
    const [fStatus, setFStatus] = useState("")
    const [fEndpoint, setFEndpoint] = useState("")
    const [fIp, setFIp] = useState("")

    const { data, isLoading, isFetching, isError, refetch } = useAuditLogs(filters)

    const logs = data?.logs || []
    const pagination = data?.pagination
    const activeFilterCount = useMemo(() => {
        let n = 0
        if (filters.username) n++
        if (filters.status) n++
        if (filters.endpoint) n++
        if (filters.ip) n++
        return n
    }, [filters])

    const applyFilters = useCallback(() => {
        setFilters(prev => ({
            ...prev,
            page: 1,
            username: fUsername || undefined,
            status: fStatus || undefined,
            endpoint: fEndpoint || undefined,
            ip: fIp || undefined,
        }))
    }, [fUsername, fStatus, fEndpoint, fIp])

    const clearFilters = useCallback(() => {
        setFUsername(""); setFStatus(""); setFEndpoint(""); setFIp("")
        setFilters({ page: 1, page_size: 15 })
    }, [])

    const goPage = useCallback((p: number) => {
        setFilters(prev => ({ ...prev, page: p }))
    }, [])

    /* ── loading ── */
    if (isLoading) return (
        <div style={{ animation: "auditFade .3s" }}>
            <style>{CSS}</style>
            <div style={card}><TableSkeleton /></div>
        </div>
    )

    /* ── error ── */
    if (isError) return (
        <div style={{ ...card, padding: "48px 24px", textAlign: "center", animation: "auditFade .3s" }}>
            <style>{CSS}</style>
            <AlertCircle size={28} style={{ color: "var(--t-danger)", margin: "0 auto 10px" }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--t-text)", margin: "0 0 4px" }}>
                فشل تحميل سجلات التدقيق
            </p>
            <p style={{ fontSize: 12, color: "var(--t-text-faint)", margin: "0 0 14px" }}>
                تحقق من اتصالك وأعد المحاولة
            </p>
            <button onClick={() => refetch()} style={{
                padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer",
                background: "var(--t-brand-orange)", color: "#fff", fontSize: 12, fontWeight: 600,
                display: "inline-flex", alignItems: "center", gap: 5,
            }}>
                <RefreshCw size={12} /> إعادة المحاولة
            </button>
        </div>
    )

    const inputStyle: React.CSSProperties = {
        width: "100%", padding: "8px 12px", borderRadius: 8,
        border: "1px solid var(--t-border-light, var(--t-border))",
        background: "var(--t-surface, var(--t-card-hover))",
        fontSize: 12.5, color: "var(--t-text)", outline: "none",
        transition: "border-color .15s",
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "auditFade .3s" }}>
            <style>{CSS}</style>

            {/* ── Header card ── */}
            <div style={card}>
                <div style={{
                    height: 3,
                    background: "linear-gradient(90deg, var(--t-accent), var(--t-accent-secondary), var(--t-accent-light))",
                }} />
                <div style={{
                    padding: "14px 20px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: "rgba(27,80,145,0.08)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <Shield size={15} style={{ color: "var(--t-accent)" }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)" }}>
                                سجلات التدقيق
                            </div>
                            <div style={{ fontSize: 11.5, color: "var(--t-text-faint)" }}>
                                {pagination?.totalCount != null
                                    ? `${pagination.totalCount.toLocaleString("ar-SA")} سجل`
                                    : "جميع العمليات على النظام"}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        {/* filter toggle */}
                        <button onClick={() => setShowFilters(!showFilters)} style={{
                            padding: "7px 14px", borderRadius: 8, cursor: "pointer",
                            border: "1px solid var(--t-border-light, var(--t-border))",
                            background: showFilters ? "rgba(27,80,145,.06)" : "var(--t-card, #fff)",
                            color: "var(--t-text-secondary)", fontSize: 12, fontWeight: 500,
                            display: "flex", alignItems: "center", gap: 5,
                            transition: "background .12s",
                        }}>
                            <Filter size={12} />
                            فلترة
                            {activeFilterCount > 0 && (
                                <span style={{
                                    background: "var(--t-accent)", color: "#fff",
                                    borderRadius: "50%", width: 16, height: 16,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 9, fontWeight: 700,
                                }}>{activeFilterCount}</span>
                            )}
                        </button>
                        {/* refresh */}
                        <button onClick={() => refetch()} disabled={isFetching} style={{
                            padding: "7px 14px", borderRadius: 8, cursor: "pointer",
                            border: "1px solid var(--t-border-light, var(--t-border))",
                            background: "var(--t-card, #fff)",
                            color: "var(--t-text-secondary)", fontSize: 12, fontWeight: 500,
                            display: "flex", alignItems: "center", gap: 5,
                            opacity: isFetching ? 0.5 : 1,
                        }}>
                            {isFetching
                                ? <Loader2 size={12} className="animate-spin" />
                                : <RefreshCw size={12} />}
                            تحديث
                        </button>
                    </div>
                </div>

                {/* ── Filter panel ── */}
                {showFilters && (
                    <div style={{
                        padding: "14px 20px", borderTop: "1px solid var(--t-border-light,#eaedf0)",
                        background: "var(--t-surface, var(--t-page))",
                        animation: "auditFade .15s",
                    }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--t-text-faint)", marginBottom: 4 }}>المستخدم</label>
                                <input
                                    value={fUsername} onChange={e => setFUsername(e.target.value)}
                                    placeholder="البريد أو الاسم"
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--t-text-faint)", marginBottom: 4 }}>الحالة</label>
                                <select
                                    value={fStatus} onChange={e => setFStatus(e.target.value)}
                                    style={inputStyle}
                                >
                                    <option value="">الكل</option>
                                    <option value="success">ناجح</option>
                                    <option value="fail">فاشل</option>
                                    <option value="error">خطأ</option>
                                    <option value="unauthorized">غير مصرح</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--t-text-faint)", marginBottom: 4 }}>المسار</label>
                                <input
                                    value={fEndpoint} onChange={e => setFEndpoint(e.target.value)}
                                    placeholder="/api/..." dir="ltr"
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--t-text-faint)", marginBottom: 4 }}>IP</label>
                                <input
                                    value={fIp} onChange={e => setFIp(e.target.value)}
                                    placeholder="192.168..." dir="ltr"
                                    style={inputStyle}
                                />
                            </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                            {activeFilterCount > 0 && (
                                <button onClick={clearFilters} style={{
                                    padding: "6px 14px", borderRadius: 7, cursor: "pointer",
                                    border: "1px solid var(--t-border, #dcdfe3)", background: "var(--t-card, #fff)",
                                    color: "var(--t-text-faint)", fontSize: 11.5, fontWeight: 500,
                                    display: "flex", alignItems: "center", gap: 4,
                                }}>
                                    <X size={11} /> مسح الفلاتر
                                </button>
                            )}
                            <button onClick={applyFilters} style={{
                                padding: "6px 18px", borderRadius: 7, cursor: "pointer",
                                border: "none", background: "var(--t-accent)", color: "#fff",
                                fontSize: 11.5, fontWeight: 600,
                                display: "flex", alignItems: "center", gap: 4,
                            }}>
                                <Search size={11} /> بحث
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Table — Clean minimal design ── */}
            <div style={card}>
                {logs.length === 0 ? (
                    <div style={{
                        padding: "48px 24px", textAlign: "center",
                        color: "var(--t-text-faint)",
                    }}>
                        <Activity size={32} strokeWidth={1.2} style={{ margin: "0 auto 10px", color: "var(--t-border-medium)" }} />
                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--t-text-secondary)", margin: "0 0 4px" }}>
                            لا توجد سجلات
                        </p>
                        <p style={{ fontSize: 12, margin: 0 }}>
                            {activeFilterCount > 0 ? "جرّب تعديل الفلاتر" : "لم يتم تسجيل أي عمليات بعد"}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* header row — 4 columns only */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(140px, 1.2fr) minmax(200px, 2fr) 90px minmax(100px, 140px)",
                            padding: "10px 20px",
                            background: "var(--t-surface, var(--t-page))",
                            borderBottom: "1px solid var(--t-border-light,#eaedf0)",
                            fontSize: 11, fontWeight: 600, color: "var(--t-text-faint)",
                        }}>
                            <span>المستخدم</span>
                            <span>العملية</span>
                            <span>الحالة</span>
                            <span>الوقت</span>
                        </div>

                        {/* data rows */}
                        {logs.map((log, idx) => {
                            const [method, ...pathParts] = (log.action || "").split(" ")
                            const path = pathParts.join(" ")
                            const userName = displayUser(log)
                            return (
                                <div
                                    key={log.id || idx}
                                    onClick={() => setSelectedLog(log)}
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "minmax(140px, 1.2fr) minmax(200px, 2fr) 90px minmax(100px, 140px)",
                                        padding: "11px 20px",
                                        borderBottom: "1px solid var(--t-border-light,#f5f5f5)",
                                        cursor: "pointer",
                                        transition: "background .1s",
                                        alignItems: "center",
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "var(--t-card-hover, var(--t-page))" }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                                >
                                    {/* user — compact */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                                        <div style={{
                                            width: 28, height: 28, borderRadius: 7,
                                            background: "rgba(27,80,145,.06)",
                                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                        }}>
                                            <User size={12} style={{ color: "var(--t-accent)" }} />
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{
                                                fontSize: 12, fontWeight: 600, color: "var(--t-text)",
                                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                            }}>
                                                {userName}
                                            </div>
                                            {log.role && (
                                                <div style={{ fontSize: 10, color: "var(--t-text-faint)" }}>
                                                    {log.role}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* action — compact */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                                        <MethodBadge method={method} />
                                        <span style={{
                                            fontSize: 12, color: "var(--t-text-secondary)",
                                            fontFamily: "monospace", overflow: "hidden",
                                            textOverflow: "ellipsis", whiteSpace: "nowrap",
                                        }} dir="ltr">
                                            {shortPath(path || log.endpoint)}
                                        </span>
                                    </div>

                                    {/* status */}
                                    <StatusBadge status={log.status} />

                                    {/* time — relative + absolute */}
                                    <div>
                                        <div style={{ fontSize: 11.5, color: "var(--t-text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
                                            <Clock size={10} style={{ color: "var(--t-text-faint)" }} />
                                            {timeAgo(log.timestamp)}
                                        </div>
                                        <div style={{ fontSize: 10, color: "var(--t-text-faint)", fontFamily: "monospace" }} dir="ltr">
                                            {fmtTime(log.timestamp)}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </>
                )}

                {/* ── Pagination ── */}
                {pagination && pagination.totalPages > 1 && (
                    <div style={{
                        padding: "12px 20px",
                        borderTop: "1px solid var(--t-border-light,#eaedf0)",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                        <span style={{ fontSize: 12, color: "var(--t-text-faint)" }}>
                            صفحة {pagination.currentPage} من {pagination.totalPages}
                        </span>
                        <div style={{ display: "flex", gap: 6 }}>
                            <button
                                onClick={() => goPage(pagination.currentPage - 1)}
                                disabled={!pagination.hasPrevious}
                                style={{
                                    padding: "6px 12px", borderRadius: 7, cursor: pagination.hasPrevious ? "pointer" : "default",
                                    border: "1px solid var(--t-border-light, var(--t-border))",
                                    background: "var(--t-card, #fff)", color: "var(--t-text-secondary)",
                                    fontSize: 12, display: "flex", alignItems: "center", gap: 4,
                                    opacity: pagination.hasPrevious ? 1 : 0.4,
                                }}
                            >
                                <ChevronRight size={12} /> السابق
                            </button>
                            <button
                                onClick={() => goPage(pagination.currentPage + 1)}
                                disabled={!pagination.hasNext}
                                style={{
                                    padding: "6px 12px", borderRadius: 7, cursor: pagination.hasNext ? "pointer" : "default",
                                    border: "1px solid var(--t-border-light, var(--t-border))",
                                    background: "var(--t-card, #fff)", color: "var(--t-text-secondary)",
                                    fontSize: 12, display: "flex", alignItems: "center", gap: 4,
                                    opacity: pagination.hasNext ? 1 : 0.4,
                                }}
                            >
                                التالي <ChevronLeft size={12} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Detail drawer ── */}
            {selectedLog && <DetailDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />}
        </div>
    )
}
