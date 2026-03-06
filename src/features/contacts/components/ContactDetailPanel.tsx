import { useState, useEffect, useMemo } from "react"
import {
    X, Edit3, Trash2, User, Phone, Mail, Globe, Tag, Bot,
    MessageSquare, Clock, Calendar, Users, Save, XCircle,
    FileSliders, Loader2, UserMinus, RefreshCw,
} from "lucide-react"
import { useContactDetail } from "../hooks/use-contacts"
import { useContactLookups } from "../hooks/use-contact-lookups"
import { useContactsStore } from "../store/contacts.store"
import {
    useUpdateContact,
    useUpdateContactCustomFields,
    useDeleteContact,
    useConvertContact,
} from "../hooks/use-contact-mutations"
import { useDynamicFields } from "../../settings/hooks/use-contact-fields"
import { useAuthStore } from "@/stores/auth-store"
import type { DynamicField } from "../../settings/types/contact-fields.types"
import { usePermissions } from "@/lib/usePermissions"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"

function formatDate(str?: string | null): string {
    if (!str) return "—"
    return new Date(str).toLocaleDateString("ar", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
        timeZone: "Asia/Aden",
    })
}

const CSS = `
@keyframes cdFade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
.cd-root{width:340px;min-width:340px;height:100%;display:flex;flex-direction:column;background:#fff;border-right:1px solid #ebeef2;overflow:hidden}
.cd-empty{width:340px;min-width:340px;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#fff;border-right:1px solid #ebeef2;gap:8px;padding:24px}
.cd-header{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid #ebeef2;flex-shrink:0;background:#fff}
.cd-hdr-title{font-size:13px;font-weight:700;color:#111827}
.cd-hdr-actions{display:flex;gap:3px}
.cd-icon-btn{width:26px;height:26px;border-radius:6px;border:1px solid #ebeef2;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#9ca3af;transition:all .12s}
.cd-icon-btn:hover{background:#f5f6f8;color:#6b7280}
.cd-icon-btn-danger:hover{background:rgba(239,68,68,.06);color:#ef4444;border-color:rgba(239,68,68,.2)}
.cd-icon-btn-save{border-color:#16a34a;color:#16a34a}
.cd-icon-btn-save:hover{background:rgba(22,163,74,.06);color:#16a34a}
.cd-scroll{flex:1;overflow-y:auto;padding:0}
.cd-scroll::-webkit-scrollbar{width:3px}
.cd-scroll::-webkit-scrollbar-thumb{background:rgba(0,0,0,.08);border-radius:3px}
.cd-profile{display:flex;align-items:center;gap:10px;padding:14px 14px 12px}
.cd-avatar{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#004786,#0072b5);color:#fff;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;flex-shrink:0}
.cd-avatar-img{width:42px;height:42px;border-radius:50%;object-fit:cover;flex-shrink:0}
.cd-name{font-size:15px;font-weight:700;color:#111827;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cd-id{font-size:10px;color:#b0b7c3;font-family:monospace}
.cd-badges{display:flex;gap:5px;padding:0 14px 10px;flex-wrap:wrap}
.cd-badge{font-size:9.5px;font-weight:700;padding:2px 8px;border-radius:6px;display:inline-flex;align-items:center;gap:3px;text-transform:capitalize}
.cd-badge-open{background:rgba(22,163,74,.06);color:#16a34a}
.cd-badge-closed{background:rgba(239,68,68,.06);color:#ef4444}
.cd-badge-session{background:#f5f6f8;color:#9ca3af}
.cd-badge-pending{background:rgba(245,158,11,.06);color:#f59e0b}
.cd-badge-ai{background:rgba(0,71,134,.06);color:#004786}
.cd-section{padding:10px 14px;border-top:1px solid #f0f1f3}
.cd-sec-title{font-size:10px;font-weight:700;color:#b0b7c3;text-transform:uppercase;letter-spacing:.05em;margin-bottom:7px;display:flex;align-items:center;gap:4px}
.cd-info-row{display:flex;align-items:center;gap:7px;padding:3px 0;font-size:12px}
.cd-info-label{font-weight:500;color:#9ca3af;min-width:65px;flex-shrink:0;font-size:11px}
.cd-info-value{color:#111827;font-weight:400;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}
.cd-tags{display:flex;gap:4px;flex-wrap:wrap}
.cd-tag{font-size:9.5px;font-weight:600;padding:2px 7px;border-radius:6px;background:#f5f6f8;color:#6b7280;display:inline-flex;align-items:center;gap:2px}
.cd-notes{font-size:12px;color:#6b7280;margin:0;line-height:1.6;background:#f9fafb;padding:8px 10px;border-radius:8px;border:1px solid #f0f1f3}
.cd-notes-edit{font-size:12px;color:#111827;margin:0;line-height:1.6;background:#fff;padding:8px 10px;border-radius:8px;border:1px solid #d1d5db;width:100%;resize:vertical;min-height:50px;font-family:inherit;outline:none;transition:border-color .15s}
.cd-notes-edit:focus{border-color:#004786}
.cd-last-msg{font-size:12px;color:#111827;margin:0 0 3px;line-height:1.5}
.cd-msg-dir{font-size:10px;color:#b0b7c3}
.cd-spinner{width:24px;height:24px;border-radius:50%;border:2.5px solid #ebeef2;border-top-color:#004786;animation:spin .7s linear infinite}
.cd-field-input{width:100%;padding:5px 8px;border:1px solid #e5e7eb;border-radius:7px;font-size:12px;font-family:inherit;background:#fff;color:#111827;outline:none;transition:border-color .15s}
.cd-field-input:focus{border-color:#004786}
.cd-name-input{font-size:15px;font-weight:700;color:#111827;border:none;border-bottom:2px solid #004786;outline:none;width:100%;background:transparent;font-family:inherit;padding:2px 0}
.cd-action-bar{display:flex;gap:6px;padding:10px 14px;border-top:1px solid #ebeef2;background:#fff;flex-shrink:0}
.cd-btn{flex:1;padding:7px 0;border:none;border-radius:8px;font-size:11.5px;font-weight:700;font-family:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;transition:all .15s}
.cd-btn-primary{background:linear-gradient(135deg,#004786,#0072b5);color:#fff;box-shadow:0 2px 8px rgba(0,71,134,.18)}
.cd-btn-primary:hover{box-shadow:0 4px 12px rgba(0,71,134,.25)}
.cd-btn-primary:disabled{background:#94a3b8;box-shadow:none;cursor:not-allowed}
.cd-btn-outline{background:#fff;color:#6b7280;border:1px solid #e5e7eb}
.cd-btn-outline:hover{background:#f5f6f8}
.cd-btn-danger{background:rgba(239,68,68,.06);color:#ef4444;border:1px solid rgba(239,68,68,.15)}
.cd-btn-danger:hover{background:rgba(239,68,68,.1)}
.cd-btn-danger:disabled{opacity:.5;cursor:not-allowed}
.cd-confirm-overlay{position:absolute;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:10;animation:cdFade .15s}
.cd-confirm-box{background:#fff;border-radius:14px;padding:20px;width:260px;text-align:center;box-shadow:0 16px 40px rgba(0,0,0,.2)}
@keyframes spin{to{transform:rotate(360deg)}}
`

export function ContactDetailPanel() {
    const { selectedContactId, selectedAccountId, setSelectedContactId } = useContactsStore()
    const { data: contact, isLoading } = useContactDetail(selectedContactId, selectedAccountId)
    const { lifecycleMap } = useContactLookups()
    const tid = useAuthStore((s) => s.user?.tenant_id) ?? ""
    const { data: dynamicFields = [] } = useDynamicFields(tid)
    const { canPerformAction } = usePermissions()
    const canUpdate = canPerformAction(PAGE_BITS.CONTACTS, ACTION_BITS.UPDATE_CONTACT)
    const canDelete = canPerformAction(PAGE_BITS.CONTACTS, ACTION_BITS.DELETE_CONTACT)
    const canConvert = canPerformAction(PAGE_BITS.CONTACTS, ACTION_BITS.CONVERT_CONTACT)

    // ── Edit mode state ──
    const [editing, setEditing] = useState(false)
    const [editName, setEditName] = useState("")
    const [editNotes, setEditNotes] = useState("")
    const [editFields, setEditFields] = useState<Record<string, string>>({})
    const [confirmDelete, setConfirmDelete] = useState(false)

    // ── Mutations (with account_id) ──
    const updateMutation = useUpdateContact(selectedContactId ?? "", selectedAccountId)
    const updateFieldsMutation = useUpdateContactCustomFields(selectedContactId ?? "", selectedAccountId)
    const deleteMutation = useDeleteContact(selectedContactId ?? "", selectedAccountId)
    const convertMutation = useConvertContact(selectedContactId ?? "", selectedAccountId)

    // Reset edit state when contact changes or editing toggled
    useEffect(() => {
        if (contact && editing) {
            setEditName(contact.sender_name || "")
            setEditNotes(contact.notes || "")
            setEditFields({ ...contact.custom_fields })
        }
    }, [contact?.customer_id, editing])

    // Reset editing when switching contacts
    useEffect(() => {
        setEditing(false)
        setConfirmDelete(false)
    }, [selectedContactId])

    const activeFields = (dynamicFields as DynamicField[])
        .filter(f => f.is_active)
        .sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999))

    // ── Has changes detection (must be before early returns — Rules of Hooks) ──
    const hasChanges = useMemo(() => {
        if (!editing || !contact) return false
        if (editName !== (contact.sender_name || "")) return true
        if (editNotes !== (contact.notes || "")) return true
        const origFields = contact.custom_fields ?? {}
        for (const [k, v] of Object.entries(editFields)) {
            if ((origFields[k] ?? "") !== v) return true
        }
        return false
    }, [editing, editName, editNotes, editFields, contact])

    // ── Early returns (after all hooks) ──
    if (isLoading) return (
        <div className="cd-empty"><style>{CSS}</style><div className="cd-spinner" /><span style={{ fontSize: 11, color: "#b0b7c3" }}>جاري التحميل…</span></div>
    )

    if (!contact) return (
        <div className="cd-empty"><style>{CSS}</style><div style={{ fontSize: 13, fontWeight: 600, color: "#9ca3af" }}>لم يتم العثور على جهة الاتصال</div></div>
    )

    const customName = [contact.custom_fields?.first_name, contact.custom_fields?.last_name].filter(Boolean).join(" ").trim()
    const name = customName || contact.sender_name?.trim() || contact.customer_id
    const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    const phone = contact.custom_fields?.phone || ""
    const email = contact.custom_fields?.email || ""
    const country = contact.custom_fields?.country || ""
    const language = contact.custom_fields?.language || ""
    const isClosed = contact.conversation_status?.is_closed
    const lc = contact.lifecycle ? lifecycleMap.get(contact.lifecycle) : null
    const resolvedTags = contact.tags ?? []
    const teamNames = contact.team_ids?.teams ?? []

    // ── Save handler ──
    const isSaving = updateMutation.isPending || updateFieldsMutation.isPending
    const handleSave = async () => {
        if (!hasChanges || isSaving) return

        // Detect what changed
        const nameChanged = editName !== (contact.sender_name || "")
        const notesChanged = editNotes !== (contact.notes || "")
        const origFields = contact.custom_fields ?? {}
        const changedFields: Record<string, string> = {}
        for (const [k, v] of Object.entries(editFields)) {
            if ((origFields[k] ?? "") !== v) changedFields[k] = v
        }

        try {
            // Update name + notes via updateContact
            if (nameChanged || notesChanged) {
                await updateMutation.mutateAsync({
                    ...(nameChanged && { sender_name: editName }),
                    ...(notesChanged && { notes: editNotes }),
                })
            }

            // Update custom fields separately
            if (Object.keys(changedFields).length > 0) {
                await updateFieldsMutation.mutateAsync(changedFields)
            }

            setEditing(false)
        } catch {
            // toast errors are handled by the mutation hooks
        }
    }

    // ── Delete handler ──
    const handleDelete = () => {
        deleteMutation.mutate(undefined, {
            onSuccess: () => {
                setConfirmDelete(false)
                setSelectedContactId(null)
            },
        })
    }

    // ── Convert handler ──
    const handleConvert = () => {
        convertMutation.mutate(!contact.is_contacts)
    }

    // ── Field type icon ──
    const typeIcon = (type: string) => {
        switch (type) {
            case "phone": return <Phone size={11} />
            case "email": return <Mail size={11} />
            case "url": return <Globe size={11} />
            case "date": return <Calendar size={11} />
            default: return <FileSliders size={11} />
        }
    }

    return (
        <div className="cd-root" style={{ animation: "cdFade .2s ease-out", position: "relative" }}>
            <style>{CSS}</style>

            {/* ── Confirm Delete Overlay ── */}
            {confirmDelete && (
                <div className="cd-confirm-overlay">
                    <div className="cd-confirm-box">
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(239,68,68,.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                            <Trash2 size={18} style={{ color: "#ef4444" }} />
                        </div>
                        <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#111827" }}>حذف جهة الاتصال</h4>
                        <p style={{ margin: "0 0 14px", fontSize: 11.5, color: "#6b7280", lineHeight: 1.5 }}>
                            سيتم إلغاء تحويل هذا العميل من جهة اتصال. هل أنت متأكد؟
                        </p>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button className="cd-btn cd-btn-outline" onClick={() => setConfirmDelete(false)} style={{ flex: 1 }}>
                                إلغاء
                            </button>
                            <button className="cd-btn cd-btn-danger" onClick={handleDelete}
                                disabled={deleteMutation.isPending} style={{ flex: 1 }}>
                                {deleteMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                {deleteMutation.isPending ? "جاري الحذف..." : "حذف"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="cd-header">
                <span className="cd-hdr-title">{editing ? "تعديل جهة الاتصال" : "تفاصيل جهة الاتصال"}</span>
                <div className="cd-hdr-actions">
                    {editing ? (
                        <>
                            <button className="cd-icon-btn cd-icon-btn-save" title="حفظ" onClick={handleSave}
                                disabled={!hasChanges || isSaving}>
                                {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                            </button>
                            <button className="cd-icon-btn" title="إلغاء التعديل" onClick={() => setEditing(false)}>
                                <XCircle size={12} />
                            </button>
                        </>
                    ) : (
                        <>
                            {canUpdate && <button className="cd-icon-btn" title="تعديل" onClick={() => setEditing(true)}>
                                <Edit3 size={12} />
                            </button>}
                            {canDelete && <button className="cd-icon-btn cd-icon-btn-danger" title="حذف"
                                onClick={() => setConfirmDelete(true)}>
                                <Trash2 size={12} />
                            </button>}
                        </>
                    )}
                    <button className="cd-icon-btn" title="إغلاق" onClick={() => setSelectedContactId(null)}>
                        <X size={12} />
                    </button>
                </div>
            </div>

            {/* Scrollable content */}
            <div className="cd-scroll">
                {/* Profile */}
                <div className="cd-profile">
                    {(contact.profile_photo || contact.platform_icon) ? (
                        <img src={contact.profile_photo || contact.platform_icon || ""} alt="" className="cd-avatar-img"
                            onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none" }} />
                    ) : (
                        <div className="cd-avatar">{initials}</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {editing ? (
                            <input className="cd-name-input" value={editName}
                                onChange={e => setEditName(e.target.value)}
                                placeholder="اسم جهة الاتصال" dir="auto" />
                        ) : (
                            <h3 className="cd-name">{name}</h3>
                        )}
                        <span className="cd-id">{contact.customer_id}</span>
                    </div>
                </div>

                {/* Badges */}
                <div className="cd-badges">
                    <span className={`cd-badge ${isClosed ? "cd-badge-closed" : "cd-badge-open"}`}>
                        {isClosed ? "مغلقة" : "مفتوحة"}
                    </span>
                    <span className={`cd-badge cd-badge-session cd-badge-${contact.session_status}`}>
                        {contact.session_status}
                    </span>
                    {contact.enable_ai && <span className="cd-badge cd-badge-ai"><Bot size={9} /> AI</span>}
                    {lc && (
                        <span className="cd-badge" style={{
                            background: lc.color ? `${lc.color}14` : "#f5f6f8",
                            color: lc.color || "#9ca3af",
                        }}>{lc.icon && <span>{lc.icon}</span>} {lc.name}</span>
                    )}
                </div>

                {/* Contact info (view mode) */}
                {!editing && (
                    <div className="cd-section">
                        <div className="cd-sec-title"><Phone size={10} /> معلومات الاتصال</div>
                        {phone && <InfoRow icon={<Phone size={11} />} label="الهاتف" value={phone} />}
                        {email && <InfoRow icon={<Mail size={11} />} label="البريد" value={email} />}
                        <InfoRow icon={<Globe size={11} />} label="المنصة" value={
                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                {contact.platform_icon && <img src={contact.platform_icon} alt="" style={{ width: 14, height: 14 }} />}
                                <span style={{ textTransform: "capitalize" }}>{contact.platform}</span>
                            </div>
                        } />
                        {country && <InfoRow icon={<Globe size={11} />} label="الدولة" value={country} />}
                        {language && <InfoRow icon={<Globe size={11} />} label="اللغة" value={language} />}
                    </div>
                )}

                {/* Editable Custom Fields */}
                {editing && (
                    <div className="cd-section">
                        <div className="cd-sec-title"><FileSliders size={10} /> حقول جهة الاتصال</div>
                        {activeFields.length === 0 ? (
                            <div style={{ fontSize: 11, color: "#b0b7c3", fontStyle: "italic" }}>لا توجد حقول مخصصة</div>
                        ) : activeFields.map((field: DynamicField) => {
                            const currentVal = editFields[field.field_name] ?? ""
                            const label = field.label_ar || field.field_label
                            const inputDir = ["email", "phone", "url", "number"].includes(field.field_type) ? "ltr" : "rtl"
                            return (
                                <div key={field.field_name} style={{ marginBottom: 8 }}>
                                    <label style={{
                                        display: "flex", alignItems: "center", gap: 4,
                                        fontSize: 10.5, fontWeight: 600, color: "#6b7280",
                                        marginBottom: 3,
                                    }}>
                                        <span style={{ display: "flex", color: "#9ca3af" }}>{typeIcon(field.field_type)}</span>
                                        {label}
                                    </label>
                                    {field.field_type === "boolean" ? (
                                        <select className="cd-field-input" value={currentVal}
                                            onChange={e => setEditFields(prev => ({ ...prev, [field.field_name]: e.target.value }))}>
                                            <option value="">—</option>
                                            <option value="true">نعم</option>
                                            <option value="false">لا</option>
                                        </select>
                                    ) : field.field_type === "select" ? (
                                        <select className="cd-field-input" value={currentVal}
                                            onChange={e => setEditFields(prev => ({ ...prev, [field.field_name]: e.target.value }))}>
                                            <option value="">—</option>
                                            {(field.options ?? []).map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    ) : field.field_type === "textarea" ? (
                                        <textarea className="cd-notes-edit" value={currentVal}
                                            onChange={e => setEditFields(prev => ({ ...prev, [field.field_name]: e.target.value }))}
                                            rows={2} placeholder={`إضافة ${label}`} />
                                    ) : (
                                        <input className="cd-field-input" dir={inputDir}
                                            type={field.field_type === "number" ? "number" : field.field_type === "date" ? "date" : field.field_type === "email" ? "email" : "text"}
                                            value={currentVal}
                                            onChange={e => setEditFields(prev => ({ ...prev, [field.field_name]: e.target.value }))}
                                            placeholder={`إضافة ${label}`} />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Notes */}
                <div className="cd-section">
                    <div className="cd-sec-title">ملاحظات</div>
                    {editing ? (
                        <textarea className="cd-notes-edit" value={editNotes}
                            onChange={e => setEditNotes(e.target.value)}
                            placeholder="إضافة ملاحظات..." rows={3} />
                    ) : (
                        contact.notes ? <p className="cd-notes">{contact.notes}</p>
                            : <span style={{ fontSize: 11, color: "#b0b7c3", fontStyle: "italic" }}>لا توجد ملاحظات</span>
                    )}
                </div>

                {/* Assignment (view only) */}
                {!editing && (contact.assigned?.is_assigned || teamNames.length > 0) && (
                    <div className="cd-section">
                        <div className="cd-sec-title"><Users size={10} /> التعيين</div>
                        {contact.assigned?.is_assigned && (
                            <InfoRow icon={<User size={11} />} label="معين إلى" value={contact.assigned.assigned_to_username || "—"} />
                        )}
                        {teamNames.length > 0 && (
                            <InfoRow icon={<MessageSquare size={11} />} label="الفرق" value={
                                <div className="cd-tags">
                                    {teamNames.map(t => (
                                        <span key={t.team_id} className="cd-tag">{t.name}</span>
                                    ))}
                                </div>
                            } />
                        )}
                    </div>
                )}

                {/* Tags */}
                {!editing && resolvedTags.length > 0 && (
                    <div className="cd-section">
                        <div className="cd-sec-title"><Tag size={10} /> الوسوم</div>
                        <div className="cd-tags">
                            {resolvedTags.map((t, i) => (
                                <span key={i} className="cd-tag">{t.emoji && <span>{t.emoji}</span>} {t.name}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Last message */}
                {!editing && contact.last_message && (
                    <div className="cd-section">
                        <div className="cd-sec-title"><MessageSquare size={10} /> آخر رسالة</div>
                        <p className="cd-last-msg">{contact.last_message}</p>
                        <span className="cd-msg-dir">
                            {contact.last_direction === "outbound" ? "↗ صادرة" : "↙ واردة"}
                        </span>
                    </div>
                )}

                {/* Dates */}
                {!editing && (
                    <div className="cd-section">
                        <div className="cd-sec-title"><Calendar size={10} /> التواريخ</div>
                        <InfoRow icon={<Calendar size={11} />} label="الإنشاء" value={formatDate(contact.created_at)} />
                        <InfoRow icon={<Clock size={11} />} label="التحديث" value={formatDate(contact.updated_at)} />
                        <InfoRow icon={<Calendar size={11} />} label="آخر نشاط" value={formatDate(contact.last_timestamp)} />
                    </div>
                )}
            </div>

            {/* ── Action Bar (non-edit mode) ── */}
            {!editing && canConvert && (
                <div className="cd-action-bar">
                    <button className="cd-btn cd-btn-outline" onClick={handleConvert}
                        disabled={convertMutation.isPending}
                        title={contact.is_contacts ? "إلغاء التحويل" : "تحويل إلى جهة اتصال"}>
                        {convertMutation.isPending
                            ? <Loader2 size={12} className="animate-spin" />
                            : contact.is_contacts ? <UserMinus size={12} /> : <RefreshCw size={12} />}
                        {contact.is_contacts ? "إلغاء التحويل" : "تحويل لجهة اتصال"}
                    </button>
                </div>
            )}

            {/* ── Save Bar (edit mode) ── */}
            {editing && hasChanges && (
                <div className="cd-action-bar">
                    <button className="cd-btn cd-btn-outline" onClick={() => setEditing(false)}>
                        <XCircle size={12} /> إلغاء
                    </button>
                    <button className="cd-btn cd-btn-primary" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                        {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
                    </button>
                </div>
            )}
        </div>
    )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
    return (
        <div className="cd-info-row">
            <span style={{ color: "#b0b7c3", flexShrink: 0, display: "flex" }}>{icon}</span>
            <span className="cd-info-label">{label}</span>
            <span className="cd-info-value">{value}</span>
        </div>
    )
}
