import { useState, lazy, Suspense, useCallback, useMemo, memo } from "react"
import { usePermissions } from "@/lib/usePermissions"
import { PAGE_BITS } from "@/lib/permissions"
import {
    Database,
    BarChart3,
    Building2,
    FolderTree,
    BookOpen,
    ChevronLeft,
    PieChart,
    ClipboardList,
    History,
} from "lucide-react"

/* ── Lazy-loaded tab components (code-split per tab) ── */
const DataManagementTab = lazy(() => import("../components/DataManagementTab").then(m => ({ default: m.DataManagementTab })))
const UserAnalyticsTab = lazy(() => import("../components/UserAnalyticsTab").then(m => ({ default: m.UserAnalyticsTab })))
const DepartmentsTab = lazy(() => import("../components/DepartmentsTab").then(m => ({ default: m.DepartmentsTab })))
const CategoriesTab = lazy(() => import("../components/CategoriesTab").then(m => ({ default: m.CategoriesTab })))
const DocumentAnalyticsTab = lazy(() => import("../components/DocumentAnalyticsTab").then(m => ({ default: m.DocumentAnalyticsTab })))
const PendingRequestsTab = lazy(() => import("../components/PendingRequestsTab").then(m => ({ default: m.PendingRequestsTab })))
const OperationHistoryTab = lazy(() => import("../components/OperationHistoryTab").then(m => ({ default: m.OperationHistoryTab })))

type TabKey = "data" | "analytics" | "departments" | "categories" | "doc-analytics" | "pending-requests" | "operation-history"

const TABS: { key: TabKey; title: string; icon: typeof Database; description: string; pageBit: number }[] = [
    { key: "doc-analytics", title: "تحليلات المستندات", icon: PieChart, description: "إحصائيات وتقارير", pageBit: PAGE_BITS.DOCUMENTS },
    { key: "data", title: "إدارة البيانات", icon: Database, description: "إدارة الملفات والمستندات", pageBit: PAGE_BITS.DOCUMENTS },
    { key: "analytics", title: "ملفات المستخدمين", icon: BarChart3, description: "عرض ملفات المستخدمين", pageBit: PAGE_BITS.DOCUMENTS },
    { key: "departments", title: "الأقسام", icon: Building2, description: "إدارة أقسام المؤسسة", pageBit: PAGE_BITS.DEPARTMENTS },
    { key: "categories", title: "الفئات", icon: FolderTree, description: "تصنيف المستندات", pageBit: PAGE_BITS.DEPARTMENTS },
    { key: "pending-requests", title: "الطلبات المعلقة", icon: ClipboardList, description: "مراجعة الطلبات والموافقة", pageBit: PAGE_BITS.PENDING_REQUESTS },
    { key: "operation-history", title: "سجل العمليات", icon: History, description: "تتبع العمليات المنفذة", pageBit: PAGE_BITS.OPERATION_HISTORY },
]

/* ── Lightweight loading fallback ── */
const TabSkeleton = memo(function TabSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="h-7 w-48 rounded-lg bg-gray-100" />
                <div className="h-9 w-32 rounded-lg bg-gray-100" />
            </div>
            <div className="grid grid-cols-3 gap-4">
                {[0, 1, 2].map(i => <div key={i} className="h-24 rounded-2xl bg-gray-50 border border-gray-100" />)}
            </div>
            <div className="h-64 rounded-2xl bg-gray-50 border border-gray-100" />
        </div>
    )
})

/* ── Tab content with hidden-mount pattern ── */
const TAB_COMPONENTS: { key: TabKey; Component: React.LazyExoticComponent<React.FC<{ onNavigateToTab?: (tab: string) => void }>> }[] = [
    { key: "doc-analytics", Component: DocumentAnalyticsTab },
    { key: "data", Component: DataManagementTab },
    { key: "analytics", Component: UserAnalyticsTab },
    { key: "departments", Component: DepartmentsTab },
    { key: "categories", Component: CategoriesTab },
    { key: "pending-requests", Component: PendingRequestsTab },
    { key: "operation-history", Component: OperationHistoryTab },
]

export function KnowledgeBasePage() {
    const { canAccessPage, hasPermissionData } = usePermissions()

    // ── Filter tabs by page-level permission ──
    const visibleTabs = useMemo(() => TABS.filter(tab => {
        if (!hasPermissionData) return true         // owner / no restrictions
        return canAccessPage(tab.pageBit)
    }), [canAccessPage, hasPermissionData])

    // ── Default to first accessible tab ──
    const defaultTab = visibleTabs.length > 0 ? visibleTabs[0].key : "doc-analytics"

    const [activeTab, setActiveTab] = useState<TabKey>(defaultTab)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [visitedTabs, setVisitedTabs] = useState<Set<TabKey>>(new Set([defaultTab]))

    const visibleTabKeys = useMemo(() => new Set(visibleTabs.map(t => t.key)), [visibleTabs])

    const visibleTabComponents = useMemo(() =>
        TAB_COMPONENTS.filter(tc => visibleTabKeys.has(tc.key)),
        [visibleTabKeys])

    const handleTabChange = useCallback((key: TabKey) => {
        setActiveTab(key)
        setVisitedTabs(prev => {
            if (prev.has(key)) return prev
            const next = new Set(prev)
            next.add(key)
            return next
        })
    }, [])

    return (
        <div className="flex h-full" dir="rtl">
            {/* ── Internal Sidebar ── */}
            <aside
                className={`shrink-0 bg-white transition-all duration-300 ${sidebarCollapsed ? "w-[60px]" : "w-52"
                    }`}
                style={{
                    borderLeft: "1px solid var(--t-border-light, #f0f0f0)",
                    borderRadius: "6px 6px 6px 6px",
                    margin: "8px 0 8px 0",
                    overflow: "hidden",
                }}
            >
                {/* ── Gradient Header ── */}
                <div
                    onClick={() => { if (sidebarCollapsed) setSidebarCollapsed(false) }}
                    style={{
                        background: "linear-gradient(135deg, #004786, #0072b5, #0098d6)",
                        padding: sidebarCollapsed ? "12px 0" : "12px 14px",
                        position: "relative",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: sidebarCollapsed ? "center" : "space-between",
                        cursor: sidebarCollapsed ? "pointer" : "default",
                    }}>
                    <div style={{
                        position: "absolute", top: -15, left: -15,
                        width: 60, height: 60, borderRadius: "50%",
                        background: "rgba(255,255,255,0.06)",
                    }} />
                    <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 7 }}>
                        <BookOpen size={sidebarCollapsed ? 18 : 14} style={{ color: "rgba(255,255,255,0.85)" }} />
                        {!sidebarCollapsed && (
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: "#fff" }}>قاعدة المعرفة</span>
                        )}
                    </div>
                    {!sidebarCollapsed && (
                        <button
                            onClick={() => setSidebarCollapsed(true)}
                            style={{
                                background: "rgba(255,255,255,0.12)",
                                border: "none",
                                borderRadius: 5,
                                padding: 3,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "background 0.15s",
                                position: "relative",
                                zIndex: 1,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.22)" }}
                            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)" }}
                        >
                            <ChevronLeft size={13} style={{ color: "rgba(255,255,255,0.8)" }} />
                        </button>
                    )}
                </div>

                {/* ── Sidebar Navigation ── */}
                <nav style={{ padding: "6px 6px" }}>
                    {visibleTabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.key
                        return (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                title={sidebarCollapsed ? tab.title : undefined}
                                style={{
                                    display: "flex",
                                    width: "100%",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: sidebarCollapsed ? "9px 0" : "7px 8px",
                                    marginBottom: 2,
                                    borderRadius: 8,
                                    border: "none",
                                    background: isActive ? "var(--t-card-hover, #f3f4f6)" : "transparent",
                                    cursor: "pointer",
                                    justifyContent: sidebarCollapsed ? "center" : "flex-start",
                                    position: "relative",
                                    textAlign: "right",
                                    transition: "background 0.12s",
                                    color: "inherit",
                                }}
                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--t-card-hover, #f9fafb)" }}
                                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? "var(--t-card-hover, #f3f4f6)" : "transparent" }}
                            >
                                {/* Active indicator bar */}
                                {isActive && !sidebarCollapsed && (
                                    <div style={{
                                        position: "absolute",
                                        right: 0,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        width: 3,
                                        height: 18,
                                        borderRadius: 3,
                                        background: "#004786",
                                    }} />
                                )}
                                <div style={{
                                    width: sidebarCollapsed ? 28 : 26,
                                    height: sidebarCollapsed ? 28 : 26,
                                    borderRadius: 7,
                                    background: isActive ? "rgba(0,71,134,0.1)" : "var(--t-surface, #f3f4f6)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    transition: "all 0.15s",
                                }}>
                                    <Icon
                                        size={sidebarCollapsed ? 15 : 13}
                                        strokeWidth={isActive ? 2.2 : 1.6}
                                        style={{
                                            color: isActive ? "#004786" : "var(--t-text-muted, #9ca3af)",
                                            transition: "color 0.15s",
                                        }}
                                    />
                                </div>
                                {!sidebarCollapsed && (
                                    <span style={{
                                        fontSize: 12.5,
                                        fontWeight: isActive ? 600 : 500,
                                        color: isActive ? "var(--t-text, #1f2937)" : "var(--t-text-secondary, #6b7280)",
                                        transition: "color 0.15s",
                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                    }}>{tab.title}</span>
                                )}
                            </button>
                        )
                    })}
                </nav>
            </aside>

            {/* ── Main Content — hidden-mount pattern: tabs stay mounted but hidden ── */}
            <div className="flex-1 overflow-y-auto">
                <Suspense fallback={<div className="p-6"><TabSkeleton /></div>}>
                    {visibleTabComponents.map(({ key, Component }) => {
                        if (!visitedTabs.has(key)) return null
                        return (
                            <div
                                key={key}
                                className="p-6"
                                style={{ display: activeTab === key ? "block" : "none" }}
                            >
                                <Component onNavigateToTab={(tab: string) => handleTabChange(tab as TabKey)} />
                            </div>
                        )
                    })}
                </Suspense>
            </div>

            {/* ── Mobile: Horizontal Tabs (visible on small screens) ── */}
            <style>{`
                @media (max-width: 768px) {
                    .flex.h-full {
                        flex-direction: column;
                    }
                    .flex.h-full > aside {
                        width: 100% !important;
                        border-left: none;
                        border-bottom: 1px solid #e5e7eb;
                    }
                    .flex.h-full > aside nav {
                        display: flex;
                        gap: 4px;
                        overflow-x: auto;
                        padding: 8px 12px;
                    }
                    .flex.h-full > aside nav button {
                        flex-shrink: 0;
                    }
                }
            `}
            </style>
        </div>
    )
}

