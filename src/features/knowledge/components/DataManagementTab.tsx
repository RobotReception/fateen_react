import { useState, useEffect, useCallback, useRef, memo, useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
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
    Activity,
} from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { useDepartmentsLookup, useDepartmentCategories } from "../hooks/use-departments"
import { useSearchDocuments, useUpdateDocument, useDeleteDocuments } from "../hooks/use-documents"
import { usePrefetchDocuments } from "../hooks/use-prefetch"
import {
    trainDataRequest,
    trainTxtRequest,
    trainCsvRequest,
    checkDataModelHealth,
    addDataJson,
} from "../services/knowledge-service"
import type {
    CategoryItem,
    SearchDocumentResult,
} from "../types"

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
            <div className="mx-4 max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ animation: "modalIn .18s ease-out" }}>
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                    <h3 className="text-sm font-bold text-gray-700">محتوى المستند</h3>
                    <div className="flex items-center gap-2">
                        <button onClick={copy} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${copied ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                            {copied ? <Check size={12} /> : <Copy size={12} />}
                            {copied ? "تم النسخ" : "نسخ"}
                        </button>
                        <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={16} /></button>
                    </div>
                </div>
                <div className="max-h-[60vh] overflow-y-auto p-5 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap" dir="auto">{text}</div>
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
            <div className="mx-4 w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ animation: "modalIn .18s ease-out" }}>
                <div className="border-b border-gray-100 px-5 py-3">
                    <h3 className="text-sm font-bold text-gray-700">تعديل المستند</h3>
                    <p className="mt-0.5 text-xs text-gray-400 font-mono">#{doc.doc_id}</p>
                </div>
                <div className="p-5">
                    <label className="mb-1.5 block text-xs font-semibold text-gray-500">النص الجديد</label>
                    <textarea value={newText} onChange={(e) => setNewText(e.target.value)} rows={10} dir="auto" className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 resize-y" />
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-3">
                    <button onClick={onClose} disabled={saving} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">إلغاء</button>
                    <button onClick={() => onSave(newText)} disabled={saving || !changed} className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed">
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
            <div className="mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ animation: "modalIn .18s ease-out" }}>
                <div className="p-6 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50"><Trash2 size={24} className="text-red-500" /></div>
                    <h3 className="text-lg font-bold text-gray-800">تأكيد الحذف</h3>
                    <p className="mt-2 text-sm text-gray-500">هل أنت متأكد من حذف <span className="font-bold text-red-600">{count}</span> {count === 1 ? "مستند" : "مستندات"}؟<br /><span className="text-xs text-gray-400">لا يمكن التراجع عن هذا الإجراء</span></p>
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

/* ── Upload Training Modal — Tabbed (General / TXT / CSV) ── */
type TrainTab = "general" | "txt" | "csv"
const TRAIN_TABS: { key: TrainTab; label: string; icon: typeof Layers; accept: string; desc: string }[] = [
    { key: "general", label: "عام", icon: Layers, accept: ".txt,.csv", desc: "TXT و CSV" },
    { key: "txt", label: "TXT", icon: FileType2, accept: ".txt", desc: "ملفات نصية فقط" },
    { key: "csv", label: "CSV", icon: FileSpreadsheet, accept: ".csv", desc: "ملفات CSV فقط" },
]

const TrainUploadModal = memo(function TrainUploadModal({ categories, activeDeptId, activeDeptName, onClose, onSuccess, tenantId }: {
    categories: CategoryItem[]; activeDeptId: string; activeDeptName: string
    onClose: () => void; onSuccess: () => void; tenantId: string
}) {
    const [tab, setTab] = useState<TrainTab>("general")
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

    // Health check
    const [health, setHealth] = useState<"loading" | "healthy" | "unhealthy" | null>(null)
    useEffect(() => {
        let cancel = false
        setHealth("loading")
        checkDataModelHealth(tenantId)
            .then(r => { if (!cancel) setHealth(r.success ? "healthy" : "unhealthy") })
            .catch(() => { if (!cancel) setHealth("unhealthy") })
        return () => { cancel = true }
    }, [tenantId])

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
            if (tab === "csv" || tab === "general") {
                fd.append("has_header", String(hasHeader))
                fd.append("delimiter", delimiter)
                fd.append("encoding", encoding)
                fd.append("question_col", String(questionCol))
                fd.append("answer_col", String(answerCol))
            }
            const fn = tab === "txt" ? trainTxtRequest : tab === "csv" ? trainCsvRequest : trainDataRequest
            const res = await fn(fd, tenantId)
            if (res.success) {
                const total = res.data?.total_files ?? files.length
                const failedCount = res.data?.failed_files?.length ?? 0
                const failedMessages = res.data?.failed_files?.map(f => `${f.filename}: ${f.error}`) ?? []
                setResult({ success: total - failedCount, failed: failedCount, errors: failedMessages })
                if (failedCount === 0) {
                    toast.success(`تم رفع ومعالجة ${total} ملف بنجاح`)
                    onSuccess()
                } else {
                    toast.warning(`تم معالجة ${total - failedCount} ملف، فشل ${failedCount}`)
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
            <div className="mx-4 w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={e => e.stopPropagation()} style={{ animation: "modalIn .18s ease-out" }}>
                {/* ── Header ── */}
                <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                            <Upload size={16} className="text-blue-500" /> رفع ملفات التدريب
                        </h3>
                        <p className="mt-0.5 text-xs text-gray-400">
                            القسم: <span className="font-semibold text-blue-600">{activeDeptName}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {health && (
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${health === "healthy" ? "bg-emerald-50 text-emerald-600" :
                                health === "unhealthy" ? "bg-red-50 text-red-500" :
                                    "bg-gray-50 text-gray-400"
                                }`}>
                                {health === "loading" ? <Loader2 size={10} className="animate-spin" /> :
                                    health === "healthy" ? <Activity size={10} /> : <XCircle size={10} />}
                                {health === "loading" ? "فحص..." : health === "healthy" ? "API متصل" : "API غير متصل"}
                            </span>
                        )}
                        <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="flex border-b border-gray-100 px-5">
                    {TRAIN_TABS.map(t => {
                        const Icon = t.icon
                        const on = tab === t.key
                        return (
                            <button key={t.key} onClick={() => setTab(t.key)}
                                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${on ? "border-blue-500 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200"
                                    }`}>
                                <Icon size={14} />
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

                    {/* URL — General tab only */}
                    {tab === "general" && (
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-gray-500 flex items-center gap-1"><Link2 size={11} /> رابط مباشر <span className="text-gray-300">(اختياري)</span></label>
                            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/data.csv" dir="ltr"
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 px-3 text-sm text-gray-700 outline-none focus:border-blue-400 focus:bg-white font-mono" />
                        </div>
                    )}

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
                    {(tab === "csv" || (tab === "general" && files.some(f => /\.csv$/i.test(f.name)))) && (
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
                <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
                    <p className="text-[10px] text-gray-300">
                        {tab === "general" ? "train-data-request" : tab === "txt" ? "train-txt-request" : "train-csv-request"}
                    </p>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} disabled={uploading} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">إلغاء</button>
                        <button onClick={result ? onClose : handleUpload} disabled={uploading || (!canUpload && !result)}
                            className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
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
            if (res.success) { toast.success("تم إضافة النص بنجاح"); onSuccess(); onClose() }
            else toast.error(res.message || "فشل إضافة النص")
        } catch { toast.error("حدث خطأ أثناء إضافة النص") }
        finally { setSubmitting(false) }
    }, [text, activeDeptId, categoryId, tenantId, onSuccess, onClose])

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="mx-4 w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ animation: "modalIn .18s ease-out" }}>
                <div className="border-b border-gray-100 px-5 py-3">
                    <h3 className="text-sm font-bold text-gray-700">إضافة نص جديد</h3>
                    <p className="mt-0.5 text-xs text-gray-400">القسم: <span className="font-semibold text-blue-600">{activeDeptName}</span></p>
                </div>
                <div className="space-y-4 p-5">
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-500">الفئة</label>
                        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm text-gray-700 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100">
                            <option value="">بدون فئة</option>
                            {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.icon} {c.name_ar || c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-500">المحتوى النصي</label>
                        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} dir="auto" placeholder="اكتب أو الصق النص هنا..." className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 resize-y" />
                        <p className="mt-1 text-left text-xs text-gray-400">{text.length.toLocaleString()} / 100,000</p>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-3">
                    <button onClick={onClose} disabled={submitting} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">إلغاء</button>
                    <button onClick={handleSubmit} disabled={submitting || !text.trim()} className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white  disabled:opacity-50 disabled:cursor-not-allowed">
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
        <tr className={`group transition-colors ${isSelected ? "bg-blue-50/60" : "hover:bg-gray-50/80"}`} style={{ animation: `rowFade .2s ease-out ${idx * 0.025}s both` }}>
            <td className="px-4 py-3">
                <button onClick={() => onToggle(doc.doc_id)} className="text-gray-400 hover:text-blue-500 transition-colors">{isSelected ? <CheckSquare size={16} className="text-blue-500" /> : <Square size={16} />}</button>
            </td>
            <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-gray-500 bg-gray-50 rounded px-1.5 py-0.5"><Hash size={9} className="text-gray-400" />{truncateId(doc.doc_id)}</span>
            </td>
            <td className="max-w-xs px-4 py-3">
                <button onClick={() => onView(doc)} className="text-right text-sm text-gray-600 hover:text-blue-600 transition-colors leading-relaxed line-clamp-2" title="انقر لعرض المحتوى الكامل">{truncate(doc.text)}</button>
            </td>
            <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5 text-xs text-gray-500"><User size={11} className="text-gray-400" />{doc.user || "—"}</span></td>
            <td className="px-4 py-3"><span className="rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-semibold text-purple-600 whitespace-nowrap">{catLabel}</span></td>
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

/* ═══════════════════════════════ MAIN COMPONENT ═══════════════════════════════ */

export function DataManagementTab({ onNavigateToTab }: { onNavigateToTab?: (tab: string) => void }) {
    const { user } = useAuthStore()
    const tenantId = user?.tenant_id || ""

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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">إدارة البيانات</h2>
                    <p className="mt-1 text-sm text-gray-400">تصفح وإدارة المستندات حسب الأقسام</p>
                </div>
                {activeDeptId && (
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowUpload(true)} className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white  transition-transform hover:scale-[1.02] active:scale-[0.98]"><Upload size={15} />رفع ملف</button>
                        <button onClick={() => setShowAddText(true)} className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white  transition-transform hover:scale-[1.02] active:scale-[0.98]"><Plus size={15} />إضافة نص</button>
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
                <div className="hide-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
                    {departments.map((dept) => (
                        <button key={dept.department_id} onClick={() => switchDept(dept.department_id)}
                            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${activeDeptId === dept.department_id ? "bg-gray-900 text-white " : "border border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600"}`}>
                            <span className="text-base leading-none">{dept.icon || "📁"}</span>
                            <span>{dept.name_ar || dept.name}</span>
                        </button>
                    ))}
                    {onNavigateToTab && (
                        <button onClick={() => onNavigateToTab("departments")}
                            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-dashed border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-400 transition-all duration-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
                            title="إضافة قسم جديد">
                            <Plus size={15} />
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
                <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5" style={{ animation: "fadeIn .2s ease-out" }}>
                    <p className="text-sm font-medium text-blue-700">تم تحديد <span className="font-bold">{selected.size}</span> مستند</p>
                    <button onClick={() => setDeleteTargets([...selected])} className="flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-red-600"><Trash2 size={12} /> حذف المحدد</button>
                </div>
            )}

            {/* Table */}
            {!activeDeptId ? null : (
                <>
                    {/* Info bar */}
                    {!loadingDocs && results.length > 0 && (
                        <div className="flex items-center justify-between rounded-xl bg-white border border-gray-100 px-4 py-2.5 shadow-sm">
                            <p className="text-xs text-gray-500"><span className="font-bold text-gray-700">{pagination?.totalCount ?? results.length}</span> مستند{debouncedQuery ? ` • "${debouncedQuery}"` : ""}</p>
                            <p className="text-xs text-gray-400">صفحة {pagination?.currentPage || 1} من {pagination?.totalPages || 1}</p>
                        </div>
                    )}

                    <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                        <FetchingBar visible={fetchingDocs && !loadingDocs} />

                        <div className="overflow-x-auto" style={{ opacity: fetchingDocs && !loadingDocs ? 0.6 : 1, transition: 'opacity 0.2s ease' }}>
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/80">
                                        <th className="w-10 px-4 py-3">
                                            <button onClick={toggleAll} className="text-gray-400 hover:text-blue-500 transition-colors" disabled={results.length === 0 || loadingDocs}>
                                                {allSelected ? <CheckSquare size={16} className="text-blue-500" /> : someSelected ? <MinusSquare size={16} className="text-blue-400" /> : <Square size={16} />}
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">المعرف</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">المحتوى</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">المستخدم</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">الفئة</th>
                                        <th className="w-32 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-400">الإجراءات</th>
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
                        <div className="flex items-center justify-center gap-2 pt-2">
                            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!pagination.hasPrevious} className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight size={14} /> السابق</button>
                            <div className="flex items-center gap-1">
                                {pageNums(pagination.currentPage, pagination.totalPages).map((pn, i) =>
                                    pn === "..." ? <span key={`e${i}`} className="px-1 text-gray-300">…</span> : (
                                        <button key={pn} onClick={() => setPage(pn as number)} className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-all ${page === pn ? "bg-gray-900 text-white " : "text-gray-500 hover:bg-gray-100"}`}>{pn}</button>
                                    )
                                )}
                            </div>
                            <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} onMouseEnter={() => pagination.hasNext && prefetchNextDocs()} disabled={!pagination.hasNext} className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">التالي <ChevronLeft size={14} /></button>
                        </div>
                    )}
                </>
            )}

            {/* Modals — rendered only when needed */}
            {viewDoc && <TextModal text={viewDoc.text} onClose={() => setViewDoc(null)} />}
            {editDoc && <EditModal doc={editDoc} onClose={() => setEditDoc(null)} onSave={handleUpdate} saving={saving} />}
            {deleteTargets && <DeleteModal count={deleteTargets.length} onClose={() => setDeleteTargets(null)} onConfirm={handleDelete} deleting={deleting} />}
            {showUpload && activeDeptId && <TrainUploadModal categories={categories} activeDeptId={activeDeptId} activeDeptName={activeDeptName} onClose={() => setShowUpload(false)} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["knowledge", "documents"] })} tenantId={tenantId} />}
            {showAddText && activeDeptId && <AddTextModal categories={categories} activeDeptId={activeDeptId} activeDeptName={activeDeptName} onClose={() => setShowAddText(false)} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["knowledge", "documents"] })} tenantId={tenantId} />}

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
