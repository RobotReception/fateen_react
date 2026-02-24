import { Phone, Tag, Users, Calendar, Hash, Bot, Mail, User } from "lucide-react"
import type { Customer } from "../../types/inbox.types"

interface Props { customer: Customer }

export function ConversationDetails({ customer: c }: Props) {
    return (
        <div style={{
            width: 260, minWidth: 260, height: "100%", overflowY: "auto",
            borderRight: "1px solid var(--t-border-light)",
            background: "var(--t-card)", padding: "14px 12px",
            display: "flex", flexDirection: "column", gap: 2,
        }}>
            {/* Profile header */}
            <div style={{ textAlign: "center", paddingBottom: 12, borderBottom: "1px solid var(--t-border-light)", marginBottom: 8 }}>
                {c.profile_photo ? (
                    <img src={c.profile_photo} alt="" style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", margin: "0 auto 6px" }} />
                ) : (
                    <div style={{
                        width: 52, height: 52, borderRadius: "50%", margin: "0 auto 6px",
                        background: "var(--t-accent)", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 18, fontWeight: 700,
                    }}>
                        {(c.sender_name || c.customer_id).charAt(0).toUpperCase()}
                    </div>
                )}
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)", margin: 0 }}>
                    {c.sender_name || c.customer_id}
                </p>
                {c.platform && (
                    <p style={{ fontSize: 11, color: "var(--t-text-faint)", marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        {c.platform_icon && <img src={c.platform_icon} alt="" style={{ width: 12, height: 12 }} />}
                        {c.platform}
                    </p>
                )}
            </div>

            {/* Contact info */}
            <Section title="معلومات الاتصال">
                <Row icon={<Hash size={13} />} label="معرّف العميل" value={c.customer_id} />
                {c.phone_number && <Row icon={<Phone size={13} />} label="الهاتف" value={c.phone_number} />}
                {c.email && <Row icon={<Mail size={13} />} label="البريد" value={c.email} />}
                {c.username && <Row icon={<User size={13} />} label="اسم المستخدم" value={c.username} />}
                {c.session_id && <Row icon={<Hash size={13} />} label="الجلسة" value={c.session_id} />}
            </Section>

            {/* Status */}
            <Section title="الحالة">
                {c.lifecycle && (
                    <Row icon={<Tag size={13} />} label="دورة الحياة"
                        value={`${c.lifecycle.icon ?? ""} ${c.lifecycle.name}`.trim()} />
                )}
                <Row icon={<Bot size={13} />} label="AI"
                    value={c.enable_ai ? "مفعّل ✓" : "معطّل"} />
                {c.conversation_status?.is_closed && (
                    <Row icon={<span style={{ fontSize: 12 }}>🔒</span>} label="سبب الإغلاق"
                        value={c.conversation_status.close_reason || "—"} />
                )}
            </Section>

            {/* Assignment */}
            <Section title="التعيين">
                <Row icon={<Users size={13} />} label="الوكيل"
                    value={c.assigned?.assigned_to_username || c.assigned?.assigned_to || "—"} />
                {c.team_ids?.teams && c.team_ids.teams.length > 0 && (
                    <Row icon={<Users size={13} />} label="الفرق" value={c.team_ids.teams.join(", ")} />
                )}
            </Section>

            {/* Dates */}
            <Section title="التواريخ">
                <Row icon={<Calendar size={13} />} label="تاريخ الإنشاء"
                    value={c.created_at ? new Date(c.created_at).toLocaleDateString("ar") : "—"} />
                {c.updated_at && (
                    <Row icon={<Calendar size={13} />} label="آخر تحديث"
                        value={new Date(c.updated_at).toLocaleDateString("ar")} />
                )}
            </Section>

            {/* Engagement */}
            {(c.unread_count > 0 || c.favorite || c.muted) && (
                <Section title="تفاعل">
                    {c.unread_count > 0 && <Row icon={<span>📩</span>} label="غير مقروء" value={String(c.unread_count)} />}
                    {c.favorite && <Row icon={<span>⭐</span>} label="مفضّل" value="نعم" />}
                    {c.muted && <Row icon={<span>🔇</span>} label="مكتوم" value="نعم" />}
                </Section>
            )}
        </div>
    )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ margin: "6px 0 0", borderTop: "1px solid var(--t-border-light)", paddingTop: 10 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "var(--t-text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                {title}
            </p>
            {children}
        </div>
    )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "5px 4px" }}>
            <div style={{ color: "var(--t-text-faint)", marginTop: 1, flexShrink: 0 }}>{icon}</div>
            <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 10, color: "var(--t-text-faint)", marginBottom: 1 }}>{label}</p>
                <p style={{ fontSize: 12, color: "var(--t-text)", fontWeight: 500, wordBreak: "break-all" }}>{value}</p>
            </div>
        </div>
    )
}
