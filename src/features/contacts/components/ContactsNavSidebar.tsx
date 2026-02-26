import {
    ChevronDown,
    ChevronRight,
    PanelLeftClose,
    PanelLeftOpen,
    Users,
    Plus,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useContactsStore, type ContactsSection } from "../store/contacts.store"
import { useContactsSidebarSummary } from "../hooks/use-contacts-summary"
import type { ContactsSidebarLifecycle, ContactsSidebarTeam } from "../services/contacts-service"

export function ContactsNavSidebar() {
    const {
        activeSection, setActiveSection,
        sidebarCollapsed, toggleSidebar,
        collapsedSections, toggleCollapsedSection,
    } = useContactsStore()

    const { data: summary } = useContactsSidebarSummary()
    const navigate = useNavigate()

    const lifecycles: ContactsSidebarLifecycle[] = summary?.lifecycles ?? []
    const teams: ContactsSidebarTeam[] = summary?.teams ?? []
    const totalCount = summary?.all ?? 0

    const collapsed = sidebarCollapsed
    const isActive = (key: string) => activeSection === key

    return (
        <aside style={{
            width: collapsed ? 54 : 220,
            minWidth: collapsed ? 54 : 220,
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
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--t-text)" }}>Contacts</span>
                    </div>
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
                {/* Top nav: All */}
                <div style={{ padding: collapsed ? "0 4px" : "0 8px", marginBottom: 4 }}>
                    <NavItem isActive={isActive("all")} collapsed={collapsed}
                        onClick={() => setActiveSection("all")}
                        title={collapsed ? "All" : undefined}>
                        <Users size={14} style={{ flexShrink: 0, opacity: 0.8 }} />
                        {!collapsed && <span style={{ flex: 1, fontWeight: isActive("all") ? 700 : 500 }}>All</span>}
                        {!collapsed && totalCount > 0 && <CountBadge count={totalCount} active={isActive("all")} />}
                        {collapsed && totalCount > 0 && (
                            <span style={{
                                position: "absolute", top: 2, right: 2,
                                fontSize: 8, fontWeight: 700,
                                width: 14, height: 14, borderRadius: "50%",
                                background: isActive("all") ? "rgba(255,255,255,0.3)" : "var(--t-accent)",
                                color: "var(--t-text-on-accent)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>{totalCount > 9 ? "9+" : totalCount}</span>
                        )}
                    </NavItem>
                </div>

                {/* ── Lifecycle (from /contacts/sidebar-summary) ── */}
                {!collapsed && (
                    <>
                        <SectionHeader
                            label="Lifecycle"
                            collapsed={!!collapsedSections["lifecycle"]}
                            onToggle={() => toggleCollapsedSection("lifecycle")}
                            onAdd={() => navigate("/dashboard/settings/organization?tab=lifecycles")}
                        />
                        {!collapsedSections["lifecycle"] && (
                            <div style={{ padding: "2px 8px 6px" }}>
                                {lifecycles.length === 0 ? (
                                    <EmptyLabel text="لا توجد مراحل" />
                                ) : lifecycles.map((lc) => {
                                    const key = `lc_${lc.code}`
                                    return (
                                        <NavItem key={key} isActive={isActive(key)} collapsed={false}
                                            onClick={() => setActiveSection(key as ContactsSection)}>
                                            <span style={{ fontSize: 14, lineHeight: 1, flexShrink: 0 }}>{lc.icon || "📌"}</span>
                                            <span style={{ flex: 1 }}>{lc.name}</span>
                                            <CountBadge count={lc.count} active={isActive(key)} />
                                        </NavItem>
                                    )
                                })}
                            </div>
                        )}

                        {/* ── Teams (from /contacts/sidebar-summary) ── */}
                        <SectionHeader
                            label="Team Inbox"
                            collapsed={!!collapsedSections["team"]}
                            onToggle={() => toggleCollapsedSection("team")}
                            onAdd={() => navigate("/dashboard/settings/organization?tab=teams")}
                        />
                        {!collapsedSections["team"] && (
                            <div style={{ padding: "2px 8px 6px" }}>
                                {teams.length === 0 ? (
                                    <EmptyLabel text="No teams created" />
                                ) : teams.map((team) => {
                                    const key = `team_${team.team_id}`
                                    return (
                                        <NavItem key={key} isActive={isActive(key)} collapsed={false}
                                            onClick={() => setActiveSection(key as ContactsSection)}>
                                            <span style={{
                                                width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                                                background: team.color ?? "var(--t-text-faint)",
                                            }} />
                                            <span style={{ flex: 1 }}>{team.name}</span>
                                            <CountBadge count={team.customers_count} active={isActive(key)} />
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
                                    onClick={() => setActiveSection(key as ContactsSection)}
                                    title={lc.name}>
                                    <span style={{ fontSize: 16, lineHeight: 1 }}>{lc.icon || "📌"}</span>
                                </NavItem>
                            )
                        })}
                        {teams.map((team) => {
                            const key = `team_${team.team_id}`
                            return (
                                <NavItem key={key} isActive={isActive(key)} collapsed={true}
                                    onClick={() => setActiveSection(key as ContactsSection)}
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
            background: isActive ? "var(--t-accent)" : "transparent",
            color: isActive ? "var(--t-text-on-accent)" : "var(--t-text-secondary)",
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
            color: active ? "var(--t-text-on-accent)" : "var(--t-text-muted)",
            minWidth: 18, textAlign: "center",
        }}>{count}</span>
    )
}

function SectionHeader({ label, collapsed, onToggle, onAdd }: {
    label: string; collapsed: boolean; onToggle: () => void; onAdd?: () => void
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
            {onAdd && (
                <button
                    onClick={onAdd}
                    title="إضافة"
                    style={{
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
