import { useState } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { useLifecycles, useCreateLifecycle, useUpdateLifecycle, useDeleteLifecycle, useDeletedLifecycles, useRestoreLifecycle } from "../hooks/use-lifecycles"
import type { Lifecycle } from "../types/teams-tags"
import type { DeleteLifecycleParams } from "../types/teams-tags"
import {
    Plus, Trash2, Pencil, X, Loader2, Check, Search,
    ToggleLeft, ToggleRight, FolderOpen, MoreVertical, AlertTriangle,
    Workflow, RotateCcw,
} from "lucide-react"
import { ActionGuard } from "@/components/guards/ActionGuard"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"

const CSS = `
@keyframes lcIn{from{opacity:0;transform:scale(.97) translateY(6px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes lcMenuIn{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:translateY(0)}}
@keyframes lcFade{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}

.lc-table{width:100%;border-collapse:separate;border-spacing:0}
.lc-table thead th{padding:9px 14px;font-size:10.5px;font-weight:700;color:var(--t-text-faint);text-align:right;border-bottom:1.5px solid var(--t-border);white-space:nowrap;background:#fafbfc;text-transform:uppercase;letter-spacing:.03em}
.lc-table tbody td{padding:10px 14px;font-size:12px;color:var(--t-text);border-bottom:1px solid #f0f1f3;vertical-align:middle}
.lc-table tbody tr{transition:background .1s}
.lc-table tbody tr:hover{background:rgba(27,80,145,.015)}
.lc-table tbody tr:last-child td{border-bottom:none}

.lc-field{width:100%;padding:8px 11px;border-radius:8px;border:1.5px solid var(--t-border);background:#fafbfc;font-size:12px;color:var(--t-text);outline:none;transition:border-color .15s,box-shadow .15s;box-sizing:border-box;font-family:inherit}
.lc-field:focus{border-color:var(--t-accent);box-shadow:0 0 0 3px rgba(27,80,145,.06);background:#fff}
.lc-field::placeholder{color:#b0b7c3}
.lc-label{font-size:10px;font-weight:700;color:var(--t-text-muted);display:flex;align-items:center;gap:3px;margin-bottom:4px}

.lc-btn-primary{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:8px;border:none;background:var(--t-brand-orange);color:#fff;font-size:12px;font-weight:700;cursor:pointer;transition:all .12s;font-family:inherit;box-shadow:0 2px 8px rgba(27,80,145,.15)}
.lc-btn-primary:hover:not(:disabled){opacity:.9;box-shadow:0 4px 12px rgba(27,80,145,.2)}
.lc-btn-primary:disabled{opacity:.5;cursor:not-allowed}

.lc-btn-ghost{display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:8px;border:1.5px solid var(--t-border);background:#fff;color:var(--t-text);font-size:11px;font-weight:600;cursor:pointer;transition:all .12s;font-family:inherit}
.lc-btn-ghost:hover{border-color:var(--t-accent);color:var(--t-accent)}

.lc-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.lc-badge{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700}

.lc-actions-btn{width:28px;height:28px;border-radius:7px;border:1px solid var(--t-border);background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--t-text-faint);transition:all .1s}
.lc-actions-btn:hover{background:var(--t-surface);color:var(--t-text-muted);border-color:var(--t-border-medium)}
.lc-actions-menu{position:absolute;left:0;top:100%;margin-top:2px;z-index:20;background:#fff;border:1px solid var(--t-border);border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.1);min-width:130px;padding:4px;animation:lcMenuIn .1s ease-out}
.lc-actions-menu button{width:100%;padding:7px 10px;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;gap:6px;border-radius:7px;font-size:11px;font-weight:600;color:var(--t-text);transition:background .08s;font-family:inherit;text-align:right}
.lc-actions-menu button:hover{background:var(--t-surface)}
.lc-actions-menu button.danger{color:var(--t-danger)}
.lc-actions-menu button.danger:hover{background:rgba(239,68,68,.05)}
.lc-actions-menu button.success{color:#16a34a}

.lc-section{display:flex;align-items:center;gap:6px;margin:4px 0 2px}
.lc-section-label{font-size:9px;font-weight:800;color:#b0b7c3;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap}
.lc-section-line{flex:1;height:1px;background:#f0f1f3}

.lc-tab-bar{display:flex;gap:2px;background:#f0f1f3;border-radius:10px;padding:3px}
.lc-tab{padding:6px 16px;border-radius:8px;border:none;background:transparent;font-size:11px;font-weight:700;color:var(--t-text-muted);cursor:pointer;transition:all .12s;font-family:inherit;display:inline-flex;align-items:center;gap:5px}
.lc-tab:hover{color:var(--t-accent)}
.lc-tab.active{background:#fff;color:var(--t-accent);box-shadow:0 1px 3px rgba(0,0,0,.06)}
.lc-tab .lc-tab-count{font-size:9px;font-weight:800;padding:1px 6px;border-radius:10px;background:rgba(27,80,145,.08);color:var(--t-accent)}

.lc-restore-btn{display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:8px;border:1.5px solid rgba(27,80,145,.15);background:rgba(27,80,145,.03);color:var(--t-accent);font-size:11px;font-weight:700;cursor:pointer;transition:all .12s;font-family:inherit}
.lc-restore-btn:hover{background:rgba(27,80,145,.08);border-color:var(--t-accent)}
.lc-restore-btn:disabled{opacity:.5;cursor:not-allowed}
`

const LC_COLORS = ["var(--t-accent)", "var(--t-accent-secondary)", "#6366f1", "var(--t-success)", "var(--t-warning)", "var(--t-danger)", "#ec4899", "#8b5cf6", "var(--t-info)", "#06b6d4", "#f97316"]

/* Modal */
function Modal({ title, width = 440, onClose, children }: { title: string; width?: number; onClose: () => void; children: React.ReactNode }) {
    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,.35)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div onClick={e => e.stopPropagation()} dir="rtl" style={{ borderRadius: 16, background: "#fff", border: "1px solid var(--t-border)", width: "100%", maxWidth: width, margin: 16, animation: "lcIn .15s ease-out", maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,.12)" }}>
                <div style={{ height: 3, background: "linear-gradient(90deg, var(--t-accent), var(--t-accent-secondary))", borderRadius: "16px 16px 0 0" }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #f0f1f3", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--t-brand-orange)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Workflow size={12} style={{ color: "#fff" }} />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)" }}>{title}</span>
                    </div>
                    <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: 7, background: "var(--t-surface)", border: "none", cursor: "pointer", color: "var(--t-text-faint)", display: "flex", alignItems: "center", justifyContent: "center" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--t-border)" }}
                        onMouseLeave={e => { e.currentTarget.style.background = "var(--t-surface)" }}>
                        <X size={12} />
                    </button>
                </div>
                <div style={{ padding: "14px 16px", overflowY: "auto", flex: 1 }}>{children}</div>
            </div>
        </div>
    )
}

function FormSection({ label }: { label: string }) {
    return <div className="lc-section"><span className="lc-section-label">{label}</span><div className="lc-section-line" /></div>
}

/* Lifecycle Form */
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
    const [color, setColor] = useState(lc?.color ?? "var(--t-accent)")
    const [icon, setIcon] = useState(lc?.icon ?? "")
    const [order, setOrder] = useState(String(lc?.order ?? 1))
    const [isActive, setIsActive] = useState(lc?.is_active ?? true)
    const [showExtra, setShowExtra] = useState(false)

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        const base = { name, name_ar: nameAr || undefined, name_en: nameEn || undefined, description: desc || undefined, description_ar: descAr || undefined, description_en: descEn || undefined, icon: icon || undefined, color, order: parseInt(order) || 1 }
        if (isEdit) updateMut.mutate({ code: lc.code, payload: { ...base, is_active: isActive } }, { onSuccess: r => { if (r.success) onClose() } })
        else createMut.mutate(base, { onSuccess: r => { if (r.success) onClose() } })
    }
    const isPending = createMut.isPending || updateMut.isPending

    return (
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "50px 1fr 60px", gap: 10 }}>
                <div>
                    <label className="lc-label">أيقونة</label>
                    <input className="lc-field" value={icon} onChange={e => setIcon(e.target.value)} placeholder="🌱" style={{ textAlign: "center", fontSize: 18, padding: "6px 0" }} />
                </div>
                <div>
                    <label className="lc-label">الاسم <span style={{ color: "var(--t-danger)" }}>*</span></label>
                    <input className="lc-field" value={name} onChange={e => setName(e.target.value)} placeholder="عميل جديد" required />
                </div>
                <div>
                    <label className="lc-label">الترتيب</label>
                    <input className="lc-field" type="number" min={1} value={order} onChange={e => setOrder(e.target.value)} placeholder="1" dir="ltr" style={{ textAlign: "center" }} />
                </div>
            </div>

            <div>
                <label className="lc-label">اللون</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    {LC_COLORS.map(c => (
                        <div key={c} onClick={() => setColor(c)} style={{
                            width: 22, height: 22, borderRadius: "50%", background: c, cursor: "pointer",
                            border: color === c ? "2.5px solid var(--t-text)" : "2.5px solid transparent",
                            boxShadow: color === c ? "0 0 0 2px #fff" : "none", transition: "all .12s", position: "relative",
                        }}>
                            {color === c && <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 9, fontWeight: 800, textShadow: "0 1px 2px rgba(0,0,0,.3)" }}>✓</span>}
                        </div>
                    ))}
                    <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: 22, height: 22, borderRadius: "50%", border: "1.5px solid var(--t-border)", padding: 0, cursor: "pointer", background: "transparent" }} title="لون مخصص" />
                </div>
            </div>

            <div>
                <label className="lc-label">الوصف</label>
                <textarea className="lc-field" rows={2} value={desc} onChange={e => setDesc(e.target.value)} placeholder="وصف اختياري..." style={{ resize: "vertical", lineHeight: 1.4 }} />
            </div>

            {isEdit && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8, background: "#fafbfc", border: "1px solid var(--t-border)" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t-text)" }}>المرحلة نشطة</span>
                    <button type="button" onClick={() => setIsActive(!isActive)} style={{ background: "none", border: "none", cursor: "pointer", color: isActive ? "#16a34a" : "var(--t-text-faint)", display: "flex" }}>
                        {isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                    </button>
                </div>
            )}

            <button type="button" onClick={() => setShowExtra(!showExtra)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontSize: 10, fontWeight: 700, color: "#b0b7c3", padding: 0, fontFamily: "inherit" }}>
                <FolderOpen size={10} /> {showExtra ? "إخفاء التفاصيل الإضافية ▲" : "تفاصيل إضافية ▼"}
            </button>

            {showExtra && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "8px 0 0", animation: "lcFade .15s ease-out" }}>
                    <FormSection label="الأسماء ثنائية اللغة" />
                    <div className="lc-grid-2">
                        <div><label className="lc-label">الاسم بالعربية</label><input className="lc-field" dir="rtl" value={nameAr} onChange={e => setNameAr(e.target.value)} placeholder="عميل جديد" /></div>
                        <div><label className="lc-label">الاسم بالإنجليزية</label><input className="lc-field" dir="ltr" value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="New Lead" /></div>
                    </div>
                    <FormSection label="الوصف ثنائي اللغة" />
                    <div className="lc-grid-2">
                        <div><label className="lc-label">الوصف بالعربية</label><textarea className="lc-field" rows={2} dir="rtl" value={descAr} onChange={e => setDescAr(e.target.value)} placeholder="وصف بالعربية..." style={{ resize: "vertical" }} /></div>
                        <div><label className="lc-label">الوصف بالإنجليزية</label><textarea className="lc-field" rows={2} dir="ltr" value={descEn} onChange={e => setDescEn(e.target.value)} placeholder="Description..." style={{ resize: "vertical" }} /></div>
                    </div>
                </div>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid #f0f1f3", marginTop: 2 }}>
                <button type="button" className="lc-btn-ghost" onClick={onClose}>إلغاء</button>
                <button type="submit" className="lc-btn-primary" disabled={isPending || !name.trim()}>
                    {isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} {isEdit ? "حفظ التغييرات" : "إنشاء المرحلة"}
                </button>
            </div>
        </form>
    )
}

/* Delete Modal */
function DeleteLifecycleModal({ lc, lifecycles, onClose, tenantId }: { lc: Lifecycle; lifecycles: Lifecycle[]; onClose: () => void; tenantId: string }) {
    const deleteMut = useDeleteLifecycle(tenantId)
    const [reassignTo, setReassignTo] = useState("")
    const others = lifecycles.filter(l => l.code !== lc.code)
    return (
        <Modal title="حذف دورة الحياة" width={380} onClose={onClose}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(239,68,68,.06)", margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <AlertTriangle size={22} style={{ color: "var(--t-danger)" }} />
                    </div>
                    <div style={{ fontSize: 18, marginBottom: 2 }}>{lc.icon || "🔴"}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)" }}>تعطيل «{lc.name}»؟</div>
                    <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginTop: 3 }}>سيتم تعطيل المرحلة ويمكنك استعادتها لاحقاً. يمكن تحويل العملاء إلى مرحلة أخرى.</div>
                </div>
                {others.length > 0 && (
                    <div>
                        <label className="lc-label">تحويل العملاء إلى (اختياري)</label>
                        <select className="lc-field" value={reassignTo} onChange={e => setReassignTo(e.target.value)} style={{ fontFamily: "inherit", cursor: "pointer" }}>
                            <option value="">لا تُحوِّل (إزالة المرحلة)</option>
                            {others.map(l => <option key={l.code} value={l.code}>{l.icon ? `${l.icon} ` : ""}{l.name}</option>)}
                        </select>
                    </div>
                )}
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    <button className="lc-btn-ghost" onClick={onClose}>إلغاء</button>
                    <button disabled={deleteMut.isPending} onClick={() => { const params: DeleteLifecycleParams = { reassign_to: reassignTo || undefined }; deleteMut.mutate({ code: lc.code, params }, { onSuccess: r => { if (r.success) onClose() } }) }}
                        style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 18px", borderRadius: 8, border: "none", background: "var(--t-danger)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 8px rgba(239,68,68,.2)" }}>
                        {deleteMut.isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} تعطيل
                    </button>
                </div>
            </div>
        </Modal>
    )
}

/* Actions Dropdown */
function ActionsDropdown({ lc, onEdit, onToggle, onDelete, isToggling }: { lc: Lifecycle; onEdit: () => void; onToggle: () => void; onDelete: () => void; isToggling: boolean }) {
    const [open, setOpen] = useState(false)
    return (
        <div style={{ position: "relative", zIndex: open ? 20 : 1 }}>
            <button className="lc-actions-btn" onClick={(e) => { e.stopPropagation(); setOpen(!open) }}><MoreVertical size={13} /></button>
            {open && (
                <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 15 }} onClick={() => setOpen(false)} />
                    <div className="lc-actions-menu" dir="rtl">
                        <ActionGuard pageBit={PAGE_BITS.LIFECYCLES} actionBit={ACTION_BITS.UPDATE_LIFECYCLE}><button onClick={() => { onEdit(); setOpen(false) }}><Pencil size={11} /> تعديل</button></ActionGuard>
                        <ActionGuard pageBit={PAGE_BITS.LIFECYCLES} actionBit={ACTION_BITS.UPDATE_LIFECYCLE}>
                            <button className="success" onClick={() => { onToggle(); setOpen(false) }}>
                                {isToggling ? <Loader2 size={11} className="animate-spin" /> : lc.is_active !== false ? <ToggleLeft size={11} /> : <ToggleRight size={11} />}
                                {lc.is_active !== false ? "إيقاف" : "تفعيل"}
                            </button>
                        </ActionGuard>
                        <ActionGuard pageBit={PAGE_BITS.LIFECYCLES} actionBit={ACTION_BITS.DELETE_LIFECYCLE}><button className="danger" onClick={() => { onDelete(); setOpen(false) }}><Trash2 size={11} /> حذف</button></ActionGuard>
                    </div>
                </>
            )}
        </div>
    )
}

/* Main */
export function LifecyclesTab() {
    const { user } = useAuthStore()
    const tid = user?.tenant_id ?? ""
    const { data: lifecycles = [], isLoading } = useLifecycles(tid)
    const updateMut = useUpdateLifecycle(tid)

    const [search, setSearch] = useState("")
    const [showForm, setShowForm] = useState(false)
    const [editLc, setEditLc] = useState<Lifecycle | undefined>()
    const [deleteLc, setDeleteLc] = useState<Lifecycle | null>(null)
    const [activeTab, setActiveTab] = useState<"active" | "deleted">("active")

    const { data: deletedData, isLoading: isLoadingDeleted } = useDeletedLifecycles(tid)
    const restoreMut = useRestoreLifecycle(tid)

    const filtered = [...lifecycles]
        .filter(lc => !search || lc.name.toLowerCase().includes(search.toLowerCase()) || (lc.name_ar ?? "").includes(search) || lc.code.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

    const toggleActive = (lc: Lifecycle) => updateMut.mutate({ code: lc.code, payload: { is_active: !lc.is_active } })

    const activeCount = lifecycles.filter(lc => lc.is_active !== false).length

    return (
        <div style={{ direction: "rtl" }}>
            <style>{CSS}</style>

            {/* Status strip */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "10px 14px", borderRadius: 10, background: "#fafbfc", border: "1px solid var(--t-border)" }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--t-brand-orange)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Workflow size={12} style={{ color: "#fff" }} />
                </div>
                <span style={{ fontSize: 11, color: "var(--t-text-muted)", flex: 1 }}>إدارة مراحل دورة حياة العملاء. حدد المراحل المختلفة التي يمر بها العملاء في رحلتهم.</span>
                <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                    <div style={{ textAlign: "center" }}><div style={{ fontSize: 16, fontWeight: 800, color: "var(--t-accent)" }}>{lifecycles.length}</div><div style={{ fontSize: 9, color: "var(--t-text-faint)", fontWeight: 600 }}>الإجمالي</div></div>
                    <div style={{ width: 1, background: "var(--t-border)" }} />
                    <div style={{ textAlign: "center" }}><div style={{ fontSize: 16, fontWeight: 800, color: "#16a34a" }}>{activeCount}</div><div style={{ fontSize: 9, color: "var(--t-text-faint)", fontWeight: 600 }}>نشط</div></div>
                </div>
            </div>

            {/* Toolbar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="lc-tab-bar">
                        <button className={`lc-tab ${activeTab === "active" ? "active" : ""}`} onClick={() => setActiveTab("active")}>
                            نشطة <span className="lc-tab-count">{lifecycles.length}</span>
                        </button>
                        <button className={`lc-tab ${activeTab === "deleted" ? "active" : ""}`} onClick={() => setActiveTab("deleted")}>
                            معطلة {(deletedData as any)?.items?.length ? <span className="lc-tab-count">{(deletedData as any).items.length}</span> : null}
                        </button>
                    </div>
                    {activeTab === "active" && (
                        <div style={{ position: "relative", width: 200 }}>
                            <Search size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#b0b7c3", pointerEvents: "none" }} />
                            <input className="lc-field" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث في المراحل..." style={{ paddingInlineEnd: 32, fontSize: 11 }} />
                        </div>
                    )}
                </div>
                <ActionGuard pageBit={PAGE_BITS.LIFECYCLES} actionBit={ACTION_BITS.CREATE_LIFECYCLE}>
                    <button className="lc-btn-primary" onClick={() => { setEditLc(undefined); setShowForm(true) }}><Plus size={13} /> مرحلة جديدة</button>
                </ActionGuard>
            </div>

            {/* Content */}
            {activeTab === "active" ? (
                <div style={{ borderRadius: 12, border: "1px solid var(--t-border)", background: "#fff", overflow: "visible" }}>
                    {isLoading ? (
                        <div style={{ textAlign: "center", padding: "48px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--t-text-faint)", fontSize: 12 }}>
                            <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2.5px solid var(--t-border)", borderTopColor: "var(--t-accent)", animation: "spin .7s linear infinite" }} /> جاري التحميل...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "48px 0" }}>
                            <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--t-surface)", margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center" }}><Workflow size={22} style={{ color: "var(--t-border-medium)" }} /></div>
                            <div style={{ fontSize: 14, color: "var(--t-text)", fontWeight: 700, marginBottom: 3 }}>{search ? "لا توجد نتائج" : "لا توجد مراحل بعد"}</div>
                            <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginBottom: 14 }}>{search ? "حاول تغيير كلمات البحث" : "أنشئ مراحل لتتبع رحلة العملاء"}</div>
                            {!search && <button className="lc-btn-primary" onClick={() => { setEditLc(undefined); setShowForm(true) }}><Plus size={13} /> أضف أول مرحلة</button>}
                        </div>
                    ) : (
                        <table className="lc-table">
                            <thead><tr><th>الترتيب</th><th>الاسم</th><th>الكود</th><th>الوصف</th><th>الحالة</th><th>إجراءات</th></tr></thead>
                            <tbody>
                                {filtered.map(lc => (
                                    <tr key={lc.id ?? lc.code} style={{ opacity: lc.is_active === false ? 0.55 : 1, animation: "lcFade .2s ease-out" }}>
                                        <td>
                                            <div style={{ width: 28, height: 28, borderRadius: 8, background: `${lc.color || "var(--t-accent)"}10`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: lc.color || "var(--t-accent)", border: `1px solid ${lc.color || "var(--t-accent)"}20` }}>
                                                {lc.order ?? "—"}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                                {lc.icon && <span style={{ fontSize: 15 }}>{lc.icon}</span>}
                                                <span style={{ fontWeight: 700, fontSize: 12.5, color: "var(--t-text)" }}>{lc.name}</span>
                                            </div>
                                        </td>
                                        <td><code style={{ fontSize: 10, color: "var(--t-text-muted)", background: "var(--t-surface)", padding: "2px 7px", borderRadius: 5, fontFamily: "monospace" }}>{lc.code}</code></td>
                                        <td><span style={{ color: "var(--t-text-faint)", fontSize: 11 }}>{lc.description || "—"}</span></td>
                                        <td>
                                            <span className="lc-badge" style={{ color: lc.is_active !== false ? "#16a34a" : "var(--t-text-faint)", background: lc.is_active !== false ? "rgba(22,163,74,.06)" : "var(--t-surface)" }}>
                                                {lc.is_active !== false ? "نشطة" : "موقوفة"}
                                            </span>
                                        </td>
                                        <td><ActionsDropdown lc={lc} onEdit={() => { setEditLc(lc); setShowForm(true) }} onToggle={() => toggleActive(lc)} onDelete={() => setDeleteLc(lc)} isToggling={updateMut.isPending && updateMut.variables?.code === lc.code} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            ) : (
                /* ─── Deleted Lifecycles ─── */
                <div style={{ borderRadius: 12, border: "1px solid var(--t-border)", background: "#fff", overflow: "visible" }}>
                    {isLoadingDeleted ? (
                        <div style={{ textAlign: "center", padding: "48px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--t-text-faint)", fontSize: 12 }}>
                            <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2.5px solid var(--t-border)", borderTopColor: "var(--t-accent)", animation: "spin .7s linear infinite" }} /> جاري التحميل...
                        </div>
                    ) : !(deletedData as any)?.items?.length ? (
                        <div style={{ textAlign: "center", padding: "48px 0" }}>
                            <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--t-surface)", margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={22} style={{ color: "var(--t-border-medium)" }} /></div>
                            <div style={{ fontSize: 13, color: "var(--t-text-faint)", fontWeight: 600 }}>لا توجد مراحل معطلة</div>
                        </div>
                    ) : (
                        <table className="lc-table">
                            <thead><tr><th>الترتيب</th><th>الاسم</th><th>الكود</th><th>الوصف</th><th>إجراءات</th></tr></thead>
                            <tbody>
                                {((deletedData as any).items as Lifecycle[]).map(lc => (
                                    <tr key={lc.id ?? lc.code} style={{ opacity: .7, animation: "lcFade .2s ease-out" }}>
                                        <td>
                                            <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--t-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "var(--t-text-faint)", border: "1px solid var(--t-border)" }}>
                                                {lc.order ?? "—"}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                                {lc.icon && <span style={{ fontSize: 15 }}>{lc.icon}</span>}
                                                <span style={{ fontWeight: 700, fontSize: 12.5, color: "var(--t-text)" }}>{lc.name}</span>
                                            </div>
                                        </td>
                                        <td><code style={{ fontSize: 10, color: "var(--t-text-muted)", background: "var(--t-surface)", padding: "2px 7px", borderRadius: 5, fontFamily: "monospace" }}>{lc.code}</code></td>
                                        <td><span style={{ color: "var(--t-text-faint)", fontSize: 11 }}>{lc.description || "—"}</span></td>
                                        <td>
                                            <ActionGuard pageBit={PAGE_BITS.LIFECYCLES} actionBit={ACTION_BITS.UPDATE_LIFECYCLE}>
                                                <button className="lc-restore-btn" disabled={restoreMut.isPending} onClick={() => restoreMut.mutate(lc.code)}>
                                                    {restoreMut.isPending ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />} استعادة
                                                </button>
                                            </ActionGuard>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {showForm && <Modal title={editLc ? `تعديل: ${editLc.name}` : "مرحلة جديدة"} width={440} onClose={() => setShowForm(false)}><LifecycleForm lc={editLc} tenantId={tid} onClose={() => setShowForm(false)} /></Modal>}
            {deleteLc && <DeleteLifecycleModal lc={deleteLc} lifecycles={lifecycles} tenantId={tid} onClose={() => setDeleteLc(null)} />}
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )
}
