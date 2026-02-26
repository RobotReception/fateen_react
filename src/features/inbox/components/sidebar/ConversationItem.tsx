import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { Avatar } from "../ui/Avatar"
import { Star, BellOff, Check, CheckCheck, MoreHorizontal } from "lucide-react"
import type { Customer } from "../../types/inbox.types"
import { CustomerActionsMenu } from "../conversation/CustomerActionsMenu"

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
    if (days < 7) return new Date(dateStr).toLocaleDateString("en", { weekday: "short", timeZone: "Asia/Aden" })
    return new Date(dateStr).toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "Asia/Aden" })
}

function sessionDot(status?: string): string {
    switch (status) {
        case "open": return "var(--t-success)"
        case "pending": return "var(--t-warning)"
        case "closed": return "var(--t-text-faint)"
        default: return "var(--t-text-faint)"
    }
}

interface ConversationItemProps {
    customer: Customer
    isSelected: boolean
}

export function ConversationItem({ customer: c, isSelected }: ConversationItemProps) {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const displayName = c.sender_name?.trim() || c.customer_id
    const hasUnread = c.unread_count > 0
    const isClosed = c.conversation_status?.is_closed
    const [hovered, setHovered] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const menuBtnRef = useRef<HTMLButtonElement>(null)

    return (
        <div
            className={`ci-row ${isSelected ? "ci-selected" : ""} ${hovered ? "ci-hover" : ""}`}
            onClick={(e) => {
                if (menuOpen) return
                if (menuBtnRef.current?.contains(e.target as Node)) return
                navigate(`/dashboard/inbox/${c.customer_id}`)
                // Optimistically clear unread badge in cache + background refresh
                queryClient.setQueriesData<any>(
                    { queryKey: ["inbox-customers"] },
                    (old: any) => {
                        if (!old?.items) return old
                        return {
                            ...old,
                            items: old.items.map((item: any) =>
                                item.customer_id === c.customer_id
                                    ? { ...item, unread_count: 0, isRead: true }
                                    : item
                            ),
                        }
                    }
                )
                queryClient.invalidateQueries({ queryKey: ["customer-messages", c.customer_id] })
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => { if (!menuOpen) setHovered(false) }}
        >
            {/* ── Avatar ── */}
            <div className="ci-avatar-wrap">
                {c.profile_photo ? (
                    <img src={c.profile_photo} alt={displayName} className="ci-avatar"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }} />
                ) : (
                    <Avatar name={displayName} size={40} />
                )}
                <span className="ci-status-dot" style={{ background: sessionDot(c.session_status) }} />
                {c.platform_icon && (
                    <img src={c.platform_icon} alt={c.platform} className="ci-platform-badge" />
                )}
            </div>

            {/* ── Content ── */}
            <div className="ci-body">
                {/* Row 1: Name + time */}
                <div className="ci-top">
                    <span className={`ci-name ${hasUnread ? "ci-name-bold" : ""}`}>
                        {displayName}
                    </span>
                    <div className="ci-top-right">
                        {/* ⋯ menu button on hover */}
                        {(hovered || menuOpen) && (
                            <div style={{ position: "relative" }}>
                                <button
                                    ref={menuBtnRef}
                                    className={`ci-menu-btn ${menuOpen ? "ci-menu-active" : ""}`}
                                    onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
                                    title="المزيد"
                                >
                                    <MoreHorizontal size={13} />
                                </button>
                                <CustomerActionsMenu
                                    customer={c}
                                    open={menuOpen}
                                    onClose={() => { setMenuOpen(false); setHovered(false) }}
                                    anchorRef={menuBtnRef}
                                />
                            </div>
                        )}
                        <span className={`ci-time ${hasUnread ? "ci-time-accent" : ""}`}>
                            {timeAgo(c.last_timestamp)}
                        </span>
                    </div>
                </div>

                {/* Row 2: Message preview + unread badge */}
                <div className="ci-mid">
                    <div className="ci-msg-row">
                        {c.last_direction === "outbound" && (
                            <span className="ci-tick">
                                {c.last_message_status === "read"
                                    ? <CheckCheck size={13} style={{ color: "var(--t-info)" }} />
                                    : c.last_message_status === "delivered"
                                        ? <CheckCheck size={13} />
                                        : <Check size={13} />
                                }
                            </span>
                        )}
                        <p className={`ci-preview ${hasUnread ? "ci-preview-bold" : ""}`}>
                            {c.last_message_type !== "text" && c.last_message_type
                                ? `📎 ${c.last_message_type}`
                                : c.last_message || "—"
                            }
                        </p>
                    </div>
                    <div className="ci-badges">
                        {c.favorite && <Star size={12} style={{ color: "var(--t-warning)", fill: "var(--t-warning)" }} />}
                        {c.muted && <BellOff size={12} className="ci-muted-icon" />}
                        {hasUnread && (
                            <span className="ci-unread-badge">
                                {c.unread_count > 99 ? "99+" : c.unread_count}
                            </span>
                        )}
                    </div>
                </div>

                {/* Row 3: Chips */}
                {(c.lifecycle?.name || c.assigned?.is_assigned || isClosed) && (
                    <div className="ci-chips">
                        {c.lifecycle?.name && (
                            <span className="ci-chip ci-chip-lc">
                                {c.lifecycle.icon && <span className="ci-chip-icon">{c.lifecycle.icon}</span>}
                                {c.lifecycle.name}
                            </span>
                        )}
                        {c.assigned?.is_assigned && (
                            <span className="ci-chip ci-chip-agent">
                                {c.assigned.assigned_to_username || "Assigned"}
                            </span>
                        )}
                        {isClosed && (
                            <span className="ci-chip ci-chip-closed">Closed</span>
                        )}
                    </div>
                )}
            </div>

            {/* ── Styles ── */}
            <style>{`
                .ci-row {
                    display:flex; align-items:flex-start; gap:10px;
                    padding:10px 14px 10px 12px; cursor:pointer;
                    border-bottom:1px solid var(--t-border-light);
                    border-right:3px solid transparent;
                    transition:all .15s ease; position:relative;
                }
                .ci-row:hover, .ci-hover { background:var(--t-surface); }
                .ci-selected {
                    background:var(--t-accent-muted) !important;
                    border-right-color:var(--t-accent) !important;
                }

                /* Avatar */
                .ci-avatar-wrap {
                    position:relative; flex-shrink:0;
                    width:40px; height:40px;
                }
                .ci-avatar {
                    width:40px; height:40px; border-radius:50%;
                    object-fit:cover;
                }
                .ci-status-dot {
                    position:absolute; bottom:0; right:0;
                    width:10px; height:10px; border-radius:50%;
                    border:2px solid var(--t-card);
                }
                .ci-platform-badge {
                    position:absolute; top:-2px; left:-2px;
                    width:15px; height:15px; object-fit:contain;
                    background:var(--t-card); border-radius:50%;
                    padding:1px;
                }

                /* Body */
                .ci-body { flex:1; min-width:0; }

                /* Row 1: name + time */
                .ci-top {
                    display:flex; align-items:center;
                    justify-content:space-between; gap:6px;
                    margin-bottom:2px;
                }
                .ci-name {
                    font-size:13px; font-weight:500;
                    color:var(--t-text);
                    overflow:hidden; text-overflow:ellipsis;
                    white-space:nowrap; flex:1; line-height:1.3;
                }
                .ci-name-bold { font-weight:700; }
                .ci-top-right {
                    display:flex; align-items:center; gap:4px; flex-shrink:0;
                }
                .ci-time {
                    font-size:10px; font-weight:400;
                    color:var(--t-text-faint);
                }
                .ci-time-accent {
                    color:var(--t-accent); font-weight:600;
                }
                .ci-menu-btn {
                    width:20px; height:20px; border-radius:5px;
                    border:none; background:transparent; cursor:pointer;
                    display:flex; align-items:center; justify-content:center;
                    color:var(--t-text-muted);
                    transition:background .1s; padding:0;
                }
                .ci-menu-btn:hover, .ci-menu-active {
                    background:var(--t-border-light);
                }

                /* Row 2: message preview */
                .ci-mid {
                    display:flex; align-items:center;
                    justify-content:space-between; gap:6px;
                    margin-bottom:1px;
                }
                .ci-msg-row {
                    display:flex; align-items:center; gap:3px;
                    flex:1; min-width:0;
                }
                .ci-tick {
                    flex-shrink:0; display:flex;
                    color:var(--t-text-faint);
                }
                .ci-preview {
                    font-size:12px; margin:0; line-height:1.4;
                    color:var(--t-text-muted); font-weight:400;
                    overflow:hidden; text-overflow:ellipsis;
                    white-space:nowrap; flex:1;
                }
                .ci-preview-bold { color:var(--t-text); font-weight:500; }
                .ci-badges {
                    display:flex; align-items:center; gap:4px; flex-shrink:0;
                }
                .ci-muted-icon { color:var(--t-text-faint); }
                .ci-unread-badge {
                    font-size:10px; font-weight:700;
                    padding:1px 6px; border-radius:10px;
                    background:var(--t-accent);
                    color:var(--t-text-on-accent); min-width:18px; text-align:center;
                    line-height:16px;
                }

                /* Row 3: chips */
                .ci-chips {
                    display:flex; align-items:center; gap:4px;
                    margin-top:4px; flex-wrap:wrap;
                }
                .ci-chip {
                    font-size:10px; font-weight:500;
                    display:inline-flex; align-items:center; gap:2px;
                    padding:1px 7px; border-radius:10px;
                    line-height:16px;
                }
                .ci-chip-icon { font-size:10px; }
                .ci-chip-lc {
                    background:var(--t-surface);
                    color:var(--t-text-muted);
                }
                .ci-chip-agent {
                    background:var(--t-accent-muted);
                    color:var(--t-accent);
                }
                .ci-chip-closed {
                    background:var(--t-danger-soft);
                    color:var(--t-danger);
                }
            `}</style>
        </div>
    )
}
