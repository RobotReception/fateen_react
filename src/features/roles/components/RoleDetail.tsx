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

export function RoleDetail({ role }: Props) {
    const { data: permissions } = useRolePermissions(role.role)
    const [activeTab, setActiveTab] = useState<Tab>("users")

    const totalPerms = permissions?.reduce((acc, g) => acc + (g.actions?.length || 0), 0) || 0

    const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
        { key: "users", label: "المستخدمون", icon: Users },
        { key: "permissions", label: "الصلاحيات", icon: Key },
    ]

    return (
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16, animation: "rdFade .2s ease-out" }}>

            {/* ── HEADER ── */}
            <div style={{
                borderRadius: 12, border: "1px solid var(--t-border)", background: "var(--t-card)", overflow: "hidden",
            }}>
                <div style={{ padding: "18px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        {/* Icon */}
                        <div style={{
                            width: 44, height: 44, borderRadius: 12,
                            background: "var(--t-accent)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                        }}>
                            <Shield size={20} style={{ color: "var(--t-text-on-accent)" }} />
                        </div>
                        {/* Name */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--t-text)", margin: 0 }}>
                                    {role.name_ar}
                                </h2>
                                <span dir="ltr" style={{
                                    fontSize: 11, color: "var(--t-text-faint)", fontFamily: "monospace",
                                    background: "var(--t-surface)", padding: "2px 8px", borderRadius: 6,
                                }}>
                                    {role.role}
                                </span>
                            </div>
                            <p style={{ fontSize: 13, color: "var(--t-text-muted)", margin: "3px 0 0" }}>
                                {role.name_en}
                                {role.description_ar && <> · {role.description_ar}</>}
                            </p>
                        </div>
                    </div>

                    {/* Meta */}
                    <div style={{
                        marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--t-border-light)",
                        display: "flex", alignItems: "center", gap: 20,
                    }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--t-text-muted)" }}>
                            <Key size={13} style={{ color: "var(--t-text-faint)" }} />
                            <strong style={{ color: "var(--t-text)" }}>{totalPerms}</strong> صلاحية مفعّلة
                        </span>
                    </div>
                </div>
            </div>

            {/* ── TABS ── */}
            <div style={{
                display: "flex", gap: 4, padding: 4,
                borderRadius: 10, background: "var(--t-surface)",
                border: "1px solid var(--t-border)",
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
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                padding: "10px 16px", borderRadius: 8,
                                border: isActive ? "1px solid var(--t-border)" : "1px solid transparent",
                                background: isActive ? "var(--t-card)" : "transparent",
                                boxShadow: isActive ? "0 1px 3px var(--t-shadow)" : "none",
                                color: isActive ? "var(--t-text)" : "var(--t-text-faint)",
                                fontSize: 13, fontWeight: isActive ? 600 : 500,
                                cursor: "pointer",
                                transition: "all 0.15s",
                            }}
                        >
                            <Icon size={15} style={{ color: isActive ? "var(--t-text-secondary)" : "var(--t-text-faint)" }} />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* ── TAB CONTENT ── */}
            <div style={{
                borderRadius: 12, border: "1px solid var(--t-border)", background: "var(--t-card)",
                padding: 20, minHeight: 280,
                animation: "rdFade .15s ease-out",
            }}>
                {activeTab === "users" && (
                    <RoleUsersSection role={role.role} />
                )}
                {activeTab === "permissions" && (
                    <PermissionsGrid role={role.role} />
                )}
            </div>

            <style>{`
                @keyframes rdFade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
            `}</style>
        </div>
    )
}
