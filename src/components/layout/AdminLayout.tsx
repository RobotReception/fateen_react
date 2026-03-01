import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom"
import { useAuthStore } from "@/stores/auth-store"
import { useThemeStore } from "@/stores/theme-store"
import { usePermissions } from "@/lib/usePermissions"
import { PAGE_BITS } from "@/lib/permissions"
import { logout as logoutApi } from "@/features/auth/services/auth-service"
import { toast } from "sonner"
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
    Sun,
    Moon,
    BookUser,
    ChevronLeft,
    ListTree,
} from "lucide-react"

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
        icon: MessageSquare,
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
        pageBit: PAGE_BITS.DOCUMENT_MANAGEMENT,
    },
    {
        title: "إدارة القوائم",
        href: "/dashboard/menu-manager",
        icon: ListTree,
        pageBit: PAGE_BITS.MENUS,
    },

]

export function AdminLayout() {
    const [mobileOpen, setMobileOpen] = useState(false)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const settingsRef = useRef<HTMLDivElement>(null)
    const settingsDropdownRef = useRef<HTMLDivElement>(null)
    const userMenuRef = useRef<HTMLDivElement>(null)
    const location = useLocation()
    const navigate = useNavigate()
    const { user, token, logout: storeLogout } = useAuthStore()
    const { canAccessPage, hasPermissionData } = usePermissions()
    const { theme, toggleTheme } = useThemeStore()

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
                {/* Top bar */}
                <header
                    className="flex h-12 sm:h-14 items-center justify-between px-3 sm:px-4 lg:px-6"
                    style={{
                        background: "var(--t-card, #fff)",
                        borderBottom: "1px solid var(--t-border-light, #f0f0f0)",
                    }}
                >
                    {/* Right side: mobile menu */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
                        >
                            <Menu size={20} />
                        </button>
                    </div>

                    {/* Left side: theme toggle + user */}
                    <div className="flex items-center gap-2">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="rounded-xl p-2 transition-all duration-200"
                            title={theme === "light" ? "الوضع الداكن" : "الوضع الفاتح"}
                            style={{
                                color: "var(--t-text-muted)",
                                background: "var(--t-surface, transparent)",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "var(--t-card-hover, #f3f4f6)" }}
                            onMouseLeave={e => { e.currentTarget.style.background = "var(--t-surface, transparent)" }}
                        >
                            {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
                        </button>

                        {/* Divider */}
                        <div className="hidden sm:block h-7 w-px" style={{ background: "var(--t-border-light, #e5e7eb)" }} />

                        {/* User info — clickable with dropdown */}
                        <div ref={userMenuRef} style={{ position: "relative" }}>
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-all duration-200 cursor-pointer"
                                style={{
                                    background: userMenuOpen ? "var(--t-card-hover, #f3f4f6)" : "transparent",
                                    border: "none",
                                    outline: "none",
                                }}
                                onMouseEnter={e => { if (!userMenuOpen) e.currentTarget.style.background = "var(--t-card-hover, #f3f4f6)" }}
                                onMouseLeave={e => { if (!userMenuOpen) e.currentTarget.style.background = "transparent" }}
                            >
                                <div className="hidden text-left sm:block">
                                    <p className="text-[13px] font-semibold" style={{ color: "var(--t-text, #1f2937)" }}>
                                        {user?.first_name} {user?.last_name}
                                    </p>
                                    <p className="text-[11px]" style={{ color: "var(--t-text-faint, #9ca3af)" }}>{user?.email}</p>
                                </div>
                                <div
                                    className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white"
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
            `}</style>
        </div>
    )
}
