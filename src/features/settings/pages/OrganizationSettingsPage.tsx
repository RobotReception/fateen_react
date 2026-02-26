import { useState, useEffect } from "react"
import {
    Building2, Users, MessageSquare, CreditCard,
    Settings, ChevronLeft, Shield, Brain, Palette,
    UsersRound, Tag, FileText, RefreshCw, FileSliders,
} from "lucide-react"
import { Link, useSearchParams } from "react-router-dom"
import { OrganizationTab } from "../components/OrganizationTab"
import { BillingTab } from "../components/BillingTab"
import { UsersPage } from "@/features/users/pages/UsersPage"
import { RolesPage } from "@/features/roles/pages/RolesPage"
import { AISettingsTab } from "@/features/ai-settings/components/AISettingsTab"
import { ThemeTab } from "../components/ThemeTab"
import { ChannelsPage } from "@/features/channels/pages/ChannelsPage"
import { TeamsTab } from "../components/TeamsTab"
import { TagsTab } from "../components/TagsTab"
import { SnippetsTab } from "../components/SnippetsTab"
import { LifecyclesTab } from "../components/LifecyclesTab"
import { ContactFieldsTab } from "../components/ContactFieldsTab"

/* ── sidebar items ── */
const SIDEBAR_ITEMS = [
    { key: "general", label: "الإعدادات العامة", icon: Settings, desc: "إدارة وتحديث بيانات المؤسسة الأساسية" },
    { key: "users", label: "إدارة المستخدمين", icon: Users, desc: "إضافة وإدارة مستخدمي المؤسسة وصلاحياتهم" },
    { key: "roles", label: "الأدوار والصلاحيات", icon: Shield, desc: "إنشاء الأدوار وإدارة الصلاحيات وتعيين المستخدمين" },
    { key: "channels", label: "القنوات", icon: MessageSquare, desc: "إعداد وإدارة قنوات التواصل المختلفة" },
    { key: "teams", label: "الفرق", icon: UsersRound, desc: "إدارة فرق العمل وتوزيع الأعضاء" },
    { key: "tags", label: "التاجات", icon: Tag, desc: "إنشاء وإدارة تاجات تصنيف العملاء والمحادثات" },
    { key: "snippets", label: "Snippets", icon: FileText, desc: "جمل وردود جاهزة للاستخدام السريع في المحادثات" },
    { key: "lifecycles", label: "دورات الحياة", icon: RefreshCw, desc: "تحديد مراحل دورة حياة العميل من من تحويل لعملية" },
    { key: "contact-fields", label: "حقول جهات الاتصال", icon: FileSliders, desc: "إنشاء وإدارة الحقول الديناميكية لجهات الاتصال" },
    { key: "ai", label: "الذكاء الاصطناعي", icon: Brain, desc: "إعدادات الذكاء الاصطناعي والتوجيه وتحويل النص لكلام" },
    { key: "theme", label: "تخصيص المظهر", icon: Palette, desc: "تغيير ألوان الواجهة لتتناسب مع هوية مؤسستك" },
    { key: "billing", label: "الاشتراك والدفع", icon: CreditCard, desc: "إدارة خطتك الحالية وعرض الفواتير" },
] as const

type SidebarKey = (typeof SIDEBAR_ITEMS)[number]["key"]


export function OrganizationSettingsPage() {
    const [searchParams] = useSearchParams()
    const tabParam = searchParams.get("tab") as SidebarKey | null
    const [active, setActive] = useState<SidebarKey>(tabParam && SIDEBAR_ITEMS.some(i => i.key === tabParam) ? tabParam : "general")
    const [collapsed, setCollapsed] = useState(false)

    // Sync with URL tab param when it changes (e.g. navigating from another page)
    useEffect(() => {
        if (tabParam && SIDEBAR_ITEMS.some(i => i.key === tabParam)) {
            setActive(tabParam)
        }
    }, [tabParam])

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
                                <Building2 size={14} style={{ color: "var(--t-text-on-accent)" }} />
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text)", lineHeight: 1.2 }}>إعدادات المؤسسة</div>
                                <div style={{ fontSize: 10, color: "var(--t-text-faint)" }}>إدارة كاملة</div>
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
                    <span>إعدادات المؤسسة</span>
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
                <div key={active} style={{ animation: "orgFade .18s ease-out" }}>
                    {active === "general" && <OrganizationTab />}
                    {active === "users" && <UsersPage embedded />}
                    {active === "roles" && <RolesPage embedded />}
                    {active === "channels" && <ChannelsPage />}
                    {active === "teams" && <TeamsTab />}
                    {active === "tags" && <TagsTab />}
                    {active === "snippets" && <SnippetsTab />}
                    {active === "lifecycles" && <LifecyclesTab />}
                    {active === "contact-fields" && <ContactFieldsTab />}
                    {active === "ai" && <AISettingsTab />}
                    {active === "theme" && <ThemeTab />}
                    {active === "billing" && <BillingTab />}
                </div>
            </main>

            <style>{`@keyframes orgFade{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    )
}
