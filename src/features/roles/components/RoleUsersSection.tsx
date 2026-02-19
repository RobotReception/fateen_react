import { useState, useCallback, useRef, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { UserPlus, X, Loader2, Users, Search, Mail, Phone, UserX, ChevronDown } from "lucide-react"
import { useAssignUserRole, useRemoveUserRole } from "../hooks/use-roles"
import { getAllUsers, type AdminUser } from "../services/admin-service"
import { useAuthStore } from "@/stores/auth-store"

interface Props {
    role: string
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
    const assignMut = useAssignUserRole()
    const removeMut = useRemoveUserRole()
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Fetch users assigned to this role
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

    // Fetch ALL users for the picker dropdown
    const { data: allUsersData, isLoading: allUsersLoading } = useQuery({
        queryKey: ["adminUsers", "all", pickerSearch],
        queryFn: () => getAllUsers({
            page_size: 50,
            search: pickerSearch || undefined,
        }, tenantId),
        enabled: showAdd && !!tenantId && isAuth,
        select: (res) => {
            const items = res?.data?.items ?? []
            return Array.isArray(items) ? items : []
        },
        staleTime: 30 * 1000,
    })

    const users: AdminUser[] = data || []
    const allUsers: AdminUser[] = allUsersData || []

    // Filter out users already assigned to this role
    const assignedIds = new Set(users.map(u => u.user_id))
    const availableUsers = allUsers.filter(u => !assignedIds.has(u.user_id))

    // Close dropdown on outside click
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
                setSelectedUser(null)
                setShowAdd(false)
                setPickerSearch("")
                qc.invalidateQueries({ queryKey: ["adminUsers", "byRole", role] })
            },
            onSettled: () => {
                setSelectedUser(null)
            },
        })
    }, [role, assignMut, qc])

    const handleRemove = useCallback((uid: string, name: string) => {
        if (!confirm(`هل تريد إزالة "${name}" من دور "${role}"؟`)) return
        removeMut.mutate({ user_id: uid, role }, {
            onSuccess: () => {
                qc.invalidateQueries({ queryKey: ["adminUsers", "byRole", role] })
            },
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
                        background: "var(--t-accent)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <Users size={16} style={{ color: "var(--t-text-on-accent)" }} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)", margin: 0 }}>
                            المستخدمون
                        </h3>
                        <p style={{ fontSize: 12, color: "var(--t-text-faint)", margin: 0 }}>
                            {users.length} مستخدم بهذا الدور
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => { setShowAdd(!showAdd); setPickerSearch(""); setSelectedUser(null); setPickerOpen(false) }}
                    style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "7px 14px", borderRadius: 8,
                        border: "none",
                        background: showAdd ? "var(--t-surface)" : "var(--t-accent)",
                        color: showAdd ? "var(--t-text-muted)" : "var(--t-text-on-accent)",
                        fontSize: 13, fontWeight: 600,
                        cursor: "pointer", transition: "all 0.15s",
                    }}
                >
                    {showAdd ? <X size={13} /> : <UserPlus size={13} />}
                    {showAdd ? "إلغاء" : "تعيين مستخدم"}
                </button>
            </div>

            {/* ── User Picker ── */}
            {showAdd && (
                <div style={{
                    padding: 14, marginBottom: 14,
                    borderRadius: 10, border: "1px solid var(--t-border)",
                    background: "var(--t-card-hover)",
                    animation: "rusSlide .2s ease-out",
                }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--t-text-secondary)", margin: "0 0 8px" }}>
                        اختر مستخدم لتعيينه لهذا الدور
                    </p>

                    {/* Search + Dropdown */}
                    <div ref={dropdownRef} style={{ position: "relative" }}>
                        <div
                            onClick={() => setPickerOpen(true)}
                            style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "9px 12px", borderRadius: 8,
                                border: pickerOpen ? "1px solid #374151" : "1px solid #e5e7eb",
                                background: "var(--t-card)", cursor: "pointer",
                                transition: "border-color 0.15s",
                            }}
                        >
                            {selectedUser ? (
                                <>
                                    <div style={{
                                        width: 26, height: 26, borderRadius: 7,
                                        background: "var(--t-surface)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0,
                                    }}>
                                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--t-text-secondary)" }}>
                                            {getInitials(selectedUser.full_name)}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--t-text)", flex: 1 }}>
                                        {selectedUser.full_name}
                                    </span>
                                    <span style={{ fontSize: 11, color: "var(--t-text-faint)" }}>{selectedUser.email}</span>
                                </>
                            ) : (
                                <>
                                    <Search size={13} style={{ color: "var(--t-text-faint)" }} />
                                    <input
                                        value={pickerSearch}
                                        onChange={e => { setPickerSearch(e.target.value); setPickerOpen(true) }}
                                        onFocus={() => setPickerOpen(true)}
                                        placeholder="ابحث بالاسم أو البريد الإلكتروني..."
                                        style={{
                                            flex: 1, border: "none", background: "transparent",
                                            fontSize: 13, color: "var(--t-text)", outline: "none",
                                        }}
                                    />
                                    <ChevronDown size={13} style={{ color: "var(--t-text-faint)", flexShrink: 0 }} />
                                </>
                            )}
                        </div>

                        {/* Dropdown list */}
                        {pickerOpen && (
                            <div style={{
                                position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                                maxHeight: 260, overflowY: "auto",
                                borderRadius: 10, border: "1px solid var(--t-border)",
                                background: "var(--t-card)", boxShadow: "0 6px 20px var(--t-shadow)",
                                zIndex: 50, animation: "rusSlide .15s ease-out",
                            }}>
                                {allUsersLoading ? (
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 0" }}>
                                        <Loader2 size={16} className="animate-spin" style={{ color: "var(--t-text-faint)" }} />
                                        <span style={{ fontSize: 12, color: "var(--t-text-muted)", marginRight: 8 }}>جارٍ البحث...</span>
                                    </div>
                                ) : availableUsers.length === 0 ? (
                                    <div style={{ padding: "18px 0", textAlign: "center" }}>
                                        <p style={{ fontSize: 13, color: "var(--t-text-faint)", margin: 0 }}>
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
                                                borderBottom: "1px solid var(--t-border-light)",
                                                transition: "background 0.1s",
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.background = "var(--t-card-hover)")}
                                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                        >
                                            {/* Avatar */}
                                            {user.profile_picture ? (
                                                <img src={user.profile_picture} alt="" style={{
                                                    width: 32, height: 32, borderRadius: 8, objectFit: "cover", flexShrink: 0,
                                                }} />
                                            ) : (
                                                <div style={{
                                                    width: 32, height: 32, borderRadius: 8,
                                                    background: "var(--t-surface)",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    flexShrink: 0,
                                                }}>
                                                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--t-text-secondary)", textTransform: "uppercase" }}>
                                                        {getInitials(user.full_name)}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--t-text)" }}>
                                                        {user.full_name || "—"}
                                                    </span>
                                                    {!user.is_active && (
                                                        <span style={{
                                                            fontSize: 9, fontWeight: 600, color: "var(--t-text-muted)",
                                                            background: "var(--t-surface)", padding: "1px 6px", borderRadius: 10,
                                                        }}>
                                                            معطّل
                                                        </span>
                                                    )}
                                                </div>
                                                <span style={{ fontSize: 11, color: "var(--t-text-faint)" }} dir="ltr">{user.email}</span>
                                            </div>

                                            {/* Role badge */}
                                            {user.role && (
                                                <span style={{
                                                    fontSize: 10, color: "var(--t-text-faint)", background: "var(--t-surface)",
                                                    padding: "2px 7px", borderRadius: 5, flexShrink: 0,
                                                }}>
                                                    {user.role}
                                                </span>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {assignMut.isPending && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                            <Loader2 size={13} className="animate-spin" style={{ color: "var(--t-text-faint)" }} />
                            <span style={{ fontSize: 12, color: "var(--t-text-muted)", fontWeight: 500 }}>
                                جارٍ تعيين المستخدم...
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* ── Search (only when there are users) ── */}
            {users.length > 3 && (
                <div style={{ position: "relative", marginBottom: 12 }}>
                    <Search size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--t-text-faint)", pointerEvents: "none" }} />
                    <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="بحث بالاسم أو البريد..."
                        style={{
                            width: "100%", borderRadius: 8,
                            border: "1px solid var(--t-border)", background: "var(--t-card-hover)",
                            paddingRight: 32, paddingLeft: 12, paddingTop: 9, paddingBottom: 9,
                            fontSize: 13, color: "var(--t-text)", outline: "none",
                            transition: "border-color 0.15s, background 0.15s",
                        }}
                        onFocus={e => { e.target.style.borderColor = "var(--t-text-faint)"; e.target.style.background = "var(--t-card)" }}
                        onBlur={e => { e.target.style.borderColor = "var(--t-border)"; e.target.style.background = "var(--t-card-hover)" }}
                    />
                </div>
            )}

            {/* ── Loading ── */}
            {isLoading && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "44px 0" }}>
                    <div style={{ textAlign: "center" }}>
                        <Loader2 size={20} className="animate-spin" style={{ color: "var(--t-text-faint)", margin: "0 auto 8px" }} />
                        <p style={{ fontSize: 13, color: "var(--t-text-muted)" }}>جارٍ تحميل المستخدمين...</p>
                    </div>
                </div>
            )}

            {/* ── Empty ── */}
            {!isLoading && users.length === 0 && (
                <div style={{
                    padding: "44px 0", textAlign: "center",
                    border: "1.5px dashed var(--t-border)", borderRadius: 10,
                    background: "var(--t-card-hover)",
                }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 12,
                        background: "var(--t-surface)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 10px",
                    }}>
                        <Users size={22} style={{ color: "var(--t-text-faint)" }} />
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--t-text-secondary)", margin: "0 0 4px" }}>
                        لا يوجد مستخدمون بهذا الدور
                    </p>
                    <p style={{ fontSize: 12, color: "var(--t-text-faint)", margin: 0 }}>
                        اضغط "تعيين مستخدم" لإضافة مستخدمين
                    </p>
                </div>
            )}

            {/* ── Users List ── */}
            {!isLoading && filteredUsers.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {filteredUsers.map(user => {
                        const initials = getInitials(user.full_name)
                        const isRemoving = removeMut.isPending

                        return (
                            <div
                                key={user.user_id}
                                style={{
                                    display: "flex", alignItems: "center", gap: 12,
                                    padding: "12px 14px", borderRadius: 10,
                                    border: "1px solid var(--t-border-light)", background: "var(--t-card)",
                                    transition: "all 0.12s",
                                    animation: "rusCard .2s ease-out",
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = "var(--t-border)"
                                    e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.03)"
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = "var(--t-border-light)"
                                    e.currentTarget.style.boxShadow = "none"
                                }}
                            >
                                {/* Avatar */}
                                {user.profile_picture ? (
                                    <img
                                        src={user.profile_picture}
                                        alt={user.full_name}
                                        style={{
                                            width: 40, height: 40, borderRadius: 10,
                                            objectFit: "cover", flexShrink: 0,
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 10,
                                        background: "var(--t-surface)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0,
                                    }}>
                                        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text-secondary)", textTransform: "uppercase" }}>
                                            {initials}
                                        </span>
                                    </div>
                                )}

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--t-text)" }}>
                                            {user.full_name || "—"}
                                        </span>
                                        <span style={{
                                            display: "inline-flex", alignItems: "center", gap: 4,
                                            fontSize: 10, fontWeight: 600,
                                            padding: "2px 7px", borderRadius: 20,
                                            background: user.is_active ? "var(--t-surface)" : "var(--t-surface)",
                                            color: user.is_active ? "var(--t-text-secondary)" : "var(--t-text-faint)",
                                            border: "1px solid var(--t-border)",
                                        }}>
                                            <span style={{
                                                width: 5, height: 5, borderRadius: "50%",
                                                background: user.is_active ? "var(--t-accent)" : "var(--t-surface-deep)",
                                            }} />
                                            {user.is_active ? "نشط" : "معطّل"}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                                        {user.email && (
                                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--t-text-muted)" }}>
                                                <Mail size={11} style={{ color: "var(--t-text-faint)" }} />
                                                <span dir="ltr">{user.email}</span>
                                            </span>
                                        )}
                                        {user.phone && (
                                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--t-text-muted)" }}>
                                                <Phone size={11} style={{ color: "var(--t-text-faint)" }} />
                                                <span dir="ltr">{user.phone}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* User ID */}
                                <span dir="ltr" style={{
                                    fontSize: 10, fontFamily: "monospace", color: "var(--t-text-faint)",
                                    background: "var(--t-surface)", padding: "3px 7px", borderRadius: 5,
                                    flexShrink: 0, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis",
                                }}>
                                    {user.user_id}
                                </span>

                                {/* Remove */}
                                <button
                                    onClick={() => handleRemove(user.user_id, user.full_name)}
                                    disabled={isRemoving}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 4,
                                        padding: "5px 10px", borderRadius: 7,
                                        border: "1px solid var(--t-border)", background: "var(--t-card)",
                                        color: "var(--t-text-muted)", fontSize: 11, fontWeight: 600,
                                        cursor: isRemoving ? "not-allowed" : "pointer",
                                        opacity: isRemoving ? 0.4 : 1,
                                        transition: "all 0.12s", flexShrink: 0,
                                    }}
                                    onMouseEnter={e => {
                                        if (!isRemoving) {
                                            e.currentTarget.style.background = "var(--t-surface)"
                                            e.currentTarget.style.color = "var(--t-accent)"
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = "var(--t-card)"
                                        e.currentTarget.style.color = "var(--t-text-muted)"
                                    }}
                                >
                                    <UserX size={11} />
                                    إزالة
                                </button>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* No search results */}
            {!isLoading && searchQuery.trim() && filteredUsers.length === 0 && users.length > 0 && (
                <div style={{ padding: "28px 0", textAlign: "center" }}>
                    <p style={{ fontSize: 13, color: "var(--t-text-muted)" }}>لا توجد نتائج لـ "{searchQuery}"</p>
                </div>
            )}

            <style>{`
                @keyframes rusSlide{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
                @keyframes rusCard{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
            `}</style>
        </div>
    )
}
