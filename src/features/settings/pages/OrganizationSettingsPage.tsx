import { useState, useEffect, useMemo } from "react"
import {
    Building2, Users, MessageSquare, CreditCard,
    Settings, ChevronLeft, Shield, Brain,
    UsersRound, Tag, FileText, RefreshCw, FileSliders, FileSearch,
} from "lucide-react"
import { Link, useSearchParams } from "react-router-dom"
import { OrganizationTab } from "../components/OrganizationTab"
import { BillingTab } from "../components/BillingTab"
import { UsersPage } from "@/features/users/pages/UsersPage"
import { RolesPage } from "@/features/roles/pages/RolesPage"
import { AISettingsTab } from "@/features/ai-settings/components/AISettingsTab"

import { ChannelsPage } from "@/features/channels/pages/ChannelsPage"
import { TeamsTab } from "../components/TeamsTab"
import { TagsTab } from "../components/TagsTab"
import { SnippetsTab } from "../components/SnippetsTab"
import { LifecyclesTab } from "../components/LifecyclesTab"
import { ContactFieldsTab } from "../components/ContactFieldsTab"
import { AuditLogsTab } from "../components/AuditLogsTab"
import { usePermissions } from "@/lib/usePermissions"
import { PAGE_BITS } from "@/lib/permissions"
import { usePermissionsRefresh } from "@/lib/usePermissionsSync"

/* ── sidebar sections ── */
type SidebarKey = "general" | "users" | "roles" | "channels" | "teams" | "tags" | "snippets" | "lifecycles" | "contact-fields" | "ai" | "billing" | "audit-logs"

/* ── map each tab to its PAGE_BIT (undefined = always visible) ── */
const TAB_PAGE_BITS: Partial<Record<SidebarKey, number>> = {
    general: PAGE_BITS.ORGANIZATION,
    users: PAGE_BITS.ADMIN_USERS,
    roles: PAGE_BITS.ROLES,
    channels: PAGE_BITS.CHANNELS,
    teams: PAGE_BITS.TEAMS,
    tags: PAGE_BITS.TAGS,
    snippets: PAGE_BITS.SNIPPETS,
    lifecycles: PAGE_BITS.LIFECYCLES,
    "contact-fields": PAGE_BITS.CONTACT_FIELDS,
    ai: PAGE_BITS.AGENTS,
    // theme & billing: no dedicated PAGE_BIT → always visible
}

interface SidebarItem { key: SidebarKey; label: string; icon: typeof Settings; desc: string }
interface SidebarSection { title: string; items: SidebarItem[] }

const SIDEBAR_SECTIONS: SidebarSection[] = [
    {
        title: "عام",
        items: [
            { key: "general", label: "الإعدادات العامة", icon: Settings, desc: "إدارة بيانات المؤسسة الأساسية" },
        ],
    },
    {
        title: "المستخدمين والصلاحيات",
        items: [
            { key: "users", label: "إدارة المستخدمين", icon: Users, desc: "إضافة وإدارة المستخدمين" },
            { key: "roles", label: "الأدوار والصلاحيات", icon: Shield, desc: "إنشاء الأدوار وإدارة الصلاحيات" },
            { key: "teams", label: "الفرق", icon: UsersRound, desc: "إدارة فرق العمل" },
        ],
    },
    {
        title: "التطبيقات",
        items: [
            { key: "channels", label: "القنوات", icon: MessageSquare, desc: "إعداد قنوات التواصل" },
            { key: "ai", label: "الذكاء الاصطناعي", icon: Brain, desc: "إعدادات AI والتوجيه" },
        ],
    },
    {
        title: "إعدادات صندوق الوارد",
        items: [
            { key: "contact-fields", label: "حقول جهات الاتصال", icon: FileSliders, desc: "حقول ديناميكية لجهات الاتصال" },
            { key: "lifecycles", label: "دورات الحياة", icon: RefreshCw, desc: "مراحل دورة حياة العميل" },
            { key: "snippets", label: "Snippets", icon: FileText, desc: "ردود جاهزة للاستخدام السريع" },
            { key: "tags", label: "التاجات", icon: Tag, desc: "تصنيف العملاء والمحادثات" },
        ],
    },
    {
        title: "النظام والفوترة",
        items: [
            { key: "audit-logs", label: "سجلات التدقيق", icon: FileSearch, desc: "عرض جميع العمليات والطلبات على النظام" },
            { key: "billing", label: "الاشتراك والدفع", icon: CreditCard, desc: "إدارة الخطة والفواتير" },
        ],
    },
]




export function OrganizationSettingsPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const tabParam = searchParams.get("tab") as SidebarKey | null
    const { canAccessPage, hasPermissionData } = usePermissions()
    usePermissionsRefresh()  // تحديث فوري عند فتح الإعدادات

    /* ── فحص الصلاحية لتاب واحد ── */
    const canRenderTab = (key: SidebarKey): boolean => {
        if (!hasPermissionData) return true   // owner → كل شيء مسموح
        if (key === "audit-logs") return false // سجلات التدقيق للسوبر أدمن فقط
        const bit = TAB_PAGE_BITS[key]
        return bit === undefined || canAccessPage(bit)
    }

    /* ── filter sections & items by permission ── */
    const filteredSections = useMemo(() => {
        if (!hasPermissionData) return SIDEBAR_SECTIONS          // owner: show all
        return SIDEBAR_SECTIONS
            .map(s => ({
                ...s,
                items: s.items.filter(i => canRenderTab(i.key)),
            }))
            .filter(s => s.items.length > 0)                       // hide empty sections
    }, [hasPermissionData, canAccessPage])

    const SIDEBAR_ITEMS = filteredSections.flatMap(s => s.items)

    const defaultTab = tabParam && SIDEBAR_ITEMS.some(i => i.key === tabParam) ? tabParam
        : SIDEBAR_ITEMS.length > 0 ? SIDEBAR_ITEMS[0].key : "general"

    const [active, setActive] = useState<SidebarKey>(defaultTab)
    const [collapsed, setCollapsed] = useState(false)

    /* ── إذا التاب النشط غير مسموح (تغيّرت الصلاحيات أو URL param) → ارجع لأول تاب متاح ── */
    useEffect(() => {
        if (tabParam && SIDEBAR_ITEMS.some(i => i.key === tabParam)) {
            setActive(tabParam)
            // مسح ?tab= من URL بعد تطبيقه لمنع تعارضه مع التنقل اليدوي
            setSearchParams({}, { replace: true })
        } else if (!SIDEBAR_ITEMS.some(i => i.key === active)) {
            // التاب الحالي لم يعد متاحاً → انتقل لأول تاب مسموح
            if (SIDEBAR_ITEMS.length > 0) setActive(SIDEBAR_ITEMS[0].key)
        }
    }, [tabParam, SIDEBAR_ITEMS])

    const activeItem = SIDEBAR_ITEMS.find(i => i.key === active)

    return (
        <div className="flex h-full" dir="rtl">

            {/* ── Internal Sidebar (DarAI brand pattern) ── */}
            <aside
                className={`shrink-0 bg-white transition-all duration-300 ${collapsed ? "w-[60px]" : "w-56"}`}
                style={{
                    borderLeft: "1px solid var(--t-border-light, #f0f0f0)",
                    borderRadius: "6px",
                    margin: "8px 0",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* ── Gradient Header ── */}
                <div
                    onClick={() => { if (collapsed) setCollapsed(false) }}
                    style={{
                        background: "linear-gradient(135deg, var(--t-accent), var(--t-accent-secondary), var(--t-accent-light))",
                        padding: collapsed ? "12px 0" : "12px 14px",
                        position: "relative",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: collapsed ? "center" : "space-between",
                        cursor: collapsed ? "pointer" : "default",
                    }}>
                    <div style={{
                        position: "absolute", top: -15, left: -15,
                        width: 60, height: 60, borderRadius: "50%",
                        background: "rgba(255,255,255,0.06)",
                    }} />
                    <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 7 }}>
                        <Building2 size={collapsed ? 18 : 14} style={{ color: "rgba(255,255,255,0.85)" }} />
                        {!collapsed && (
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: "#fff" }}>إعدادات المؤسسة</span>
                        )}
                    </div>
                    {!collapsed && (
                        <button
                            onClick={() => setCollapsed(true)}
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
                <nav style={{ padding: "4px 6px", flex: 1, overflowY: "auto" }}>
                    {filteredSections.map((section, si) => (
                        <div key={si}>
                            {/* Section header */}
                            {!collapsed && (
                                <div style={{
                                    fontSize: 10, fontWeight: 600, color: "var(--t-text-faint, var(--t-text-faint))",
                                    padding: si === 0 ? "8px 8px 4px" : "12px 8px 4px",
                                    letterSpacing: "0.02em",
                                }}>{section.title}</div>
                            )}
                            {collapsed && si > 0 && (
                                <div style={{
                                    height: 1, background: "var(--t-border-light, #eaedf0)",
                                    margin: "6px 8px",
                                }} />
                            )}
                            {section.items.map(item => {
                                const Icon = item.icon
                                const isActive = active === item.key
                                return (
                                    <button
                                        key={item.key}
                                        onClick={() => setActive(item.key)}
                                        title={collapsed ? item.label : undefined}
                                        style={{
                                            display: "flex", width: "100%",
                                            alignItems: "center", gap: 10,
                                            padding: collapsed ? "8px 0" : "6px 8px",
                                            marginBottom: 1, borderRadius: 8, border: "none",
                                            background: isActive ? "var(--t-card-hover, var(--t-surface))" : "transparent",
                                            cursor: "pointer",
                                            justifyContent: collapsed ? "center" : "flex-start",
                                            position: "relative", textAlign: "right",
                                            transition: "background 0.12s", color: "inherit",
                                        }}
                                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--t-card-hover, var(--t-page))" }}
                                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? "var(--t-card-hover, var(--t-surface))" : "transparent" }}
                                    >
                                        {isActive && !collapsed && (
                                            <div style={{
                                                position: "absolute", right: 0,
                                                top: "50%", transform: "translateY(-50%)",
                                                width: 3, height: 16, borderRadius: 3,
                                                background: "var(--t-brand-orange)",
                                            }} />
                                        )}
                                        <div style={{
                                            width: collapsed ? 28 : 24,
                                            height: collapsed ? 28 : 24,
                                            borderRadius: 6,
                                            background: isActive ? "rgba(27,80,145,0.1)" : "transparent",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            flexShrink: 0, transition: "all 0.15s",
                                        }}>
                                            <Icon
                                                size={collapsed ? 15 : 14}
                                                strokeWidth={isActive ? 2.2 : 1.6}
                                                style={{
                                                    color: isActive ? "var(--t-accent)" : "var(--t-text-muted, var(--t-text-faint))",
                                                    transition: "color 0.15s",
                                                }}
                                            />
                                        </div>
                                        {!collapsed && (
                                            <span style={{
                                                fontSize: 12.5, fontWeight: isActive ? 600 : 500,
                                                color: isActive ? "var(--t-text, #1f2937)" : "var(--t-text-secondary, var(--t-text-muted))",
                                                transition: "color 0.15s",
                                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                            }}>{item.label}</span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    ))}
                </nav>

                {/* ── Footer: back link ── */}
                <div style={{ padding: "6px 6px", borderTop: "1px solid var(--t-border-light, #f0f0f0)" }}>
                    <Link to="/dashboard" style={{
                        display: "flex", alignItems: "center", gap: 6,
                        justifyContent: collapsed ? "center" : "flex-start",
                        fontSize: 11, color: "var(--t-text-faint, var(--t-text-faint))", textDecoration: "none",
                        padding: "7px 8px", borderRadius: 7,
                        transition: "background 0.1s",
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--t-card-hover, var(--t-page))" }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                    >
                        <ChevronLeft size={12} style={{ transform: "rotate(180deg)" }} />
                        {!collapsed && "العودة للوحة التحكم"}
                    </Link>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <main style={{ flex: 1, minWidth: 0, overflowY: "auto", padding: "20px 24px" }}>

                {/* breadcrumb */}
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--t-text-faint, var(--t-text-faint))", marginBottom: 4 }}>
                    <Link to="/dashboard" style={{ color: "var(--t-text-faint, var(--t-text-faint))", textDecoration: "none" }}>لوحة التحكم</Link>
                    <ChevronLeft size={11} style={{ color: "var(--t-text-faint, var(--t-text-faint))" }} />
                    <span>إعدادات المؤسسة</span>
                    <ChevronLeft size={11} style={{ color: "var(--t-text-faint, var(--t-text-faint))" }} />
                    <span style={{ color: "var(--t-text-secondary, var(--t-text-muted))", fontWeight: 500 }}>{activeItem?.label}</span>
                </div>

                {/* page title */}
                <h1 style={{
                    fontSize: 20, fontWeight: 700, color: "var(--t-text, #1f2937)",
                    margin: "0 0 2px", letterSpacing: "-0.01em",
                }}>
                    {activeItem?.label}
                </h1>
                <p style={{ fontSize: 13, color: "var(--t-text-faint, var(--t-text-faint))", margin: "0 0 20px" }}>
                    {activeItem?.desc}
                </p>

                {/* content */}
                {SIDEBAR_ITEMS.length === 0 ? (
                    /* ── لا توجد صلاحيات لأي تاب ── */
                    <div style={{
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        minHeight: 300, gap: 12, color: "var(--t-text-faint, var(--t-text-faint))",
                    }}>
                        <Shield size={40} strokeWidth={1.2} style={{ color: "var(--t-text-faint, var(--t-border-medium))" }} />
                        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--t-text-secondary, var(--t-text-muted))" }}>لا توجد صلاحيات كافية</p>
                        <p style={{ fontSize: 12 }}>ليس لديك صلاحية الوصول لأي من إعدادات المؤسسة</p>
                    </div>
                ) : (
                    <div key={active} style={{ animation: "orgFade .18s ease-out" }}>
                        {active === "general" && canRenderTab("general") && <OrganizationTab />}
                        {active === "users" && canRenderTab("users") && <UsersPage embedded />}
                        {active === "roles" && canRenderTab("roles") && <RolesPage embedded />}
                        {active === "channels" && canRenderTab("channels") && <ChannelsPage />}
                        {active === "teams" && canRenderTab("teams") && <TeamsTab />}
                        {active === "tags" && canRenderTab("tags") && <TagsTab />}
                        {active === "snippets" && canRenderTab("snippets") && <SnippetsTab />}
                        {active === "lifecycles" && canRenderTab("lifecycles") && <LifecyclesTab />}
                        {active === "contact-fields" && canRenderTab("contact-fields") && <ContactFieldsTab />}
                        {active === "ai" && canRenderTab("ai") && <AISettingsTab />}
                        {active === "audit-logs" && !hasPermissionData && <AuditLogsTab />}
                        {active === "billing" && <BillingTab />}
                    </div>
                )}
            </main>

            <style>{`@keyframes orgFade{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    )
}
