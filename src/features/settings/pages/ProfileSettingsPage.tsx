import { useState } from "react"
import {
    User, ChevronLeft, KeyRound, Bell, Shield,
} from "lucide-react"
import { Link } from "react-router-dom"
import { ProfileTab } from "../components/ProfileTab"

/* ── sidebar items ── */
const SIDEBAR_ITEMS = [
    { key: "profile", label: "البيانات الشخصية", icon: User, desc: "إدارة معلوماتك الأساسية وصورتك الشخصية" },
    { key: "security", label: "الأمان وكلمة المرور", icon: KeyRound, desc: "تغيير كلمة المرور وإعدادات الأمان" },
    { key: "notifications", label: "الإشعارات", icon: Bell, desc: "إدارة تفضيلات الإشعارات" },
] as const

type SidebarKey = (typeof SIDEBAR_ITEMS)[number]["key"]

/* ── placeholder ── */
function ComingSoon({ title, desc }: { title: string; desc: string }) {
    return (
        <div style={{
            background: "var(--t-card)", borderRadius: 12, border: "1px solid var(--t-border)",
            padding: "56px 24px", textAlign: "center",
        }}>
            <div style={{
                width: 48, height: 48, borderRadius: 12, background: "var(--t-surface)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                marginBottom: 14,
            }}>
                <Shield size={22} style={{ color: "var(--t-text-faint)" }} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--t-text)", margin: "0 0 4px" }}>{title}</h3>
            <p style={{ fontSize: 13, color: "var(--t-text-faint)", margin: 0, maxWidth: 320, marginInline: "auto" }}>{desc}</p>
            <div style={{
                marginTop: 16, display: "inline-block",
                padding: "6px 20px", borderRadius: 8, border: "1px solid var(--t-border)",
                fontSize: 12, fontWeight: 600, color: "var(--t-text-muted)",
            }}>
                قريباً
            </div>
        </div>
    )
}

export function ProfileSettingsPage() {
    const [active, setActive] = useState<SidebarKey>("profile")
    const [collapsed, setCollapsed] = useState(false)

    const activeItem = SIDEBAR_ITEMS.find(i => i.key === active)

    return (
        <div style={{ display: "flex", height: "100%" }}>

            {/* ── Internal Sidebar ── */}
            <aside style={{
                width: collapsed ? 56 : 220,
                flexShrink: 0,
                background: "var(--t-card)",
                borderLeft: "1px solid var(--t-border)",
                transition: "width 0.2s ease",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
            }}>
                {/* header */}
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: collapsed ? "14px 8px" : "14px 12px",
                    borderBottom: "1px solid var(--t-border-light)",
                    minHeight: 56,
                }}>
                    {!collapsed && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{
                                width: 30, height: 30, borderRadius: 8,
                                background: "var(--t-accent)", display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <User size={14} style={{ color: "var(--t-text-on-accent)" }} />
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text)", lineHeight: 1.2 }}>الإعدادات الشخصية</div>
                                <div style={{ fontSize: 10, color: "var(--t-text-faint)" }}>حسابك الشخصي</div>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            width: 26, height: 26, borderRadius: 6, border: "none",
                            background: "transparent", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "var(--t-text-faint)", transition: "background 0.12s",
                            margin: collapsed ? "0 auto" : undefined,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--t-surface)" }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                    >
                        <ChevronLeft size={14} style={{
                            transition: "transform 0.2s",
                            transform: collapsed ? "rotate(180deg)" : "none",
                        }} />
                    </button>
                </div>

                {/* nav items */}
                <nav style={{ flex: 1, padding: "6px 5px", display: "flex", flexDirection: "column", gap: 1, overflowY: "auto" }}>
                    {SIDEBAR_ITEMS.map(item => {
                        const Icon = item.icon
                        const on = active === item.key
                        return (
                            <button
                                key={item.key}
                                onClick={() => setActive(item.key)}
                                title={collapsed ? item.label : undefined}
                                style={{
                                    display: "flex", alignItems: "center",
                                    gap: 8,
                                    padding: collapsed ? "9px 0" : "9px 10px",
                                    borderRadius: 7, border: "none",
                                    background: on ? "var(--t-accent)" : "transparent",
                                    color: on ? "var(--t-text-on-accent)" : "var(--t-text-muted)",
                                    fontSize: 13, fontWeight: on ? 600 : 500,
                                    cursor: "pointer", transition: "all 0.1s",
                                    textAlign: "right", width: "100%",
                                    justifyContent: collapsed ? "center" : "flex-start",
                                }}
                                onMouseEnter={e => { if (!on) e.currentTarget.style.background = "var(--t-card-hover)" }}
                                onMouseLeave={e => { if (!on) e.currentTarget.style.background = "transparent" }}
                            >
                                <Icon size={15} strokeWidth={on ? 2 : 1.5} style={{ flexShrink: 0 }} />
                                {!collapsed && <span>{item.label}</span>}
                            </button>
                        )
                    })}
                </nav>

                {/* back link */}
                {!collapsed && (
                    <div style={{ padding: "10px 8px", borderTop: "1px solid var(--t-border-light)" }}>
                        <Link
                            to="/dashboard"
                            style={{
                                display: "flex", alignItems: "center", gap: 6,
                                fontSize: 12, color: "var(--t-text-faint)", textDecoration: "none",
                                padding: "7px 8px", borderRadius: 7,
                                transition: "background 0.1s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "var(--t-surface)" }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                        >
                            <ChevronLeft size={12} style={{ transform: "rotate(180deg)" }} />
                            العودة للوحة التحكم
                        </Link>
                    </div>
                )}
            </aside>

            {/* ── Main Content ── */}
            <main style={{ flex: 1, minWidth: 0, overflowY: "auto", padding: "20px 24px" }}>

                {/* breadcrumb */}
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--t-text-faint)", marginBottom: 4 }}>
                    <Link to="/dashboard" style={{ color: "var(--t-text-faint)", textDecoration: "none" }}>لوحة التحكم</Link>
                    <ChevronLeft size={11} style={{ color: "var(--t-text-faint)" }} />
                    <span>الإعدادات الشخصية</span>
                    <ChevronLeft size={11} style={{ color: "var(--t-text-faint)" }} />
                    <span style={{ color: "var(--t-text-secondary)", fontWeight: 500 }}>{activeItem?.label}</span>
                </div>

                {/* page title */}
                <h1 style={{
                    fontSize: 20, fontWeight: 700, color: "var(--t-text)",
                    margin: "0 0 2px", letterSpacing: "-0.01em",
                }}>
                    {activeItem?.label}
                </h1>
                <p style={{ fontSize: 13, color: "var(--t-text-faint)", margin: "0 0 20px" }}>
                    {activeItem?.desc}
                </p>

                {/* content */}
                <div key={active} style={{ animation: "profileFade .18s ease-out" }}>
                    {active === "profile" && <ProfileTab />}
                    {active === "security" && (
                        <ComingSoon
                            title="الأمان وكلمة المرور"
                            desc="تغيير كلمة المرور، تفعيل المصادقة الثنائية، وإدارة جلسات تسجيل الدخول."
                        />
                    )}
                    {active === "notifications" && (
                        <ComingSoon
                            title="تفضيلات الإشعارات"
                            desc="التحكم في أنواع الإشعارات التي تصلك عبر البريد والتطبيق."
                        />
                    )}
                </div>
            </main>

            <style>{`@keyframes profileFade{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    )
}
