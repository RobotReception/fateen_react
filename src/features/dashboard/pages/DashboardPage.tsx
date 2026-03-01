import { BarChart3, RefreshCw, AlertTriangle, Loader2 } from "lucide-react"
import { useAnalytics } from "../hooks/useAnalytics"
import { HeroCards } from "../components/HeroCards"
import { SessionsChart } from "../components/SessionsChart"
import { CustomerBreakdown } from "../components/CustomerBreakdown"
import { PlatformChart } from "../components/PlatformChart"
import { SecondaryStats } from "../components/SecondaryStats"

/* ── Skeleton loading state ── */
function Skeleton({ width, height, radius = 16 }: { width?: string | number; height: number; radius?: number }) {
    return (
        <div
            style={{
                width: width ?? "100%",
                height,
                borderRadius: radius,
                background: "var(--t-surface, #f1f5f9)",
                animation: "pulse 1.8s ease-in-out infinite",
            }}
        />
    )
}

function DashboardSkeleton() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Hero cards skeleton */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 }}>
                {[1, 2, 3, 4].map(i => <Skeleton key={i} height={130} />)}
            </div>
            {/* Charts row skeleton */}
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 280 }}><Skeleton height={310} /></div>
                <div style={{ flex: 1, minWidth: 280 }}><Skeleton height={310} /></div>
            </div>
            {/* Platform chart skeleton */}
            <Skeleton height={220} />
            {/* Secondary stats skeleton */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 14 }}>
                {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} height={80} radius={14} />)}
            </div>
        </div>
    )
}

/* ── Error state ── */
function DashboardError({ onRetry }: { onRetry: () => void }) {
    return (
        <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "80px 20px", textAlign: "center",
            background: "var(--t-card)", borderRadius: 16,
            border: "1px solid var(--t-border)",
        }}>
            <AlertTriangle size={48} style={{ color: "#F59E0B", marginBottom: 16, opacity: 0.7 }} />
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--t-text)", marginBottom: 6 }}>
                حدث خطأ في تحميل البيانات
            </h3>
            <p style={{ fontSize: 13, color: "var(--t-text-faint)", maxWidth: 360, marginBottom: 20 }}>
                لم نتمكن من جلب بيانات التحليلات. يرجى المحاولة مرة أخرى.
            </p>
            <button
                onClick={onRetry}
                style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 24px", borderRadius: 10,
                    border: "none", cursor: "pointer",
                    background: "var(--t-accent, #3B82F6)", color: "#fff",
                    fontSize: 14, fontWeight: 600,
                    transition: "opacity 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "0.85" }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1" }}
            >
                <RefreshCw size={15} />
                إعادة المحاولة
            </button>
        </div>
    )
}

/* ── Main Dashboard Page ── */
export function DashboardPage() {
    const { data: analytics, isLoading, isError, refetch } = useAnalytics()

    return (
        <div className="h-full overflow-y-auto p-4 lg:p-6" dir="rtl">
            {/* Page Header */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <BarChart3 size={18} color="#fff" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--t-text)", lineHeight: 1.2 }}>
                            لوحة التحكم
                        </h1>
                        <p style={{ fontSize: 13, color: "var(--t-text-faint)", marginTop: 2 }}>
                            نظرة عامة على إحصائيات النظام
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Loading ── */}
            {isLoading && <DashboardSkeleton />}

            {/* ── Error ── */}
            {isError && <DashboardError onRetry={() => refetch()} />}

            {/* ── Data ── */}
            {analytics && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {/* Hero Cards */}
                    <HeroCards
                        totalCustomers={analytics.total_customers}
                        totalMessages={analytics.total_messages}
                        totalUsers={analytics.total_users}
                        totalChannels={analytics.total_channels}
                    />

                    {/* Charts Row */}
                    <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
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

                    {/* Platform Chart */}
                    <PlatformChart platforms={analytics.platforms} />

                    {/* Secondary Stats Grid */}
                    <SecondaryStats data={analytics} />
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
            `}</style>
        </div>
    )
}
