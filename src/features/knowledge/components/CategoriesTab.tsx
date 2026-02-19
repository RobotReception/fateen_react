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
                <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-5 py-3">
                    <h3 className="text-sm font-bold text-gray-700">{mode === "create" ? "إنشاء فئة جديدة" : "تعديل الفئة"}</h3>
                    {initial && <p className="mt-0.5 text-xs text-gray-400 font-mono">#{initial.category_id}</p>}
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
                <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-gray-100 bg-white px-5 py-3">
                    <button onClick={onClose} disabled={saving} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">إلغاء</button>
                    <button onClick={handleSubmit} disabled={saving || !canSubmit} className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white  disabled:opacity-50 disabled:cursor-not-allowed">
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
            <div className="mx-4 w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ animation: "catModalIn .18s ease-out" }}>
                <div className="p-6 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50"><Trash2 size={24} className="text-red-500" /></div>
                    <h3 className="text-lg font-bold text-gray-800">حذف الفئة</h3>
                    <p className="mt-2 text-sm text-gray-500">هل أنت متأكد من حذف <span className="font-bold text-red-600">{cat.name_ar || cat.name}</span>؟</p>
                    <div className="mx-auto mt-3 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-right">
                        <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-700 leading-relaxed">سيتم إزالة هذه الفئة من <strong>جميع الأقسام</strong> المرتبطة بها نهائياً</p>
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
                    <button onClick={() => onEdit(cat)} className="rounded-lg p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-500" title="تعديل"><Pencil size={14} /></button>
                    <button onClick={() => onDelete(cat)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500" title="حذف"><Trash2 size={14} /></button>
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">الفئات</h2>
                    <p className="mt-1 text-sm text-gray-400">إدارة تصنيفات المستندات</p>
                </div>
                <button onClick={() => setCreateModal(true)} className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white  transition-transform hover:scale-[1.02] active:scale-[0.98]">
                    <Plus size={15} />إنشاء فئة
                </button>
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
                <div className="flex items-center justify-between rounded-xl bg-white border border-gray-100 px-4 py-2.5 shadow-sm">
                    <p className="text-xs text-gray-500"><span className="font-bold text-gray-700">{total}</span> فئة</p>
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
                                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">الفئة</th>
                                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">المعرّف</th>
                                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">الوصف</th>
                                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">الحالة</th>
                                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">الترتيب</th>
                                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">الإجراءات</th>
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
                <div className="flex items-center justify-center gap-2 pt-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight size={14} /> السابق</button>
                    <span className="flex h-8 items-center rounded-lg bg-gray-900 px-3 text-xs font-bold text-white ">{page}</span>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} onMouseEnter={() => page < totalPages && prefetchCats(page + 1, PAGE_SIZE)} disabled={page >= totalPages} className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">التالي <ChevronLeft size={14} /></button>
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
