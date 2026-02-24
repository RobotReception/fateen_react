import { useState, useCallback, useMemo, memo } from "react"
import { toast } from "sonner"
import { ActionGuard } from "@/components/guards/ActionGuard"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"
import {
    Search,
    Loader2,
    ChevronLeft,
    ChevronRight,
    History,
    Filter,
    X,
    Eye,
    Download,
    FileSpreadsheet,
    Clock,
    User,
    Hash,
    FileText,
    CheckCircle2,
    XCircle,
    Calendar,
    ShieldCheck,
    AlertTriangle,
} from "lucide-react"

import { useAuthStore } from "@/stores/auth-store"
import {
    getOperationDetails,
    downloadOperationsCsv,
    downloadOperationTrainFile,
} from "../services/operation-history-service"
import { useOperationsList } from "../hooks/use-operations"
import { usePrefetchOperations } from "../hooks/use-prefetch"
import { FetchingBar } from "@/components/ui/FetchingBar"
import type {
    Operation,
    OperationDetails,
} from "../types"

const PAGE_SIZE = 10

/* ═══════════════ HELPERS ═══════════════ */

function truncateId(id: string) {
    if (!id) return "—"
    return id.length > 12 ? id.slice(0, 12) + "…" : id
}

function formatDate(iso: string) {
    if (!iso) return "—"
    try {
        return new Intl.DateTimeFormat("ar-SA", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso))
    } catch { return iso }
}

function operationLabel(op: string) {
    const map: Record<string, string> = {
        train_data_request: "طلب تدريب بيانات",
        document_upload: "رفع مستند",
        add_data_request: "طلب إضافة بيانات",
        update_data_request: "طلب تحديث بيانات",
        delete_data_request: "طلب حذف بيانات",
    }
    return map[op] || op
}

function statusBadge(status: string) {
    const s = status?.toLowerCase()
    if (s === "completed") return { text: "مكتمل", cls: "bg-emerald-50 text-emerald-600 border-emerald-200", icon: CheckCircle2 }
    if (s === "approved") return { text: "تمت الموافقة", cls: "bg-blue-50 text-blue-600 border-blue-200", icon: CheckCircle2 }
    if (s === "pending") return { text: "معلّق", cls: "bg-amber-50 text-amber-600 border-amber-200", icon: Clock }
    if (s === "rejected") return { text: "مرفوض", cls: "bg-red-50 text-red-600 border-red-200", icon: XCircle }
    return { text: status || "—", cls: "bg-gray-50 text-gray-500 border-gray-200", icon: Clock }
}

/* ═══════════════ SKELETON ═══════════════ */
const SkeletonRow = memo(function SkeletonRow({ delay = 0 }: { delay?: number }) {
    return (
        <tr className="oh-skeleton-shimmer" style={{ animationDelay: `${delay}ms` }}>
            {Array.from({ length: 8 }, (_, i) => (
                <td key={i} className="px-4 py-3.5"><div className={`h-3.5 rounded-full oh-skeleton-bone ${i === 2 ? "w-32" : i === 7 ? "w-16" : "w-20"}`} /></td>
            ))}
        </tr>
    )
})

/* ═══════════════ DETAILS MODAL ═══════════════ */
const DetailsModal = memo(function DetailsModal({ details, loading, onClose }: { details: OperationDetails | null; loading: boolean; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="mx-4 w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ animation: "ohModalIn .18s ease-out" }}>
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <h3 className="text-base font-bold text-gray-800">تفاصيل العملية</h3>
                    <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                {loading || !details ? (
                    <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin text-blue-500" /></div>
                ) : (
                    <div className="max-h-[60vh] overflow-y-auto p-5 space-y-4" dir="rtl">
                        <div className="grid grid-cols-2 gap-3">
                            <InfoField icon={Hash} label="المعرّف" value={details.id} mono />
                            <InfoField icon={User} label="المستخدم" value={details.username} />
                            <InfoField icon={FileText} label="نوع العملية" value={operationLabel(details.operation)} />
                            <InfoField icon={Clock} label="الحالة" value={statusBadge(details.status).text} />
                            <InfoField icon={Calendar} label="تاريخ الإنشاء" value={formatDate(details.created_at)} />
                            {details.completed_at && <InfoField icon={CheckCircle2} label="تاريخ الإنجاز" value={formatDate(details.completed_at)} />}
                            {details.approved_by && <InfoField icon={ShieldCheck} label="تمت الموافقة بواسطة" value={details.approved_by} />}
                            {details.doc_id && <InfoField icon={Hash} label="معرّف المستند" value={details.doc_id} mono />}
                        </div>
                        {details.rejection_reason && (
                            <div className="rounded-xl bg-red-50 border border-red-100 p-3">
                                <p className="mb-1 text-xs font-semibold text-red-500 flex items-center gap-1"><AlertTriangle size={11} />سبب الرفض</p>
                                <p className="text-sm text-red-700">{details.rejection_reason}</p>
                            </div>
                        )}
                        {details.text && (
                            <div>
                                <p className="mb-1.5 text-xs font-semibold text-gray-500">تفاصيل العملية</p>
                                <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap" dir="auto">{details.text}</div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
})

function InfoField({ icon: Icon, label, value, mono }: { icon: typeof Hash; label: string; value: string; mono?: boolean }) {
    return (
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-2.5">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 mb-1"><Icon size={10} />{label}</p>
            <p className={`text-sm text-gray-700 ${mono ? "font-mono text-xs" : ""}`}>{value || "—"}</p>
        </div>
    )
}

/* ═══════════════ TABLE ROW ═══════════════ */
const OpRow = memo(function OpRow({
    op, idx, onView, onDownload,
}: {
    op: Operation; idx: number
    onView: (o: Operation) => void; onDownload: (o: Operation) => void
}) {
    const badge = statusBadge(op.status)
    const BadgeIcon = badge.icon
    const hasFile = op.operation?.toLowerCase().includes("train") || op.operation?.toLowerCase().includes("add")

    return (
        <tr className="group transition-colors hover:bg-gray-50/80" style={{ animation: `ohRowFade 0.3s ease-out ${idx * 0.03}s both` }}>
            <td className="px-4 py-3.5"><span className="text-xs text-gray-400">{op.index}</span></td>
            <td className="px-4 py-3.5">
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-gray-500 bg-gray-50 rounded px-1.5 py-0.5"><Hash size={9} className="text-gray-400" />{truncateId(op.id)}</span>
            </td>
            <td className="px-4 py-3.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-600">
                    <FileText size={10} />{operationLabel(op.operation)}
                </span>
            </td>
            <td className="px-4 py-3.5"><span className="inline-flex items-center gap-1.5 text-xs text-gray-600"><User size={11} className="text-gray-400" />{op.username || "—"}</span></td>
            <td className="px-4 py-3.5">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
                    <BadgeIcon size={10} />{badge.text}
                </span>
            </td>
            <td className="px-4 py-3.5"><span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(op.created_at)}</span></td>
            <td className="px-4 py-3.5"><span className="text-xs text-gray-500">{op.approved_by || "—"}</span></td>
            <td className="px-4 py-3.5"><span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(op.completed_at)}</span></td>
            <td className="px-4 py-3.5">
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <ActionGuard pageBit={PAGE_BITS.OPERATION_HISTORY} actionBit={ACTION_BITS.GET_OPERATION_DETAILS}>
                        <button onClick={() => onView(op)} className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors" title="عرض التفاصيل"><Eye size={14} /></button>
                    </ActionGuard>
                    {hasFile && (
                        <ActionGuard pageBit={PAGE_BITS.OPERATION_HISTORY} actionBit={ACTION_BITS.DOWNLOAD_OPERATION_TRAIN_FILE}>
                            <button onClick={() => onDownload(op)} className="rounded-lg p-1.5 text-gray-400 hover:bg-purple-50 hover:text-purple-500 transition-colors" title="تحميل الملف"><Download size={14} /></button>
                        </ActionGuard>
                    )}
                </div>
            </td>
        </tr>
    )
})

/* ═══════════════════════════════ MAIN COMPONENT ═══════════════════════════════ */

export function OperationHistoryPage() {
    const { user } = useAuthStore()
    const tenantId = user?.tenant_id || ""

    // ── Pagination & Filters ──
    const [page, setPage] = useState(1)
    const [filterUsername, setFilterUsername] = useState("")
    const [filterOperation, setFilterOperation] = useState("")
    const [filterStatus, setFilterStatus] = useState("")
    const [filterApprovedBy, setFilterApprovedBy] = useState("")
    const [searchQuery, setSearchQuery] = useState("")

    // ── Modals ──
    const [detailsTarget, setDetailsTarget] = useState<Operation | null>(null)
    const [detailsData, setDetailsData] = useState<OperationDetails | null>(null)
    const [loadingDetails, setLoadingDetails] = useState(false)

    // ── CSV ──
    const [exporting, setExporting] = useState(false)

    // ── React Query: fetch operations ──
    const queryParams = {
        page,
        page_size: PAGE_SIZE,
        username: filterUsername || undefined,
        operation: filterOperation || undefined,
        status: filterStatus || undefined,
        approved_by: filterApprovedBy || undefined,
    }
    const { data: opsRes, isLoading: loading, isFetching } = useOperationsList(tenantId, queryParams)
    const backgroundFetching = isFetching && !loading

    const operations = opsRes?.success ? opsRes.data?.results ?? [] : []
    const pagination = opsRes?.success ? opsRes.data?.pagination ?? null : null
    const usernameOpts = opsRes?.success ? opsRes.data?.unique_values?.username ?? [] : []
    const operationOpts = opsRes?.success ? opsRes.data?.unique_values?.operation ?? [] : []
    const statusOpts = opsRes?.success ? opsRes.data?.unique_values?.status ?? [] : []
    const approvedByOpts = opsRes?.success ? opsRes.data?.unique_values?.approved_by ?? [] : []
    const totalPages = pagination ? pagination.totalPages : 1

    // ── Prefetch next page ──
    const prefetchOps = usePrefetchOperations(tenantId)
    const prefetchNextPage = useCallback(() => {
        prefetchOps({
            page: page + 1,
            page_size: PAGE_SIZE,
            username: filterUsername || undefined,
            operation: filterOperation || undefined,
            status: filterStatus || undefined,
            approved_by: filterApprovedBy || undefined,
        })
    }, [prefetchOps, page, filterUsername, filterOperation, filterStatus, filterApprovedBy])

    /* ─── View details ─── */
    const handleViewDetails = useCallback(async (op: Operation) => {
        setDetailsTarget(op)
        setDetailsData(null)
        setLoadingDetails(true)
        try {
            const res = await getOperationDetails(op.id, tenantId)
            if (res.success && res.data?.operation_details) {
                setDetailsData(res.data.operation_details)
            } else {
                toast.error(res.message || "فشل جلب التفاصيل")
                setDetailsTarget(null)
            }
        } catch {
            toast.error("حدث خطأ أثناء جلب التفاصيل")
            setDetailsTarget(null)
        }
        finally { setLoadingDetails(false) }
    }, [tenantId])

    /* ─── Download file ─── */
    const handleDownload = useCallback(async (op: Operation) => {
        try {
            const blob = await downloadOperationTrainFile(op.id, tenantId)
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `operation_${op.id}_file`
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
            toast.success("تم بدء التحميل")
        } catch { toast.error("فشل تحميل الملف") }
    }, [tenantId])

    /* ─── Export CSV ─── */
    const handleExportCsv = useCallback(async () => {
        setExporting(true)
        try {
            const blob = await downloadOperationsCsv({
                filter_user: filterUsername || undefined,
                filter_operation: filterOperation || undefined,
                filter_status: filterStatus || undefined,
                filter_approved_by: filterApprovedBy || undefined,
            }, tenantId)
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `operations_${new Date().toISOString().split("T")[0]}.csv`
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
            toast.success("تم تصدير الملف بنجاح")
        } catch { toast.error("فشل تصدير ملف CSV") }
        finally { setExporting(false) }
    }, [tenantId, filterUsername, filterOperation, filterStatus, filterApprovedBy])

    /* ─── Client-side text filter ─── */
    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return operations
        const q = searchQuery.toLowerCase()
        return operations.filter((o) =>
            o.id.toLowerCase().includes(q) ||
            o.username.toLowerCase().includes(q) ||
            o.operation.toLowerCase().includes(q) ||
            (o.approved_by || "").toLowerCase().includes(q)
        )
    }, [operations, searchQuery])

    const hasActiveFilters = filterUsername || filterOperation || filterStatus || filterApprovedBy
    const clearFilters = () => { setFilterUsername(""); setFilterOperation(""); setFilterStatus(""); setFilterApprovedBy(""); setPage(1) }

    /* ═══════════════════════ RENDER ═══════════════════════ */
    return (
        <div className="p-6 space-y-5" dir="rtl">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">سجل العمليات</h2>
                    <p className="mt-1 text-sm text-gray-400">استعراض وتتبع جميع العمليات المنفذة</p>
                </div>
                <div className="flex items-center gap-2">
                    {pagination && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700">
                            <History size={12} />
                            {pagination.totalCount} عملية
                        </span>
                    )}
                    <ActionGuard pageBit={PAGE_BITS.OPERATION_HISTORY} actionBit={ACTION_BITS.DOWNLOAD_OPERATIONS_CSV}>
                        <button onClick={handleExportCsv} disabled={exporting || loading}
                            className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white  transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50">
                            {exporting ? <Loader2 size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />}
                            تصدير CSV
                        </button>
                    </ActionGuard>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="بحث سريع..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-10 pl-10 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                    {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><X size={14} /></button>}
                </div>
                <div className="relative min-w-[160px]">
                    <select value={filterUsername} onChange={(e) => { setFilterUsername(e.target.value); setPage(1) }}
                        className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pr-4 pl-8 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                        <option value="">كل المستخدمين</option>
                        {usernameOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <User size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                <div className="relative min-w-[160px]">
                    <select value={filterOperation} onChange={(e) => { setFilterOperation(e.target.value); setPage(1) }}
                        className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pr-4 pl-8 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                        <option value="">كل العمليات</option>
                        {operationOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <Filter size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                <div className="relative min-w-[140px]">
                    <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
                        className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pr-4 pl-8 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                        <option value="">كل الحالات</option>
                        {statusOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <Clock size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                <div className="relative min-w-[160px]">
                    <select value={filterApprovedBy} onChange={(e) => { setFilterApprovedBy(e.target.value); setPage(1) }}
                        className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pr-4 pl-8 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                        <option value="">كل الموافقين</option>
                        {approvedByOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ShieldCheck size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                {hasActiveFilters && (
                    <button onClick={clearFilters} className="flex shrink-0 items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors">
                        <X size={12} />مسح الفلاتر
                    </button>
                )}
            </div>

            {/* Info bar */}
            {!loading && filtered.length > 0 && pagination && (
                <div className="flex items-center justify-between rounded-xl bg-white border border-gray-100 px-4 py-2.5 shadow-sm">
                    <p className="text-xs text-gray-500"><span className="font-bold text-gray-700">{pagination.totalCount}</span> عملية</p>
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
                                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">#</th>
                                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">المعرّف</th>
                                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">العملية</th>
                                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">المستخدم</th>
                                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">الحالة</th>
                                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">التاريخ</th>
                                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">الموافق</th>
                                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">تاريخ الإنجاز</th>
                                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && operations.length === 0
                                ? Array.from({ length: 6 }, (_, i) => <SkeletonRow key={i} delay={i * 80} />)
                                : filtered.map((op, idx) => (
                                    <OpRow
                                        key={op.id}
                                        op={op}
                                        idx={idx}
                                        onView={handleViewDetails}
                                        onDownload={handleDownload}
                                    />
                                ))}
                        </tbody>
                    </table>
                </div>

                {/* Empty state */}
                {!loading && filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                            <History size={28} className="text-gray-300" />
                        </div>
                        <p className="mt-4 text-sm font-medium text-gray-500">{searchQuery || hasActiveFilters ? "لا توجد نتائج مطابقة" : "لا توجد عمليات مسجلة"}</p>
                        <p className="mt-1 text-xs text-gray-400">{searchQuery || hasActiveFilters ? "جرب تغيير معايير البحث أو الفلاتر" : "ستظهر العمليات المنفذة هنا تلقائياً"}</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                        className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                        <ChevronRight size={14} /> السابق
                    </button>
                    <span className="flex h-8 items-center rounded-lg bg-gray-900 px-3 text-xs font-bold text-white ">{page}</span>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} onMouseEnter={() => page < totalPages && prefetchNextPage()} disabled={page >= totalPages}
                        className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                        التالي <ChevronLeft size={14} />
                    </button>
                </div>
            )}

            {/* Modals */}
            {detailsTarget && <DetailsModal details={detailsData} loading={loadingDetails} onClose={() => { setDetailsTarget(null); setDetailsData(null) }} />}

            {/* Styles */}
            <style>{`
                @keyframes ohModalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
                @keyframes ohFadeIn{from{opacity:0}to{opacity:1}}
                @keyframes ohRowFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
                @keyframes ohShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
                .oh-skeleton-bone{background:linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 37%,#f3f4f6 63%);background-size:200% 100%;animation:ohShimmer 1.5s ease-in-out infinite}
                .oh-skeleton-shimmer{opacity:0;animation:ohFadeIn .3s ease-out forwards}
                .oh-loading-spinner{width:36px;height:36px;border:3px solid #e5e7eb;border-top-color:#3b82f6;border-radius:50%;animation:ohSpin .7s linear infinite}
                @keyframes ohSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
            `}</style>
        </div>
    )
}
