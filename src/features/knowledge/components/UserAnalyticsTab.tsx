import { useState, useEffect, useCallback, memo, useMemo, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
    Search, X, Users, FileText, Database, Loader2,
    ChevronLeft, ChevronRight, Eye, FolderOpen,
    Hash, User, Tag, Building2, Filter, Download,
    Trash2, AlertTriangle, Ban,
} from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { getUserFiles, downloadUserFile, deleteDocsByFilename, deleteDocsByUsername } from "../services/knowledge-service"
import { useDepartmentsLookup } from "../hooks/use-departments"
import { useCategoriesLookup } from "../hooks/use-categories"
import { useUserFilesList, useDeleteUserData, useDeleteCollection } from "../hooks/use-users"
import { usePrefetchUsers } from "../hooks/use-prefetch"
import { FetchingBar } from "@/components/ui/FetchingBar"
import { FileDataModal } from "./FileDataModal"
import type { UserFileSummary, UserFileItem } from "../types"

/* ══════════ CONSTANTS ══════════ */
const PAGE_SIZE = 10

/* ══════════ SKELETON ROW ══════════ */
const SkeletonRow = memo(function SkeletonRow({ delay = 0 }: { delay?: number }) {
    return (
        <tr className="ua-skeleton-shimmer" style={{ animationDelay: `${delay}ms` }}>
            <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-full ua-skeleton-bone" /><div className="space-y-1.5"><div className="h-4 w-40 rounded ua-skeleton-bone" /><div className="h-3 w-24 rounded ua-skeleton-bone" /></div></div></td>
            <td className="px-5 py-4"><div className="h-5 w-14 rounded-full ua-skeleton-bone" /></td>
            <td className="px-5 py-4"><div className="h-5 w-16 rounded-full ua-skeleton-bone" /></td>
            <td className="px-5 py-4"><div className="flex gap-1.5"><div className="h-8 w-20 rounded-lg ua-skeleton-bone" /><div className="h-8 w-8 rounded-lg ua-skeleton-bone" /></div></td>
        </tr>
    )
})

/* ══════════ DELETE CONFIRM MODAL ══════════ */
const DeleteConfirmModal = memo(function DeleteConfirmModal({
    title, subtitle, warning, onClose, onConfirm, deleting,
}: {
    title: string; subtitle: string; warning: string
    onClose: () => void; onConfirm: () => void; deleting: boolean
}) {
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="mx-4 w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ animation: "uaModalIn .18s ease-out" }}>
                <div className="p-6 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50"><Trash2 size={24} className="text-red-500" /></div>
                    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                    <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
                    <div className="mx-auto mt-3 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-right">
                        <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-700 leading-relaxed">{warning}</p>
                    </div>
                </div>
                <div className="flex items-center justify-center gap-3 border-t border-gray-100 px-6 py-4">
                    <button onClick={onClose} disabled={deleting} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">إلغاء</button>
                    <button onClick={onConfirm} disabled={deleting} className="flex items-center gap-2 rounded-xl bg-gray-800 px-5 py-2.5 text-sm font-medium text-white  disabled:opacity-50">
                        {deleting && <Loader2 size={14} className="animate-spin" />}
                        حذف نهائي
                    </button>
                </div>
            </div>
        </div>
    )
})

/* ══════════ USER FILES MODAL ══════════ */
const UserFilesModal = memo(function UserFilesModal({
    username, tenantId, departmentId, categoryId, onClose, onFileDeleted, onAllDeleted,
}: {
    username: string; tenantId: string; departmentId?: string; categoryId?: string; onClose: () => void
    onFileDeleted: () => void; onAllDeleted: () => void
}) {
    const [files, setFiles] = useState<UserFileItem[]>([])
    const [loading, setLoading] = useState(true)
    const [deletingFile, setDeletingFile] = useState<string | null>(null)
    const [confirmDeleteFile, setConfirmDeleteFile] = useState<UserFileItem | null>(null)
    const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)
    const [deletingAll, setDeletingAll] = useState(false)
    const [downloadingFile, setDownloadingFile] = useState<string | null>(null)
    const [viewDataFile, setViewDataFile] = useState<UserFileItem | null>(null)

    const fetchFiles = useCallback(() => {
        setLoading(true)
        getUserFiles(username, {
            page: 1,
            page_size: 50,
            department_id: departmentId || undefined,
            category_id: categoryId || undefined,
        }, tenantId)
            .then((res) => {
                if (res.success && res.data?.files) setFiles(res.data.files)
            })
            .catch(() => toast.error("فشل تحميل ملفات المستخدم"))
            .finally(() => setLoading(false))
    }, [username, tenantId, departmentId, categoryId])

    useEffect(() => { fetchFiles() }, [fetchFiles])

    const handleDeleteFile = useCallback(async () => {
        if (!confirmDeleteFile) return
        setDeletingFile(confirmDeleteFile.filename)
        try {
            const res = await deleteDocsByFilename({ username, filename: confirmDeleteFile.filename, text: "Deleted from admin panel" }, tenantId)
            if (res.success) {
                toast.success(`تم حذف الملف: ${confirmDeleteFile.filepath || confirmDeleteFile.filename}`)
                setConfirmDeleteFile(null); fetchFiles(); onFileDeleted()
            } else toast.error(res.message || "فشل حذف الملف")
        } catch { toast.error("حدث خطأ أثناء الحذف") }
        finally { setDeletingFile(null) }
    }, [confirmDeleteFile, username, tenantId, fetchFiles, onFileDeleted])

    const handleDeleteAll = useCallback(async () => {
        setDeletingAll(true)
        try {
            const res = await deleteDocsByUsername({ username, text: "All data deleted from admin panel" }, tenantId)
            if (res.success) { toast.success(`تم حذف جميع بيانات ${username}`); setConfirmDeleteAll(false); onAllDeleted(); onClose() }
            else toast.error(res.message || "فشل الحذف")
        } catch { toast.error("حدث خطأ أثناء الحذف") }
        finally { setDeletingAll(false) }
    }, [username, tenantId, onAllDeleted, onClose])

    const handleDownload = useCallback(async (file: UserFileItem) => {
        setDownloadingFile(file.filename)
        try {
            const blob = await downloadUserFile({
                file_path: file.filepath || undefined,
                file_url: file.file_url || undefined,
                media_id: file.media_id || undefined,
                filename: file.filename || undefined,
            }, tenantId)
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = file.filename || "download"
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            toast.success(`تم تنزيل: ${file.filename}`)
        } catch { toast.error("فشل تنزيل الملف") }
        finally { setDownloadingFile(null) }
    }, [tenantId])

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="mx-4 w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ animation: "uaModalIn .18s ease-out" }}>
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
                    <div>
                        <h3 className="text-sm font-bold text-gray-700">ملفات المستخدم</h3>
                        <p className="mt-0.5 text-xs text-gray-400 font-mono">{username}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setConfirmDeleteAll(true)} className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"><Ban size={12} />حذف جميع بيانات المستخدم</button>
                        <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><X size={18} /></button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12"><div className="ua-loading-spinner" /><p className="mt-3 text-sm text-gray-400 animate-pulse">جاري تحميل الملفات...</p></div>
                    ) : files.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100"><FolderOpen size={24} className="text-gray-300" /></div><p className="mt-3 text-sm font-medium text-gray-500">لا توجد ملفات</p></div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-gray-500 mb-3">{files.length} ملف</p>
                            {files.map((file, idx) => (
                                <div key={`${file.media_id}-${idx}`}
                                    className={`group rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md ${deletingFile === file.filename ? "border-red-200 bg-red-50/30 opacity-60" : "border-gray-100 hover:border-gray-200"}`}
                                    style={{ animation: `uaRowFade 0.3s ease-out ${idx * 0.05}s both` }}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 shrink-0"><FileText size={18} className="text-blue-500" /></div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-gray-700 truncate" dir="ltr">{file.filepath || file.filename}</p>
                                                <p className="mt-0.5 text-[11px] text-gray-400 font-mono truncate" dir="ltr">{file.filename}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-600"><Database size={10} />{file.id_count} سجل</span>
                                            <button onClick={() => setViewDataFile(file)} className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors" title="عرض البيانات">
                                                <Eye size={14} />
                                            </button>
                                            <button onClick={() => handleDownload(file)} disabled={!!downloadingFile}
                                                className="rounded-lg p-1.5 text-gray-400 hover:bg-emerald-50 hover:text-emerald-500 transition-colors disabled:opacity-30" title="تنزيل الملف">
                                                {downloadingFile === file.filename ? <Loader2 size={14} className="animate-spin text-emerald-400" /> : <Download size={14} />}
                                            </button>
                                            <button onClick={() => setConfirmDeleteFile(file)} disabled={!!deletingFile}
                                                className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-30" title="حذف هذا الملف">
                                                {deletingFile === file.filename ? <Loader2 size={14} className="animate-spin text-red-400" /> : <Trash2 size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px]">
                                        {file.department_id && <span className="flex items-center gap-1 rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-amber-600"><Building2 size={9} />{file.department_id}</span>}
                                        {file.category_id && <span className="flex items-center gap-1 rounded-full bg-purple-50 border border-purple-100 px-2 py-0.5 text-purple-600"><Tag size={9} />{file.category_id}</span>}
                                        {file.media_id && <span className="flex items-center gap-1 rounded-full bg-gray-50 border border-gray-100 px-2 py-0.5 text-gray-400 font-mono" dir="ltr"><Hash size={9} />{file.media_id.slice(0, 12)}…</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {confirmDeleteFile && (
                <DeleteConfirmModal title="حذف الملف" subtitle={`هل أنت متأكد من حذف "${confirmDeleteFile.filepath || confirmDeleteFile.filename}"؟`} warning={`سيتم حذف ${confirmDeleteFile.id_count} سجل مرتبط بهذا الملف نهائياً — لا يمكن التراجع`} onClose={() => setConfirmDeleteFile(null)} onConfirm={handleDeleteFile} deleting={!!deletingFile} />
            )}
            {confirmDeleteAll && (
                <DeleteConfirmModal title="حذف جميع بيانات المستخدم" subtitle={`هل أنت متأكد من حذف جميع بيانات "${username}"؟`} warning="سيتم حذف جميع الملفات والسجلات المرتبطة بهذا المستخدم نهائياً — هذا إجراء لا يمكن التراجع عنه" onClose={() => setConfirmDeleteAll(false)} onConfirm={handleDeleteAll} deleting={deletingAll} />
            )}
            {viewDataFile && (
                <FileDataModal username={username} filename={viewDataFile.filename} filepath={viewDataFile.filepath || viewDataFile.filename} tenantId={tenantId} departmentId={departmentId} categoryId={categoryId} onClose={() => setViewDataFile(null)} />
            )}
        </div>
    )
})

/* ══════════ USER ROW ══════════ */
const UserRow = memo(function UserRow({
    user, idx, onViewFiles, onDeleteUser, deletingUser,
}: {
    user: UserFileSummary; idx: number; onViewFiles: (u: string) => void
    onDeleteUser: (u: UserFileSummary) => void; deletingUser: boolean
}) {
    const hash = user.username.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
    const colors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4", "#6366f1", "#14b8a6", "#f97316"]
    const avatarColor = colors[hash % colors.length]
    const initials = user.username.charAt(0).toUpperCase()

    return (
        <tr className={`group transition-colors hover:bg-gray-50/80 ${deletingUser ? "opacity-50" : ""}`} style={{ animation: `uaRowFade 0.3s ease-out ${idx * 0.04}s both` }}>
            <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full text-white text-sm font-bold shadow-sm shrink-0" style={{ backgroundColor: avatarColor }}>{initials}</div>
                    <p className="text-sm font-medium text-gray-700 truncate" dir="ltr">{user.username}</p>
                </div>
            </td>
            <td className="px-5 py-4"><span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600"><FileText size={12} />{user.file_count}</span></td>
            <td className="px-5 py-4"><span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600"><Database size={12} />{user.total_ids.toLocaleString()}</span></td>
            <td className="px-5 py-4">
                <div className="flex items-center gap-1.5">
                    <button onClick={() => onViewFiles(user.username)} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-all hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 hover:shadow-md active:scale-[0.97]"><Eye size={13} />عرض الملفات</button>
                    <button onClick={() => onDeleteUser(user)} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-400 shadow-sm transition-all hover:bg-red-50 hover:border-red-200 hover:text-red-500 opacity-0 group-hover:opacity-100 active:scale-[0.97]" title="حذف جميع بيانات المستخدم"><Trash2 size={13} /></button>
                </div>
            </td>
        </tr>
    )
})

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */

export function UserAnalyticsTab() {
    const { user } = useAuthStore()
    const tenantId = user?.tenant_id || ""
    const queryClient = useQueryClient()

    // Filters
    const [selectedDept, setSelectedDept] = useState<string>("") // "" = all
    const [selectedCat, setSelectedCat] = useState<string>("") // "" = all

    const [page, setPage] = useState(1)
    const [viewingUser, setViewingUser] = useState<string | null>(null)

    // Delete user
    const [deleteUserTarget, setDeleteUserTarget] = useState<UserFileSummary | null>(null)

    // Delete collection
    const [showDeleteCollection, setShowDeleteCollection] = useState(false)

    // Search
    const [searchInput, setSearchInput] = useState("")
    const [searchVal, setSearchVal] = useState("")
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    /* ─── Query: departments ─── */
    const { data: deptRes } = useDepartmentsLookup(tenantId)
    const departments = deptRes?.success ? deptRes.data ?? [] : []

    /* ─── Query: categories ─── */
    const { data: catRes } = useCategoriesLookup(tenantId)
    const categories = catRes?.success ? catRes.data?.categories ?? [] : []

    /* ─── Search debounce ─── */
    const handleSearchInput = useCallback((val: string) => {
        setSearchInput(val)
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
        searchTimerRef.current = setTimeout(() => { setSearchVal(val); setPage(1) }, 400)
    }, [])

    /* ─── Query: users list ─── */
    const { data: usersRes, isLoading: loading, isFetching } = useUserFilesList(tenantId, {
        page,
        page_size: PAGE_SIZE,
        query: searchVal.trim(),
        department_id: selectedDept || "",
        category_id: selectedCat || "",
    })
    const backgroundFetching = isFetching && !loading
    const users: UserFileSummary[] = useMemo(() => {
        if (!usersRes?.success || !usersRes.data?.items) return []
        return usersRes.data.items.map((item) => ({
            username: item.username,
            file_count: item.file_count,
            total_ids: item.total_ids,
            files: [],
        }))
    }, [usersRes])
    const totalCount = usersRes?.success ? usersRes.data?.pagination?.totalCount ?? 0 : 0
    const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1

    /* ─── Prefetch next page on hover ─── */
    const prefetchUsers = usePrefetchUsers(tenantId)
    const prefetchNextUsers = useCallback(() => {
        prefetchUsers({
            page: page + 1,
            page_size: PAGE_SIZE,
            query: searchVal.trim(),
            department_id: selectedDept || "",
            category_id: selectedCat || "",
        })
    }, [prefetchUsers, page, searchVal, selectedDept, selectedCat])

    /* ─── Mutations ─── */
    const deleteUserMutation = useDeleteUserData(tenantId)
    const deleteCollectionMutation = useDeleteCollection(tenantId)

    const deletingUser = deleteUserMutation.isPending
    const deletingCollection = deleteCollectionMutation.isPending

    /* ─── When department changes, reset page + category ─── */
    const handleDeptChange = useCallback((deptId: string) => {
        setSelectedDept(deptId)
        setSelectedCat("")
        setPage(1)
    }, [])

    /* ─── When category changes, reset page ─── */
    const handleCatChange = useCallback((catId: string) => {
        setSelectedCat(catId)
        setPage(1)
    }, [])

    /* ─── Stats ─── */
    const stats = useMemo(() => {
        const totalFiles = users.reduce((a, u) => a + u.file_count, 0)
        const totalIds = users.reduce((a, u) => a + u.total_ids, 0)
        return { userCount: totalCount, totalFiles, totalIds }
    }, [users, totalCount])

    /* ─── Delete user handler ─── */
    const handleDeleteUser = () => {
        if (!deleteUserTarget) return
        deleteUserMutation.mutate(
            { username: deleteUserTarget.username, text: "Deleted from admin panel" },
            { onSuccess: (res) => { if (res.success) setDeleteUserTarget(null) } }
        )
    }

    /* ─── Delete collection handler ─── */
    const handleDeleteCollection = () => {
        deleteCollectionMutation.mutate(
            undefined,
            { onSuccess: (res) => { if (res.success) { setShowDeleteCollection(false) } } }
        )
    }

    /* ─── Active department label ─── */
    const activeDeptLabel = useMemo(() => {
        if (!selectedDept) return "الكل"
        const d = departments.find((dep) => dep.department_id === selectedDept)
        return d ? `${d.icon || ""} ${d.name}`.trim() : selectedDept
    }, [selectedDept, departments])

    /* ═══════════════ RENDER ═══════════════ */
    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">ملفات المستخدمين</h2>
                    <p className="mt-1 text-sm text-gray-400">عرض المستخدمين وملفاتهم في قاعدة المعرفة</p>
                </div>
                <button onClick={() => setShowDeleteCollection(true)} className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"><Ban size={15} />حذف جميع البيانات</button>
            </div>

            {/* Department Filter Tabs */}
            <div className="overflow-x-auto">
                <div className="flex items-center gap-2 pb-1">
                    {/* All departments pill */}
                    <button onClick={() => handleDeptChange("")}
                        className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${!selectedDept ? "bg-gray-900 text-white " : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300"}`}>
                        <Building2 size={13} />الكل
                    </button>
                    {departments.map((dept) => (
                        <button key={dept.department_id} onClick={() => handleDeptChange(dept.department_id)}
                            className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${selectedDept === dept.department_id ? "bg-gray-900 text-white " : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300"}`}>
                            {dept.icon && <span className="text-sm">{dept.icon}</span>}
                            {dept.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                    { title: "المستخدمين", value: stats.userCount, icon: Users, gradient: "from-cyan-500 to-blue-600" },
                    { title: "إجمالي الملفات", value: stats.totalFiles, icon: FileText, gradient: "from-purple-500 to-indigo-600" },
                    { title: "إجمالي السجلات", value: stats.totalIds.toLocaleString(), icon: Database, gradient: "from-emerald-500 to-teal-600" },
                ].map((stat) => (
                    <div key={stat.title} className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-400">{stat.title}</p>
                                <p className="mt-2 text-2xl font-bold text-gray-800">{loading ? "—" : stat.value}</p>
                            </div>
                            <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} text-white transition-transform group-hover:scale-110`}><stat.icon size={20} /></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search + Category Filter */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="بحث بالبريد الإلكتروني..." value={searchInput} onChange={(e) => handleSearchInput(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-10 pl-4 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" dir="ltr" />
                    {searchInput && <button onClick={() => { setSearchInput(""); setSearchVal("") }} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><X size={14} /></button>}
                    {loading && searchInput && <Loader2 size={14} className="absolute left-10 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />}
                </div>
                {/* Category dropdown */}
                <div className="relative shrink-0">
                    <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <select value={selectedCat} onChange={(e) => handleCatChange(e.target.value)}
                        className={`appearance-none rounded-xl border bg-white py-2.5 pr-9 pl-4 text-sm font-medium outline-none cursor-pointer transition-colors focus:ring-2 focus:ring-blue-100 min-w-[140px] ${selectedCat ? "border-purple-300 text-purple-600 bg-purple-50" : "border-gray-200 text-gray-500 hover:border-gray-300"
                            }`}>
                        <option value="">كل الفئات</option>
                        {categories.map((cat) => (
                            <option key={cat.category_id} value={cat.category_id}>
                                {cat.icon ? `${cat.icon} ` : ""}{cat.name}
                            </option>
                        ))}
                    </select>
                    {selectedCat && (
                        <button onClick={() => handleCatChange("")} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-purple-400 hover:text-purple-600 hover:bg-purple-100 transition-colors"><X size={12} /></button>
                    )}
                </div>
            </div>

            {/* Info bar */}
            {!loading && users.length > 0 && (
                <div className="flex items-center justify-between rounded-xl bg-white border border-gray-100 px-4 py-2.5 shadow-sm">
                    <p className="text-xs text-gray-500">
                        <span className="font-bold text-gray-700">{totalCount}</span> مستخدم
                        {selectedDept && <span className="text-gray-400"> — {activeDeptLabel}</span>}
                    </p>
                    <p className="text-xs text-gray-400">صفحة {page} من {totalPages}</p>
                </div>
            )}

            {/* Table */}
            <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <FetchingBar visible={backgroundFetching} />
                <div className="overflow-x-auto" style={{ opacity: backgroundFetching ? 0.6 : 1, transition: 'opacity 0.2s ease' }}>
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 text-right">
                                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">المستخدم</th>
                                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">عدد الملفات</th>
                                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">عدد السجلات</th>
                                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && users.length === 0
                                ? Array.from({ length: 5 }, (_, i) => <SkeletonRow key={i} delay={i * 80} />)
                                : users.map((u, idx) => (
                                    <UserRow key={u.username} user={u} idx={idx} onViewFiles={setViewingUser} onDeleteUser={setDeleteUserTarget}
                                        deletingUser={deletingUser && deleteUserTarget?.username === u.username} />
                                ))}
                        </tbody>
                    </table>
                </div>
                {!loading && users.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100"><User size={28} className="text-gray-300" /></div>
                        <p className="mt-4 text-sm font-medium text-gray-500">{searchVal ? "لا يوجد مستخدمين مطابقين" : selectedDept ? `لا يوجد ملفات في قسم ${activeDeptLabel}` : "لا يوجد مستخدمين"}</p>
                        <p className="mt-1 text-xs text-gray-400">{searchVal ? "جرب كلمة بحث مختلفة" : "لم يتم رفع أي ملفات بعد"}</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight size={14} /> السابق</button>
                    <span className="flex h-8 items-center rounded-lg bg-gray-900 px-3 text-xs font-bold text-white ">{page}</span>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} onMouseEnter={() => page < totalPages && prefetchNextUsers()} disabled={page >= totalPages} className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">التالي <ChevronLeft size={14} /></button>
                </div>
            )}

            {/* Modals */}
            {viewingUser && <UserFilesModal username={viewingUser} tenantId={tenantId} departmentId={selectedDept} categoryId={selectedCat} onClose={() => setViewingUser(null)} onFileDeleted={() => queryClient.invalidateQueries({ queryKey: ["knowledge", "users"] })} onAllDeleted={() => queryClient.invalidateQueries({ queryKey: ["knowledge", "users"] })} />}
            {deleteUserTarget && (
                <DeleteConfirmModal title="حذف جميع بيانات المستخدم" subtitle={`هل أنت متأكد من حذف جميع بيانات "${deleteUserTarget.username}"؟`}
                    warning={`سيتم حذف ${deleteUserTarget.file_count} ملف و ${deleteUserTarget.total_ids.toLocaleString()} سجل نهائياً — لا يمكن التراجع`}
                    onClose={() => setDeleteUserTarget(null)} onConfirm={handleDeleteUser} deleting={deletingUser} />
            )}
            {showDeleteCollection && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteCollection(false)}>
                    <div className="mx-4 w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ animation: "uaModalIn .18s ease-out" }}>
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50"><Ban size={20} className="text-red-500" /></div>
                                <div><h3 className="text-sm font-bold text-gray-700">حذف جميع البيانات</h3><p className="text-xs text-gray-400">سيتم حذف جميع البيانات من قاعدة المعرفة</p></div>
                            </div>
                            <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-right">
                                <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                                <p className="text-xs text-amber-700 leading-relaxed">عملية حذف جميع البيانات <strong>لا يمكن التراجع عنها</strong> — سيتم حذف جميع الملفات والسجلات نهائياً</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                            <button onClick={() => setShowDeleteCollection(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">إلغاء</button>
                            <button onClick={handleDeleteCollection} disabled={deletingCollection} className="flex items-center gap-2 rounded-xl bg-gray-800 px-4 py-2 text-sm font-medium text-white  disabled:opacity-50 disabled:cursor-not-allowed">
                                {deletingCollection && <Loader2 size={14} className="animate-spin" />}حذف جميع البيانات
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes uaModalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
                @keyframes uaFadeIn{from{opacity:0}to{opacity:1}}
                @keyframes uaRowFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
                @keyframes uaShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
                .ua-skeleton-bone{background:linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 37%,#f3f4f6 63%);background-size:200% 100%;animation:uaShimmer 1.5s ease-in-out infinite}
                .ua-skeleton-shimmer{opacity:0;animation:uaFadeIn .3s ease-out forwards}
                .ua-loading-spinner{width:36px;height:36px;border:3px solid #e5e7eb;border-top-color:#3b82f6;border-radius:50%;animation:uaSpin .7s linear infinite}
                @keyframes uaSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
            `}</style>
        </div>
    )
}
