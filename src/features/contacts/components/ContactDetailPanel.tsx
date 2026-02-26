import { X, Edit3, Trash2, User, Phone, Mail, Globe, Tag, Bot, MessageSquare, Clock, Calendar } from "lucide-react"
import { useContactDetail } from "../hooks/use-contacts"
import { useContactLookups } from "../hooks/use-contact-lookups"
import { useContactsStore } from "../store/contacts.store"

function formatDate(str?: string | null): string {
    if (!str) return "—"
    return new Date(str).toLocaleDateString("en", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
        timeZone: "Asia/Aden",
    })
}

export function ContactDetailPanel() {
    const { selectedContactId, setSelectedContactId } = useContactsStore()
    const { data: contact, isLoading } = useContactDetail(selectedContactId)
    const { tagMap, lifecycleMap } = useContactLookups()

    if (isLoading) {
        return (
            <div className="cdp-empty-root">
                <div className="cdp-spinner" />
                <span style={{ fontSize: 12, color: "var(--t-text-faint)" }}>جاري التحميل…</span>
                <Style />
            </div>
        )
    }

    if (!contact) {
        return (
            <div className="cdp-empty-root">
                <p className="cdp-empty-title">لم يتم العثور على جهة الاتصال</p>
                <Style />
            </div>
        )
    }

    const name = contact.sender_name?.trim() || contact.customer_id
    const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()

    // custom_fields hold the real data
    const phone = contact.custom_fields?.phone || ""
    const email = contact.custom_fields?.email || ""
    const country = contact.custom_fields?.country || ""
    const language = contact.custom_fields?.language || ""
    const isClosed = contact.conversation_status?.is_closed

    // Resolve lifecycle code → name + icon + color
    const lc = contact.lifecycle ? lifecycleMap.get(contact.lifecycle) : null

    // Resolve tag IDs → names
    const resolvedTags = (contact.tags ?? []).map(id => tagMap.get(id)).filter(Boolean) as { name: string; emoji?: string }[]

    // Resolve team IDs → we just show them as-is since they're codes
    const teamNames = contact.team_ids?.teams ?? []

    return (
        <div className="cdp-root">
            {/* Header */}
            <div className="cdp-header">
                <span className="cdp-header-title">تفاصيل جهة الاتصال</span>
                <div className="cdp-header-actions">
                    <button className="cdp-icon-btn" title="تعديل">
                        <Edit3 size={14} />
                    </button>
                    <button className="cdp-icon-btn cdp-icon-btn-danger" title="حذف">
                        <Trash2 size={14} />
                    </button>
                    <button className="cdp-icon-btn" title="إغلاق"
                        onClick={() => setSelectedContactId(null)}>
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Profile */}
            <div className="cdp-scroll">
                <div className="cdp-profile">
                    {contact.platform_icon ? (
                        <img src={contact.platform_icon} alt="" className="cdp-avatar-img" />
                    ) : (
                        <div className="cdp-avatar">{initials}</div>
                    )}
                    <div className="cdp-profile-info">
                        <h3 className="cdp-name">{name}</h3>
                        <span className="cdp-id">{contact.customer_id}</span>
                    </div>
                </div>

                {/* Status badges */}
                <div className="cdp-badges">
                    <span className={`cdp-badge ${isClosed ? "cdp-badge-closed" : "cdp-badge-open"}`}>
                        {isClosed ? "Closed" : "Open"}
                    </span>
                    <span className={`cdp-badge cdp-badge-session cdp-badge-${contact.session_status}`}>
                        {contact.session_status}
                    </span>
                    {contact.enable_ai && (
                        <span className="cdp-badge cdp-badge-ai">
                            <Bot size={10} /> AI
                        </span>
                    )}
                    {lc && (
                        <span className="cdp-badge" style={{
                            background: lc.color ? `${lc.color}18` : "var(--t-surface)",
                            color: lc.color || "var(--t-text-muted)",
                        }}>
                            {lc.icon && <span>{lc.icon}</span>} {lc.name}
                        </span>
                    )}
                </div>

                {/* Contact info */}
                <div className="cdp-section">
                    <div className="cdp-section-title">معلومات الاتصال</div>
                    {phone && <InfoRow icon={<Phone size={13} />} label="الهاتف" value={phone} />}
                    {email && <InfoRow icon={<Mail size={13} />} label="البريد" value={email} />}
                    <InfoRow icon={<Globe size={13} />} label="المنصة" value={
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {contact.platform_icon && (
                                <img src={contact.platform_icon} alt="" style={{ width: 16, height: 16 }} />
                            )}
                            <span style={{ textTransform: "capitalize" }}>{contact.platform}</span>
                        </div>
                    } />
                    {country && <InfoRow icon={<Globe size={13} />} label="الدولة" value={country} />}
                    {language && <InfoRow icon={<Globe size={13} />} label="اللغة" value={language} />}
                </div>

                {/* Assignment */}
                {(contact.assigned?.is_assigned || teamNames.length > 0) && (
                    <div className="cdp-section">
                        <div className="cdp-section-title">التعيين</div>
                        {contact.assigned?.is_assigned && (
                            <InfoRow icon={<User size={13} />} label="معين إلى"
                                value={contact.assigned.assigned_to_username || "—"} />
                        )}
                        {teamNames.length > 0 && (
                            <InfoRow icon={<MessageSquare size={13} />} label="الفرق"
                                value={`${teamNames.length} فريق`} />
                        )}
                    </div>
                )}

                {/* Tags */}
                {resolvedTags.length > 0 && (
                    <div className="cdp-section">
                        <div className="cdp-section-title">الوسوم</div>
                        <div className="cdp-tags-wrap">
                            {resolvedTags.map((t, i) => (
                                <span key={i} className="cdp-tag">
                                    {t.emoji && <span>{t.emoji}</span>} {t.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notes */}
                {contact.notes && (
                    <div className="cdp-section">
                        <div className="cdp-section-title">ملاحظات</div>
                        <p className="cdp-notes">{contact.notes}</p>
                    </div>
                )}

                {/* Last message */}
                {contact.last_message && (
                    <div className="cdp-section">
                        <div className="cdp-section-title">آخر رسالة</div>
                        <p className="cdp-last-msg">{contact.last_message}</p>
                        <span className="cdp-msg-dir">
                            {contact.last_direction === "outbound" ? "↗ صادرة" : "↙ واردة"}
                        </span>
                    </div>
                )}

                {/* Dates */}
                <div className="cdp-section">
                    <div className="cdp-section-title">التواريخ</div>
                    <InfoRow icon={<Calendar size={13} />} label="تاريخ الإنشاء"
                        value={formatDate(contact.created_at)} />
                    <InfoRow icon={<Clock size={13} />} label="آخر تحديث"
                        value={formatDate(contact.updated_at)} />
                    <InfoRow icon={<Calendar size={13} />} label="آخر نشاط"
                        value={formatDate(contact.last_timestamp)} />
                </div>
            </div>
            <Style />
        </div>
    )
}

function InfoRow({ icon, label, value }: {
    icon: React.ReactNode; label: string; value: React.ReactNode
}) {
    return (
        <div className="cdp-info-row">
            <span style={{ color: "var(--t-text-faint)", flexShrink: 0, display: "flex" }}>{icon}</span>
            <span className="cdp-info-label">{label}</span>
            <span className="cdp-info-value">{value}</span>
        </div>
    )
}

function Style() {
    return (
        <style>{`
            .cdp-root {
                width:340px; min-width:340px; height:100%;
                display:flex; flex-direction:column;
                background:var(--t-card);
                border-right:1px solid var(--t-border-light);
                overflow:hidden;
            }
            .cdp-empty-root {
                width:340px; min-width:340px; height:100%;
                display:flex; flex-direction:column;
                align-items:center; justify-content:center;
                background:var(--t-card);
                border-right:1px solid var(--t-border-light);
                gap:8px; padding:24px;
            }
            .cdp-empty-title {
                font-size:14px; font-weight:600;
                color:var(--t-text-secondary); margin:0; text-align:center;
            }
            .cdp-spinner {
                width:28px; height:28px; border-radius:50%;
                border:3px solid var(--t-border-light);
                border-top-color:var(--t-accent);
                animation:spin 0.7s linear infinite;
            }

            .cdp-header {
                display:flex; align-items:center; justify-content:space-between;
                padding:12px 14px;
                border-bottom:1px solid var(--t-border-light);
                flex-shrink:0;
            }
            .cdp-header-title {
                font-size:14px; font-weight:700; color:var(--t-text);
            }
            .cdp-header-actions {
                display:flex; gap:4px;
            }
            .cdp-icon-btn {
                width:28px; height:28px; border-radius:6px;
                border:1px solid var(--t-border-light);
                background:transparent; cursor:pointer;
                display:flex; align-items:center; justify-content:center;
                color:var(--t-text-muted); transition:all .12s;
            }
            .cdp-icon-btn:hover {
                background:var(--t-surface); color:var(--t-text);
            }
            .cdp-icon-btn-danger:hover {
                background:var(--t-danger-soft, rgba(239,68,68,0.1));
                color:var(--t-danger, #ef4444);
                border-color:var(--t-danger, #ef4444);
            }

            .cdp-scroll {
                flex:1; overflow-y:auto; padding:0;
            }
            .cdp-scroll::-webkit-scrollbar { width:4px; }
            .cdp-scroll::-webkit-scrollbar-thumb { background:rgba(0,0,0,.1); border-radius:4px; }

            .cdp-profile {
                display:flex; align-items:center; gap:12px;
                padding:16px 14px;
            }
            .cdp-avatar {
                width:48px; height:48px; border-radius:50%;
                background:var(--t-accent);
                color:var(--t-text-on-accent);
                display:flex; align-items:center; justify-content:center;
                font-size:16px; font-weight:700; flex-shrink:0;
            }
            .cdp-avatar-img {
                width:48px; height:48px; border-radius:50%;
                object-fit:cover; flex-shrink:0;
            }
            .cdp-profile-info { flex:1; min-width:0; }
            .cdp-name {
                font-size:16px; font-weight:700;
                color:var(--t-text); margin:0;
                overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
            }
            .cdp-id {
                font-size:11px; color:var(--t-text-faint);
                font-family:monospace;
            }

            .cdp-badges {
                display:flex; gap:6px; padding:0 14px 12px;
                flex-wrap:wrap;
            }
            .cdp-badge {
                font-size:10px; font-weight:700;
                padding:3px 10px; border-radius:12px;
                display:inline-flex; align-items:center; gap:3px;
                text-transform:capitalize;
            }
            .cdp-badge-open {
                background:var(--t-success-soft, rgba(34,197,94,0.1));
                color:var(--t-success, #22c55e);
            }
            .cdp-badge-closed {
                background:var(--t-danger-soft, rgba(239,68,68,0.1));
                color:var(--t-danger, #ef4444);
            }
            .cdp-badge-session {
                background:var(--t-surface);
                color:var(--t-text-muted);
            }
            .cdp-badge-pending {
                background:var(--t-warning-soft, rgba(245,158,11,0.1));
                color:var(--t-warning, #f59e0b);
            }
            .cdp-badge-ai {
                background:var(--t-accent-muted);
                color:var(--t-accent);
            }

            .cdp-section {
                padding:12px 14px;
                border-top:1px solid var(--t-border-light);
            }
            .cdp-section-title {
                font-size:11px; font-weight:700;
                color:var(--t-text-faint);
                text-transform:uppercase; letter-spacing:0.05em;
                margin-bottom:8px;
            }
            .cdp-info-row {
                display:flex; align-items:center; gap:8px;
                padding:4px 0; font-size:13px;
            }
            .cdp-info-label {
                font-weight:500; color:var(--t-text-muted);
                min-width:70px; flex-shrink:0;
            }
            .cdp-info-value {
                color:var(--t-text); font-weight:400;
                overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
            }
            .cdp-tags-wrap {
                display:flex; gap:4px; flex-wrap:wrap;
            }
            .cdp-tag {
                font-size:10px; font-weight:600;
                padding:2px 8px; border-radius:10px;
                background:var(--t-surface); color:var(--t-text-muted);
                display:inline-flex; align-items:center; gap:2px;
            }
            .cdp-notes {
                font-size:13px; color:var(--t-text-secondary);
                margin:0; line-height:1.6;
                background:var(--t-surface); padding:8px 10px;
                border-radius:8px;
            }
            .cdp-last-msg {
                font-size:13px; color:var(--t-text);
                margin:0 0 4px; line-height:1.5;
            }
            .cdp-msg-dir {
                font-size:11px; color:var(--t-text-faint);
            }

            @keyframes spin { to { transform:rotate(360deg) } }
        `}</style>
    )
}
