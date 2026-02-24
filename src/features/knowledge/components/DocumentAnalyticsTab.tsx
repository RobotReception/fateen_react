import { useState, useMemo } from "react"
import {
    FileText, Database, Users, Building2, FolderTree,
    Loader2, Filter, X, BarChart3, RefreshCw,
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

/* ══════════ COLORS ══════════ */
const CHART_COLORS = [
    "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444",
    "#ec4899", "#06b6d4", "#6366f1", "#14b8a6", "#f97316",
]

/* ══════════ CUSTOM TOOLTIP ══════════ */
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
    if (!active || !payload?.length) return null
    return (
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-xl" dir="rtl">
            {label && <p className="mb-1.5 text-xs font-bold text-gray-700">{label}</p>}
            {payload.map((entry, i) => (
                <p key={i} className="text-xs text-gray-500">
                    <span className="font-semibold text-gray-700">{entry.value.toLocaleString()}</span> {entry.name}
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

/* ══════════ STAT CARD ══════════ */
function StatCard({ title, value, icon: Icon, gradient, loading }: {
    title: string; value: number | string; icon: React.ElementType; gradient: string; loading: boolean
}) {
    return (
        <div className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-gray-400">{title}</p>
                    <p className="mt-2 text-2xl font-bold text-gray-800">{loading ? "—" : value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white transition-transform group-hover:scale-110`}>
                    <Icon size={20} />
                </div>
            </div>
        </div>
    )
}

/* ══════════ CHART SECTION ══════════ */
function ChartSection({ title, subtitle, children }: {
    title: string; subtitle: string; children: React.ReactNode
}) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-700">{title}</h3>
                <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">تحليلات المستندات</h2>
                    <p className="mt-1 text-sm text-gray-400">إحصائيات شاملة عن المستندات والملفات في قاعدة المعرفة</p>
                </div>
                <ActionGuard pageBit={PAGE_BITS.DOCUMENTS} actionBit={ACTION_BITS.GET_ALL_ANALYTICS_NEW}>
                    <button
                        onClick={handleRefresh}
                        disabled={isFetching}
                        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md disabled:opacity-50"
                    >
                        <RefreshCw size={15} className={isFetching ? "animate-spin" : ""} />
                        تحديث
                    </button>
                </ActionGuard>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Department filter */}
                <div className="relative shrink-0">
                    <Building2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <select
                        value={selectedDept}
                        onChange={(e) => { setSelectedDept(e.target.value); }}
                        className={`appearance-none rounded-xl border bg-white py-2.5 pr-9 pl-4 text-sm font-medium outline-none cursor-pointer transition-colors focus:ring-2 focus:ring-blue-100 min-w-[150px] ${selectedDept ? "border-amber-300 text-amber-600 bg-amber-50" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
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
                    <FolderTree size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <select
                        value={selectedCat}
                        onChange={(e) => setSelectedCat(e.target.value)}
                        className={`appearance-none rounded-xl border bg-white py-2.5 pr-9 pl-4 text-sm font-medium outline-none cursor-pointer transition-colors focus:ring-2 focus:ring-blue-100 min-w-[150px] ${selectedCat ? "border-purple-300 text-purple-600 bg-purple-50" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
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
                    <Users size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className={`appearance-none rounded-xl border bg-white py-2.5 pr-9 pl-4 text-sm font-medium outline-none cursor-pointer transition-colors focus:ring-2 focus:ring-blue-100 min-w-[180px] ${selectedUser ? "border-cyan-300 text-cyan-600 bg-cyan-50" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
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
                        className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-100"
                    >
                        <X size={13} />
                        مسح الفلاتر
                    </button>
                )}

                {loading && <Loader2 size={18} className="animate-spin text-gray-400" />}
            </div>

            {/* Active filters info */}
            {hasFilters && !loading && (
                <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5">
                    <Filter size={14} className="text-blue-500" />
                    <p className="text-xs text-blue-600">
                        يتم عرض النتائج المفلترة
                        {selectedDept && <span className="mx-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-700 font-medium">{selectedDept}</span>}
                        {selectedCat && <span className="mx-1 rounded-full bg-purple-100 px-2 py-0.5 text-purple-700 font-medium">{selectedCat}</span>}
                        {selectedUser && <span className="mx-1 rounded-full bg-cyan-100 px-2 py-0.5 text-cyan-700 font-medium">{selectedUser}</span>}
                    </p>
                </div>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="إجمالي الملفات" value={data?.total_files ?? 0} icon={FileText} gradient="from-blue-500 to-indigo-600" loading={loading} />
                <StatCard title="إجمالي المستندات" value={(data?.total_documents ?? 0).toLocaleString()} icon={Database} gradient="from-purple-500 to-violet-600" loading={loading} />
                <StatCard title="المستخدمين" value={data?.docs_per_user?.length ?? 0} icon={Users} gradient="from-emerald-500 to-teal-600" loading={loading} />
                <StatCard title="الأقسام" value={data?.docs_per_department?.length ?? 0} icon={Building2} gradient="from-amber-500 to-orange-600" loading={loading} />
            </div>

            {/* Loading state */}
            {loading && !data && (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="h-10 w-10 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                    <p className="mt-4 text-sm text-gray-400 animate-pulse">جاري تحميل التحليلات...</p>
                </div>
            )}

            {/* Charts */}
            {data && (
                <>
                    {/* Bar Chart — Docs per File */}
                    {barChartData.length > 0 && (
                        <ChartSection title="المستندات حسب الملف" subtitle={`${barChartData.length} ملف`}>
                            <div style={{ width: "100%", height: 350 }}>
                                <ResponsiveContainer>
                                    <BarChart data={barChartData} margin={{ top: 5, right: 5, left: 5, bottom: 60 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: 11, fill: "#6b7280" }}
                                            angle={-35}
                                            textAnchor="end"
                                            interval={0}
                                            height={80}
                                        />
                                        <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                                        <Tooltip content={<ChartTooltip />} />
                                        <Bar dataKey="المستندات" radius={[6, 6, 0, 0]} maxBarSize={48}>
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
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                                                contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
                                            />
                                            <Legend wrapperStyle={{ fontSize: 12 }} />
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
                                                contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
                                            />
                                            <Legend wrapperStyle={{ fontSize: 12 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartSection>
                        )}
                    </div>

                    {/* Users Table */}
                    {data.docs_per_user && data.docs_per_user.length > 0 && (
                        <ChartSection title="إحصائيات المستخدمين" subtitle={`${data.docs_per_user.length} مستخدم`}>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-100 text-right">
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">المستخدم</th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">عدد الملفات</th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">إجمالي المستندات</th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">النسبة</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {data.docs_per_user.map((u, idx) => {
                                            const percentage = data.total_documents > 0
                                                ? ((u.total_ids / data.total_documents) * 100).toFixed(1)
                                                : "0"
                                            const hash = u.username.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
                                            const avatarColor = CHART_COLORS[hash % CHART_COLORS.length]
                                            return (
                                                <tr key={u.username} className="group transition-colors hover:bg-gray-50/80" style={{ animation: `daRowFade 0.3s ease-out ${idx * 0.04}s both` }}>
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold shrink-0" style={{ backgroundColor: avatarColor }}>
                                                                {u.username.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="text-sm font-medium text-gray-700 truncate" dir="ltr">{u.username}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
                                                            <FileText size={11} />{u.file_count}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">
                                                            <Database size={11} />{u.total_ids.toLocaleString()}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-100">
                                                                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all" style={{ width: `${Math.min(Number(percentage), 100)}%` }} />
                                                            </div>
                                                            <span className="text-xs font-medium text-gray-500">{percentage}%</span>
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

                    {/* Files Detail Table */}
                    {data.docs_per_file && data.docs_per_file.length > 0 && (
                        <ChartSection title="تفاصيل الملفات" subtitle={`${data.docs_per_file.length} ملف`}>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-100 text-right">
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">اسم الملف</th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">المستخدم</th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">القسم</th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">الفئة</th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">المستندات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {data.docs_per_file.map((f, idx) => (
                                            <tr key={`${f.filename}-${idx}`} className="transition-colors hover:bg-gray-50/80" style={{ animation: `daRowFade 0.3s ease-out ${idx * 0.03}s both` }}>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <FileText size={14} className="text-blue-400 shrink-0" />
                                                        <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]" dir="ltr">{f.filename}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs text-gray-500 truncate max-w-[180px] block" dir="ltr">{f.username}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {f.department_id ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                                                            <Building2 size={9} />{f.department_id}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-300">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {f.category_id ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-600">
                                                            <FolderTree size={9} />{f.category_id}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-300">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">
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
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                                <BarChart3 size={28} className="text-gray-300" />
                            </div>
                            <p className="mt-4 text-sm font-medium text-gray-500">لا توجد بيانات</p>
                            <p className="mt-1 text-xs text-gray-400">جرب تغيير الفلاتر أو ارفع ملفات للبدء</p>
                        </div>
                    )}
                </>
            )}

            <style>{`
                @keyframes daRowFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
            `}</style>
        </div>
    )
}
