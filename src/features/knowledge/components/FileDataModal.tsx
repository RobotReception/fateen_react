import { useState, useEffect, useCallback, memo, useRef } from "react"
import { toast } from "sonner"
import {
    Search, X, Loader2, ChevronLeft, ChevronRight,
    Eye, Pencil, Trash2, Copy, Check, Database, FileText,
    AlertTriangle,
} from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { getFileDocs, updateDocument, deleteDocuments } from "../services/knowledge-service"
import type { SearchDocumentResult, SearchPagination } from "../types"

/* ══════════ CONSTANTS ══════════ */
const PAGE_SIZE = 10
const TRUNCATE_LEN = 100

function truncate(text: string, max = TRUNCATE_LEN) {
    if (!text) return "—"
    return text.length > max ? text.slice(0, max) + "…" : text
}

/* ══════════ TEXT PREVIEW MODAL ══════════ */
const TextModal = memo(function TextModal({ text, onClose }: { text: string; onClose: () => void }) {
    const [copied, setCopied] = useState(false)
    const copy = useCallback(async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }, [text])

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="mx-4 w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ animation: "uaModalIn .18s ease-out" }}>
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                    <p className="text-sm font-bold text-gray-700">عرض النص</p>
                    <div className="flex items-center gap-2">
                        <button onClick={copy} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50">
                            {copied ? <><Check size={12} className="text-green-500" />تم النسخ</> : <><Copy size={12} />نسخ</>}
                        </button>
                        <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={16} /></button>
                    </div>
                </div>
                <div className="max-h-[60vh] overflow-y-auto p-5 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap" dir="auto">{text}</div>
            </div>
        </div>
    )
})

/* ══════════ EDIT MODAL ══════════ */
const EditModal = memo(function EditModal({ doc, onClose, onSave, saving }: {
    doc: SearchDocumentResult; onClose: () => void; onSave: (t: string) => void; saving: boolean
}) {
    const [newText, setNewText] = useState(doc.text)
    const changed = newText !== doc.text && newText.trim().length > 0

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="mx-4 w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ animation: "uaModalIn .18s ease-out" }}>
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                    <p className="text-sm font-bold text-gray-700">تعديل النص</p>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={16} /></button>
                </div>
                <div className="p-5">
                    <textarea value={newText} onChange={(e) => setNewText(e.target.value)} rows={10}
                        className="w-full rounded-xl border border-gray-200 p-4 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none" dir="auto" />
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-3">
                    <button onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">إلغاء</button>
                    <button onClick={() => onSave(newText)} disabled={!changed || saving}
                        className="flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2 text-xs font-medium text-white  disabled:opacity-50">
                        {saving && <Loader2 size={14} className="animate-spin" />}
                        حفظ التعديل
                    </button>
                </div>
            </div>
        </div>
    )
})

/* ══════════ DELETE MODAL ══════════ */
const DeleteModal = memo(function DeleteModal({ count, onClose, onConfirm, deleting }: {
    count: number; onClose: () => void; onConfirm: () => void; deleting: boolean
}) {
    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ animation: "uaModalIn .18s ease-out" }}>
                <div className="p-6 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50"><Trash2 size={24} className="text-red-500" /></div>
                    <h3 className="text-lg font-bold text-gray-800">حذف {count} سجل</h3>
                    <p className="mt-2 text-sm text-gray-500">هل أنت متأكد من حذف {count === 1 ? "هذا السجل" : `هذه السجلات (${count})`}؟ لا يمكن التراجع عن هذا الإجراء.</p>
                </div>
                <div className="flex items-center justify-center gap-3 border-t border-gray-100 px-6 py-4">
                    <button onClick={onClose} disabled={deleting} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">إلغاء</button>
                    <button onClick={onConfirm} disabled={deleting} className="flex items-center gap-2 rounded-xl bg-gray-800 px-5 py-2.5 text-sm font-medium text-white  disabled:opacity-50">
                        {deleting && <Loader2 size={14} className="animate-spin" />}
                        حذف
                    </button>
                </div>
            </div>
        </div>
    )
})

/* ══════════ DOC ROW ══════════ */
const DocRow = memo(function DocRow({ doc, idx, isSelected, onToggle, onView, onEdit, onDelete }: {
    doc: SearchDocumentResult; idx: number; isSelected: boolean
    onToggle: (id: string) => void; onView: (d: SearchDocumentResult) => void
    onEdit: (d: SearchDocumentResult) => void; onDelete: (id: string) => void
}) {
    return (
        <tr className={`group transition-colors ${isSelected ? "bg-blue-50/60" : "hover:bg-gray-50/80"}`} style={{ animation: `uaRowFade .2s ease-out ${idx * 0.025}s both` }}>
            <td className="px-4 py-3">
                <input type="checkbox" checked={isSelected} onChange={() => onToggle(doc.doc_id)} className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 accent-blue-600 cursor-pointer" />
            </td>
            <td className="px-4 py-3"><span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-[10px] text-gray-500" dir="ltr">{doc.doc_id.slice(0, 10)}…</span></td>
            <td className="px-4 py-3">
                <button onClick={() => onView(doc)} className="max-w-xs text-right text-xs text-gray-600 hover:text-blue-600 transition-colors truncate block" dir="auto">
                    {truncate(doc.text)}
                </button>
            </td>
            <td className="px-4 py-3"><span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600 whitespace-nowrap">{doc.user}</span></td>
            <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-1">
                    <button onClick={() => onView(doc)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-500" title="عرض"><Eye size={14} /></button>
                    <button onClick={() => onEdit(doc)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-amber-50 hover:text-amber-500" title="تعديل"><Pencil size={14} /></button>
                    <button onClick={() => onDelete(doc.doc_id)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500" title="حذف"><Trash2 size={14} /></button>
                </div>
            </td>
        </tr>
    )
})

/* ══════════ PAGINATION HELPER ══════════ */
function pageNums(c: number, t: number): (number | "...")[] {
    if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1)
    if (c <= 3) return [1, 2, 3, 4, "...", t]
    if (c >= t - 2) return [1, "...", t - 3, t - 2, t - 1, t]
    return [1, "...", c - 1, c, c + 1, "...", t]
}

/* ════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════ */

interface FileDataModalProps {
    username: string
    filename: string
    filepath: string
    tenantId: string
    departmentId?: string
    categoryId?: string
    onClose: () => void
}

export const FileDataModal = memo(function FileDataModal({ username, filename, filepath, tenantId, departmentId, categoryId, onClose }: FileDataModalProps) {
    // ── Search ──
    const [query, setQuery] = useState("")
    const [debouncedQuery, setDebouncedQuery] = useState("")
    const debounceRef = useRef<ReturnType<typeof setTimeout>>()

    // ── Results ──
    const [results, setResults] = useState<SearchDocumentResult[]>([])
    const [pagination, setPagination] = useState<SearchPagination | null>(null)
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)

    // ── Selection ──
    const [selected, setSelected] = useState<Set<string>>(new Set())

    // ── Modals ──
    const [viewDoc, setViewDoc] = useState<SearchDocumentResult | null>(null)
    const [editDoc, setEditDoc] = useState<SearchDocumentResult | null>(null)
    const [deleteTargets, setDeleteTargets] = useState<string[] | null>(null)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const abortRef = useRef<AbortController | null>(null)

    const allSelected = results.length > 0 && selected.size === results.length
    const someSelected = selected.size > 0 && selected.size < results.length
    const totalPages = pagination ? pagination.totalPages : 1

    /* ─── Debounce ─── */
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => { setDebouncedQuery(query); setPage(1) }, 350)
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    }, [query])

    /* ─── Fetch documents ─── */
    const fetchDocuments = useCallback(async () => {
        if (abortRef.current) abortRef.current.abort()
        const controller = new AbortController()
        abortRef.current = controller

        setLoading(true)
        setSelected(new Set())
        try {
            const res = await getFileDocs(username, filename, {
                page,
                page_size: PAGE_SIZE,
                query: debouncedQuery || "",
                department_id: departmentId || "",
                category_id: categoryId || "",
            }, tenantId)
            if (controller.signal.aborted) return
            if (res.success && res.data) {
                setResults(res.data.results ?? [])
                setPagination(res.data.pagination ?? null)
            }
        } catch (err) {
            if (controller.signal.aborted) return
            toast.error("فشل تحميل بيانات الملف")
        } finally {
            if (!controller.signal.aborted) setLoading(false)
        }
    }, [tenantId, username, filename, debouncedQuery, page, departmentId, categoryId])

    useEffect(() => { fetchDocuments() }, [fetchDocuments])

    /* ─── Selection ─── */
    const toggleSelect = useCallback((id: string) => {
        setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
    }, [])
    const toggleAll = useCallback(() => {
        setSelected((prev) => prev.size === results.length ? new Set() : new Set(results.map((r) => r.doc_id)))
    }, [results])

    /* ─── CRUD handlers ─── */
    const handleUpdate = useCallback(async (newText: string) => {
        if (!editDoc) return
        setSaving(true)
        try {
            const res = await updateDocument({ doc_id: editDoc.doc_id, text: editDoc.text, new_text: newText }, tenantId)
            if (res.success) { toast.success("تم إرسال طلب التحديث بنجاح"); setEditDoc(null); fetchDocuments() }
            else toast.error(res.message || "فشل التحديث")
        } catch { toast.error("حدث خطأ أثناء التحديث") }
        finally { setSaving(false) }
    }, [editDoc, tenantId, fetchDocuments])

    const handleDelete = useCallback(async () => {
        if (!deleteTargets) return
        setDeleting(true)
        try {
            const res = await deleteDocuments({ doc_id: deleteTargets.length === 1 ? deleteTargets[0] : deleteTargets }, tenantId)
            if (res.success) { toast.success(`تم حذف ${deleteTargets.length} سجل بنجاح`); setDeleteTargets(null); setSelected(new Set()); fetchDocuments() }
            else toast.error(res.message || "فشل الحذف")
        } catch { toast.error("حدث خطأ أثناء الحذف") }
        finally { setDeleting(false) }
    }, [deleteTargets, tenantId, fetchDocuments])

    /* ══════════ RENDER ══════════ */
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="mx-4 w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()} style={{ animation: "uaModalIn .18s ease-out" }}>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 shrink-0"><FileText size={18} className="text-blue-500" /></div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-bold text-gray-700 truncate">بيانات الملف</h3>
                            <p className="mt-0.5 text-xs text-gray-400 font-mono truncate" dir="ltr">{filepath || filename}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><X size={18} /></button>
                </div>

                {/* Search + bulk actions */}
                <div className="flex items-center gap-3 border-b border-gray-50 px-6 py-3 shrink-0">
                    <div className="relative flex-1">
                        <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="بحث في محتوى الملف..." value={query} onChange={(e) => setQuery(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white py-2 pr-9 pl-4 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" dir="auto" />
                        {query && <button onClick={() => { setQuery(""); setDebouncedQuery("") }} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><X size={14} /></button>}
                    </div>
                    {selected.size > 0 && (
                        <button onClick={() => setDeleteTargets(Array.from(selected))}
                            className="flex items-center gap-1.5 rounded-xl bg-red-50 border border-red-200 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors">
                            <Trash2 size={13} />حذف المحدد ({selected.size})
                        </button>
                    )}
                </div>

                {/* Info bar */}
                {!loading && pagination && (
                    <div className="flex items-center justify-between px-6 py-2 border-b border-gray-50 text-xs text-gray-400 shrink-0">
                        <span>{pagination.totalCount} سجل إجمالي</span>
                        <span>صفحة {pagination.currentPage} من {pagination.totalPages}</span>
                    </div>
                )}

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16"><Loader2 size={24} className="text-blue-500 animate-spin" /><p className="mt-3 text-sm text-gray-400">جاري التحميل...</p></div>
                    ) : results.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center"><Database size={32} className="text-gray-300" /><p className="mt-3 text-sm font-medium text-gray-500">{debouncedQuery ? "لا توجد نتائج مطابقة" : "لا توجد سجلات"}</p></div>
                    ) : (
                        <table className="w-full text-right">
                            <thead className="sticky top-0 bg-gray-50/95 backdrop-blur-sm border-b border-gray-100">
                                <tr className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                    <th className="px-4 py-3 w-10">
                                        <input type="checkbox" checked={allSelected} ref={(el) => { if (el) el.indeterminate = someSelected }}
                                            onChange={toggleAll} className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 accent-blue-600 cursor-pointer" />
                                    </th>
                                    <th className="px-4 py-3 w-28">المعرّف</th>
                                    <th className="px-4 py-3">النص</th>
                                    <th className="px-4 py-3 w-28">المستخدم</th>
                                    <th className="px-4 py-3 w-28 text-center">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {results.map((doc, idx) => (
                                    <DocRow key={doc.doc_id} doc={doc} idx={idx} isSelected={selected.has(doc.doc_id)}
                                        onToggle={toggleSelect} onView={setViewDoc} onEdit={setEditDoc} onDelete={(id) => setDeleteTargets([id])} />
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {pagination && totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1 border-t border-gray-100 px-6 py-3 shrink-0">
                        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30"><ChevronRight size={16} /></button>
                        {pageNums(page, totalPages).map((n, i) =>
                            n === "..." ? <span key={`e${i}`} className="px-1 text-gray-300">…</span> : (
                                <button key={n} onClick={() => setPage(n as number)}
                                    className={`min-w-[32px] rounded-lg px-2 py-1 text-xs font-medium transition-colors ${page === n ? "bg-blue-600 text-white shadow" : "text-gray-500 hover:bg-gray-100"}`}>{n}</button>
                            )
                        )}
                        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30"><ChevronLeft size={16} /></button>
                    </div>
                )}
            </div>

            {/* Sub-modals */}
            {viewDoc && <TextModal text={viewDoc.text} onClose={() => setViewDoc(null)} />}
            {editDoc && <EditModal doc={editDoc} onClose={() => setEditDoc(null)} onSave={handleUpdate} saving={saving} />}
            {deleteTargets && <DeleteModal count={deleteTargets.length} onClose={() => setDeleteTargets(null)} onConfirm={handleDelete} deleting={deleting} />}
        </div>
    )
})
