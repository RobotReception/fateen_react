import { useState, lazy, Suspense, useCallback, memo } from "react"
import {
    Database,
    BarChart3,
    Building2,
    FolderTree,
    BookOpen,
    ChevronLeft,
    PieChart,
} from "lucide-react"

/* ── Lazy-loaded tab components (code-split per tab) ── */
const DataManagementTab = lazy(() => import("../components/DataManagementTab").then(m => ({ default: m.DataManagementTab })))
const UserAnalyticsTab = lazy(() => import("../components/UserAnalyticsTab").then(m => ({ default: m.UserAnalyticsTab })))
const DepartmentsTab = lazy(() => import("../components/DepartmentsTab").then(m => ({ default: m.DepartmentsTab })))
const CategoriesTab = lazy(() => import("../components/CategoriesTab").then(m => ({ default: m.CategoriesTab })))
const DocumentAnalyticsTab = lazy(() => import("../components/DocumentAnalyticsTab").then(m => ({ default: m.DocumentAnalyticsTab })))

type TabKey = "data" | "analytics" | "departments" | "categories" | "doc-analytics"

const TABS: { key: TabKey; title: string; icon: typeof Database; description: string }[] = [
    { key: "doc-analytics", title: "تحليلات المستندات", icon: PieChart, description: "إحصائيات وتقارير" },
    { key: "data", title: "إدارة البيانات", icon: Database, description: "إدارة الملفات والمستندات" },
    { key: "analytics", title: "ملفات المستخدمين", icon: BarChart3, description: "عرض ملفات المستخدمين" },
    { key: "departments", title: "الأقسام", icon: Building2, description: "إدارة أقسام المؤسسة" },
    { key: "categories", title: "الفئات", icon: FolderTree, description: "تصنيف المستندات" },
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
]

export function KnowledgeBasePage() {
    const [activeTab, setActiveTab] = useState<TabKey>("doc-analytics")
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    // Track which tabs have been visited — only mount a tab once it's been clicked
    const [visitedTabs, setVisitedTabs] = useState<Set<TabKey>>(new Set(["doc-analytics"]))

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
                className={`shrink-0 border-l border-gray-200 bg-white transition-all duration-300 ${sidebarCollapsed ? "w-[68px]" : "w-64"
                    }`}
            >
                {/* Sidebar Header */}
                <div className="flex h-14 items-center justify-between border-b border-gray-100 px-4">
                    {!sidebarCollapsed && (
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-900">
                                <BookOpen size={14} className="text-white" />
                            </div>
                            <span className="text-sm font-bold text-gray-700">قاعدة المعرفة</span>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    >
                        <ChevronLeft
                            size={16}
                            className={`transition-transform duration-300 ${sidebarCollapsed ? "rotate-180" : ""}`}
                        />
                    </button>
                </div>

                {/* Sidebar Navigation */}
                <nav className="space-y-1 p-3">
                    {TABS.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.key
                        return (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                title={sidebarCollapsed ? tab.title : undefined}
                                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right transition-all duration-200 ${isActive
                                    ? "bg-gray-100 text-gray-800 shadow-sm"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                                    }`}
                            >
                                <div
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all ${isActive
                                        ? "bg-gray-900 text-white "
                                        : "bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-600"
                                        }`}
                                >
                                    <Icon size={16} />
                                </div>
                                {!sidebarCollapsed && (
                                    <div className="min-w-0 flex-1">
                                        <p className={`truncate text-sm font-medium ${isActive ? "text-blue-700" : ""}`}>
                                            {tab.title}
                                        </p>
                                        <p className="truncate text-[10px] text-gray-400">{tab.description}</p>
                                    </div>
                                )}
                                {!sidebarCollapsed && isActive && (
                                    <div className="h-5 w-1 rounded-full bg-gray-900" />
                                )}
                            </button>
                        )
                    })}
                </nav>
            </aside>

            {/* ── Main Content — hidden-mount pattern: tabs stay mounted but hidden ── */}
            <div className="flex-1 overflow-y-auto">
                <Suspense fallback={<div className="p-6"><TabSkeleton /></div>}>
                    {TAB_COMPONENTS.map(({ key, Component }) => {
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

