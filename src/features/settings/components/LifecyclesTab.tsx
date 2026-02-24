import { useState } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { useLifecycles, useCreateLifecycle, useUpdateLifecycle, useDeleteLifecycle } from "../hooks/use-teams-tags"
import type { Lifecycle } from "../types/teams-tags"
import type { DeleteLifecycleParams } from "../types/teams-tags"
import {
    Plus, Trash2, Pencil, RefreshCw, X, Loader2, Check,
    ToggleLeft, ToggleRight, GripVertical, Globe,
} from "lucide-react"
import { ActionGuard } from "@/components/guards/ActionGuard"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"

/* ═══════════════════════════════════════
   CSS
═══════════════════════════════════════ */
const CSS = `
.lc-card { border-radius:12px; border:1px solid var(--t-border); background:var(--t-card); padding:14px 16px; transition:box-shadow .15s,border-color .15s; }
.lc-card:hover { box-shadow:0 2px 12px rgba(0,0,0,.07); }
.lc-field { width:100%; padding:9px 12px; border-radius:9px; border:1.5px solid var(--t-border); background:var(--t-surface); font-size:13px; color:var(--t-text); outline:none; transition:border-color .15s; box-sizing:border-box; }
.lc-field:focus { border-color:var(--t-accent); }
.lc-label { font-size:10px; font-weight:800; letter-spacing:.07em; text-transform:uppercase; color:var(--t-text-faint); display:block; margin-bottom:5px; }
.lc-btn-primary { display:inline-flex; align-items:center; gap:6px; padding:9px 18px; border-radius:9px; border:none; background:var(--t-accent); color:var(--t-text-on-accent); font-size:13px; font-weight:700; cursor:pointer; transition:opacity .15s; }
.lc-btn-primary:hover:not(:disabled) { opacity:.88; }
.lc-btn-ghost { display:inline-flex; align-items:center; gap:6px; padding:7px 12px; border-radius:9px; border:1.5px solid var(--t-border); background:transparent; color:var(--t-text); font-size:12px; font-weight:600; cursor:pointer; }
.lc-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.lc-grid-3 { display:grid; grid-template-columns:auto 1fr 1fr; gap:10px; align-items:end; }
.lc-badge { display:inline-flex; align-items:center; gap:4px; padding:2px 9px; border-radius:20px; font-size:10px; font-weight:700; }
@keyframes lcIn{from{opacity:0;transform:scale(.97) translateY(6px)}to{opacity:1;transform:scale(1) translateY(0)}}
`

/* ─── Modal ─── */
function Modal({ title, width = 520, onClose, children }: {
    title: string; width?: number; onClose: () => void; children: React.ReactNode
}) {
    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div onClick={e => e.stopPropagation()} dir="rtl" style={{ borderRadius: 16, background: "var(--t-card)", border: "1px solid var(--t-border)", width: "100%", maxWidth: width, margin: 16, animation: "lcIn .15s ease-out", maxHeight: "90vh", overflowY: "auto" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--t-border-light)", position: "sticky", top: 0, background: "var(--t-card)", zIndex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "var(--t-text)" }}>{title}</div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t-text-faint)", display: "flex" }}><X size={16} /></button>
                </div>
                <div style={{ padding: "18px 20px" }}>{children}</div>
            </div>
        </div>
    )
}

/* ─── Section divider ─── */
function FormSection({ label, icon }: { label: string; icon?: React.ReactNode }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0 2px" }}>
            {icon}
            <span style={{ fontSize: 10, fontWeight: 800, color: "var(--t-text-faint)", textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</span>
            <div style={{ flex: 1, height: 1, background: "var(--t-border-light)" }} />
        </div>
    )
}

/* ─── Lifecycle Create / Edit Form ─── */
function LifecycleForm({ lc, tenantId, onClose }: { lc?: Lifecycle; tenantId: string; onClose: () => void }) {
    const createMut = useCreateLifecycle(tenantId)
    const updateMut = useUpdateLifecycle(tenantId)
    const isEdit = !!lc

    const [name, setName] = useState(lc?.name ?? "")
    const [nameAr, setNameAr] = useState(lc?.name_ar ?? "")
    const [nameEn, setNameEn] = useState(lc?.name_en ?? "")
    const [desc, setDesc] = useState(lc?.description ?? "")
    const [descAr, setDescAr] = useState(lc?.description_ar ?? "")
    const [descEn, setDescEn] = useState(lc?.description_en ?? "")
    const [color, setColor] = useState(lc?.color ?? "#53b1df")
    const [icon, setIcon] = useState(lc?.icon ?? "")
    const [order, setOrder] = useState(String(lc?.order ?? 1))
    const [isActive, setIsActive] = useState(lc?.is_active ?? true)

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        const base = {
            name,
            name_ar: nameAr || undefined,
            name_en: nameEn || undefined,
            description: desc || undefined,
            description_ar: descAr || undefined,
            description_en: descEn || undefined,
            icon: icon || undefined,
            color,
            order: parseInt(order) || 1,
        }
        if (isEdit) {
            updateMut.mutate(
                { code: lc.code, payload: { ...base, is_active: isActive } },
                { onSuccess: r => { if (r.success) onClose() } }
            )
        } else {
            createMut.mutate(base, { onSuccess: r => { if (r.success) onClose() } })
        }
    }
    const isPending = createMut.isPending || updateMut.isPending

    return (
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Basics */}
            <FormSection label="المعلومات الأساسية" />
            <div>
                <label className="lc-label">الاسم الرئيسي *</label>
                <input className="lc-field" value={name} onChange={e => setName(e.target.value)} placeholder="عميل جديد" required />
            </div>
            {/* Bilingual names */}
            <div className="lc-grid-2">
                <div>
                    <label className="lc-label">الاسم بالعربية</label>
                    <input className="lc-field" dir="rtl" value={nameAr} onChange={e => setNameAr(e.target.value)} placeholder="عميل جديد" />
                </div>
                <div>
                    <label className="lc-label">الاسم بالإنجليزية</label>
                    <input className="lc-field" dir="ltr" value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="New Lead" />
                </div>
            </div>

            {/* Description */}
            <FormSection label="الوصف" icon={<Globe size={11} style={{ color: "var(--t-text-faint)" }} />} />
            <div>
                <label className="lc-label">الوصف الرئيسي</label>
                <textarea className="lc-field" rows={2} value={desc} onChange={e => setDesc(e.target.value)} placeholder="وصف المرحلة..." style={{ resize: "vertical" }} />
            </div>
            <div className="lc-grid-2">
                <div>
                    <label className="lc-label">الوصف بالعربية</label>
                    <textarea className="lc-field" rows={2} dir="rtl" value={descAr} onChange={e => setDescAr(e.target.value)} placeholder="وصف بالعربية..." style={{ resize: "vertical" }} />
                </div>
                <div>
                    <label className="lc-label">الوصف بالإنجليزية</label>
                    <textarea className="lc-field" rows={2} dir="ltr" value={descEn} onChange={e => setDescEn(e.target.value)} placeholder="Description in English..." style={{ resize: "vertical" }} />
                </div>
            </div>

            {/* Style + order */}
            <FormSection label="التصميم والترتيب" />
            <div className="lc-grid-3">
                <div>
                    <label className="lc-label">اللون</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input type="color" value={color} onChange={e => setColor(e.target.value)}
                            style={{ width: 48, height: 38, borderRadius: 9, border: "1.5px solid var(--t-border)", padding: 3, cursor: "pointer", background: "var(--t-surface)" }} />
                        <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--t-text-faint)" }}>{color}</span>
                    </div>
                </div>
                <div>
                    <label className="lc-label">الأيقونة (إيموجي)</label>
                    <input className="lc-field" value={icon} onChange={e => setIcon(e.target.value)} placeholder="🌱" style={{ fontSize: 18, textAlign: "center" }} />
                </div>
                <div>
                    <label className="lc-label">الترتيب</label>
                    <input className="lc-field" type="number" min={1} value={order} onChange={e => setOrder(e.target.value)} placeholder="1" dir="ltr" />
                </div>
            </div>

            {/* Active toggle (edit only) */}
            {isEdit && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 9, background: "var(--t-surface)", border: "1px solid var(--t-border-light)" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--t-text)" }}>المرحلة نشطة</span>
                    <button type="button" onClick={() => setIsActive(!isActive)} style={{ background: "none", border: "none", cursor: "pointer", color: isActive ? "var(--t-success)" : "var(--t-text-faint)", display: "flex" }}>
                        {isActive ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                    </button>
                </div>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
                <button type="button" className="lc-btn-ghost" onClick={onClose}>إلغاء</button>
                <button type="submit" className="lc-btn-primary" disabled={isPending}>
                    {isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    {isEdit ? "حفظ التغييرات" : "إنشاء المرحلة"}
                </button>
            </div>
        </form>
    )
}

/* ─── Delete Modal ─── */
function DeleteLifecycleModal({ lc, lifecycles, onClose, tenantId }: {
    lc: Lifecycle; lifecycles: Lifecycle[]; onClose: () => void; tenantId: string
}) {
    const deleteMut = useDeleteLifecycle(tenantId)
    const [reassignTo, setReassignTo] = useState("")
    const others = lifecycles.filter(l => l.code !== lc.code)

    return (
        <Modal title="حذف دورة الحياة" width={440} onClose={onClose}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* warning */}
                <div style={{ display: "flex", gap: 12, padding: "12px 14px", borderRadius: 10, background: "rgba(239,68,68,.07)", border: "1px solid rgba(239,68,68,.2)" }}>
                    <div style={{ fontSize: 22, lineHeight: 1 }}>{lc.icon || "🔴"}</div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text)" }}>حذف «{lc.name}»</div>
                        <div style={{ fontSize: 12, color: "var(--t-text-faint)", marginTop: 2 }}>
                            يمكن تحويل العملاء المرتبطين بهذه المرحلة إلى مرحلة أخرى قبل الحذف.
                        </div>
                    </div>
                </div>

                {others.length > 0 && (
                    <div>
                        <label className="lc-label">تحويل العملاء إلى (اختياري)</label>
                        <select className="lc-field" value={reassignTo} onChange={e => setReassignTo(e.target.value)}>
                            <option value="">لا تُحوِّل (إزالة المرحلة)</option>
                            {others.map(l => (
                                <option key={l.code} value={l.code}>
                                    {l.icon ? `${l.icon} ` : ""}{l.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button className="lc-btn-ghost" onClick={onClose}>إلغاء</button>
                    <button
                        disabled={deleteMut.isPending}
                        onClick={() => {
                            const params: DeleteLifecycleParams = { reassign_to: reassignTo || undefined }
                            deleteMut.mutate({ code: lc.code, params }, { onSuccess: r => { if (r.success) onClose() } })
                        }}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 9, border: "none", background: "var(--t-danger)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                        {deleteMut.isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} حذف
                    </button>
                </div>
            </div>
        </Modal>
    )
}

/* ═══════════════════════════════════════
   Main Component
═══════════════════════════════════════ */
export function LifecyclesTab() {
    const { user } = useAuthStore()
    const tid = user?.tenant_id ?? ""
    const { data: lifecycles = [], isLoading } = useLifecycles(tid)
    const updateMut = useUpdateLifecycle(tid)

    const [showForm, setShowForm] = useState(false)
    const [editLc, setEditLc] = useState<Lifecycle | undefined>()
    const [deleteLc, setDeleteLc] = useState<Lifecycle | null>(null)

    const sorted = [...lifecycles].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

    const toggleActive = (lc: Lifecycle) =>
        updateMut.mutate({ code: lc.code, payload: { is_active: !lc.is_active } })

    return (
        <div style={{ direction: "rtl" }}>
            <style>{CSS}</style>

            {/* ── Toolbar ── */}
            <div style={{ display: "flex", gap: 10, marginBottom: 18, alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <RefreshCw size={14} style={{ color: "var(--t-accent)" }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text)" }}>
                        {sorted.length} مرحلة
                    </span>
                    {sorted.filter(l => l.is_active !== false).length < sorted.length && (
                        <span className="lc-badge" style={{ color: "#f59e0b", background: "#f59e0b18" }}>
                            {sorted.filter(l => l.is_active === false).length} موقوفة
                        </span>
                    )}
                </div>
                <ActionGuard pageBit={PAGE_BITS.LIFECYCLES} actionBit={ACTION_BITS.CREATE_LIFECYCLE}>
                    <button className="lc-btn-primary" onClick={() => { setEditLc(undefined); setShowForm(true) }}>
                        <Plus size={14} /> مرحلة جديدة
                    </button>
                </ActionGuard>
            </div>

            {/* ── List ── */}
            {isLoading ? (
                <div style={{ textAlign: "center", padding: "48px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--t-text-faint)" }}>
                    <Loader2 size={18} className="animate-spin" /> جاري تحميل المراحل...
                </div>
            ) : sorted.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                    <RefreshCw size={36} style={{ margin: "0 auto 12px", display: "block", opacity: .2 }} />
                    <div style={{ fontSize: 14, color: "var(--t-text-faint)", fontWeight: 600, marginBottom: 16 }}>لا توجد مراحل بعد</div>
                    <button className="lc-btn-primary" onClick={() => { setEditLc(undefined); setShowForm(true) }}>
                        <Plus size={14} /> أضف أول مرحلة
                    </button>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {sorted.map(lc => (
                        <div
                            key={lc.id ?? lc.code}
                            className="lc-card"
                            style={{
                                display: "flex", alignItems: "center", gap: 12,
                                borderRight: `4px solid ${lc.color || "#53b1df"}`,
                                opacity: lc.is_active === false ? 0.55 : 1,
                            }}
                        >
                            {/* Drag handle (visual only) */}
                            <GripVertical size={14} style={{ color: "var(--t-text-faint)", flexShrink: 0, opacity: .4 }} />

                            {/* Order badge */}
                            <div style={{
                                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                                background: `${lc.color || "#53b1df"}22`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: lc.icon ? 16 : 11, fontWeight: 800,
                                color: lc.color || "#53b1df",
                            }}>
                                {lc.icon || lc.order || "—"}
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text)" }}>{lc.name}</span>
                                    <span style={{ fontSize: 9, fontFamily: "monospace", color: "var(--t-text-faint)", background: "var(--t-surface)", padding: "1px 7px", borderRadius: 5 }}>
                                        {lc.code}
                                    </span>
                                    {/* Status badge */}
                                    <span className="lc-badge" style={{
                                        color: lc.is_active !== false ? "#10b981" : "var(--t-text-faint)",
                                        background: lc.is_active !== false ? "rgba(16,185,129,.12)" : "rgba(107,114,128,.1)",
                                    }}>
                                        {lc.is_active !== false ? "نشطة" : "موقوفة"}
                                    </span>
                                </div>
                                {/* Bilingual names */}
                                {(lc.name_ar || lc.name_en) && (
                                    <div style={{ fontSize: 10, color: "var(--t-text-faint)", marginTop: 2 }}>
                                        {[lc.name_ar, lc.name_en].filter(Boolean).join(" · ")}
                                    </div>
                                )}
                                {/* Description */}
                                {lc.description && (
                                    <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginTop: 3, lineHeight: 1.4 }}>
                                        {lc.description}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
                                {/* Toggle active */}
                                <ActionGuard pageBit={PAGE_BITS.LIFECYCLES} actionBit={ACTION_BITS.UPDATE_LIFECYCLE}>
                                    <button
                                        title={lc.is_active !== false ? "إيقاف المرحلة" : "تفعيل المرحلة"}
                                        onClick={() => toggleActive(lc)}
                                        style={{ background: "none", border: "none", cursor: "pointer", color: lc.is_active !== false ? "#10b981" : "var(--t-text-faint)", display: "flex", padding: 4, borderRadius: 7 }}>
                                        {updateMut.isPending && updateMut.variables?.code === lc.code
                                            ? <Loader2 size={20} className="animate-spin" />
                                            : lc.is_active !== false ? <ToggleRight size={22} /> : <ToggleLeft size={22} />
                                        }
                                    </button>
                                </ActionGuard>
                                {/* Edit */}
                                <ActionGuard pageBit={PAGE_BITS.LIFECYCLES} actionBit={ACTION_BITS.UPDATE_LIFECYCLE}>
                                    <button className="lc-btn-ghost" onClick={() => { setEditLc(lc); setShowForm(true) }} style={{ padding: "5px 8px" }}>
                                        <Pencil size={12} />
                                    </button>
                                </ActionGuard>
                                {/* Delete */}
                                <ActionGuard pageBit={PAGE_BITS.LIFECYCLES} actionBit={ACTION_BITS.DELETE_LIFECYCLE}>
                                    <button onClick={() => setDeleteLc(lc)} style={{ display: "inline-flex", alignItems: "center", padding: "5px 8px", borderRadius: 9, border: "none", background: "rgba(239,68,68,.1)", color: "var(--t-danger)", cursor: "pointer" }}>
                                        <Trash2 size={12} />
                                    </button>
                                </ActionGuard>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Modals ── */}
            {showForm && (
                <Modal title={editLc ? `تعديل: ${editLc.name}` : "إنشاء مرحلة جديدة"} onClose={() => setShowForm(false)}>
                    <LifecycleForm lc={editLc} tenantId={tid} onClose={() => setShowForm(false)} />
                </Modal>
            )}
            {deleteLc && (
                <DeleteLifecycleModal lc={deleteLc} lifecycles={lifecycles} tenantId={tid} onClose={() => setDeleteLc(null)} />
            )}
        </div>
    )
}
