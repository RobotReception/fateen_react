import { UserCircle, UserX, ChevronDown, ChevronRight, Plus, PanelLeftClose, PanelLeftOpen, Inbox } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useInboxStore, type InboxSection } from "../../store/inbox.store"
import { useInboxSummary } from "../../hooks/use-inbox-summary"
import type { SidebarLifecycle, SidebarTeam } from "../../types/inbox.types"

const TOP_NAV: { key: string; label: string; icon: React.ElementType }[] = [
    { key: "all", label: "All", icon: Inbox },
    { key: "mine", label: "Mine", icon: UserCircle },
    { key: "unassigned", label: "Unassigned", icon: UserX },
]

export function InboxNavSidebar() {
    const { activeSection, setActiveSection, collapsedSections, toggleSection, sidebarCollapsed, toggleSidebar } = useInboxStore()
    const { data: summary } = useInboxSummary()
    const navigate = useNavigate()

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
        <aside className="ins-root">
            {/* Brand accent strip */}
            <div className="ins-accent-strip" />

            {/* Header */}
            <div className="ins-header">
                {!collapsed && (
                    <div className="ins-logo-area">
                        <div className="ins-logo-icon">
                            <Inbox size={14} />
                        </div>
                        <span className="ins-title">Inbox</span>
                    </div>
                )}
                <button
                    onClick={toggleSidebar}
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className="ins-toggle-btn"
                >
                    {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
                </button>
            </div>

            {/* Scrollable body */}
            <div className="ins-body">
                {/* Top nav */}
                <div className="ins-nav-group">
                    {TOP_NAV.map((item) => {
                        const Icon = item.icon
                        const active = isActive(item.key)
                        const count = countMap[item.key]
                        return (
                            <NavItem key={item.key} isActive={active} collapsed={collapsed}
                                onClick={() => setActiveSection(item.key as InboxSection)}
                                title={collapsed ? item.label : undefined}>
                                <Icon size={14} className="ins-nav-icon" />
                                {!collapsed && <span className={`ins-nav-label ${active ? "ins-nav-label-active" : ""}`}>{item.label}</span>}
                                {!collapsed && count > 0 && <CountBadge count={count} active={active} />}
                                {collapsed && count > 0 && (
                                    <span className={`ins-mini-badge ${active ? "ins-mini-badge-active" : ""}`}>
                                        {count > 9 ? "9+" : count}
                                    </span>
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
                            onToggle={() => toggleSection("lifecycle")}
                            onAdd={() => navigate("/dashboard/settings/organization?tab=lifecycles")} />
                        {!collapsedSections["lifecycle"] && (
                            <div className="ins-section-items">
                                {lifecycles.length === 0 ? (
                                    <EmptyLabel text="لا توجد مراحل" />
                                ) : lifecycles.map((lc) => {
                                    const key = `lc_${lc.code}`
                                    return (
                                        <NavItem key={key} isActive={isActive(key)} collapsed={false}
                                            onClick={() => setActiveSection(key as InboxSection)}>
                                            <span className="ins-lc-emoji">{lc.icon || "📌"}</span>
                                            <span className="ins-nav-label" style={{ flex: 1 }}>{lc.name}</span>
                                            {lc.count > 0 && <CountBadge count={lc.count} active={isActive(key)} />}
                                        </NavItem>
                                    )
                                })}
                            </div>
                        )}

                        {/* Team Inbox */}
                        <SectionHeader label="Team Inbox"
                            collapsed={!!collapsedSections["team"]}
                            onToggle={() => toggleSection("team")}
                            onAdd={() => navigate("/dashboard/settings/organization?tab=teams")} />
                        {!collapsedSections["team"] && (
                            <div className="ins-section-items">
                                {teams.length === 0 ? (
                                    <EmptyLabel text="No inboxes created" />
                                ) : teams.map((team) => {
                                    const key = `team_${team.team_id}`
                                    return (
                                        <NavItem key={key} isActive={isActive(key)} collapsed={false}
                                            onClick={() => setActiveSection(key as InboxSection)}>
                                            <span className="ins-team-dot" style={{ background: team.color ?? "var(--t-text-faint)" }} />
                                            <span className="ins-nav-label" style={{ flex: 1 }}>{team.name}</span>
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
                    <div className="ins-collapsed-section">
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

            <style>{`
                .ins-root {
                    width: ${collapsed ? 56 : 200}px;
                    min-width: ${collapsed ? 56 : 200}px;
                    height: 100%;
                    display: flex; flex-direction: column;
                    background: var(--t-card);
                    border-left: 1px solid var(--t-border-light);
                    overflow: hidden;
                    transition: width 0.22s cubic-bezier(.4,0,.2,1), min-width 0.22s cubic-bezier(.4,0,.2,1);
                    position: relative;
                }

                /* Brand accent strip at top */
                .ins-accent-strip {
                    height: 3px; flex-shrink: 0;
                    background: linear-gradient(90deg, #004786, #0072b5, #004786);
                    opacity: 0.85;
                }

                /* Header */
                .ins-header {
                    display: flex; align-items: center;
                    justify-content: ${collapsed ? "center" : "space-between"};
                    padding: ${collapsed ? "12px 0 8px" : "12px 12px 8px"};
                    flex-shrink: 0;
                }
                .ins-logo-area {
                    display: flex; align-items: center; gap: 8px;
                }
                .ins-logo-icon {
                    width: 26px; height: 26px; border-radius: 7px;
                    background: linear-gradient(135deg, #004786, #0072b5);
                    display: flex; align-items: center; justify-content: center;
                    color: #fff; flex-shrink: 0;
                }
                .ins-title {
                    font-size: 14px; font-weight: 800;
                    color: var(--t-text);
                    letter-spacing: -0.02em;
                }
                .ins-toggle-btn {
                    width: 28px; height: 28px; border-radius: 7px;
                    border: 1px solid var(--t-border-light);
                    background: transparent; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    color: var(--t-text-muted);
                    transition: all 0.15s; flex-shrink: 0;
                }
                .ins-toggle-btn:hover {
                    background: var(--t-surface);
                    border-color: var(--t-border);
                    color: var(--t-text);
                }

                /* Body */
                .ins-body {
                    flex: 1; overflow-y: auto; overflow-x: hidden;
                    padding: 0 0 16px;
                }
                .ins-body::-webkit-scrollbar { width: 3px; }
                .ins-body::-webkit-scrollbar-thumb { background: rgba(0,0,0,.1); border-radius: 3px; }

                /* Nav group */
                .ins-nav-group {
                    padding: ${collapsed ? "0 6px" : "0 8px"};
                    margin-bottom: 2px;
                }

                /* Nav item */
                .ins-nav-item {
                    display: flex; align-items: center;
                    gap: ${collapsed ? "0" : "8px"};
                    padding: ${collapsed ? "9px 0" : "7px 10px"};
                    justify-content: ${collapsed ? "center" : "flex-start"};
                    border-radius: 8px;
                    cursor: pointer; margin-bottom: 1px; font-size: 13px;
                    transition: all 0.15s ease;
                    position: relative;
                    border: 1px solid transparent;
                }
                .ins-nav-item-active {
                    background: linear-gradient(135deg, #004786, #0072b5) !important;
                    color: #fff !important;
                    border-color: rgba(0,71,134,0.2);
                    box-shadow: 0 2px 8px rgba(0,71,134,0.18);
                }
                .ins-nav-item:not(.ins-nav-item-active):hover {
                    background: var(--t-surface);
                    border-color: var(--t-border-light);
                }

                .ins-nav-icon { flex-shrink: 0; opacity: 0.85; }
                .ins-nav-label { font-weight: 500; }
                .ins-nav-label-active { font-weight: 700; }

                /* Count badge */
                .ins-count-badge {
                    font-size: 10px; font-weight: 700;
                    padding: 1px 6px; border-radius: 10px;
                    min-width: 18px; text-align: center;
                    line-height: 16px;
                    transition: all 0.15s;
                }
                .ins-count-active {
                    background: rgba(255,255,255,0.22);
                    color: #fff;
                    backdrop-filter: blur(4px);
                }
                .ins-count-inactive {
                    background: var(--t-surface-deep, var(--t-surface));
                    color: var(--t-text-muted);
                }

                /* Mini badge (collapsed) */
                .ins-mini-badge {
                    position: absolute; top: 2px; right: 2px;
                    font-size: 8px; font-weight: 700;
                    width: 14px; height: 14px; border-radius: 50%;
                    background: linear-gradient(135deg, #004786, #0072b5);
                    color: #fff;
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 1px 4px rgba(0,71,134,0.3);
                }
                .ins-mini-badge-active {
                    background: rgba(255,255,255,0.3);
                }

                /* Section header */
                .ins-section-header {
                    display: flex; align-items: center;
                    justify-content: space-between;
                    padding: 12px 14px 4px;
                }
                .ins-section-toggle {
                    display: flex; align-items: center; gap: 4px;
                    background: none; border: none;
                    font-size: 10px; font-weight: 700;
                    color: var(--t-text-faint);
                    cursor: pointer; text-transform: uppercase;
                    letter-spacing: 0.08em; padding: 0;
                    transition: color 0.12s;
                }
                .ins-section-toggle:hover { color: var(--t-text-muted); }
                .ins-section-add {
                    width: 20px; height: 20px; border: none;
                    background: transparent; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    color: var(--t-text-faint); border-radius: 5px;
                    transition: all 0.12s;
                }
                .ins-section-add:hover {
                    background: var(--t-surface);
                    color: var(--t-text-muted);
                }

                /* Section items */
                .ins-section-items { padding: 2px 8px 6px; }

                /* Lifecycle emoji */
                .ins-lc-emoji { font-size: 14px; line-height: 1; flex-shrink: 0; }

                /* Team dot */
                .ins-team-dot {
                    width: 8px; height: 8px; border-radius: 50%;
                    flex-shrink: 0;
                    box-shadow: 0 0 0 2px var(--t-card);
                }

                /* Collapsed section */
                .ins-collapsed-section {
                    padding: 4px 6px;
                    border-top: 1px solid var(--t-border-light);
                    margin-top: 4px;
                }

                /* Empty label */
                .ins-empty {
                    font-size: 11px; color: var(--t-text-faint);
                    padding: 4px 10px; font-style: italic;
                }
            `}</style>
        </aside>
    )
}

// ── Helpers ───────────────────────────────────────────────

function NavItem({ children, isActive, collapsed: _collapsed, onClick, title }: {
    children: React.ReactNode; isActive: boolean; collapsed: boolean;
    onClick: () => void; title?: string
}) {
    return (
        <div onClick={onClick} title={title}
            className={`ins-nav-item ${isActive ? "ins-nav-item-active" : ""}`}
        >{children}</div>
    )
}

function CountBadge({ count, active }: { count: number; active: boolean }) {
    return (
        <span className={`ins-count-badge ${active ? "ins-count-active" : "ins-count-inactive"}`}>
            {count}
        </span>
    )
}

function SectionHeader({ label, collapsed, onToggle, onAdd }: {
    label: string; collapsed: boolean; onToggle: () => void; onAdd?: () => void
}) {
    return (
        <div className="ins-section-header">
            <button onClick={onToggle} className="ins-section-toggle">
                {collapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
                {label}
            </button>
            {onAdd && (
                <button onClick={onAdd} title="إضافة" className="ins-section-add">
                    <Plus size={12} />
                </button>
            )}
        </div>
    )
}

function EmptyLabel({ text }: { text: string }) {
    return <p className="ins-empty">{text}</p>
}
