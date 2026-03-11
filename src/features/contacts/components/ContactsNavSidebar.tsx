import {
    ChevronDown,
    ChevronRight,
    PanelLeftClose,
    PanelLeftOpen,
    Users,
    Plus,
    Workflow,
    UsersRound,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useContactsStore, type ContactsSection } from "../store/contacts.store"
import { useContactsSidebarSummary } from "../hooks/use-contacts-summary"
import type { ContactsSidebarLifecycle, ContactsSidebarTeam } from "../services/contacts-service"

const CSS = `
@keyframes cnFade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
.cn-root{height:100%;display:flex;flex-direction:column;background:#fff;border-left:1px solid var(--t-border);overflow:hidden;transition:width .2s ease,min-width .2s ease}
.cn-header{display:flex;align-items:center;padding:12px;flex-shrink:0;border-bottom:1px solid #f0f1f3}
.cn-toggle{width:28px;height:28px;border-radius:7px;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--t-text-faint);transition:all .12s;flex-shrink:0}
.cn-toggle:hover{background:var(--t-surface);color:var(--t-text-muted)}
.cn-nav{padding:4px;margin-bottom:2px;cursor:pointer;display:flex;align-items:center;border-radius:8px;font-size:12.5px;transition:all .12s;position:relative;gap:8px}
.cn-nav:hover{background:var(--t-surface)}
.cn-nav.active{background:var(--t-gradient-accent);color:#fff}
.cn-nav.active:hover{background:var(--t-gradient-accent)}
.cn-count{font-size:9px;font-weight:700;padding:1px 6px;border-radius:10px;min-width:18px;text-align:center}
.cn-sec-hdr{display:flex;align-items:center;justify-content:space-between;padding:8px 12px 4px}
.cn-sec-btn{display:flex;align-items:center;gap:3px;background:none;border:none;font-size:9.5px;font-weight:700;color:#b0b7c3;cursor:pointer;text-transform:uppercase;letter-spacing:.08em;padding:0}
.cn-sec-add{width:18px;height:18px;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#b0b7c3;border-radius:4px;transition:all .1s}
.cn-sec-add:hover{background:var(--t-surface);color:var(--t-accent)}
.cn-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
`

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
        <aside className="cn-root" style={{ width: collapsed ? 52 : 210, minWidth: collapsed ? 52 : 210 }}>
            <style>{CSS}</style>

            {/* Header */}
            <div className="cn-header" style={{ justifyContent: collapsed ? "center" : "space-between", padding: collapsed ? "12px 0" : "12px" }}>
                {!collapsed && (
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 7, background: "var(--t-gradient-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Users size={12} style={{ color: "#fff" }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text)" }}>جهات الاتصال</span>
                    </div>
                )}
                <button className="cn-toggle" onClick={toggleSidebar} title={collapsed ? "توسيع" : "طي"}>
                    {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
                </button>
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "6px 0 12px" }}>
                {/* All */}
                <div style={{ padding: collapsed ? "0 4px" : "0 6px", marginBottom: 2 }}>
                    <NavItem active={isActive("all")} collapsed={collapsed} onClick={() => setActiveSection("all")} title={collapsed ? "الكل" : undefined}>
                        <Users size={13} style={{ flexShrink: 0, opacity: .8 }} />
                        {!collapsed && <span style={{ flex: 1, fontWeight: isActive("all") ? 700 : 500 }}>الكل</span>}
                        {!collapsed && totalCount > 0 && <CountBadge count={totalCount} active={isActive("all")} />}
                        {collapsed && totalCount > 0 && (
                            <span style={{
                                position: "absolute", top: 1, right: 1, fontSize: 7, fontWeight: 700,
                                width: 13, height: 13, borderRadius: "50%",
                                background: isActive("all") ? "rgba(255,255,255,.3)" : "var(--t-accent)",
                                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                            }}>{totalCount > 9 ? "9+" : totalCount}</span>
                        )}
                    </NavItem>
                    <NavItem active={isActive("mine")} collapsed={collapsed} onClick={() => setActiveSection("mine")} title={collapsed ? "محادثاتي" : undefined}>
                        <Users size={13} style={{ flexShrink: 0, opacity: .8 }} />
                        {!collapsed && <span style={{ flex: 1, fontWeight: isActive("mine") ? 700 : 500 }}>محادثاتي</span>}
                        {!collapsed && (summary?.mine ?? 0) > 0 && <CountBadge count={summary?.mine ?? 0} active={isActive("mine")} />}
                    </NavItem>
                    <NavItem active={isActive("unassigned")} collapsed={collapsed} onClick={() => setActiveSection("unassigned")} title={collapsed ? "غير معينة" : undefined}>
                        <Users size={13} style={{ flexShrink: 0, opacity: .8 }} />
                        {!collapsed && <span style={{ flex: 1, fontWeight: isActive("unassigned") ? 700 : 500 }}>غير معينة</span>}
                        {!collapsed && (summary?.unassigned ?? 0) > 0 && <CountBadge count={summary?.unassigned ?? 0} active={isActive("unassigned")} />}
                    </NavItem>
                </div>

                {/* ── Lifecycle ── */}
                {!collapsed && (
                    <>
                        <SectionHeader label="مراحل الحياة" icon={<Workflow size={10} />}
                            collapsed={!!collapsedSections["lifecycle"]}
                            onToggle={() => toggleCollapsedSection("lifecycle")}
                            onAdd={() => navigate("/dashboard/settings/organization?tab=lifecycles")} />
                        {!collapsedSections["lifecycle"] && (
                            <div style={{ padding: "2px 6px 4px", animation: "cnFade .15s ease-out" }}>
                                {lifecycles.length === 0 ? (
                                    <p style={{ fontSize: 10.5, color: "#b0b7c3", padding: "3px 8px", margin: 0 }}>لا توجد مراحل</p>
                                ) : lifecycles.map((lc) => {
                                    const key = `lc_${lc.code}`
                                    return (
                                        <NavItem key={key} active={isActive(key)} collapsed={false} onClick={() => setActiveSection(key as ContactsSection)}>
                                            <span style={{ fontSize: 13, lineHeight: 1, flexShrink: 0 }}>{lc.icon || "📌"}</span>
                                            <span style={{ flex: 1 }}>{lc.name}</span>
                                            <CountBadge count={lc.count} active={isActive(key)} />
                                        </NavItem>
                                    )
                                })}
                            </div>
                        )}

                        {/* ── Teams ── */}
                        <SectionHeader label="صندوق الفريق" icon={<UsersRound size={10} />}
                            collapsed={!!collapsedSections["team"]}
                            onToggle={() => toggleCollapsedSection("team")}
                            onAdd={() => navigate("/dashboard/settings/organization?tab=teams")} />
                        {!collapsedSections["team"] && (
                            <div style={{ padding: "2px 6px 4px", animation: "cnFade .15s ease-out" }}>
                                {teams.length === 0 ? (
                                    <p style={{ fontSize: 10.5, color: "#b0b7c3", padding: "3px 8px", margin: 0 }}>لا توجد فرق</p>
                                ) : teams.map((team) => {
                                    const key = `team_${team.team_id}`
                                    return (
                                        <NavItem key={key} active={isActive(key)} collapsed={false} onClick={() => setActiveSection(key as ContactsSection)}>
                                            <span className="cn-dot" style={{ background: team.color ?? "var(--t-border-medium)" }} />
                                            <span style={{ flex: 1 }}>{team.name}</span>
                                            <CountBadge count={team.customers_count} active={isActive(key)} />
                                        </NavItem>
                                    )
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* Collapsed mode icons */}
                {collapsed && (
                    <div style={{ padding: "4px", borderTop: "1px solid #f0f1f3", marginTop: 4 }}>
                        {lifecycles.map((lc) => {
                            const key = `lc_${lc.code}`
                            return (
                                <NavItem key={key} active={isActive(key)} collapsed={true} onClick={() => setActiveSection(key as ContactsSection)} title={lc.name}>
                                    <span style={{ fontSize: 14, lineHeight: 1 }}>{lc.icon || "📌"}</span>
                                </NavItem>
                            )
                        })}
                        {teams.map((team) => {
                            const key = `team_${team.team_id}`
                            return (
                                <NavItem key={key} active={isActive(key)} collapsed={true} onClick={() => setActiveSection(key as ContactsSection)} title={team.name}>
                                    <span className="cn-dot" style={{ background: team.color ?? "var(--t-border-medium)", width: 9, height: 9 }} />
                                </NavItem>
                            )
                        })}
                    </div>
                )}
            </div>
        </aside>
    )
}

/* ── Helpers ── */
function NavItem({ children, active, collapsed, onClick, title }: {
    children: React.ReactNode; active: boolean; collapsed: boolean;
    onClick: () => void; title?: string
}) {
    return (
        <div className={`cn-nav ${active ? "active" : ""}`} onClick={onClick} title={title}
            style={{
                padding: collapsed ? "7px 0" : "6px 10px",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: collapsed ? 0 : 8,
            }}
            onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--t-surface)" }}
            onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent" }}>
            {children}
        </div>
    )
}

function CountBadge({ count, active }: { count: number; active: boolean }) {
    return (
        <span className="cn-count" style={{
            background: active ? "rgba(255,255,255,.2)" : "var(--t-surface)",
            color: active ? "#fff" : "var(--t-text-faint)",
        }}>{count}</span>
    )
}

function SectionHeader({ label, icon, collapsed, onToggle, onAdd }: {
    label: string; icon?: React.ReactNode; collapsed: boolean; onToggle: () => void; onAdd?: () => void
}) {
    return (
        <div className="cn-sec-hdr">
            <button className="cn-sec-btn" onClick={onToggle}>
                {collapsed ? <ChevronRight size={9} /> : <ChevronDown size={9} />}
                {icon}
                {label}
            </button>
            {onAdd && (
                <button className="cn-sec-add" onClick={onAdd} title="إضافة"><Plus size={11} /></button>
            )}
        </div>
    )
}
