import { useState } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { useDynamicFields, useCreateDynamicField, useUpdateDynamicField, useDeleteDynamicField } from "../hooks/use-teams-tags"
import type { DynamicField, DynamicFieldType } from "../types/teams-tags"
import {
    Plus, Trash2, Pencil, X, Loader2, Search,
    AlertTriangle, Check, MoreVertical, ArrowUpDown,
    FileSliders, Settings2,
} from "lucide-react"
import { ActionGuard } from "@/components/guards/ActionGuard"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"

/* ═══════════════════════════════════════
   CSS
═══════════════════════════════════════ */
const CSS = `
.cf-table { width:100%; border-collapse:separate; border-spacing:0; }
.cf-table thead th {
    padding:8px 12px; font-size:11px; font-weight:600; color:var(--t-text-secondary);
    text-align:right; border-bottom:1px solid var(--t-border); white-space:nowrap;
    background:var(--t-surface);
}
.cf-table tbody td {
    padding:9px 12px; font-size:12px; color:var(--t-text); border-bottom:1px solid var(--t-border-light);
    vertical-align:middle;
}
.cf-table tbody tr { transition:background .1s; }
.cf-table tbody tr:hover { background:color-mix(in srgb,var(--t-accent) 3%,transparent); }
.cf-table tbody tr:last-child td { border-bottom:none; }
.cf-th-sort { display:inline-flex; align-items:center; gap:3px; cursor:pointer; user-select:none; }
.cf-th-sort:hover { color:var(--t-accent); }

.cf-field {
    width:100%; padding:8px 11px; border-radius:8px; border:1.5px solid var(--t-border);
    background:var(--t-surface); font-size:12px; color:var(--t-text); outline:none;
    transition:border-color .15s,box-shadow .15s; box-sizing:border-box; font-family:inherit;
}
.cf-field:focus { border-color:var(--t-accent); box-shadow:0 0 0 2px color-mix(in srgb,var(--t-accent) 10%,transparent); }
.cf-field::placeholder { color:var(--t-text-faint); opacity:.6; }

.cf-label { font-size:10px; font-weight:700; color:var(--t-text-secondary); display:flex; align-items:center; gap:3px; margin-bottom:4px; }
.cf-label-hint { font-size:9px; font-weight:500; color:var(--t-text-faint); margin-right:auto; }

.cf-btn-primary {
    display:inline-flex; align-items:center; gap:5px; padding:7px 14px; border-radius:8px;
    border:none; background:var(--t-accent); color:var(--t-text-on-accent); font-size:12px;
    font-weight:700; cursor:pointer; transition:opacity .12s; font-family:inherit;
}
.cf-btn-primary:hover:not(:disabled) { opacity:.88; }
.cf-btn-primary:disabled { opacity:.5; cursor:not-allowed; }

.cf-btn-ghost {
    display:inline-flex; align-items:center; gap:5px; padding:6px 12px; border-radius:8px;
    border:1.5px solid var(--t-border); background:transparent; color:var(--t-text);
    font-size:11px; font-weight:600; cursor:pointer; transition:all .12s; font-family:inherit;
}
.cf-btn-ghost:hover { border-color:var(--t-accent); color:var(--t-accent); }

.cf-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }

.cf-actions-btn {
    width:26px; height:26px; border-radius:6px; border:none; background:transparent;
    cursor:pointer; display:flex; align-items:center; justify-content:center;
    color:var(--t-text-faint); transition:all .1s;
}
.cf-actions-btn:hover { background:var(--t-surface); color:var(--t-text); }

.cf-actions-menu {
    position:absolute; left:0; top:100%; margin-top:2px; z-index:20;
    background:var(--t-card); border:1px solid var(--t-border); border-radius:8px;
    box-shadow:0 6px 20px rgba(0,0,0,.1); min-width:120px; padding:3px;
    animation:cfMenuIn .1s ease-out;
}
.cf-actions-menu button {
    width:100%; padding:6px 10px; border:none; background:transparent; cursor:pointer;
    display:flex; align-items:center; gap:6px; border-radius:6px;
    font-size:11px; font-weight:600; color:var(--t-text); transition:background .08s;
    font-family:inherit; text-align:right;
}
.cf-actions-menu button:hover { background:var(--t-surface); }
.cf-actions-menu button.danger { color:var(--t-danger); }
.cf-actions-menu button.danger:hover { background:rgba(239,68,68,.06); }

.cf-type-badge {
    display:inline-flex; align-items:center; gap:4px; padding:2px 10px;
    border-radius:6px; font-size:10px; font-weight:700;
    background:var(--t-surface); border:1px solid var(--t-border-light); color:var(--t-text-secondary);
}

.cf-active-dot {
    width:7px; height:7px; border-radius:50%; display:inline-block;
}

.cf-select {
    width:100%; padding:8px 11px; border-radius:8px; border:1.5px solid var(--t-border);
    background:var(--t-surface); font-size:12px; color:var(--t-text); outline:none;
    font-family:inherit; cursor:pointer; appearance:auto;
    transition:border-color .15s,box-shadow .15s;
}
.cf-select:focus { border-color:var(--t-accent); box-shadow:0 0 0 2px color-mix(in srgb,var(--t-accent) 10%,transparent); }

.cf-toggle-track {
    width:36px; height:20px; border-radius:12px; cursor:pointer; position:relative;
    transition:background .2s; border:none; padding:0; display:inline-block;
}
.cf-toggle-track::after {
    content:''; position:absolute; top:2px; width:16px; height:16px; border-radius:50%;
    background:#fff; transition:right .2s,left .2s; box-shadow:0 1px 3px rgba(0,0,0,.2);
}
.cf-toggle-track.on { background:var(--t-accent); }
.cf-toggle-track.on::after { right:2px; left:auto; }
.cf-toggle-track.off { background:var(--t-border); }
.cf-toggle-track.off::after { right:auto; left:2px; }

@keyframes cfIn { from{opacity:0;transform:scale(.97) translateY(6px)} to{opacity:1;transform:scale(1) translateY(0)} }
@keyframes cfMenuIn { from{opacity:0;transform:translateY(-3px)} to{opacity:1;transform:translateY(0)} }
`

/* ─── Type Labels ─── */
const TYPE_LABELS: Record<DynamicFieldType, string> = {
    text: "نص",
    number: "رقم",
    email: "بريد إلكتروني",
    phone: "هاتف",
    date: "تاريخ",
    boolean: "نعم/لا",
    select: "قائمة اختيار",
    multi_select: "قائمة متعددة",
    url: "رابط",
    textarea: "نص طويل",
}

const FIELD_TYPES: DynamicFieldType[] = [
    "text", "number", "email", "phone", "date",
    "boolean", "select", "multi_select", "url", "textarea",
]

function fmtDate(d?: string) {
    if (!d) return "—"
    try {
        return new Intl.DateTimeFormat("en-US", {
            month: "short", day: "numeric", year: "numeric",
            timeZone: "Asia/Aden",
        }).format(new Date(d))
    } catch { return d }
}

/* ─── Modal ─── */
function Modal({ title, width = 480, onClose, children }: {
    title: string; width?: number; onClose: () => void; children: React.ReactNode
}) {
    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div onClick={e => e.stopPropagation()} dir="rtl" style={{
                borderRadius: 14, background: "var(--t-card)", border: "1px solid var(--t-border)",
                width: "100%", maxWidth: width, margin: 16, animation: "cfIn .15s ease-out",
                maxHeight: "88vh", display: "flex", flexDirection: "column",
                boxShadow: "0 12px 40px rgba(0,0,0,.1)",
            }}>
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 16px", borderBottom: "1px solid var(--t-border-light)", flexShrink: 0,
                }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "var(--t-text)" }}>{title}</div>
                    <button onClick={onClose} style={{
                        width: 24, height: 24, borderRadius: 6, background: "transparent",
                        border: "none", cursor: "pointer", color: "var(--t-text-faint)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--t-surface)" }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                    >
                        <X size={14} />
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

    // Auto-generate field_name from field_label (only on create)
    const handleLabelChange = (val: string) => {
        setFieldLabel(val)
        if (!isEdit) {
            setFieldName(val.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "").slice(0, 50))
        }
    }

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        if (isEdit) {
            updateMut.mutate({
                fieldName: field.field_name,
                payload: {
                    field_label: fieldLabel,
                    label_ar: labelAr || undefined,
                    label_en: labelEn || undefined,
                    required,
                    default_value: defaultValue || undefined,
                    options: needsOptions ? options.split(",").map(o => o.trim()).filter(Boolean) : undefined,
                    is_active: isActive,
                    display_order: displayOrder ? parseInt(displayOrder) : undefined,
                    description: description || undefined,
                },
            }, { onSuccess: r => { if (r.success) onClose() } })
        } else {
            createMut.mutate({
                field_name: fieldName,
                field_label: fieldLabel,
                label_ar: labelAr || undefined,
                label_en: labelEn || undefined,
                field_type: fieldType,
                required,
                default_value: defaultValue || undefined,
                options: needsOptions ? options.split(",").map(o => o.trim()).filter(Boolean) : undefined,
                is_active: isActive,
                display_order: displayOrder ? parseInt(displayOrder) : undefined,
                description: description || undefined,
            }, { onSuccess: r => { if (r.success) onClose() } })
        }
    }

    const isPending = createMut.isPending || updateMut.isPending

    return (
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Name + Field ID */}
            <div>
                <label className="cf-label">الاسم <span style={{ color: "var(--t-danger)" }}>*</span></label>
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
                    dir="ltr" style={{ fontFamily: "monospace", fontSize: 11, opacity: isEdit ? 0.6 : 1 }} />
            </div>

            {/* Description */}
            <div>
                <label className="cf-label">
                    الوصف
                    <span className="cf-label-hint">اختياري</span>
                </label>
                <input className="cf-field" value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="وصف مختصر للحقل" maxLength={500} />
            </div>

            {/* Type */}
            <div>
                <label className="cf-label">
                    النوع
                    {isEdit && <span className="cf-label-hint">لا يمكن تغيير النوع بعد الإنشاء</span>}
                </label>
                <select className="cf-select" value={fieldType}
                    onChange={e => setFieldType(e.target.value as DynamicFieldType)}
                    disabled={isEdit}
                    style={{ opacity: isEdit ? 0.6 : 1 }}
                >
                    {FIELD_TYPES.map(t => (
                        <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                    ))}
                </select>
            </div>

            {/* Options for select types */}
            {needsOptions && (
                <div>
                    <label className="cf-label">الخيارات <span style={{ color: "var(--t-danger)" }}>*</span></label>
                    <input className="cf-field" value={options} onChange={e => setOptions(e.target.value)}
                        placeholder="ذكر, أنثى, آخر (مفصولة بفاصلة)" required />
                    <div style={{ fontSize: 9, color: "var(--t-text-faint)", marginTop: 3 }}>
                        افصل بين الخيارات بفاصلة
                    </div>
                </div>
            )}

            {/* Labels row */}
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

            {/* Default + Order */}
            <div className="cf-grid-2">
                <div>
                    <label className="cf-label">القيمة الافتراضية</label>
                    <input className="cf-field" value={defaultValue} onChange={e => setDefaultValue(e.target.value)}
                        placeholder="فارغ" maxLength={500} />
                </div>
                <div>
                    <label className="cf-label">ترتيب العرض</label>
                    <input className="cf-field" type="number" value={displayOrder}
                        onChange={e => setDisplayOrder(e.target.value)} placeholder="0" min={0} />
                </div>
            </div>

            {/* Toggles */}
            <div style={{ display: "flex", gap: 20, alignItems: "center", padding: "4px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button type="button"
                        className={`cf-toggle-track ${required ? "on" : "off"}`}
                        onClick={() => setRequired(!required)}
                    />
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--t-text-secondary)" }}>حقل مطلوب</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button type="button"
                        className={`cf-toggle-track ${isActive ? "on" : "off"}`}
                        onClick={() => setIsActive(!isActive)}
                    />
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--t-text-secondary)" }}>نشط</span>
                </div>
            </div>

            {/* Actions */}
            <div style={{
                display: "flex", gap: 8, justifyContent: "flex-end",
                paddingTop: 6, borderTop: "1px solid var(--t-border-light)", marginTop: 2,
            }}>
                <button type="button" className="cf-btn-ghost" onClick={onClose}>إلغاء</button>
                <button type="submit" className="cf-btn-primary"
                    disabled={isPending || !fieldLabel.trim() || !fieldName.trim()}>
                    {isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    {isEdit ? "حفظ التغييرات" : "إضافة"}
                </button>
            </div>
        </form>
    )
}

/* ─── Actions Dropdown ─── */
function ActionsDropdown({ onEdit, onDelete }: {
    onEdit: () => void; onDelete: () => void
}) {
    const [open, setOpen] = useState(false)
    return (
        <div style={{ position: "relative", zIndex: open ? 20 : 1 }}>
            <button className="cf-actions-btn" onClick={(e) => { e.stopPropagation(); setOpen(!open) }}>
                <MoreVertical size={14} />
            </button>
            {open && (
                <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 15 }} onClick={() => setOpen(false)} />
                    <div className="cf-actions-menu" dir="rtl">
                        <ActionGuard pageBit={PAGE_BITS.CONTACT_FIELDS} actionBit={ACTION_BITS.UPDATE_DYNAMIC_FIELD}>
                            <button onClick={() => { onEdit(); setOpen(false) }}>
                                <Pencil size={12} /> تعديل
                            </button>
                        </ActionGuard>
                        <ActionGuard pageBit={PAGE_BITS.CONTACT_FIELDS} actionBit={ACTION_BITS.DELETE_DYNAMIC_FIELD}>
                            <button className="danger" onClick={() => { onDelete(); setOpen(false) }}>
                                <Trash2 size={12} /> حذف
                            </button>
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
    const [sortField, setSortField] = useState<"field_name" | "created_at">("field_name")
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
            if (sortField === "field_name") return a.field_name.localeCompare(b.field_name) * dir
            return ((a.created_at ?? "") > (b.created_at ?? "") ? 1 : -1) * dir
        })

    const toggleSort = (field: "field_name" | "created_at") => {
        if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc")
        else { setSortField(field); setSortDir("asc") }
    }

    const openEdit = (f: DynamicField) => { setEditField(f); setShowForm(true) }
    const openCreate = () => { setEditField(undefined); setShowForm(true) }

    return (
        <div style={{ direction: "rtl" }}>
            <style>{CSS}</style>

            {/* Header description */}
            <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
                padding: "10px 14px", borderRadius: 10,
                background: "var(--t-surface)", border: "1px solid var(--t-border-light)",
            }}>
                <Settings2 size={14} style={{ color: "var(--t-text-faint)", flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "var(--t-text-secondary)" }}>
                    إنشاء وإدارة حقول جهات الاتصال لحفظ معلومات إضافية عن عملائك. يمكنك تصنيف جهات الاتصال بناءً على هذه المعلومات.
                </span>
            </div>

            {/* Toolbar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ position: "relative", width: 220 }}>
                    <Search size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--t-text-faint)", pointerEvents: "none" }} />
                    <input className="cf-field" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="بحث في الحقول" style={{ paddingInlineEnd: 32, fontSize: 11 }} />
                </div>
                <ActionGuard pageBit={PAGE_BITS.CONTACT_FIELDS} actionBit={ACTION_BITS.CREATE_DYNAMIC_FIELD}>
                    <button className="cf-btn-primary" onClick={openCreate}>
                        <Plus size={13} /> + إضافة حقل مخصص
                    </button>
                </ActionGuard>
            </div>

            {/* Table */}
            <div style={{ borderRadius: 10, border: "1px solid var(--t-border)", background: "var(--t-card)", overflow: "visible" }}>
                {isLoading ? (
                    <div style={{ textAlign: "center", padding: "40px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "var(--t-text-faint)", fontSize: 12 }}>
                        <Loader2 size={15} className="animate-spin" /> جاري التحميل...
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <FileSliders size={28} style={{ margin: "0 auto 8px", display: "block", color: "var(--t-text-faint)", opacity: .25 }} />
                        <div style={{ fontSize: 13, color: "var(--t-text-secondary)", fontWeight: 600 }}>
                            {search ? "لا توجد نتائج" : "لا توجد حقول مخصصة بعد"}
                        </div>
                        {!search && (
                            <button className="cf-btn-primary" onClick={openCreate} style={{ marginTop: 10 }}>
                                <Plus size={13} /> أضف أول حقل
                            </button>
                        )}
                    </div>
                ) : (
                    <table className="cf-table">
                        <thead>
                            <tr>
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
                            {filtered.map((f: DynamicField) => (
                                <tr key={f.id ?? f.field_name}>
                                    <td>
                                        <span style={{ fontWeight: 600, fontSize: 12 }}>{f.field_label || f.field_name}</span>
                                    </td>
                                    <td>
                                        <code style={{ fontSize: 10, color: "var(--t-text-secondary)", background: "var(--t-surface)", padding: "2px 6px", borderRadius: 4 }}>
                                            {f.field_name}
                                        </code>
                                    </td>
                                    <td><span style={{ color: "var(--t-text-secondary)", fontSize: 11 }}>{f.description || "—"}</span></td>
                                    <td>
                                        <span className="cf-type-badge">
                                            {TYPE_LABELS[f.field_type] || f.field_type}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                            <span className="cf-active-dot" style={{
                                                background: f.is_active ? "#10b981" : "var(--t-text-faint)",
                                            }} />
                                            <span style={{ fontSize: 11, color: "var(--t-text-secondary)" }}>
                                                {f.is_active ? "نشط" : "معطل"}
                                            </span>
                                        </div>
                                    </td>
                                    <td><span style={{ fontSize: 11, color: "var(--t-text-secondary)", whiteSpace: "nowrap" }}>{fmtDate(f.created_at)}</span></td>
                                    <td>
                                        <ActionsDropdown onEdit={() => openEdit(f)} onDelete={() => setDeleteTarget(f)} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modals */}
            {showForm && (
                <Modal title={editField ? `تعديل: ${editField.field_label}` : "إضافة حقل مخصص"} width={480} onClose={() => setShowForm(false)}>
                    <FieldForm field={editField} tenantId={tid} onClose={() => setShowForm(false)} />
                </Modal>
            )}

            {deleteTarget && (
                <Modal title="تأكيد الحذف" width={380} onClose={() => setDeleteTarget(null)}>
                    <div style={{ textAlign: "center", padding: "4px 0" }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 12,
                            background: "rgba(239,68,68,.08)", margin: "0 auto 12px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <AlertTriangle size={20} style={{ color: "var(--t-danger)" }} />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text)", marginBottom: 4 }}>
                            حذف حقل «{deleteTarget.field_label}»؟
                        </div>
                        <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginBottom: 6 }}>
                            <strong>تحذير:</strong> حذف نهائي — سيُزال الحقل من جميع جهات الاتصال.
                        </div>
                        <div style={{ fontSize: 10, color: "var(--t-text-faint)", marginBottom: 16 }}>
                            لا يمكن التراجع عن هذا الإجراء
                        </div>
                        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                            <button className="cf-btn-ghost" onClick={() => setDeleteTarget(null)}>إلغاء</button>
                            <button
                                disabled={deleteMut.isPending}
                                onClick={() => {
                                    deleteMut.mutate(deleteTarget.field_name, {
                                        onSuccess: r => { if (r.success) setDeleteTarget(null) },
                                    })
                                }}
                                style={{
                                    display: "inline-flex", alignItems: "center", gap: 5,
                                    padding: "7px 18px", borderRadius: 8, border: "none",
                                    background: "var(--t-danger)", color: "#fff",
                                    fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                                }}>
                                {deleteMut.isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} حذف
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}
