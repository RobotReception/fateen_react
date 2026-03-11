import { useState, useRef, useCallback, memo } from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { Avatar } from "../ui/Avatar"
import { Star, BellOff, Check, CheckCheck, MoreHorizontal } from "lucide-react"
import type { Customer } from "../../types/inbox.types"
import { CustomerActionsMenu } from "../conversation/CustomerActionsMenu"
import { getTimeOrDate } from "../../../../utils/time"
import { PlatformLogo, getPlatformColor } from "@/utils/platform-icons"
import { getCustomerMessages } from "../../services/inbox-service"


function sessionDot(status?: string): string {
    switch (status) {
        case "open": return "var(--t-success)"
        case "pending": return "var(--t-warning)"
        case "closed": return "var(--t-text-faint)"
        default: return "var(--t-text-faint)"
    }
}

const PREFETCH_PAGE_SIZE = 20

interface ConversationItemProps {
    customer: Customer
    isSelected: boolean
}

export const ConversationItem = memo(function ConversationItem({ customer: c, isSelected }: ConversationItemProps) {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const customName = [c.custom_fields?.first_name, c.custom_fields?.last_name].filter(Boolean).join(" ").trim()
    const displayName = customName || c.sender_name?.trim() || c.customer_id
    const hasUnread = c.unread_count > 0
    const isClosed = c.conversation_status?.is_closed
    const [hovered, setHovered] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const menuBtnRef = useRef<HTMLButtonElement>(null)

    // ── Prefetch messages on hover — data ready before click ──
    const handleMouseEnter = useCallback(() => {
        setHovered(true)
        queryClient.prefetchInfiniteQuery({
            queryKey: ["customer-messages", c.customer_id, c.account_id],
            queryFn: () =>
                getCustomerMessages(c.customer_id, {
                    page: 1,
                    page_size: PREFETCH_PAGE_SIZE,
                    ...(c.account_id && { account_id: c.account_id }),
                }),
            initialPageParam: 1,
            staleTime: 30_000,
        })
    }, [queryClient, c.customer_id, c.account_id])

    return (
        <div
            className={`ci-row ${isSelected ? "ci-selected" : ""} ${hovered ? "ci-hover" : ""}`}
            onClick={(e) => {
                if (menuOpen) return
                if (menuBtnRef.current?.contains(e.target as Node)) return
                const accParam = c.account_id ? `?acc=${encodeURIComponent(c.account_id)}` : ""
                navigate(`/dashboard/inbox/${c.customer_id}${accParam}`)
                queryClient.setQueriesData<any>(
                    { queryKey: ["inbox-customers"] },
                    (old: any) => {
                        if (!old?.items) return old
                        return {
                            ...old,
                            items: old.items.map((item: any) =>
                                item.customer_id === c.customer_id && item.account_id === c.account_id
                                    ? { ...item, unread_count: 0, isRead: true }
                                    : item
                            ),
                        }
                    }
                )
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => { if (!menuOpen) setHovered(false) }}
        >
            {/* ── Avatar ── */}
            <div className="ci-avatar-wrap">
                {c.profile_photo ? (
                    <img src={c.profile_photo} alt={displayName} className="ci-avatar"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }} />
                ) : (
                    <Avatar name={displayName} size={42} />
                )}
                <span className="ci-status-dot" style={{ background: sessionDot(c.session_status) }} />
                <span className="ci-platform-badge" style={{ background: getPlatformColor(c.platform) }}>
                    <PlatformLogo platform={c.platform} fill="#fff" size={10} />
                </span>
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
                            {getTimeOrDate(c.last_timestamp)}
                        </span>
                    </div>
                </div>

                {/* Row 2: Message preview + unread badge */}
                <div className="ci-mid">
                    <div className="ci-msg-row">
                        {c.last_direction === "outbound" && (
                            <span className="ci-tick">
                                {c.last_message_status === "read"
                                    ? <CheckCheck size={13} style={{ color: "var(--t-accent-secondary)" }} />
                                    : c.last_message_status === "delivered"
                                        ? <CheckCheck size={13} />
                                        : <Check size={13} />
                                }
                            </span>
                        )}
                        <p className={`ci-preview ${hasUnread ? "ci-preview-bold" : ""}`}>
                            {c.last_message_type === "template"
                                ? `📋 ${c.last_message || "template"}`
                                : c.last_message_type !== "text" && c.last_message_type
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
                    padding:11px 14px 11px 12px; cursor:pointer;
                    border-bottom:1px solid var(--t-border-light);
                    border-right:3px solid transparent;
                    transition:all .18s ease; position:relative;
                }
                .ci-row:hover, .ci-hover {
                    background:var(--t-surface);
                }
                .ci-selected {
                    background:rgba(27,80,145,0.06) !important;
                    border-right-color:var(--t-accent-secondary) !important;
                }
                .ci-selected::before {
                    content:'';
                    position:absolute; top:0; right:0; bottom:0;
                    width:100%;
                    background:linear-gradient(90deg, transparent, rgba(0,114,181,0.03));
                    pointer-events:none;
                }

                /* Avatar */
                .ci-avatar-wrap {
                    position:relative; flex-shrink:0;
                    width:42px; height:42px;
                }
                .ci-avatar {
                    width:42px; height:42px; border-radius:50%;
                    object-fit:cover;
                    border:2px solid var(--t-border-light);
                }
                .ci-status-dot {
                    position:absolute; bottom:0; right:0;
                    width:11px; height:11px; border-radius:50%;
                    border:2.5px solid var(--t-card);
                    box-shadow:0 0 0 1px rgba(0,0,0,0.05);
                }
                .ci-platform-badge {
                    position:absolute; top:-2px; left:-2px;
                    width:16px; height:16px;
                    border-radius:50%;
                    display:flex; align-items:center; justify-content:center;
                    box-shadow:0 1px 3px rgba(0,0,0,0.1);
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
                    color:var(--t-accent-secondary); font-weight:700;
                }
                .ci-menu-btn {
                    width:22px; height:22px; border-radius:6px;
                    border:1px solid transparent; background:transparent;
                    cursor:pointer;
                    display:flex; align-items:center; justify-content:center;
                    color:var(--t-text-muted);
                    transition:all .12s; padding:0;
                }
                .ci-menu-btn:hover, .ci-menu-active {
                    background:var(--t-surface-deep, var(--t-surface));
                    border-color:var(--t-border-light);
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
                .ci-preview-bold { color:var(--t-text); font-weight:600; }
                .ci-badges {
                    display:flex; align-items:center; gap:4px; flex-shrink:0;
                }
                .ci-muted-icon { color:var(--t-text-faint); }
                .ci-unread-badge {
                    font-size:10px; font-weight:700;
                    padding:1px 6px; border-radius:10px;
                    background:var(--t-brand-orange);
                    color:#fff; min-width:18px; text-align:center;
                    line-height:16px;
                    box-shadow:0 1px 4px rgba(27,80,145,0.25);
                }

                /* Row 3: chips */
                .ci-chips {
                    display:flex; align-items:center; gap:4px;
                    margin-top:5px; flex-wrap:wrap;
                }
                .ci-chip {
                    font-size:10px; font-weight:500;
                    display:inline-flex; align-items:center; gap:2px;
                    padding:1px 8px; border-radius:10px;
                    line-height:16px;
                    border:1px solid transparent;
                }
                .ci-chip-icon { font-size:10px; }
                .ci-chip-lc {
                    background:rgba(27,80,145,0.06);
                    color:var(--t-accent);
                    border-color:rgba(27,80,145,0.1);
                }
                .ci-chip-agent {
                    background:var(--t-accent-muted);
                    color:var(--t-accent-secondary);
                    border-color:rgba(0,114,181,0.12);
                }
                .ci-chip-closed {
                    background:var(--t-danger-soft, rgba(239,68,68,0.08));
                    color:var(--t-danger, var(--t-danger));
                    border-color:rgba(239,68,68,0.12);
                }
            `}</style>
        </div>
    )
}, (prev, next) => {
    const a = prev.customer
    const b = next.customer
    return (
        prev.isSelected === next.isSelected &&
        a.customer_id === b.customer_id &&
        a.account_id === b.account_id &&
        a.unread_count === b.unread_count &&
        a.last_message === b.last_message &&
        a.last_timestamp === b.last_timestamp &&
        a.session_status === b.session_status &&
        a.sender_name === b.sender_name &&
        a.favorite === b.favorite &&
        a.muted === b.muted &&
        a.enable_ai === b.enable_ai &&
        a.last_direction === b.last_direction &&
        a.last_message_status === b.last_message_status &&
        a.last_message_type === b.last_message_type &&
        a.assigned?.assigned_to === b.assigned?.assigned_to &&
        a.lifecycle?.code === b.lifecycle?.code &&
        a.conversation_status?.is_closed === b.conversation_status?.is_closed
    )
})
