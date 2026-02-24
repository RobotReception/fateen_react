import { FileText, Headphones, Film, MessageSquare, UserCheck, Users, Tag, XCircle, RefreshCw, ArrowRightLeft } from "lucide-react"
import type { Message, ActivityEventType } from "../../types/inbox.types"

function formatTime(dateStr?: string) {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })
}

function formatDate(dateStr?: string) {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleDateString("ar", { year: "numeric", month: "short", day: "numeric" })
}

interface Props {
    message: Message
    isPending?: boolean
}

export function MessageBubble({ message: m, isPending }: Props) {
    // ─── Activity events → centered system row ───
    if (m.message_type === "activity") return <ActivityBubble message={m} />

    // ─── Comment → internal note ───
    if (m.message_type === "comment") return <CommentBubble message={m} />

    // ─── Regular messages ───
    const isOwn = m.direction === "outbound"

    return (
        <div style={{
            display: "flex",
            flexDirection: isOwn ? "row" : "row-reverse",
            alignItems: "flex-end", gap: 6, marginBottom: 8,
            opacity: isPending ? 0.6 : 1,
        }}>
            {/* Sender avatar for inbound */}
            {!isOwn && m.sender_info?.profile_picture && (
                <img src={m.sender_info.profile_picture} alt=""
                    style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
            )}

            <div style={{
                maxWidth: "68%", padding: "8px 12px",
                borderRadius: isOwn ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                background: isOwn ? "var(--t-accent)" : "var(--t-card)",
                border: isOwn ? "none" : "1px solid var(--t-border-light)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}>
                {/* Sender name for inbound (from AI/agent) */}
                {!isOwn && m.sender_info?.name && (
                    <p style={{
                        fontSize: 10, fontWeight: 700, marginBottom: 3,
                        color: isOwn ? "rgba(255,255,255,0.8)" : "var(--t-accent)",
                    }}>
                        {m.sender_info.name}
                    </p>
                )}

                <ContentRenderer message={m} isOwn={isOwn} />

                <p style={{
                    fontSize: 10,
                    color: isOwn ? "rgba(255,255,255,0.6)" : "var(--t-text-faint)",
                    marginTop: 4, textAlign: isOwn ? "left" : "right",
                    display: "flex", alignItems: "center", gap: 4,
                    justifyContent: isOwn ? "flex-start" : "flex-end",
                }}>
                    {formatTime(m.timestamp)}
                    {isPending && " · جاري الإرسال..."}
                    {m.status && !isPending && <StatusIcon status={m.status} />}
                </p>
            </div>

            {/* Sender avatar for outbound */}
            {isOwn && m.sender_info?.profile_picture && (
                <img src={m.sender_info.profile_picture} alt=""
                    style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
            )}
        </div>
    )
}

// ── Status icons ──────────────────────────
function StatusIcon({ status }: { status: string }) {
    const map: Record<string, { text: string; color: string }> = {
        sent: { text: "✓", color: "inherit" },
        delivered: { text: "✓✓", color: "inherit" },
        read: { text: "✓✓", color: "#3b82f6" },
        failed: { text: "✗", color: "#ef4444" },
        received: { text: "", color: "inherit" },
    }
    const s = map[status]
    if (!s || !s.text) return null
    return <span style={{ color: s.color, fontSize: 11, fontWeight: 700 }}>{s.text}</span>
}

// ── Content renderer (by message_type) ────
function ContentRenderer({ message: m, isOwn }: { message: Message; isOwn: boolean }) {
    const color = isOwn ? "rgba(255,255,255,0.95)" : "var(--t-text)"
    const c = m.content

    switch (m.message_type) {
        case "text":
        case "interactive":
            return <p style={{ fontSize: 13, color, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{c.text || ""}</p>

        case "image":
            return (
                <div>
                    {c.url && (
                        <a href={c.url} target="_blank" rel="noopener noreferrer">
                            <img src={c.url} alt={c.caption || "صورة"}
                                style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 8, display: "block", objectFit: "cover", cursor: "pointer" }}
                                onError={(e) => { e.currentTarget.style.display = "none" }} />
                        </a>
                    )}
                    {c.caption && <p style={{ fontSize: 12, color, marginTop: 4 }}>{c.caption}</p>}
                    {c.upload_status === "pending" && <UploadBadge />}
                </div>
            )

        case "video":
            return (
                <div>
                    {c.url ? (
                        <video controls src={c.url} style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 6 }} />
                    ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, color }}>
                            <Film size={18} /> <span style={{ fontSize: 12 }}>فيديو</span>
                        </div>
                    )}
                    {c.caption && <p style={{ fontSize: 12, color, marginTop: 4 }}>{c.caption}</p>}
                    {c.upload_status === "pending" && <UploadBadge />}
                </div>
            )

        case "audio":
            return (
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Headphones size={16} style={{ color, flexShrink: 0 }} />
                        {c.url ? (
                            <audio controls src={c.url} style={{ height: 32, maxWidth: 220 }} />
                        ) : (
                            <span style={{ fontSize: 12, color }}>مقطع صوتي</span>
                        )}
                    </div>
                    {c.transcript && <p style={{ fontSize: 11, color, marginTop: 4, fontStyle: "italic", opacity: 0.8 }}>{c.transcript}</p>}
                    {c.upload_status === "pending" && <UploadBadge />}
                </div>
            )

        case "document":
            return (
                <a href={c.url} download={c.filename} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color }}>
                    <FileText size={20} style={{ flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {c.filename || "مستند"}
                        </p>
                        {c.file_size && (
                            <p style={{ fontSize: 10, opacity: 0.7 }}>{(c.file_size / 1024).toFixed(0)} KB</p>
                        )}
                        {c.caption && <p style={{ fontSize: 11, opacity: 0.8 }}>{c.caption}</p>}
                    </div>
                </a>
            )

        default:
            return <p style={{ fontSize: 12, color, opacity: 0.7 }}>[{m.message_type}]</p>
    }
}

function UploadBadge() {
    return (
        <span style={{
            fontSize: 9, display: "inline-block", marginTop: 3,
            padding: "1px 6px", borderRadius: 10,
            background: "rgba(0,0,0,0.15)", color: "#fff",
        }}>
            ⏳ جاري الرفع...
        </span>
    )
}

// ── Activity bubble (system events) ───────
function ActivityBubble({ message: m }: { message: Message }) {
    const meta = m.content?.metadata || {}
    const evType = m.content?.event_type

    const { icon, text } = activityText(evType, meta)

    return (
        <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 6, margin: "12px 0", padding: "6px 14px",
        }}>
            <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 14px", borderRadius: 20,
                background: "var(--t-surface)",
                border: "1px solid var(--t-border-light)",
                fontSize: 11, color: "var(--t-text-muted)",
            }}>
                {icon}
                <span>{text}</span>
                {m.timestamp && (
                    <span style={{ fontSize: 9, color: "var(--t-text-faint)", marginRight: 6 }}>
                        {formatDate(m.timestamp)} {formatTime(m.timestamp)}
                    </span>
                )}
            </div>
        </div>
    )
}

function activityText(evType?: ActivityEventType, meta?: Record<string, any>): { icon: React.ReactNode; text: string } {
    switch (evType) {
        case "customer_assigned":
            return {
                icon: <UserCheck size={13} />,
                text: meta?.action === "assigned"
                    ? `Assigned to ${meta.performed_by_name || meta.assigned_to_username || "agent"}`
                    : `Unassigned by ${meta?.performed_by_name || "agent"}`,
            }
        case "teams_assigned":
            return {
                icon: <Users size={13} />,
                text: `Teams: ${(meta?.added_teams ?? []).join(", ") || "updated"}`,
            }
        case "lifecycle_changed":
            return {
                icon: <Tag size={13} />,
                text: `Lifecycle Stage ${meta?.old_lifecycle || ""} updated to ${meta?.new_lifecycle || ""}${meta?.performed_by_name ? ` by ${meta.performed_by_name}` : ""}`,
            }
        case "conversation_closed":
            return {
                icon: <XCircle size={13} />,
                text: `Conversation closed${meta?.performed_by_name ? ` by ${meta.performed_by_name}` : ""}`,
            }
        case "conversation_reopened":
            return {
                icon: <RefreshCw size={13} />,
                text: `Conversation opened by ${meta?.reopened_by_name || "you"}`,
            }
        case "session_status_changed":
            return {
                icon: <ArrowRightLeft size={13} />,
                text: `Session: ${meta?.old_status} → ${meta?.new_status}`,
            }
        default:
            return {
                icon: <MessageSquare size={13} />,
                text: meta?.text ?? String(evType ?? "event"),
            }
    }
}

// ── Comment bubble (internal notes) ───────
function CommentBubble({ message: m }: { message: Message }) {
    return (
        <div style={{
            display: "flex", justifyContent: "center", margin: "8px 16px",
        }}>
            <div style={{
                maxWidth: "80%", padding: "8px 14px", borderRadius: 12,
                background: "#fffbeb",
                border: "1px solid #fde68a",
                position: "relative",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                    <MessageSquare size={12} style={{ color: "#b45309" }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#b45309" }}>
                        {m.sender_info?.name || "تعليق داخلي"}
                    </span>
                </div>
                <p style={{ fontSize: 12, color: "#78350f", lineHeight: 1.5, margin: 0, whiteSpace: "pre-wrap" }}>
                    {m.content?.text || ""}
                </p>
                {m.content?.mentions && m.content.mentions.length > 0 && (
                    <p style={{ fontSize: 9, color: "#92400e", marginTop: 4, opacity: 0.7 }}>
                        📌 {m.content.mentions.join(", ")}
                    </p>
                )}
                <p style={{ fontSize: 9, color: "#92400e", marginTop: 3, textAlign: "left", opacity: 0.6 }}>
                    {formatTime(m.timestamp)}
                </p>
            </div>
        </div>
    )
}
