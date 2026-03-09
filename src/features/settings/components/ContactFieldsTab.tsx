import { useState } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { useDynamicFields, useCreateDynamicField, useUpdateDynamicField, useDeleteDynamicField } from "../hooks/use-contact-fields"
import type { DynamicField, DynamicFieldType } from "../types/teams-tags"
import {
    Plus, Trash2, Pencil, X, Loader2, Search,
    AlertTriangle, Check, MoreVertical, ArrowUpDown,
    FileSliders, Database, Hash, Mail, Phone,
    Calendar, ToggleLeft, List, Link2, AlignLeft, Type,
} from "lucide-react"
import { ActionGuard } from "@/components/guards/ActionGuard"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"

/* ═══════════════════════════════════════
   CSS
═══════════════════════════════════════ */
const CSS = `
@keyframes cfIn{from{opacity:0;transform:scale(.97) translateY(6px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes cfMenuIn{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:translateY(0)}}
@keyframes cfFade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}

.cf-table{width:100%;border-collapse:separate;border-spacing:0}
.cf-table thead th{padding:9px 14px;font-size:10.5px;font-weight:700;color:#9ca3af;text-align:right;border-bottom:1.5px solid #ebeef2;white-space:nowrap;background:#fafbfc;text-transform:uppercase;letter-spacing:.03em}
.cf-table tbody td{padding:10px 14px;font-size:12px;color:#111827;border-bottom:1px solid #f0f1f3;vertical-align:middle}
.cf-table tbody tr{transition:background .1s}
.cf-table tbody tr:hover{background:rgba(0,71,134,.015)}
.cf-table tbody tr:last-child td{border-bottom:none}
.cf-th-sort{display:inline-flex;align-items:center;gap:3px;cursor:pointer;user-select:none;transition:color .12s}
.cf-th-sort:hover{color:#004786}

.cf-field{width:100%;padding:8px 11px;border-radius:8px;border:1.5px solid #ebeef2;background:#fafbfc;font-size:12px;color:#111827;outline:none;transition:border-color .15s,box-shadow .15s;box-sizing:border-box;font-family:inherit}
.cf-field:focus{border-color:#004786;box-shadow:0 0 0 3px rgba(0,71,134,.06);background:#fff}
.cf-field::placeholder{color:#b0b7c3}
.cf-field:disabled{opacity:.55;cursor:not-allowed}

.cf-label{font-size:10px;font-weight:700;color:#6b7280;display:flex;align-items:center;gap:3px;margin-bottom:4px}
.cf-label-hint{font-size:9px;font-weight:500;color:#b0b7c3;margin-right:auto}

.cf-btn-primary{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:8px;border:none;background:linear-gradient(135deg,#004786,#0072b5);color:#fff;font-size:12px;font-weight:700;cursor:pointer;transition:all .12s;font-family:inherit;box-shadow:0 2px 8px rgba(0,71,134,.15)}
.cf-btn-primary:hover:not(:disabled){opacity:.9;box-shadow:0 4px 12px rgba(0,71,134,.2)}
.cf-btn-primary:disabled{opacity:.5;cursor:not-allowed}

.cf-btn-ghost{display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:8px;border:1.5px solid #ebeef2;background:#fff;color:#111827;font-size:11px;font-weight:600;cursor:pointer;transition:all .12s;font-family:inherit}
.cf-btn-ghost:hover{border-color:#004786;color:#004786}

.cf-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:10px}

.cf-actions-btn{width:28px;height:28px;border-radius:7px;border:1px solid #ebeef2;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#9ca3af;transition:all .1s}
.cf-actions-btn:hover{background:#f5f6f8;color:#6b7280;border-color:#d1d5db}

.cf-actions-menu{position:absolute;left:0;top:100%;margin-top:2px;z-index:20;background:#fff;border:1px solid #ebeef2;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.1);min-width:130px;padding:4px;animation:cfMenuIn .1s ease-out}
.cf-actions-menu button{width:100%;padding:7px 10px;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;gap:6px;border-radius:7px;font-size:11px;font-weight:600;color:#111827;transition:background .08s;font-family:inherit;text-align:right}
.cf-actions-menu button:hover{background:#f5f6f8}
.cf-actions-menu button.danger{color:#ef4444}
.cf-actions-menu button.danger:hover{background:rgba(239,68,68,.05)}

.cf-type-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:6px;font-size:10px;font-weight:700;border:1px solid #ebeef2}
.cf-active-dot{width:6px;height:6px;border-radius:50%;display:inline-block}

.cf-select{width:100%;padding:8px 11px;border-radius:8px;border:1.5px solid #ebeef2;background:#fafbfc;font-size:12px;color:#111827;outline:none;font-family:inherit;cursor:pointer;appearance:auto;transition:border-color .15s,box-shadow .15s}
.cf-select:focus{border-color:#004786;box-shadow:0 0 0 3px rgba(0,71,134,.06)}
.cf-select:disabled{opacity:.55;cursor:not-allowed}

.cf-toggle-track{width:34px;height:18px;border-radius:10px;cursor:pointer;position:relative;transition:background .2s;border:none;padding:0;display:inline-block}
.cf-toggle-track::after{content:'';position:absolute;top:2px;width:14px;height:14px;border-radius:50%;background:#fff;transition:right .2s,left .2s;box-shadow:0 1px 3px rgba(0,0,0,.15)}
.cf-toggle-track.on{background:#004786}
.cf-toggle-track.on::after{right:2px;left:auto}
.cf-toggle-track.off{background:#d1d5db}
.cf-toggle-track.off::after{right:auto;left:2px}
`

/* ─── Type Labels ─── */
const TYPE_LABELS: Record<DynamicFieldType, string> = {
    text: "نص", number: "رقم", email: "بريد إلكتروني", phone: "هاتف",
    date: "تاريخ", boolean: "نعم/لا", select: "قائمة اختيار",
    multi_select: "قائمة متعددة", url: "رابط", textarea: "نص طويل",
}

const TYPE_ICONS: Record<DynamicFieldType, React.ReactNode> = {
    text: <Type size={10} />, number: <Hash size={10} />, email: <Mail size={10} />,
    phone: <Phone size={10} />, date: <Calendar size={10} />, boolean: <ToggleLeft size={10} />,
    select: <List size={10} />, multi_select: <List size={10} />, url: <Link2 size={10} />,
    textarea: <AlignLeft size={10} />,
}

const TYPE_COLORS: Record<DynamicFieldType, string> = {
    text: "#6b7280", number: "#0072b5", email: "#f59e0b", phone: "#16a34a",
    date: "#8b5cf6", boolean: "#ec4899", select: "#004786", multi_select: "#0891b2",
    url: "#ea580c", textarea: "#6b7280",
}

const FIELD_TYPES: DynamicFieldType[] = [
    "text", "number", "email", "phone", "date",
    "boolean", "select", "multi_select", "url", "textarea",
]

function fmtDate(d?: string) {
    if (!d) return "—"
    try {
        return new Intl.DateTimeFormat("ar", {
            month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Aden",
        }).format(new Date(d))
    } catch { return d }
}

/* ─── Modal ─── */
function Modal({ title, width = 480, onClose, children }: {
    title: string; width?: number; onClose: () => void; children: React.ReactNode
}) {
    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,.35)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div onClick={e => e.stopPropagation()} dir="rtl" style={{
                borderRadius: 16, background: "#fff", border: "1px solid #ebeef2",
                width: "100%", maxWidth: width, margin: 16, animation: "cfIn .15s ease-out",
                maxHeight: "88vh", display: "flex", flexDirection: "column",
                boxShadow: "0 20px 60px rgba(0,0,0,.12)",
            }}>
                <div style={{ height: 3, background: "linear-gradient(90deg, #004786, #0072b5)", borderRadius: "16px 16px 0 0" }} />
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 16px", borderBottom: "1px solid #f0f1f3", flexShrink: 0,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #004786, #0072b5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Database size={12} style={{ color: "#fff" }} />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{title}</span>
                    </div>
                    <button onClick={onClose} style={{
                        width: 26, height: 26, borderRadius: 7, background: "#f5f6f8",
                        border: "none", cursor: "pointer", color: "#9ca3af",
                        display: "flex", alignItems: "center", justifyContent: "center", transition: "all .1s",
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#ebeef2" }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#f5f6f8" }}>
                        <X size={12} />
                    </button>
                </div>
                <div style={{ padding: "14px 16px", overflowY: "auto", flex: 1 }}>{children}</div>
            </div>
        </div>
    )
}

/* ─── Field Form ─── */
function FieldForm({ field, tenantId, onClose }: {
    field?: DynamicField; tenantId: string; onClose: () => void
}) {
    const createMut = useCreateDynamicField(tenantId)
    const updateMut = useUpdateDynamicField(tenantId)
    const isEdit = !!field

    const [fieldName, setFieldName] = useState(field?.field_name ?? "")
    const [fieldLabel, setFieldLabel] = useState(field?.field_label ?? "")
    const [labelAr, setLabelAr] = useState(field?.label_ar ?? "")
    const [labelEn, setLabelEn] = useState(field?.label_en ?? "")
    const [fieldType, setFieldType] = useState<DynamicFieldType>(field?.field_type ?? "text")
    const [required, setRequired] = useState(field?.required ?? false)
    const [defaultValue, setDefaultValue] = useState(field?.default_value ?? "")
    const [options, setOptions] = useState(field?.options?.join(", ") ?? "")
    const [isActive, setIsActive] = useState(field?.is_active ?? true)
    const [displayOrder, setDisplayOrder] = useState<string>(field?.display_order?.toString() ?? "")
    const [description, setDescription] = useState(field?.description ?? "")

    const needsOptions = fieldType === "select" || fieldType === "multi_select"

    const handleLabelChange = (val: string) => {
        setFieldLabel(val)
        if (!isEdit) setFieldName(val.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "").slice(0, 50))
    }

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        if (isEdit) {
            updateMut.mutate({
                fieldName: field.field_name,
                payload: {
                    field_label: fieldLabel, label_ar: labelAr || undefined, label_en: labelEn || undefined,
                    required, default_value: defaultValue || undefined,
                    options: needsOptions ? options.split(",").map(o => o.trim()).filter(Boolean) : undefined,
                    is_active: isActive, display_order: displayOrder ? parseInt(displayOrder) : undefined,
                    description: description || undefined,
                },
            }, { onSuccess: r => { if (r.success) onClose() } })
        } else {
            createMut.mutate({
                field_name: fieldName, field_label: fieldLabel, label_ar: labelAr || undefined,
                label_en: labelEn || undefined, field_type: fieldType, required,
                default_value: defaultValue || undefined,
                options: needsOptions ? options.split(",").map(o => o.trim()).filter(Boolean) : undefined,
                is_active: isActive, display_order: displayOrder ? parseInt(displayOrder) : undefined,
                description: description || undefined,
            }, { onSuccess: r => { if (r.success) onClose() } })
        }
    }

    const isPending = createMut.isPending || updateMut.isPending

    return (
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
                <label className="cf-label">الاسم <span style={{ color: "#ef4444" }}>*</span></label>
                <input className="cf-field" value={fieldLabel} onChange={e => handleLabelChange(e.target.value)}
                    placeholder="مثال: تاريخ الميلاد، رقم العميل" required />
            </div>

            <div>
                <label className="cf-label">
                    معرّف الحقل (Field ID)
                    {!isEdit && <span className="cf-label-hint">يُولّد تلقائياً</span>}
                </label>
                <input className="cf-field" value={fieldName}
                    onChange={e => !isEdit && setFieldName(e.target.value.replace(/[^a-z0-9_]/g, ""))}
                    placeholder="field_name" required disabled={isEdit}
                    dir="ltr" style={{ fontFamily: "monospace", fontSize: 11 }} />
            </div>

            <div>
                <label className="cf-label">الوصف <span className="cf-label-hint">اختياري</span></label>
                <input className="cf-field" value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="وصف مختصر للحقل" maxLength={500} />
            </div>

            <div>
                <label className="cf-label">
                    النوع
                    {isEdit && <span className="cf-label-hint">لا يمكن تغيير النوع بعد الإنشاء</span>}
                </label>
                <select className="cf-select" value={fieldType}
                    onChange={e => setFieldType(e.target.value as DynamicFieldType)} disabled={isEdit}>
                    {FIELD_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                </select>
            </div>

            {needsOptions && (
                <div>
                    <label className="cf-label">الخيارات <span style={{ color: "#ef4444" }}>*</span></label>
                    <input className="cf-field" value={options} onChange={e => setOptions(e.target.value)}
                        placeholder="ذكر, أنثى, آخر (مفصولة بفاصلة)" required />
                    <div style={{ fontSize: 9, color: "#b0b7c3", marginTop: 3 }}>افصل بين الخيارات بفاصلة</div>
                </div>
            )}

            <div className="cf-grid-2">
                <div>
                    <label className="cf-label">التسمية بالعربية</label>
                    <input className="cf-field" dir="rtl" value={labelAr} onChange={e => setLabelAr(e.target.value)} placeholder="التسمية بالعربية" />
                </div>
                <div>
                    <label className="cf-label">التسمية بالإنجليزية</label>
                    <input className="cf-field" dir="ltr" value={labelEn} onChange={e => setLabelEn(e.target.value)} placeholder="English Label" />
                </div>
            </div>

            <div className="cf-grid-2">
                <div>
                    <label className="cf-label">القيمة الافتراضية</label>
                    <input className="cf-field" value={defaultValue} onChange={e => setDefaultValue(e.target.value)} placeholder="فارغ" maxLength={500} />
                </div>
                <div>
                    <label className="cf-label">ترتيب العرض</label>
                    <input className="cf-field" type="number" value={displayOrder} onChange={e => setDisplayOrder(e.target.value)} placeholder="0" min={0} />
                </div>
            </div>

            <div style={{ display: "flex", gap: 20, alignItems: "center", padding: "6px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button type="button" className={`cf-toggle-track ${required ? "on" : "off"}`} onClick={() => setRequired(!required)} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>حقل مطلوب</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button type="button" className={`cf-toggle-track ${isActive ? "on" : "off"}`} onClick={() => setIsActive(!isActive)} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>نشط</span>
                </div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid #f0f1f3", marginTop: 2 }}>
                <button type="button" className="cf-btn-ghost" onClick={onClose}>إلغاء</button>
                <button type="submit" className="cf-btn-primary" disabled={isPending || !fieldLabel.trim() || !fieldName.trim()}>
                    {isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    {isEdit ? "حفظ التغييرات" : "إضافة"}
                </button>
            </div>
        </form>
    )
}

/* ─── Actions Dropdown ─── */
function ActionsDropdown({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
    const [open, setOpen] = useState(false)
    return (
        <div style={{ position: "relative", zIndex: open ? 20 : 1 }}>
            <button className="cf-actions-btn" onClick={(e) => { e.stopPropagation(); setOpen(!open) }}>
                <MoreVertical size={13} />
            </button>
            {open && (
                <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 15 }} onClick={() => setOpen(false)} />
                    <div className="cf-actions-menu" dir="rtl">
                        <ActionGuard pageBit={PAGE_BITS.CONTACT_FIELDS} actionBit={ACTION_BITS.UPDATE_DYNAMIC_FIELD}>
                            <button onClick={() => { onEdit(); setOpen(false) }}><Pencil size={11} /> تعديل</button>
                        </ActionGuard>
                        <ActionGuard pageBit={PAGE_BITS.CONTACT_FIELDS} actionBit={ACTION_BITS.DELETE_DYNAMIC_FIELD}>
                            <button className="danger" onClick={() => { onDelete(); setOpen(false) }}><Trash2 size={11} /> حذف</button>
                        </ActionGuard>
                    </div>
                </>
            )}
        </div>
    )
}

/* ═══════════════════════════════════════
   Main — ContactFieldsTab
═══════════════════════════════════════ */
export function ContactFieldsTab() {
    const { user } = useAuthStore()
    const tid = user?.tenant_id ?? ""

    const { data: fields = [], isLoading } = useDynamicFields(tid)
    const deleteMut = useDeleteDynamicField(tid)

    const [search, setSearch] = useState("")
    const [showForm, setShowForm] = useState(false)
    const [editField, setEditField] = useState<DynamicField | undefined>()
    const [deleteTarget, setDeleteTarget] = useState<DynamicField | null>(null)
    const [sortField, setSortField] = useState<"display_order" | "field_name" | "created_at">("display_order")
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

    const filtered = (fields as DynamicField[])
        .filter(f =>
            !search ||
            f.field_name.toLowerCase().includes(search.toLowerCase()) ||
            f.field_label.toLowerCase().includes(search.toLowerCase()) ||
            (f.description ?? "").toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            const dir = sortDir === "asc" ? 1 : -1
            if (sortField === "display_order") return ((a.display_order ?? 999) - (b.display_order ?? 999)) * dir
            if (sortField === "field_name") return a.field_name.localeCompare(b.field_name) * dir
            return ((a.created_at ?? "") > (b.created_at ?? "") ? 1 : -1) * dir
        })

    const toggleSort = (field: "display_order" | "field_name" | "created_at") => {
        if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc")
        else { setSortField(field); setSortDir("asc") }
    }

    const openEdit = (f: DynamicField) => { setEditField(f); setShowForm(true) }
    const openCreate = () => { setEditField(undefined); setShowForm(true) }

    const activeCount = (fields as DynamicField[]).filter(f => f.is_active).length
    const totalCount = (fields as DynamicField[]).length

    return (
        <div style={{ direction: "rtl" }}>
            <style>{CSS}</style>

            {/* ── Status strip ── */}
            <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "10px 14px",
                borderRadius: 10, background: "#fafbfc", border: "1px solid #ebeef2",
            }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #004786, #0072b5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Database size={12} style={{ color: "#fff" }} />
                </div>
                <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.5 }}>
                        إنشاء وإدارة حقول جهات الاتصال لحفظ معلومات إضافية عن عملائك. يمكنك تصنيف جهات الاتصال بناءً على هذه المعلومات.
                    </span>
                </div>
                <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#004786" }}>{totalCount}</div>
                        <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 600 }}>الإجمالي</div>
                    </div>
                    <div style={{ width: 1, background: "#ebeef2" }} />
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#16a34a" }}>{activeCount}</div>
                        <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 600 }}>نشط</div>
                    </div>
                </div>
            </div>

            {/* ── Toolbar ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ position: "relative", width: 220 }}>
                    <Search size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#b0b7c3", pointerEvents: "none" }} />
                    <input className="cf-field" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="بحث في الحقول..." style={{ paddingInlineEnd: 32, fontSize: 11 }} />
                </div>
                <ActionGuard pageBit={PAGE_BITS.CONTACT_FIELDS} actionBit={ACTION_BITS.CREATE_DYNAMIC_FIELD}>
                    <button className="cf-btn-primary" onClick={openCreate}>
                        <Plus size={13} /> إضافة حقل مخصص
                    </button>
                </ActionGuard>
            </div>

            {/* ── Table ── */}
            <div style={{ borderRadius: 12, border: "1px solid #ebeef2", background: "#fff", overflow: "visible" }}>
                {isLoading ? (
                    <div style={{ textAlign: "center", padding: "48px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#9ca3af", fontSize: 12 }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2.5px solid #ebeef2", borderTopColor: "#004786", animation: "spin .7s linear infinite" }} />
                        جاري التحميل...
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 0" }}>
                        <div style={{ width: 52, height: 52, borderRadius: 14, background: "#f5f6f8", margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <FileSliders size={22} style={{ color: "#d1d5db" }} />
                        </div>
                        <div style={{ fontSize: 14, color: "#111827", fontWeight: 700, marginBottom: 3 }}>
                            {search ? "لا توجد نتائج" : "لا توجد حقول مخصصة بعد"}
                        </div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 14 }}>
                            {search ? "حاول تغيير كلمات البحث" : "أنشئ حقولاً مخصصة لحفظ بيانات إضافية"}
                        </div>
                        {!search && (
                            <button className="cf-btn-primary" onClick={openCreate} style={{ margin: "0 auto" }}>
                                <Plus size={13} /> أضف أول حقل
                            </button>
                        )}
                    </div>
                ) : (
                    <table className="cf-table">
                        <thead>
                            <tr>
                                <th><span className="cf-th-sort" onClick={() => toggleSort("display_order")}># <ArrowUpDown size={10} style={{ opacity: sortField === "display_order" ? 1 : .3 }} /></span></th>
                                <th><span className="cf-th-sort" onClick={() => toggleSort("field_name")}>الاسم <ArrowUpDown size={10} style={{ opacity: sortField === "field_name" ? 1 : .3 }} /></span></th>
                                <th>معرّف الحقل</th>
                                <th>الوصف</th>
                                <th>النوع</th>
                                <th>الحالة</th>
                                <th><span className="cf-th-sort" onClick={() => toggleSort("created_at")}>تاريخ الإنشاء <ArrowUpDown size={10} style={{ opacity: sortField === "created_at" ? 1 : .3 }} /></span></th>
                                <th>إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((f: DynamicField) => {
                                const typeColor = TYPE_COLORS[f.field_type] || "#6b7280"
                                return (
                                    <tr key={f.id ?? f.field_name} style={{ animation: "cfFade .2s ease-out" }}>
                                        <td><span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af" }}>{f.display_order ?? "—"}</span></td>
                                        <td>
                                            <span style={{ fontWeight: 700, fontSize: 12.5, color: "#111827" }}>{f.field_label || f.field_name}</span>
                                        </td>
                                        <td>
                                            <code style={{ fontSize: 10, color: "#6b7280", background: "#f5f6f8", padding: "2px 7px", borderRadius: 5, fontFamily: "monospace" }}>
                                                {f.field_name}
                                            </code>
                                        </td>
                                        <td><span style={{ color: "#9ca3af", fontSize: 11 }}>{f.description || "—"}</span></td>
                                        <td>
                                            <span className="cf-type-badge" style={{ background: `${typeColor}08`, borderColor: `${typeColor}18`, color: typeColor }}>
                                                {TYPE_ICONS[f.field_type]}
                                                {TYPE_LABELS[f.field_type] || f.field_type}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                                <span className="cf-active-dot" style={{ background: f.is_active ? "#16a34a" : "#d1d5db" }} />
                                                <span style={{ fontSize: 11, fontWeight: 600, color: f.is_active ? "#16a34a" : "#9ca3af" }}>
                                                    {f.is_active ? "نشط" : "معطل"}
                                                </span>
                                            </div>
                                        </td>
                                        <td><span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>{fmtDate(f.created_at)}</span></td>
                                        <td>
                                            <ActionsDropdown onEdit={() => openEdit(f)} onDelete={() => setDeleteTarget(f)} />
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── Modals ── */}
            {showForm && (
                <Modal title={editField ? `تعديل: ${editField.field_label}` : "إضافة حقل مخصص"} width={480} onClose={() => setShowForm(false)}>
                    <FieldForm field={editField} tenantId={tid} onClose={() => setShowForm(false)} />
                </Modal>
            )}

            {deleteTarget && (
                <Modal title="تأكيد الحذف" width={380} onClose={() => setDeleteTarget(null)}>
                    <div style={{ textAlign: "center", padding: "4px 0" }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: 14,
                            background: "rgba(239,68,68,.06)", margin: "0 auto 12px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <AlertTriangle size={22} style={{ color: "#ef4444" }} />
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
                            حذف حقل «{deleteTarget.field_label}»؟
                        </div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>
                            <strong>تحذير:</strong> حذف نهائي — سيُزال الحقل من جميع جهات الاتصال.
                        </div>
                        <div style={{ fontSize: 10, color: "#b0b7c3", marginBottom: 16 }}>
                            لا يمكن التراجع عن هذا الإجراء
                        </div>
                        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                            <button className="cf-btn-ghost" onClick={() => setDeleteTarget(null)}>إلغاء</button>
                            <button disabled={deleteMut.isPending}
                                onClick={() => {
                                    deleteMut.mutate(deleteTarget.field_name, {
                                        onSuccess: r => { if (r.success) setDeleteTarget(null) },
                                    })
                                }}
                                style={{
                                    display: "inline-flex", alignItems: "center", gap: 5,
                                    padding: "7px 18px", borderRadius: 8, border: "none",
                                    background: "#ef4444", color: "#fff",
                                    fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                                    boxShadow: "0 2px 8px rgba(239,68,68,.2)",
                                }}>
                                {deleteMut.isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} حذف
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )
}
