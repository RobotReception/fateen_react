import { UserCircle, UserX, ChevronDown, ChevronRight, Plus, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { useInboxStore, type InboxSection } from "../../store/inbox.store"
import { useInboxSummary } from "../../hooks/use-inbox-summary"
import type { SidebarLifecycle, SidebarTeam } from "../../types/inbox.types"

const TOP_NAV: { key: string; label: string; icon: React.ElementType }[] = [
    { key: "all", label: "All", icon: UserCircle },
    { key: "mine", label: "Mine", icon: UserCircle },
    { key: "unassigned", label: "Unassigned", icon: UserX },
]

export function InboxNavSidebar() {
    const { activeSection, setActiveSection, collapsedSections, toggleSection, sidebarCollapsed, toggleSidebar } = useInboxStore()
    const { data: summary } = useInboxSummary()

    const countMap: Record<string, number> = {
        all: summary?.all ?? 0,
        mine: summary?.mine ?? 0,
        unassigned: summary?.unassigned ?? 0,
    }

    const lifecycles: SidebarLifecycle[] = summary?.lifecycles ?? []
    const teams: SidebarTeam[] = summary?.teams ?? []

    const isActive = (key: string) => activeSection === key
    const collapsed = sidebarCollapsed

    return (
        <aside style={{
            width: collapsed ? 54 : 190,
            minWidth: collapsed ? 54 : 190,
            height: "100%",
            display: "flex", flexDirection: "column",
            background: "var(--t-card)",
            borderLeft: "1px solid var(--t-border-light)",
            overflow: "hidden",
            transition: "width 0.2s ease, min-width 0.2s ease",
        }}>
            {/* Header */}
            <div style={{
                display: "flex", alignItems: "center",
                justifyContent: collapsed ? "center" : "space-between",
                padding: collapsed ? "14px 0 10px" : "14px 14px 10px",
                flexShrink: 0,
            }}>
                {!collapsed && (
                    <span style={{ fontSize: 15, fontWeight: 700, color: "var(--t-text)" }}>Inbox</span>
                )}
                <button
                    onClick={toggleSidebar}
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    style={{
                        width: 28, height: 28, borderRadius: 6,
                        border: "none", background: "transparent",
                        cursor: "pointer", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        color: "var(--t-text-muted)", transition: "background 0.12s",
                        flexShrink: 0,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--t-surface)" }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                >
                    {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                </button>
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "0 0 16px" }}>
                {/* Top nav */}
                <div style={{ padding: collapsed ? "0 4px" : "0 8px", marginBottom: 4 }}>
                    {TOP_NAV.map((item) => {
                        const Icon = item.icon
                        const active = isActive(item.key)
                        const count = countMap[item.key]
                        return (
                            <NavItem key={item.key} isActive={active} collapsed={collapsed}
                                onClick={() => setActiveSection(item.key as InboxSection)}
                                title={collapsed ? item.label : undefined}>
                                <Icon size={14} style={{ flexShrink: 0, opacity: 0.8 }} />
                                {!collapsed && <span style={{ flex: 1, fontWeight: active ? 700 : 500 }}>{item.label}</span>}
                                {!collapsed && count > 0 && <CountBadge count={count} active={active} />}
                                {collapsed && count > 0 && (
                                    <span style={{
                                        position: "absolute", top: 2, right: 2,
                                        fontSize: 8, fontWeight: 700,
                                        width: 14, height: 14, borderRadius: "50%",
                                        background: active ? "rgba(255,255,255,0.3)" : "var(--t-accent)",
                                        color: active ? "#fff" : "var(--t-text-on-accent)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>{count > 9 ? "9+" : count}</span>
                                )}
                            </NavItem>
                        )
                    })}
                </div>

                {/* Lifecycle */}
                {!collapsed && (
                    <>
                        <SectionHeader label="Lifecycle"
                            collapsed={!!collapsedSections["lifecycle"]}
                            onToggle={() => toggleSection("lifecycle")} />
                        {!collapsedSections["lifecycle"] && (
                            <div style={{ padding: "2px 8px 6px" }}>
                                {lifecycles.length === 0 ? (
                                    <EmptyLabel text="لا توجد مراحل" />
                                ) : lifecycles.map((lc) => {
                                    const key = `lc_${lc.code}`
                                    return (
                                        <NavItem key={key} isActive={isActive(key)} collapsed={false}
                                            onClick={() => setActiveSection(key as InboxSection)}>
                                            <span style={{ fontSize: 14, lineHeight: 1, flexShrink: 0 }}>{lc.icon || "📌"}</span>
                                            <span style={{ flex: 1 }}>{lc.name}</span>
                                            {lc.count > 0 && <CountBadge count={lc.count} active={isActive(key)} />}
                                        </NavItem>
                                    )
                                })}
                            </div>
                        )}

                        {/* Team Inbox */}
                        <SectionHeader label="Team Inbox"
                            collapsed={!!collapsedSections["team"]}
                            onToggle={() => toggleSection("team")} showAdd />
                        {!collapsedSections["team"] && (
                            <div style={{ padding: "2px 8px 6px" }}>
                                {teams.length === 0 ? (
                                    <EmptyLabel text="No inboxes created" />
                                ) : teams.map((team) => {
                                    const key = `team_${team.team_id}`
                                    return (
                                        <NavItem key={key} isActive={isActive(key)} collapsed={false}
                                            onClick={() => setActiveSection(key as InboxSection)}>
                                            <span style={{
                                                width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                                                background: team.color ?? "var(--t-text-faint)",
                                            }} />
                                            <span style={{ flex: 1 }}>{team.name}</span>
                                            {(team.assigned_count ?? 0) > 0 && (
                                                <CountBadge count={team.assigned_count!} active={isActive(key)} />
                                            )}
                                        </NavItem>
                                    )
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* Collapsed mode: show lifecycle/team icons */}
                {collapsed && (
                    <div style={{ padding: "4px 4px", borderTop: "1px solid var(--t-border-light)", marginTop: 4 }}>
                        {lifecycles.map((lc) => {
                            const key = `lc_${lc.code}`
                            return (
                                <NavItem key={key} isActive={isActive(key)} collapsed={true}
                                    onClick={() => setActiveSection(key as InboxSection)}
                                    title={lc.name}>
                                    <span style={{ fontSize: 16, lineHeight: 1 }}>{lc.icon || "📌"}</span>
                                </NavItem>
                            )
                        })}
                        {teams.map((team) => {
                            const key = `team_${team.team_id}`
                            return (
                                <NavItem key={key} isActive={isActive(key)} collapsed={true}
                                    onClick={() => setActiveSection(key as InboxSection)}
                                    title={team.name}>
                                    <span style={{
                                        width: 10, height: 10, borderRadius: "50%",
                                        background: team.color ?? "var(--t-text-faint)",
                                    }} />
                                </NavItem>
                            )
                        })}
                    </div>
                )}
            </div>
        </aside>
    )
}

// ── Helpers ───────────────────────────────────────────────

function NavItem({ children, isActive, collapsed, onClick, title }: {
    children: React.ReactNode; isActive: boolean; collapsed: boolean;
    onClick: () => void; title?: string
}) {
    return (
        <div onClick={onClick} title={title} style={{
            display: "flex", alignItems: "center",
            gap: collapsed ? 0 : 8,
            padding: collapsed ? "8px 0" : "7px 10px",
            justifyContent: collapsed ? "center" : "flex-start",
            borderRadius: 8,
            cursor: "pointer", marginBottom: 2, fontSize: 13,
            background: isActive ? "var(--t-text)" : "transparent",
            color: isActive ? "var(--t-bg, #fff)" : "var(--t-text-secondary)",
            transition: "background 0.12s",
            position: "relative",
        }}
            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--t-surface)" }}
            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent" }}
        >{children}</div>
    )
}

function CountBadge({ count, active }: { count: number; active: boolean }) {
    return (
        <span style={{
            fontSize: 10, fontWeight: 700,
            padding: "1px 5px", borderRadius: 10,
            background: active ? "rgba(255,255,255,0.25)" : "var(--t-surface)",
            color: active ? "#fff" : "var(--t-text-muted)",
            minWidth: 18, textAlign: "center",
        }}>{count}</span>
    )
}

function SectionHeader({ label, collapsed, onToggle, showAdd }: {
    label: string; collapsed: boolean; onToggle: () => void; showAdd?: boolean
}) {
    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px 4px" }}>
            <button onClick={onToggle} style={{
                display: "flex", alignItems: "center", gap: 4,
                background: "none", border: "none",
                fontSize: 10, fontWeight: 700, color: "var(--t-text-faint)",
                cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.08em", padding: 0,
            }}>
                {collapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
                {label}
            </button>
            {showAdd && (
                <button style={{
                    width: 18, height: 18, border: "none", background: "transparent",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--t-text-faint)", borderRadius: 4,
                }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--t-surface)" }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                ><Plus size={12} /></button>
            )}
        </div>
    )
}

function EmptyLabel({ text }: { text: string }) {
    return <p style={{ fontSize: 11, color: "var(--t-text-faint)", padding: "4px 10px" }}>{text}</p>
}
