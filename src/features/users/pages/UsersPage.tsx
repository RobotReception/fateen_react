import { useState, useEffect } from "react"
import {
    UserPlus,
    Search,
    RefreshCw,
    Users,
    Loader2,
    AlertTriangle,
} from "lucide-react"
import { UsersTable } from "../components/UsersTable"
import { CreateUserDialog } from "../components/CreateUserDialog"
import { EditUserDialog } from "../components/EditUserDialog"
import { SetPasswordDialog } from "../components/SetPasswordDialog"
import { useUsersList } from "../hooks/use-users"
import { useAuthStore } from "@/stores/auth-store"
import { FetchingBar } from "@/components/ui/FetchingBar"
import { ActionGuard } from "@/components/guards/ActionGuard"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"
import type { AdminUser } from "../types"

const CSS = `@keyframes usrsFade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`

export function UsersPage({ embedded = false }: { embedded?: boolean }) {
    const { user: currentUser } = useAuthStore()
    const tenantId = currentUser?.tenant_id || ""

    // ── UI state ──
    const [searchInput, setSearchInput] = useState("")
    const [search, setSearch] = useState("")
    const [createOpen, setCreateOpen] = useState(false)
    const [editUser, setEditUser] = useState<AdminUser | null>(null)
    const [passwordUser, setPasswordUser] = useState<AdminUser | null>(null)
    const [searchFocused, setSearchFocused] = useState(false)

    // ── Debounced search ──
    useEffect(() => {
        const timer = setTimeout(() => setSearch(searchInput), 400)
        return () => clearTimeout(timer)
    }, [searchInput])

    // ── React Query: fetch users ──
    const { data: usersRes, isLoading: loading, isFetching, error: queryError, refetch } = useUsersList(tenantId, {
        page: 1,
        page_size: 100,
        search: search || undefined,
    })
    const backgroundFetching = isFetching && !loading

    const users = usersRes?.success ? usersRes.data?.items ?? [] : []
    const error = queryError ? "حدث خطأ أثناء تحميل المستخدمين" : usersRes && !usersRes.success ? (usersRes.message || "فشل تحميل المستخدمين") : null

    return (
        <div style={{ animation: "usrsFade .25s ease-out" }} dir="rtl">
            <style>{CSS}</style>

            {/* ── Header ── */}
            {!embedded && (
                <div style={{ marginBottom: 16 }}>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--t-text, #111827)", margin: 0, letterSpacing: "-0.01em" }}>
                        إدارة المستخدمين
                    </h1>
                    <p style={{ fontSize: 12, color: "var(--t-text-faint, #9ca3af)", marginTop: 3 }}>
                        إضافة وإدارة مستخدمي المؤسسة وصلاحياتهم
                    </p>
                </div>
            )}

            {/* ── Error banner ── */}
            {error && (
                <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "12px 16px", borderRadius: 10, marginBottom: 12,
                    background: "#fef2f2", border: "1px solid #fecaca",
                }}>
                    <AlertTriangle size={15} style={{ color: "#dc2626", flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#991b1b" }}>{error}</span>
                    <button onClick={() => refetch()} style={{
                        border: "none", background: "none", fontSize: 11, fontWeight: 700,
                        color: "#dc2626", cursor: "pointer", fontFamily: "inherit",
                    }}>إعادة المحاولة</button>
                </div>
            )}

            {/* ── Table Card ── */}
            <div style={{
                borderRadius: 14,
                border: "1px solid var(--t-border-light, #e8eaed)",
                background: "var(--t-card, #fff)",
                overflow: "hidden",
                position: "relative",
            }}>
                <FetchingBar visible={backgroundFetching} />

                {/* ── Toolbar ── */}
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--t-border-light, #eaedf0)",
                    gap: 12,
                }}>
                    {/* Search */}
                    <div style={{
                        position: "relative", flex: 1, maxWidth: 300,
                    }}>
                        <Search size={14} style={{
                            position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)",
                            color: searchFocused ? "#004786" : "var(--t-text-faint, #9ca3af)",
                            transition: "color .15s", pointerEvents: "none",
                        }} />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setSearchFocused(false)}
                            placeholder="بحث بالاسم أو البريد..."
                            style={{
                                width: "100%", padding: "8px 34px 8px 12px",
                                borderRadius: 9,
                                border: `1.5px solid ${searchFocused ? "#004786" : "var(--t-border-light, #e0e3e7)"}`,
                                background: "var(--t-surface, #fafafa)",
                                fontSize: 12, color: "var(--t-text, #111827)",
                                outline: "none", fontFamily: "inherit",
                                transition: "border-color .15s, box-shadow .15s",
                                boxShadow: searchFocused ? "0 0 0 3px rgba(0,71,134,0.06)" : "none",
                            }}
                        />
                    </div>

                    {/* Stats + actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                            display: "flex", alignItems: "center", gap: 5,
                            padding: "5px 12px", borderRadius: 7,
                            background: "rgba(0,71,134,0.05)",
                        }}>
                            <Users size={12} style={{ color: "#004786" }} />
                            <span style={{ fontSize: 11, fontWeight: 600, color: "#004786" }}>
                                {users.length} مستخدم
                            </span>
                        </div>

                        <button
                            onClick={() => refetch()}
                            disabled={loading}
                            title="تحديث"
                            style={{
                                width: 32, height: 32, borderRadius: 8,
                                border: "none", background: "transparent",
                                cursor: "pointer", display: "flex",
                                alignItems: "center", justifyContent: "center",
                                color: "var(--t-text-faint, #9ca3af)", transition: "all .12s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "var(--t-surface, #f5f5f5)" }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                        >
                            {(loading || backgroundFetching) ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                        </button>

                        <ActionGuard pageBit={PAGE_BITS.ADMIN_USERS} actionBit={ACTION_BITS.CREATE_USER}>
                            <button
                                onClick={() => setCreateOpen(true)}
                                style={{
                                    display: "flex", alignItems: "center", gap: 6,
                                    padding: "8px 16px", borderRadius: 9,
                                    border: "none", background: "#004786",
                                    color: "#fff", fontSize: 12, fontWeight: 600,
                                    cursor: "pointer", fontFamily: "inherit",
                                    boxShadow: "0 1px 3px rgba(0,71,134,0.15)",
                                    transition: "background .15s",
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = "#003a6e" }}
                                onMouseLeave={e => { e.currentTarget.style.background = "#004786" }}
                            >
                                <UserPlus size={14} />
                                إضافة مستخدم
                            </button>
                        </ActionGuard>
                    </div>
                </div>

                {/* Table */}
                <UsersTable
                    users={users}
                    loading={loading}
                    onEdit={(u) => setEditUser(u)}
                    onSetPassword={(u) => setPasswordUser(u)}
                    onRefresh={() => refetch()}
                />
            </div>

            {/* Dialogs */}
            <CreateUserDialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onSuccess={() => refetch()}
            />
            <EditUserDialog
                open={!!editUser}
                user={editUser}
                onClose={() => setEditUser(null)}
                onSuccess={() => refetch()}
            />
            <SetPasswordDialog
                open={!!passwordUser}
                targetUser={passwordUser}
                onClose={() => setPasswordUser(null)}
            />
        </div>
    )
}
