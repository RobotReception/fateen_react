import { useState, lazy, Suspense, useCallback, memo } from "react"
import {
    ListTree,
    FileText,
    FolderTree,
    Link2,
    Users,
    Eye,
    ChevronLeft,
    Sparkles,
} from "lucide-react"

/* ── Lazy-loaded tab components ── */
const TemplatesTab = lazy(() => import("../components/TemplatesTab").then(m => ({ default: m.TemplatesTab })))
const TreeEditorTab = lazy(() => import("../components/TreeEditorTab").then(m => ({ default: m.TreeEditorTab })))
const AssignmentsTab = lazy(() => import("../components/AssignmentsTab").then(m => ({ default: m.AssignmentsTab })))
const AccountGroupsTab = lazy(() => import("../components/AccountGroupsTab").then(m => ({ default: m.AccountGroupsTab })))
const PreviewTab = lazy(() => import("../components/PreviewTab").then(m => ({ default: m.PreviewTab })))

type TabKey = "templates" | "tree-editor" | "assignments" | "groups" | "preview"

const TABS: { key: TabKey; title: string; icon: typeof ListTree; description: string; gradient: string }[] = [
    { key: "templates", title: "القوالب", icon: FileText, description: "إدارة قوالب القوائم", gradient: "linear-gradient(135deg, #3b82f6, #2563eb)" },
    { key: "tree-editor", title: "محرر الشجرة", icon: FolderTree, description: "بناء الشجرة التفاعلية", gradient: "linear-gradient(135deg, #10b981, #059669)" },
    { key: "assignments", title: "التعيينات", icon: Link2, description: "ربط القوالب بالأهداف", gradient: "linear-gradient(135deg, #f59e0b, #d97706)" },
    { key: "groups", title: "المجموعات", icon: Users, description: "مجموعات الحسابات", gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)" },
    { key: "preview", title: "المعاينة", icon: Eye, description: "معاينة القائمة", gradient: "linear-gradient(135deg, #ec4899, #db2777)" },
]

/* ── Loading fallback ── */
const TabSkeleton = memo(function TabSkeleton() {
    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ width: 200, height: 28, borderRadius: 10, background: "var(--t-border-light, #f0f0f0)", animation: "pulse 1.5s infinite" }} />
                <div style={{ width: 120, height: 36, borderRadius: 10, background: "var(--t-border-light, #f0f0f0)", animation: "pulse 1.5s infinite" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                {[0, 1, 2].map(i => <div key={i} style={{ height: 100, borderRadius: 16, background: "var(--t-border-light, #f0f0f0)", animation: "pulse 1.5s infinite", animationDelay: `${i * 0.15}s` }} />)}
            </div>
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

    const activeTabInfo = TABS.find(t => t.key === activeTab)

    return (
        <div style={{ display: "flex", height: "100%", direction: "rtl" }}>
            {/* ══════════════ Sidebar ══════════════ */}
            <aside
                style={{
                    width: sidebarCollapsed ? 64 : 220,
                    flexShrink: 0,
                    background: "var(--t-card, #fff)",
                    borderLeft: "1px solid var(--t-border-light, #f0f0f0)",
                    borderRadius: 8,
                    margin: "8px 0",
                    overflow: "hidden",
                    transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* Logo / Branding Header */}
                <div
                    onClick={() => { if (sidebarCollapsed) setSidebarCollapsed(false) }}
                    style={{
                        background: "linear-gradient(160deg, #004786 0%, #0072b5 50%, #0098d6 100%)",
                        padding: sidebarCollapsed ? "14px 8px" : "14px 16px",
                        position: "relative",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: sidebarCollapsed ? "center" : "space-between",
                        cursor: sidebarCollapsed ? "pointer" : "default",
                    }}
                >
                    {/* Decorative circles */}
                    <div style={{ position: "absolute", top: -20, left: -20, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
                    <div style={{ position: "absolute", bottom: -15, right: -15, width: 50, height: 50, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

                    <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                            width: sidebarCollapsed ? 32 : 28, height: sidebarCollapsed ? 32 : 28,
                            borderRadius: 8, background: "rgba(255,255,255,0.15)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            backdropFilter: "blur(10px)",
                        }}>
                            <ListTree size={sidebarCollapsed ? 16 : 14} style={{ color: "#fff" }} />
                        </div>
                        {!sidebarCollapsed && (
                            <div>
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", display: "block" }}>إدارة القوائم</span>
                                <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.6)", display: "block", marginTop: 1 }}>Menu Manager</span>
                            </div>
                        )}
                    </div>
                    {!sidebarCollapsed && (
                        <button
                            onClick={() => setSidebarCollapsed(true)}
                            style={{
                                background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 6,
                                padding: "3px 4px", cursor: "pointer", display: "flex", alignItems: "center",
                                transition: "background 0.15s", position: "relative", zIndex: 1,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.25)" }}
                            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)" }}
                        >
                            <ChevronLeft size={13} style={{ color: "rgba(255,255,255,0.85)" }} />
                        </button>
                    )}
                </div>

                {/* Navigation Items */}
                <nav style={{ padding: "10px 8px", flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                    {TABS.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.key
                        return (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                title={sidebarCollapsed ? tab.title : undefined}
                                style={{
                                    display: "flex", width: "100%", alignItems: "center", gap: 10,
                                    padding: sidebarCollapsed ? "10px 0" : "8px 10px",
                                    borderRadius: 10, border: "none",
                                    background: isActive ? "rgba(0,71,134,0.07)" : "transparent",
                                    cursor: "pointer",
                                    justifyContent: sidebarCollapsed ? "center" : "flex-start",
                                    position: "relative", textAlign: "right",
                                    transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
                                    color: "inherit",
                                }}
                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--t-card-hover, #f8f9fb)" }}
                                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent" }}
                            >
                                {/* Active indicator */}
                                {isActive && !sidebarCollapsed && (
                                    <div style={{
                                        position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)",
                                        width: 3, height: 20, borderRadius: 3,
                                        background: "linear-gradient(180deg, #004786, #0098d6)",
                                    }} />
                                )}
                                <div style={{
                                    width: sidebarCollapsed ? 32 : 28, height: sidebarCollapsed ? 32 : 28,
                                    borderRadius: 8,
                                    background: isActive ? "rgba(0,71,134,0.1)" : "var(--t-surface, #f3f4f6)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0, transition: "all 0.2s",
                                }}>
                                    <Icon
                                        size={sidebarCollapsed ? 14 : 13}
                                        strokeWidth={isActive ? 2.2 : 1.6}
                                        style={{
                                            color: isActive ? "#004786" : "var(--t-text-muted, #9ca3af)",
                                            transition: "color 0.15s",
                                        }}
                                    />
                                </div>
                                {!sidebarCollapsed && (
                                    <div style={{ overflow: "hidden", flex: 1 }}>
                                        <span style={{
                                            fontSize: 12.5, fontWeight: isActive ? 600 : 500,
                                            color: isActive ? "var(--t-text, #1f2937)" : "var(--t-text-secondary, #6b7280)",
                                            transition: "color 0.15s", display: "block",
                                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                        }}>{tab.title}</span>
                                        {isActive && (
                                            <span style={{ fontSize: 10, color: "var(--t-text-muted, #9ca3af)", display: "block", marginTop: 1 }}>
                                                {tab.description}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </nav>

                {/* Bottom branding */}
                {!sidebarCollapsed && (
                    <div style={{
                        padding: "12px 14px", borderTop: "1px solid var(--t-border-light, #f0f0f0)",
                        display: "flex", alignItems: "center", gap: 6,
                    }}>
                        <Sparkles size={11} style={{ color: "#d97706" }} />
                        <span style={{ fontSize: 10, color: "var(--t-text-muted, #9ca3af)" }}>Professional Menu System</span>
                    </div>
                )}
            </aside>

            {/* ══════════════ Main Content ══════════════ */}
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {/* Top bar with tab info */}
                <div style={{
                    padding: "12px 24px", borderBottom: "1px solid var(--t-border-light, #f0f0f0)",
                    display: "flex", alignItems: "center", gap: 12,
                    background: "var(--t-card, #fff)",
                }}>
                    {activeTabInfo && (() => {
                        const Icon = activeTabInfo.icon
                        return (
                            <>
                                <div style={{
                                    width: 32, height: 32, borderRadius: 9,
                                    background: activeTabInfo.gradient,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                }}>
                                    <Icon size={15} style={{ color: "#fff" }} />
                                </div>
                                <div>
                                    <h1 style={{ fontSize: 16, fontWeight: 700, color: "var(--t-text, #1f2937)", margin: 0 }}>
                                        {activeTabInfo.title}
                                    </h1>
                                    <p style={{ fontSize: 11, color: "var(--t-text-muted, #9ca3af)", margin: 0 }}>
                                        {activeTabInfo.description}
                                    </p>
                                </div>
                            </>
                        )
                    })()}
                </div>

                {/* Tab content */}
                <div style={{ flex: 1, overflowY: "auto" }}>
                    <Suspense fallback={<TabSkeleton />}>
                        {TAB_COMPONENTS.map(({ key, Component }) => {
                            if (!visitedTabs.has(key)) return null
                            return (
                                <div
                                    key={key}
                                    style={{
                                        padding: 24,
                                        display: activeTab === key ? "block" : "none",
                                        animation: activeTab === key ? "tabFadeIn 0.3s ease" : "none",
                                    }}
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
            </div>

            <style>{`
                @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }
                @keyframes tabFadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
                @media (max-width: 768px) {
                    .flex.h-full { flex-direction: column; }
                    .flex.h-full > aside { width: 100% !important; border-left: none; border-bottom: 1px solid #e5e7eb; }
                    .flex.h-full > aside nav { display: flex; gap: 4px; overflow-x: auto; padding: 8px 12px; }
                    .flex.h-full > aside nav button { flex-shrink: 0; }
                }
            `}</style>
        </div>
    )
}
