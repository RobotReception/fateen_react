import { useState, useCallback, memo, useMemo } from "react"
import {
    Search, X, Plus, Pencil, Trash2, Building2, Loader2,
    ChevronDown, ChevronUp, Link2, Tag, ToggleLeft, ToggleRight,
    ChevronLeft, ChevronRight, Eye, EyeOff, AlertTriangle, Database,
} from "lucide-react"
import { FetchingBar } from "@/components/ui/FetchingBar"
import { useAuthStore } from "@/stores/auth-store"
import {
    useDepartmentsList, useDepartmentCategories,
    useCreateDepartment, useUpdateDepartment, useDeleteDepartment, useDeleteDepartmentData,
    useLinkCategory, useUnlinkCategory,
} from "../hooks/use-departments"
import { useCategoriesLookup, useDeleteCategoryData } from "../hooks/use-categories"
import { usePrefetchDepartments } from "../hooks/use-prefetch"
import type {
    DepartmentDetail, CategoryItem,
    CreateDepartmentPayload, UpdateDepartmentPayload,
} from "../types"

/* ══════════ CONSTANTS ══════════ */
const PAGE_SIZE = 15
const EMOJI_LIST = ["📁", "👥", "💰", "💻", "📞", "🎓", "⚖️", "🏥", "🔧", "📊", "🛒", "🏢", "📋", "🔬", "🎯", "📣", "🌍", "🤝"]
const COLOR_LIST = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1", "#14b8a6", "#e11d48"]

/* ══════════ SKELETON ROW ══════════ */
const SkeletonRow = memo(function SkeletonRow({ delay = 0 }: { delay?: number }) {
    return (
        <tr className="dept-skeleton-shimmer" style={{ animationDelay: `${delay}ms` }}>
            <td className="px-5 py-3.5"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-lg dept-skeleton-bone" /><div className="space-y-1.5"><div className="h-4 w-28 rounded dept-skeleton-bone" /><div className="h-3 w-20 rounded dept-skeleton-bone" /></div></div></td>
            <td className="px-5 py-3.5"><div className="h-4 w-16 rounded dept-skeleton-bone" /></td>
            <td className="px-5 py-3.5"><div className="h-4 w-40 rounded dept-skeleton-bone" /></td>
            <td className="px-5 py-3.5"><div className="h-5 w-12 rounded-full dept-skeleton-bone" /></td>
            <td className="px-5 py-3.5"><div className="flex gap-1"><div className="h-5 w-12 rounded-full dept-skeleton-bone" /><div className="h-5 w-12 rounded-full dept-skeleton-bone" /></div></td>
            <td className="px-5 py-3.5"><div className="h-4 w-8 rounded dept-skeleton-bone" /></td>
            <td className="px-5 py-3.5"><div className="flex gap-1"><div className="h-7 w-7 rounded-lg dept-skeleton-bone" /><div className="h-7 w-7 rounded-lg dept-skeleton-bone" /><div className="h-7 w-7 rounded-lg dept-skeleton-bone" /></div></td>
        </tr>
    )
})

/* ══════════ CREATE/EDIT MODAL ══════════ */
const DepartmentFormModal = memo(function DepartmentFormModal({
    mode, initial, onClose, onSave, saving,
}: {
    mode: "create" | "edit"
    initial?: DepartmentDetail
    onClose: () => void
    onSave: (payload: CreateDepartmentPayload | UpdateDepartmentPayload) => void
    saving: boolean
}) {
    const { user } = useAuthStore()
    const [deptId, setDeptId] = useState(initial?.department_id || "")
    const [name, setName] = useState(initial?.name || "")
    const [nameAr, setNameAr] = useState(initial?.name_ar || "")
    const [description, setDescription] = useState(initial?.description || "")
    const [icon, setIcon] = useState(initial?.icon || "📁")
    const [color, setColor] = useState(initial?.color || "#3b82f6")
    const [order, setOrder] = useState(initial?.order ?? 0)
    const [isActive, setIsActive] = useState(initial?.is_active ?? true)
    const [showEmojis, setShowEmojis] = useState(false)

    const canSubmit = mode === "create"
        ? deptId.trim().length > 0 && name.trim().length > 0
        : true

    const handleSubmit = () => {
        if (!canSubmit) return
        if (mode === "create") {
            onSave({
                department_id: deptId.trim(),
                name: name.trim(),
                name_ar: nameAr.trim() || undefined,
                description: description.trim() || undefined,
                icon, color, is_active: isActive, order,
                created_by: user?.email || "admin",
            } as CreateDepartmentPayload)
        } else {
            onSave({
                name: name.trim() || undefined,
                name_ar: nameAr.trim() || undefined,
                description: description.trim() || undefined,
                icon, color, is_active: isActive, order,
                updated_by: user?.email || "admin",
            } as UpdateDepartmentPayload)
        }
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ animation: "deptModalIn .18s ease-out" }}>
                <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-5 py-3">
                    <h3 className="text-sm font-bold text-gray-700">{mode === "create" ? "إنشاء قسم جديد" : "تعديل القسم"}</h3>
                    {initial && <p className="mt-0.5 text-xs text-gray-400 font-mono">#{initial.department_id}</p>}
                </div>
                <div className="space-y-4 p-5">
                    {mode === "create" && (
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-gray-500">معرّف القسم *</label>
                            <input value={deptId} onChange={(e) => setDeptId(e.target.value.replace(/\s/g, "_").toLowerCase())} placeholder="hr, finance, it..." className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm text-gray-700 font-mono outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100" dir="ltr" />
                        </div>
                    )}
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-500">الاسم (إنجليزي) {mode === "create" ? "*" : ""}</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Human Resources" className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm text-gray-700 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100" dir="ltr" />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-500">الاسم (عربي)</label>
                        <input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="الموارد البشرية" className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm text-gray-700 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100" dir="rtl" />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-500">الوصف</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="وصف مختصر للقسم..." className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 resize-y" dir="rtl" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-gray-500">الأيقونة</label>
                            <div className="relative">
                                <button onClick={() => setShowEmojis(!showEmojis)} className="flex w-full items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm text-gray-700 hover:bg-white">
                                    <span className="text-lg">{icon}</span><ChevronDown size={12} className="text-gray-400" />
                                </button>
                                {showEmojis && (
                                    <div className="absolute top-full left-0 right-0 z-20 mt-1 grid grid-cols-6 gap-1 rounded-xl border border-gray-200 bg-white p-2 shadow-xl" style={{ animation: "deptFadeIn .15s ease-out" }}>
                                        {EMOJI_LIST.map((e) => (
                                            <button key={e} onClick={() => { setIcon(e); setShowEmojis(false) }} className={`rounded-lg p-1.5 text-lg hover:bg-gray-100 ${icon === e ? "bg-blue-50 ring-2 ring-blue-400" : ""}`}>{e}</button>
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
                            <input type="number" min={0} value={order} onChange={(e) => setOrder(parseInt(e.target.value) || 0)} className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm text-gray-700 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100" dir="ltr" />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-gray-500">الحالة</label>
                            <button onClick={() => setIsActive(!isActive)} className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-gray-50 text-gray-500"}`}>
                                {isActive ? <ToggleRight size={18} className="text-emerald-500" /> : <ToggleLeft size={18} />}
                                {isActive ? "مفعّل" : "معطّل"}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-gray-100 bg-white px-5 py-3">
                    <button onClick={onClose} disabled={saving} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">إلغاء</button>
                    <button onClick={handleSubmit} disabled={saving || !canSubmit} className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed">
                        {saving && <Loader2 size={14} className="animate-spin" />}
                        {mode === "create" ? "إنشاء القسم" : "حفظ التعديلات"}
                    </button>
                </div>
            </div>
        </div>
    )
})

/* ══════════ DELETE MODAL ══════════ */
const DeleteDeptModal = memo(function DeleteDeptModal({ dept, onClose, onConfirm, deleting }: { dept: DepartmentDetail; onClose: () => void; onConfirm: () => void; deleting: boolean }) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="mx-4 w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ animation: "deptModalIn .18s ease-out" }}>
                <div className="p-6 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50"><Trash2 size={24} className="text-red-500" /></div>
                    <h3 className="text-lg font-bold text-gray-800">حذف القسم</h3>
                    <p className="mt-2 text-sm text-gray-500">هل أنت متأكد من حذف <span className="font-bold text-red-600">{dept.name_ar || dept.name}</span>؟</p>
                    <div className="mx-auto mt-3 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-right">
                        <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-700 leading-relaxed">سيتم حذف القسم نهائياً مع جميع ربطات الفئات — لا يمكن التراجع</p>
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

/* ══════════ DELETE DATA CONFIRM MODAL ══════════ */
const DeleteDataConfirmModal = memo(function DeleteDataConfirmModal({
    title, subtitle, warning, onClose, onConfirm, deleting,
}: {
    title: string; subtitle: string; warning: string
    onClose: () => void; onConfirm: () => void; deleting: boolean
}) {
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="mx-4 w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ animation: "deptModalIn .18s ease-out" }}>
                <div className="p-6 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50"><Database size={24} className="text-red-500" /></div>
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
                        حذف البيانات
                    </button>
                </div>
            </div>
        </div>
    )
})

/* ══════════ CATEGORY LINK PANEL (inline in expanded row) ══════════ */
const CategoryLinkPanel = memo(function CategoryLinkPanel({
    deptId, tenantId,
}: {
    deptId: string; tenantId: string
}) {
    const { data: catRes, isLoading: loading } = useCategoriesLookup(tenantId)
    const { data: linkedRes } = useDepartmentCategories(tenantId, deptId)
    const linkMutation = useLinkCategory(tenantId)
    const unlinkMutation = useUnlinkCategory(tenantId)
    const deleteCatDataMutation = useDeleteCategoryData(tenantId)

    const [deleteCatTarget, setDeleteCatTarget] = useState<CategoryItem | null>(null)

    const allCats = catRes?.success ? catRes.data?.categories ?? [] : []
    const linkedCats = linkedRes?.success ? linkedRes.data?.categories ?? [] : []
    const linkedIds = useMemo(() => new Set(linkedCats.map((c) => c.category_id)), [linkedCats])
    const unlinked = allCats.filter((c) => !linkedIds.has(c.category_id))

    const handleLink = (catId: string) => {
        linkMutation.mutate({ departmentId: deptId, payload: { category_id: catId } })
    }

    const handleUnlink = (catId: string) => {
        unlinkMutation.mutate({ departmentId: deptId, categoryId: catId })
    }

    const handleDeleteCatData = () => {
        if (!deleteCatTarget) return
        deleteCatDataMutation.mutate({ category_id: deleteCatTarget.category_id, username: null }, {
            onSuccess: (res) => { if (res.success) setDeleteCatTarget(null) },
        })
    }

    return (
        <div className="space-y-3 px-1 py-3" style={{ animation: "deptFadeIn .2s ease-out" }}>
            {/* Linked categories */}
            <div>
                <p className="mb-2 text-xs font-semibold text-gray-500">الفئات المرتبطة ({linkedCats.length})</p>
                {linkedCats.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">لا توجد فئات مرتبطة بهذا القسم</p>
                ) : (
                    <div className="flex flex-wrap gap-1.5">
                        {linkedCats.map((c) => (
                            <span key={c.category_id} className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-medium text-blue-700">
                                <span>{c.icon || "📋"}</span>
                                {c.name_ar || c.name}
                                <button onClick={() => setDeleteCatTarget(c)} disabled={deleteCatDataMutation.isPending} className="mr-0.5 rounded-full p-0.5 text-blue-400 hover:bg-red-100 hover:text-red-500 disabled:opacity-50" title="حذف بيانات الفئة">
                                    <Database size={10} />
                                </button>
                                <button onClick={() => handleUnlink(c.category_id)} disabled={unlinkMutation.isPending} className="mr-0.5 rounded-full p-0.5 text-blue-400 hover:bg-blue-100 hover:text-red-500 disabled:opacity-50" title="فك الربط">
                                    {unlinkMutation.isPending ? <Loader2 size={10} className="animate-spin" /> : <X size={10} />}
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>
            {/* Available to link */}
            {loading ? (
                <div className="flex items-center gap-2 text-xs text-gray-400"><Loader2 size={12} className="animate-spin" />جاري تحميل الفئات...</div>
            ) : unlinked.length > 0 && (
                <div>
                    <p className="mb-2 text-xs font-semibold text-gray-500">فئات متاحة للربط</p>
                    <div className="flex flex-wrap gap-1.5">
                        {unlinked.map((c) => (
                            <button key={c.category_id} onClick={() => handleLink(c.category_id)} disabled={linkMutation.isPending}
                                className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-500 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-colors disabled:opacity-50">
                                {linkMutation.isPending ? <Loader2 size={10} className="animate-spin" /> : <Link2 size={10} />}
                                {c.icon || "📋"} {c.name_ar || c.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            {/* Delete category data confirm */}
            {deleteCatTarget && (
                <DeleteDataConfirmModal
                    title="حذف بيانات الفئة"
                    subtitle={`هل أنت متأكد من حذف جميع بيانات الفئة "${deleteCatTarget.name_ar || deleteCatTarget.name}"؟`}
                    warning="سيتم حذف جميع المستندات والسجلات المرتبطة بهذه الفئة نهائياً — لا يمكن التراجع"
                    onClose={() => setDeleteCatTarget(null)}
                    onConfirm={handleDeleteCatData}
                    deleting={deleteCatDataMutation.isPending}
                />
            )}
        </div>
    )
})

/* ══════════ DEPARTMENT ROW ══════════ */
const DeptRow = memo(function DeptRow({
    dept, idx, isExpanded, tenantId,
    onToggleExpand, onEdit, onDelete, onDeleteData,
}: {
    dept: DepartmentDetail; idx: number; isExpanded: boolean; tenantId: string
    onToggleExpand: (id: string) => void; onEdit: (d: DepartmentDetail) => void; onDelete: (d: DepartmentDetail) => void; onDeleteData: (d: DepartmentDetail) => void
}) {
    const { data: catRes } = useDepartmentCategories(tenantId, dept.department_id)
    const linkedCats = catRes?.success ? catRes.data?.categories ?? [] : []
    const bgColor = dept.color || "#3b82f6"
    return (
        <>
            <tr className={`group transition-colors hover:bg-gray-50/80 ${isExpanded ? "bg-blue-50/40" : ""}`}
                style={{ animation: `deptRowFade 0.3s ease-out ${idx * 0.04}s both` }}>
                {/* Icon + Name */}
                <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg text-white text-base shadow-sm shrink-0" style={{ backgroundColor: bgColor }}>
                            {dept.icon || "📁"}
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-700">{dept.name_ar || dept.name}</span>
                            {dept.name_ar && dept.name && <p className="text-[11px] text-gray-400">{dept.name}</p>}
                        </div>
                    </div>
                </td>
                {/* ID */}
                <td className="px-5 py-3.5"><span className="font-mono text-xs text-gray-400">#{dept.department_id}</span></td>
                {/* Description */}
                <td className="px-5 py-3.5"><p className="text-xs text-gray-500 max-w-[220px] truncate">{dept.description || "—"}</p></td>
                {/* Status */}
                <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${dept.is_active ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
                        {dept.is_active ? "مفعّل" : "معطّل"}
                    </span>
                </td>
                {/* Categories */}
                <td className="px-5 py-3.5">
                    <button onClick={() => onToggleExpand(dept.department_id)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${isExpanded ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600"}`}>
                        <Tag size={11} />
                        {linkedCats.length} فئة
                        {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>
                </td>
                {/* Order */}
                <td className="px-5 py-3.5"><span className="text-xs text-gray-400">{dept.order}</span></td>
                {/* Actions */}
                <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button onClick={() => onEdit(dept)} className="rounded-lg p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-500" title="تعديل"><Pencil size={14} /></button>
                        <button onClick={() => onDeleteData(dept)} className="rounded-lg p-1.5 text-gray-400 hover:bg-orange-50 hover:text-orange-500" title="حذف بيانات القسم"><Database size={14} /></button>
                        <button onClick={() => onDelete(dept)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500" title="حذف"><Trash2 size={14} /></button>
                    </div>
                </td>
            </tr>
            {/* Expanded row for categories */}
            {isExpanded && (
                <tr style={{ animation: "deptFadeIn .2s ease-out" }}>
                    <td colSpan={7} className="bg-blue-50/30 border-b border-blue-100 px-5 py-0">
                        <CategoryLinkPanel
                            deptId={dept.department_id}
                            tenantId={tenantId}
                        />
                    </td>
                </tr>
            )}
        </>
    )
})

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */

export function DepartmentsTab() {
    const { user } = useAuthStore()
    const tenantId = user?.tenant_id || ""

    const [page, setPage] = useState(1)
    const [showInactive, setShowInactive] = useState(false)
    const [search, setSearch] = useState("")
    const [expandedDept, setExpandedDept] = useState<string | null>(null)

    // Modals
    const [createModal, setCreateModal] = useState(false)
    const [editTarget, setEditTarget] = useState<DepartmentDetail | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<DepartmentDetail | null>(null)
    const [deleteDataTarget, setDeleteDataTarget] = useState<DepartmentDetail | null>(null)

    /* ─── Query: departments list ─── */
    const { data: deptRes, isLoading: loading, isFetching } = useDepartmentsList(tenantId, { page, page_size: PAGE_SIZE, include_inactive: showInactive })
    const backgroundFetching = isFetching && !loading
    const departments = deptRes?.success ? deptRes.data?.departments ?? [] : []
    const total = deptRes?.success ? deptRes.data?.total ?? 0 : 0
    const totalPages = Math.ceil(total / PAGE_SIZE) || 1

    /* ─── Prefetch next page ─── */
    const prefetchDepts = usePrefetchDepartments(tenantId)

    /* ─── Mutations ─── */
    const createMutation = useCreateDepartment(tenantId)
    const updateMutation = useUpdateDepartment(tenantId)
    const deleteMutation = useDeleteDepartment(tenantId)
    const deleteDataMutation = useDeleteDepartmentData(tenantId)

    const saving = createMutation.isPending || updateMutation.isPending
    const deleting = deleteMutation.isPending
    const deletingData = deleteDataMutation.isPending

    const toggleExpand = useCallback((id: string) => {
        setExpandedDept((prev) => prev === id ? null : id)
    }, [])

    /* ─── Client-side search ─── */
    const filtered = useMemo(() => {
        if (!search.trim()) return departments
        const q = search.toLowerCase()
        return departments.filter((d) =>
            d.name.toLowerCase().includes(q) ||
            (d.name_ar || "").includes(q) ||
            d.department_id.toLowerCase().includes(q)
        )
    }, [departments, search])

    /* ─── Handlers ─── */
    const handleCreate = (payload: CreateDepartmentPayload | UpdateDepartmentPayload) => {
        createMutation.mutate(payload as CreateDepartmentPayload, {
            onSuccess: (res) => { if (res.success) setCreateModal(false) },
        })
    }

    const handleUpdate = (payload: CreateDepartmentPayload | UpdateDepartmentPayload) => {
        if (!editTarget) return
        updateMutation.mutate({ departmentId: editTarget.department_id, payload: payload as UpdateDepartmentPayload }, {
            onSuccess: (res) => { if (res.success) setEditTarget(null) },
        })
    }

    const handleDeleteConfirm = () => {
        if (!deleteTarget) return
        deleteMutation.mutate(deleteTarget.department_id, {
            onSuccess: (res) => { if (res.success) setDeleteTarget(null) },
        })
    }

    const handleDeleteDataConfirm = () => {
        if (!deleteDataTarget) return
        deleteDataMutation.mutate({ department_id: deleteDataTarget.department_id, username: null }, {
            onSuccess: (res) => { if (res.success) setDeleteDataTarget(null) },
        })
    }

    /* ═══════════════ RENDER ═══════════════ */
    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">الأقسام</h2>
                    <p className="mt-1 text-sm text-gray-400">إدارة أقسام المؤسسة وربط الفئات بها</p>
                </div>
                <button onClick={() => setCreateModal(true)} className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white  transition-transform hover:scale-[1.02] active:scale-[0.98]">
                    <Plus size={15} />إنشاء قسم
                </button>
            </div>

            {/* Search + Toggle inactive */}
            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="بحث في الأقسام..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-10 pl-4 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
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
                    <p className="text-xs text-gray-500"><span className="font-bold text-gray-700">{total}</span> قسم</p>
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
                                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">القسم</th>
                                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">المعرّف</th>
                                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">الوصف</th>
                                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">الحالة</th>
                                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">الفئات</th>
                                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">الترتيب</th>
                                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && departments.length === 0
                                ? Array.from({ length: 6 }, (_, i) => <SkeletonRow key={i} delay={i * 80} />)
                                : filtered.map((dept, idx) => (
                                    <DeptRow
                                        key={dept.department_id}
                                        dept={dept}
                                        idx={idx}
                                        isExpanded={expandedDept === dept.department_id}
                                        tenantId={tenantId}
                                        onToggleExpand={toggleExpand}
                                        onEdit={setEditTarget}
                                        onDelete={setDeleteTarget}
                                        onDeleteData={setDeleteDataTarget}
                                    />
                                ))}
                        </tbody>
                    </table>
                </div>

                {!loading && filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100"><Building2 size={28} className="text-gray-300" /></div>
                        <p className="mt-4 text-sm font-medium text-gray-500">{search ? "لا توجد أقسام مطابقة" : "لا توجد أقسام"}</p>
                        <p className="mt-1 text-xs text-gray-400">{search ? "جرب كلمة بحث مختلفة" : "ابدأ بإنشاء قسم جديد"}</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight size={14} /> السابق</button>
                    <span className="flex h-8 items-center rounded-lg bg-gray-900 px-3 text-xs font-bold text-white ">{page}</span>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} onMouseEnter={() => page < totalPages && prefetchDepts(page + 1, PAGE_SIZE)} disabled={page >= totalPages} className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">التالي <ChevronLeft size={14} /></button>
                </div>
            )}

            {/* Modals */}
            {createModal && <DepartmentFormModal mode="create" onClose={() => setCreateModal(false)} onSave={handleCreate} saving={saving} />}
            {editTarget && <DepartmentFormModal mode="edit" initial={editTarget} onClose={() => setEditTarget(null)} onSave={handleUpdate} saving={saving} />}
            {deleteTarget && <DeleteDeptModal dept={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} deleting={deleting} />}
            {deleteDataTarget && (
                <DeleteDataConfirmModal
                    title="حذف بيانات القسم"
                    subtitle={`هل أنت متأكد من حذف جميع بيانات القسم "${deleteDataTarget.name_ar || deleteDataTarget.name}"؟`}
                    warning="سيتم حذف جميع المستندات والسجلات المرتبطة بهذا القسم نهائياً — لا يمكن التراجع"
                    onClose={() => setDeleteDataTarget(null)}
                    onConfirm={handleDeleteDataConfirm}
                    deleting={deletingData}
                />
            )}

            <style>{`
                @keyframes deptModalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
                @keyframes deptFadeIn{from{opacity:0}to{opacity:1}}
                @keyframes deptRowFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
                @keyframes deptShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
                .dept-skeleton-bone{background:linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 37%,#f3f4f6 63%);background-size:200% 100%;animation:deptShimmer 1.5s ease-in-out infinite}
                .dept-skeleton-shimmer{opacity:0;animation:deptFadeIn .3s ease-out forwards}
                .dept-loading-spinner{width:36px;height:36px;border:3px solid #e5e7eb;border-top-color:#3b82f6;border-radius:50%;animation:deptSpin .7s linear infinite}
                @keyframes deptSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
            `}</style>
        </div>
    )
}
