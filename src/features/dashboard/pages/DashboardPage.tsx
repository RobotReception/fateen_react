import { useState } from "react"
import { LayoutDashboard, RefreshCw, AlertTriangle, Loader2, TrendingUp } from "lucide-react"
import { useAnalytics } from "../hooks/useAnalytics"
import { HeroCards } from "../components/HeroCards"
import { SessionsChart } from "../components/SessionsChart"
import { CustomerBreakdown } from "../components/CustomerBreakdown"
import { PlatformChart } from "../components/PlatformChart"
import { SecondaryStats } from "../components/SecondaryStats"

function SkeletonBox({ h, radius = 16 }: { h: number; radius?: number }) {
    return (
        <div style={{
            height: h, borderRadius: radius,
            background: "var(--t-surface, #f1f5f9)",
            animation: "dash-pulse 1.8s ease-in-out infinite",
        }} />
    )
}

function DashboardSkeleton() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
                {[1, 2, 3, 4].map(i => <SkeletonBox key={i} h={96} />)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <SkeletonBox h={200} />
                <SkeletonBox h={200} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <SkeletonBox h={220} />
                <SkeletonBox h={220} />
            </div>
        </div>
    )
}

function DashboardError({ onRetry }: { onRetry: () => void }) {
    const [loading, setLoading] = useState(false)
    const handleRetry = () => {
        setLoading(true)
        onRetry()
        setTimeout(() => setLoading(false), 2000)
    }
    return (
        <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "60px 20px", textAlign: "center",
            background: "var(--t-card)", borderRadius: 16,
            border: "1px solid var(--t-border)",
        }}>
            <div style={{
                width: 60, height: 60, borderRadius: 16,
                background: "rgba(245,158,11,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 14,
                border: "1px solid rgba(245,158,11,0.2)",
            }}>
                <AlertTriangle size={26} style={{ color: "var(--t-warning)" }} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--t-text)", marginBottom: 6 }}>
                تعذّر تحميل البيانات
            </h3>
            <p style={{ fontSize: 12, color: "var(--t-text-faint)", maxWidth: 320, marginBottom: 18, lineHeight: 1.6 }}>
                لم نتمكن من جلب بيانات التحليلات. يرجى المحاولة مجدداً.
            </p>
            <button
                onClick={handleRetry} disabled={loading}
                style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "9px 22px", borderRadius: 10,
                    border: "none", cursor: loading ? "default" : "pointer",
                    background: "linear-gradient(135deg, var(--t-info), #1D4ED8)",
                    color: "#fff", fontSize: 13, fontWeight: 600,
                    opacity: loading ? 0.7 : 1,
                    boxShadow: "0 4px 14px -4px rgba(59,130,246,0.5)",
                }}
            >
                {loading ? <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> : <RefreshCw size={14} />}
                {loading ? "جارٍ التحميل..." : "إعادة المحاولة"}
            </button>
        </div>
    )
}

export function DashboardPage() {
    const { data: analytics, isLoading, isError, refetch, dataUpdatedAt } = useAnalytics()

    const lastUpdated = dataUpdatedAt
        ? new Date(dataUpdatedAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })
        : null

    return (
        <div className="h-full overflow-y-auto" dir="rtl" style={{ padding: "16px 20px 24px" }}>

            {/* ── Header ── */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 16, flexWrap: "wrap", gap: 10,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 38, height: 38, borderRadius: 11,
                        background: "linear-gradient(135deg, var(--t-info), #6366F1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 6px 16px -4px rgba(59,130,246,0.45)",
                        flexShrink: 0,
                    }}>
                        <LayoutDashboard size={18} color="#fff" strokeWidth={1.8} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 18, fontWeight: 800, color: "var(--t-text)", lineHeight: 1.2 }}>
                            لوحة التحكم
                        </h1>
                        <p style={{ fontSize: 11, color: "var(--t-text-faint)", marginTop: 1 }}>
                            نظرة شاملة على إحصائيات المنصة
                        </p>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {lastUpdated && !isLoading && (
                        <div style={{
                            display: "flex", alignItems: "center", gap: 5,
                            padding: "5px 10px", borderRadius: 8,
                            background: "rgba(16,185,129,0.08)",
                            border: "1px solid rgba(16,185,129,0.2)",
                        }}>
                            <div style={{
                                width: 6, height: 6, borderRadius: "50%",
                                background: "var(--t-success)",
                                animation: "pulse-dot 2s ease-in-out infinite",
                            }} />
                            <TrendingUp size={11} color="var(--t-success)" strokeWidth={2.5} />
                            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--t-success)" }}>
                                آخر تحديث {lastUpdated}
                            </span>
                        </div>
                    )}
                    <button
                        onClick={() => refetch()} disabled={isLoading}
                        style={{
                            width: 32, height: 32, borderRadius: 9,
                            border: "1px solid var(--t-border)", background: "var(--t-card)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: isLoading ? "default" : "pointer",
                            color: "var(--t-text-faint)", transition: "all 0.2s ease",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--t-surface)"; e.currentTarget.style.color = "var(--t-text)" }}
                        onMouseLeave={e => { e.currentTarget.style.background = "var(--t-card)"; e.currentTarget.style.color = "var(--t-text-faint)" }}
                    >
                        <RefreshCw size={13} style={{ animation: isLoading ? "spin 0.8s linear infinite" : "none" }} />
                    </button>
                </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "var(--t-border)", marginBottom: 16, opacity: 0.5 }} />

            {isLoading && <DashboardSkeleton />}
            {isError && !isLoading && <DashboardError onRetry={() => refetch()} />}

            {analytics && !isError && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                    {/* Row 1 — Hero Cards */}
                    <HeroCards
                        totalCustomers={analytics.total_customers}
                        totalMessages={analytics.total_messages}
                        totalUsers={analytics.total_users}
                        totalChannels={analytics.total_channels}
                    />

                    {/* Row 2 — Sessions + Customer Breakdown (side by side) */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <SessionsChart
                            open={analytics.open_sessions}
                            closed={analytics.closed_sessions}
                        />
                        <CustomerBreakdown
                            assigned={analytics.assigned_customers}
                            unassigned={analytics.unassigned_customers}
                            aiEnabled={analytics.ai_enabled_customers}
                        />
                    </div>

                    {/* Row 3 — Platform Chart + Secondary Stats (side by side) */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <PlatformChart platforms={analytics.platforms} />
                        <SecondaryStats data={analytics} />
                    </div>

                </div>
            )}

            <style>{`
                @keyframes dash-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
                @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
                @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.3)} }
            `}</style>
        </div>
    )
}
