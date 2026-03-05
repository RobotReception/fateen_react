import { useState, useEffect, useCallback, useRef, memo, useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useKnowledgeEvents } from "../hooks/useKnowledgeEvents"
import { toast } from "sonner"
import { FetchingBar } from "@/components/ui/FetchingBar"
import {
    Search,
    Loader2,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    Database,
    Filter,
    X,
    User,
    Hash,
    Eye,
    Pencil,
    Trash2,
    Copy,
    Check,
    CheckSquare,
    Square,
    MinusSquare,
    Upload,
    FileText,
    Plus,
    Building2,
    ArrowLeft,
    FolderTree,
    CheckCircle2,
    XCircle,
    Link2,
    Settings2,
    FileType2,
    FileSpreadsheet,
    Layers,
} from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { useDepartmentsLookup, useDepartmentCategories } from "../hooks/use-departments"
import { useSearchDocuments, useUpdateDocument, useDeleteDocuments } from "../hooks/use-documents"
import { usePrefetchDocuments } from "../hooks/use-prefetch"
import {
    trainTxtRequest,
    trainCsvRequest,
    addDataJson,
} from "../services/knowledge-service"
import type {
    CategoryItem,
    SearchDocumentResult,
} from "../types"
import { ActionGuard } from "@/components/guards/ActionGuard"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"

/* ═══════════════════════ CONSTANTS ═══════════════════════ */
const PAGE_SIZE = 10
const DEBOUNCE_MS = 350
const TRUNCATE_LEN = 100
const ID_DISPLAY_LEN = 10

/* ═══════════════════════ HELPERS ═══════════════════════ */

function truncate(text: string, max = TRUNCATE_LEN): string {
    if (!text) return ""
    const clean = text.replace(/\s+/g, " ").trim()
    return clean.length <= max ? clean : clean.slice(0, max) + "…"
}

function truncateId(id: string): string {
    return id.length > ID_DISPLAY_LEN ? id.slice(0, ID_DISPLAY_LEN) + "…" : id
}

/* ═══════════════════════ SKELETON ═══════════════════════ */

const SkeletonRow = memo(function SkeletonRow({ delay = 0 }: { delay?: number }) {
    return (
        <tr style={{ animationDelay: `${delay}ms` }} className="skeleton-shimmer">
            <td className="px-4 py-3"><div className="h-4 w-4 rounded-md skeleton-bone" /></td>
            <td className="px-4 py-3"><div className="h-4 w-20 rounded-md skeleton-bone" /></td>
            <td className="px-4 py-3"><div className="space-y-1.5"><div className="h-3.5 w-full rounded-md skeleton-bone" /><div className="h-3.5 w-3/4 rounded-md skeleton-bone" /></div></td>
            <td className="px-4 py-3"><div className="h-4 w-16 rounded-md skeleton-bone" /></td>
            <td className="px-4 py-3"><div className="h-5 w-14 rounded-full skeleton-bone" /></td>
            <td className="px-4 py-3"><div className="mx-auto flex gap-1 justify-center"><div className="h-7 w-7 rounded-md skeleton-bone" /><div className="h-7 w-7 rounded-md skeleton-bone" /><div className="h-7 w-7 rounded-md skeleton-bone" /></div></td>
        </tr>
    )
})

function TableSkeleton() {
    return <>{Array.from({ length: 6 }, (_, i) => <SkeletonRow key={i} delay={i * 80} />)}</>
}

/* ═══════════════════ MEMOIZED SUB-COMPONENTS ═══════════════════ */

/* ── Text Preview Modal ── */
const TextModal = memo(function TextModal({ text, onClose }: { text: string; onClose: () => void }) {
    const [copied, setCopied] = useState(false)
    const copy = useCallback(async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }, [text])

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="mx-4 max-h-[80vh] w-full max-w-2xl overflow-hidden bg-white" onClick={(e) => e.stopPropagation()} style={{ animation: "modalIn .18s ease-out", borderRadius: 12, border: "1px solid var(--t-border-light, #e5e7eb)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid var(--t-border-light, #f0f0f0)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #004786, #0098d6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Eye size={14} style={{ color: "#fff" }} />
                        </div>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--t-text, #1f2937)" }}>محتوى المستند</h3>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button onClick={copy} style={{ display: "flex", alignItems: "center", gap: 5, borderRadius: 6, padding: "5px 12px", border: "1px solid var(--t-border-light, #e5e7eb)", background: copied ? "rgba(16,185,129,0.05)" : "var(--t-card, #fff)", fontSize: 11, fontWeight: 500, color: copied ? "#059669" : "var(--t-text-secondary, #6b7280)", cursor: "pointer", transition: "all 0.12s" }}>
                            {copied ? <Check size={11} /> : <Copy size={11} />}
                            {copied ? "تم النسخ" : "نسخ"}
                        </button>
                        <button onClick={onClose} style={{ borderRadius: 6, padding: 5, border: "none", background: "transparent", cursor: "pointer", color: "var(--t-text-faint, #9ca3af)", transition: "color 0.12s" }}><X size={16} /></button>
                    </div>
                </div>
                <div style={{ maxHeight: "60vh", overflowY: "auto", padding: 20, fontSize: 13, lineHeight: 1.8, color: "var(--t-text, #374151)", whiteSpace: "pre-wrap" }} dir="auto">{text}</div>
            </div>
        </div>
    )
})

/* ── Edit Modal ── */
const EditModal = memo(function EditModal({ doc, onClose, onSave, saving }: { doc: SearchDocumentResult; onClose: () => void; onSave: (newText: string) => void; saving: boolean }) {
    const [newText, setNewText] = useState(doc.text)
    const changed = newText !== doc.text && newText.trim().length > 0

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="mx-4 w-full max-w-2xl overflow-hidden bg-white" onClick={(e) => e.stopPropagation()} style={{ animation: "modalIn .18s ease-out", borderRadius: 12, border: "1px solid var(--t-border-light, #e5e7eb)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid var(--t-border-light, #f0f0f0)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #004786, #0098d6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Pencil size={14} style={{ color: "#fff" }} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--t-text, #1f2937)" }}>تعديل المستند</h3>
                            <p style={{ fontSize: 10, color: "var(--t-text-faint, #9ca3af)", fontFamily: "monospace", marginTop: 1 }}>#{doc.doc_id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ borderRadius: 6, padding: 5, border: "none", background: "transparent", cursor: "pointer", color: "var(--t-text-faint, #9ca3af)" }}><X size={16} /></button>
                </div>
                <div style={{ padding: 20 }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--t-text-faint, #9ca3af)", marginBottom: 6 }}>النص الجديد</label>
                    <textarea value={newText} onChange={(e) => setNewText(e.target.value)} rows={10} dir="auto" style={{ width: "100%", borderRadius: 8, border: "1px solid var(--t-border-light, #e5e7eb)", background: "var(--t-surface, #f9fafb)", padding: 12, fontSize: 13, color: "var(--t-text, #374151)", outline: "none", resize: "vertical", transition: "border-color 0.15s", lineHeight: 1.7 }} onFocus={e => { e.currentTarget.style.borderColor = "#004786" }} onBlur={e => { e.currentTarget.style.borderColor = "var(--t-border-light, #e5e7eb)" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, borderTop: "1px solid var(--t-border-light, #f0f0f0)", padding: "12px 20px" }}>
                    <button onClick={onClose} disabled={saving} style={{ padding: "7px 16px", borderRadius: 7, border: "1px solid var(--t-border-light, #e5e7eb)", background: "var(--t-card, #fff)", fontSize: 13, fontWeight: 500, color: "var(--t-text-secondary, #6b7280)", cursor: "pointer" }}>إلغاء</button>
                    <button onClick={() => onSave(newText)} disabled={saving || !changed} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 18px", borderRadius: 7, border: "none", background: "#004786", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", opacity: (saving || !changed) ? 0.5 : 1 }}>
                        {saving && <Loader2 size={14} className="animate-spin" />}
                        حفظ التعديل
                    </button>
                </div>
            </div>
        </div>
    )
})

/* ── Delete Confirmation ── */
const DeleteModal = memo(function DeleteModal({ count, onClose, onConfirm, deleting }: { count: number; onClose: () => void; onConfirm: () => void; deleting: boolean }) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="mx-4 w-full max-w-md overflow-hidden bg-white" onClick={(e) => e.stopPropagation()} style={{ animation: "modalIn .18s ease-out", borderRadius: 12, border: "1px solid var(--t-border-light, #e5e7eb)" }}>
                <div style={{ padding: "28px 24px 20px", textAlign: "center" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(220,38,38,0.06)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                        <Trash2 size={22} style={{ color: "#dc2626" }} />
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--t-text, #1f2937)" }}>تأكيد الحذف</h3>
                    <p style={{ fontSize: 13, color: "var(--t-text-secondary, #6b7280)", marginTop: 8 }}>هل أنت متأكد من حذف <span style={{ fontWeight: 700, color: "#dc2626" }}>{count}</span> {count === 1 ? "مستند" : "مستندات"}؟</p>
                    <p style={{ fontSize: 11, color: "var(--t-text-faint, #9ca3af)", marginTop: 4 }}>لا يمكن التراجع عن هذا الإجراء</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, borderTop: "1px solid var(--t-border-light, #f0f0f0)", padding: "14px 24px" }}>
                    <button onClick={onClose} disabled={deleting} style={{ padding: "8px 20px", borderRadius: 7, border: "1px solid var(--t-border-light, #e5e7eb)", background: "var(--t-card, #fff)", fontSize: 13, fontWeight: 500, color: "var(--t-text-secondary, #6b7280)", cursor: "pointer" }}>إلغاء</button>
                    <button onClick={onConfirm} disabled={deleting} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", borderRadius: 7, border: "none", background: "#dc2626", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", opacity: deleting ? 0.5 : 1 }}>
                        {deleting && <Loader2 size={14} className="animate-spin" />}
                        حذف
                    </button>
                </div>
            </div>
        </div>
    )
})

/* ── Upload Training Modal — Tabbed (General / TXT / CSV) ── */
type TrainTab = "txt" | "csv"
const TRAIN_TABS: { key: TrainTab; label: string; icon: typeof Layers; accept: string; desc: string }[] = [
    { key: "txt", label: "TXT", icon: FileType2, accept: ".txt", desc: "ملفات نصية فقط" },
    { key: "csv", label: "CSV", icon: FileSpreadsheet, accept: ".csv", desc: "ملفات CSV فقط" },
]

const TrainUploadModal = memo(function TrainUploadModal({ categories, activeDeptId, activeDeptName, onClose, onSuccess, tenantId }: {
    categories: CategoryItem[]; activeDeptId: string; activeDeptName: string
    onClose: () => void; onSuccess: () => void; tenantId: string
}) {
    const [tab, setTab] = useState<TrainTab>("txt")
    const [files, setFiles] = useState<File[]>([])
    const [categoryId, setCategoryId] = useState("")
    const [url, setUrl] = useState("")
    const [uploading, setUploading] = useState(false)
    const [dragging, setDragging] = useState(false)
    const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // CSV-specific options
    const [hasHeader, setHasHeader] = useState(false)
    const [delimiter, setDelimiter] = useState(",")
    const [encoding, setEncoding] = useState("utf-8")
    const [questionCol, setQuestionCol] = useState(0)
    const [answerCol, setAnswerCol] = useState(1)



    // Reset files when switching tabs
    useEffect(() => { setFiles([]); setResult(null); setUrl("") }, [tab])

    const activeTab = TRAIN_TABS.find(t => t.key === tab)!

    const validateFiles = useCallback((incoming: File[]): File[] => {
        const ext = tab === "txt" ? /\.txt$/i : tab === "csv" ? /\.csv$/i : /\.(txt|csv)$/i
        const valid = incoming.filter(f => ext.test(f.name))
        if (valid.length < incoming.length) {
            toast.error(`بعض الملفات مرفوضة — يقبل هذا التاب ${activeTab.desc} فقط`)
        }
        return valid
    }, [tab, activeTab.desc])

    const handleFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return
        const valid = validateFiles(Array.from(e.target.files))
        if (valid.length > 0) setFiles(prev => [...prev, ...valid])
        e.target.value = ""
    }, [validateFiles])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); setDragging(false)
        const dropped = Array.from(e.dataTransfer.files)
        const valid = validateFiles(dropped)
        if (valid.length > 0) setFiles(prev => [...prev, ...valid])
    }, [validateFiles])

    const removeFile = useCallback((idx: number) => setFiles(p => p.filter((_, i) => i !== idx)), [])

    const handleUpload = useCallback(async () => {
        if (files.length === 0 && !url) return
        setUploading(true); setResult(null)
        try {
            const fd = new FormData()
            files.forEach(f => fd.append("files", f))
            fd.append("department_id", activeDeptId)
            if (categoryId) fd.append("category_id", categoryId)
            if (url) fd.append("url", url)
            // CSV-specific params
            if (tab === "csv") {
                fd.append("has_header", String(hasHeader))
                fd.append("delimiter", delimiter)
                fd.append("encoding", encoding)
                fd.append("question_col", String(questionCol))
                fd.append("answer_col", String(answerCol))
            }
            const fn = tab === "txt" ? trainTxtRequest : trainCsvRequest
            const res = await fn(fd, tenantId)
            if (res.success) {
                const total = res.data?.total_files ?? files.length
                const failedCount = res.data?.failed_files?.length ?? 0
                const failedMessages = res.data?.failed_files?.map(f => `${f.filename}: ${f.error}`) ?? []
                setResult({ success: total - failedCount, failed: failedCount, errors: failedMessages })
                if (failedCount === 0) {
                    toast.success(`تم رفع ومعالجة ${total} ملف بنجاح — سيظهر في الطلبات المعلقة`)
                    onSuccess()
                } else {
                    toast.warning(`تم معالجة ${total - failedCount} ملف — فشل ${failedCount} — تحقق من الطلبات المعلقة`)
                    onSuccess()
                }
            } else {
                toast.error(res.message || "فشل رفع الملفات")
                setResult({ success: 0, failed: files.length, errors: [res.message] })
            }
        } catch {
            toast.error("حدث خطأ أثناء رفع الملفات")
            setResult({ success: 0, failed: files.length, errors: ["خطأ في الاتصال"] })
        } finally { setUploading(false) }
    }, [files, activeDeptId, categoryId, url, tab, hasHeader, delimiter, encoding, questionCol, answerCol, tenantId, onSuccess])

    const canUpload = files.length > 0 || url.trim()

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="mx-4 w-full max-w-2xl overflow-hidden bg-white" onClick={e => e.stopPropagation()} style={{ animation: "modalIn .18s ease-out", borderRadius: 12, border: "1px solid var(--t-border-light, #e5e7eb)" }}>
                {/* ── Header ── */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid var(--t-border-light, #f0f0f0)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #004786, #0098d6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Upload size={14} style={{ color: "#fff" }} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--t-text, #1f2937)" }}>رفع ملفات التدريب</h3>
                            <p style={{ fontSize: 10, color: "var(--t-text-faint, #9ca3af)", marginTop: 1 }}>القسم: <span style={{ fontWeight: 600, color: "#004786" }}>{activeDeptName}</span></p>
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button onClick={onClose} style={{ borderRadius: 6, padding: 5, border: "none", background: "transparent", cursor: "pointer", color: "var(--t-text-faint, #9ca3af)", transition: "color 0.12s" }}>
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div style={{ display: "flex", borderBottom: "1px solid var(--t-border-light, #f0f0f0)", padding: "0 20px" }}>
                    {TRAIN_TABS.map(t => {
                        const Icon = t.icon
                        const on = tab === t.key
                        return (
                            <button key={t.key} onClick={() => setTab(t.key)}
                                style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", fontSize: 12, fontWeight: on ? 600 : 500, borderBottom: on ? "2px solid #004786" : "2px solid transparent", color: on ? "#004786" : "var(--t-text-faint, #9ca3af)", background: "transparent", border: "none", borderBottomStyle: "solid", borderBottomWidth: 2, borderBottomColor: on ? "#004786" : "transparent", cursor: "pointer", transition: "all 0.12s" }}>
                                <Icon size={13} />
                                {t.label}
                            </button>
                        )
                    })}
                </div>

                {/* ── Body ── */}
                <div className="max-h-[60vh] overflow-y-auto p-5 space-y-4" key={tab} style={{ animation: "fadeIn .15s ease-out" }}>
                    {/* Category */}
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-500">الفئة</label>
                        <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm text-gray-700 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100">
                            <option value="">بدون فئة</option>
                            {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.icon} {c.name_ar || c.name}</option>)}
                        </select>
                    </div>



                    {/* URL — CSV tab too */}
                    {tab === "csv" && (
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-gray-500 flex items-center gap-1"><Link2 size={11} /> رابط مباشر <span className="text-gray-300">(اختياري)</span></label>
                            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/data.csv" dir="ltr"
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 px-3 text-sm text-gray-700 outline-none focus:border-blue-400 focus:bg-white font-mono" />
                        </div>
                    )}

                    {/* Drop zone */}
                    <div
                        onDragOver={e => { e.preventDefault(); setDragging(true) }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition-all ${dragging ? "border-blue-400 bg-blue-50/50 scale-[1.01]" : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/30"
                            }`}
                    >
                        <Upload size={28} className={`mx-auto ${dragging ? "text-blue-400" : "text-gray-300"}`} />
                        <p className="mt-2 text-sm font-medium text-gray-500">
                            {dragging ? "أفلت الملفات هنا" : "اضغط أو اسحب الملفات هنا"}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">{activeTab.desc} — حد أقصى 10MB لكل ملف</p>
                        <input ref={fileInputRef} type="file" accept={activeTab.accept} multiple onChange={handleFiles} className="hidden" />
                    </div>

                    {/* File list */}
                    {files.length > 0 && (
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-500">{files.length} ملف محدد</span>
                                <button onClick={() => setFiles([])} className="text-xs text-red-400 hover:text-red-600 transition-colors">حذف الكل</button>
                            </div>
                            <div className="max-h-32 overflow-y-auto space-y-1 hide-scrollbar">
                                {files.map((f, i) => (
                                    <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 group">
                                        <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
                                            {/\.csv$/i.test(f.name) ? <FileSpreadsheet size={14} className="text-emerald-500 flex-shrink-0" /> : <FileText size={14} className="text-blue-500 flex-shrink-0" />}
                                            <span className="truncate max-w-[280px]">{f.name}</span>
                                            <span className="text-xs text-gray-400 flex-shrink-0">({(f.size / 1024).toFixed(1)} KB)</span>
                                        </div>
                                        <button onClick={() => removeFile(i)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><X size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* CSV options */}
                    {tab === "csv" && (
                        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide">
                                <Settings2 size={13} className="text-gray-400" /> إعدادات CSV
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {/* has_header toggle */}
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="mb-1 block text-[11px] font-semibold text-gray-500">صف العناوين</label>
                                    <button onClick={() => setHasHeader(!hasHeader)} type="button"
                                        className={`w-full rounded-lg border px-3 py-2 text-xs font-medium transition-all ${hasHeader ? "border-blue-200 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-500"
                                            }`}>
                                        {hasHeader ? "✓ يحتوي عناوين" : "بدون عناوين"}
                                    </button>
                                </div>
                                {/* delimiter */}
                                <div>
                                    <label className="mb-1 block text-[11px] font-semibold text-gray-500">المحدد</label>
                                    <select value={delimiter} onChange={e => setDelimiter(e.target.value)}
                                        className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs text-gray-700 outline-none">
                                        <option value=",">فاصلة (,)</option>
                                        <option value=";">فاصلة منقوطة (;)</option>
                                        <option value="\t">Tab</option>
                                        <option value="|">خط عمودي (|)</option>
                                    </select>
                                </div>
                                {/* encoding */}
                                <div>
                                    <label className="mb-1 block text-[11px] font-semibold text-gray-500">الترميز</label>
                                    <select value={encoding} onChange={e => setEncoding(e.target.value)}
                                        className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs text-gray-700 outline-none">
                                        <option value="utf-8">UTF-8</option>
                                        <option value="windows-1256">Windows-1256</option>
                                        <option value="iso-8859-6">ISO-8859-6</option>
                                        <option value="utf-16">UTF-16</option>
                                    </select>
                                </div>
                                {/* question_col & answer_col */}
                                <div className="col-span-2 grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="mb-1 block text-[11px] font-semibold text-gray-500">عمود السؤال</label>
                                        <input type="number" min={0} value={questionCol} onChange={e => setQuestionCol(parseInt(e.target.value) || 0)}
                                            className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs text-gray-700 outline-none" dir="ltr" />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[11px] font-semibold text-gray-500">عمود الإجابة</label>
                                        <input type="number" min={0} value={answerCol} onChange={e => setAnswerCol(parseInt(e.target.value) || 0)}
                                            className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs text-gray-700 outline-none" dir="ltr" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Result summary */}
                    {result && (
                        <div className={`rounded-xl border p-4 ${result.failed === 0 ? "border-emerald-200 bg-emerald-50/50" : "border-amber-200 bg-amber-50/50"
                            }`}>
                            <div className="flex items-center gap-3">
                                {result.failed === 0 ? <CheckCircle2 size={20} className="text-emerald-500" /> : <AlertTriangle size={20} className="text-amber-500" />}
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">
                                        {result.failed === 0 ? `تم معالجة ${result.success} ملف بنجاح ✓` : `نجح ${result.success} ملف · فشل ${result.failed} ملف`}
                                    </p>
                                    {result.errors.length > 0 && (
                                        <div className="mt-1 space-y-0.5">
                                            {result.errors.map((err, i) => (
                                                <p key={i} className="text-xs text-red-500 flex items-center gap-1"><XCircle size={10} /> {err}</p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--t-border-light, #f0f0f0)", padding: "12px 20px" }}>
                    <p style={{ fontSize: 10, color: "var(--t-text-faint, #d1d5db)" }}>
                        {tab === "txt" ? "train-txt-request" : "train-csv-request"}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button onClick={onClose} disabled={uploading} style={{ padding: "7px 16px", borderRadius: 7, border: "1px solid var(--t-border-light, #e5e7eb)", background: "var(--t-card, #fff)", fontSize: 13, fontWeight: 500, color: "var(--t-text-secondary, #6b7280)", cursor: "pointer" }}>إلغاء</button>
                        <button onClick={result ? onClose : handleUpload} disabled={uploading || (!canUpload && !result)}
                            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 20px", borderRadius: 7, border: "none", background: "#004786", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", opacity: (uploading || (!canUpload && !result)) ? 0.4 : 1, transition: "all 0.15s" }}>
                            {uploading && <Loader2 size={14} className="animate-spin" />}
                            {result ? "إغلاق" : `رفع${files.length > 0 ? ` (${files.length})` : ""}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
})

/* ── Add Text Modal ── */
const AddTextModal = memo(function AddTextModal({ categories, activeDeptId, activeDeptName, onClose, onSuccess, tenantId }: { categories: CategoryItem[]; activeDeptId: string; activeDeptName: string; onClose: () => void; onSuccess: () => void; tenantId: string }) {
    const [text, setText] = useState("")
    const [categoryId, setCategoryId] = useState("")
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = useCallback(async () => {
        if (!text.trim()) return
        setSubmitting(true)
        try {
            const res = await addDataJson({ text: text.trim(), department_id: activeDeptId, category_id: categoryId || undefined }, tenantId)
            if (res.success) {
                toast.success("تم تقديم الطلب بنجاح — سيظهر في الطلبات المعلقة للمراجعة")
                onSuccess()
                onClose()
            }
            else toast.error(res.message || "فشل إضافة النص")
        } catch { toast.error("حدث خطأ أثناء إضافة النص") }
        finally { setSubmitting(false) }
    }, [text, activeDeptId, categoryId, tenantId, onSuccess, onClose])

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="mx-4 w-full max-w-lg overflow-hidden bg-white" onClick={(e) => e.stopPropagation()} style={{ animation: "modalIn .18s ease-out", borderRadius: 12, border: "1px solid var(--t-border-light, #e5e7eb)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid var(--t-border-light, #f0f0f0)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #004786, #0098d6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Plus size={14} style={{ color: "#fff" }} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--t-text, #1f2937)" }}>إضافة نص جديد</h3>
                            <p style={{ fontSize: 10, color: "var(--t-text-faint, #9ca3af)", marginTop: 1 }}>القسم: <span style={{ fontWeight: 600, color: "#004786" }}>{activeDeptName}</span></p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ borderRadius: 6, padding: 5, border: "none", background: "transparent", cursor: "pointer", color: "var(--t-text-faint, #9ca3af)" }}><X size={16} /></button>
                </div>
                <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--t-text-faint, #9ca3af)", marginBottom: 6 }}>الفئة</label>
                        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ width: "100%", borderRadius: 8, border: "1px solid var(--t-border-light, #e5e7eb)", background: "var(--t-surface, #f9fafb)", padding: "8px 12px", fontSize: 13, color: "var(--t-text, #374151)", outline: "none" }}>
                            <option value="">بدون فئة</option>
                            {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.icon} {c.name_ar || c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--t-text-faint, #9ca3af)", marginBottom: 6 }}>المحتوى النصي</label>
                        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} dir="auto" placeholder="اكتب أو الصق النص هنا..." style={{ width: "100%", borderRadius: 8, border: "1px solid var(--t-border-light, #e5e7eb)", background: "var(--t-surface, #f9fafb)", padding: 12, fontSize: 13, color: "var(--t-text, #374151)", outline: "none", resize: "vertical", transition: "border-color 0.15s", lineHeight: 1.7 }} onFocus={e => { e.currentTarget.style.borderColor = "#004786" }} onBlur={e => { e.currentTarget.style.borderColor = "var(--t-border-light, #e5e7eb)" }} />
                        <p style={{ marginTop: 4, textAlign: "left", fontSize: 11, color: "var(--t-text-faint, #9ca3af)" }}>{text.length.toLocaleString()} / 100,000</p>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, borderTop: "1px solid var(--t-border-light, #f0f0f0)", padding: "12px 20px" }}>
                    <button onClick={onClose} disabled={submitting} style={{ padding: "7px 16px", borderRadius: 7, border: "1px solid var(--t-border-light, #e5e7eb)", background: "var(--t-card, #fff)", fontSize: 13, fontWeight: 500, color: "var(--t-text-secondary, #6b7280)", cursor: "pointer" }}>إلغاء</button>
                    <button onClick={handleSubmit} disabled={submitting || !text.trim()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 18px", borderRadius: 7, border: "none", background: "#004786", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", opacity: (submitting || !text.trim()) ? 0.5 : 1 }}>
                        {submitting && <Loader2 size={14} className="animate-spin" />}
                        إضافة النص
                    </button>
                </div>
            </div>
        </div>
    )
})

/* ── Single Table Row (memoized) ── */
const DocRow = memo(function DocRow({
    doc, idx, isSelected, catLabel,
    onToggle, onView, onEdit, onDelete,
}: {
    doc: SearchDocumentResult; idx: number; isSelected: boolean; catLabel: string
    onToggle: (id: string) => void; onView: (d: SearchDocumentResult) => void; onEdit: (d: SearchDocumentResult) => void; onDelete: (id: string) => void
}) {
    return (
        <tr
            className={`group transition-colors ${isSelected ? "" : ""}`}
            style={{
                animation: `rowFade .2s ease-out ${idx * 0.025}s both`,
                background: isSelected ? "rgba(0,71,134,0.03)" : "transparent",
            }}
            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "var(--t-card-hover, #f9fafb)" }}
            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent" }}
        >
            <td style={{ padding: "10px 14px" }}>
                <button onClick={() => onToggle(doc.doc_id)} style={{ color: isSelected ? "#004786" : "var(--t-text-faint, #9ca3af)", border: "none", background: "transparent", cursor: "pointer" }}>{isSelected ? <CheckSquare size={16} /> : <Square size={16} />}</button>
            </td>
            <td style={{ padding: "10px 14px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "monospace", fontSize: 11, color: "var(--t-text-secondary, #6b7280)", background: "var(--t-surface, #f3f4f6)", borderRadius: 4, padding: "2px 6px" }}><Hash size={9} style={{ color: "var(--t-text-faint, #9ca3af)" }} />{truncateId(doc.doc_id)}</span>
            </td>
            <td style={{ maxWidth: 280, padding: "10px 14px" }}>
                <button onClick={() => onView(doc)} className="line-clamp-2" style={{ textAlign: "right", fontSize: 13, color: "var(--t-text, #374151)", border: "none", background: "transparent", cursor: "pointer", lineHeight: 1.6, transition: "color 0.12s" }} title="انقر لعرض المحتوى الكامل" onMouseEnter={e => { e.currentTarget.style.color = "#004786" }} onMouseLeave={e => { e.currentTarget.style.color = "var(--t-text, #374151)" }}>{truncate(doc.text)}</button>
            </td>
            <td style={{ padding: "10px 14px" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--t-text-secondary, #6b7280)" }}><User size={11} style={{ color: "var(--t-text-faint, #9ca3af)" }} />{doc.user || "—"}</span></td>
            <td style={{ padding: "10px 14px" }}><span style={{ background: "rgba(0,71,134,0.05)", padding: "3px 10px", borderRadius: 12, fontSize: 10, fontWeight: 600, color: "#004786", whiteSpace: "nowrap" }}>{catLabel}</span></td>
            <td style={{ padding: "10px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
                    <ActionGuard pageBit={PAGE_BITS.DOCUMENTS} actionBit={ACTION_BITS.GET_DOCUMENT}>
                        <button onClick={() => onView(doc)} style={{ borderRadius: 6, padding: 5, border: "none", background: "transparent", cursor: "pointer", color: "var(--t-text-faint, #9ca3af)", transition: "all 0.12s" }} title="عرض" onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,71,134,0.06)"; e.currentTarget.style.color = "#004786" }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--t-text-faint, #9ca3af)" }}><Eye size={14} /></button>
                    </ActionGuard>
                    <ActionGuard pageBit={PAGE_BITS.DOCUMENTS} actionBit={ACTION_BITS.UPDATE_DOCUMENT}>
                        <button onClick={() => onEdit(doc)} style={{ borderRadius: 6, padding: 5, border: "none", background: "transparent", cursor: "pointer", color: "var(--t-text-faint, #9ca3af)", transition: "all 0.12s" }} title="تعديل" onMouseEnter={e => { e.currentTarget.style.background = "rgba(245,158,11,0.08)"; e.currentTarget.style.color = "#d97706" }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--t-text-faint, #9ca3af)" }}><Pencil size={14} /></button>
                    </ActionGuard>
                    <ActionGuard pageBit={PAGE_BITS.DOCUMENTS} actionBit={ACTION_BITS.DELETE_DOCUMENT}>
                        <button onClick={() => onDelete(doc.doc_id)} style={{ borderRadius: 6, padding: 5, border: "none", background: "transparent", cursor: "pointer", color: "var(--t-text-faint, #9ca3af)", transition: "all 0.12s" }} title="حذف" onMouseEnter={e => { e.currentTarget.style.background = "rgba(220,38,38,0.06)"; e.currentTarget.style.color = "#dc2626" }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--t-text-faint, #9ca3af)" }}><Trash2 size={14} /></button>
                    </ActionGuard>
                </div>
            </td>
        </tr>
    )
})

/* ═══════════════════════════════ MAIN COMPONENT ═══════════════════════════════ */

export function DataManagementTab({ onNavigateToTab }: { onNavigateToTab?: (tab: string) => void }) {
    const { user } = useAuthStore()
    const tenantId = user?.tenant_id || ""
    const knowledgeEvents = useKnowledgeEvents(tenantId)

    // ── Search ──
    const [query, setQuery] = useState("")
    const [debouncedQuery, setDebouncedQuery] = useState("")
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

    // ── Selection ──
    const [selected, setSelected] = useState<Set<string>>(new Set())

    // ── Modals ──
    const [viewDoc, setViewDoc] = useState<SearchDocumentResult | null>(null)
    const [editDoc, setEditDoc] = useState<SearchDocumentResult | null>(null)
    const [deleteTargets, setDeleteTargets] = useState<string[] | null>(null)
    const [showUpload, setShowUpload] = useState(false)
    const [showAddText, setShowAddText] = useState(false)

    const queryClient = useQueryClient()

    /* ─── Query: departments lookup ─── */
    const { data: deptRes, isLoading: loadingDeps } = useDepartmentsLookup(tenantId)
    const departments = useMemo(() => {
        if (!deptRes?.success || !deptRes.data) return []
        return [...deptRes.data].sort((a, b) => a.order - b.order)
    }, [deptRes])

    // ── Active department ──
    const [activeDeptId, setActiveDeptId] = useState<string | null>(null)
    const [selectedCategoryId, setSelectedCategoryId] = useState("")
    const [page, setPage] = useState(1)

    // Auto-select first department when data loads
    useEffect(() => {
        if (departments.length > 0 && !activeDeptId) {
            setActiveDeptId(departments[0].department_id)
        }
    }, [departments]) // eslint-disable-line react-hooks/exhaustive-deps

    /* ─── Query: categories for active dept ─── */
    const { data: catRes, isLoading: loadingCats } = useDepartmentCategories(tenantId, activeDeptId)
    const categories = useMemo(() => {
        if (!catRes?.success || !catRes.data?.categories) return []
        return catRes.data.categories.filter((c) => c.is_active)
    }, [catRes])

    /* ── Memoized look-ups ── */
    const catMap = useMemo(() => {
        const m = new Map<string, CategoryItem>()
        categories.forEach((c) => m.set(c.category_id, c))
        return m
    }, [categories])

    const activeDept = useMemo(() => departments.find((d) => d.department_id === activeDeptId), [departments, activeDeptId])
    const activeDeptName = activeDept?.name_ar || activeDept?.name || ""

    /* ─── Debounce ─── */
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => { setDebouncedQuery(query); setPage(1) }, DEBOUNCE_MS)
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    }, [query])

    /* ─── Query: search documents ─── */
    const { data: docsRes, isLoading: loadingDocs, isFetching: fetchingDocs } = useSearchDocuments(tenantId, {
        query: debouncedQuery || undefined,
        page,
        page_size: PAGE_SIZE,
        department_id: activeDeptId!,
        category_id: selectedCategoryId || undefined,
    })
    const results = docsRes?.success ? docsRes.data?.results ?? [] : []
    const pagination = docsRes?.success ? docsRes.data?.pagination ?? null : null

    /* ─── Prefetch next page on hover ─── */
    const prefetchDocs = usePrefetchDocuments(tenantId)
    const prefetchNextDocs = useCallback(() => {
        prefetchDocs({
            query: debouncedQuery || undefined,
            page: page + 1,
            page_size: PAGE_SIZE,
            department_id: activeDeptId!,
            category_id: selectedCategoryId || undefined,
        })
    }, [prefetchDocs, debouncedQuery, page, activeDeptId, selectedCategoryId])

    // Reset selection when results change
    useEffect(() => { setSelected(new Set()) }, [results])

    /* ─── Mutations ─── */
    const updateMutation = useUpdateDocument(tenantId)
    const deleteMutation = useDeleteDocuments(tenantId)

    const saving = updateMutation.isPending
    const deleting = deleteMutation.isPending

    const allSelected = results.length > 0 && selected.size === results.length
    const someSelected = selected.size > 0 && selected.size < results.length

    /* ─── Stable callbacks for DocRow ─── */
    const toggleSelect = useCallback((id: string) => {
        setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
    }, [])
    const toggleAll = useCallback(() => { setSelected((prev) => prev.size === results.length ? new Set() : new Set(results.map((r) => r.doc_id))) }, [results])
    const openView = useCallback((d: SearchDocumentResult) => setViewDoc(d), [])
    const openEdit = useCallback((d: SearchDocumentResult) => setEditDoc(d), [])
    const openDeleteSingle = useCallback((id: string) => setDeleteTargets([id]), [])

    /* ─── Handlers ─── */
    const handleUpdate = (newText: string) => {
        if (!editDoc || !tenantId) return
        updateMutation.mutate(
            { doc_id: editDoc.doc_id, text: editDoc.text, new_text: newText, department_id: activeDeptId || undefined, category_id: selectedCategoryId || undefined },
            { onSuccess: (res) => { if (res.success) setEditDoc(null) } }
        )
    }

    const handleDelete = () => {
        if (!deleteTargets || !tenantId) return
        deleteMutation.mutate(
            { doc_id: deleteTargets.length === 1 ? deleteTargets[0] : deleteTargets, department_id: activeDeptId || undefined },
            { onSuccess: (res) => { if (res.success) { setDeleteTargets(null); setSelected(new Set()) } } }
        )
    }

    const switchDept = useCallback((id: string) => { setActiveDeptId(id); setPage(1); setSelectedCategoryId(""); setQuery(""); setSelected(new Set()); queryClient.removeQueries({ queryKey: ["dept-categories", tenantId, activeDeptId] }) }, [queryClient, tenantId, activeDeptId])

    /* ═══════════════════════════ RENDER ═══════════════════════════ */
    return (
        <div className="space-y-5">
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #004786, #0098d6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Database size={20} style={{ color: "#fff" }} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--t-text, #1f2937)", margin: 0 }}>إدارة البيانات</h2>
                        <p style={{ fontSize: 12, color: "var(--t-text-faint, #9ca3af)", marginTop: 2 }}>تصفح وإدارة المستندات حسب الأقسام</p>
                    </div>
                </div>
                {activeDeptId && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <ActionGuard pageBit={PAGE_BITS.DOCUMENTS} actionBit={ACTION_BITS.UPLOAD_DOCUMENT}>
                            <button onClick={() => setShowUpload(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", background: "#004786", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.background = "#003b6f" }} onMouseLeave={e => { e.currentTarget.style.background = "#004786" }}><Upload size={14} />رفع ملف</button>
                        </ActionGuard>
                        <ActionGuard pageBit={PAGE_BITS.DOCUMENTS} actionBit={ACTION_BITS.UPLOAD_DOCUMENT}>
                            <button onClick={() => setShowAddText(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "1px solid var(--t-border-light, #e5e7eb)", background: "var(--t-card, #fff)", color: "var(--t-text-secondary, #6b7280)", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "#004786"; e.currentTarget.style.color = "#004786" }} onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--t-border-light, #e5e7eb)"; e.currentTarget.style.color = "var(--t-text-secondary, #6b7280)" }}><Plus size={14} />إضافة نص</button>
                        </ActionGuard>
                    </div>
                )}
            </div>

            {/* Department tabs */}
            {loadingDeps ? (
                <div className="flex items-center gap-3 overflow-hidden py-2">{Array.from({ length: 4 }, (_, i) => <div key={i} className="h-10 w-28 shrink-0 animate-pulse rounded-xl bg-gray-100" />)}</div>
            ) : departments.length === 0 ? (
                <div className="relative overflow-hidden rounded-2xl border border-dashed border-gray-200 bg-white" style={{ animation: "fadeIn .3s ease-out" }}>
                    {/* Decorative background pattern */}
                    <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, #3b82f6 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
                    <div className="relative flex flex-col items-center justify-center px-6 py-16 text-center">
                        {/* Icon stack */}
                        <div className="relative mb-6">
                            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
                                <Database size={36} className="text-blue-300" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 ">
                                <Plus size={16} className="text-white" strokeWidth={3} />
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-gray-800">لا توجد أقسام بعد</h3>
                        <p className="mt-2 max-w-sm text-sm text-gray-500 leading-relaxed">
                            ابدأ بإنشاء الأقسام لتنظيم بياناتك، ثم أضف الفئات والمستندات
                        </p>

                        {/* Steps */}
                        <div className="mt-6 flex items-center gap-3">
                            <div className="flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-3 py-1.5">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">1</span>
                                <span className="text-xs font-medium text-blue-700"><Building2 size={12} className="inline ml-1" />أنشئ قسم</span>
                            </div>
                            <ArrowLeft size={14} className="text-gray-300" />
                            <div className="flex items-center gap-2 rounded-full bg-gray-50 border border-gray-200 px-3 py-1.5">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-300 text-[10px] font-bold text-white">2</span>
                                <span className="text-xs font-medium text-gray-400"><FolderTree size={12} className="inline ml-1" />أضف فئات</span>
                            </div>
                            <ArrowLeft size={14} className="text-gray-300" />
                            <div className="flex items-center gap-2 rounded-full bg-gray-50 border border-gray-200 px-3 py-1.5">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-300 text-[10px] font-bold text-white">3</span>
                                <span className="text-xs font-medium text-gray-400"><Upload size={12} className="inline ml-1" />ارفع البيانات</span>
                            </div>
                        </div>

                        {/* CTA Button */}
                        {onNavigateToTab && (
                            <button
                                onClick={() => onNavigateToTab("departments")}
                                className="group mt-8 flex items-center gap-3 rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white  transition-all duration-200  hover:scale-[1.03] active:scale-[0.98]"
                            >
                                <Building2 size={18} className="transition-transform group-hover:-translate-x-0.5" />
                                انتقل إلى صفحة الأقسام
                                <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="hide-scrollbar" style={{ display: "flex", alignItems: "center", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
                    {departments.map((dept) => {
                        const isActive = activeDeptId === dept.department_id
                        return (
                            <button key={dept.department_id} onClick={() => switchDept(dept.department_id)}
                                style={{
                                    display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
                                    padding: "8px 16px", borderRadius: 8,
                                    border: isActive ? "1px solid #004786" : "1px solid var(--t-border-light, #e5e7eb)",
                                    background: isActive ? "rgba(0,71,134,0.06)" : "var(--t-card, #fff)",
                                    color: isActive ? "#004786" : "var(--t-text-secondary, #6b7280)",
                                    fontSize: 13, fontWeight: isActive ? 600 : 500,
                                    cursor: "pointer", transition: "all 0.15s",
                                }}>
                                <span style={{ fontSize: 15, lineHeight: 1 }}>{dept.icon || "📁"}</span>
                                <span>{dept.name_ar || dept.name}</span>
                            </button>
                        )
                    })}
                    {onNavigateToTab && (
                        <button onClick={() => onNavigateToTab("departments")}
                            style={{
                                display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
                                padding: "8px 12px", borderRadius: 8,
                                border: "1px dashed var(--t-text-faint, #d1d5db)",
                                background: "transparent",
                                color: "var(--t-text-faint, #9ca3af)",
                                fontSize: 12, fontWeight: 500,
                                cursor: "pointer", transition: "all 0.15s",
                            }}
                            title="إضافة قسم جديد">
                            <Plus size={14} />
                            <span>إضافة قسم</span>
                        </button>
                    )}
                </div>
            )}

            {/* Filters */}
            {activeDeptId && (
                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder={`بحث في ${activeDeptName || "المستندات"}...`} value={query} onChange={(e) => setQuery(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-10 pl-10 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                        {query && !loadingDocs && <button onClick={() => setQuery("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><X size={14} /></button>}
                        {loadingDocs && query && <Loader2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />}
                    </div>
                    <div className="relative min-w-[200px]">
                        <select value={selectedCategoryId} onChange={(e) => { setSelectedCategoryId(e.target.value); setPage(1) }} disabled={loadingCats || categories.length === 0} className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pr-4 pl-8 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50">
                            <option value="">{loadingCats ? "جاري التحميل..." : categories.length === 0 ? "لا توجد فئات" : "كل الفئات"}</option>
                            {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.icon} {c.name_ar || c.name}</option>)}
                        </select>
                        <Filter size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                </div>
            )}

            {/* Bulk actions */}
            {selected.size > 0 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 8, background: "rgba(0,71,134,0.03)", border: "1px solid rgba(0,71,134,0.1)", padding: "8px 14px", animation: "fadeIn .2s ease-out" }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#004786" }}>تم تحديد <span style={{ fontWeight: 700 }}>{selected.size}</span> مستند</p>
                    <ActionGuard pageBit={PAGE_BITS.DOCUMENTS} actionBit={ACTION_BITS.DELETE_DOCUMENT}>
                        <button onClick={() => setDeleteTargets([...selected])} style={{ display: "flex", alignItems: "center", gap: 5, borderRadius: 6, padding: "5px 12px", border: "none", background: "#dc2626", color: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "background 0.12s" }} onMouseEnter={e => { e.currentTarget.style.background = "#b91c1c" }} onMouseLeave={e => { e.currentTarget.style.background = "#dc2626" }}><Trash2 size={12} /> حذف المحدد</button>
                    </ActionGuard>
                </div>
            )}

            {/* Table */}
            {!activeDeptId ? null : (
                <>
                    {/* Info bar */}
                    {!loadingDocs && results.length > 0 && (
                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            borderRadius: 8, background: "var(--t-card, #fff)",
                            border: "1px solid var(--t-border-light, #e5e7eb)",
                            padding: "8px 14px",
                        }}>
                            <p style={{ fontSize: 12, color: "var(--t-text-secondary, #6b7280)" }}><span style={{ fontWeight: 700, color: "#004786" }}>{pagination?.totalCount ?? results.length}</span> مستند{debouncedQuery ? ` • "${debouncedQuery}"` : ""}</p>
                            <p style={{ fontSize: 11, color: "var(--t-text-faint, #9ca3af)" }}>صفحة {pagination?.currentPage || 1} من {pagination?.totalPages || 1}</p>
                        </div>
                    )}

                    <div style={{ position: "relative", overflow: "hidden", borderRadius: 10, border: "1px solid var(--t-border-light, #e5e7eb)", background: "var(--t-card, #fff)" }}>
                        <FetchingBar visible={fetchingDocs && !loadingDocs} />

                        <div className="overflow-x-auto" style={{ opacity: fetchingDocs && !loadingDocs ? 0.6 : 1, transition: 'opacity 0.2s ease' }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid var(--t-border-light, #f0f0f0)", background: "var(--t-surface, #fafafa)" }}>
                                        <th style={{ width: 40, padding: "10px 14px" }}>
                                            <button onClick={toggleAll} style={{ color: allSelected ? "#004786" : "var(--t-text-faint, #9ca3af)", border: "none", background: "transparent", cursor: "pointer", transition: "color 0.12s" }} disabled={results.length === 0 || loadingDocs}>
                                                {allSelected ? <CheckSquare size={16} /> : someSelected ? <MinusSquare size={16} /> : <Square size={16} />}
                                            </button>
                                        </th>
                                        {["المعرف", "المحتوى", "المستخدم", "الفئة"].map(h => (
                                            <th key={h} style={{ padding: "10px 14px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "var(--t-text-faint, #9ca3af)", letterSpacing: "0.3px" }}>{h}</th>
                                        ))}
                                        <th style={{ width: 120, padding: "10px 14px", textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--t-text-faint, #9ca3af)", letterSpacing: "0.3px" }}>الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loadingDocs && results.length === 0 ? (
                                        <TableSkeleton />
                                    ) : results.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-16 text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">{debouncedQuery ? <AlertTriangle size={24} className="text-gray-300" /> : <Database size={24} className="text-gray-300" />}</div>
                                                    <p className="mt-3 text-sm font-medium text-gray-500">{debouncedQuery ? "لا توجد نتائج مطابقة" : "لا توجد مستندات في هذا القسم"}</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        results.map((doc, idx) => {
                                            const cat = catMap.get(doc.category_id)
                                            const catLabel = cat ? `${cat.icon || ""} ${cat.name_ar || cat.name}` : (doc.category_id || "—")
                                            return (
                                                <DocRow
                                                    key={doc.doc_id}
                                                    doc={doc}
                                                    idx={idx}
                                                    isSelected={selected.has(doc.doc_id)}
                                                    catLabel={catLabel}
                                                    onToggle={toggleSelect}
                                                    onView={openView}
                                                    onEdit={openEdit}
                                                    onDelete={openDeleteSingle}
                                                />
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, paddingTop: 8 }}>
                            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!pagination.hasPrevious} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 7, border: "1px solid var(--t-border-light, #e5e7eb)", background: "var(--t-card, #fff)", fontSize: 12, fontWeight: 500, color: "var(--t-text-secondary, #6b7280)", cursor: "pointer", opacity: !pagination.hasPrevious ? 0.4 : 1 }}><ChevronRight size={13} /> السابق</button>
                            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                                {pageNums(pagination.currentPage, pagination.totalPages).map((pn, i) =>
                                    pn === "..." ? <span key={`e${i}`} style={{ padding: "0 4px", color: "var(--t-text-faint, #d1d5db)" }}>…</span> : (
                                        <button key={pn} onClick={() => setPage(pn as number)} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 7, border: "none", fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.12s", background: page === pn ? "#004786" : "transparent", color: page === pn ? "#fff" : "var(--t-text-secondary, #6b7280)" }}>{pn}</button>
                                    )
                                )}
                            </div>
                            <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} onMouseEnter={() => pagination.hasNext && prefetchNextDocs()} disabled={!pagination.hasNext} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 7, border: "1px solid var(--t-border-light, #e5e7eb)", background: "var(--t-card, #fff)", fontSize: 12, fontWeight: 500, color: "var(--t-text-secondary, #6b7280)", cursor: "pointer", opacity: !pagination.hasNext ? 0.4 : 1 }}>التالي <ChevronLeft size={13} /></button>
                        </div>
                    )}
                </>
            )}

            {/* Modals — rendered only when needed */}
            {viewDoc && <TextModal text={viewDoc.text} onClose={() => setViewDoc(null)} />}
            {editDoc && <EditModal doc={editDoc} onClose={() => setEditDoc(null)} onSave={handleUpdate} saving={saving} />}
            {deleteTargets && <DeleteModal count={deleteTargets.length} onClose={() => setDeleteTargets(null)} onConfirm={handleDelete} deleting={deleting} />}
            {showUpload && activeDeptId && <TrainUploadModal categories={categories} activeDeptId={activeDeptId} activeDeptName={activeDeptName} onClose={() => setShowUpload(false)} onSuccess={() => knowledgeEvents.onFileUploaded()} tenantId={tenantId} />}
            {showAddText && activeDeptId && <AddTextModal categories={categories} activeDeptId={activeDeptId} activeDeptName={activeDeptName} onClose={() => setShowAddText(false)} onSuccess={() => knowledgeEvents.onDataAdded()} tenantId={tenantId} />}

            <style>{`
                @keyframes rowFade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
                @keyframes modalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
                @keyframes fadeIn{from{opacity:0}to{opacity:1}}
                @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
                @keyframes spin360{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
                .skeleton-bone{background:linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 37%,#f3f4f6 63%);background-size:200% 100%;animation:shimmer 1.5s ease-in-out infinite}
                .skeleton-shimmer{opacity:0;animation:fadeIn .3s ease-out forwards}
                .loading-spinner{width:36px;height:36px;border:3px solid #e5e7eb;border-top-color:#3b82f6;border-radius:50%;animation:spin360 .7s linear infinite}
                .hide-scrollbar::-webkit-scrollbar{display:none}
                .hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
                .line-clamp-2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
            `}</style>
        </div>
    )
}

/* ─── Pagination helper ─── */
function pageNums(c: number, t: number): (number | "...")[] {
    if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1)
    const p: (number | "...")[] = [1]
    if (c > 3) p.push("...")
    for (let i = Math.max(2, c - 1); i <= Math.min(t - 1, c + 1); i++) p.push(i)
    if (c < t - 2) p.push("...")
    p.push(t)
    return p
}
