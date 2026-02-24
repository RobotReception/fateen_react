import { useNavigate } from "react-router-dom"
import { Avatar } from "../ui/Avatar"
import { Star, BellOff, Check, CheckCheck } from "lucide-react"
import type { Customer } from "../../types/inbox.types"

function timeAgo(dateStr?: string | null): string {
    if (!dateStr) return ""
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "now"
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    const days = Math.floor(hrs / 24)
    if (days === 1) return "yesterday"
    if (days < 7) return new Date(dateStr).toLocaleDateString("en", { weekday: "short" })
    return new Date(dateStr).toLocaleDateString("en", { month: "short", day: "numeric" })
}

function statusColor(status?: string): string {
    switch (status) {
        case "open": return "#22c55e"
        case "pending": return "#f59e0b"
        case "closed": return "#94a3b8"
        default: return "#94a3b8"
    }
}

interface ConversationItemProps {
    customer: Customer
    isSelected: boolean
}

export function ConversationItem({ customer: c, isSelected }: ConversationItemProps) {
    const navigate = useNavigate()
    const displayName = c.sender_name?.trim() || c.customer_id
    const hasUnread = c.unread_count > 0

    return (
        <div
            onClick={() => navigate(`/dashboard/inbox/${c.customer_id}`)}
            style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px 10px 12px",
                cursor: "pointer",
                background: isSelected
                    ? "rgba(var(--t-accent-rgb, 59,130,246), 0.08)"
                    : "transparent",
                borderRight: isSelected ? "3px solid var(--t-accent)" : "3px solid transparent",
                transition: "all 0.12s ease",
                position: "relative",
            }}
            onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.background = "var(--t-surface)"
            }}
            onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.background = "transparent"
            }}
        >
            {/* Avatar with online/status indicator */}
            <div style={{ position: "relative", flexShrink: 0 }}>
                {c.profile_photo ? (
                    <img src={c.profile_photo} alt={displayName}
                        style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover" }}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }} />
                ) : (
                    <Avatar name={displayName} size={42} />
                )}
                {/* Status dot */}
                <span style={{
                    position: "absolute", bottom: 0, right: 0,
                    width: 10, height: 10, borderRadius: "50%",
                    background: statusColor(c.session_status),
                    border: "2px solid var(--t-card)",
                }} />
                {/* Platform badge */}
                {c.platform_icon && (
                    <img src={c.platform_icon} alt={c.platform}
                        style={{
                            position: "absolute", top: -2, left: -2,
                            width: 16, height: 16, objectFit: "contain",
                            background: "var(--t-card)", borderRadius: "50%",
                            padding: 1,
                        }} />
                )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                {/* Row 1: Name + time */}
                <div style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between", gap: 6, marginBottom: 3,
                }}>
                    <span style={{
                        fontSize: 13,
                        fontWeight: hasUnread ? 700 : 500,
                        color: "var(--t-text)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        flex: 1,
                    }}>
                        {displayName}
                    </span>
                    <span style={{
                        fontSize: 10,
                        color: hasUnread ? "var(--t-accent)" : "var(--t-text-faint)",
                        fontWeight: hasUnread ? 600 : 400,
                        flexShrink: 0,
                    }}>
                        {timeAgo(c.last_timestamp)}
                    </span>
                </div>

                {/* Row 2: Last message + badges */}
                <div style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between", gap: 6,
                }}>
                    <div style={{
                        display: "flex", alignItems: "center", gap: 3,
                        flex: 1, minWidth: 0,
                    }}>
                        {/* Direction indicator */}
                        {c.last_direction === "outbound" && (
                            <span style={{ flexShrink: 0, color: "var(--t-text-faint)", display: "flex" }}>
                                {c.last_message_status === "read"
                                    ? <CheckCheck size={12} style={{ color: "#3b82f6" }} />
                                    : c.last_message_status === "delivered"
                                        ? <CheckCheck size={12} />
                                        : <Check size={12} />
                                }
                            </span>
                        )}
                        <p style={{
                            fontSize: 12, margin: 0,
                            color: hasUnread ? "var(--t-text)" : "var(--t-text-muted)",
                            fontWeight: hasUnread ? 500 : 400,
                            overflow: "hidden", textOverflow: "ellipsis",
                            whiteSpace: "nowrap", flex: 1,
                        }}>
                            {c.last_message_type !== "text" && c.last_message_type
                                ? `📎 ${c.last_message_type}`
                                : c.last_message || "—"
                            }
                        </p>
                    </div>

                    {/* Right badges */}
                    <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                        {c.favorite && (
                            <Star size={12} style={{ color: "#f59e0b", fill: "#f59e0b" }} />
                        )}
                        {c.muted && (
                            <BellOff size={12} style={{ color: "var(--t-text-faint)" }} />
                        )}
                        {hasUnread && (
                            <span style={{
                                fontSize: 10, fontWeight: 700,
                                padding: "1px 6px", borderRadius: 10,
                                background: "var(--t-accent)",
                                color: "var(--t-text-on-accent)",
                                minWidth: 18, textAlign: "center",
                                lineHeight: "16px",
                            }}>
                                {c.unread_count > 99 ? "99+" : c.unread_count}
                            </span>
                        )}
                    </div>
                </div>

                {/* Row 3: Tags/chips */}
                <div style={{
                    display: "flex", alignItems: "center", gap: 4,
                    marginTop: 4, flexWrap: "wrap",
                }}>
                    {/* Lifecycle chip */}
                    {c.lifecycle?.name && (
                        <span style={{
                            fontSize: 9.5, fontWeight: 500,
                            display: "inline-flex", alignItems: "center", gap: 2,
                            padding: "1px 6px", borderRadius: 10,
                            background: "var(--t-surface)",
                            color: "var(--t-text-muted)",
                        }}>
                            {c.lifecycle.icon && <span style={{ fontSize: 10 }}>{c.lifecycle.icon}</span>}
                            {c.lifecycle.name}
                        </span>
                    )}
                    {/* Assigned chip */}
                    {c.assigned?.is_assigned && (
                        <span style={{
                            fontSize: 9.5, fontWeight: 500,
                            padding: "1px 6px", borderRadius: 10,
                            background: "rgba(var(--t-accent-rgb, 59,130,246), 0.08)",
                            color: "var(--t-accent)",
                        }}>
                            {c.assigned_to || "Assigned"}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
