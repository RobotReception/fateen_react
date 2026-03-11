import { Shield, RefreshCw, Loader2 } from "lucide-react"
import type { Role } from "../types"
import { CreateRoleForm } from "./CreateRoleForm"

interface Props {
    roles: Role[] | undefined
    isLoading: boolean
    isError: boolean
    refetch: () => void
    activeRole: string | null
    onSelect: (role: string) => void
}

const ROLE_GRADIENTS = [
    "var(--t-gradient-accent)",
    "var(--t-gradient-accent)",
    "linear-gradient(135deg, #7c3aed, #a855f7)",
    "linear-gradient(135deg, #0891b2, #06b6d4)",
    "var(--t-gradient-accent)",
]

function hashCode(s: string): number {
    let h = 0
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
    return Math.abs(h)
}

export function RolesList({ roles, isLoading, isError, refetch, activeRole, onSelect }: Props) {
    return (
        <div style={{
            width: 260, flexShrink: 0,
            borderRadius: 14, border: "1px solid var(--t-border-light, #eaedf0)",
            background: "var(--t-card, #fff)", overflow: "hidden",
            display: "flex", flexDirection: "column",
        }}>
            {/* header */}
            <div style={{
                padding: "14px 16px",
                borderBottom: "1px solid var(--t-border-light, #eaedf0)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
                <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text, var(--t-text))", margin: 0 }}>الأدوار</h3>
                    <p style={{ fontSize: 11, color: "var(--t-text-faint, var(--t-text-faint))", margin: "2px 0 0", fontWeight: 500 }}>
                        {roles?.length || 0} دور
                    </p>
                </div>
                <div style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: "rgba(27,80,145,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <Shield size={14} style={{ color: "var(--t-accent)" }} />
                </div>
            </div>

            {/* list */}
            <div style={{ flex: 1, overflowY: "auto", padding: 6 }}>
                {isLoading && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0" }}>
                        <Loader2 size={18} className="animate-spin" style={{ color: "var(--t-accent)" }} />
                    </div>
                )}

                {isError && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0", gap: 8 }}>
                        <p style={{ fontSize: 12, color: "var(--t-text-faint, var(--t-text-faint))", fontWeight: 500, margin: 0 }}>فشل التحميل</p>
                        <button onClick={refetch} style={{
                            display: "flex", alignItems: "center", gap: 4,
                            fontSize: 11, fontWeight: 600, color: "var(--t-accent)",
                            background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
                        }}>
                            <RefreshCw size={11} /> إعادة
                        </button>
                    </div>
                )}

                {roles?.map((r, idx) => {
                    const on = activeRole === r.role
                    const gradient = ROLE_GRADIENTS[hashCode(r.role) % ROLE_GRADIENTS.length]
                    return (
                        <button key={r.role} onClick={() => onSelect(r.role)}
                            style={{
                                display: "flex", width: "100%", alignItems: "center", gap: 10,
                                borderRadius: 10, padding: "10px 12px",
                                border: on ? "1px solid rgba(27,80,145,0.15)" : "1px solid transparent",
                                background: on ? "rgba(27,80,145,0.04)" : "transparent",
                                cursor: "pointer", textAlign: "right",
                                transition: "all .12s", marginBottom: 3,
                                animation: `rpFade .2s ease-out ${idx * 0.03}s both`,
                            }}
                            onMouseEnter={e => { if (!on) e.currentTarget.style.background = "var(--t-surface, #f5f5f5)" }}
                            onMouseLeave={e => { if (!on) e.currentTarget.style.background = "transparent" }}
                        >
                            <div style={{
                                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                                background: on ? gradient : "var(--t-surface, #f0f1f3)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "all .15s",
                            }}>
                                <Shield size={14} strokeWidth={2} style={{
                                    color: on ? "#fff" : "var(--t-text-faint, var(--t-text-faint))",
                                }} />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <p style={{
                                    fontSize: 13, fontWeight: on ? 700 : 500,
                                    color: on ? "var(--t-accent)" : "var(--t-text, var(--t-text-secondary))",
                                    margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                }}>
                                    {r.name_ar}
                                </p>
                                <p style={{
                                    fontSize: 10.5, fontFamily: "monospace",
                                    color: on ? "rgba(27,80,145,0.5)" : "var(--t-text-faint, var(--t-text-faint))",
                                    margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                }} dir="ltr">
                                    {r.role}
                                </p>
                            </div>
                            {on && (
                                <div style={{
                                    width: 3, height: 20, borderRadius: 2,
                                    background: "var(--t-brand-orange)", flexShrink: 0,
                                }} />
                            )}
                        </button>
                    )
                })}
            </div>

            {/* create form */}
            <CreateRoleForm onCreated={onSelect} />

            <style>{`@keyframes rpFade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`}</style>
        </div>
    )
}
