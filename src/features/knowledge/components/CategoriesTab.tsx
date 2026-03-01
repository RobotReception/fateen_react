import { useState, memo, useMemo } from "react"
import {
    Search, X, Plus, Pencil, Trash2, FolderTree, Loader2,
    ChevronLeft, ChevronRight, ToggleLeft, ToggleRight, ChevronDown,
    Eye, EyeOff, AlertTriangle,
} from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { useCategoriesList, useCreateCategory, useUpdateCategory, useDeleteCategory } from "../hooks/use-categories"
import { usePrefetchCategories } from "../hooks/use-prefetch"
import { FetchingBar } from "@/components/ui/FetchingBar"
import type {
    CategoryDetail, CreateCategoryPayload, UpdateCategoryPayload,
} from "../types"
import { ActionGuard } from "@/components/guards/ActionGuard"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"

/* ══════════ CONSTANTS ══════════ */
const PAGE_SIZE = 20
const EMOJI_LIST = ["📋", "📝", "📁", "📊", "📌", "⚖️", "🔧", "📣", "🎯", "💡", "🛡️", "🔬", "🏷️", "📚", "✅", "❓", "🎓", "💬"]
const COLOR_LIST = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1", "#14b8a6", "#e11d48"]

/* ══════════ SKELETON ══════════ */
const SkeletonRow = memo(function SkeletonRow({ delay = 0 }: { delay?: number }) {
    return (
        <tr className="skeleton-shimmer" style={{ animationDelay: `${delay}ms` }}>
            <td className="px-5 py-3.5"><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-lg skeleton-bone" /><div className="h-4 w-28 rounded skeleton-bone" /></div></td>
            <td className="px-5 py-3.5"><div className="h-4 w-20 rounded skeleton-bone" /></td>
            <td className="px-5 py-3.5"><div className="h-4 w-36 rounded skeleton-bone" /></td>
            <td className="px-5 py-3.5"><div className="h-5 w-12 rounded-full skeleton-bone" /></td>
            <td className="px-5 py-3.5"><div className="h-4 w-8 rounded skeleton-bone" /></td>
            <td className="px-5 py-3.5"><div className="flex gap-1"><div className="h-7 w-7 rounded-lg skeleton-bone" /><div className="h-7 w-7 rounded-lg skeleton-bone" /></div></td>
        </tr>
    )
})

/* ══════════ CREATE/EDIT MODAL ══════════ */
const CategoryFormModal = memo(function CategoryFormModal({
    mode, initial, onClose, onSave, saving,
}: {
    mode: "create" | "edit"
    initial?: CategoryDetail
    onClose: () => void
    onSave: (payload: CreateCategoryPayload | UpdateCategoryPayload) => void
    saving: boolean
}) {
    const [catId, setCatId] = useState(initial?.category_id || "")
    const [name, setName] = useState(initial?.name || "")
    const [nameAr, setNameAr] = useState(initial?.name_ar || "")
    const [description, setDescription] = useState(initial?.description || "")
    const [icon, setIcon] = useState(initial?.icon || "📋")
    const [color, setColor] = useState(initial?.color || "#3b82f6")
    const [order, setOrder] = useState(initial?.order ?? 0)
    const [isActive, setIsActive] = useState(initial?.is_active ?? true)
    const [showEmojis, setShowEmojis] = useState(false)

    const canSubmit = mode === "create"
        ? catId.trim().length > 0 && name.trim().length > 0
        : true

    const handleSubmit = () => {
        if (!canSubmit) return
        if (mode === "create") {
            onSave({
                category_id: catId.trim(),
                name: name.trim(),
                name_ar: nameAr.trim() || undefined,
                description: description.trim() || undefined,
                icon, color, is_active: isActive, order,
            } as CreateCategoryPayload)
        } else {
            onSave({
                name: name.trim() || undefined,
                name_ar: nameAr.trim() || undefined,
                description: description.trim() || undefined,
                icon, color, is_active: isActive, order,
            } as UpdateCategoryPayload)
        }
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ animation: "catModalIn .18s ease-out" }}>
                <div className="sticky top-0 z-10 bg-white px-5 py-3" style={{ borderBottom: "1px solid var(--t-border-light, #f0f0f0)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #004786, #0098d6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <FolderTree size={14} style={{ color: "#fff" }} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--t-text, #1f2937)" }}>{mode === "create" ? "إنشاء فئة جديدة" : "تعديل الفئة"}</h3>
                            {initial && <p style={{ fontSize: 10, color: "var(--t-text-faint, #9ca3af)", fontFamily: "monospace", marginTop: 1 }}>#{initial.category_id}</p>}
                        </div>
                    </div>
                </div>
                <div className="space-y-4 p-5">
                    {mode === "create" && (
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-gray-500">معرّف الفئة *</label>
                            <input value={catId} onChange={(e) => setCatId(e.target.value.replace(/\s/g, "_").toLowerCase())} placeholder="policies, guides, faq..." className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm text-gray-700 font-mono outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" dir="ltr" />
                        </div>
                    )}
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-500">الاسم (إنجليزي) {mode === "create" ? "*" : ""}</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Policies" className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" dir="ltr" />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-500">الاسم (عربي)</label>
                        <input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="سياسات" className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" dir="rtl" />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-500">الوصف</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="وصف مختصر للفئة..." className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 resize-y" dir="rtl" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-gray-500">الأيقونة</label>
                            <div className="relative">
                                <button onClick={() => setShowEmojis(!showEmojis)} className="flex w-full items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm text-gray-700 hover:bg-white">
                                    <span className="text-lg">{icon}</span><ChevronDown size={12} className="text-gray-400" />
                                </button>
                                {showEmojis && (
                                    <div className="absolute top-full left-0 right-0 z-20 mt-1 grid grid-cols-6 gap-1 rounded-xl border border-gray-200 bg-white p-2 shadow-xl" style={{ animation: "catFadeIn .15s ease-out" }}>
                                        {EMOJI_LIST.map((e) => (
                                            <button key={e} onClick={() => { setIcon(e); setShowEmojis(false) }} className={`rounded-lg p-1.5 text-lg hover:bg-gray-100 ${icon === e ? "bg-indigo-50 ring-2 ring-indigo-400" : ""}`}>{e}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-gray-500">اللون</label>
                            <div className="flex flex-wrap gap-1.5 rounded-xl border border-gray-200 bg-gray-50 py-2 px-2.5">
                                {COLOR_LIST.map((c) => (
                                    <button key={c} onClick={() => setColor(c)} className={`h-6 w-6 rounded-full transition-all ${color === c ? "ring-2 ring-offset-1 ring-gray-400 scale-110" : "hover:scale-110"}`} style={{ backgroundColor: c }} />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-gray-500">الترتيب</label>
                            <input type="number" min={0} value={order} onChange={(e) => setOrder(parseInt(e.target.value) || 0)} className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" dir="ltr" />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-gray-500">الحالة</label>
                            <button onClick={() => setIsActive(!isActive)} className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-gray-50 text-gray-500"}`}>
                                {isActive ? <ToggleRight size={18} className="text-emerald-500" /> : <ToggleLeft size={18} />}
                                {isActive ? "مفعّلة" : "معطّلة"}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="sticky bottom-0 flex items-center justify-end gap-2 bg-white px-5 py-3" style={{ borderTop: "1px solid var(--t-border-light, #f0f0f0)" }}>
                    <button onClick={onClose} disabled={saving} style={{ padding: "7px 16px", borderRadius: 7, border: "1px solid var(--t-border-light, #e5e7eb)", background: "var(--t-card, #fff)", fontSize: 13, fontWeight: 500, color: "var(--t-text-secondary, #6b7280)", cursor: "pointer" }}>إلغاء</button>
                    <button onClick={handleSubmit} disabled={saving || !canSubmit} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 18px", borderRadius: 7, border: "none", background: "#004786", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", opacity: (saving || !canSubmit) ? 0.5 : 1 }}>
                        {saving && <Loader2 size={14} className="animate-spin" />}
                        {mode === "create" ? "إنشاء الفئة" : "حفظ التعديلات"}
                    </button>
                </div>
            </div>
        </div>
    )
})

/* ══════════ DELETE MODAL ══════════ */
const DeleteCatModal = memo(function DeleteCatModal({ cat, onClose, onConfirm, deleting }: { cat: CategoryDetail; onClose: () => void; onConfirm: () => void; deleting: boolean }) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="mx-4 w-full max-w-md overflow-hidden bg-white" onClick={(e) => e.stopPropagation()} style={{ animation: "catModalIn .18s ease-out", borderRadius: 12, border: "1px solid var(--t-border-light, #e5e7eb)" }}>
                <div style={{ padding: "28px 24px 20px", textAlign: "center" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(220,38,38,0.06)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}><Trash2 size={22} style={{ color: "#dc2626" }} /></div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--t-text, #1f2937)" }}>حذف الفئة</h3>
                    <p style={{ fontSize: 13, color: "var(--t-text-secondary, #6b7280)", marginTop: 8 }}>هل أنت متأكد من حذف <span style={{ fontWeight: 700, color: "#dc2626" }}>{cat.name_ar || cat.name}</span>؟</p>
                    <div style={{ margin: "12px auto 0", display: "flex", alignItems: "flex-start", gap: 8, borderRadius: 8, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", padding: 10, textAlign: "right" }}>
                        <AlertTriangle size={14} style={{ color: "#d97706", marginTop: 2, flexShrink: 0 }} />
                        <p style={{ fontSize: 11, color: "#92400e", lineHeight: 1.6 }}>سيتم إزالة هذه الفئة من <strong>جميع الأقسام</strong> المرتبطة بها نهائياً</p>
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

/* ══════════ CATEGORY ROW ══════════ */
const CatRow = memo(function CatRow({ cat, idx, onEdit, onDelete }: { cat: CategoryDetail; idx: number; onEdit: (c: CategoryDetail) => void; onDelete: (c: CategoryDetail) => void }) {
    return (
        <tr className="group transition-colors hover:bg-gray-50/80" style={{ animation: `catRowFade 0.3s ease-out ${idx * 0.04}s both` }}>
            <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-sm" style={{ backgroundColor: cat.color || "#6366f1" }}>
                        {cat.icon || "📋"}
                    </div>
                    <div>
                        <span className="text-sm font-medium text-gray-700">{cat.name_ar || cat.name}</span>
                        {cat.name_ar && cat.name && <p className="text-[11px] text-gray-400">{cat.name}</p>}
                    </div>
                </div>
            </td>
            <td className="px-5 py-3.5"><span className="font-mono text-xs text-gray-400">#{cat.category_id}</span></td>
            <td className="px-5 py-3.5"><p className="text-xs text-gray-500 max-w-[200px] truncate">{cat.description || "—"}</p></td>
            <td className="px-5 py-3.5">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${cat.is_active ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
                    {cat.is_active ? "مفعّلة" : "معطّلة"}
                </span>
            </td>
            <td className="px-5 py-3.5"><span className="text-xs text-gray-400">{cat.order}</span></td>
            <td className="px-5 py-3.5">
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <ActionGuard pageBit={PAGE_BITS.DEPARTMENTS} actionBit={ACTION_BITS.UPDATE_CATEGORY}>
                        <button onClick={() => onEdit(cat)} className="rounded-lg p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-500" title="تعديل"><Pencil size={14} /></button>
                    </ActionGuard>
                    <ActionGuard pageBit={PAGE_BITS.DEPARTMENTS} actionBit={ACTION_BITS.DELETE_CATEGORY}>
                        <button onClick={() => onDelete(cat)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500" title="حذف"><Trash2 size={14} /></button>
                    </ActionGuard>
                </div>
            </td>
        </tr>
    )
})

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */

export function CategoriesTab() {
    const { user } = useAuthStore()
    const tenantId = user?.tenant_id || ""

    const [page, setPage] = useState(1)
    const [showInactive, setShowInactive] = useState(false)
    const [search, setSearch] = useState("")

    // Modals
    const [createModal, setCreateModal] = useState(false)
    const [editTarget, setEditTarget] = useState<CategoryDetail | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<CategoryDetail | null>(null)

    /* ─── Query: categories list ─── */
    const { data: catRes, isLoading: loading, isFetching } = useCategoriesList(tenantId, { page, page_size: PAGE_SIZE, include_inactive: showInactive })
    const backgroundFetching = isFetching && !loading
    const categories = catRes?.success ? catRes.data?.categories ?? [] : []
    const total = catRes?.success ? catRes.data?.total ?? 0 : 0
    const totalPages = Math.ceil(total / PAGE_SIZE) || 1

    /* ─── Prefetch next page ─── */
    const prefetchCats = usePrefetchCategories(tenantId)

    /* ─── Mutations ─── */
    const createMutation = useCreateCategory(tenantId)
    const updateMutation = useUpdateCategory(tenantId)
    const deleteMutation = useDeleteCategory(tenantId)

    const saving = createMutation.isPending || updateMutation.isPending
    const deleting = deleteMutation.isPending

    /* ─── Client-side search ─── */
    const filtered = useMemo(() => {
        if (!search.trim()) return categories
        const q = search.toLowerCase()
        return categories.filter((c) =>
            c.name.toLowerCase().includes(q) ||
            (c.name_ar || "").includes(q) ||
            c.category_id.toLowerCase().includes(q)
        )
    }, [categories, search])

    /* ─── Handlers ─── */
    const handleCreate = (payload: CreateCategoryPayload | UpdateCategoryPayload) => {
        createMutation.mutate(payload as CreateCategoryPayload, {
            onSuccess: (res) => { if (res.success) setCreateModal(false) },
        })
    }

    const handleUpdate = (payload: CreateCategoryPayload | UpdateCategoryPayload) => {
        if (!editTarget) return
        updateMutation.mutate({ categoryId: editTarget.category_id, payload: payload as UpdateCategoryPayload }, {
            onSuccess: (res) => { if (res.success) setEditTarget(null) },
        })
    }

    const handleDeleteConfirm = () => {
        if (!deleteTarget) return
        deleteMutation.mutate(deleteTarget.category_id, {
            onSuccess: (res) => { if (res.success) setDeleteTarget(null) },
        })
    }

    /* ═══════════════ RENDER ═══════════════ */
    return (
        <div className="space-y-5">
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #004786, #0098d6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <FolderTree size={20} style={{ color: "#fff" }} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--t-text, #1f2937)", margin: 0 }}>الفئات</h2>
                        <p style={{ fontSize: 12, color: "var(--t-text-faint, #9ca3af)", marginTop: 2 }}>إدارة تصنيفات المستندات</p>
                    </div>
                </div>
                <ActionGuard pageBit={PAGE_BITS.DEPARTMENTS} actionBit={ACTION_BITS.CREATE_CATEGORY}>
                    <button onClick={() => setCreateModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 8, border: "none", background: "#004786", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s" }}>
                        <Plus size={15} />إنشاء فئة
                    </button>
                </ActionGuard>
            </div>

            {/* Search + Toggle inactive */}
            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="بحث في الفئات..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-10 pl-4 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
                    {search && <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><X size={14} /></button>}
                </div>
                <button onClick={() => { setShowInactive(!showInactive); setPage(1) }}
                    className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors ${showInactive ? "border-amber-200 bg-amber-50 text-amber-700" : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"}`}>
                    {showInactive ? <Eye size={14} /> : <EyeOff size={14} />}
                    {showInactive ? "إظهار المعطّلة" : "إخفاء المعطّلة"}
                </button>
            </div>

            {/* Info bar */}
            {!loading && filtered.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 8, background: "var(--t-card, #fff)", border: "1px solid var(--t-border-light, #e5e7eb)", padding: "8px 14px" }}>
                    <p style={{ fontSize: 12, color: "var(--t-text-secondary, #6b7280)" }}><span style={{ fontWeight: 700, color: "#004786" }}>{total}</span> فئة</p>
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
                                {["الفئة", "المعرّف", "الوصف", "الحالة", "الترتيب", "الإجراءات"].map(h => (
                                    <th key={h} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 600, color: "var(--t-text-faint, #9ca3af)", letterSpacing: "0.3px" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && categories.length === 0
                                ? Array.from({ length: 6 }, (_, i) => <SkeletonRow key={i} delay={i * 80} />)
                                : filtered.map((cat, idx) => (
                                    <CatRow key={cat.category_id} cat={cat} idx={idx} onEdit={setEditTarget} onDelete={setDeleteTarget} />
                                ))}
                        </tbody>
                    </table>
                </div>

                {!loading && filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100"><FolderTree size={28} className="text-gray-300" /></div>
                        <p className="mt-4 text-sm font-medium text-gray-500">{search ? "لا توجد فئات مطابقة" : "لا توجد فئات"}</p>
                        <p className="mt-1 text-xs text-gray-400">{search ? "جرب كلمة بحث مختلفة" : "ابدأ بإنشاء فئة جديدة"}</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, paddingTop: 8 }}>
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 7, border: "1px solid var(--t-border-light, #e5e7eb)", background: "var(--t-card, #fff)", fontSize: 12, fontWeight: 500, color: "var(--t-text-secondary, #6b7280)", cursor: "pointer", opacity: page <= 1 ? 0.4 : 1 }}><ChevronRight size={13} /> السابق</button>
                    <span style={{ display: "flex", height: 30, alignItems: "center", borderRadius: 7, background: "#004786", padding: "0 12px", fontSize: 12, fontWeight: 700, color: "#fff" }}>{page}</span>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} onMouseEnter={() => page < totalPages && prefetchCats(page + 1, PAGE_SIZE)} disabled={page >= totalPages} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 7, border: "1px solid var(--t-border-light, #e5e7eb)", background: "var(--t-card, #fff)", fontSize: 12, fontWeight: 500, color: "var(--t-text-secondary, #6b7280)", cursor: "pointer", opacity: page >= totalPages ? 0.4 : 1 }}>التالي <ChevronLeft size={13} /></button>
                </div>
            )}

            {/* Modals */}
            {createModal && <CategoryFormModal mode="create" onClose={() => setCreateModal(false)} onSave={handleCreate} saving={saving} />}
            {editTarget && <CategoryFormModal mode="edit" initial={editTarget} onClose={() => setEditTarget(null)} onSave={handleUpdate} saving={saving} />}
            {deleteTarget && <DeleteCatModal cat={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} deleting={deleting} />}

            <style>{`
                @keyframes catModalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
                @keyframes catFadeIn{from{opacity:0}to{opacity:1}}
                @keyframes catRowFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
                @keyframes catShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
                .skeleton-bone{background:linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 37%,#f3f4f6 63%);background-size:200% 100%;animation:catShimmer 1.5s ease-in-out infinite}
                .skeleton-shimmer{opacity:0;animation:catFadeIn .3s ease-out forwards}
                .cat-loading-spinner{width:36px;height:36px;border:3px solid #e5e7eb;border-top-color:#6366f1;border-radius:50%;animation:spin360 .7s linear infinite}
                @keyframes spin360{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
            `}</style>
        </div>
    )
}
