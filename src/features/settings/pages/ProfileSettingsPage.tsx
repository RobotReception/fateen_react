import { useState } from "react"
import {
    User, ChevronLeft, KeyRound, Bell, Settings,
} from "lucide-react"
import { Link } from "react-router-dom"
import { ProfileTab } from "../components/ProfileTab"
import { SecurityTab } from "../components/SecurityTab"
import { NotificationsTab } from "../components/NotificationsTab"

/* ── sidebar items ── */
const SIDEBAR_ITEMS = [
    { key: "profile", label: "البيانات الشخصية", icon: User, desc: "إدارة معلوماتك الأساسية وصورتك الشخصية" },
    { key: "security", label: "الأمان وكلمة المرور", icon: KeyRound, desc: "تغيير كلمة المرور وإعدادات الأمان" },
    { key: "notifications", label: "الإشعارات", icon: Bell, desc: "إدارة تفضيلات الإشعارات" },
] as const

type SidebarKey = (typeof SIDEBAR_ITEMS)[number]["key"]


export function ProfileSettingsPage() {
    const [active, setActive] = useState<SidebarKey>("profile")
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)


    return (
        <div className="flex h-full" dir="rtl">

            {/* ── Internal Sidebar (matches KB sidebar) ── */}
            <aside
                className={`shrink-0 bg-white transition-all duration-300 ${sidebarCollapsed ? "w-[60px]" : "w-52"}`}
                style={{
                    borderLeft: "1px solid var(--t-border-light, #f0f0f0)",
                    borderRadius: "6px 6px 6px 6px",
                    margin: "8px 0 8px 0",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* ── Gradient Header ── */}
                <div
                    onClick={() => { if (sidebarCollapsed) setSidebarCollapsed(false) }}
                    style={{
                        background: "linear-gradient(135deg, var(--t-accent), var(--t-accent-secondary), var(--t-accent-light))",
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
                        <Settings size={sidebarCollapsed ? 18 : 14} style={{ color: "rgba(255,255,255,0.85)" }} />
                        {!sidebarCollapsed && (
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: "#fff" }}>الإعدادات الشخصية</span>
                        )}
                    </div>
                    {!sidebarCollapsed && (
                        <button
                            onClick={() => setSidebarCollapsed(true)}
                            style={{
                                background: "rgba(255,255,255,0.12)",
                                border: "none", borderRadius: 5,
                                padding: 3, cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "background 0.15s",
                                position: "relative", zIndex: 1,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.22)" }}
                            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)" }}
                        >
                            <ChevronLeft size={13} style={{ color: "rgba(255,255,255,0.8)" }} />
                        </button>
                    )}
                </div>

                {/* ── Sidebar Navigation ── */}
                <nav style={{ padding: "6px 6px", flex: 1 }}>
                    {SIDEBAR_ITEMS.map(item => {
                        const Icon = item.icon
                        const isActive = active === item.key
                        return (
                            <button
                                key={item.key}
                                onClick={() => setActive(item.key)}
                                title={sidebarCollapsed ? item.label : undefined}
                                style={{
                                    display: "flex", width: "100%",
                                    alignItems: "center", gap: 10,
                                    padding: sidebarCollapsed ? "9px 0" : "7px 8px",
                                    marginBottom: 2, borderRadius: 8, border: "none",
                                    background: isActive ? "var(--t-card-hover, var(--t-surface))" : "transparent",
                                    cursor: "pointer",
                                    justifyContent: sidebarCollapsed ? "center" : "flex-start",
                                    position: "relative", textAlign: "right",
                                    transition: "background 0.12s", color: "inherit",
                                }}
                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--t-card-hover, var(--t-page))" }}
                                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? "var(--t-card-hover, var(--t-surface))" : "transparent" }}
                            >
                                {/* Active indicator bar */}
                                {isActive && !sidebarCollapsed && (
                                    <div style={{
                                        position: "absolute", right: 0,
                                        top: "50%", transform: "translateY(-50%)",
                                        width: 3, height: 18, borderRadius: 3,
                                        background: "var(--t-brand-orange)",
                                    }} />
                                )}
                                <div style={{
                                    width: sidebarCollapsed ? 28 : 26,
                                    height: sidebarCollapsed ? 28 : 26,
                                    borderRadius: 7,
                                    background: isActive ? "rgba(27,80,145,0.1)" : "var(--t-surface, var(--t-surface))",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0, transition: "all 0.15s",
                                }}>
                                    <Icon
                                        size={sidebarCollapsed ? 15 : 13}
                                        strokeWidth={isActive ? 2.2 : 1.6}
                                        style={{
                                            color: isActive ? "var(--t-accent)" : "var(--t-text-muted, var(--t-text-faint))",
                                            transition: "color 0.15s",
                                        }}
                                    />
                                </div>
                                {!sidebarCollapsed && (
                                    <span style={{
                                        fontSize: 12.5, fontWeight: isActive ? 600 : 500,
                                        color: isActive ? "var(--t-text, #1f2937)" : "var(--t-text-secondary, var(--t-text-muted))",
                                        transition: "color 0.15s",
                                    }}>{item.label}</span>
                                )}
                            </button>
                        )
                    })}
                </nav>

                {/* ── Footer: back link ── */}
                <div style={{ padding: "6px 6px", borderTop: "1px solid var(--t-border-light, #f0f0f0)" }}>
                    <Link to="/dashboard" style={{
                        display: "flex", alignItems: "center", gap: 6,
                        justifyContent: sidebarCollapsed ? "center" : "flex-start",
                        fontSize: 11, color: "var(--t-text-faint, var(--t-text-faint))", textDecoration: "none",
                        padding: "7px 8px", borderRadius: 7,
                        transition: "background 0.1s",
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--t-card-hover, var(--t-page))" }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                    >
                        <ChevronLeft size={12} style={{ transform: "rotate(180deg)" }} />
                        {!sidebarCollapsed && "العودة للوحة التحكم"}
                    </Link>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                    <div key={active} style={{ animation: "profileFade .18s ease-out" }}>
                        {active === "profile" && <ProfileTab />}
                        {active === "security" && <SecurityTab />}
                        {active === "notifications" && <NotificationsTab />}
                    </div>
                </div>
            </div>

            <style>{`@keyframes profileFade{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    )
}
