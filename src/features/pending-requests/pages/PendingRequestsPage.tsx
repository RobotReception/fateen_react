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

    FileDown,
    Layers,
    Settings2,
    CheckCircle,
    AlertCircle,
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

const OPERATION_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
    train: { label: "🎓 تدريب ملف", color: "#2563eb", bg: "rgba(37,99,235,0.06)", border: "rgba(37,99,235,0.18)" },
    add: { label: "➕ إضافة نص", color: "#059669", bg: "rgba(5,150,105,0.06)", border: "rgba(5,150,105,0.18)" },
    delete: { label: "🗑️ حذف مستند", color: "var(--t-danger)", bg: "rgba(220,38,38,0.06)", border: "rgba(220,38,38,0.18)" },
    update: { label: "✏️ تحديث مستند", color: "#d97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.18)" },
    train_data_request: { label: "🎓 طلب تدريب بيانات", color: "#2563eb", bg: "rgba(37,99,235,0.06)", border: "rgba(37,99,235,0.18)" },
    document_upload: { label: "📄 رفع مستند", color: "#7c3aed", bg: "rgba(124,58,237,0.06)", border: "rgba(124,58,237,0.18)" },
    add_data_request: { label: "➕ طلب إضافة بيانات", color: "#059669", bg: "rgba(5,150,105,0.06)", border: "rgba(5,150,105,0.18)" },
    update_data_request: { label: "✏️ طلب تحديث بيانات", color: "#d97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.18)" },
    delete_data_request: { label: "🗑️ طلب حذف بيانات", color: "var(--t-danger)", bg: "rgba(220,38,38,0.06)", border: "rgba(220,38,38,0.18)" },
}

function operationLabel(op: string) {
    return OPERATION_MAP[op]?.label || op
}

function operationStyle(op: string) {
    return OPERATION_MAP[op] || { label: op, color: "var(--t-text-muted)", bg: "rgba(107,114,128,0.06)", border: "rgba(107,114,128,0.18)" }
}

function statusBadge(status: string) {
    const s = status?.toLowerCase()
    if (s === "pending") return { text: "معلّق", cls: "bg-amber-50 text-amber-600 border-amber-200", icon: Clock }
    if (s === "approved") return { text: "تمت الموافقة", cls: "bg-emerald-50 text-emerald-600 border-emerald-200", icon: CheckCircle2 }
    if (s === "rejected") return { text: "مرفوض", cls: "bg-red-50 text-red-600 border-red-200", icon: XCircle }
    return { text: status || "—", cls: "bg-gray-50 text-gray-500 border-gray-200", icon: Clock }
}

/* ═══════════════ DETAIL FIELD LABELS ═══════════════ */
const FIELD_LABELS: Record<string, string> = {
    id: "المعرّف",
    operation: "نوع العملية",
    username: "المستخدم",
    status: "الحالة",
    created_at: "تاريخ الإنشاء",
    completed_at: "تاريخ الإتمام",
    approved_by: "تمت الموافقة بواسطة",
    rejection_reason: "سبب الرفض",
    file_name: "اسم الملف",
    file_path: "مسار الملف",
    file_url: "رابط الملف",
    file_size: "حجم الملف",
    media_id: "معرّف الوسائط",
    public_url: "الرابط العام",
    proxy_url: "رابط البروكسي",
    department_id: "القسم",
    category_id: "التصنيف",
    has_header: "يحتوي عناوين أعمدة",
    delimiter: "الفاصل",
    encoding: "الترميز",
    question_col: "عمود السؤال",
    answer_col: "عمود الجواب",
    sheet: "رقم الورقة",
    text: "النص / المحتوى",
    doc_id: "معرّف المستند",
    tenant_id: "معرّف الشركة",
}



// Groups for the details view
const BASIC_FIELDS = ["operation", "username", "status", "created_at", "completed_at", "approved_by", "rejection_reason"]
const FILE_FIELDS = ["file_name", "file_size", "department_id", "category_id", "has_header", "delimiter", "encoding", "question_col", "answer_col", "sheet"]
const LINK_FIELDS = ["file_url", "file_path", "public_url", "proxy_url", "media_id"]
const CONTENT_FIELDS = ["text", "doc_id"]
const ALL_KNOWN_FIELDS = new Set(["id", "index", "tenant_id", ...BASIC_FIELDS, ...FILE_FIELDS, ...LINK_FIELDS, ...CONTENT_FIELDS])

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




function InfoField({ icon: Icon, label, value, mono }: { icon: typeof Hash; label: string; value: string; mono?: boolean }) {
    return (
        <div style={{ borderRadius: 10, background: "var(--t-page)", border: "1px solid var(--t-surface)", padding: "8px 12px" }}>
            <p style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 600, color: "var(--t-text-faint)", marginBottom: 3 }}><Icon size={10} />{label}</p>
            <p style={{ fontSize: 13, color: "var(--t-text-secondary)", fontFamily: mono ? "monospace" : "inherit", wordBreak: "break-all" }}>{value || "—"}</p>
        </div>
    )
}

function SectionHeader({ icon: Icon, title }: { icon: typeof Hash; title: string }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 7, paddingBottom: 6, borderBottom: "1px solid var(--t-surface)", marginBottom: 10 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: "var(--t-gradient-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={11} style={{ color: "#fff" }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--t-text-secondary)" }}>{title}</span>
        </div>
    )
}

const DetailsModal = memo(function DetailsModal({
    details, loading, onClose, onDownloadFile, downloadingFile,
}: {
    details: RequestDetails | null; loading: boolean; onClose: () => void
    onDownloadFile: () => void; downloadingFile: boolean
}) {
    const hasFile = details && (details.file_url || details.media_id || details.public_url || details.proxy_url)
    const opStyle = details ? operationStyle(details.operation) : null

    // Detect extra unknown fields not in our known set
    const extraFields = details
        ? Object.entries(details).filter(([key, val]) => !ALL_KNOWN_FIELDS.has(key) && val != null && val !== "")
        : []

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="mx-4 w-full max-w-xl overflow-hidden bg-white" onClick={(e) => e.stopPropagation()} style={{ animation: "prModalIn .18s ease-out", borderRadius: 14, border: "1px solid var(--t-border)", boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #f0f0f0", background: "linear-gradient(135deg, rgba(27,80,145,0.03), rgba(77,166,232,0.03))" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--t-gradient-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <ClipboardList size={15} style={{ color: "#fff" }} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1f2937", margin: 0 }}>تفاصيل الطلب</h3>
                            {details && <p style={{ fontSize: 10, color: "var(--t-text-faint)", fontFamily: "monospace", marginTop: 2 }}>#{details.id}</p>}
                        </div>
                    </div>
                    <button onClick={onClose} style={{ borderRadius: 7, padding: 6, border: "1px solid var(--t-surface)", background: "#fff", cursor: "pointer", color: "var(--t-text-faint)", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={15} /></button>
                </div>

                {loading || !details ? (
                    <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin text-blue-500" /></div>
                ) : (
                    <div style={{ maxHeight: "65vh", overflowY: "auto", padding: "16px 20px" }} dir="rtl">
                        {/* ── Operation Badge (top) ── */}
                        {opStyle && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: opStyle.bg, border: `1px solid ${opStyle.border}` }}>
                                <FileText size={14} style={{ color: opStyle.color }} />
                                <span style={{ fontSize: 13, fontWeight: 700, color: opStyle.color }}>{opStyle.label}</span>
                                <span style={{ marginRight: "auto" }} />
                                {(() => {
                                    const b = statusBadge(details.status); const BadgeIcon = b.icon; return (
                                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${b.cls}`}><BadgeIcon size={10} />{b.text}</span>
                                    )
                                })()}
                            </div>
                        )}

                        {/* ── Section: Basic Info ── */}
                        <div style={{ marginBottom: 18 }}>
                            <SectionHeader icon={User} title="معلومات أساسية" />
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                <InfoField icon={User} label="المستخدم" value={details.username} />
                                <InfoField icon={Calendar} label="تاريخ الإنشاء" value={formatDate(details.created_at)} />
                                {details.completed_at && <InfoField icon={CheckCircle} label="تاريخ الإتمام" value={formatDate(details.completed_at)} />}
                                {details.approved_by && <InfoField icon={CheckCircle2} label="تمت الموافقة بواسطة" value={details.approved_by} />}
                                {details.rejection_reason && (
                                    <div style={{ gridColumn: "1 / -1", borderRadius: 10, background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.12)", padding: "8px 12px" }}>
                                        <p style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 600, color: "var(--t-danger)", marginBottom: 3 }}><AlertCircle size={10} />سبب الرفض</p>
                                        <p style={{ fontSize: 13, color: "#991b1b" }}>{details.rejection_reason}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Section: File Info ── */}
                        {(details.file_name || details.department_id || details.category_id || details.has_header != null) && (
                            <div style={{ marginBottom: 18 }}>
                                <SectionHeader icon={FileText} title="معلومات الملف" />
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                    {details.file_name && <InfoField icon={FileText} label="اسم الملف" value={details.file_name} />}
                                    {details.file_size && <InfoField icon={FileText} label="حجم الملف" value={details.file_size} />}
                                    {details.department_id && <InfoField icon={Building2} label="القسم" value={details.department_id} />}
                                    {details.category_id && <InfoField icon={Tag} label="التصنيف" value={details.category_id} />}
                                    {details.has_header != null && <InfoField icon={Settings2} label="عناوين أعمدة" value={details.has_header ? "نعم" : "لا"} />}
                                    {details.delimiter && <InfoField icon={Settings2} label="الفاصل" value={details.delimiter} />}
                                    {details.encoding && <InfoField icon={Settings2} label="الترميز" value={details.encoding} />}
                                    {details.question_col != null && <InfoField icon={Layers} label="عمود السؤال" value={String(details.question_col)} />}
                                    {details.answer_col != null && <InfoField icon={Layers} label="عمود الجواب" value={String(details.answer_col)} />}
                                    {details.sheet != null && <InfoField icon={Layers} label="رقم الورقة" value={String(details.sheet)} />}
                                </div>
                            </div>
                        )}

                        {/* Links & Media section hidden — download available via footer button */}

                        {/* ── Section: Content ── */}
                        {(details.text || details.doc_id) && (
                            <div style={{ marginBottom: 18 }}>
                                <SectionHeader icon={FileText} title="المحتوى" />
                                {details.doc_id && (
                                    <div style={{ marginBottom: 8 }}>
                                        <InfoField icon={Hash} label="معرّف المستند" value={details.doc_id} mono />
                                    </div>
                                )}
                                {details.text && (
                                    <div style={{ borderRadius: 10, background: "var(--t-page)", border: "1px solid var(--t-surface)", padding: 12 }}>
                                        <p style={{ fontSize: 10, fontWeight: 600, color: "var(--t-text-faint)", marginBottom: 6 }}>محتوى الطلب</p>
                                        <div dir="auto" style={{ fontSize: 13, color: "var(--t-text-secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap", maxHeight: 200, overflowY: "auto" }}>{details.text}</div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Extra (unknown) fields ── */}
                        {extraFields.length > 0 && (
                            <div style={{ marginBottom: 18 }}>
                                <SectionHeader icon={Settings2} title="حقول إضافية" />
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                    {extraFields.map(([key, val]) => {
                                        const strVal = typeof val === "object" ? JSON.stringify(val) : String(val)
                                        return <InfoField key={key} icon={Hash} label={FIELD_LABELS[key] || key} value={strVal} />
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Footer with Download Button ── */}
                {details && hasFile && (
                    <div style={{ padding: "12px 20px", borderTop: "1px solid #f0f0f0", background: "var(--t-card-hover)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ActionGuard pageBit={PAGE_BITS.PENDING_REQUESTS} actionBit={ACTION_BITS.DOWNLOAD_REQUEST_TRAIN_FILE}>
                            <button onClick={onDownloadFile} disabled={downloadingFile}
                                style={{
                                    display: "flex", alignItems: "center", gap: 8, padding: "9px 28px", borderRadius: 9,
                                    border: "none", background: "var(--t-brand-orange)", color: "#fff",
                                    fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: downloadingFile ? 0.6 : 1,
                                    transition: "all .2s", boxShadow: "0 2px 8px rgba(27,80,145,0.18)",
                                }}>
                                {downloadingFile ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
                                {downloadingFile ? "جارٍ التحميل..." : "تحميل الملف"}
                            </button>
                        </ActionGuard>
                    </div>
                )}
            </div>
        </div>
    )
})

/* ═══════════════ APPROVE MODAL ═══════════════ */
const ApproveModal = memo(function ApproveModal({ order, onClose, onConfirm, loading }: { order: PendingOrder; onClose: () => void; onConfirm: () => void; loading: boolean }) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="mx-4 w-full max-w-md overflow-hidden bg-white" onClick={(e) => e.stopPropagation()} style={{ animation: "prModalIn .18s ease-out", borderRadius: 12, border: "1px solid var(--t-border-light, var(--t-border))" }}>
                <div style={{ padding: "28px 24px 20px", textAlign: "center" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(16,185,129,0.06)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                        <CheckCircle2 size={24} style={{ color: "#059669" }} />
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--t-text, #1f2937)" }}>الموافقة على الطلب</h3>
                    <p style={{ fontSize: 13, color: "var(--t-text-secondary, var(--t-text-muted))", marginTop: 8 }}>هل أنت متأكد من الموافقة على طلب <span style={{ fontWeight: 600, color: "var(--t-text, var(--t-text-secondary))" }}>{order.username}</span>؟</p>
                    <p style={{ fontSize: 11, color: "var(--t-text-faint, var(--t-text-faint))", marginTop: 4 }}>نوع العملية: {operationLabel(order.operation)}</p>
                    <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                        <button onClick={onClose} disabled={loading} style={{ padding: "8px 20px", borderRadius: 7, border: "1px solid var(--t-border-light, var(--t-border))", background: "var(--t-card, #fff)", fontSize: 13, fontWeight: 500, color: "var(--t-text-secondary, var(--t-text-muted))", cursor: "pointer" }}>إلغاء</button>
                        <button onClick={onConfirm} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", borderRadius: 7, border: "none", background: "var(--t-brand-orange)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", opacity: loading ? 0.5 : 1 }}>
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
            <div className="mx-4 w-full max-w-md overflow-hidden bg-white" onClick={(e) => e.stopPropagation()} style={{ animation: "prModalIn .18s ease-out", borderRadius: 12, border: "1px solid var(--t-border-light, var(--t-border))" }}>
                <div style={{ padding: 24 }}>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(220,38,38,0.06)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                            <XCircle size={24} style={{ color: "var(--t-danger)" }} />
                        </div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--t-text, #1f2937)" }}>رفض الطلب</h3>
                        <p style={{ fontSize: 13, color: "var(--t-text-secondary, var(--t-text-muted))", marginTop: 8 }}>رفض طلب <span style={{ fontWeight: 600, color: "var(--t-text, var(--t-text-secondary))" }}>{order.username}</span></p>
                    </div>
                    <div style={{ marginTop: 16 }}>
                        <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500, color: "var(--t-text, var(--t-text-secondary))" }}>سبب الرفض <span style={{ color: "var(--t-danger)" }}>*</span></label>
                        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="اكتب سبب الرفض..." style={{ width: "100%", borderRadius: 8, border: "1px solid var(--t-border-light, var(--t-border))", background: "var(--t-card, #fff)", padding: 12, fontSize: 13, color: "var(--t-text, var(--t-text-secondary))", outline: "none", resize: "none" }} dir="rtl" />
                    </div>
                    <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                        <button onClick={onClose} disabled={loading} style={{ padding: "8px 20px", borderRadius: 7, border: "1px solid var(--t-border-light, var(--t-border))", background: "var(--t-card, #fff)", fontSize: 13, fontWeight: 500, color: "var(--t-text-secondary, var(--t-text-muted))", cursor: "pointer" }}>إلغاء</button>
                        <button onClick={() => onConfirm(reason)} disabled={loading || !reason.trim()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", borderRadius: 7, border: "none", background: "var(--t-danger)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", opacity: (loading || !reason.trim()) ? 0.5 : 1 }}>
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
    const opStyle = operationStyle(order.operation)
    const isPending = order.status?.toLowerCase() === "pending"
    const hasFile = !!(order.file_url || order.media_id || order.public_url)

    return (
        <tr className="group transition-colors hover:bg-gray-50/80" style={{ animation: `prRowFade 0.3s ease-out ${idx * 0.03}s both` }}>
            <td className="px-4 py-3.5"><span className="text-xs text-gray-400">{order.index}</span></td>
            <td className="px-4 py-3.5">
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-gray-500 bg-gray-50 rounded px-1.5 py-0.5"><Hash size={9} className="text-gray-400" />{truncateId(order.id)}</span>
            </td>
            <td className="px-4 py-3.5">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 20, background: opStyle.bg, border: `1px solid ${opStyle.border}`, padding: "3px 10px", fontSize: 11, fontWeight: 600, color: opStyle.color }}>
                    {opStyle.label}
                </span>
            </td>
            <td className="px-4 py-3.5"><span className="inline-flex items-center gap-1.5 text-xs text-gray-600"><User size={11} className="text-gray-400" />{order.username || "—"}</span></td>
            <td className="px-4 py-3.5">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
                    <BadgeIcon size={10} />{badge.text}
                </span>
            </td>
            <td className="px-4 py-3.5"><span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(order.created_at)}</span></td>
            <td className="px-4 py-3.5">
                <div style={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 200 }}>
                    {order.file_name ? (
                        <span className="text-xs text-gray-600 truncate" title={order.file_name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <FileText size={10} className="text-gray-400 shrink-0" />{truncate(order.file_name, 35)}
                        </span>
                    ) : order.text ? (
                        <span className="text-xs text-gray-500 truncate" title={order.text}>{truncate(order.text, 50)}</span>
                    ) : (
                        <span className="text-xs text-gray-300">—</span>
                    )}
                    {order.media_id && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, color: "#7c3aed", background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.12)", borderRadius: 4, padding: "1px 6px", fontFamily: "monospace", maxWidth: "fit-content" }} title={order.media_id}>
                            <Hash size={8} />{order.media_id.slice(0, 10)}…
                        </span>
                    )}
                </div>
            </td>
            <td className="px-4 py-3.5">
                <div className="flex items-center gap-1">
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
                            <button onClick={() => onDownload(order)} style={{ display: "flex", alignItems: "center", gap: 4, borderRadius: 7, padding: "4px 8px", border: "none", background: "var(--t-brand-orange)", color: "#fff", fontSize: 10, fontWeight: 600, cursor: "pointer" }} title="تحميل الملف">
                                <Download size={11} />تحميل
                            </button>
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
    const [downloadingFile, setDownloadingFile] = useState(false)
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

    /* ─── Download (from table row or details modal) ─── */
    const handleDownload = useCallback(async (order: PendingOrder) => {
        try {
            const blob = await downloadRequestTrainFile(order.id, tenantId)
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = order.file_name || `request_${order.id}_file`
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
            toast.success("تم بدء التحميل")
        } catch { toast.error("فشل تحميل الملف") }
    }, [tenantId])

    /* ─── Download from details modal ─── */
    const handleDownloadFromDetails = useCallback(async () => {
        if (!detailsTarget) return
        setDownloadingFile(true)
        try {
            const blob = await downloadRequestTrainFile(detailsTarget.id, tenantId)
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = detailsData?.file_name || detailsTarget.file_name || `request_${detailsTarget.id}_file`
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
            toast.success("تم بدء التحميل")
        } catch { toast.error("فشل تحميل الملف") }
        finally { setDownloadingFile(false) }
    }, [detailsTarget, detailsData, tenantId])

    /* ─── Client-side text filter ─── */
    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return orders
        const q = searchQuery.toLowerCase()
        return orders.filter((o) =>
            o.id.toLowerCase().includes(q) ||
            o.username.toLowerCase().includes(q) ||
            o.text?.toLowerCase().includes(q) ||
            o.operation.toLowerCase().includes(q) ||
            o.file_name?.toLowerCase().includes(q) ||
            o.media_id?.toLowerCase().includes(q)
        )
    }, [orders, searchQuery])

    /* ═══════════════════════ RENDER ═══════════════════════ */
    return (
        <div className="p-6 space-y-5" dir="rtl">
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--t-gradient-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ClipboardList size={20} style={{ color: "#fff" }} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--t-text, #1f2937)", margin: 0 }}>الطلبات المعلقة</h2>
                        <p style={{ fontSize: 12, color: "var(--t-text-faint, var(--t-text-faint))", marginTop: 2 }}>مراجعة الطلبات والموافقة أو الرفض</p>
                    </div>
                </div>
                {pagination && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 12, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", padding: "5px 12px", fontSize: 11, fontWeight: 600, color: "#d97706" }}>
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
                    <input type="text" placeholder="بحث سريع (معرّف، مستخدم، محتوى، ملف)..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
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
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 8, background: "var(--t-card, #fff)", border: "1px solid var(--t-border-light, var(--t-border))", padding: "8px 14px" }}>
                    <p style={{ fontSize: 12, color: "var(--t-text-secondary, var(--t-text-muted))" }}><span style={{ fontWeight: 700, color: "var(--t-brand-orange)" }}>{pagination.totalCount}</span> طلب</p>
                    <p style={{ fontSize: 11, color: "var(--t-text-faint, var(--t-text-faint))" }}>صفحة {page} من {totalPages}</p>
                </div>
            )}

            {/* Table */}
            <div style={{ position: "relative", overflow: "hidden", borderRadius: 10, border: "1px solid var(--t-border-light, var(--t-border))", background: "var(--t-card, #fff)" }}>
                <FetchingBar visible={backgroundFetching} />
                <div className="overflow-x-auto" style={{ opacity: backgroundFetching ? 0.6 : 1, transition: 'opacity 0.2s ease' }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--t-border-light, #f0f0f0)", background: "var(--t-surface, var(--t-card-hover))", textAlign: "right" }}>
                                {["#", "المعرّف", "العملية", "المستخدم", "الحالة", "التاريخ", "المحتوى / الملف", "الإجراءات"].map(h => (
                                    <th key={h} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 600, color: "var(--t-text-faint, var(--t-text-faint))", letterSpacing: "0.3px" }}>{h}</th>
                                ))}
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
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, paddingTop: 8 }}>
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                        style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 7, border: "1px solid var(--t-border-light, var(--t-border))", background: "var(--t-card, #fff)", fontSize: 12, fontWeight: 500, color: "var(--t-text-secondary, var(--t-text-muted))", cursor: "pointer", opacity: page <= 1 ? 0.4 : 1 }}>
                        <ChevronRight size={13} /> السابق
                    </button>
                    <span style={{ display: "flex", height: 30, alignItems: "center", borderRadius: 7, background: "var(--t-brand-orange)", padding: "0 12px", fontSize: 12, fontWeight: 700, color: "#fff" }}>{page}</span>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} onMouseEnter={() => page < totalPages && prefetchNextPage()} disabled={page >= totalPages}
                        style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 7, border: "1px solid var(--t-border-light, var(--t-border))", background: "var(--t-card, #fff)", fontSize: 12, fontWeight: 500, color: "var(--t-text-secondary, var(--t-text-muted))", cursor: "pointer", opacity: page >= totalPages ? 0.4 : 1 }}>
                        التالي <ChevronLeft size={13} />
                    </button>
                </div>
            )}

            {/* Modals */}
            {detailsTarget && (
                <DetailsModal
                    details={detailsData}
                    loading={loadingDetails}
                    onClose={() => { setDetailsTarget(null); setDetailsData(null); setDownloadingFile(false) }}
                    onDownloadFile={handleDownloadFromDetails}
                    downloadingFile={downloadingFile}
                />
            )}
            {approveTarget && <ApproveModal order={approveTarget} onClose={() => setApproveTarget(null)} onConfirm={handleApprove} loading={processing} />}
            {rejectTarget && <RejectModal order={rejectTarget} onClose={() => setRejectTarget(null)} onConfirm={handleReject} loading={processing} />}

            {/* Styles */}
            <style>{`
                @keyframes prModalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
                @keyframes prFadeIn{from{opacity:0}to{opacity:1}}
                @keyframes prRowFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
                @keyframes prShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
                .pr-skeleton-bone{background:linear-gradient(90deg,var(--t-surface) 25%,var(--t-border) 37%,var(--t-surface) 63%);background-size:200% 100%;animation:prShimmer 1.5s ease-in-out infinite}
                .pr-skeleton-shimmer{opacity:0;animation:prFadeIn .3s ease-out forwards}
                .pr-loading-spinner{width:36px;height:36px;border:3px solid var(--t-border);border-top-color:var(--t-info);border-radius:50%;animation:prSpin .7s linear infinite}
                @keyframes prSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
            `}</style>
        </div>
    )
}
