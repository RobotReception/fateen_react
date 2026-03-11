import { useState } from "react"
import { toast } from "sonner"
import type { AdminUser } from "../types"
import {
    Shield,
    Mail,
    Phone,
    CheckCircle,
    XCircle,
    Pencil,
    KeyRound,
    ToggleLeft,
    ToggleRight,
    Monitor,
    Trash2,
    Loader2,
    Users,
} from "lucide-react"
import { updateUserStatus, deleteUser } from "../services/users-service"
import { useAuthStore } from "@/stores/auth-store"
import { UserSessionsDialog } from "./UserSessionsDialog"

interface UsersTableProps {
    users: AdminUser[]
    loading: boolean
    onEdit: (user: AdminUser) => void
    onSetPassword: (user: AdminUser) => void
    onRefresh: () => void
}

const ROLE_COLORS: Record<string, { bg: string; color: string; label: string }> = {
    owner: { bg: "rgba(139,92,246,0.08)", color: "#7c3aed", label: "مالك" },
    admin: { bg: "rgba(27,80,145,0.08)", color: "var(--t-accent)", label: "مدير" },
    manager: { bg: "rgba(6,182,212,0.08)", color: "#0891b2", label: "مشرف" },
    analyst: { bg: "rgba(217,119,6,0.08)", color: "#d97706", label: "محلل" },
    user: { bg: "var(--t-surface, #f5f5f5)", color: "var(--t-text-secondary, var(--t-text-muted))", label: "مستخدم" },
}

const AVATAR_GRADIENTS = [
    "var(--t-gradient-accent)",
    "linear-gradient(135deg, #0891b2, #06b6d4)",
    "linear-gradient(135deg, #7c3aed, #a855f7)",
    "var(--t-gradient-accent)",
    "var(--t-gradient-accent)",
]

function getRoleStyle(role: string) {
    return ROLE_COLORS[role] || { bg: "var(--t-surface, #f5f5f5)", color: "var(--t-text-secondary, var(--t-text-muted))", label: role }
}

function getDisplayName(u: AdminUser): string {
    if (u.full_name) return u.full_name
    if (u.first_name || u.last_name) return `${u.first_name || ""} ${u.last_name || ""}`.trim()
    return u.email
}

function getInitials(u: AdminUser): string {
    if (u.first_name && u.last_name) return `${u.first_name.charAt(0)}${u.last_name.charAt(0)}`
    if (u.full_name) {
        const parts = u.full_name.split(" ")
        return parts.length >= 2 ? `${parts[0].charAt(0)}${parts[1].charAt(0)}` : u.full_name.charAt(0)
    }
    return u.email.charAt(0).toUpperCase()
}

function hashCode(s: string): number {
    let h = 0
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
    return Math.abs(h)
}

/* ── Action button component ── */
function ActionBtn({ onClick, disabled, title, color, hoverBg, children }: {
    onClick: () => void; disabled?: boolean; title: string
    color: string; hoverBg: string; children: React.ReactNode
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            style={{
                width: 30, height: 30, borderRadius: 7, border: "none",
                background: "transparent", cursor: disabled ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color, transition: "all .12s", opacity: disabled ? 0.4 : 1,
            }}
            onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = hoverBg }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
        >
            {children}
        </button>
    )
}

export function UsersTable({ users, loading, onEdit, onSetPassword, onRefresh }: UsersTableProps) {
    const { user: currentUser } = useAuthStore()
    const tenantId = currentUser?.tenant_id || ""

    const [actionLoading, setActionLoading] = useState<Record<string, string | null>>({})
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
    const [sessionsUser, setSessionsUser] = useState<AdminUser | null>(null)
    const [hoveredRow, setHoveredRow] = useState<string | null>(null)

    const setUserLoading = (userId: string, action: string | null) => {
        setActionLoading((prev) => ({ ...prev, [userId]: action }))
    }

    const handleToggleStatus = async (user: AdminUser) => {
        if (!tenantId) return
        setUserLoading(user.user_id, "status")
        try {
            const result = await updateUserStatus(
                { user_id: user.user_id, is_active: !user.is_active },
                tenantId
            )
            if (result.success) {
                toast.success(user.is_active ? "تم تعطيل المستخدم" : "تم تفعيل المستخدم")
                onRefresh()
            }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } }
            toast.error(error.response?.data?.message || "فشل تحديث الحالة")
        } finally {
            setUserLoading(user.user_id, null)
        }
    }

    const handleDelete = async (user: AdminUser) => {
        if (confirmDelete !== user.user_id) {
            setConfirmDelete(user.user_id)
            setTimeout(() => setConfirmDelete((prev) => (prev === user.user_id ? null : prev)), 3000)
            return
        }
        if (!tenantId) return
        setUserLoading(user.user_id, "delete")
        setConfirmDelete(null)
        try {
            const result = await deleteUser({ user_id: user.user_id }, tenantId)
            if (result.success) {
                toast.success("تم حذف المستخدم نهائياً")
                onRefresh()
            }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } }
            toast.error(error.response?.data?.message || "فشل حذف المستخدم")
        } finally {
            setUserLoading(user.user_id, null)
        }
    }

    /* ── Loading skeleton ── */
    if (loading) {
        return (
            <div style={{ padding: 20 }}>
                {[...Array(5)].map((_, i) => (
                    <div key={i} style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "12px 0",
                        borderBottom: i < 4 ? "1px solid var(--t-border-light, #f0f1f3)" : "none",
                        animation: `usrsFade .3s ease-out ${i * 0.06}s both`,
                    }}>
                        <div style={{
                            width: 38, height: 38, borderRadius: 10,
                            background: "linear-gradient(90deg, var(--t-surface,#f0f0f0) 25%, #e8e8e8 50%, var(--t-surface,#f0f0f0) 75%)",
                            backgroundSize: "200% 100%", animation: "usrsShimmer 1.5s infinite",
                        }} />
                        <div style={{ flex: 1 }}>
                            <div style={{
                                width: 100 + (i * 20), height: 12, borderRadius: 6,
                                background: "var(--t-surface, #f0f0f0)", marginBottom: 6,
                            }} />
                            <div style={{ width: 140, height: 10, borderRadius: 5, background: "var(--t-surface, #f5f5f5)" }} />
                        </div>
                        <div style={{ width: 60, height: 22, borderRadius: 12, background: "var(--t-surface, #f0f0f0)" }} />
                    </div>
                ))}
                <style>{`@keyframes usrsShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
                @keyframes usrsFade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`}</style>
            </div>
        )
    }

    /* ── Empty ── */
    if (users.length === 0) {
        return (
            <div style={{ textAlign: "center", padding: "48px 20px" }}>
                <div style={{
                    width: 56, height: 56, borderRadius: 14,
                    background: "rgba(27,80,145,0.06)",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 12,
                }}>
                    <Users size={24} style={{ color: "var(--t-accent)" }} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--t-text, var(--t-text))", margin: "0 0 4px" }}>لا يوجد مستخدمين</h3>
                <p style={{ fontSize: 12, color: "var(--t-text-faint, var(--t-text-faint))", margin: 0 }}>أضف مستخدمين جدد للبدء</p>
            </div>
        )
    }

    /* ── Table ── */
    const thStyle: React.CSSProperties = {
        padding: "10px 16px",
        fontSize: 10.5, fontWeight: 600, letterSpacing: "0.04em",
        color: "var(--t-text-faint, var(--t-text-faint))",
        textAlign: "right", whiteSpace: "nowrap",
        textTransform: "uppercase",
    }

    return (
        <>
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid var(--t-border-light, #eaedf0)" }}>
                            <th style={thStyle}>المستخدم</th>
                            <th style={thStyle}>البريد</th>
                            <th style={thStyle}>الهاتف</th>
                            <th style={thStyle}>الدور</th>
                            <th style={thStyle}>الحالة</th>
                            <th style={{ ...thStyle, textAlign: "center" }}>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u, idx) => {
                            const roleStyle = getRoleStyle(u.role)
                            const userLoading = actionLoading[u.user_id]
                            const displayName = getDisplayName(u)
                            const initials = getInitials(u)
                            const gradient = AVATAR_GRADIENTS[hashCode(u.user_id) % AVATAR_GRADIENTS.length]
                            const isHovered = hoveredRow === u.user_id

                            return (
                                <tr
                                    key={u.user_id}
                                    onMouseEnter={() => setHoveredRow(u.user_id)}
                                    onMouseLeave={() => setHoveredRow(null)}
                                    style={{
                                        borderBottom: "1px solid var(--t-border-light, #f0f1f3)",
                                        background: isHovered ? "var(--t-surface, #fafbfc)" : "transparent",
                                        transition: "background .1s",
                                        animation: `usrsFade .25s ease-out ${idx * 0.03}s both`,
                                    }}
                                >
                                    {/* User avatar + name */}
                                    <td style={{ padding: "10px 16px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div style={{
                                                width: 38, height: 38, borderRadius: 10,
                                                background: u.is_active ? gradient : "var(--t-surface, var(--t-border))",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                flexShrink: 0,
                                            }}>
                                                <span style={{ fontSize: 13, fontWeight: 700, color: u.is_active ? "#fff" : "var(--t-text-faint, var(--t-text-faint))" }}>
                                                    {initials}
                                                </span>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t-text, var(--t-text))", lineHeight: 1.3 }}>
                                                    {displayName}
                                                </div>
                                                <div style={{ fontSize: 11, color: "var(--t-text-faint, var(--t-text-faint))", marginTop: 1 }}>
                                                    {u.username || u.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Email */}
                                    <td style={{ padding: "10px 16px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--t-text-secondary, var(--t-text-muted))", fontFamily: "monospace" }} dir="ltr">
                                            <Mail size={12} style={{ color: "var(--t-text-faint, #c4c9d0)" }} />
                                            {u.email}
                                        </div>
                                    </td>

                                    {/* Phone */}
                                    <td style={{ padding: "10px 16px" }}>
                                        {u.phone ? (
                                            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--t-text-secondary, var(--t-text-muted))", fontFamily: "monospace" }} dir="ltr">
                                                <Phone size={12} style={{ color: "var(--t-text-faint, #c4c9d0)" }} />
                                                {u.phone}
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: 11, color: "var(--t-text-faint, var(--t-border-medium))" }}>—</span>
                                        )}
                                    </td>

                                    {/* Role badge */}
                                    <td style={{ padding: "10px 16px" }}>
                                        <span style={{
                                            display: "inline-flex", alignItems: "center", gap: 4,
                                            padding: "3px 10px", borderRadius: 6,
                                            background: roleStyle.bg, color: roleStyle.color,
                                            fontSize: 11, fontWeight: 600,
                                        }}>
                                            <Shield size={10} />
                                            {roleStyle.label}
                                        </span>
                                    </td>

                                    {/* Status */}
                                    <td style={{ padding: "10px 16px" }}>
                                        <div style={{
                                            display: "inline-flex", alignItems: "center", gap: 4,
                                            padding: "3px 10px", borderRadius: 6,
                                            background: u.is_active ? "rgba(22,163,74,0.06)" : "rgba(239,68,68,0.06)",
                                            color: u.is_active ? "#16a34a" : "var(--t-danger)",
                                            fontSize: 11, fontWeight: 600,
                                        }}>
                                            {u.is_active ? <CheckCircle size={10} /> : <XCircle size={10} />}
                                            {u.is_active ? "نشط" : "معطل"}
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    <td style={{ padding: "10px 16px" }}>
                                        <div style={{
                                            display: "flex", alignItems: "center", justifyContent: "center", gap: 2,
                                            opacity: isHovered ? 1 : 0.5, transition: "opacity .15s",
                                        }}>
                                            <ActionBtn onClick={() => onEdit(u)} title="تعديل البيانات"
                                                color="var(--t-text-faint, var(--t-text-faint))" hoverBg="rgba(217,119,6,0.08)">
                                                <Pencil size={14} />
                                            </ActionBtn>
                                            <ActionBtn onClick={() => onSetPassword(u)} title="تعيين كلمة المرور"
                                                color="var(--t-text-faint, var(--t-text-faint))" hoverBg="rgba(27,80,145,0.06)">
                                                <KeyRound size={14} />
                                            </ActionBtn>
                                            <ActionBtn onClick={() => handleToggleStatus(u)} disabled={userLoading === "status"}
                                                title={u.is_active ? "تعطيل المستخدم" : "تفعيل المستخدم"}
                                                color={u.is_active ? "var(--t-text-faint, var(--t-text-faint))" : "#16a34a"}
                                                hoverBg={u.is_active ? "rgba(234,179,8,0.06)" : "rgba(22,163,74,0.06)"}>
                                                {userLoading === "status" ? <Loader2 size={14} className="animate-spin" /> :
                                                    u.is_active ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                                            </ActionBtn>
                                            <ActionBtn onClick={() => setSessionsUser(u)} title="عرض الجلسات"
                                                color="var(--t-text-faint, var(--t-text-faint))" hoverBg="rgba(139,92,246,0.06)">
                                                <Monitor size={14} />
                                            </ActionBtn>
                                            <ActionBtn onClick={() => handleDelete(u)} disabled={userLoading === "delete"}
                                                title={confirmDelete === u.user_id ? "اضغط مرة أخرى للتأكيد" : "حذف المستخدم"}
                                                color={confirmDelete === u.user_id ? "var(--t-danger)" : "var(--t-text-faint, var(--t-text-faint))"}
                                                hoverBg="rgba(239,68,68,0.06)">
                                                {userLoading === "delete" ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                            </ActionBtn>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                <style>{`
                    @keyframes usrsFade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
                `}</style>
            </div>

            <UserSessionsDialog
                open={!!sessionsUser}
                user={sessionsUser}
                onClose={() => setSessionsUser(null)}
            />
        </>
    )
}
