import { X, Edit3, Trash2, User, Phone, Mail, Globe, Tag, Bot, MessageSquare, Clock, Calendar, Users } from "lucide-react"
import { useContactDetail } from "../hooks/use-contacts"
import { useContactLookups } from "../hooks/use-contact-lookups"
import { useContactsStore } from "../store/contacts.store"

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
.cd-last-msg{font-size:12px;color:#111827;margin:0 0 3px;line-height:1.5}
.cd-msg-dir{font-size:10px;color:#b0b7c3}
.cd-spinner{width:24px;height:24px;border-radius:50%;border:2.5px solid #ebeef2;border-top-color:#004786;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
`

export function ContactDetailPanel() {
    const { selectedContactId, setSelectedContactId } = useContactsStore()
    const { data: contact, isLoading } = useContactDetail(selectedContactId)
    const { tagMap, lifecycleMap } = useContactLookups()

    if (isLoading) return (
        <div className="cd-empty"><style>{CSS}</style><div className="cd-spinner" /><span style={{ fontSize: 11, color: "#b0b7c3" }}>جاري التحميل…</span></div>
    )

    if (!contact) return (
        <div className="cd-empty"><style>{CSS}</style><div style={{ fontSize: 13, fontWeight: 600, color: "#9ca3af" }}>لم يتم العثور على جهة الاتصال</div></div>
    )

    const name = contact.sender_name?.trim() || contact.customer_id
    const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    const phone = contact.custom_fields?.phone || ""
    const email = contact.custom_fields?.email || ""
    const country = contact.custom_fields?.country || ""
    const language = contact.custom_fields?.language || ""
    const isClosed = contact.conversation_status?.is_closed
    const lc = contact.lifecycle ? lifecycleMap.get(contact.lifecycle) : null
    const resolvedTags = (contact.tags ?? []).map(id => tagMap.get(id)).filter(Boolean) as { name: string; emoji?: string }[]
    const teamNames = contact.team_ids?.teams ?? []

    return (
        <div className="cd-root" style={{ animation: "cdFade .2s ease-out" }}>
            <style>{CSS}</style>

            {/* Header */}
            <div className="cd-header">
                <span className="cd-hdr-title">تفاصيل جهة الاتصال</span>
                <div className="cd-hdr-actions">
                    <button className="cd-icon-btn" title="تعديل"><Edit3 size={12} /></button>
                    <button className="cd-icon-btn cd-icon-btn-danger" title="حذف"><Trash2 size={12} /></button>
                    <button className="cd-icon-btn" title="إغلاق" onClick={() => setSelectedContactId(null)}><X size={12} /></button>
                </div>
            </div>

            {/* Scrollable content */}
            <div className="cd-scroll">
                {/* Profile */}
                <div className="cd-profile">
                    {contact.platform_icon ? (
                        <img src={contact.platform_icon} alt="" className="cd-avatar-img" />
                    ) : (
                        <div className="cd-avatar">{initials}</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 className="cd-name">{name}</h3>
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

                {/* Contact info */}
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

                {/* Assignment */}
                {(contact.assigned?.is_assigned || teamNames.length > 0) && (
                    <div className="cd-section">
                        <div className="cd-sec-title"><Users size={10} /> التعيين</div>
                        {contact.assigned?.is_assigned && (
                            <InfoRow icon={<User size={11} />} label="معين إلى" value={contact.assigned.assigned_to_username || "—"} />
                        )}
                        {teamNames.length > 0 && (
                            <InfoRow icon={<MessageSquare size={11} />} label="الفرق" value={`${teamNames.length} فريق`} />
                        )}
                    </div>
                )}

                {/* Tags */}
                {resolvedTags.length > 0 && (
                    <div className="cd-section">
                        <div className="cd-sec-title"><Tag size={10} /> الوسوم</div>
                        <div className="cd-tags">
                            {resolvedTags.map((t, i) => (
                                <span key={i} className="cd-tag">{t.emoji && <span>{t.emoji}</span>} {t.name}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notes */}
                {contact.notes && (
                    <div className="cd-section">
                        <div className="cd-sec-title">ملاحظات</div>
                        <p className="cd-notes">{contact.notes}</p>
                    </div>
                )}

                {/* Last message */}
                {contact.last_message && (
                    <div className="cd-section">
                        <div className="cd-sec-title"><MessageSquare size={10} /> آخر رسالة</div>
                        <p className="cd-last-msg">{contact.last_message}</p>
                        <span className="cd-msg-dir">
                            {contact.last_direction === "outbound" ? "↗ صادرة" : "↙ واردة"}
                        </span>
                    </div>
                )}

                {/* Dates */}
                <div className="cd-section">
                    <div className="cd-sec-title"><Calendar size={10} /> التواريخ</div>
                    <InfoRow icon={<Calendar size={11} />} label="الإنشاء" value={formatDate(contact.created_at)} />
                    <InfoRow icon={<Clock size={11} />} label="التحديث" value={formatDate(contact.updated_at)} />
                    <InfoRow icon={<Calendar size={11} />} label="آخر نشاط" value={formatDate(contact.last_timestamp)} />
                </div>
            </div>
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
