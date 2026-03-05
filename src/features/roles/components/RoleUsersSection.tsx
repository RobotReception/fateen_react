import { useState, useCallback, useRef, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { UserPlus, X, Loader2, Users, Search, Mail, Phone, UserX, ChevronDown } from "lucide-react"
import { useAssignUserRole, useRemoveUserRole } from "../hooks/use-roles"
import { getAllUsers, type AdminUser } from "../services/admin-service"
import { useAuthStore } from "@/stores/auth-store"
import { ActionGuard } from "@/components/guards/ActionGuard"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"

interface Props { role: string }

const AVATAR_GRADIENTS = [
    "linear-gradient(135deg, #004786, #0072b5)",
    "linear-gradient(135deg, #0891b2, #06b6d4)",
    "linear-gradient(135deg, #7c3aed, #a855f7)",
    "linear-gradient(135deg, #0072b5, #0098d6)",
    "linear-gradient(135deg, #004786, #0098d6)",
]

function hashCode(s: string): number {
    let h = 0
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
    return Math.abs(h)
}

export function RoleUsersSection({ role }: Props) {
    const tenantId = useAuthStore(s => s.user?.tenant_id || "")
    const isAuth = useAuthStore(s => s.isAuthenticated)
    const qc = useQueryClient()

    const [showAdd, setShowAdd] = useState(false)
    const [pickerSearch, setPickerSearch] = useState("")
    const [pickerOpen, setPickerOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [searchFocused, setSearchFocused] = useState(false)
    const assignMut = useAssignUserRole()
    const removeMut = useRemoveUserRole()
    const dropdownRef = useRef<HTMLDivElement>(null)

    const { data, isLoading } = useQuery({
        queryKey: ["adminUsers", "byRole", role],
        queryFn: () => getAllUsers({ role, page_size: 200 }, tenantId),
        enabled: !!role && !!tenantId && isAuth,
        select: (res) => {
            const items = res?.data?.items ?? []
            return Array.isArray(items) ? items : []
        },
        staleTime: 60 * 1000,
    })

    const { data: allUsersData, isLoading: allUsersLoading } = useQuery({
        queryKey: ["adminUsers", "all", pickerSearch],
        queryFn: () => getAllUsers({ page_size: 50, search: pickerSearch || undefined }, tenantId),
        enabled: showAdd && !!tenantId && isAuth,
        select: (res) => {
            const items = res?.data?.items ?? []
            return Array.isArray(items) ? items : []
        },
        staleTime: 30 * 1000,
    })

    const users: AdminUser[] = data || []
    const allUsers: AdminUser[] = allUsersData || []
    const assignedIds = new Set(users.map(u => u.user_id))
    const availableUsers = allUsers.filter(u => !assignedIds.has(u.user_id))

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setPickerOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClick)
        return () => document.removeEventListener("mousedown", handleClick)
    }, [])

    const filteredUsers = searchQuery.trim()
        ? users.filter(u =>
            u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.user_id?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : users

    const handleAssign = useCallback((user: AdminUser) => {
        setSelectedUser(user)
        setPickerOpen(false)
        assignMut.mutate({ user_id: user.user_id, role }, {
            onSuccess: () => {
                setSelectedUser(null); setShowAdd(false); setPickerSearch("")
                qc.invalidateQueries({ queryKey: ["adminUsers", "byRole", role] })
            },
            onSettled: () => { setSelectedUser(null) },
        })
    }, [role, assignMut, qc])

    const handleRemove = useCallback((uid: string, name: string) => {
        if (!confirm(`هل تريد إزالة "${name}" من دور "${role}"؟`)) return
        removeMut.mutate({ user_id: uid, role }, {
            onSuccess: () => { qc.invalidateQueries({ queryKey: ["adminUsers", "byRole", role] }) },
        })
    }, [role, removeMut, qc])

    const getInitials = (name: string) => {
        if (!name) return "?"
        const parts = name.trim().split(/\s+/)
        if (parts.length >= 2) return parts[0][0] + parts[1][0]
        return parts[0].slice(0, 2)
    }

    return (
        <div>
            {/* ── Header ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: 9,
                        background: "linear-gradient(135deg, #004786, #0072b5)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <Users size={15} style={{ color: "#fff" }} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text, #111827)", margin: 0 }}>المستخدمون</h3>
                        <p style={{ fontSize: 11, color: "var(--t-text-faint, #9ca3af)", margin: "1px 0 0" }}>
                            {users.length} مستخدم بهذا الدور
                        </p>
                    </div>
                </div>

                <ActionGuard pageBit={PAGE_BITS.ROLES} actionBit={ACTION_BITS.ASSIGN_ROLE}>
                    <button
                        onClick={() => { setShowAdd(!showAdd); setPickerSearch(""); setSelectedUser(null); setPickerOpen(false) }}
                        style={{
                            display: "flex", alignItems: "center", gap: 5,
                            padding: "7px 14px", borderRadius: 8, border: "none",
                            background: showAdd ? "var(--t-surface, #f3f4f6)" : "#004786",
                            color: showAdd ? "var(--t-text-faint, #6b7280)" : "#fff",
                            fontSize: 12, fontWeight: 600,
                            cursor: "pointer", fontFamily: "inherit",
                            transition: "all 0.15s",
                            boxShadow: showAdd ? "none" : "0 1px 3px rgba(0,71,134,0.15)",
                        }}
                    >
                        {showAdd ? <X size={13} /> : <UserPlus size={13} />}
                        {showAdd ? "إلغاء" : "تعيين مستخدم"}
                    </button>
                </ActionGuard>
            </div>

            {/* ── User Picker ── */}
            {showAdd && (
                <div style={{
                    padding: 14, marginBottom: 14,
                    borderRadius: 10, border: "1px solid var(--t-border-light, #eaedf0)",
                    background: "var(--t-surface, #fafbfc)",
                    animation: "rusSlide .2s ease-out",
                }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--t-text-secondary, #6b7280)", margin: "0 0 8px" }}>
                        اختر مستخدم لتعيينه لهذا الدور
                    </p>

                    <div ref={dropdownRef} style={{ position: "relative" }}>
                        <div
                            onClick={() => setPickerOpen(true)}
                            style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "9px 12px", borderRadius: 8,
                                border: `1.5px solid ${pickerOpen ? "#004786" : "var(--t-border, #e0e3e7)"}`,
                                background: "var(--t-card, #fff)", cursor: "pointer",
                                transition: "border-color 0.15s",
                                boxShadow: pickerOpen ? "0 0 0 3px rgba(0,71,134,0.06)" : "none",
                            }}
                        >
                            {selectedUser ? (
                                <>
                                    <div style={{
                                        width: 26, height: 26, borderRadius: 7,
                                        background: AVATAR_GRADIENTS[hashCode(selectedUser.user_id) % AVATAR_GRADIENTS.length],
                                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                    }}>
                                        <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>{getInitials(selectedUser.full_name)}</span>
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t-text, #111827)", flex: 1 }}>{selectedUser.full_name}</span>
                                    <span style={{ fontSize: 11, color: "var(--t-text-faint, #9ca3af)" }}>{selectedUser.email}</span>
                                </>
                            ) : (
                                <>
                                    <Search size={13} style={{ color: "var(--t-text-faint, #9ca3af)" }} />
                                    <input
                                        value={pickerSearch}
                                        onChange={e => { setPickerSearch(e.target.value); setPickerOpen(true) }}
                                        onFocus={() => setPickerOpen(true)}
                                        placeholder="ابحث بالاسم أو البريد الإلكتروني..."
                                        style={{
                                            flex: 1, border: "none", background: "transparent",
                                            fontSize: 12, color: "var(--t-text, #111827)", outline: "none",
                                        }}
                                    />
                                    <ChevronDown size={13} style={{ color: "var(--t-text-faint, #9ca3af)", flexShrink: 0 }} />
                                </>
                            )}
                        </div>

                        {/* Dropdown list */}
                        {pickerOpen && (
                            <div style={{
                                position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                                maxHeight: 260, overflowY: "auto",
                                borderRadius: 10, border: "1px solid var(--t-border-light, #eaedf0)",
                                background: "var(--t-card, #fff)",
                                boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
                                zIndex: 50, animation: "rusSlide .15s ease-out",
                            }}>
                                {allUsersLoading ? (
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 0" }}>
                                        <Loader2 size={15} className="animate-spin" style={{ color: "#004786" }} />
                                        <span style={{ fontSize: 11, color: "var(--t-text-faint, #9ca3af)", marginRight: 6 }}>جارٍ البحث...</span>
                                    </div>
                                ) : availableUsers.length === 0 ? (
                                    <div style={{ padding: "18px 0", textAlign: "center" }}>
                                        <p style={{ fontSize: 12, color: "var(--t-text-faint, #9ca3af)", margin: 0 }}>
                                            {pickerSearch ? `لا توجد نتائج لـ "${pickerSearch}"` : "لا يوجد مستخدمون متاحون"}
                                        </p>
                                    </div>
                                ) : (
                                    availableUsers.map(user => (
                                        <div
                                            key={user.user_id}
                                            onClick={() => handleAssign(user)}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 10,
                                                padding: "9px 12px", cursor: "pointer",
                                                borderBottom: "1px solid var(--t-border-light, #f0f1f3)",
                                                transition: "background 0.1s",
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.background = "var(--t-surface, #fafbfc)")}
                                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                        >
                                            {user.profile_picture ? (
                                                <img src={user.profile_picture} alt="" style={{
                                                    width: 30, height: 30, borderRadius: 8, objectFit: "cover", flexShrink: 0,
                                                }} />
                                            ) : (
                                                <div style={{
                                                    width: 30, height: 30, borderRadius: 8,
                                                    background: AVATAR_GRADIENTS[hashCode(user.user_id) % AVATAR_GRADIENTS.length],
                                                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                                }}>
                                                    <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", textTransform: "uppercase" }}>
                                                        {getInitials(user.full_name)}
                                                    </span>
                                                </div>
                                            )}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t-text, #111827)" }}>{user.full_name || "—"}</span>
                                                    {!user.is_active && (
                                                        <span style={{
                                                            fontSize: 9, fontWeight: 600, color: "#dc2626",
                                                            background: "rgba(239,68,68,0.06)", padding: "1px 5px", borderRadius: 4,
                                                        }}>معطّل</span>
                                                    )}
                                                </div>
                                                <span style={{ fontSize: 10.5, color: "var(--t-text-faint, #9ca3af)" }} dir="ltr">{user.email}</span>
                                            </div>
                                            {user.role && (
                                                <span style={{
                                                    fontSize: 10, color: "#004786", background: "rgba(0,71,134,0.06)",
                                                    padding: "2px 7px", borderRadius: 4, flexShrink: 0, fontWeight: 500,
                                                }}>{user.role}</span>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {assignMut.isPending && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                            <Loader2 size={13} className="animate-spin" style={{ color: "#004786" }} />
                            <span style={{ fontSize: 11, color: "var(--t-text-faint, #9ca3af)", fontWeight: 500 }}>جارٍ تعيين المستخدم...</span>
                        </div>
                    )}
                </div>
            )}

            {/* ── Search (only when there are users) ── */}
            {users.length > 3 && (
                <div style={{ position: "relative", marginBottom: 12 }}>
                    <Search size={13} style={{
                        position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                        color: searchFocused ? "#004786" : "var(--t-text-faint, #9ca3af)",
                        pointerEvents: "none", transition: "color .15s",
                    }} />
                    <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        placeholder="بحث بالاسم أو البريد..."
                        style={{
                            width: "100%", borderRadius: 8,
                            border: `1.5px solid ${searchFocused ? "#004786" : "var(--t-border, #e0e3e7)"}`,
                            background: "var(--t-surface, #fafafa)",
                            paddingRight: 32, paddingLeft: 12, paddingTop: 8, paddingBottom: 8,
                            fontSize: 12, color: "var(--t-text, #111827)", outline: "none",
                            transition: "border-color .15s, box-shadow .15s",
                            boxShadow: searchFocused ? "0 0 0 3px rgba(0,71,134,0.06)" : "none",
                        }}
                    />
                </div>
            )}

            {/* ── Loading ── */}
            {isLoading && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "44px 0" }}>
                    <div style={{ textAlign: "center" }}>
                        <Loader2 size={20} className="animate-spin" style={{ color: "#004786", margin: "0 auto 8px" }} />
                        <p style={{ fontSize: 12, color: "var(--t-text-faint, #9ca3af)", margin: 0 }}>جارٍ تحميل المستخدمين...</p>
                    </div>
                </div>
            )}

            {/* ── Empty ── */}
            {!isLoading && users.length === 0 && (
                <div style={{
                    padding: "44px 0", textAlign: "center",
                    border: "1.5px dashed var(--t-border, #d1d5db)", borderRadius: 10,
                    background: "var(--t-surface, #fafbfc)",
                }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 12,
                        background: "rgba(0,71,134,0.06)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 10px",
                    }}>
                        <Users size={22} style={{ color: "#004786" }} />
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--t-text, #111827)", margin: "0 0 4px" }}>
                        لا يوجد مستخدمون بهذا الدور
                    </p>
                    <p style={{ fontSize: 11, color: "var(--t-text-faint, #9ca3af)", margin: 0 }}>
                        اضغط "تعيين مستخدم" لإضافة مستخدمين
                    </p>
                </div>
            )}

            {/* ── Users List ── */}
            {!isLoading && filteredUsers.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {filteredUsers.map((user, idx) => {
                        const initials = getInitials(user.full_name)
                        const isRemoving = removeMut.isPending
                        const gradient = AVATAR_GRADIENTS[hashCode(user.user_id) % AVATAR_GRADIENTS.length]

                        return (
                            <div
                                key={user.user_id}
                                style={{
                                    display: "flex", alignItems: "center", gap: 12,
                                    padding: "11px 14px", borderRadius: 10,
                                    border: "1px solid var(--t-border-light, #eaedf0)",
                                    background: "var(--t-card, #fff)",
                                    transition: "all 0.12s",
                                    animation: `rusCard .2s ease-out ${idx * 0.03}s both`,
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = "var(--t-border, #d1d5db)"
                                    e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.03)"
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = "var(--t-border-light, #eaedf0)"
                                    e.currentTarget.style.boxShadow = "none"
                                }}
                            >
                                {/* Avatar */}
                                {user.profile_picture ? (
                                    <img src={user.profile_picture} alt={user.full_name} style={{
                                        width: 38, height: 38, borderRadius: 10, objectFit: "cover", flexShrink: 0,
                                    }} />
                                ) : (
                                    <div style={{
                                        width: 38, height: 38, borderRadius: 10,
                                        background: user.is_active ? gradient : "var(--t-surface, #e5e7eb)",
                                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                    }}>
                                        <span style={{
                                            fontSize: 13, fontWeight: 700,
                                            color: user.is_active ? "#fff" : "var(--t-text-faint, #9ca3af)",
                                            textTransform: "uppercase",
                                        }}>
                                            {initials}
                                        </span>
                                    </div>
                                )}

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--t-text, #111827)" }}>
                                            {user.full_name || "—"}
                                        </span>
                                        <span style={{
                                            display: "inline-flex", alignItems: "center", gap: 3,
                                            fontSize: 9.5, fontWeight: 600,
                                            padding: "2px 6px", borderRadius: 4,
                                            background: user.is_active ? "rgba(22,163,74,0.06)" : "rgba(239,68,68,0.06)",
                                            color: user.is_active ? "#16a34a" : "#dc2626",
                                        }}>
                                            <span style={{
                                                width: 4, height: 4, borderRadius: "50%",
                                                background: user.is_active ? "#16a34a" : "#dc2626",
                                            }} />
                                            {user.is_active ? "نشط" : "معطّل"}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                        {user.email && (
                                            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "var(--t-text-faint, #9ca3af)" }}>
                                                <Mail size={10} /> <span dir="ltr">{user.email}</span>
                                            </span>
                                        )}
                                        {user.phone && (
                                            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "var(--t-text-faint, #9ca3af)" }}>
                                                <Phone size={10} /> <span dir="ltr">{user.phone}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Remove */}
                                <ActionGuard pageBit={PAGE_BITS.ROLES} actionBit={ACTION_BITS.REMOVE_ROLE}>
                                    <button
                                        onClick={() => handleRemove(user.user_id, user.full_name)}
                                        disabled={isRemoving}
                                        style={{
                                            display: "flex", alignItems: "center", gap: 4,
                                            padding: "5px 10px", borderRadius: 7,
                                            border: "1px solid var(--t-border-light, #eaedf0)",
                                            background: "var(--t-card, #fff)",
                                            color: "var(--t-text-faint, #9ca3af)", fontSize: 11, fontWeight: 600,
                                            cursor: isRemoving ? "not-allowed" : "pointer",
                                            opacity: isRemoving ? 0.4 : 1,
                                            transition: "all 0.12s", flexShrink: 0,
                                            fontFamily: "inherit",
                                        }}
                                        onMouseEnter={e => {
                                            if (!isRemoving) {
                                                e.currentTarget.style.background = "rgba(239,68,68,0.04)"
                                                e.currentTarget.style.color = "#dc2626"
                                                e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)"
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background = "var(--t-card, #fff)"
                                            e.currentTarget.style.color = "var(--t-text-faint, #9ca3af)"
                                            e.currentTarget.style.borderColor = "var(--t-border-light, #eaedf0)"
                                        }}
                                    >
                                        <UserX size={11} /> إزالة
                                    </button>
                                </ActionGuard>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* No search results */}
            {!isLoading && searchQuery.trim() && filteredUsers.length === 0 && users.length > 0 && (
                <div style={{ padding: "28px 0", textAlign: "center" }}>
                    <p style={{ fontSize: 12, color: "var(--t-text-faint, #9ca3af)", margin: 0 }}>لا توجد نتائج لـ "{searchQuery}"</p>
                </div>
            )}

            <style>{`
                @keyframes rusSlide{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
                @keyframes rusCard{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
            `}</style>
        </div>
    )
}
