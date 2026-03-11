import { useState } from "react"
import { Shield, Key, Users } from "lucide-react"
import { useRolePermissions } from "../hooks/use-roles"
import { PermissionsGrid } from "./PermissionsGrid"
import { RoleUsersSection } from "./RoleUsersSection"
import type { Role } from "../types"

interface Props {
    role: Role
}

type Tab = "users" | "permissions"

const CSS = `@keyframes rdFade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`

export function RoleDetail({ role }: Props) {
    const { data: permissions } = useRolePermissions(role.role)
    const [activeTab, setActiveTab] = useState<Tab>("users")

    const totalPerms = permissions?.reduce((acc, g) => acc + (g.actions?.length || 0), 0) || 0

    const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
        { key: "users", label: "المستخدمون", icon: Users },
        { key: "permissions", label: "الصلاحيات", icon: Key },
    ]

    return (
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 12, animation: "rdFade .2s ease-out" }}>
            <style>{CSS}</style>

            {/* ── HEADER CARD ── */}
            <div style={{
                borderRadius: 14, border: "1px solid var(--t-border-light, #eaedf0)",
                background: "var(--t-card, #fff)", overflow: "hidden",
            }}>
                {/* Gradient accent */}
                <div style={{ height: 3, background: "linear-gradient(90deg, var(--t-accent), var(--t-accent-secondary), var(--t-accent-light))" }} />

                <div style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 12,
                            background: "var(--t-brand-orange)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                        }}>
                            <Shield size={20} style={{ color: "#fff" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--t-text, var(--t-text))", margin: 0 }}>
                                    {role.name_ar}
                                </h2>
                                <span dir="ltr" style={{
                                    fontSize: 10.5, color: "var(--t-accent)", fontFamily: "monospace",
                                    background: "rgba(27,80,145,0.06)", padding: "2px 8px", borderRadius: 6,
                                    fontWeight: 600,
                                }}>
                                    {role.role}
                                </span>
                            </div>
                            <p style={{ fontSize: 12, color: "var(--t-text-faint, var(--t-text-faint))", margin: "3px 0 0" }}>
                                {role.name_en}
                                {role.description_ar && <> · {role.description_ar}</>}
                            </p>
                        </div>
                    </div>

                    {/* Meta bar */}
                    <div style={{
                        marginTop: 14, paddingTop: 12,
                        borderTop: "1px solid var(--t-border-light, #eaedf0)",
                        display: "flex", alignItems: "center", gap: 16,
                    }}>
                        <div style={{
                            display: "flex", alignItems: "center", gap: 5,
                            padding: "4px 10px", borderRadius: 6,
                            background: "rgba(27,80,145,0.04)",
                        }}>
                            <Key size={12} style={{ color: "var(--t-accent)" }} />
                            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--t-accent)" }}>{totalPerms}</span>
                            <span style={{ fontSize: 11, color: "var(--t-text-faint, var(--t-text-faint))" }}>صلاحية</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── TABS ── */}
            <div style={{
                display: "flex", gap: 2, padding: 3,
                borderRadius: 10,
                background: "var(--t-surface, var(--t-surface))",
            }}>
                {tabs.map(tab => {
                    const isActive = activeTab === tab.key
                    const Icon = tab.icon
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                flex: 1,
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                padding: "9px 16px", borderRadius: 8,
                                border: "none",
                                background: isActive ? "var(--t-card, #fff)" : "transparent",
                                boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                                color: isActive ? "var(--t-accent)" : "var(--t-text-faint, var(--t-text-faint))",
                                fontSize: 12, fontWeight: isActive ? 600 : 500,
                                cursor: "pointer", fontFamily: "inherit",
                                transition: "all 0.15s",
                            }}
                        >
                            <Icon size={14} />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* ── TAB CONTENT ── */}
            <div style={{
                borderRadius: 14, border: "1px solid var(--t-border-light, #eaedf0)",
                background: "var(--t-card, #fff)",
                padding: 20, minHeight: 280,
                animation: "rdFade .15s ease-out",
            }}>
                {activeTab === "users" && <RoleUsersSection role={role.role} />}
                {activeTab === "permissions" && <PermissionsGrid role={role.role} />}
            </div>
        </div>
    )
}
