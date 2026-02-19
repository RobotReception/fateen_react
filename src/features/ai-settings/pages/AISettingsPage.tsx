import { useState } from "react"
import { Brain, FileText, Volume2, ChevronLeft } from "lucide-react"
import { Link } from "react-router-dom"
import { AITab } from "../components/AITab"
import { PromptsTab } from "../components/PromptsTab"
import { TTSTab } from "../components/TTSTab"

/* ── sidebar items (3 tabs) ── */
const SIDEBAR_ITEMS = [
    { key: "ai", label: "الذكاء الاصطناعي", icon: Brain, desc: "الإعدادات الرئيسية والمزودين والميزات" },
    { key: "prompts", label: "الـ Prompts", icon: FileText, desc: "التوجيه العام للنظام" },
    { key: "tts", label: "TTS", icon: Volume2, desc: "تحويل النص إلى كلام" },
] as const

type SidebarKey = (typeof SIDEBAR_ITEMS)[number]["key"]

export function AISettingsPage() {
    const [active, setActive] = useState<SidebarKey>("ai")
    const [collapsed, setCollapsed] = useState(false)

    const activeItem = SIDEBAR_ITEMS.find(i => i.key === active)

    return (
        <div style={{ display: "flex", height: "100%" }}>

            {/* ── Internal Sidebar ── */}
            <aside style={{
                width: collapsed ? 56 : 240,
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
                                <Brain size={14} style={{ color: "var(--t-text-on-accent)" }} />
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text)", lineHeight: 1.2 }}>إعدادات AI</div>
                                <div style={{ fontSize: 10, color: "var(--t-text-faint)" }}>ذكاء اصطناعي</div>
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
                                    background: on ? "var(--t-surface)" : "transparent",
                                    color: on ? "var(--t-text)" : "var(--t-text-muted)",
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
                    <span>إعدادات AI</span>
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
                <div key={active} style={{ animation: "aiFade .18s ease-out", maxWidth: 860 }}>
                    {active === "ai" && <AITab />}
                    {active === "prompts" && <PromptsTab />}
                    {active === "tts" && <TTSTab />}
                </div>
            </main>

            <style>{`@keyframes aiFade{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    )
}
