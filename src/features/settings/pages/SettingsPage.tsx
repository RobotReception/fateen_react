import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { Building2, User, ChevronLeft, Settings } from "lucide-react"
import { OrganizationTab } from "../components/OrganizationTab"
import { ProfileTab } from "../components/ProfileTab"

const SIDEBAR = [
    { key: "organization", label: "المؤسسة", desc: "إعدادات المؤسسة والقنوات", icon: Building2 },
    { key: "profile", label: "الملف الشخصي", desc: "معلومات الحساب والأمان", icon: User },
] as const

type SidebarKey = (typeof SIDEBAR)[number]["key"]

export function SettingsPage() {
    const [searchParams] = useSearchParams()
    const tabParam = searchParams.get("tab") as SidebarKey | null
    const [active, setActive] = useState<SidebarKey>(tabParam === "profile" ? "profile" : "organization")
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

    useEffect(() => {
        if (tabParam === "profile" || tabParam === "organization") {
            setActive(tabParam)
        }
    }, [tabParam])

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
                        <Settings size={sidebarCollapsed ? 18 : 14} style={{ color: "rgba(255,255,255,0.85)" }} />
                        {!sidebarCollapsed && (
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: "#fff" }}>الإعدادات</span>
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
                    {SIDEBAR.map(item => {
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
                                    background: isActive ? "var(--t-card-hover, #f3f4f6)" : "transparent",
                                    cursor: "pointer",
                                    justifyContent: sidebarCollapsed ? "center" : "flex-start",
                                    position: "relative", textAlign: "right",
                                    transition: "background 0.12s", color: "inherit",
                                }}
                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--t-card-hover, #f9fafb)" }}
                                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? "var(--t-card-hover, #f3f4f6)" : "transparent" }}
                            >
                                {/* Active indicator bar */}
                                {isActive && !sidebarCollapsed && (
                                    <div style={{
                                        position: "absolute", right: 0,
                                        top: "50%", transform: "translateY(-50%)",
                                        width: 3, height: 18, borderRadius: 3,
                                        background: "#004786",
                                    }} />
                                )}
                                <div style={{
                                    width: sidebarCollapsed ? 28 : 26,
                                    height: sidebarCollapsed ? 28 : 26,
                                    borderRadius: 7,
                                    background: isActive ? "rgba(0,71,134,0.1)" : "var(--t-surface, #f3f4f6)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0, transition: "all 0.15s",
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
                                        fontSize: 12.5, fontWeight: isActive ? 600 : 500,
                                        color: isActive ? "var(--t-text, #1f2937)" : "var(--t-text-secondary, #6b7280)",
                                        transition: "color 0.15s",
                                    }}>{item.label}</span>
                                )}
                            </button>
                        )
                    })}
                </nav>
            </aside>

            {/* ── Main Content ── */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                    <div key={active} style={{ animation: "sFade .2s ease-out" }}>
                        {active === "organization" && <OrganizationTab />}
                        {active === "profile" && <ProfileTab />}
                    </div>
                </div>
            </div>

            <style>{`@keyframes sFade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    )
}
