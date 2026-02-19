import { useState, useRef, useEffect } from "react"
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
    ChevronLeft,
    Shield,
    BookOpen,
    ClipboardList,
    History,
    Settings,
    Building2,
    User,
    MessageSquare,
    CreditCard,
    Zap,
    Brain,
    Sun,
    Moon,
} from "lucide-react"

const NAV_ITEMS = [
    {
        title: "لوحة التحكم",
        href: "/dashboard",
        icon: LayoutDashboard,
        pageBit: null,
    },
    {
        title: "قاعدة المعرفة",
        href: "/dashboard/knowledge",
        icon: BookOpen,
        pageBit: PAGE_BITS.DOCUMENT_MANAGEMENT,
    },
    {
        title: "الطلبات المعلقة",
        href: "/dashboard/pending-requests",
        icon: ClipboardList,
        pageBit: PAGE_BITS.PENDING_REQUESTS,
    },
    {
        title: "سجل العمليات",
        href: "/dashboard/operation-history",
        icon: History,
        pageBit: PAGE_BITS.OPERATION_HISTORY,
    },
]

export function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const settingsRef = useRef<HTMLDivElement>(null)
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
            if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
                setSettingsOpen(false)
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
            <aside
                className={`
                    fixed inset-y-0 right-0 z-50 flex flex-col border-l border-gray-200 bg-white transition-all duration-300 ease-in-out
                    lg:static lg:z-auto
                    ${mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
                    ${sidebarOpen ? "w-64" : "w-[68px]"}
                `}
            >
                {/* Logo */}
                <div className="flex h-16 items-center justify-between border-b border-gray-100 px-4">
                    {sidebarOpen && (
                        <Link to="/dashboard" className="flex items-center gap-2.5">
                            <img src="/logo.png" alt="فطين" className="h-8 object-contain" />
                        </Link>
                    )}
                    <button
                        onClick={() => {
                            setSidebarOpen(!sidebarOpen)
                            if (mobileOpen) setMobileOpen(false)
                        }}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    >
                        {mobileOpen ? <X size={20} /> : <ChevronLeft size={20} className={`transition-transform duration-200 ${!sidebarOpen ? "rotate-180" : ""}`} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                    {visibleNavItems.map((item) => {
                        const Icon = item.icon
                        const active = isActive(item.href)
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={`
                                    group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200
                                    ${active
                                        ? "shadow-sm"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-800 hover:translate-x-[-2px]"
                                    }
                                `}
                                style={active ? { background: "var(--t-accent)", color: "var(--t-text-on-accent)" } : undefined}
                            >
                                <Icon size={19} strokeWidth={active ? 2 : 1.7} className={`transition-colors duration-200 ${active ? "" : "text-gray-400 group-hover:text-gray-600"}`} style={active ? { color: "var(--t-text-on-accent)" } : undefined} />
                                {sidebarOpen && <span className="transition-colors duration-200">{item.title}</span>}
                            </Link>
                        )
                    })}
                </nav>

                {/* ── Settings Button + Dropdown ── */}
                <div className="px-3 pb-2">
                    <div ref={settingsRef} style={{ position: "relative" }}>
                        <button
                            onClick={() => setSettingsOpen(!settingsOpen)}
                            className={`
                                group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200
                                ${isSettingsActive || settingsOpen
                                    ? "shadow-sm"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                                }
                            `}
                            style={isSettingsActive || settingsOpen ? { background: "var(--t-accent)", color: "var(--t-text-on-accent)" } : undefined}
                        >
                            <Settings
                                size={19}
                                strokeWidth={isSettingsActive ? 2 : 1.7}
                                className={`transition-all duration-300 ${!(isSettingsActive || settingsOpen) ? "text-gray-400 group-hover:text-gray-600" : ""} ${settingsOpen ? "rotate-90" : ""}`}
                                style={isSettingsActive || settingsOpen ? { color: "var(--t-text-on-accent)" } : undefined}
                            />
                            {sidebarOpen && <span className="transition-colors duration-200">الإعدادات</span>}
                        </button>

                        {/* ── Settings Dropdown — appears to the LEFT of sidebar ── */}
                        {settingsOpen && (
                            <div style={{
                                position: "fixed",
                                bottom: 80,
                                right: sidebarOpen ? 268 : 72,
                                width: 280,
                                borderRadius: 14,
                                background: "var(--t-card)",
                                border: "1px solid var(--t-border)",
                                boxShadow: "0 20px 50px -12px var(--t-shadow), 0 4px 16px -4px var(--t-shadow)",
                                zIndex: 200,
                                overflow: "hidden",
                                animation: "settingsSlide .2s cubic-bezier(0.16, 1, 0.3, 1)",
                            }}>

                                {/* ── Main settings ── */}
                                <div style={{ padding: "6px 6px 2px" }}>
                                    {/* Organization Settings */}
                                    <button
                                        onClick={() => goSettings("organization")}
                                        style={{
                                            display: "flex", alignItems: "center", gap: 12,
                                            width: "100%", padding: "11px 10px", borderRadius: 10,
                                            border: "none", background: "transparent",
                                            cursor: "pointer", transition: "background 0.12s",
                                            textAlign: "right", color: "inherit",
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = "var(--t-card-hover)" }}
                                        onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                                    >
                                        <div style={{
                                            width: 36, height: 36, borderRadius: 10,
                                            background: "var(--t-surface)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            flexShrink: 0,
                                        }}>
                                            <Building2 size={16} style={{ color: "var(--t-text-secondary)" }} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t-text)" }}>
                                                إعدادات المؤسسة
                                            </div>
                                            <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginTop: 1 }} dir="ltr">
                                                ID: {user?.tenant_id?.slice(0, 8) || "—"}
                                            </div>
                                        </div>
                                    </button>

                                    {/* Personal Settings */}
                                    <button
                                        onClick={() => goSettings("profile")}
                                        style={{
                                            display: "flex", alignItems: "center", gap: 12,
                                            width: "100%", padding: "11px 10px", borderRadius: 10,
                                            border: "none", background: "transparent",
                                            cursor: "pointer", transition: "background 0.12s",
                                            textAlign: "right", color: "inherit",
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = "var(--t-card-hover)" }}
                                        onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                                    >
                                        <div style={{
                                            width: 36, height: 36, borderRadius: 10,
                                            background: "var(--t-surface)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            flexShrink: 0,
                                        }}>
                                            <User size={16} style={{ color: "var(--t-text-secondary)" }} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t-text)" }}>
                                                الإعدادات الشخصية
                                            </div>
                                        </div>
                                    </button>
                                </div>

                                {/* ── Divider + Quick Access ── */}
                                <div style={{ margin: "0 14px", borderTop: "1px solid var(--t-border-light)" }}>
                                    <div style={{
                                        fontSize: 11, fontWeight: 500, color: "var(--t-text-faint)",
                                        padding: "10px 2px 6px",
                                    }}>
                                        الوصول السريع
                                    </div>
                                </div>

                                <div style={{ padding: "0 6px 4px" }}>
                                    {[
                                        { label: "القنوات", icon: MessageSquare, href: "/dashboard/settings/organization" },
                                        { label: "إدارة المستخدمين", icon: Users, href: "/dashboard/settings/organization" },
                                        { label: "الاشتراك والدفع", icon: CreditCard, href: "/dashboard/settings/organization" },
                                        { label: "إعدادات AI", icon: Brain, href: "/dashboard/settings/ai" },
                                    ].map((item) => (
                                        <button
                                            key={item.label}
                                            onClick={() => goTo(item.href)}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 10,
                                                width: "100%", padding: "8px 10px", borderRadius: 8,
                                                border: "none", background: "transparent",
                                                cursor: "pointer", transition: "background 0.12s",
                                                textAlign: "right", color: "inherit",
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = "var(--t-card-hover)" }}
                                            onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                                        >
                                            <item.icon size={15} style={{ color: "var(--t-text-muted)", flexShrink: 0 }} />
                                            <span style={{ fontSize: 13, color: "var(--t-text-secondary)", fontWeight: 500 }}>{item.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* ── Plan Footer ── */}
                                <div style={{
                                    margin: "2px 6px 6px",
                                    padding: "10px 10px",
                                    borderRadius: 10,
                                    background: "var(--t-surface)",
                                    border: "1px solid var(--t-border-light)",
                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                }}>
                                    <span style={{ fontSize: 12, color: "var(--t-text-faint)", fontWeight: 500 }}>الخطة الحالية</span>
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: 4,
                                        fontSize: 11, fontWeight: 700, color: "var(--t-text)",
                                        background: "var(--t-card-alt)",
                                        padding: "4px 10px", borderRadius: 20,
                                        border: "1px solid var(--t-border)",
                                    }}>
                                        <Zap size={10} />
                                        Growth
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── User section ── */}
                <div className="border-t border-gray-100 p-2.5">
                    {sidebarOpen ? (
                        <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
                                {user?.first_name?.charAt(0) || "U"}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-medium text-gray-700">{user?.first_name} {user?.last_name}</p>
                                <p className="flex items-center gap-1 text-[11px] text-gray-400">
                                    <Shield size={9} />
                                    {user?.role || "admin"}
                                </p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                                title="تسجيل الخروج"
                            >
                                <LogOut size={15} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleLogout}
                            className="flex w-full items-center justify-center rounded-lg p-2.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                            title="تسجيل الخروج"
                        >
                            <LogOut size={18} />
                        </button>
                    )}
                </div>
            </aside>

            {/* ── Main Content ── */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top bar */}
                <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
                    >
                        <Menu size={20} />
                    </button>

                    <div className="flex items-center gap-3">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="rounded-xl p-2.5 transition-all duration-200 hover:bg-gray-100"
                            title={theme === "light" ? "الوضع الداكن" : "الوضع الفاتح"}
                            style={{ color: "var(--t-text-muted)" }}
                        >
                            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
                        </button>

                        <div className="hidden text-left sm:block">
                            <p className="text-sm font-semibold text-gray-800">
                                {user?.first_name} {user?.last_name}
                            </p>
                            <p className="text-xs text-gray-400">{user?.email}</p>
                        </div>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-800 text-sm font-bold text-white">
                            {user?.first_name?.charAt(0) || "U"}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto bg-gray-50">
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
            `}</style>
        </div>
    )
}
