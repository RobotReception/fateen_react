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
import { ActionGuard } from "@/components/guards/ActionGuard"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"
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
            <div className="mx-4 w-full max-w-md overflow-hidden bg-white" onClick={(e) => e.stopPropagation()} style={{ animation: "uaModalIn .18s ease-out", borderRadius: 12, border: "1px solid var(--t-border-light, #e5e7eb)" }}>
                <div style={{ padding: "28px 24px 20px", textAlign: "center" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(220,38,38,0.06)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                        <Trash2 size={22} style={{ color: "#dc2626" }} />
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--t-text, #1f2937)" }}>{title}</h3>
                    <p style={{ fontSize: 13, color: "var(--t-text-secondary, #6b7280)", marginTop: 8 }}>{subtitle}</p>
                    <div style={{ margin: "12px auto 0", display: "flex", alignItems: "flex-start", gap: 8, borderRadius: 8, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", padding: 10, textAlign: "right" }}>
                        <AlertTriangle size={14} style={{ color: "#d97706", marginTop: 2, flexShrink: 0 }} />
                        <p style={{ fontSize: 11, color: "#92400e", lineHeight: 1.6 }}>{warning}</p>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, borderTop: "1px solid var(--t-border-light, #f0f0f0)", padding: "14px 24px" }}>
                    <button onClick={onClose} disabled={deleting} style={{ padding: "8px 20px", borderRadius: 7, border: "1px solid var(--t-border-light, #e5e7eb)", background: "var(--t-card, #fff)", fontSize: 13, fontWeight: 500, color: "var(--t-text-secondary, #6b7280)", cursor: "pointer" }}>إلغاء</button>
                    <button onClick={onConfirm} disabled={deleting} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", borderRadius: 7, border: "none", background: "#dc2626", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", opacity: deleting ? 0.5 : 1 }}>
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
                toast.success(`تم تقديم طلب حذف الملف: ${confirmDeleteFile.filepath || confirmDeleteFile.filename} — يمكنك متابعته من الطلبات المعلقة`)
                setConfirmDeleteFile(null); fetchFiles(); onFileDeleted()
            } else toast.error(res.message || "فشل حذف الملف")
        } catch { toast.error("حدث خطأ أثناء الحذف") }
        finally { setDeletingFile(null) }
    }, [confirmDeleteFile, username, tenantId, fetchFiles, onFileDeleted])

    const handleDeleteAll = useCallback(async () => {
        setDeletingAll(true)
        try {
            const res = await deleteDocsByUsername({ username, text: "All data deleted from admin panel" }, tenantId)
            if (res.success) { toast.success(`تم تقديم طلب حذف جميع بيانات ${username} — يمكنك متابعته من الطلبات المعلقة`); setConfirmDeleteAll(false); onAllDeleted(); onClose() }
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
            <div className="mx-4 w-full max-w-3xl max-h-[85vh] flex flex-col bg-white" onClick={(e) => e.stopPropagation()} style={{ animation: "uaModalIn .18s ease-out", borderRadius: 12, border: "1px solid var(--t-border-light, #e5e7eb)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid var(--t-border-light, #f0f0f0)", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #004786, #0098d6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Users size={14} style={{ color: "#fff" }} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--t-text, #1f2937)" }}>ملفات المستخدم</h3>
                            <p style={{ fontSize: 10, color: "var(--t-text-faint, #9ca3af)", fontFamily: "monospace", marginTop: 1 }}>{username}</p>
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button onClick={() => setConfirmDeleteAll(true)} style={{ display: "flex", alignItems: "center", gap: 5, borderRadius: 6, padding: "5px 12px", border: "1px solid rgba(220,38,38,0.2)", background: "rgba(220,38,38,0.04)", fontSize: 11, fontWeight: 500, color: "#dc2626", cursor: "pointer" }}><Ban size={11} />حذف جميع بيانات المستخدم</button>
                        <button onClick={onClose} style={{ borderRadius: 6, padding: 5, border: "none", background: "transparent", cursor: "pointer", color: "var(--t-text-faint, #9ca3af)" }}><X size={16} /></button>
                    </div>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
                    {loading ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 0" }}><div className="ua-loading-spinner" /><p style={{ marginTop: 12, fontSize: 13, color: "var(--t-text-faint, #9ca3af)" }} className="animate-pulse">جاري تحميل الملفات...</p></div>
                    ) : files.length === 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 0", textAlign: "center" }}><div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--t-surface, #f3f4f6)", display: "flex", alignItems: "center", justifyContent: "center" }}><FolderOpen size={22} style={{ color: "var(--t-text-faint, #d1d5db)" }} /></div><p style={{ marginTop: 12, fontSize: 13, fontWeight: 500, color: "var(--t-text-secondary, #6b7280)" }}>لا توجد ملفات</p></div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--t-text-faint, #9ca3af)", marginBottom: 4 }}>{files.length} ملف</p>
                            {files.map((file, idx) => (
                                <div key={`${file.media_id}-${idx}`}
                                    style={{ borderRadius: 8, border: deletingFile === file.filename ? "1px solid rgba(220,38,38,0.15)" : "1px solid var(--t-border-light, #e5e7eb)", background: deletingFile === file.filename ? "rgba(220,38,38,0.02)" : "var(--t-card, #fff)", padding: 14, transition: "all 0.15s", opacity: deletingFile === file.filename ? 0.5 : 1, animation: `uaRowFade 0.3s ease-out ${idx * 0.05}s both` }}>
                                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, minWidth: 0 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(0,71,134,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><FileText size={16} style={{ color: "#004786" }} /></div>
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--t-text, #374151)" }} className="truncate" dir="ltr">{file.filepath || file.filename}</p>
                                                <p style={{ marginTop: 2, fontSize: 10, color: "var(--t-text-faint, #9ca3af)", fontFamily: "monospace" }} className="truncate" dir="ltr">{file.filename}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                            <span style={{ display: "flex", alignItems: "center", gap: 4, borderRadius: 12, background: "rgba(0,71,134,0.05)", padding: "3px 8px", fontSize: 10, fontWeight: 600, color: "#004786" }}><Database size={9} />{file.id_count} سجل</span>
                                            <button onClick={() => setViewDataFile(file)} style={{ borderRadius: 6, padding: 5, border: "none", background: "transparent", cursor: "pointer", color: "var(--t-text-faint, #9ca3af)", transition: "color 0.12s" }} title="عرض البيانات" onMouseEnter={e => { e.currentTarget.style.color = "#004786" }} onMouseLeave={e => { e.currentTarget.style.color = "var(--t-text-faint, #9ca3af)" }}><Eye size={13} /></button>
                                            <button onClick={() => handleDownload(file)} disabled={!!downloadingFile} style={{ borderRadius: 6, padding: 5, border: "none", background: "transparent", cursor: "pointer", color: "var(--t-text-faint, #9ca3af)", transition: "color 0.12s", opacity: downloadingFile ? 0.3 : 1 }} title="تنزيل الملف" onMouseEnter={e => { e.currentTarget.style.color = "#059669" }} onMouseLeave={e => { e.currentTarget.style.color = "var(--t-text-faint, #9ca3af)" }}>
                                                {downloadingFile === file.filename ? <Loader2 size={13} className="animate-spin" style={{ color: "#059669" }} /> : <Download size={13} />}
                                            </button>
                                            <button onClick={() => setConfirmDeleteFile(file)} disabled={!!deletingFile} style={{ borderRadius: 6, padding: 5, border: "none", background: "transparent", cursor: "pointer", color: "var(--t-text-faint, #d1d5db)", transition: "color 0.12s", opacity: deletingFile ? 0.3 : 1 }} title="حذف هذا الملف" onMouseEnter={e => { e.currentTarget.style.color = "#dc2626" }} onMouseLeave={e => { e.currentTarget.style.color = "var(--t-text-faint, #d1d5db)" }}>
                                                {deletingFile === file.filename ? <Loader2 size={13} className="animate-spin" style={{ color: "#dc2626" }} /> : <Trash2 size={13} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                                        {file.department_id && <span style={{ display: "flex", alignItems: "center", gap: 4, borderRadius: 12, background: "rgba(0,71,134,0.04)", border: "1px solid rgba(0,71,134,0.08)", padding: "2px 8px", fontSize: 10, color: "#004786" }}><Building2 size={8} />{file.department_id}</span>}
                                        {file.category_id && <span style={{ display: "flex", alignItems: "center", gap: 4, borderRadius: 12, background: "rgba(0,71,134,0.04)", border: "1px solid rgba(0,71,134,0.08)", padding: "2px 8px", fontSize: 10, color: "#004786" }}><Tag size={8} />{file.category_id}</span>}
                                        {file.media_id && <span style={{ display: "flex", alignItems: "center", gap: 4, borderRadius: 12, background: "var(--t-surface, #f3f4f6)", border: "1px solid var(--t-border-light, #e5e7eb)", padding: "2px 8px", fontSize: 10, color: "var(--t-text-faint, #9ca3af)", fontFamily: "monospace" }} dir="ltr"><Hash size={8} />{file.media_id.slice(0, 12)}…</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {confirmDeleteFile && (
                <DeleteConfirmModal title="طلب حذف الملف" subtitle={`هل أنت متأكد من طلب حذف "${confirmDeleteFile.filepath || confirmDeleteFile.filename}"؟`} warning={`سيتم إرسال طلب حذف ${confirmDeleteFile.id_count} سجل مرتبط بهذا الملف للمراجعة والموافقة`} onClose={() => setConfirmDeleteFile(null)} onConfirm={handleDeleteFile} deleting={!!deletingFile} />
            )}
            {confirmDeleteAll && (
                <DeleteConfirmModal title="طلب حذف جميع بيانات المستخدم" subtitle={`هل أنت متأكد من طلب حذف جميع بيانات "${username}"؟`} warning="سيتم إرسال طلب حذف جميع الملفات والسجلات المرتبطة بهذا المستخدم للمراجعة والموافقة" onClose={() => setConfirmDeleteAll(false)} onConfirm={handleDeleteAll} deleting={deletingAll} />
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
        <tr className="group transition-colors" style={{ animation: `uaRowFade 0.3s ease-out ${idx * 0.04}s both`, background: deletingUser ? "rgba(220,38,38,0.02)" : "transparent", opacity: deletingUser ? 0.5 : 1 }}
            onMouseEnter={e => { if (!deletingUser) e.currentTarget.style.background = "var(--t-card-hover, #f9fafb)" }}
            onMouseLeave={e => { if (!deletingUser) e.currentTarget.style.background = "transparent" }}>
            <td style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", backgroundColor: avatarColor, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--t-text, #374151)" }} className="truncate" dir="ltr">{user.username}</p>
                </div>
            </td>
            <td style={{ padding: "12px 16px" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 12, background: "rgba(0,71,134,0.05)", padding: "3px 10px", fontSize: 11, fontWeight: 600, color: "#004786" }}><FileText size={11} />{user.file_count}</span></td>
            <td style={{ padding: "12px 16px" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 12, background: "rgba(0,71,134,0.05)", padding: "3px 10px", fontSize: 11, fontWeight: 600, color: "#004786" }}><Database size={11} />{user.total_ids.toLocaleString()}</span></td>
            <td style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <ActionGuard pageBit={PAGE_BITS.DOCUMENTS} actionBit={ACTION_BITS.LIST_USER_FILES}>
                        <button onClick={() => onViewFiles(user.username)} style={{ display: "flex", alignItems: "center", gap: 5, borderRadius: 6, padding: "5px 12px", border: "1px solid var(--t-border-light, #e5e7eb)", background: "var(--t-card, #fff)", fontSize: 11, fontWeight: 500, color: "var(--t-text-secondary, #6b7280)", cursor: "pointer", transition: "all 0.12s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "#004786"; e.currentTarget.style.color = "#004786" }} onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--t-border-light, #e5e7eb)"; e.currentTarget.style.color = "var(--t-text-secondary, #6b7280)" }}><Eye size={12} />عرض الملفات</button>
                    </ActionGuard>
                    <ActionGuard pageBit={PAGE_BITS.DOCUMENTS} actionBit={ACTION_BITS.DELETE_DOCS_BY_USER}>
                        <button onClick={() => onDeleteUser(user)} style={{ borderRadius: 6, padding: 5, border: "none", background: "transparent", cursor: "pointer", color: "var(--t-text-faint, #d1d5db)", transition: "color 0.12s", opacity: 0 }} className="group-hover:!opacity-100" title="حذف جميع بيانات المستخدم" onMouseEnter={e => { e.currentTarget.style.color = "#dc2626" }} onMouseLeave={e => { e.currentTarget.style.color = "var(--t-text-faint, #d1d5db)" }}><Trash2 size={13} /></button>
                    </ActionGuard>
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
        <div className="space-y-4">
            {/* Header + Department Tabs */}
            <div style={{ borderRadius: 10, border: "1px solid var(--t-border-light, #e5e7eb)", background: "var(--t-card, #fff)", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--t-border-light, #f0f0f0)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: "linear-gradient(135deg, #004786, #0098d6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Users size={17} style={{ color: "#fff" }} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--t-text, #1f2937)", margin: 0 }}>ملفات المستخدمين</h2>
                            <p style={{ fontSize: 11, color: "var(--t-text-faint, #9ca3af)", marginTop: 1 }}>عرض المستخدمين وملفاتهم في قاعدة المعرفة</p>
                        </div>
                    </div>
                    {!loading && users.length > 0 && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 12, background: "rgba(0,71,134,0.05)", border: "1px solid rgba(0,71,134,0.12)", padding: "4px 12px", fontSize: 11, fontWeight: 600, color: "#004786" }}>
                            <Users size={11} />
                            {totalCount} مستخدم
                        </span>
                    )}
                </div>
                {/* Department Tabs inside the header card */}
                <div className="overflow-x-auto" style={{ padding: "10px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button onClick={() => handleDeptChange("")}
                            style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, borderRadius: 7, padding: "6px 12px", fontSize: 11, fontWeight: !selectedDept ? 600 : 500, border: !selectedDept ? "1px solid #004786" : "1px solid var(--t-border-light, #e5e7eb)", background: !selectedDept ? "rgba(0,71,134,0.06)" : "transparent", color: !selectedDept ? "#004786" : "var(--t-text-secondary, #6b7280)", cursor: "pointer", transition: "all 0.15s" }}>
                            <Building2 size={11} />الكل
                        </button>
                        {departments.map((dept) => (
                            <button key={dept.department_id} onClick={() => handleDeptChange(dept.department_id)}
                                style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, borderRadius: 7, padding: "6px 12px", fontSize: 11, fontWeight: selectedDept === dept.department_id ? 600 : 500, border: selectedDept === dept.department_id ? "1px solid #004786" : "1px solid var(--t-border-light, #e5e7eb)", background: selectedDept === dept.department_id ? "rgba(0,71,134,0.06)" : "transparent", color: selectedDept === dept.department_id ? "#004786" : "var(--t-text-secondary, #6b7280)", cursor: "pointer", transition: "all 0.15s" }}>
                                {dept.icon && <span style={{ fontSize: 13 }}>{dept.icon}</span>}
                                {dept.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Search + Category Filter + Delete */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="بحث بالبريد الإلكتروني..." value={searchInput} onChange={(e) => handleSearchInput(e.target.value)} style={{ width: "100%", borderRadius: 8, border: "1px solid var(--t-border-light, #e5e7eb)", background: "var(--t-card, #fff)", padding: "8px 36px 8px 36px", fontSize: 13, color: "var(--t-text, #374151)", outline: "none" }} dir="ltr" />
                    {searchInput && <button onClick={() => { setSearchInput(""); setSearchVal("") }} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><X size={14} /></button>}
                    {loading && searchInput && <Loader2 size={14} className="absolute left-10 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />}
                </div>
                <div className="relative shrink-0">
                    <Filter size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <select value={selectedCat} onChange={(e) => handleCatChange(e.target.value)}
                        style={{ appearance: "none", borderRadius: 8, border: selectedCat ? "1px solid rgba(0,71,134,0.3)" : "1px solid var(--t-border-light, #e5e7eb)", background: selectedCat ? "rgba(0,71,134,0.04)" : "var(--t-card, #fff)", padding: "8px 16px 8px 32px", fontSize: 12, fontWeight: 500, color: selectedCat ? "#004786" : "var(--t-text-secondary, #6b7280)", outline: "none", cursor: "pointer", minWidth: 130 }}>
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
                <ActionGuard pageBit={PAGE_BITS.DOCUMENTS} actionBit={ACTION_BITS.DELETE_COLLECTION}>
                    <button onClick={() => setShowDeleteCollection(true)} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(220,38,38,0.15)", background: "rgba(220,38,38,0.03)", color: "#dc2626", fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.15s" }}><Ban size={13} />حذف الكل</button>
                </ActionGuard>
            </div>

            {/* Info bar */}
            {!loading && users.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 8, background: "var(--t-card, #fff)", border: "1px solid var(--t-border-light, #e5e7eb)", padding: "7px 14px" }}>
                    <p style={{ fontSize: 11, color: "var(--t-text-secondary, #6b7280)" }}>
                        <span style={{ fontWeight: 700, color: "#004786" }}>{totalCount}</span> مستخدم
                        {selectedDept && <span style={{ color: "var(--t-text-faint, #9ca3af)" }}> — {activeDeptLabel}</span>}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--t-text-faint, #9ca3af)" }}>صفحة {page} من {totalPages}</p>
                </div>
            )}

            {/* Table */}
            <div style={{ position: "relative", overflow: "hidden", borderRadius: 10, border: "1px solid var(--t-border-light, #e5e7eb)", background: "var(--t-card, #fff)" }}>
                <FetchingBar visible={backgroundFetching} />
                <div className="overflow-x-auto" style={{ opacity: backgroundFetching ? 0.6 : 1, transition: 'opacity 0.2s ease' }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--t-border-light, #f0f0f0)", background: "var(--t-surface, #fafafa)", textAlign: "right" }}>
                                {["المستخدم", "عدد الملفات", "عدد السجلات", "الإجراءات"].map(h => (
                                    <th key={h} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 600, color: "var(--t-text-faint, #9ca3af)", letterSpacing: "0.3px" }}>{h}</th>
                                ))}
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
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 0", textAlign: "center" }}>
                        <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--t-surface, #f3f4f6)", display: "flex", alignItems: "center", justifyContent: "center" }}><User size={24} style={{ color: "var(--t-text-faint, #d1d5db)" }} /></div>
                        <p style={{ marginTop: 14, fontSize: 13, fontWeight: 500, color: "var(--t-text-secondary, #6b7280)" }}>{searchVal ? "لا يوجد مستخدمين مطابقين" : selectedDept ? `لا يوجد ملفات في قسم ${activeDeptLabel}` : "لا يوجد مستخدمين"}</p>
                        <p style={{ marginTop: 4, fontSize: 11, color: "var(--t-text-faint, #9ca3af)" }}>{searchVal ? "جرب كلمة بحث مختلفة" : "لم يتم رفع أي ملفات بعد"}</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, paddingTop: 8 }}>
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 7, border: "1px solid var(--t-border-light, #e5e7eb)", background: "var(--t-card, #fff)", fontSize: 12, fontWeight: 500, color: "var(--t-text-secondary, #6b7280)", cursor: "pointer", opacity: page <= 1 ? 0.4 : 1 }}><ChevronRight size={13} /> السابق</button>
                    <span style={{ display: "flex", height: 30, alignItems: "center", borderRadius: 7, background: "#004786", padding: "0 12px", fontSize: 12, fontWeight: 700, color: "#fff" }}>{page}</span>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} onMouseEnter={() => page < totalPages && prefetchNextUsers()} disabled={page >= totalPages} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 7, border: "1px solid var(--t-border-light, #e5e7eb)", background: "var(--t-card, #fff)", fontSize: 12, fontWeight: 500, color: "var(--t-text-secondary, #6b7280)", cursor: "pointer", opacity: page >= totalPages ? 0.4 : 1 }}>التالي <ChevronLeft size={13} /></button>
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
                    <div className="mx-4 w-full max-w-md overflow-hidden bg-white" onClick={(e) => e.stopPropagation()} style={{ animation: "uaModalIn .18s ease-out", borderRadius: 12, border: "1px solid var(--t-border-light, #e5e7eb)" }}>
                        <div style={{ padding: 20 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(220,38,38,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}><Ban size={18} style={{ color: "#dc2626" }} /></div>
                                <div><h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--t-text, #1f2937)" }}>حذف جميع البيانات</h3><p style={{ fontSize: 11, color: "var(--t-text-faint, #9ca3af)", marginTop: 1 }}>سيتم حذف جميع البيانات من قاعدة المعرفة</p></div>
                            </div>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, borderRadius: 8, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", padding: 10, textAlign: "right" }}>
                                <AlertTriangle size={14} style={{ color: "#d97706", marginTop: 2, flexShrink: 0 }} />
                                <p style={{ fontSize: 11, color: "#92400e", lineHeight: 1.6 }}>عملية حذف جميع البيانات <strong>لا يمكن التراجع عنها</strong> — سيتم حذف جميع الملفات والسجلات نهائياً</p>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, borderTop: "1px solid var(--t-border-light, #f0f0f0)", padding: "12px 20px" }}>
                            <button onClick={() => setShowDeleteCollection(false)} style={{ padding: "7px 16px", borderRadius: 7, border: "1px solid var(--t-border-light, #e5e7eb)", background: "var(--t-card, #fff)", fontSize: 13, fontWeight: 500, color: "var(--t-text-secondary, #6b7280)", cursor: "pointer" }}>إلغاء</button>
                            <button onClick={handleDeleteCollection} disabled={deletingCollection} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 18px", borderRadius: 7, border: "none", background: "#dc2626", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", opacity: deletingCollection ? 0.5 : 1 }}>
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
