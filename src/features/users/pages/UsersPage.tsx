import { useState, useEffect } from "react"
import {
    UserPlus,
    Search,
    RefreshCw,
    Shield,
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

export function UsersPage({ embedded = false }: { embedded?: boolean }) {
    const { user: currentUser } = useAuthStore()
    const tenantId = currentUser?.tenant_id || ""

    // ── UI state ──
    const [searchInput, setSearchInput] = useState("")
    const [search, setSearch] = useState("")
    const [createOpen, setCreateOpen] = useState(false)
    const [editUser, setEditUser] = useState<AdminUser | null>(null)
    const [passwordUser, setPasswordUser] = useState<AdminUser | null>(null)

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
        <div className={embedded ? "space-y-4" : "p-4 lg:p-6 space-y-4"} dir="rtl">
            {/* Add user button */}
            <div style={{ display: "flex", justifyContent: embedded ? "flex-end" : "space-between", alignItems: "center" }}>
                {!embedded && (
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--t-text)" }}>إدارة المستخدمين</h1>
                        <p style={{ fontSize: 12, color: "var(--t-text-faint)", marginTop: 2 }}>إضافة وإدارة مستخدمي المؤسسة وصلاحياتهم</p>
                    </div>
                )}
                <ActionGuard pageBit={PAGE_BITS.ADMIN_USERS} actionBit={ACTION_BITS.CREATE_USER}>
                    <button
                        onClick={() => setCreateOpen(true)}
                        style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "8px 16px", borderRadius: 10,
                            border: "none", background: "var(--t-accent)",
                            color: "var(--t-text-on-accent)", fontSize: 13,
                            fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                            transition: "opacity .12s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = "0.88" }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = "1" }}
                    >
                        <UserPlus size={16} />
                        إضافة مستخدم
                    </button>
                </ActionGuard>
            </div>



            {/* Error banner */}
            {error && (
                <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 16px", borderRadius: 10,
                    background: "var(--t-danger-soft)", border: "1px solid var(--t-danger)",
                }}>
                    <AlertTriangle size={16} style={{ color: "var(--t-danger)", flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "var(--t-danger)" }}>{error}</span>
                    <button
                        onClick={() => refetch()}
                        style={{
                            border: "none", background: "transparent",
                            fontSize: 11, fontWeight: 700, color: "var(--t-danger)",
                            cursor: "pointer", fontFamily: "inherit",
                        }}
                    >
                        إعادة المحاولة
                    </button>
                </div>
            )}

            {/* Table card */}
            <div style={{
                borderRadius: 12, border: "1px solid var(--t-border)",
                background: "var(--t-card)", overflow: "hidden", position: "relative",
            }}>
                <FetchingBar visible={backgroundFetching} />
                {/* Table toolbar */}
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px", borderBottom: "1px solid var(--t-border-light)",
                    gap: 10,
                }}>
                    <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
                        <Search size={14} style={{
                            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                            color: "var(--t-text-faint)", pointerEvents: "none",
                        }} />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="بحث بالاسم أو البريد..."
                            style={{
                                width: "100%", padding: "8px 34px 8px 10px",
                                borderRadius: 8, border: "1.5px solid var(--t-border)",
                                background: "var(--t-surface)", fontSize: 12,
                                color: "var(--t-text)", outline: "none", fontFamily: "inherit",
                            }}
                        />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--t-text-faint)" }}>
                            <Shield size={11} />
                            {users.length} مستخدم
                        </span>
                        <button
                            onClick={() => refetch()}
                            disabled={loading}
                            title="تحديث"
                            style={{
                                width: 28, height: 28, borderRadius: 6,
                                border: "none", background: "transparent",
                                cursor: "pointer", display: "flex",
                                alignItems: "center", justifyContent: "center",
                                color: "var(--t-text-faint)", transition: "background .1s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "var(--t-surface)" }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                        >
                            {(loading || backgroundFetching) ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                        </button>
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
