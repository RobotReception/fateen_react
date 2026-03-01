import { useState, useCallback, useMemo, useEffect } from "react"
import { Shield, AlertCircle, RefreshCw } from "lucide-react"
import { useRoles } from "../hooks/use-roles"
import { RolesList } from "../components/RolesList"
import { RoleDetail } from "../components/RoleDetail"
import { FetchingBar } from "@/components/ui/FetchingBar"

const CSS = `@keyframes rpFade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`

export function RolesPage({ embedded = false }: { embedded?: boolean }) {
    const { data: roles, isLoading, isFetching, isError, refetch } = useRoles()
    const [activeRole, setActiveRole] = useState<string | null>(null)

    const bg = isFetching && !isLoading

    const selectedRole = useMemo(
        () => roles?.find(r => r.role === activeRole) || null,
        [roles, activeRole]
    )

    const handleSelect = useCallback((role: string) => setActiveRole(role), [])

    useEffect(() => {
        if (roles && roles.length > 0 && !activeRole) {
            setActiveRole(roles[0].role)
        }
    }, [roles, activeRole])

    return (
        <div className={embedded ? "max-w-[1200px] mx-auto" : "max-w-[1200px] mx-auto"} style={{ animation: "rpFade .25s ease-out" }}>
            <style>{CSS}</style>
            <FetchingBar visible={bg} />

            {/* Header */}
            {!embedded && (
                <header style={{ marginBottom: 20 }}>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--t-text, #111827)", margin: 0, letterSpacing: "-0.01em" }}>
                        الأدوار والصلاحيات
                    </h1>
                    <p style={{ fontSize: 12, color: "var(--t-text-faint, #9ca3af)", marginTop: 3 }}>
                        إنشاء الأدوار وإدارة الصلاحيات وتعيين المستخدمين
                    </p>
                </header>
            )}

            {/* Error state */}
            {isError && !roles && (
                <div style={{
                    borderRadius: 12, border: "1px solid var(--t-border-light, #eaedf0)",
                    background: "var(--t-card, #fff)",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    padding: "60px 0",
                }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 10,
                        background: "rgba(0,71,134,0.06)",
                        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10,
                    }}>
                        <AlertCircle size={18} style={{ color: "#004786" }} />
                    </div>
                    <p style={{ fontSize: 13, color: "var(--t-text-faint, #9ca3af)", margin: "0 0 10px" }}>فشل تحميل الأدوار</p>
                    <button onClick={() => refetch()} style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "7px 16px", borderRadius: 8,
                        border: "none", background: "#004786", color: "#fff",
                        fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                    }}>
                        <RefreshCw size={12} /> إعادة المحاولة
                    </button>
                </div>
            )}

            {/* Main layout */}
            {(!isError || roles) && (
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <RolesList
                        roles={roles}
                        isLoading={isLoading}
                        isError={isError}
                        refetch={refetch}
                        activeRole={activeRole}
                        onSelect={handleSelect}
                    />

                    {selectedRole ? (
                        <RoleDetail
                            key={selectedRole.role}
                            role={selectedRole}
                        />
                    ) : !isLoading && (
                        <div style={{
                            flex: 1, borderRadius: 14,
                            border: "1px solid var(--t-border-light, #eaedf0)",
                            background: "var(--t-card, #fff)",
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                            padding: "80px 0",
                        }}>
                            <div style={{
                                width: 52, height: 52, borderRadius: 14,
                                background: "rgba(0,71,134,0.06)",
                                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12,
                            }}>
                                <Shield size={24} style={{ color: "#004786" }} />
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--t-text, #111827)", margin: 0 }}>اختر دوراً من القائمة</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
