import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom"
import { useAuthStore } from "@/stores/auth-store"

import { usePermissions } from "@/lib/usePermissions"
import { PAGE_BITS } from "@/lib/permissions"
import { logout as logoutApi } from "@/features/auth/services/auth-service"
import { toast } from "sonner"
import { useNotifications } from "@/features/notifications/hooks/useNotifications"
import NotificationPanel from "@/features/notifications/components/NotificationPanel"
import { InboxIcon } from "@/components/icons/InboxIcon"
import {
    Users,
    LayoutDashboard,
    LogOut,
    Menu,
    X,
    Shield,
    BookOpen,
    Settings,
    Building2,
    User,
    MessageSquare,
    CreditCard,
    Zap,
    Brain,
    BookUser,
    ChevronLeft,
    ListTree,
    Search,
    Bell,
    Home,
    Command,
} from "lucide-react"

/* ── Route → Arabic title map for breadcrumbs ── */
const ROUTE_TITLES: Record<string, string> = {
    "/dashboard": "لوحة التحكم",
    "/dashboard/inbox": "المحادثات",
    "/dashboard/contacts": "جهات الاتصال",
    "/dashboard/knowledge": "قاعدة المعرفة",
    "/dashboard/menu-manager": "إدارة القوائم",
    "/dashboard/users": "المستخدمين",
    "/dashboard/roles": "الأدوار",
    "/dashboard/channels": "القنوات",
    "/dashboard/settings": "الإعدادات",
    "/dashboard/settings/organization": "إعدادات المؤسسة",
    "/dashboard/settings/profile": "الإعدادات الشخصية",
    "/dashboard/settings/ai": "إعدادات AI",
}

const NAV_ITEMS = [
    {
        title: "لوحة التحكم",
        href: "/dashboard",
        icon: LayoutDashboard,
        pageBit: null,
    },
    {
        title: "المحادثات",
        href: "/dashboard/inbox",
        icon: InboxIcon,
        pageBit: PAGE_BITS.INBOX,
    },
    {
        title: "جهات الاتصال",
        href: "/dashboard/contacts",
        icon: BookUser,
        pageBit: PAGE_BITS.CONTACTS,
    },
    {
        title: "قاعدة المعرفة",
        href: "/dashboard/knowledge",
        icon: BookOpen,
        pageBit: PAGE_BITS.DOCUMENTS,
    },
    {
        title: "إدارة القوائم",
        href: "/dashboard/menu-manager",
        icon: ListTree,
        pageBit: PAGE_BITS.MENU_MANAGER,
    },

]

/* ── Searchable items for the Command Palette ── */
const ALL_SEARCHABLE_ITEMS = [
    { title: "لوحة التحكم", href: "/dashboard", icon: LayoutDashboard, keywords: "dashboard home رئيسية الرئيسية" },
    { title: "المحادثات", href: "/dashboard/inbox", icon: InboxIcon, keywords: "inbox chat رسائل محادثة الرسائل" },
    { title: "جهات الاتصال", href: "/dashboard/contacts", icon: BookUser, keywords: "contacts عملاء أرقام زبائن العملاء" },
    { title: "قاعدة المعرفة", href: "/dashboard/knowledge", icon: BookOpen, keywords: "knowledge docs مستندات وثائق ملفات" },
    { title: "إدارة القوائم", href: "/dashboard/menu-manager", icon: ListTree, keywords: "menus قوائم القوائم" },
    { title: "المستخدمين", href: "/dashboard/users", icon: Users, keywords: "users أعضاء مستخدمين" },
    { title: "الفرق", href: "/dashboard/settings/organization", icon: Users, keywords: "teams فريق فرق الفرق مجموعات" },
    { title: "الأدوار والصلاحيات", href: "/dashboard/roles", icon: Shield, keywords: "roles permissions صلاحيات أدوار الصلاحيات" },
    { title: "القنوات", href: "/dashboard/channels", icon: MessageSquare, keywords: "channels واتساب whatsapp قنوات" },
    { title: "إعدادات المؤسسة", href: "/dashboard/settings/organization", icon: Building2, keywords: "settings organization مؤسسة إعدادات المؤسسة" },
    { title: "الإعدادات الشخصية", href: "/dashboard/settings/profile", icon: User, keywords: "profile حساب شخصي الملف الشخصي" },
    { title: "إعدادات AI", href: "/dashboard/settings/ai", icon: Brain, keywords: "ai ذكاء اصطناعي الذكاء" },
    { title: "الاشتراك والفوترة", href: "/dashboard/settings/organization?tab=billing", icon: CreditCard, keywords: "billing subscription فواتير اشتراك دفع الاشتراك" },
]

export function AdminLayout() {
    const [mobileOpen, setMobileOpen] = useState(false)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const [notificationsOpen, setNotificationsOpen] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [searchSelectedIdx, setSearchSelectedIdx] = useState(0)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const settingsRef = useRef<HTMLDivElement>(null)
    const settingsDropdownRef = useRef<HTMLDivElement>(null)
    const userMenuRef = useRef<HTMLDivElement>(null)
    const location = useLocation()
    const navigate = useNavigate()
    const { user, token, logout: storeLogout } = useAuthStore()
    const { canAccessPage, hasPermissionData } = usePermissions()

    const {
        notifications: notifList,
        unreadCount: notifUnread,
        loading: notifLoading,
        markAsRead: notifMarkRead,
        markAllAsRead: notifMarkAllRead,
    } = useNotifications()

    const visibleNavItems = NAV_ITEMS.filter((item) => {
        if (!item.pageBit) return true
        if (!hasPermissionData) return true
        return canAccessPage(item.pageBit)
    })

    const handleLogout = async () => {
        try {
            if (token) await logoutApi(token)
        } catch {
            /* silent */
        } finally {
            storeLogout()
            navigate("/login")
            toast.success("تم تسجيل الخروج بنجاح")
        }
    }

    const isActive = (href: string) => {
        if (href === "/dashboard") return location.pathname === href
        return location.pathname.startsWith(href)
    }

    const isSettingsActive = location.pathname.startsWith("/dashboard/settings")

    /* ── Search filtering ── */
    const filteredSearchItems = useMemo(() => {
        if (!searchQuery.trim()) return ALL_SEARCHABLE_ITEMS
        const q = searchQuery.trim().toLowerCase()
        return ALL_SEARCHABLE_ITEMS.filter(
            (item) =>
                item.title.toLowerCase().includes(q) ||
                item.keywords.toLowerCase().includes(q) ||
                item.href.toLowerCase().includes(q)
        )
    }, [searchQuery])

    const openSearch = useCallback(() => {
        setSearchOpen(true)
        setSearchQuery("")
        setSearchSelectedIdx(0)
        setTimeout(() => searchInputRef.current?.focus(), 80)
    }, [])

    const closeSearch = useCallback(() => {
        setSearchOpen(false)
        setSearchQuery("")
        setSearchSelectedIdx(0)
    }, [])

    const navigateFromSearch = useCallback((href: string) => {
        closeSearch()
        navigate(href)
    }, [navigate, closeSearch])

    /* ── Ctrl+K / ⌘K keyboard shortcut ── */
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault()
                setSearchOpen((prev) => {
                    if (!prev) {
                        setTimeout(() => searchInputRef.current?.focus(), 80)
                    }
                    return !prev
                })
                setSearchQuery("")
                setSearchSelectedIdx(0)
            }
        }
        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [])

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            const target = e.target as Node
            // For settings: check both the trigger button area AND the portaled dropdown
            const inSettingsBtn = settingsRef.current?.contains(target)
            const inSettingsDropdown = settingsDropdownRef.current?.contains(target)
            if (!inSettingsBtn && !inSettingsDropdown) {
                setSettingsOpen(false)
            }
            if (userMenuRef.current && !userMenuRef.current.contains(target)) {
                setUserMenuOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClick)
        return () => document.removeEventListener("mousedown", handleClick)
    }, [])

    const goSettings = (page: string = "organization") => {
        setSettingsOpen(false)
        setMobileOpen(false)
        navigate(`/dashboard/settings/${page}`)
    }

    const goTo = (href: string) => {
        setSettingsOpen(false)
        setMobileOpen(false)
        navigate(href)
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50" dir="rtl">
            {/* ── Mobile overlay ── */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* ── Sidebar ── */}
            {/* Desktop: icon-only 68px fixed sidebar */}
            {/* Mobile: full-width drawer (w-64) with labels, slides from right */}
            <aside
                className={`
                    fixed inset-y-0 right-0 z-50 flex flex-col border-l bg-white
                    transition-transform duration-300 ease-in-out
                    w-64 lg:w-[68px] lg:static lg:z-auto
                    ${mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
                `}
                style={{ borderColor: "var(--t-border-light, #f0f0f0)" }}
            >
                {/* Gradient accent line at top */}
                <div style={{
                    height: 3,
                    background: "linear-gradient(to left, #004786, #0098d6)",
                    flexShrink: 0,
                }} />

                {/* Logo area */}
                <div className="flex h-14 lg:h-16 items-center justify-between lg:justify-center border-b px-4 lg:px-2" style={{ borderColor: "var(--t-border-light, #f0f0f0)" }}>
                    {/* Mobile: full logo + close button */}
                    <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 lg:hidden transition-opacity duration-200 hover:opacity-80">
                        <img src="/logo.png" alt="فطين" className="h-8 object-contain" />
                    </Link>
                    {/* Desktop: short logo */}
                    <Link to="/dashboard" className="hidden lg:flex items-center justify-center transition-transform duration-200 hover:scale-110">
                        <img src="/Fateen_02_short_logo.png" alt="فطين" className="h-10 w-10 rounded-lg object-contain" />
                    </Link>
                    {/* Mobile close button */}
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="lg:hidden rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 lg:px-2 py-4">
                    {visibleNavItems.map((item) => {
                        const Icon = item.icon
                        const active = isActive(item.href)
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                onClick={() => setMobileOpen(false)}
                                title={item.title}
                                className="group relative flex items-center gap-3 lg:justify-center lg:gap-0 px-3 lg:px-0 py-2.5 text-sm font-medium transition-all duration-200"
                                style={{
                                    borderRadius: 10,
                                    background: active ? "rgba(0,71,134,0.08)" : "transparent",
                                    color: active ? "#004786" : "var(--t-text-secondary, #6b7280)",
                                }}
                            >
                                <div
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 9,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        background: active ? "#004786" : "transparent",
                                        transition: "all 0.2s ease",
                                        flexShrink: 0,
                                    }}
                                    className={active ? "" : "group-hover:bg-gray-100"}
                                >
                                    <Icon
                                        size={19}
                                        strokeWidth={active ? 2 : 1.7}
                                        style={{
                                            color: active ? "#fff" : "var(--t-text-faint, #9ca3af)",
                                            transition: "color 0.2s ease",
                                        }}
                                        className={active ? "" : "group-hover:!text-gray-600"}
                                    />
                                </div>
                                <span className="lg:hidden transition-colors duration-200">{item.title}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* ── Settings Button + Dropdown ── */}
                <div className="px-3 lg:px-2 pb-2">
                    <div ref={settingsRef} style={{ position: "relative" }}>
                        <button
                            onClick={() => setSettingsOpen(!settingsOpen)}
                            title="الإعدادات"
                            className="group relative flex w-full items-center gap-3 lg:justify-center lg:gap-0 px-3 lg:px-0 py-2.5 text-sm font-medium transition-all duration-200"
                            style={{
                                borderRadius: 10,
                                background: isSettingsActive || settingsOpen ? "rgba(0,71,134,0.08)" : "transparent",
                                color: isSettingsActive || settingsOpen ? "#004786" : "var(--t-text-secondary, #6b7280)",
                                border: "none",
                                cursor: "pointer",
                            }}
                        >
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 9,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: isSettingsActive || settingsOpen ? "#004786" : "transparent",
                                    transition: "all 0.2s ease",
                                    flexShrink: 0,
                                }}
                                className={isSettingsActive || settingsOpen ? "" : "group-hover:bg-gray-100"}
                            >
                                <Settings
                                    size={19}
                                    strokeWidth={isSettingsActive ? 2 : 1.7}
                                    className={`transition-all duration-300 ${settingsOpen ? "rotate-90" : ""}`}
                                    style={{
                                        color: isSettingsActive || settingsOpen ? "#fff" : "var(--t-text-faint, #9ca3af)",
                                        transition: "color 0.2s ease",
                                    }}
                                />
                            </div>
                            <span className="lg:hidden transition-colors duration-200">الإعدادات</span>
                        </button>

                        {/* ── Settings Dropdown — rendered via portal to escape stacking context ── */}
                        {settingsOpen && createPortal(
                            <div ref={settingsDropdownRef} className="settings-dropdown" style={{
                                position: "fixed",
                                bottom: 16,
                                right: 76,
                                width: 240,
                                borderRadius: 14,
                                background: "var(--t-card, #fff)",
                                border: "1px solid var(--t-border-light, #e5e7eb)",
                                boxShadow: "0 16px 48px -8px rgba(0,0,0,0.14), 0 4px 16px -4px rgba(0,0,0,0.06)",
                                zIndex: 9999,
                                overflow: "hidden",
                                animation: "settingsSlide .18s cubic-bezier(0.16, 1, 0.3, 1)",
                            }}>

                                {/* ── Gradient Header ── */}
                                <div style={{
                                    background: "linear-gradient(135deg, #004786, #0072b5, #0098d6)",
                                    padding: "12px 14px",
                                    position: "relative",
                                    overflow: "hidden",
                                }}>
                                    <div style={{
                                        position: "absolute", top: -15, left: -15,
                                        width: 60, height: 60, borderRadius: "50%",
                                        background: "rgba(255,255,255,0.06)",
                                    }} />
                                    <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 7 }}>
                                        <Settings size={14} style={{ color: "rgba(255,255,255,0.8)" }} />
                                        <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>الإعدادات</span>
                                    </div>
                                </div>

                                {/* ── Items ── */}
                                <div style={{ padding: "4px 4px" }}>
                                    {[
                                        { label: "إعدادات المؤسسة", icon: Building2, action: () => goSettings("organization") },
                                        { label: "الإعدادات الشخصية", icon: User, action: () => goSettings("profile") },
                                    ].map((item) => (
                                        <button
                                            key={item.label}
                                            onClick={item.action}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 10,
                                                width: "100%", padding: "8px 8px", borderRadius: 8,
                                                border: "none", background: "transparent",
                                                cursor: "pointer", transition: "all 0.12s",
                                                textAlign: "right", color: "inherit",
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = "var(--t-card-hover, #f3f4f6)" }}
                                            onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                                        >
                                            <item.icon size={16} strokeWidth={1.6} style={{ color: "var(--t-text-secondary, #6b7280)", flexShrink: 0 }} />
                                            <span style={{ fontSize: 13, color: "var(--t-text, #374151)", fontWeight: 500, flex: 1 }}>{item.label}</span>
                                            <ChevronLeft size={13} style={{ color: "var(--t-text-faint, #d1d5db)", flexShrink: 0 }} />
                                        </button>
                                    ))}
                                </div>

                                {/* ── Divider ── */}
                                <div style={{ margin: "0 12px", borderTop: "1px solid var(--t-border-light, #f0f0f0)" }} />

                                {/* ── Quick links ── */}
                                <div style={{ padding: "4px 4px" }}>
                                    {[
                                        { label: "القنوات", icon: MessageSquare, href: "/dashboard/settings/organization" },
                                        { label: "المستخدمين", icon: Users, href: "/dashboard/settings/organization" },
                                        { label: "الاشتراك", icon: CreditCard, href: "/dashboard/settings/organization" },
                                        { label: "إعدادات AI", icon: Brain, href: "/dashboard/settings/ai" },
                                    ].map((item) => (
                                        <button
                                            key={item.label}
                                            onClick={() => goTo(item.href)}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 8,
                                                width: "100%", padding: "6px 8px", borderRadius: 7,
                                                border: "none", background: "transparent",
                                                cursor: "pointer", transition: "all 0.12s",
                                                textAlign: "right", color: "inherit",
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = "var(--t-card-hover, #f3f4f6)" }}
                                            onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                                        >
                                            <item.icon size={14} strokeWidth={1.5} style={{ color: "var(--t-text-muted, #9ca3af)", flexShrink: 0 }} />
                                            <span style={{ fontSize: 12, color: "var(--t-text-secondary, #6b7280)", fontWeight: 500 }}>{item.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* ── Plan badge ── */}
                                <div style={{
                                    margin: "2px 4px 4px",
                                    padding: "7px 10px",
                                    borderRadius: 8,
                                    background: "linear-gradient(135deg, rgba(0,71,134,0.04), rgba(0,152,214,0.04))",
                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                }}>
                                    <span style={{ fontSize: 11, color: "var(--t-text-faint, #9ca3af)", fontWeight: 500 }}>الخطة</span>
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: 4,
                                        fontSize: 10, fontWeight: 700, color: "#004786",
                                        background: "rgba(0,71,134,0.08)",
                                        padding: "3px 8px", borderRadius: 12,
                                    }}>
                                        <Zap size={9} style={{ color: "#0098d6" }} />
                                        Growth
                                    </div>
                                </div>
                            </div>
                            , document.body)}
                    </div>
                </div>

                {/* ── User section ── */}
                <div className="border-t p-2.5 lg:p-2" style={{ borderColor: "var(--t-border-light, #f0f0f0)" }}>
                    {/* Mobile: full user info */}
                    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 lg:hidden" style={{ background: "var(--t-surface, #f9fafb)" }}>
                        <div
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, #004786, #0098d6)" }}
                        >
                            {user?.first_name?.charAt(0) || "U"}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-semibold" style={{ color: "var(--t-text, #374151)" }}>{user?.first_name} {user?.last_name}</p>
                            <p className="flex items-center gap-1 text-[11px]" style={{ color: "var(--t-text-faint, #9ca3af)" }}>
                                <Shield size={9} />
                                {user?.role || "admin"}
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="rounded-lg p-1.5 text-gray-400 transition-all duration-200 hover:bg-red-50 hover:text-red-500"
                            title="تسجيل الخروج"
                        >
                            <LogOut size={15} />
                        </button>
                    </div>
                    {/* Desktop: icon-only */}
                    <div className="hidden lg:flex flex-col items-center gap-2">
                        <div
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white"
                            style={{ background: "linear-gradient(135deg, #004786, #0098d6)" }}
                            title={`${user?.first_name} ${user?.last_name}`}
                        >
                            {user?.first_name?.charAt(0) || "U"}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex w-full items-center justify-center rounded-lg p-2 text-gray-400 transition-all duration-200 hover:bg-red-50 hover:text-red-500"
                            title="تسجيل الخروج"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* ── Professional Top Bar ── */}
                <header
                    className="flex h-14 items-center justify-between px-3 sm:px-4 lg:px-6"
                    style={{
                        background: "rgba(255,255,255,0.82)",
                        backdropFilter: "blur(16px) saturate(180%)",
                        WebkitBackdropFilter: "blur(16px) saturate(180%)",
                        borderBottom: "1px solid var(--t-border-light, #f0f0f0)",
                        position: "relative",
                        zIndex: 30,
                    }}
                >
                    {/* ── Right side: mobile menu + Breadcrumbs ── */}
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="rounded-lg p-2 transition-colors duration-150 lg:hidden"
                            style={{ color: "var(--t-text-muted, #6b7280)" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "var(--t-card-hover, #f3f4f6)" }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                        >
                            <Menu size={20} />
                        </button>

                        {/* Breadcrumbs */}
                        <nav className="hidden sm:flex items-center gap-1.5" aria-label="Breadcrumb">
                            <Link
                                to="/dashboard"
                                className="flex items-center justify-center rounded-lg p-1.5 transition-colors duration-150"
                                style={{ color: "var(--t-text-faint, #9ca3af)" }}
                                onMouseEnter={e => { e.currentTarget.style.color = "var(--t-text-secondary, #374151)"; e.currentTarget.style.background = "var(--t-card-hover, #f3f4f6)" }}
                                onMouseLeave={e => { e.currentTarget.style.color = "var(--t-text-faint, #9ca3af)"; e.currentTarget.style.background = "transparent" }}
                                title="لوحة التحكم"
                            >
                                <Home size={15} />
                            </Link>
                            {(() => {
                                const path = location.pathname
                                /* Find the best matching route title */
                                let title = ""
                                let matchLen = 0
                                for (const [route, label] of Object.entries(ROUTE_TITLES)) {
                                    if (path.startsWith(route) && route.length > matchLen && route !== "/dashboard") {
                                        title = label
                                        matchLen = route.length
                                    }
                                }
                                if (!title && path === "/dashboard") title = "لوحة التحكم"
                                if (!title) return null

                                /* Build breadcrumb segments */
                                const isSettings = path.startsWith("/dashboard/settings")
                                const segments: { label: string; href?: string }[] = []
                                if (isSettings) {
                                    segments.push({ label: "الإعدادات" })
                                    if (title !== "الإعدادات") segments.push({ label: title })
                                } else {
                                    segments.push({ label: title })
                                }

                                return segments.map((seg, i) => (
                                    <div key={i} className="flex items-center gap-1.5">
                                        <ChevronLeft size={12} style={{ color: "var(--t-text-faint, #d1d5db)", transform: "scaleX(-1)" }} />
                                        <span
                                            style={{
                                                fontSize: 13,
                                                fontWeight: i === segments.length - 1 ? 600 : 400,
                                                color: i === segments.length - 1 ? "var(--t-text, #111827)" : "var(--t-text-faint, #9ca3af)",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {seg.label}
                                        </span>
                                    </div>
                                ))
                            })()}
                        </nav>
                    </div>

                    {/* ── Center: Global Search ── */}
                    <div className="hidden md:flex flex-1 justify-center px-4 max-w-lg mx-auto">
                        <button
                            className="flex items-center w-full gap-2.5 rounded-xl px-3.5 py-2 transition-all duration-200 cursor-pointer group"
                            style={{
                                background: "var(--t-surface, #f3f4f6)",
                                border: "1px solid var(--t-border-light, #e5e7eb)",
                                maxWidth: 420,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--t-border, #d1d5db)"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)" }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--t-border-light, #e5e7eb)"; e.currentTarget.style.boxShadow = "none" }}
                            onClick={openSearch}
                        >
                            <Search size={15} style={{ color: "var(--t-text-faint, #9ca3af)", flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: "var(--t-text-faint, #9ca3af)", flex: 1, textAlign: "right" }}>بحث سريع...</span>
                            <div className="hidden lg:flex items-center gap-0.5" style={{
                                padding: "2px 6px",
                                borderRadius: 6,
                                background: "var(--t-card, #fff)",
                                border: "1px solid var(--t-border-light, #e5e7eb)",
                            }}>
                                <Command size={10} style={{ color: "var(--t-text-faint, #9ca3af)" }} />
                                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--t-text-faint, #9ca3af)" }}>K</span>
                            </div>
                        </button>
                    </div>

                    {/* ── Left side: actions ── */}
                    <div className="flex items-center gap-1 sm:gap-1.5">
                        {/* Mobile search icon */}
                        <button
                            className="md:hidden rounded-xl p-2 transition-all duration-200"
                            style={{ color: "var(--t-text-muted, #6b7280)" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "var(--t-card-hover, #f3f4f6)" }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                            title="بحث"
                            onClick={openSearch}
                        >
                            <Search size={18} />
                        </button>

                        {/* Notifications Bell */}
                        <button
                            className="relative rounded-xl p-2 transition-all duration-200"
                            style={{ color: notificationsOpen ? "var(--t-text, #111827)" : "var(--t-text-muted, #6b7280)", background: notificationsOpen ? "var(--t-card-hover, #f3f4f6)" : "transparent" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "var(--t-card-hover, #f3f4f6)"; e.currentTarget.style.color = "var(--t-text-secondary, #374151)" }}
                            onMouseLeave={e => { if (!notificationsOpen) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--t-text-muted, #6b7280)" } }}
                            title="الإشعارات"
                            onClick={() => setNotificationsOpen((p) => !p)}
                        >
                            <Bell size={18} />
                            {notifUnread > 0 && (
                                <span style={{
                                    position: "absolute", top: 6, right: 6,
                                    minWidth: 16, height: 16, borderRadius: 8,
                                    background: "#ef4444",
                                    color: "#fff", fontSize: 9, fontWeight: 700,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    padding: "0 4px",
                                    border: "2px solid var(--t-card, #fff)",
                                    animation: "notifBadgePop .3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                                }}>
                                    {notifUnread > 9 ? "9+" : notifUnread}
                                </span>
                            )}
                        </button>

                        {/* Notifications Panel */}
                        {notificationsOpen && (
                            <NotificationPanel
                                notifications={notifList}
                                loading={notifLoading}
                                unreadCount={notifUnread}
                                onMarkAsRead={notifMarkRead}
                                onMarkAllAsRead={notifMarkAllRead}
                                onClose={() => setNotificationsOpen(false)}
                            />
                        )}



                        {/* Divider */}
                        <div className="hidden sm:block h-7 w-px mx-0.5" style={{ background: "var(--t-border-light, #e5e7eb)" }} />

                        {/* User info — clickable with dropdown */}
                        <div ref={userMenuRef} style={{ position: "relative" }}>
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all duration-200 cursor-pointer"
                                style={{
                                    background: userMenuOpen ? "var(--t-card-hover, #f3f4f6)" : "transparent",
                                    border: "none",
                                    outline: "none",
                                }}
                                onMouseEnter={e => { if (!userMenuOpen) e.currentTarget.style.background = "var(--t-card-hover, #f3f4f6)" }}
                                onMouseLeave={e => { if (!userMenuOpen) e.currentTarget.style.background = "transparent" }}
                            >
                                <div className="hidden text-left sm:block">
                                    <p className="text-[13px] font-semibold leading-tight" style={{ color: "var(--t-text, #1f2937)" }}>
                                        {user?.first_name} {user?.last_name}
                                    </p>
                                    <p className="text-[11px] leading-tight" style={{ color: "var(--t-text-faint, #9ca3af)" }}>{user?.email}</p>
                                </div>
                                <div
                                    className="flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold text-white"
                                    style={{ background: "linear-gradient(135deg, #004786, #0098d6)" }}
                                >
                                    {user?.first_name?.charAt(0) || "U"}
                                </div>
                                <ChevronLeft size={14} className={`hidden sm:block transition-transform duration-200 ${userMenuOpen ? "rotate-90" : "-rotate-90"}`} style={{ color: "var(--t-text-faint, #9ca3af)" }} />
                            </button>

                            {/* ── User Profile Dropdown ── */}
                            {userMenuOpen && (
                                <div className="admin-user-dropdown" style={{
                                    position: "absolute",
                                    top: "calc(100% + 8px)",
                                    left: 0,
                                    width: "min(300px, calc(100vw - 24px))",
                                    borderRadius: 16,
                                    background: "var(--t-card, #fff)",
                                    border: "1px solid var(--t-border-light, #e5e7eb)",
                                    boxShadow: "0 20px 60px -12px rgba(0,0,0,0.15), 0 4px 20px -4px rgba(0,0,0,0.06)",
                                    zIndex: 200,
                                    overflow: "hidden",
                                    animation: "userMenuSlide .2s cubic-bezier(0.16, 1, 0.3, 1)",
                                }}>
                                    {/* Profile header with gradient */}
                                    <div style={{
                                        background: "linear-gradient(135deg, #004786, #0072b5, #0098d6)",
                                        padding: "24px 20px 20px",
                                        position: "relative",
                                        overflow: "hidden",
                                    }}>
                                        {/* Decorative circles */}
                                        <div style={{
                                            position: "absolute", top: -30, right: -30,
                                            width: 120, height: 120, borderRadius: "50%",
                                            background: "rgba(255,255,255,0.06)",
                                        }} />
                                        <div style={{
                                            position: "absolute", bottom: -20, left: -20,
                                            width: 80, height: 80, borderRadius: "50%",
                                            background: "rgba(255,255,255,0.04)",
                                        }} />

                                        <div className="flex items-center gap-3" style={{ position: "relative", zIndex: 1 }}>
                                            <div
                                                className="flex items-center justify-center rounded-2xl text-lg font-bold text-white"
                                                style={{
                                                    width: 52, height: 52,
                                                    background: "rgba(255,255,255,0.2)",
                                                    border: "2px solid rgba(255,255,255,0.3)",
                                                    backdropFilter: "blur(10px)",
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {user?.first_name?.charAt(0) || "U"}
                                            </div>
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 2 }}>
                                                    {user?.first_name} {user?.last_name}
                                                </p>
                                                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                                                    {user?.email}
                                                </p>
                                                <div style={{
                                                    display: "inline-flex", alignItems: "center", gap: 4,
                                                    marginTop: 6, padding: "3px 10px", borderRadius: 12,
                                                    background: "rgba(255,255,255,0.15)",
                                                    backdropFilter: "blur(8px)",
                                                    fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.9)",
                                                }}>
                                                    <Shield size={10} />
                                                    {user?.role || "admin"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Menu items */}
                                    <div style={{ padding: "6px" }}>
                                        <button
                                            onClick={() => { setUserMenuOpen(false); navigate("/dashboard/settings/profile") }}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 12,
                                                width: "100%", padding: "10px 12px", borderRadius: 10,
                                                border: "none", background: "transparent",
                                                cursor: "pointer", transition: "background 0.12s",
                                                textAlign: "right", color: "inherit",
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = "var(--t-card-hover, #f3f4f6)" }}
                                            onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                                        >
                                            <div style={{
                                                width: 34, height: 34, borderRadius: 10,
                                                background: "var(--t-surface, #f3f4f6)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                flexShrink: 0,
                                            }}>
                                                <User size={15} style={{ color: "var(--t-text-secondary, #6b7280)" }} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t-text, #1f2937)" }}>الملف الشخصي</div>
                                                <div style={{ fontSize: 11, color: "var(--t-text-faint, #9ca3af)", marginTop: 1 }}>تعديل بياناتك الشخصية</div>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => { setUserMenuOpen(false); navigate("/dashboard/settings/organization") }}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 12,
                                                width: "100%", padding: "10px 12px", borderRadius: 10,
                                                border: "none", background: "transparent",
                                                cursor: "pointer", transition: "background 0.12s",
                                                textAlign: "right", color: "inherit",
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = "var(--t-card-hover, #f3f4f6)" }}
                                            onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                                        >
                                            <div style={{
                                                width: 34, height: 34, borderRadius: 10,
                                                background: "var(--t-surface, #f3f4f6)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                flexShrink: 0,
                                            }}>
                                                <Building2 size={15} style={{ color: "var(--t-text-secondary, #6b7280)" }} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t-text, #1f2937)" }}>إعدادات المؤسسة</div>
                                                <div style={{ fontSize: 11, color: "var(--t-text-faint, #9ca3af)", marginTop: 1 }}>إدارة المؤسسة والفريق</div>
                                            </div>
                                        </button>
                                    </div>

                                    {/* Divider + logout */}
                                    <div style={{ margin: "0 14px", borderTop: "1px solid var(--t-border-light, #e5e7eb)" }} />
                                    <div style={{ padding: "6px" }}>
                                        <button
                                            onClick={() => { setUserMenuOpen(false); handleLogout() }}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 12,
                                                width: "100%", padding: "10px 12px", borderRadius: 10,
                                                border: "none", background: "transparent",
                                                cursor: "pointer", transition: "all 0.12s",
                                                textAlign: "right", color: "inherit",
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; (e.currentTarget.querySelector('.logout-icon') as HTMLElement)?.style && Object.assign((e.currentTarget.querySelector('.logout-icon') as HTMLElement).style, { background: '#fee2e2', color: '#ef4444' }) }}
                                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; (e.currentTarget.querySelector('.logout-icon') as HTMLElement)?.style && Object.assign((e.currentTarget.querySelector('.logout-icon') as HTMLElement).style, { background: 'var(--t-surface, #f3f4f6)', color: 'var(--t-text-secondary, #6b7280)' }) }}
                                        >
                                            <div className="logout-icon" style={{
                                                width: 34, height: 34, borderRadius: 10,
                                                background: "var(--t-surface, #f3f4f6)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                flexShrink: 0,
                                                transition: "all 0.12s",
                                                color: "var(--t-text-secondary, #6b7280)",
                                            }}>
                                                <LogOut size={15} />
                                            </div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t-text, #1f2937)" }}>تسجيل الخروج</div>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-hidden bg-gray-50">
                    <Outlet />
                </main>
            </div>


            {/* ── Command Palette / Global Search Modal ── */}
            {searchOpen && createPortal(
                <div
                    style={{
                        position: "fixed", inset: 0, zIndex: 9999,
                        background: "rgba(0,0,0,0.45)",
                        backdropFilter: "blur(6px)",
                        WebkitBackdropFilter: "blur(6px)",
                        display: "flex", alignItems: "flex-start", justifyContent: "center",
                        paddingTop: "min(18vh, 140px)",
                        animation: "cmdOverlayIn .15s ease",
                    }}
                    onClick={(e) => { if (e.target === e.currentTarget) closeSearch() }}
                >
                    <div
                        dir="rtl"
                        style={{
                            width: "min(560px, calc(100vw - 32px))",
                            maxHeight: "min(480px, 70vh)",
                            borderRadius: 18,
                            background: "var(--t-card, #fff)",
                            border: "1px solid var(--t-border-light, #e5e7eb)",
                            boxShadow: "0 24px 80px -12px rgba(0,0,0,0.25), 0 8px 24px -8px rgba(0,0,0,0.12)",
                            overflow: "hidden",
                            display: "flex", flexDirection: "column",
                            animation: "cmdPanelIn .2s cubic-bezier(0.16, 1, 0.3, 1)",
                        }}
                    >
                        {/* Search input area */}
                        <div style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "14px 18px",
                            borderBottom: "1px solid var(--t-border-light, #f0f0f0)",
                        }}>
                            <Search size={18} style={{ color: "var(--t-text-faint, #9ca3af)", flexShrink: 0 }} />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="ابحث في الصفحات والإعدادات..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setSearchSelectedIdx(0) }}
                                onKeyDown={(e) => {
                                    if (e.key === "Escape") {
                                        closeSearch()
                                    } else if (e.key === "ArrowDown") {
                                        e.preventDefault()
                                        setSearchSelectedIdx((prev) =>
                                            prev < filteredSearchItems.length - 1 ? prev + 1 : 0
                                        )
                                    } else if (e.key === "ArrowUp") {
                                        e.preventDefault()
                                        setSearchSelectedIdx((prev) =>
                                            prev > 0 ? prev - 1 : filteredSearchItems.length - 1
                                        )
                                    } else if (e.key === "Enter" && filteredSearchItems.length > 0) {
                                        e.preventDefault()
                                        navigateFromSearch(filteredSearchItems[searchSelectedIdx]?.href || filteredSearchItems[0].href)
                                    }
                                }}
                                style={{
                                    flex: 1, border: "none", outline: "none",
                                    background: "transparent",
                                    fontSize: 15, fontWeight: 500,
                                    color: "var(--t-text, #111827)",
                                    fontFamily: "inherit",
                                }}
                            />
                            <button
                                onClick={closeSearch}
                                style={{
                                    padding: "3px 8px", borderRadius: 6,
                                    background: "var(--t-surface, #f3f4f6)",
                                    border: "1px solid var(--t-border-light, #e5e7eb)",
                                    fontSize: 11, fontWeight: 600,
                                    color: "var(--t-text-faint, #9ca3af)",
                                    cursor: "pointer",
                                    flexShrink: 0,
                                }}
                            >
                                ESC
                            </button>
                        </div>

                        {/* Results list */}
                        <div style={{
                            flex: 1, overflowY: "auto",
                            padding: "6px",
                        }}>
                            {filteredSearchItems.length === 0 ? (
                                <div style={{
                                    display: "flex", flexDirection: "column", alignItems: "center",
                                    justifyContent: "center", padding: "36px 20px", gap: 8,
                                }}>
                                    <Search size={32} style={{ color: "var(--t-text-faint, #d1d5db)" }} />
                                    <span style={{ fontSize: 14, color: "var(--t-text-faint, #9ca3af)", fontWeight: 500 }}>
                                        لا توجد نتائج لـ "{searchQuery}"
                                    </span>
                                </div>
                            ) : (
                                filteredSearchItems.map((item, idx) => {
                                    const Icon = item.icon
                                    const isSelected = idx === searchSelectedIdx
                                    return (
                                        <button
                                            key={item.href}
                                            onClick={() => navigateFromSearch(item.href)}
                                            onMouseEnter={() => setSearchSelectedIdx(idx)}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 12,
                                                width: "100%", padding: "10px 12px", borderRadius: 12,
                                                border: "none",
                                                background: isSelected ? "var(--t-card-hover, #f3f4f6)" : "transparent",
                                                cursor: "pointer", transition: "background 0.08s",
                                                textAlign: "right", color: "inherit",
                                            }}
                                        >
                                            <div style={{
                                                width: 36, height: 36, borderRadius: 10,
                                                background: isSelected
                                                    ? "linear-gradient(135deg, #004786, #0098d6)"
                                                    : "var(--t-surface, #f3f4f6)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                flexShrink: 0,
                                                transition: "all 0.15s",
                                            }}>
                                                <Icon
                                                    size={16}
                                                    strokeWidth={1.8}
                                                    style={{
                                                        color: isSelected ? "#fff" : "var(--t-text-muted, #6b7280)",
                                                        transition: "color 0.15s",
                                                    }}
                                                />
                                            </div>
                                            <span style={{
                                                fontSize: 14, fontWeight: 500, flex: 1,
                                                color: isSelected ? "var(--t-text, #111827)" : "var(--t-text-secondary, #374151)",
                                            }}>
                                                {item.title}
                                            </span>
                                            {isSelected && (
                                                <span style={{
                                                    fontSize: 11, color: "var(--t-text-faint, #9ca3af)",
                                                    display: "flex", alignItems: "center", gap: 3,
                                                }}>
                                                    <span style={{
                                                        padding: "1px 5px", borderRadius: 4,
                                                        background: "var(--t-surface, #e5e7eb)",
                                                        fontSize: 10, fontWeight: 600,
                                                    }}>↵</span>
                                                    للانتقال
                                                </span>
                                            )}
                                        </button>
                                    )
                                })
                            )}
                        </div>

                        {/* Footer hints */}
                        <div style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "10px 18px",
                            borderTop: "1px solid var(--t-border-light, #f0f0f0)",
                            fontSize: 11, color: "var(--t-text-faint, #9ca3af)",
                        }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <span style={{ padding: "1px 5px", borderRadius: 4, background: "var(--t-surface, #f3f4f6)", fontWeight: 600 }}>↑↓</span>
                                للتنقل
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <span style={{ padding: "1px 5px", borderRadius: 4, background: "var(--t-surface, #f3f4f6)", fontWeight: 600 }}>↵</span>
                                لتأكيد
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <span style={{ padding: "1px 5px", borderRadius: 4, background: "var(--t-surface, #f3f4f6)", fontWeight: 600 }}>Esc</span>
                                للإغلاق
                            </span>
                        </div>
                    </div>
                </div>
                , document.body)}

            <style>{`
                @keyframes settingsPopup {
                    from {
                        opacity: 0;
                        transform: translateY(10px) scale(0.96);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                @keyframes settingsSlide {
                    from {
                        opacity: 0;
                        transform: translateX(12px) scale(0.97);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0) scale(1);
                    }
                }
                @keyframes userMenuSlide {
                    from {
                        opacity: 0;
                        transform: translateY(-8px) scale(0.97);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                @keyframes notifBadgePop {
                    from {
                        opacity: 0;
                        transform: scale(0.3);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                @keyframes cmdOverlayIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes cmdPanelIn {
                    from {
                        opacity: 0;
                        transform: translateY(-16px) scale(0.97);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `}</style>
        </div>
    )
}
