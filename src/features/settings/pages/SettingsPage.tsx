import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { Building2, User, ChevronLeft, Settings } from "lucide-react"
import { OrganizationTab } from "../components/OrganizationTab"
import { ProfileTab } from "../components/ProfileTab"

const SIDEBAR = [
    { key: "organization", label: "المؤسسة", icon: Building2 },
    { key: "profile", label: "الملف الشخصي", icon: User },
] as const

type SidebarKey = (typeof SIDEBAR)[number]["key"]

export function SettingsPage() {
    const [searchParams] = useSearchParams()
    const tabParam = searchParams.get("tab") as SidebarKey | null
    const [active, setActive] = useState<SidebarKey>(tabParam === "profile" ? "profile" : "organization")
    const [collapsed, setCollapsed] = useState(false)

    // Sync with URL tab param when it changes
    useEffect(() => {
        if (tabParam === "profile" || tabParam === "organization") {
            setActive(tabParam)
        }
    }, [tabParam])

    return (
        <div className="flex min-h-screen bg-[#fafafa]">

            {/* ── SIDEBAR ── */}
            <aside className={`shrink-0 bg-white border-l border-gray-200 transition-all duration-300
                              ${collapsed ? "w-[64px]" : "w-[240px]"}`}>
                <div className="sticky top-0 flex h-screen flex-col">

                    {/* header */}
                    <div className="flex items-center justify-between px-4 py-5 border-b border-gray-100">
                        {!collapsed && (
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-800">
                                    <Settings size={14} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-[14px] font-semibold text-gray-800">الإعدادات</h2>
                                    <p className="text-[11px] text-gray-400 mt-px">إدارة المؤسسة والحساب</p>
                                </div>
                            </div>
                        )}
                        <button onClick={() => setCollapsed(!collapsed)}
                            className={`flex h-7 w-7 items-center justify-center rounded-md text-gray-400
                                        hover:bg-gray-100 hover:text-gray-600 transition-colors
                                        ${collapsed ? "mx-auto" : ""}`}>
                            <ChevronLeft size={14}
                                className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
                        </button>
                    </div>

                    {/* nav */}
                    <nav className="flex-1 p-3 space-y-1">
                        {SIDEBAR.map(item => {
                            const Icon = item.icon
                            const on = active === item.key
                            return (
                                <button key={item.key} onClick={() => setActive(item.key)}
                                    title={collapsed ? item.label : undefined}
                                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium
                                               transition-colors duration-150
                                               ${on ? "bg-gray-100 text-gray-800" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"}
                                               ${collapsed ? "justify-center px-2" : ""}`}>
                                    <Icon size={16} strokeWidth={on ? 2 : 1.6} className="shrink-0" />
                                    {!collapsed && <span>{item.label}</span>}
                                </button>
                            )
                        })}
                    </nav>

                    {/* footer */}
                    {!collapsed && (
                        <div className="border-t border-gray-100 p-3">
                            <p className="text-[10px] text-gray-300 text-center">v2.0</p>
                        </div>
                    )}
                </div>
            </aside>

            {/* ── MAIN ── */}
            <main className="flex-1 min-w-0 overflow-y-auto">
                <div className="max-w-[960px] mx-auto px-6 py-8 sm:px-8 lg:px-10">

                    {/* breadcrumb + title */}
                    <header className="mb-7">
                        <div className="flex items-center gap-1.5 text-[12px] text-gray-400 mb-1.5">
                            <span>الإعدادات</span>
                            <span className="text-gray-300">←</span>
                            <span className="text-gray-600">{active === "organization" ? "المؤسسة" : "الملف الشخصي"}</span>
                        </div>
                        <h1 className="text-[22px] font-bold text-gray-800 tracking-[-0.02em]">
                            {active === "organization" ? "إعدادات المؤسسة" : "الملف الشخصي"}
                        </h1>
                        <p className="text-[13px] text-gray-400 mt-1">
                            {active === "organization"
                                ? "إدارة وتحديث بيانات المؤسسة"
                                : "إدارة معلومات حسابك الشخصي"}
                        </p>
                    </header>

                    {/* content */}
                    <div key={active} style={{ animation: "sFade .2s ease-out" }}>
                        {active === "organization" && <OrganizationTab />}
                        {active === "profile" && <ProfileTab />}
                    </div>
                </div>
            </main>

            <style>{`@keyframes sFade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    )
}
