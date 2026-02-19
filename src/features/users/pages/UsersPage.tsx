import { useState, useEffect } from "react"
import {
    Users,
    UserPlus,
    Search,
    RefreshCw,
    Shield,
    UserCheck,
    UserX,
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

    // Stats
    const activeCount = users.filter((u) => u.is_active).length
    const inactiveCount = users.filter((u) => !u.is_active).length

    return (
        <div className={embedded ? "space-y-6" : "p-4 lg:p-6 space-y-6"} dir="rtl">
            {/* Page header */}
            {!embedded && (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">إدارة المستخدمين</h1>
                        <p className="mt-1 text-sm text-gray-400">إدارة وتنظيم مستخدمي المؤسسة</p>
                    </div>
                    <ActionGuard pageBit={PAGE_BITS.ADMIN_USERS} actionBit={ACTION_BITS.CREATE_USER}>
                        <button
                            onClick={() => setCreateOpen(true)}
                            className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-gray-800 active:scale-[0.98]"
                        >
                            <UserPlus size={18} />
                            إضافة مستخدم
                        </button>
                    </ActionGuard>
                </div>
            )}
            {embedded && (
                <div className="flex justify-end">
                    <ActionGuard pageBit={PAGE_BITS.ADMIN_USERS} actionBit={ACTION_BITS.CREATE_USER}>
                        <button
                            onClick={() => setCreateOpen(true)}
                            className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-gray-800 active:scale-[0.98]"
                        >
                            <UserPlus size={18} />
                            إضافة مستخدم
                        </button>
                    </ActionGuard>
                </div>
            )}

            {/* Stats cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">إجمالي المستخدمين</p>
                            <p className="mt-1 text-3xl font-bold text-gray-800">
                                {loading ? "..." : users.length}
                            </p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-500 transition-transform group-hover:scale-110">
                            <Users size={24} />
                        </div>
                    </div>
                </div>

                <div className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">المستخدمين النشطين</p>
                            <p className="mt-1 text-3xl font-bold text-emerald-600">
                                {loading ? "..." : activeCount}
                            </p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 transition-transform group-hover:scale-110">
                            <UserCheck size={24} />
                        </div>
                    </div>
                </div>

                <div className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">المستخدمين المعطلين</p>
                            <p className="mt-1 text-3xl font-bold text-red-500">
                                {loading ? "..." : inactiveCount}
                            </p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-400 transition-transform group-hover:scale-110">
                            <UserX size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Error banner */}
            {error && (
                <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
                    <AlertTriangle size={20} className="shrink-0 text-red-500" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-red-700">{error}</p>
                    </div>
                    <button
                        onClick={() => refetch()}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
                    >
                        إعادة المحاولة
                    </button>
                </div>
            )}

            {/* Table card */}
            <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <FetchingBar visible={backgroundFetching} />
                {/* Table toolbar */}
                <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative flex-1 max-w-sm">
                        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="بحث بالاسم أو البريد..."
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pr-10 pl-3 text-sm outline-none transition-all focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Shield size={12} />
                            {users.length} مستخدم
                        </span>
                        <button
                            onClick={() => refetch()}
                            disabled={loading}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                            title="تحديث"
                        >
                            {(loading || backgroundFetching) ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
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
