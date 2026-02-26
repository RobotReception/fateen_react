import { useState, useCallback, useMemo, memo } from "react"
import { toast } from "sonner"
import { FetchingBar } from "@/components/ui/FetchingBar"
import { ActionGuard } from "@/components/guards/ActionGuard"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"
import {
    Search,
    Loader2,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Filter,
    X,
    Eye,
    CheckCircle2,
    XCircle,
    Download,
    Clock,
    User,
    Hash,
    FileText,
    Building2,
    Tag,
    Calendar,
} from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import {
    getRequestDetails,
    downloadRequestTrainFile,
} from "../services/pending-requests-service"
import { usePendingOrders, useApproveRequest, useRejectRequest } from "../hooks/use-pending-requests"
import { usePrefetchPendingOrders } from "../hooks/use-prefetch"
import type {
    PendingOrder,
    RequestDetails,
} from "../types"

const PAGE_SIZE = 10
const TRUNCATE_LEN = 80

/* ═══════════════ HELPERS ═══════════════ */
function truncate(text: string, max = TRUNCATE_LEN) {
    if (!text) return "—"
    return text.length > max ? text.slice(0, max) + "…" : text
}

function truncateId(id: string) {
    if (!id) return "—"
    return id.length > 12 ? id.slice(0, 12) + "…" : id
}

function formatDate(iso: string) {
    if (!iso) return "—"
    try {
        return new Intl.DateTimeFormat("ar-SA", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Aden" }).format(new Date(iso))
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
    if (s === "pending") return { text: "معلّق", cls: "bg-amber-50 text-amber-600 border-amber-200", icon: Clock }
    if (s === "approved") return { text: "تمت الموافقة", cls: "bg-emerald-50 text-emerald-600 border-emerald-200", icon: CheckCircle2 }
    if (s === "rejected") return { text: "مرفوض", cls: "bg-red-50 text-red-600 border-red-200", icon: XCircle }
    return { text: status || "—", cls: "bg-gray-50 text-gray-500 border-gray-200", icon: Clock }
}

/* ═══════════════ SKELETON ═══════════════ */
const SkeletonRow = memo(function SkeletonRow({ delay = 0 }: { delay?: number }) {
    return (
        <tr className="pr-skeleton-shimmer" style={{ animationDelay: `${delay}ms` }}>
            {Array.from({ length: 7 }, (_, i) => (
                <td key={i} className="px-4 py-3.5"><div className={`h-3.5 rounded-full pr-skeleton-bone ${i === 2 ? "w-48" : i === 6 ? "w-20" : "w-24"}`} /></td>
            ))}
        </tr>
    )
})

/* ═══════════════ DETAILS MODAL ═══════════════ */
const DetailsModal = memo(function DetailsModal({ details, loading, onClose }: { details: RequestDetails | null; loading: boolean; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="mx-4 w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ animation: "prModalIn .18s ease-out" }}>
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <h3 className="text-base font-bold text-gray-800">تفاصيل الطلب</h3>
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
                            {details.doc_id && <InfoField icon={Hash} label="معرّف المستند" value={details.doc_id} mono />}
                            {details.department && <InfoField icon={Building2} label="القسم" value={details.department} />}
                            {details.category && <InfoField icon={Tag} label="الفئة" value={details.category} />}
                            {details.file_name && <InfoField icon={FileText} label="اسم الملف" value={details.file_name} />}
                            {details.file_size && <InfoField icon={FileText} label="حجم الملف" value={details.file_size} />}
                        </div>
                        {details.text && (
                            <div>
                                <p className="mb-1.5 text-xs font-semibold text-gray-500">محتوى الطلب</p>
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

/* ═══════════════ APPROVE MODAL ═══════════════ */
const ApproveModal = memo(function ApproveModal({ order, onClose, onConfirm, loading }: { order: PendingOrder; onClose: () => void; onConfirm: () => void; loading: boolean }) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ animation: "prModalIn .18s ease-out" }}>
                <div className="p-6 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                        <CheckCircle2 size={28} className="text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">الموافقة على الطلب</h3>
                    <p className="mt-2 text-sm text-gray-500">هل أنت متأكد من الموافقة على طلب <span className="font-semibold text-gray-700">{order.username}</span>؟</p>
                    <p className="mt-1 text-xs text-gray-400">نوع العملية: {operationLabel(order.operation)}</p>
                    <div className="mt-6 flex items-center justify-center gap-3">
                        <button onClick={onClose} disabled={loading} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">إلغاء</button>
                        <button onClick={onConfirm} disabled={loading} className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white  transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50">
                            {loading && <Loader2 size={14} className="animate-spin" />}
                            موافقة
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
})

/* ═══════════════ REJECT MODAL ═══════════════ */
const RejectModal = memo(function RejectModal({ order, onClose, onConfirm, loading }: { order: PendingOrder; onClose: () => void; onConfirm: (reason: string) => void; loading: boolean }) {
    const [reason, setReason] = useState("")
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ animation: "prModalIn .18s ease-out" }}>
                <div className="p-6">
                    <div className="text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                            <XCircle size={28} className="text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">رفض الطلب</h3>
                        <p className="mt-2 text-sm text-gray-500">رفض طلب <span className="font-semibold text-gray-700">{order.username}</span></p>
                    </div>
                    <div className="mt-4">
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">سبب الرفض <span className="text-red-400">*</span></label>
                        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="اكتب سبب الرفض..." className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-700 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 resize-none" dir="rtl" />
                    </div>
                    <div className="mt-5 flex items-center justify-center gap-3">
                        <button onClick={onClose} disabled={loading} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">إلغاء</button>
                        <button onClick={() => onConfirm(reason)} disabled={loading || !reason.trim()} className="flex items-center gap-2 rounded-xl bg-gray-800 px-5 py-2.5 text-sm font-medium text-white  transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading && <Loader2 size={14} className="animate-spin" />}
                            رفض
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
})

/* ═══════════════ TABLE ROW ═══════════════ */
const OrderRow = memo(function OrderRow({
    order, idx, onView, onApprove, onReject, onDownload,
}: {
    order: PendingOrder; idx: number
    onView: (o: PendingOrder) => void; onApprove: (o: PendingOrder) => void; onReject: (o: PendingOrder) => void; onDownload: (o: PendingOrder) => void
}) {
    const badge = statusBadge(order.status)
    const BadgeIcon = badge.icon
    const isPending = order.status?.toLowerCase() === "pending"
    const hasFile = order.operation?.toLowerCase().includes("train") || order.operation?.toLowerCase().includes("add")

    return (
        <tr className="group transition-colors hover:bg-gray-50/80" style={{ animation: `prRowFade 0.3s ease-out ${idx * 0.03}s both` }}>
            <td className="px-4 py-3.5"><span className="text-xs text-gray-400">{order.index}</span></td>
            <td className="px-4 py-3.5">
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-gray-500 bg-gray-50 rounded px-1.5 py-0.5"><Hash size={9} className="text-gray-400" />{truncateId(order.id)}</span>
            </td>
            <td className="px-4 py-3.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-600">
                    <FileText size={10} />{operationLabel(order.operation)}
                </span>
            </td>
            <td className="px-4 py-3.5"><span className="inline-flex items-center gap-1.5 text-xs text-gray-600"><User size={11} className="text-gray-400" />{order.username || "—"}</span></td>
            <td className="px-4 py-3.5">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
                    <BadgeIcon size={10} />{badge.text}
                </span>
            </td>
            <td className="px-4 py-3.5"><span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(order.created_at)}</span></td>
            <td className="px-4 py-3.5"><p className="text-xs text-gray-500 max-w-[180px] truncate" title={order.text}>{truncate(order.text, 50)}</p></td>
            <td className="px-4 py-3.5">
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <ActionGuard pageBit={PAGE_BITS.PENDING_REQUESTS} actionBit={ACTION_BITS.GET_REQUEST_DETAILS}>
                        <button onClick={() => onView(order)} className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors" title="عرض التفاصيل"><Eye size={14} /></button>
                    </ActionGuard>
                    {isPending && (
                        <>
                            <ActionGuard pageBit={PAGE_BITS.PENDING_REQUESTS} actionBit={ACTION_BITS.PROCESS_APPROVE}>
                                <button onClick={() => onApprove(order)} className="rounded-lg p-1.5 text-gray-400 hover:bg-emerald-50 hover:text-emerald-500 transition-colors" title="موافقة"><CheckCircle2 size={14} /></button>
                            </ActionGuard>
                            <ActionGuard pageBit={PAGE_BITS.PENDING_REQUESTS} actionBit={ACTION_BITS.PROCESS_REJECT}>
                                <button onClick={() => onReject(order)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="رفض"><XCircle size={14} /></button>
                            </ActionGuard>
                        </>
                    )}
                    {hasFile && (
                        <ActionGuard pageBit={PAGE_BITS.PENDING_REQUESTS} actionBit={ACTION_BITS.DOWNLOAD_REQUEST_TRAIN_FILE}>
                            <button onClick={() => onDownload(order)} className="rounded-lg p-1.5 text-gray-400 hover:bg-purple-50 hover:text-purple-500 transition-colors" title="تحميل الملف"><Download size={14} /></button>
                        </ActionGuard>
                    )}
                </div>
            </td>
        </tr>
    )
})

/* ═══════════════════════════════ MAIN COMPONENT ═══════════════════════════════ */

export function PendingRequestsPage() {
    const { user } = useAuthStore()
    const tenantId = user?.tenant_id || ""

    // ── Pagination & Filters ──
    const [page, setPage] = useState(1)
    const [filterUsername, setFilterUsername] = useState("")
    const [filterOperation, setFilterOperation] = useState("")
    const [searchQuery, setSearchQuery] = useState("")

    // ── Modals ──
    const [detailsTarget, setDetailsTarget] = useState<PendingOrder | null>(null)
    const [detailsData, setDetailsData] = useState<RequestDetails | null>(null)
    const [loadingDetails, setLoadingDetails] = useState(false)
    const [approveTarget, setApproveTarget] = useState<PendingOrder | null>(null)
    const [rejectTarget, setRejectTarget] = useState<PendingOrder | null>(null)

    // ── React Query: fetch pending orders ──
    const queryParams = {
        page,
        page_size: PAGE_SIZE,
        username: filterUsername || undefined,
        operation: filterOperation || undefined,
    }
    const { data: ordersRes, isLoading: loading, isFetching } = usePendingOrders(tenantId, queryParams)
    const backgroundFetching = isFetching && !loading

    const orders = ordersRes?.success ? ordersRes.data?.search_results ?? [] : []
    const pagination = ordersRes?.success ? ordersRes.data?.pagination ?? null : null
    const usernameOptions = ordersRes?.success ? ordersRes.data?.unique_values?.username ?? [] : []
    const operationOptions = ordersRes?.success ? ordersRes.data?.unique_values?.operation ?? [] : []
    const totalPages = pagination ? pagination.totalPages : 1

    // ── React Query: mutations ──
    const approveMutation = useApproveRequest(tenantId)
    const rejectMutation = useRejectRequest(tenantId)
    const processing = approveMutation.isPending || rejectMutation.isPending

    // ── Prefetch next page ──
    const prefetchOrders = usePrefetchPendingOrders(tenantId)
    const prefetchNextPage = useCallback(() => {
        prefetchOrders({
            page: page + 1,
            page_size: PAGE_SIZE,
            username: filterUsername || undefined,
            operation: filterOperation || undefined,
        })
    }, [prefetchOrders, page, filterUsername, filterOperation])

    /* ─── View details ─── */
    const handleViewDetails = useCallback(async (order: PendingOrder) => {
        setDetailsTarget(order)
        setDetailsData(null)
        setLoadingDetails(true)
        try {
            const res = await getRequestDetails(order.id, tenantId)
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

    /* ─── Approve ─── */
    const handleApprove = useCallback(() => {
        if (!approveTarget) return
        approveMutation.mutate(approveTarget.id, {
            onSuccess: () => setApproveTarget(null),
        })
    }, [approveTarget, approveMutation])

    /* ─── Reject ─── */
    const handleReject = useCallback((reason: string) => {
        if (!rejectTarget) return
        rejectMutation.mutate({ requestId: rejectTarget.id, reason }, {
            onSuccess: () => setRejectTarget(null),
        })
    }, [rejectTarget, rejectMutation])

    /* ─── Download ─── */
    const handleDownload = useCallback(async (order: PendingOrder) => {
        try {
            const blob = await downloadRequestTrainFile(order.id, tenantId)
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `request_${order.id}_file`
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
            toast.success("تم بدء التحميل")
        } catch { toast.error("فشل تحميل الملف") }
    }, [tenantId])

    /* ─── Client-side text filter ─── */
    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return orders
        const q = searchQuery.toLowerCase()
        return orders.filter((o) =>
            o.id.toLowerCase().includes(q) ||
            o.username.toLowerCase().includes(q) ||
            o.text?.toLowerCase().includes(q) ||
            o.operation.toLowerCase().includes(q)
        )
    }, [orders, searchQuery])

    /* ═══════════════════════ RENDER ═══════════════════════ */
    return (
        <div className="p-6 space-y-5" dir="rtl">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">الطلبات المعلقة</h2>
                    <p className="mt-1 text-sm text-gray-400">مراجعة الطلبات والموافقة أو الرفض</p>
                </div>
                {pagination && (
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700">
                            <Clock size={12} />
                            {pagination.totalCount} طلب
                        </span>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="بحث سريع..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-10 pl-10 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                    {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><X size={14} /></button>}
                </div>
                <div className="relative min-w-[180px]">
                    <select value={filterUsername} onChange={(e) => { setFilterUsername(e.target.value); setPage(1) }}
                        className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pr-4 pl-8 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                        <option value="">كل المستخدمين</option>
                        {usernameOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <User size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                <div className="relative min-w-[180px]">
                    <select value={filterOperation} onChange={(e) => { setFilterOperation(e.target.value); setPage(1) }}
                        className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pr-4 pl-8 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                        <option value="">كل العمليات</option>
                        {operationOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <Filter size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
            </div>

            {/* Info bar */}
            {!loading && filtered.length > 0 && pagination && (
                <div className="flex items-center justify-between rounded-xl bg-white border border-gray-100 px-4 py-2.5 shadow-sm">
                    <p className="text-xs text-gray-500"><span className="font-bold text-gray-700">{pagination.totalCount}</span> طلب</p>
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
                                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">المحتوى</th>
                                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && orders.length === 0
                                ? Array.from({ length: 6 }, (_, i) => <SkeletonRow key={i} delay={i * 80} />)
                                : filtered.map((order, idx) => (
                                    <OrderRow
                                        key={order.id}
                                        order={order}
                                        idx={idx}
                                        onView={handleViewDetails}
                                        onApprove={setApproveTarget}
                                        onReject={setRejectTarget}
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
                            <ClipboardList size={28} className="text-gray-300" />
                        </div>
                        <p className="mt-4 text-sm font-medium text-gray-500">{searchQuery || filterUsername || filterOperation ? "لا توجد نتائج مطابقة" : "لا توجد طلبات معلقة"}</p>
                        <p className="mt-1 text-xs text-gray-400">{searchQuery || filterUsername || filterOperation ? "جرب تغيير معايير البحث" : "ستظهر الطلبات الجديدة هنا تلقائياً"}</p>
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
            {approveTarget && <ApproveModal order={approveTarget} onClose={() => setApproveTarget(null)} onConfirm={handleApprove} loading={processing} />}
            {rejectTarget && <RejectModal order={rejectTarget} onClose={() => setRejectTarget(null)} onConfirm={handleReject} loading={processing} />}

            {/* Styles */}
            <style>{`
                @keyframes prModalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
                @keyframes prFadeIn{from{opacity:0}to{opacity:1}}
                @keyframes prRowFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
                @keyframes prShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
                .pr-skeleton-bone{background:linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 37%,#f3f4f6 63%);background-size:200% 100%;animation:prShimmer 1.5s ease-in-out infinite}
                .pr-skeleton-shimmer{opacity:0;animation:prFadeIn .3s ease-out forwards}
                .pr-loading-spinner{width:36px;height:36px;border:3px solid #e5e7eb;border-top-color:#3b82f6;border-radius:50%;animation:prSpin .7s linear infinite}
                @keyframes prSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
            `}</style>
        </div>
    )
}
