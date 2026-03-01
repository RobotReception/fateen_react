import { useState, useMemo } from "react"
import {
    FileText, Database, Users, Building2, FolderTree,
    Loader2, Filter, X, BarChart3, RefreshCw,
    TrendingUp,
} from "lucide-react"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    PieChart, Pie, Cell, ResponsiveContainer, Legend,
} from "recharts"
import { useAuthStore } from "@/stores/auth-store"
import { useDepartmentsLookup } from "../hooks/use-departments"
import { useCategoriesLookup } from "../hooks/use-categories"
import { useTenantAnalytics, useInvalidateAnalytics } from "../hooks/use-analytics"
import type { TenantAnalyticsParams } from "../types"
import { ActionGuard } from "@/components/guards/ActionGuard"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"

/* ══════════ COLORS — Fateen palette ══════════ */
const CHART_COLORS = [
    "#004786", "#0072b5", "#0098d6", "#2ab5e8",
    "#005a9e", "#003b6f", "#00acc1", "#4fc3f7",
    "#1565c0", "#0288d1",
]

/* ══════════ CUSTOM TOOLTIP ══════════ */
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
    if (!active || !payload?.length) return null
    return (
        <div dir="rtl" style={{
            background: "#fff",
            border: "1px solid var(--t-border-light, #e5e7eb)",
            borderRadius: 10,
            padding: "10px 14px",
            boxShadow: "0 8px 24px -6px rgba(0,0,0,0.1)",
        }}>
            {label && <p style={{ fontSize: 12, fontWeight: 600, color: "var(--t-text, #374151)", marginBottom: 4 }}>{label}</p>}
            {payload.map((entry, i) => (
                <p key={i} style={{ fontSize: 11, color: "var(--t-text-secondary, #6b7280)" }}>
                    <span style={{ fontWeight: 700, color: "#004786" }}>{entry.value.toLocaleString()}</span> {entry.name}
                </p>
            ))}
        </div>
    )
}

/* ══════════ PIE LABEL ══════════ */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderPieLabel(props: any) {
    const { name, percent } = props as { name?: string; percent?: number }
    if (!percent || percent < 0.05) return null
    return `${name || ""} (${(percent * 100).toFixed(0)}%)`
}

/* ══════════ STAT CARD — Formal ══════════ */
function StatCard({ title, value, icon: Icon, loading }: {
    title: string; value: number | string; icon: React.ElementType; loading: boolean
}) {
    return (
        <div style={{
            background: "var(--t-card, #fff)",
            border: "1px solid var(--t-border-light, #e5e7eb)",
            borderRadius: 12,
            padding: "18px 20px",
            transition: "box-shadow 0.2s, border-color 0.2s",
        }}
            onMouseEnter={e => {
                e.currentTarget.style.boxShadow = "0 4px 16px -4px rgba(0,71,134,0.08)"
                e.currentTarget.style.borderColor = "rgba(0,71,134,0.15)"
            }}
            onMouseLeave={e => {
                e.currentTarget.style.boxShadow = "none"
                e.currentTarget.style.borderColor = "var(--t-border-light, #e5e7eb)"
            }}
        >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                    <p style={{ fontSize: 11, fontWeight: 500, color: "var(--t-text-faint, #9ca3af)", letterSpacing: "0.3px" }}>{title}</p>
                    <p style={{ fontSize: 24, fontWeight: 700, color: "var(--t-text, #1f2937)", marginTop: 6 }}>
                        {loading ? "—" : value}
                    </p>
                </div>
                <div style={{
                    width: 42, height: 42, borderRadius: 10,
                    background: "rgba(0,71,134,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <Icon size={20} strokeWidth={1.6} style={{ color: "#004786" }} />
                </div>
            </div>
        </div>
    )
}

/* ══════════ CHART SECTION — Formal ══════════ */
function ChartSection({ title, subtitle, children }: {
    title: string; subtitle: string; children: React.ReactNode
}) {
    return (
        <div style={{
            background: "var(--t-card, #fff)",
            border: "1px solid var(--t-border-light, #e5e7eb)",
            borderRadius: 12,
            padding: "20px 24px",
        }}>
            <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--t-text, #1f2937)" }}>{title}</h3>
                <p style={{ fontSize: 11, color: "var(--t-text-faint, #9ca3af)", marginTop: 2 }}>{subtitle}</p>
            </div>
            {children}
        </div>
    )
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */

export function DocumentAnalyticsTab() {
    const { user } = useAuthStore()
    const tenantId = user?.tenant_id || ""

    // Filters
    const [selectedDept, setSelectedDept] = useState("")
    const [selectedCat, setSelectedCat] = useState("")
    const [selectedUser, setSelectedUser] = useState("")

    /* ─── Query: departments ─── */
    const { data: deptRes } = useDepartmentsLookup(tenantId)
    const departments = deptRes?.success ? deptRes.data ?? [] : []

    /* ─── Query: categories ─── */
    const { data: catRes } = useCategoriesLookup(tenantId)
    const categories = catRes?.success ? catRes.data?.categories ?? [] : []

    /* ─── Query: analytics ─── */
    const analyticsParams: TenantAnalyticsParams = useMemo(() => {
        const p: TenantAnalyticsParams = {}
        if (selectedDept) p.department_id = selectedDept
        if (selectedCat) p.category_id = selectedCat
        if (selectedUser) p.username = selectedUser
        return p
    }, [selectedDept, selectedCat, selectedUser])

    const { data: analyticsRes, isLoading: loading, isFetching } = useTenantAnalytics(tenantId, analyticsParams)
    const data = analyticsRes?.success ? analyticsRes.data ?? null : null

    const handleRefresh = useInvalidateAnalytics(tenantId)


    /* ─── Unique users from docs_per_user ─── */
    const uniqueUsers = useMemo(() => {
        if (!data?.docs_per_user) return []
        return data.docs_per_user.map((u) => u.username)
    }, [data])

    /* ─── Chart data ─── */
    const barChartData = useMemo(() => {
        if (!data?.docs_per_file) return []
        return data.docs_per_file.map((f) => ({
            name: f.filename.length > 18 ? f.filename.slice(0, 18) + "…" : f.filename,
            fullName: f.filename,
            المستندات: f.id_count,
            username: f.username,
            department: f.department_id || "—",
            category: f.category_id || "—",
        }))
    }, [data])

    const deptPieData = useMemo(() => {
        if (!data?.docs_per_department) return []
        return data.docs_per_department.map((d) => ({
            name: d.department_id,
            value: d.total_ids,
            files: d.file_count,
        }))
    }, [data])

    const catPieData = useMemo(() => {
        if (!data?.docs_per_category) return []
        return data.docs_per_category.map((c) => ({
            name: c.category_id,
            value: c.total_ids,
            files: c.file_count,
        }))
    }, [data])

    const hasFilters = selectedDept || selectedCat || selectedUser

    const clearFilters = () => {
        setSelectedDept("")
        setSelectedCat("")
        setSelectedUser("")
    }

    /* ═══════════════ RENDER ═══════════════ */
    return (
        <div className="space-y-5">
            {/* ── Header ── */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                flexWrap: "wrap", gap: 12,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: "linear-gradient(135deg, #004786, #0098d6)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <TrendingUp size={20} style={{ color: "#fff" }} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--t-text, #1f2937)", margin: 0 }}>تحليلات المستندات</h2>
                        <p style={{ fontSize: 12, color: "var(--t-text-faint, #9ca3af)", marginTop: 2 }}>
                            إحصائيات شاملة عن المستندات والملفات
                        </p>
                    </div>
                </div>
                <ActionGuard pageBit={PAGE_BITS.DOCUMENTS} actionBit={ACTION_BITS.GET_ALL_ANALYTICS_NEW}>
                    <button
                        onClick={handleRefresh}
                        disabled={isFetching}
                        style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "8px 16px", borderRadius: 8,
                            border: "1px solid var(--t-border-light, #e5e7eb)",
                            background: "var(--t-card, #fff)",
                            fontSize: 13, fontWeight: 500, color: "var(--t-text-secondary, #6b7280)",
                            cursor: "pointer",
                            transition: "all 0.15s",
                            opacity: isFetching ? 0.5 : 1,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#004786"; e.currentTarget.style.color = "#004786" }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--t-border-light, #e5e7eb)"; e.currentTarget.style.color = "var(--t-text-secondary, #6b7280)" }}
                    >
                        <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
                        تحديث
                    </button>
                </ActionGuard>
            </div>

            {/* ── Filters ── */}
            <div style={{
                display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10,
                padding: "12px 16px",
                background: "var(--t-card, #fff)",
                border: "1px solid var(--t-border-light, #e5e7eb)",
                borderRadius: 10,
            }}>
                <Filter size={14} style={{ color: "var(--t-text-faint, #9ca3af)" }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--t-text-faint, #9ca3af)", marginLeft: 4 }}>فلترة:</span>

                {/* Department filter */}
                <div className="relative shrink-0">
                    <Building2 size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--t-text-faint, #9ca3af)" }} />
                    <select
                        value={selectedDept}
                        onChange={(e) => { setSelectedDept(e.target.value); }}
                        style={{
                            appearance: "none", borderRadius: 7,
                            border: selectedDept ? "1px solid #004786" : "1px solid var(--t-border-light, #e5e7eb)",
                            background: selectedDept ? "rgba(0,71,134,0.04)" : "var(--t-card, #fff)",
                            padding: "6px 30px 6px 12px",
                            fontSize: 12, fontWeight: 500,
                            color: selectedDept ? "#004786" : "var(--t-text-secondary, #6b7280)",
                            cursor: "pointer", outline: "none",
                            minWidth: 130,
                        }}
                    >
                        <option value="">كل الأقسام</option>
                        {departments.map((d) => (
                            <option key={d.department_id} value={d.department_id}>
                                {d.icon ? `${d.icon} ` : ""}{d.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Category filter */}
                <div className="relative shrink-0">
                    <FolderTree size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--t-text-faint, #9ca3af)" }} />
                    <select
                        value={selectedCat}
                        onChange={(e) => setSelectedCat(e.target.value)}
                        style={{
                            appearance: "none", borderRadius: 7,
                            border: selectedCat ? "1px solid #004786" : "1px solid var(--t-border-light, #e5e7eb)",
                            background: selectedCat ? "rgba(0,71,134,0.04)" : "var(--t-card, #fff)",
                            padding: "6px 30px 6px 12px",
                            fontSize: 12, fontWeight: 500,
                            color: selectedCat ? "#004786" : "var(--t-text-secondary, #6b7280)",
                            cursor: "pointer", outline: "none",
                            minWidth: 130,
                        }}
                    >
                        <option value="">كل الفئات</option>
                        {categories.map((c) => (
                            <option key={c.category_id} value={c.category_id}>
                                {c.icon ? `${c.icon} ` : ""}{c.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* User filter */}
                <div className="relative shrink-0">
                    <Users size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--t-text-faint, #9ca3af)" }} />
                    <select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        style={{
                            appearance: "none", borderRadius: 7,
                            border: selectedUser ? "1px solid #004786" : "1px solid var(--t-border-light, #e5e7eb)",
                            background: selectedUser ? "rgba(0,71,134,0.04)" : "var(--t-card, #fff)",
                            padding: "6px 30px 6px 12px",
                            fontSize: 12, fontWeight: 500,
                            color: selectedUser ? "#004786" : "var(--t-text-secondary, #6b7280)",
                            cursor: "pointer", outline: "none",
                            minWidth: 150,
                        }}
                    >
                        <option value="">كل المستخدمين</option>
                        {uniqueUsers.map((u) => (
                            <option key={u} value={u}>{u}</option>
                        ))}
                    </select>
                </div>

                {hasFilters && (
                    <button
                        onClick={clearFilters}
                        style={{
                            display: "flex", alignItems: "center", gap: 4,
                            padding: "5px 10px", borderRadius: 6,
                            border: "1px solid rgba(220,38,38,0.2)",
                            background: "rgba(220,38,38,0.04)",
                            fontSize: 11, fontWeight: 500, color: "#dc2626",
                            cursor: "pointer", transition: "all 0.12s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(220,38,38,0.08)" }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(220,38,38,0.04)" }}
                    >
                        <X size={12} />
                        مسح
                    </button>
                )}

                {loading && <Loader2 size={16} className="animate-spin" style={{ color: "#004786" }} />}
            </div>

            {/* Active filters info */}
            {hasFilters && !loading && (
                <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 14px", borderRadius: 8,
                    background: "rgba(0,71,134,0.03)",
                    border: "1px solid rgba(0,71,134,0.08)",
                }}>
                    <Filter size={13} style={{ color: "#004786", flexShrink: 0 }} />
                    <p style={{ fontSize: 12, color: "#004786" }}>
                        يتم عرض النتائج المفلترة
                        {selectedDept && <span style={{ margin: "0 4px", background: "rgba(0,71,134,0.08)", padding: "2px 8px", borderRadius: 12, fontWeight: 600, fontSize: 11 }}>{selectedDept}</span>}
                        {selectedCat && <span style={{ margin: "0 4px", background: "rgba(0,71,134,0.08)", padding: "2px 8px", borderRadius: 12, fontWeight: 600, fontSize: 11 }}>{selectedCat}</span>}
                        {selectedUser && <span style={{ margin: "0 4px", background: "rgba(0,71,134,0.08)", padding: "2px 8px", borderRadius: 12, fontWeight: 600, fontSize: 11 }}>{selectedUser}</span>}
                    </p>
                </div>
            )}

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="إجمالي الملفات" value={data?.total_files ?? 0} icon={FileText} loading={loading} />
                <StatCard title="إجمالي المستندات" value={(data?.total_documents ?? 0).toLocaleString()} icon={Database} loading={loading} />
                <StatCard title="المستخدمين" value={data?.docs_per_user?.length ?? 0} icon={Users} loading={loading} />
                <StatCard title="الأقسام" value={data?.docs_per_department?.length ?? 0} icon={Building2} loading={loading} />
            </div>

            {/* Loading state */}
            {loading && !data && (
                <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "center", padding: "60px 0",
                }}>
                    <div style={{
                        width: 40, height: 40,
                        border: "3px solid var(--t-border-light, #e5e7eb)",
                        borderTop: "3px solid #004786",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                    }} />
                    <p style={{ fontSize: 13, color: "var(--t-text-faint, #9ca3af)", marginTop: 16 }}>جاري تحميل التحليلات...</p>
                </div>
            )}

            {/* ── Charts ── */}
            {data && (
                <>
                    {/* Bar Chart — Docs per File */}
                    {barChartData.length > 0 && (
                        <ChartSection title="المستندات حسب الملف" subtitle={`${barChartData.length} ملف`}>
                            <div style={{ width: "100%", height: 350 }}>
                                <ResponsiveContainer>
                                    <BarChart data={barChartData} margin={{ top: 5, right: 5, left: 5, bottom: 60 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--t-border-light, #f0f0f0)" />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: 11, fill: "var(--t-text-faint, #9ca3af)" }}
                                            angle={-35}
                                            textAnchor="end"
                                            interval={0}
                                            height={80}
                                        />
                                        <YAxis tick={{ fontSize: 11, fill: "var(--t-text-faint, #9ca3af)" }} />
                                        <Tooltip content={<ChartTooltip />} />
                                        <Bar dataKey="المستندات" radius={[5, 5, 0, 0]} maxBarSize={44}>
                                            {barChartData.map((_, idx) => (
                                                <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </ChartSection>
                    )}

                    {/* Pie Charts — Side by Side */}
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                        {/* Docs per Department */}
                        {deptPieData.length > 0 && (
                            <ChartSection title="المستندات حسب القسم" subtitle={`${deptPieData.length} قسم`}>
                                <div style={{ width: "100%", height: 300 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={deptPieData}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={100}
                                                innerRadius={50}
                                                dataKey="value"
                                                nameKey="name"
                                                label={renderPieLabel}
                                                labelLine={true}
                                                strokeWidth={2}
                                                stroke="#fff"
                                            >
                                                {deptPieData.map((_, idx) => (
                                                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: number | undefined) => [String(value ?? 0), "مستندات"]}
                                                contentStyle={{ borderRadius: 8, border: "1px solid var(--t-border-light, #e5e7eb)", fontSize: 12 }}
                                            />
                                            <Legend wrapperStyle={{ fontSize: 11 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartSection>
                        )}

                        {/* Docs per Category */}
                        {catPieData.length > 0 && (
                            <ChartSection title="المستندات حسب الفئة" subtitle={`${catPieData.length} فئة`}>
                                <div style={{ width: "100%", height: 300 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={catPieData}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={100}
                                                innerRadius={50}
                                                dataKey="value"
                                                nameKey="name"
                                                label={renderPieLabel}
                                                labelLine={true}
                                                strokeWidth={2}
                                                stroke="#fff"
                                            >
                                                {catPieData.map((_, idx) => (
                                                    <Cell key={idx} fill={CHART_COLORS[(idx + 3) % CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: number | undefined) => [String(value ?? 0), "مستندات"]}
                                                contentStyle={{ borderRadius: 8, border: "1px solid var(--t-border-light, #e5e7eb)", fontSize: 12 }}
                                            />
                                            <Legend wrapperStyle={{ fontSize: 11 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartSection>
                        )}
                    </div>

                    {/* ── Users Table ── */}
                    {data.docs_per_user && data.docs_per_user.length > 0 && (
                        <ChartSection title="إحصائيات المستخدمين" subtitle={`${data.docs_per_user.length} مستخدم`}>
                            <div className="overflow-x-auto">
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ borderBottom: "1px solid var(--t-border-light, #f0f0f0)" }}>
                                            <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "var(--t-text-faint, #9ca3af)", textAlign: "right", letterSpacing: "0.3px" }}>المستخدم</th>
                                            <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "var(--t-text-faint, #9ca3af)", textAlign: "right", letterSpacing: "0.3px" }}>الملفات</th>
                                            <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "var(--t-text-faint, #9ca3af)", textAlign: "right", letterSpacing: "0.3px" }}>المستندات</th>
                                            <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "var(--t-text-faint, #9ca3af)", textAlign: "right", letterSpacing: "0.3px" }}>النسبة</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.docs_per_user.map((u, idx) => {
                                            const percentage = data.total_documents > 0
                                                ? ((u.total_ids / data.total_documents) * 100).toFixed(1)
                                                : "0"
                                            const hash = u.username.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
                                            const avatarColor = CHART_COLORS[hash % CHART_COLORS.length]
                                            return (
                                                <tr
                                                    key={u.username}
                                                    style={{
                                                        borderBottom: "1px solid var(--t-border-light, #f7f7f7)",
                                                        transition: "background 0.12s",
                                                        animation: `daRowFade 0.3s ease-out ${idx * 0.04}s both`,
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = "var(--t-card-hover, #f9fafb)" }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                                                >
                                                    <td style={{ padding: "12px 14px" }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                            <div style={{
                                                                width: 30, height: 30, borderRadius: 8,
                                                                backgroundColor: avatarColor,
                                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                                color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0,
                                                            }}>
                                                                {u.username.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--t-text, #374151)" }} dir="ltr">{u.username}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "12px 14px" }}>
                                                        <span style={{
                                                            display: "inline-flex", alignItems: "center", gap: 4,
                                                            background: "rgba(0,71,134,0.05)", padding: "3px 10px", borderRadius: 6,
                                                            fontSize: 12, fontWeight: 600, color: "#004786",
                                                        }}>
                                                            <FileText size={11} />{u.file_count}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "12px 14px" }}>
                                                        <span style={{
                                                            display: "inline-flex", alignItems: "center", gap: 4,
                                                            background: "rgba(0,152,214,0.06)", padding: "3px 10px", borderRadius: 6,
                                                            fontSize: 12, fontWeight: 600, color: "#0072b5",
                                                        }}>
                                                            <Database size={11} />{u.total_ids.toLocaleString()}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "12px 14px" }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                            <div style={{ height: 6, width: 64, borderRadius: 3, background: "var(--t-border-light, #e5e7eb)", overflow: "hidden" }}>
                                                                <div style={{
                                                                    height: "100%", borderRadius: 3,
                                                                    background: "linear-gradient(90deg, #004786, #0098d6)",
                                                                    width: `${Math.min(Number(percentage), 100)}%`,
                                                                    transition: "width 0.6s ease-out",
                                                                }} />
                                                            </div>
                                                            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--t-text-secondary, #6b7280)" }}>{percentage}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </ChartSection>
                    )}

                    {/* ── Files Detail Table ── */}
                    {data.docs_per_file && data.docs_per_file.length > 0 && (
                        <ChartSection title="تفاصيل الملفات" subtitle={`${data.docs_per_file.length} ملف`}>
                            <div className="overflow-x-auto">
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ borderBottom: "1px solid var(--t-border-light, #f0f0f0)" }}>
                                            <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "var(--t-text-faint, #9ca3af)", textAlign: "right", letterSpacing: "0.3px" }}>اسم الملف</th>
                                            <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "var(--t-text-faint, #9ca3af)", textAlign: "right", letterSpacing: "0.3px" }}>المستخدم</th>
                                            <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "var(--t-text-faint, #9ca3af)", textAlign: "right", letterSpacing: "0.3px" }}>القسم</th>
                                            <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "var(--t-text-faint, #9ca3af)", textAlign: "right", letterSpacing: "0.3px" }}>الفئة</th>
                                            <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "var(--t-text-faint, #9ca3af)", textAlign: "right", letterSpacing: "0.3px" }}>المستندات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.docs_per_file.map((f, idx) => (
                                            <tr
                                                key={`${f.filename}-${idx}`}
                                                style={{
                                                    borderBottom: "1px solid var(--t-border-light, #f7f7f7)",
                                                    transition: "background 0.12s",
                                                    animation: `daRowFade 0.3s ease-out ${idx * 0.03}s both`,
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = "var(--t-card-hover, #f9fafb)" }}
                                                onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                                            >
                                                <td style={{ padding: "10px 14px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                        <FileText size={14} strokeWidth={1.5} style={{ color: "#004786", flexShrink: 0 }} />
                                                        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--t-text, #374151)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }} dir="ltr">{f.filename}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: "10px 14px" }}>
                                                    <span style={{ fontSize: 12, color: "var(--t-text-secondary, #6b7280)" }} dir="ltr">{f.username}</span>
                                                </td>
                                                <td style={{ padding: "10px 14px" }}>
                                                    {f.department_id ? (
                                                        <span style={{
                                                            display: "inline-flex", alignItems: "center", gap: 4,
                                                            background: "rgba(0,71,134,0.05)", padding: "2px 8px", borderRadius: 5,
                                                            fontSize: 11, fontWeight: 500, color: "#004786",
                                                        }}>
                                                            <Building2 size={10} />{f.department_id}
                                                        </span>
                                                    ) : (
                                                        <span style={{ fontSize: 12, color: "var(--t-text-faint, #d1d5db)" }}>—</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: "10px 14px" }}>
                                                    {f.category_id ? (
                                                        <span style={{
                                                            display: "inline-flex", alignItems: "center", gap: 4,
                                                            background: "rgba(0,152,214,0.06)", padding: "2px 8px", borderRadius: 5,
                                                            fontSize: 11, fontWeight: 500, color: "#0072b5",
                                                        }}>
                                                            <FolderTree size={10} />{f.category_id}
                                                        </span>
                                                    ) : (
                                                        <span style={{ fontSize: 12, color: "var(--t-text-faint, #d1d5db)" }}>—</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: "10px 14px" }}>
                                                    <span style={{
                                                        display: "inline-flex", alignItems: "center", gap: 4,
                                                        background: "rgba(0,71,134,0.06)", padding: "3px 10px", borderRadius: 6,
                                                        fontSize: 12, fontWeight: 600, color: "#004786",
                                                    }}>
                                                        <Database size={10} />{f.id_count.toLocaleString()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </ChartSection>
                    )}

                    {/* Empty state */}
                    {!data.docs_per_file?.length && !data.docs_per_user?.length && (
                        <div style={{
                            display: "flex", flexDirection: "column", alignItems: "center",
                            justifyContent: "center", padding: "48px 0", textAlign: "center",
                        }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: 14,
                                background: "rgba(0,71,134,0.05)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <BarChart3 size={24} strokeWidth={1.5} style={{ color: "var(--t-text-faint, #d1d5db)" }} />
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 500, color: "var(--t-text-secondary, #6b7280)", marginTop: 14 }}>لا توجد بيانات</p>
                            <p style={{ fontSize: 12, color: "var(--t-text-faint, #9ca3af)", marginTop: 4 }}>جرب تغيير الفلاتر أو ارفع ملفات للبدء</p>
                        </div>
                    )}
                </>
            )}

            <style>{`
                @keyframes daRowFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
                @keyframes spin{100%{transform:rotate(360deg)}}
            `}</style>
        </div>
    )
}
