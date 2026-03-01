import { useState, lazy, Suspense, useCallback, memo } from "react"
import {
    ListTree,
    FileText,
    FolderTree,
    Link2,
    Users,
    Eye,
    ChevronLeft,
} from "lucide-react"

/* ── Lazy-loaded tab components ── */
const TemplatesTab = lazy(() => import("../components/TemplatesTab").then(m => ({ default: m.TemplatesTab })))
const TreeEditorTab = lazy(() => import("../components/TreeEditorTab").then(m => ({ default: m.TreeEditorTab })))
const AssignmentsTab = lazy(() => import("../components/AssignmentsTab").then(m => ({ default: m.AssignmentsTab })))
const AccountGroupsTab = lazy(() => import("../components/AccountGroupsTab").then(m => ({ default: m.AccountGroupsTab })))
const PreviewTab = lazy(() => import("../components/PreviewTab").then(m => ({ default: m.PreviewTab })))

type TabKey = "templates" | "tree-editor" | "assignments" | "groups" | "preview"

const TABS: { key: TabKey; title: string; icon: typeof ListTree; description: string }[] = [
    { key: "templates", title: "القوالب", icon: FileText, description: "إدارة قوالب القوائم" },
    { key: "tree-editor", title: "محرر الشجرة", icon: FolderTree, description: "بناء الشجرة التفاعلية" },
    { key: "assignments", title: "التعيينات", icon: Link2, description: "ربط القوالب بالأهداف" },
    { key: "groups", title: "المجموعات", icon: Users, description: "مجموعات الحسابات" },
    { key: "preview", title: "المعاينة", icon: Eye, description: "معاينة القائمة" },
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
interface TabComponentProps {
    onNavigateToTab?: (tab: string) => void
    onSelectTemplate?: (templateId: string) => void
    selectedTemplateId?: string | null
}

type LazyTab = React.LazyExoticComponent<React.FC<TabComponentProps>>

const TAB_COMPONENTS: { key: TabKey; Component: LazyTab }[] = [
    { key: "templates", Component: TemplatesTab as LazyTab },
    { key: "tree-editor", Component: TreeEditorTab as LazyTab },
    { key: "assignments", Component: AssignmentsTab as LazyTab },
    { key: "groups", Component: AccountGroupsTab as LazyTab },
    { key: "preview", Component: PreviewTab as LazyTab },
]

export function MenuManagerPage() {
    const [activeTab, setActiveTab] = useState<TabKey>("templates")
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [visitedTabs, setVisitedTabs] = useState<Set<TabKey>>(new Set(["templates"]))
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

    const handleTabChange = useCallback((key: TabKey) => {
        setActiveTab(key)
        setVisitedTabs(prev => {
            if (prev.has(key)) return prev
            const next = new Set(prev)
            next.add(key)
            return next
        })
    }, [])

    const handleNavigateToTab = useCallback((tab: string) => {
        handleTabChange(tab as TabKey)
    }, [handleTabChange])

    const handleSelectTemplate = useCallback((templateId: string) => {
        setSelectedTemplateId(templateId)
    }, [])

    return (
        <div className="flex h-full" dir="rtl">
            {/* ── Internal Sidebar ── */}
            <aside
                className={`shrink-0 bg-white transition-all duration-300 ${sidebarCollapsed ? "w-[60px]" : "w-52"}`}
                style={{
                    borderLeft: "1px solid var(--t-border-light, #f0f0f0)",
                    borderRadius: "6px",
                    margin: "8px 0",
                    overflow: "hidden",
                }}
            >
                {/* Gradient Header */}
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
                    }}
                >
                    <div style={{
                        position: "absolute", top: -15, left: -15,
                        width: 60, height: 60, borderRadius: "50%",
                        background: "rgba(255,255,255,0.06)",
                    }} />
                    <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 7 }}>
                        <ListTree size={sidebarCollapsed ? 18 : 14} style={{ color: "rgba(255,255,255,0.85)" }} />
                        {!sidebarCollapsed && (
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: "#fff" }}>إدارة القوائم</span>
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

                {/* Navigation */}
                <nav style={{ padding: "6px 6px" }}>
                    {TABS.map((tab) => {
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

            {/* ── Main Content ── */}
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
                                <Component
                                    onNavigateToTab={handleNavigateToTab}
                                    onSelectTemplate={handleSelectTemplate}
                                    selectedTemplateId={selectedTemplateId}
                                />
                            </div>
                        )
                    })}
                </Suspense>
            </div>

            {/* ── Mobile: Horizontal Tabs ── */}
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
            `}</style>
        </div>
    )
}
