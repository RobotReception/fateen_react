import { useState, useEffect, useRef, useMemo } from "react"
import {
    Phone, Tag, Users, Calendar, Hash, Bot, Mail,
    Contact, MessageSquare, Clock, Globe, Plus, X, Search,
    FileSliders, Loader2, Activity, RefreshCw,
} from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { invalidateCustomerCaches } from "@/lib/query-keys"
import type { Customer } from "../../types/inbox.types"
import { Avatar } from "../ui/Avatar"
import { addCustomerTags, removeCustomerTags, updateContactCustomFields } from "../../services/inbox-service"
import type { ActivityEvent } from "../../services/inbox-service"
import { useTags } from "../../../settings/hooks/use-tags"
import { useDynamicFields } from "../../../settings/hooks/use-contact-fields"
import { useAuthStore } from "@/stores/auth-store"
import type { Tag as TagType, DynamicField } from "../../../settings/types/teams-tags"
import { useSessionActivity } from "../../hooks/use-session-activity"
import { usePermissions } from "@/lib/usePermissions"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"

interface Props { customer: Customer }

type Tab = "contact" | "conversation" | "activity"

export function ConversationDetails({ customer: c }: Props) {
    const [tab, setTab] = useState<Tab | null>(null)

    const toggleTab = (t: Tab) => setTab(prev => prev === t ? null : t)

    // Listen for avatar click from header
    useEffect(() => {
        const handler = () => setTab(prev => prev === "contact" ? null : "contact")
        window.addEventListener("open-contact-details", handler)
        return () => window.removeEventListener("open-contact-details", handler)
    }, [])

    return (
        <div className="cd-panel" dir="rtl" data-collapsed={tab === null}>
            {/* ── Icon Tabs (right edge) ── */}
            <div className="cd-tabs">
                <TabIcon icon={<Contact size={16} />} active={tab === "contact"}
                    onClick={() => toggleTab("contact")} title="تفاصيل الاتصال" />
                <TabIcon icon={<MessageSquare size={16} />} active={tab === "conversation"}
                    onClick={() => toggleTab("conversation")} title="تفاصيل المحادثة" />
                <TabIcon icon={<Activity size={16} />} active={tab === "activity"}
                    onClick={() => toggleTab("activity")} title="سجل الأحداث" />
            </div>

            {/* ── Content area (only when a tab is active) ── */}
            {tab && (
                <div className="cd-content">
                    {tab === "contact" ? (
                        <ContactTab customer={c} />
                    ) : tab === "conversation" ? (
                        <ConversationTab customer={c} />
                    ) : (
                        <ActivityTab customer={c} />
                    )}
                </div>
            )}

            <style>{`
                .cd-panel {
                    height:100%;
                    display:flex; flex-direction:row-reverse;
                    border-right:1px solid var(--t-border-light);
                    background:var(--t-card);
                    transition:width .2s ease;
                    width:300px; min-width:300px;
                }
                .cd-panel[data-collapsed="true"] {
                    width:42px; min-width:42px;
                }
                .cd-tabs {
                    width:40px; flex-shrink:0;
                    border-right:1px solid var(--t-border-light);
                    display:flex; flex-direction:column; align-items:center;
                    padding:8px 0; gap:2px;
                    background:var(--t-surface);
                }
                .cd-tab-icon {
                    width:32px; height:32px; border-radius:8px;
                    border:none; background:transparent; cursor:pointer;
                    display:flex; align-items:center; justify-content:center;
                    color:var(--t-text-muted);
                    transition:all .12s;
                }
                .cd-tab-icon:hover { background:var(--t-accent-muted); color:var(--t-accent); }
                .cd-tab-icon[data-active="true"] {
                    background:var(--t-accent-muted); color:var(--t-accent);
                    box-shadow:inset 3px 0 0 var(--t-accent);
                }
                .cd-content {
                    flex:1; overflow-y:auto; padding:0;
                    min-width:0;
                }

                /* ── Section Header ── */
                .cd-section-header {
                    display:flex; align-items:center; justify-content:space-between;
                    padding:10px 14px 6px;
                }
                .cd-section-title {
                    font-size:12px; font-weight:700;
                    color:var(--t-text); margin:0;
                }
                .cd-section-link {
                    font-size:11px; color:var(--t-accent); cursor:pointer;
                    border:none; background:transparent; font-family:inherit;
                    font-weight:600; text-decoration:none;
                }
                .cd-section-link:hover { text-decoration:underline; }

                /* ── Profile Card ── */
                .cd-profile {
                    display:flex; align-items:center; gap:10px;
                    padding:14px 14px 10px;
                }
                .cd-profile-avatar {
                    width:44px; height:44px; border-radius:50%;
                    object-fit:cover; flex-shrink:0;
                }
                .cd-profile-name {
                    font-size:14px; font-weight:700;
                    color:var(--t-text); margin:0;
                    line-height:1.3;
                }
                .cd-profile-id {
                    font-size:11px; color:var(--t-text-faint);
                    margin:1px 0 0; font-weight:400;
                }

                /* ── Channel row ── */
                .cd-channel-row {
                    display:flex; align-items:center; justify-content:space-between;
                    padding:8px 14px;
                    border-bottom:1px solid var(--t-border-light);
                }
                .cd-channel-badge {
                    display:inline-flex; align-items:center; gap:4px;
                    font-size:11px; color:var(--t-text-muted);
                }

                /* ── Field rows ── */
                .cd-field {
                    padding:8px 14px;
                    border-bottom:1px solid var(--t-border-light);
                }
                .cd-field-label {
                    font-size:10px; font-weight:600;
                    color:var(--t-text-muted);
                    margin:0 0 2px; display:flex; align-items:center; gap:4px;
                }
                .cd-field-value {
                    font-size:12.5px; font-weight:500;
                    color:var(--t-text);
                    margin:0; word-break:break-all;
                }
                .cd-field-empty {
                    font-size:12px; color:var(--t-text-faint);
                    font-style:italic; margin:0;
                }

                /* Divider */
                .cd-divider {
                    height:1px; background:var(--t-border-light);
                    margin:0;
                }

                /* ── Conversation Tab ── */
                .cd-info-card {
                    display:flex; align-items:center; gap:8px;
                    padding:8px 14px;
                    border-bottom:1px solid var(--t-border-light);
                }
                .cd-info-icon {
                    width:28px; height:28px; border-radius:7px;
                    background:var(--t-surface);
                    display:flex; align-items:center; justify-content:center;
                    color:var(--t-text-muted); flex-shrink:0;
                }
                .cd-info-label { font-size:10px; color:var(--t-text-faint); margin:0; }
                .cd-info-value { font-size:12px; font-weight:600; color:var(--t-text); margin:0; }

                .cd-badge {
                    display:inline-flex; align-items:center; gap:3px;
                    padding:2px 8px; border-radius:5px;
                    font-size:11px; font-weight:600;
                }

                /* ── Activity Timeline ── */
                .act-wrap { display:flex; flex-direction:column; height:100%; }

                .act-header {
                    display:flex; align-items:center; justify-content:space-between;
                    padding:11px 14px 10px;
                    border-bottom:1px solid var(--t-border-light);
                    position:sticky; top:0; z-index:2;
                    background:var(--t-card);
                    backdrop-filter:blur(8px);
                }
                .act-header-left {
                    display:flex; align-items:center; gap:7px;
                }
                .act-header-icon {
                    width:28px; height:28px; border-radius:8px;
                    background:linear-gradient(135deg,#0072b5,#004786);
                    display:flex; align-items:center; justify-content:center;
                    color:#fff; flex-shrink:0;
                    box-shadow:0 2px 6px rgba(0,100,200,.25);
                }
                .act-header-title {
                    font-size:12.5px; font-weight:700; color:var(--t-text); margin:0;
                }
                .act-header-sub {
                    font-size:10px; color:var(--t-text-faint); margin:0;
                }
                .act-refresh-btn {
                    width:28px; height:28px; border-radius:8px;
                    border:1px solid var(--t-border-light);
                    background:transparent; cursor:pointer;
                    display:flex; align-items:center; justify-content:center;
                    color:var(--t-text-muted); transition:all .15s;
                }
                .act-refresh-btn:hover { background:var(--t-accent-muted); color:var(--t-accent); border-color:var(--t-accent); }
                .act-refresh-btn.spinning svg { animation:actSpin .6s linear infinite; }
                @keyframes actSpin { to { transform:rotate(360deg); } }

                /* Timeline list */
                .act-list {
                    padding:10px 12px 24px;
                    display:flex; flex-direction:column; gap:0;
                }

                /* Connector line (draws from top of card to bottom, excluding last) */
                .act-connector {
                    display:flex; flex-shrink:0;
                    flex-direction:column; align-items:center;
                    width:30px;
                }
                .act-connector-dot {
                    width:10px; height:10px; border-radius:50%;
                    border:2px solid; flex-shrink:0; margin-top:13px;
                    position:relative; z-index:1;
                    box-shadow:0 0 0 3px var(--t-card);
                    transition:transform .15s;
                }
                .act-row:hover .act-connector-dot { transform:scale(1.35); }
                .act-connector-line {
                    flex:1; width:2px;
                    background:linear-gradient(to bottom, var(--act-dot-color,#94a3b8) 0%, transparent 100%);
                    opacity:.25; min-height:12px;
                    margin-top:2px;
                }
                .act-no-line .act-connector-line { display:none; }

                /* Card */
                .act-row {
                    display:flex; gap:0; align-items:stretch;
                    cursor:pointer;
                }
                .act-card {
                    flex:1; margin-bottom:6px; margin-right:4px;
                    border-radius:10px;
                    border:1px solid var(--t-border-light);
                    background:var(--t-card);
                    overflow:hidden;
                    transition:border-color .15s, box-shadow .15s;
                }
                .act-card:hover {
                    border-color:var(--act-dot-color, #94a3b8);
                    box-shadow:0 2px 12px rgba(0,0,0,.06);
                }
                .act-card[data-open="true"] {
                    border-color:var(--act-dot-color, #94a3b8);
                    box-shadow:0 3px 16px rgba(0,0,0,.09);
                }

                /* Top accent bar */
                .act-card-accent {
                    height:3px;
                    background:linear-gradient(90deg, var(--act-dot-color,#94a3b8), transparent);
                    opacity:.6;
                    display:none;
                }
                .act-card[data-open="true"] .act-card-accent { display:block; }

                /* Card summary row */
                .act-card-summary {
                    display:flex; align-items:center; gap:8px;
                    padding:8px 10px 7px;
                }
                .act-type-badge {
                    width:30px; height:30px; border-radius:8px;
                    display:flex; align-items:center; justify-content:center;
                    font-size:14px; flex-shrink:0;
                    border:1px solid;
                }
                .act-card-info { flex:1; min-width:0; }
                .act-card-title {
                    font-size:11.5px; font-weight:700;
                    color:var(--t-text); margin:0;
                    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
                }
                .act-card-meta {
                    display:flex; align-items:center; gap:5px; margin:1px 0 0;
                    font-size:10px; color:var(--t-text-faint);
                }
                .act-card-meta-dot {
                    width:2px; height:2px; border-radius:50%;
                    background:var(--t-border);
                }
                .act-chevron {
                    color:var(--t-text-faint); flex-shrink:0;
                    transition:transform .2s ease;
                }
                .act-chevron[data-open="true"] { transform:rotate(90deg); }

                /* Preview pill (visible when collapsed) */
                .act-preview {
                    display:flex; align-items:center; gap:4px;
                    padding:0 10px 8px;
                }
                .act-preview-pill {
                    display:inline-flex; align-items:center; gap:4px;
                    padding:2px 8px; border-radius:20px;
                    font-size:10px; font-weight:600;
                    background:var(--t-surface);
                    border:1px solid var(--t-border-light);
                    color:var(--t-text-secondary);
                    max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
                }
                .act-pill-old { color:var(--t-danger,#dc2626); text-decoration:line-through; }
                .act-pill-new { color:#16a34a; font-weight:700; }

                /* Expanded details panel */
                .act-expanded {
                    border-top:1px solid var(--t-border-light);
                    padding:10px 10px 12px;
                    display:flex; flex-direction:column; gap:6px;
                    animation:actSlideIn .18s ease-out;
                    background:var(--t-surface);
                }
                @keyframes actSlideIn {
                    from { opacity:0; transform:translateY(-4px); }
                    to   { opacity:1; transform:translateY(0); }
                }
                .act-detail-row {
                    display:flex; align-items:baseline; gap:4px;
                    font-size:10.5px;
                }
                .act-detail-key {
                    color:var(--t-text-faint); flex-shrink:0; min-width:60px;
                    font-weight:500;
                }
                .act-detail-val {
                    color:var(--t-text); font-weight:600;
                    word-break:break-all;
                }
                .act-detail-change {
                    display:flex; align-items:center; gap:5px; flex-wrap:wrap;
                }
                .act-old-val {
                    color:var(--t-danger,#dc2626); text-decoration:line-through;
                    font-weight:600;
                }
                .act-new-val { color:#16a34a; font-weight:700; }
                .act-arrow { color:var(--t-text-faint); font-size:11px; }

                /* event ID chip */
                .act-id-chip {
                    font-size:9px; color:var(--t-text-faint); font-family:monospace;
                    background:var(--t-border-light); border-radius:4px;
                    padding:1px 5px; margin-top:2px;
                    user-select:all; word-break:break-all;
                }

                /* Skeleton */
                .act-skeleton-card {
                    border-radius:10px; border:1px solid var(--t-border-light);
                    padding:10px; margin-bottom:6px; margin-right:4px;
                    display:flex; gap:8px; align-items:center;
                }
                .act-skeleton-circle {
                    width:30px; height:30px; border-radius:8px; flex-shrink:0;
                    background:var(--t-border-light);
                    animation:actPulse 1.4s ease-in-out infinite;
                }
                .act-skeleton-line {
                    height:9px; border-radius:5px;
                    background:var(--t-border-light);
                    animation:actPulse 1.4s ease-in-out infinite;
                }
                @keyframes actPulse { 0%,100%{opacity:.5} 50%{opacity:.9} }

                /* Empty */
                .act-empty {
                    display:flex; flex-direction:column; align-items:center;
                    justify-content:center; padding:50px 20px;
                    color:var(--t-text-faint); text-align:center;
                    gap:10px;
                }
                .act-empty-icon { font-size:40px; opacity:.4; }
                .act-empty-text { font-size:12px; font-weight:500; margin:0; }
                .act-empty-sub { font-size:10.5px; color:var(--t-text-faint); margin:0; }

                /* Counter badge */
                .act-count-badge {
                    display:inline-flex; align-items:center;
                    padding:1px 7px; border-radius:20px;
                    background:var(--t-accent-muted); color:var(--t-accent);
                    font-size:10px; font-weight:700;
                }
            `}</style>
        </div>
    )
}

/* ═════════ Tab Icon Button ═════════ */
function TabIcon({ icon, active, onClick, title }: {
    icon: React.ReactNode; active: boolean; onClick: () => void; title: string
}) {
    return (
        <button className="cd-tab-icon" data-active={active} onClick={onClick} title={title}>
            {icon}
        </button>
    )
}

/* ═════════ Contact Tab ═════════ */
function ContactTab({ customer: c }: { customer: Customer }) {
    const { user } = useAuthStore()
    const tid = user?.tenant_id ?? ""
    const { data: dynamicFields = [] } = useDynamicFields(tid)
    const queryClient = useQueryClient()
    const { canPerformAction } = usePermissions()
    const canEditFields = canPerformAction(PAGE_BITS.INBOX, ACTION_BITS.UPDATE_CUSTOM_FIELDS_INBOX)

    const [saving, setSaving] = useState(false)

    // Merge custom_fields + contact_fields into one object for display
    const fieldValues: Record<string, string> = {
        ...(c.contact_fields ?? {}),
        ...(c.custom_fields ?? {}),
    }

    // Local edits — only stores fields the user has changed
    const [localFields, setLocalFields] = useState<Record<string, string>>({})

    // Reset local edits when customer changes
    useEffect(() => {
        setLocalFields({})
    }, [c.customer_id])

    // Detect if any field has changed from server value
    const hasChanges = useMemo(() => {
        return Object.entries(localFields).some(([key, val]) => {
            const original = fieldValues[key] ?? ""
            return val !== original
        })
    }, [localFields, fieldValues])

    // Save all changed fields in one API call
    const saveAllFields = async () => {
        if (saving || !hasChanges) return
        setSaving(true)

        // Collect only changed fields
        const changedFields: Record<string, string> = {}
        for (const [key, val] of Object.entries(localFields)) {
            const original = fieldValues[key] ?? ""
            if (val !== original) changedFields[key] = val
        }

        try {
            await updateContactCustomFields(c.customer_id, changedFields)
            invalidateCustomerCaches(queryClient, c.customer_id)
            setLocalFields({})
            toast.success("تم تحديث الحقول بنجاح")
        } catch {
            toast.error("حدث خطأ أثناء الحفظ")
        } finally {
            setSaving(false)
        }
    }

    // Get icon for a field type
    const typeIcon = (type: string) => {
        switch (type) {
            case "phone": return <Phone size={11} />
            case "email": return <Mail size={11} />
            case "url": return <Globe size={11} />
            case "date": return <Calendar size={11} />
            case "boolean": return <Hash size={11} />
            default: return <FileSliders size={11} />
        }
    }

    // Active fields only, sorted by display_order
    const activeFields = (dynamicFields as DynamicField[])
        .filter(f => f.is_active)
        .sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999))

    return (
        <>
            {/* Header */}
            <div className="cd-section-header">
                <h3 className="cd-section-title">تفاصيل الاتصال</h3>
            </div>

            {/* Profile */}
            <div className="cd-profile">
                {c.profile_photo ? (
                    <img src={c.profile_photo} alt="" className="cd-profile-avatar"
                        onError={e => { e.currentTarget.style.display = "none" }} />
                ) : (
                    <Avatar name={c.sender_name || c.customer_id} size={44} />
                )}
                <div>
                    <p className="cd-profile-name">{c.sender_name || c.customer_id}</p>
                    <p className="cd-profile-id">ID: {c.customer_id}</p>
                </div>
            </div>

            {/* Channel */}
            <div className="cd-channel-row">
                <div className="cd-channel-badge">
                    {c.platform_icon && <img src={c.platform_icon} alt="" style={{ width: 14, height: 14 }} />}
                    <span>{c.platform || "—"}</span>
                </div>
                <span style={{ fontSize: 11, color: "var(--t-text-faint)" }}>القنوات</span>
            </div>

            <div className="cd-divider" />

            {/* Dynamic Contact fields */}
            <div className="cd-section-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 className="cd-section-title">حقول جهة الاتصال</h3>
            </div>

            {activeFields.length === 0 ? (
                <div style={{ padding: "8px 14px", fontSize: 11, color: "var(--t-text-faint)", fontStyle: "italic" }}>
                    لا توجد حقول مخصصة
                </div>
            ) : (
                <div style={{ padding: "4px 10px 6px" }}>
                    {activeFields.map((field: DynamicField) => {
                        const originalVal = fieldValues[field.field_name] ?? ""
                        const currentVal = localFields[field.field_name] ?? originalVal
                        const label = field.label_ar || field.field_label
                        const inputDir = field.field_type === "email" || field.field_type === "phone" || field.field_type === "url" || field.field_type === "number" ? "ltr" : "rtl"

                        const sharedStyle: React.CSSProperties = {
                            width: "100%", padding: "6px 8px",
                            border: "1px solid var(--t-border-light, #e5e7eb)",
                            borderRadius: 7, fontSize: 12, fontFamily: "inherit",
                            background: "var(--t-surface, #fafbfc)", color: "var(--t-text, #111827)",
                            outline: "none", transition: "border-color .15s",
                        }

                        return (
                            <div key={field.field_name} style={{ marginBottom: 10 }}>
                                <label style={{
                                    display: "flex", alignItems: "center", gap: 4,
                                    fontSize: 10.5, fontWeight: 600, color: "var(--t-text-muted, #6b7280)",
                                    marginBottom: 3, paddingRight: 2,
                                }}>
                                    <span style={{ display: "flex", color: "var(--t-text-faint, #9ca3af)" }}>{typeIcon(field.field_type)}</span>
                                    {label}
                                </label>

                                {field.field_type === "boolean" ? (
                                    <select
                                        value={currentVal}
                                        onChange={e => setLocalFields(prev => ({ ...prev, [field.field_name]: e.target.value }))}
                                        style={{ ...sharedStyle, cursor: "pointer" }}
                                    >
                                        <option value="">—</option>
                                        <option value="true">نعم</option>
                                        <option value="false">لا</option>
                                    </select>
                                ) : field.field_type === "select" ? (
                                    <select
                                        value={currentVal}
                                        onChange={e => setLocalFields(prev => ({ ...prev, [field.field_name]: e.target.value }))}
                                        style={{ ...sharedStyle, cursor: "pointer" }}
                                    >
                                        <option value="">—</option>
                                        {(field.options ?? []).map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ) : field.field_type === "textarea" ? (
                                    <textarea
                                        value={currentVal}
                                        onChange={e => setLocalFields(prev => ({ ...prev, [field.field_name]: e.target.value }))}
                                        rows={2}
                                        placeholder={`إضافة ${label}`}
                                        style={{ ...sharedStyle, resize: "vertical", minHeight: 40 }}
                                    />
                                ) : (
                                    <input
                                        type={field.field_type === "number" ? "number" : field.field_type === "date" ? "date" : field.field_type === "email" ? "email" : "text"}
                                        dir={inputDir}
                                        value={currentVal}
                                        onChange={e => setLocalFields(prev => ({ ...prev, [field.field_name]: e.target.value }))}
                                        placeholder={`إضافة ${label}`}
                                        style={sharedStyle}
                                    />
                                )}
                            </div>
                        )
                    })}

                    {/* Bulk Update Button — only shown if there are changes AND permission exists */}
                    {hasChanges && canEditFields && (
                        <button
                            onClick={saveAllFields}
                            disabled={saving}
                            style={{
                                width: "100%", padding: "8px 0",
                                border: "none", borderRadius: 8,
                                background: saving ? "#94a3b8" : "linear-gradient(135deg, #0072b5, #004786)",
                                color: "#fff", fontSize: 12.5, fontWeight: 700,
                                fontFamily: "inherit", cursor: saving ? "not-allowed" : "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                transition: "all .15s", marginTop: 4, marginBottom: 2,
                                boxShadow: saving ? "none" : "0 2px 8px rgba(0,71,134,0.18)",
                            }}
                        >
                            {saving && <Loader2 size={13} className="animate-spin" />}
                            {saving ? "جاري الحفظ..." : "تحديث الحقول"}
                        </button>
                    )}
                </div>
            )}

            <div className="cd-divider" />

            {/* Lifecycle */}
            {c.lifecycle && (
                <>
                    <div className="cd-section-header">
                        <h3 className="cd-section-title">دورة الحياة</h3>
                    </div>
                    <div style={{ padding: "4px 14px 10px" }}>
                        <span className="cd-badge" style={{
                            background: "var(--t-accent-muted)", color: "var(--t-accent)",
                        }}>
                            {c.lifecycle.icon && <span>{c.lifecycle.icon}</span>}
                            {c.lifecycle.name}
                        </span>
                    </div>
                </>
            )}

            {/* Teams */}
            {(c.team_ids?.teams && c.team_ids.teams.length > 0) && (
                <>
                    <div className="cd-section-header">
                        <h3 className="cd-section-title">الفرق</h3>
                    </div>
                    <div style={{ padding: "4px 14px 10px", display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {c.team_ids.teams.map(t => (
                            <span key={t.team_id} className="cd-badge" style={{ background: "var(--t-surface)", color: "var(--t-text-secondary)" }}>
                                {t.name}
                            </span>
                        ))}
                    </div>
                </>
            )}

            <div className="cd-divider" />

            {/* Tags */}
            <TagsSection customer={c} />
        </>
    )
}

/* ═════════ Tags Section ═════════ */
function TagsSection({ customer }: { customer: Customer }) {
    const { user } = useAuthStore()
    const tid = user?.tenant_id ?? ""
    const { data: allTags = [] } = useTags(tid)
    const queryClient = useQueryClient()
    const { canPerformAction } = usePermissions()
    const canManageTags = canPerformAction(PAGE_BITS.INBOX, ACTION_BITS.MANAGE_CUSTOMER_TAGS)

    const [popoverOpen, setPopoverOpen] = useState(false)
    const [search, setSearch] = useState("")
    const popoverRef = useRef<HTMLDivElement>(null)

    // Local optimistic tags state — store IDs only
    const [localTags, setLocalTags] = useState<string[]>(() => (customer.tags ?? []).map(t => t.id))

    // Sync local state when customer.tags changes from server
    useEffect(() => {
        setLocalTags((customer.tags ?? []).map(t => t.id))
    }, [customer.tags])

    // Current customer tags (use local state for instant UI)
    const customerTagIds = localTags

    // Resolve tag objects: match IDs against allTags list
    const customerTags = useMemo(() =>
        customerTagIds.map(id => allTags.find((t: TagType) => (t.id === id || t.tag_id === id))).filter(Boolean) as TagType[],
        [customerTagIds, allTags]
    )

    // Available tags to add (not already assigned)
    const availableTags = useMemo(() => {
        const assigned = new Set(customerTagIds)
        return (allTags as TagType[])
            .filter(t => !assigned.has(t.id) && !assigned.has(t.tag_id ?? ""))
            .filter(t =>
                !search ||
                t.name.toLowerCase().includes(search.toLowerCase()) ||
                (t.emoji ?? "").includes(search) ||
                (t.name_ar ?? "").includes(search)
            )
    }, [allTags, customerTagIds, search])

    const handleAdd = (tagId: string) => {
        // Optimistic: update UI immediately
        const prev = localTags
        setLocalTags(old => [...old, tagId])

        // Fire API in background
        addCustomerTags(customer.customer_id, [tagId])
            .then(() => {
                invalidateCustomerCaches(queryClient, customer.customer_id)
            })
            .catch(() => {
                // Rollback on error
                setLocalTags(prev)
            })
    }

    const handleRemove = (tagId: string) => {
        // Optimistic: update UI immediately
        const prev = localTags
        setLocalTags(old => old.filter(id => id !== tagId))

        // Fire API in background
        removeCustomerTags(customer.customer_id, [tagId])
            .then(() => {
                invalidateCustomerCaches(queryClient, customer.customer_id)
            })
            .catch(() => {
                // Rollback on error
                setLocalTags(prev)
            })
    }

    // Close popover on outside click
    useEffect(() => {
        if (!popoverOpen) return
        const handler = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node))
                setPopoverOpen(false)
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [popoverOpen])

    // Compute popover position from button ref
    const btnRef = useRef<HTMLButtonElement>(null)
    const [popPos, setPopPos] = useState({ top: 0, left: 0 })

    const openPopover = () => {
        if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect()
            setPopPos({ top: rect.bottom + 4, left: rect.left })
        }
        setPopoverOpen(true)
        setSearch("")
    }

    return (
        <>
            <div className="cd-section-header">
                <h3 className="cd-section-title">Tags</h3>
                {canManageTags && (
                    <button
                        ref={btnRef}
                        onClick={() => popoverOpen ? setPopoverOpen(false) : openPopover()}
                        style={{
                            width: 22, height: 22, borderRadius: 6,
                            border: "1px solid var(--t-border-light)",
                            background: popoverOpen ? "var(--t-accent)" : "transparent",
                            color: popoverOpen ? "var(--t-text-on-accent)" : "var(--t-text-faint)",
                            cursor: "pointer", display: "flex",
                            alignItems: "center", justifyContent: "center",
                            transition: "all .12s",
                        }}
                    >
                        <Plus size={12} />
                    </button>
                )}
            </div>

            {/* Fixed-position tag picker popover */}
            {popoverOpen && (
                <>
                    {/* Invisible backdrop to catch outside clicks */}
                    <div
                        style={{ position: "fixed", inset: 0, zIndex: 99 }}
                        onClick={() => setPopoverOpen(false)}
                    />
                    <div
                        ref={popoverRef}
                        dir="rtl"
                        style={{
                            position: "fixed",
                            top: popPos.top,
                            left: popPos.left,
                            width: 220, zIndex: 100,
                            background: "var(--t-card)", border: "1px solid var(--t-border)",
                            borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.15)",
                            overflow: "hidden",
                            animation: "cdTagIn .12s ease-out",
                        }}
                    >
                        {/* Search */}
                        <div style={{
                            padding: "8px 8px 6px", display: "flex", alignItems: "center", gap: 6,
                            borderBottom: "1px solid var(--t-border-light)",
                        }}>
                            <Search size={12} style={{ color: "var(--t-text-faint)", flexShrink: 0 }} />
                            <input
                                autoFocus
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search and select Tags"
                                style={{
                                    border: "none", outline: "none", background: "transparent",
                                    fontSize: 11, color: "var(--t-text)", flex: 1,
                                    fontFamily: "inherit",
                                }}
                            />
                        </div>

                        {/* Tag list */}
                        <div style={{ maxHeight: 200, overflowY: "auto", padding: "4px" }}>
                            {/* Already assigned tags (checked) */}
                            {customerTags.map((tag: TagType) => {
                                const tagId = tag.id ?? tag.tag_id ?? ""
                                return (
                                    <button
                                        key={`assigned-${tagId}`}
                                        onClick={() => handleRemove(tagId)}
                                        style={{
                                            width: "100%", display: "flex", alignItems: "center", gap: 6,
                                            padding: "6px 8px", borderRadius: 6,
                                            border: "none", background: "transparent",
                                            cursor: "pointer", transition: "background .08s",
                                            fontFamily: "inherit", textAlign: "right",
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = "var(--t-surface)" }}
                                        onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                                    >
                                        <span style={{
                                            width: 16, height: 16, borderRadius: 4,
                                            background: "var(--t-accent)", border: "none",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            flexShrink: 0, color: "var(--t-text-on-accent)", fontSize: 9,
                                        }}>✓</span>
                                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            {tag.emoji && <span style={{ fontSize: 12 }}>{tag.emoji}</span>}
                                            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--t-text)" }}>
                                                {tag.name}
                                            </span>
                                        </span>
                                    </button>
                                )
                            })}

                            {/* Available tags (unchecked) */}
                            {availableTags.length === 0 && customerTags.length === 0 ? (
                                <div style={{
                                    padding: "16px 8px", textAlign: "center",
                                    fontSize: 11, color: "var(--t-text-faint)",
                                }}>
                                    {search ? "لا توجد نتائج" : "لا توجد تاجات متاحة"}
                                </div>
                            ) : availableTags.map((tag: TagType) => {
                                const tagId = tag.id ?? tag.tag_id ?? ""
                                return (
                                    <button
                                        key={tagId}
                                        onClick={() => handleAdd(tagId)}
                                        style={{
                                            width: "100%", display: "flex", alignItems: "center", gap: 6,
                                            padding: "6px 8px", borderRadius: 6,
                                            border: "none", background: "transparent",
                                            cursor: "pointer", transition: "background .08s",
                                            fontFamily: "inherit", textAlign: "right",
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = "var(--t-surface)" }}
                                        onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                                    >
                                        <span style={{
                                            width: 16, height: 16, borderRadius: 4,
                                            border: "1.5px solid var(--t-border)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            flexShrink: 0, fontSize: 9,
                                        }} />
                                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            {tag.emoji && <span style={{ fontSize: 12 }}>{tag.emoji}</span>}
                                            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--t-text)" }}>
                                                {tag.name}
                                            </span>
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </>
            )}

            {/* Current tags display */}
            <div style={{ padding: "4px 14px 10px", display: "flex", flexWrap: "wrap", gap: 4 }}>
                {customerTags.length === 0 ? (
                    <span style={{ fontSize: 11, color: "var(--t-text-faint)", fontStyle: "italic" }}>
                        لا توجد تاجات
                    </span>
                ) : (
                    customerTags.map((tag: TagType) => {
                        const tagId = tag.id ?? tag.tag_id ?? ""
                        return (
                            <span key={tagId} className="cd-badge" style={{
                                background: "var(--t-surface)",
                                color: "var(--t-text-secondary)",
                                display: "inline-flex", alignItems: "center", gap: 3,
                                paddingRight: 4,
                            }}>
                                {tag.emoji && <span style={{ fontSize: 11 }}>{tag.emoji}</span>}
                                {tag.name}
                                {canManageTags && (
                                    <button
                                        onClick={() => handleRemove(tagId)}
                                        style={{
                                            border: "none", background: "transparent",
                                            cursor: "pointer", padding: 0, display: "flex",
                                            color: "var(--t-text-faint)", marginRight: 1,
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.color = "var(--t-danger)" }}
                                        onMouseLeave={e => { e.currentTarget.style.color = "var(--t-text-faint)" }}
                                    >
                                        <X size={10} />
                                    </button>
                                )}
                            </span>
                        )
                    })
                )}

            </div>

            <style>{`
                @keyframes cdTagIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
            `}</style>
        </>
    )
}

/* ═════════ Conversation Tab ═════════ */
function ConversationTab({ customer: c }: { customer: Customer }) {
    return (
        <>
            <div className="cd-section-header">
                <h3 className="cd-section-title">Conversation info</h3>
            </div>

            <InfoCard icon={<Hash size={13} />} label="Session ID"
                value={c.session_id || "—"} />
            <InfoCard icon={<Users size={13} />} label="Assigned to"
                value={c.assigned?.assigned_to_username || "Unassigned"} />
            <InfoCard icon={<Bot size={13} />} label="AI"
                value={c.enable_ai ? "Active ✓" : "Inactive"} />
            <InfoCard icon={<Tag size={13} />} label="Status"
                value={c.conversation_status?.is_closed ? "Closed" : "Open"} />
            {c.conversation_status?.is_closed && c.conversation_status.close_reason && (
                <InfoCard icon={<MessageSquare size={13} />} label="Close reason"
                    value={c.conversation_status.close_reason} />
            )}

            <div className="cd-divider" style={{ margin: "6px 0" }} />

            <div className="cd-section-header">
                <h3 className="cd-section-title">Dates</h3>
            </div>

            <InfoCard icon={<Calendar size={13} />} label="Created"
                value={c.created_at ? new Date(c.created_at).toLocaleDateString("ar-SA", {
                    year: "numeric", month: "short", day: "numeric",
                    hour: "2-digit", minute: "2-digit",
                    timeZone: "Asia/Aden"
                }) : "—"} />
            {c.updated_at && (
                <InfoCard icon={<Clock size={13} />} label="Last updated"
                    value={new Date(c.updated_at).toLocaleDateString("ar-SA", {
                        year: "numeric", month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                        timeZone: "Asia/Aden"
                    })} />
            )}

            <div className="cd-divider" style={{ margin: "6px 0" }} />

            <div className="cd-section-header">
                <h3 className="cd-section-title">Engagement</h3>
            </div>

            <InfoCard icon={<Mail size={13} />} label="Unread"
                value={String(c.unread_count || 0)} />
            {c.favorite && (
                <InfoCard icon={<span>⭐</span>} label="Favorite" value="Yes" />
            )}
            {c.muted && (
                <InfoCard icon={<span>🔇</span>} label="Muted" value="Yes" />
            )}
        </>
    )
}

/* ═════════ Field Row ═════════ */
function FieldRow({ label, icon, value, empty }: {
    label: string; icon: React.ReactNode
    value?: string | null; empty?: string
}) {
    return (
        <div className="cd-field">
            <p className="cd-field-label">{icon} {label}</p>
            {value ? (
                <p className="cd-field-value">{value}</p>
            ) : (
                <p className="cd-field-empty">{empty || "—"}</p>
            )}
        </div>
    )
}

/* ═════════ Info Card ═════════ */
function InfoCard({ icon, label, value }: {
    icon: React.ReactNode; label: string; value: string
}) {
    return (
        <div className="cd-info-card">
            <div className="cd-info-icon">{icon}</div>
            <div>
                <p className="cd-info-label">{label}</p>
                <p className="cd-info-value">{value}</p>
            </div>
        </div>
    )
}

/* ═════════ Activity Tab ═════════ */

type EventMeta = { label: string; emoji: string; color: string; bg: string; borderColor: string }

const EVENT_META: Record<string, EventMeta> = {
    // Real API event types
    lifecycle_changed: { label: "تغيير المرحلة", emoji: "🔄", color: "#2563eb", bg: "#eff6ff", borderColor: "#bfdbfe" },
    ai_status_changed: { label: "تغيير حالة AI", emoji: "🤖", color: "#059669", bg: "#ecfdf5", borderColor: "#a7f3d0" },
    customer_assigned: { label: "تعيين وكيل", emoji: "👤", color: "#0891b2", bg: "#ecfeff", borderColor: "#a5f3fc" },
    teams_assigned: { label: "تعيين فريق", emoji: "👥", color: "#0d9488", bg: "#f0fdfa", borderColor: "#99f6e4" },
    session_auto_closed: { label: "إغلاق تلقائي", emoji: "🔒", color: "#dc2626", bg: "#fef2f2", borderColor: "#fecaca" },
    session_closed: { label: "إغلاق الجلسة", emoji: "🔒", color: "#dc2626", bg: "#fef2f2", borderColor: "#fecaca" },
    session_reopened: { label: "فتح الجلسة", emoji: "🔓", color: "#16a34a", bg: "#f0fdf4", borderColor: "#bbf7d0" },
    tag_added: { label: "إضافة تاج", emoji: "🏷️", color: "#7c3aed", bg: "#f5f3ff", borderColor: "#ddd6fe" },
    tag_removed: { label: "إزالة تاج", emoji: "🗑️", color: "#b91c1c", bg: "#fef2f2", borderColor: "#fecaca" },
}

const DEFAULT_META: EventMeta = { label: "حدث", emoji: "📋", color: "#6b7280", bg: "#f9fafb", borderColor: "#e5e7eb" }

function relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 1) return "الآن"
    if (mins < 60) return `منذ ${mins} دقيقة`
    if (hours < 24) return `منذ ${hours} ساعة`
    if (days < 7) return `منذ ${days} يوم`
    return new Date(iso).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })
}

function fullDateTime(iso: string): string {
    return new Date(iso).toLocaleString("ar-SA", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        timeZone: "Asia/Aden",
    })
}

// Keys NOT shown in the generic metadata rows (rendered specially or irrelevant)
const HIDDEN_KEYS = new Set(["customer_id", "performed_by", "all_teams"])

const META_LABELS: Record<string, string> = {
    performed_by_name: "نفّذه",
    action: "الإجراء",
    close_reason: "سبب الإغلاق",
    hours_idle: "ساعات الخمول",
    assigned_to_username: "وكيل مُعيَّن",
    is_assigned: "معين",
    enable_ai: "AI",
    old_lifecycle: "المرحلة السابقة",
    new_lifecycle: "المرحلة الجديدة",
    added_teams: "الفرق المضافة",
    team_names: "أسماء الفرق",
    is_assigned_team: "تعيين فريق",
    assigned_to: "معرّف الوكيل",
}

// Collapsed summary chip content per event type
function buildSummary(eventType: string, md: Record<string, unknown>): string | null {
    const s = (k: string) => md[k] as string | undefined
    switch (eventType) {
        case "ai_status_changed":
            return md.enable_ai ? "✅ تم تفعيل AI" : "❌ تم تعطيل AI"
        case "customer_assigned":
            return s("assigned_to_username") ? `→ ${s("assigned_to_username")}` : null
        case "teams_assigned": {
            const names = md.team_names as Record<string, string> | undefined
            return names ? Object.values(names).join("، ") : null
        }
        case "session_auto_closed":
            return s("close_reason") ?? null
        case "lifecycle_changed":
            return (s("new_lifecycle") && s("old_lifecycle"))
                ? `${s("new_lifecycle")} ← ${s("old_lifecycle")}` : null
        default: return null
    }
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="act-detail-row">
            <span className="act-detail-key">{label}</span>
            <span className="act-detail-val">{children}</span>
        </div>
    )
}

function renderMetaVal(key: string, val: unknown): React.ReactNode {
    if (key === "team_names" && typeof val === "object" && val !== null) {
        return (
            <span style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                {Object.values(val as Record<string, string>).map((n, i) => (
                    <span key={i} style={{
                        background: "#f0fdfa", border: "1px solid #99f6e4",
                        borderRadius: 5, padding: "1px 7px",
                        fontSize: 10.5, color: "#0d9488", fontWeight: 600,
                    }}>{n}</span>
                ))}
            </span>
        )
    }
    if (key === "added_teams" && Array.isArray(val)) return (val as string[]).join("، ")
    if (key === "enable_ai") return val
        ? <span style={{ color: "#059669", fontWeight: 700 }}>مفعّل ✓</span>
        : <span style={{ color: "#dc2626", fontWeight: 700 }}>معطّل</span>
    if (key === "is_assigned" || key === "is_assigned_team") return val ? "نعم" : "لا"
    if (key === "hours_idle") return `${val} ساعة`
    return String(val)
}

function ActivityEventCard({ event, isLast }: { event: ActivityEvent; isLast: boolean }) {
    const [open, setOpen] = useState(false)
    const md = event.metadata ?? {}
    const actor = (md.performed_by_name as string) || "النظام"
    const summary = buildSummary(event.event_type, md)

    // Resolve effective meta (ai_status_changed color depends on enable_ai)
    const baseMeta = EVENT_META[event.event_type] ?? DEFAULT_META
    const effectiveMeta: EventMeta = event.event_type === "ai_status_changed"
        ? {
            ...baseMeta,
            label: md.enable_ai ? "تفعيل AI" : "تعطيل AI",
            color: md.enable_ai ? "#059669" : "#6b7280",
            bg: md.enable_ai ? "#ecfdf5" : "#f9fafb",
            borderColor: md.enable_ai ? "#a7f3d0" : "#e5e7eb",
        }
        : baseMeta

    const visibleEntries = Object.entries(md).filter(([k]) => !HIDDEN_KEYS.has(k))

    return (
        <div
            className={`act-row${isLast ? " act-no-line" : ""}`}
            style={{ "--act-dot-color": effectiveMeta.color } as React.CSSProperties}
        >
            <div className="act-connector">
                <div className="act-connector-dot"
                    style={{ borderColor: effectiveMeta.color, background: open ? effectiveMeta.color : effectiveMeta.bg }}
                />
                {!isLast && <div className="act-connector-line" />}
            </div>

            <div className="act-card" data-open={open}
                style={{ "--act-dot-color": effectiveMeta.color } as React.CSSProperties}
                onClick={() => setOpen(o => !o)}
            >
                <div className="act-card-accent" />

                <div className="act-card-summary">
                    <div className="act-type-badge" style={{
                        background: effectiveMeta.bg,
                        borderColor: effectiveMeta.borderColor,
                        color: effectiveMeta.color,
                    }}>
                        {effectiveMeta.emoji}
                    </div>
                    <div className="act-card-info">
                        <p className="act-card-title">{effectiveMeta.label}</p>
                        <div className="act-card-meta">
                            <span>{actor}</span>
                            <span className="act-card-meta-dot" />
                            <span>{relativeTime(event.timestamp)}</span>
                        </div>
                    </div>
                    <svg className="act-chevron" data-open={open}
                        width="12" height="12" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round"
                    >
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </div>

                {/* Collapsed chip summary */}
                {!open && summary && (
                    <div className="act-preview">
                        <div className="act-preview-pill">{summary}</div>
                    </div>
                )}

                {/* Expanded details */}
                {open && (
                    <div className="act-expanded">
                        <MetaRow label="التاريخ">{fullDateTime(event.timestamp)}</MetaRow>

                        {visibleEntries
                            .filter(([k]) => k !== "performed_by_name")
                            .map(([k, v]) => (
                                <MetaRow key={k} label={META_LABELS[k] ?? k}>
                                    {renderMetaVal(k, v)}
                                </MetaRow>
                            ))
                        }

                        {/* Performer ID (short) */}
                        {typeof md.performed_by === "string" && md.performed_by && (
                            <div className="act-id-chip">منفّذ: {md.performed_by}</div>
                        )}
                        {event.event_id && (
                            <div className="act-id-chip">{event.event_id}</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

function ActivitySkeleton() {
    return (
        <div className="act-list">
            {[0.0, 0.1, 0.2].map((delay, i) => (
                <div key={i} style={{ display: "flex", gap: 0, marginBottom: 6 }}>
                    <div style={{ width: 30, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 10 }}>
                        <div className="act-skeleton-circle" style={{ width: 10, height: 10, borderRadius: "50%", animationDelay: `${delay}s` }} />
                    </div>
                    <div className="act-skeleton-card" style={{ flex: 1, animationDelay: `${delay}s` }}>
                        <div className="act-skeleton-circle" style={{ animationDelay: `${delay + 0.05}s` }} />
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                            <div className="act-skeleton-line" style={{ width: "55%", animationDelay: `${delay}s` }} />
                            <div className="act-skeleton-line" style={{ width: "35%", height: 7, animationDelay: `${delay + 0.1}s` }} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

function ActivityTab({ customer: c }: { customer: Customer }) {
    const { data, isLoading, isFetching, refetch } = useSessionActivity(c.session_id ?? undefined)
    const events = data?.events ?? []

    return (
        <div className="act-wrap">
            {/* Sticky header */}
            <div className="act-header">
                <div className="act-header-left">
                    <div className="act-header-icon">
                        <Activity size={14} />
                    </div>
                    <div>
                        <p className="act-header-title">سجل الأحداث</p>
                        {data && (
                            <p className="act-header-sub">{data.total_events} حدث مسجّل</p>
                        )}
                    </div>
                </div>
                <button
                    className={`act-refresh-btn${isFetching ? " spinning" : ""}`}
                    onClick={e => { e.stopPropagation(); refetch() }}
                    title="تحديث"
                >
                    <RefreshCw size={13} />
                </button>
            </div>

            {/* Content */}
            {isLoading ? (
                <ActivitySkeleton />
            ) : events.length === 0 ? (
                <div className="act-empty">
                    <div className="act-empty-icon">🗓️</div>
                    <p className="act-empty-text">لا توجد أحداث مسجّلة</p>
                    <p className="act-empty-sub">سيظهر هنا سجل كل تغيير يحدث على هذه الجلسة</p>
                </div>
            ) : (
                <div className="act-list">
                    {events.map((evt, idx) => (
                        <ActivityEventCard
                            key={evt.event_id}
                            event={evt}
                            isLast={idx === events.length - 1}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
