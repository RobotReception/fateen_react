import { useAnalytics } from "../hooks/useAnalytics"
import { HeroCards } from "../components/HeroCards"
import { SessionsChart } from "../components/SessionsChart"
import { CustomerBreakdown } from "../components/CustomerBreakdown"
import { PlatformChart } from "../components/PlatformChart"
import { SecondaryStats } from "../components/SecondaryStats"
import { BarChart3, RefreshCw, AlertTriangle, ShieldX } from "lucide-react"

/* ── Skeleton Loader ── */
function SkeletonPulse({ width = "100%", height = 20, radius = 8 }: { width?: string | number; height?: number; radius?: number }) {
    return (
        <div style={{
            width, height, borderRadius: radius,
            background: "linear-gradient(90deg, var(--t-surface) 25%, var(--t-surface-deep) 50%, var(--t-surface) 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite",
        }} />
    )
}

function DashboardSkeleton() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Hero skeleton */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 }}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{
                        borderRadius: 16, padding: 24,
                        background: "var(--t-card)", border: "1px solid var(--t-border)",
                        height: 130,
                    }}>
                        <SkeletonPulse width={100} height={14} />
                        <div style={{ marginTop: 16 }}>
                            <SkeletonPulse width={80} height={28} />
                        </div>
                    </div>
                ))}
            </div>
            {/* Charts skeleton */}
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
                {[1, 2].map(i => (
                    <div key={i} style={{
                        flex: 1, minWidth: 280, borderRadius: 16, padding: 24,
                        background: "var(--t-card)", border: "1px solid var(--t-border)",
                        height: 300,
                    }}>
                        <SkeletonPulse width={120} height={16} />
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 220 }}>
                            <SkeletonPulse width={160} height={160} radius={80} />
                        </div>
                    </div>
                ))}
            </div>
            {/* Platform skeleton */}
            <div style={{
                borderRadius: 16, padding: 24,
                background: "var(--t-card)", border: "1px solid var(--t-border)",
                height: 200,
            }}>
                <SkeletonPulse width={120} height={16} />
                {[1, 2, 3].map(i => (
                    <div key={i} style={{ marginTop: 16 }}>
                        <SkeletonPulse width={`${80 - i * 15}%`} height={24} radius={4} />
                    </div>
                ))}
            </div>
        </div>
    )
}

/* ── Error State ── */
function ErrorState({ message, status, onRetry }: { message: string; status?: number; onRetry: () => void }) {
    const is403 = status === 403
    const Icon = is403 ? ShieldX : AlertTriangle
    const title = is403 ? "ليس لديك صلاحية لعرض التحليلات" : "حدث خطأ أثناء تحميل البيانات"

    return (
        <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "80px 20px", textAlign: "center",
        }}>
            <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: is403 ? "var(--t-warning-soft)" : "var(--t-danger-soft)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 16,
            }}>
                <Icon size={28} color={is403 ? "var(--t-warning)" : "var(--t-danger)"} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--t-text)", marginBottom: 6 }}>{title}</h3>
            <p style={{ fontSize: 13, color: "var(--t-text-faint)", marginBottom: 20, maxWidth: 360 }}>{message}</p>
            <button
                onClick={onRetry}
                style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 22px", borderRadius: 10,
                    border: "1px solid var(--t-border)",
                    background: "var(--t-card)", color: "var(--t-text)",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                    transition: "background 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--t-card-hover)" }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--t-card)" }}
            >
                <RefreshCw size={15} />
                إعادة المحاولة
            </button>
        </div>
    )
}

/* ── Dashboard Page ── */
export function DashboardPage() {
    const { data: analytics, isLoading, isError, error, refetch } = useAnalytics()

    const errStatus = (error as any)?.response?.status as number | undefined

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
                            التحليلات العامة
                        </h1>
                        <p style={{ fontSize: 13, color: "var(--t-text-faint)", marginTop: 2 }}>
                            نظرة شاملة على إحصائيات النظام والمنصات
                        </p>
                    </div>
                </div>
            </div>

            {/* Body */}
            {isLoading ? (
                <DashboardSkeleton />
            ) : isError ? (
                <ErrorState
                    message={(error as any)?.message || "تعذّر الاتصال بالخادم"}
                    status={errStatus}
                    onRetry={() => refetch()}
                />
            ) : analytics ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {/* 1 — Hero Cards */}
                    <HeroCards
                        totalCustomers={analytics.total_customers}
                        totalMessages={analytics.total_messages}
                        totalUsers={analytics.total_users}
                        totalChannels={analytics.total_channels}
                    />

                    {/* 2 — Charts Row */}
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

                    {/* 3 — Platform Distribution */}
                    <PlatformChart platforms={analytics.platforms} />

                    {/* 4 — Secondary Stats */}
                    <div style={{ marginTop: 4 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--t-text)", marginBottom: 14 }}>
                            إحصائيات إضافية
                        </h3>
                        <SecondaryStats data={analytics} />
                    </div>
                </div>
            ) : null}
        </div>
    )
}
