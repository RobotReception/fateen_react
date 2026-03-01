import { Avatar } from "../ui/Avatar"
import type { Customer } from "../../types/inbox.types"
import { AssignPanel } from "./AssignPanel"

interface Props { customer: Customer }

export function ConversationHeader({ customer: c }: Props) {
    const displayName = c.sender_name?.trim() || c.customer_id

    return (
        <div className="ch-row">
            {/* ── Right side (RTL): Avatar + Name + Lifecycle badge ── */}
            <div className="ch-identity">
                <div className="ch-avatar-click" onClick={() => window.dispatchEvent(new CustomEvent("open-contact-details"))}>
                    {c.profile_photo ? (
                        <img src={c.profile_photo} alt="" className="ch-avatar"
                            onError={e => { e.currentTarget.style.display = "none" }} />
                    ) : (
                        <Avatar name={displayName} size={30} />
                    )}
                    <span className="ch-name">{displayName}</span>
                </div>
                {c.lifecycle?.name && (
                    <>
                        <span className="ch-sep">›</span>
                        <span className="ch-lifecycle-badge">
                            {c.lifecycle.icon && <span style={{ fontSize: 11 }}>{c.lifecycle.icon}</span>}
                            {c.lifecycle.name}
                        </span>
                    </>
                )}
                {c.platform_icon && (
                    <>
                        <span className="ch-sep">›</span>
                        <img src={c.platform_icon} alt={c.platform || ""} title={c.platform || ""}
                            style={{ width: 16, height: 16, flexShrink: 0 }} />
                    </>
                )}
            </div>

            {/* ── Left side (RTL): Action buttons ── */}
            <div className="ch-actions">
                <AssignPanel customer={c} />
            </div>

            {/* Gradient bottom border */}
            <div className="ch-bottom-border" />

            <style>{`
                .ch-row {
                    display:flex; align-items:center; justify-content:space-between;
                    padding:0 14px; height:46px;
                    background:var(--t-card);
                    flex-shrink:0; gap:10px;
                    direction:rtl;
                    position:relative;
                }
                .ch-bottom-border {
                    position:absolute; bottom:0; left:0; right:0;
                    height:2px;
                    background:linear-gradient(90deg, transparent, rgba(0,114,181,0.15), rgba(0,71,134,0.2), rgba(0,114,181,0.15), transparent);
                }

                .ch-identity {
                    display:flex; align-items:center; gap:8px;
                    min-width:0; flex-shrink:1; overflow:hidden;
                }
                .ch-avatar-click {
                    display:flex; align-items:center; gap:8px;
                    cursor:pointer; border-radius:8px;
                    padding:3px 8px 3px 3px;
                    transition:all .15s;
                    border:1px solid transparent;
                }
                .ch-avatar-click:hover {
                    background:rgba(0,114,181,0.06);
                    border-color:rgba(0,114,181,0.1);
                }
                .ch-avatar {
                    width:30px; height:30px; border-radius:50%;
                    object-fit:cover; flex-shrink:0;
                    border:2px solid var(--t-border-light);
                }
                .ch-name {
                    font-size:13.5px; font-weight:700;
                    color:var(--t-text);
                    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
                    letter-spacing:-0.01em;
                }
                .ch-sep {
                    color:var(--t-text-faint); font-size:13px; flex-shrink:0;
                    opacity:0.5;
                }
                .ch-lifecycle-badge {
                    display:inline-flex; align-items:center; gap:4px;
                    padding:2px 9px; border-radius:6px;
                    font-size:11px; font-weight:600;
                    white-space:nowrap; flex-shrink:0;
                    background:rgba(0,71,134,0.06);
                    color:#004786;
                    border:1px solid rgba(0,71,134,0.1);
                }
                .ch-platform {
                    display:inline-flex; align-items:center; gap:3px;
                    font-size:11px; color:var(--t-text-faint);
                    white-space:nowrap; flex-shrink:0;
                }
                .ch-actions {
                    display:flex; align-items:center; gap:4px;
                    flex-shrink:0;
                }
                .ch-icon-btn {
                    width:30px; height:30px; border-radius:7px;
                    border:1px solid var(--t-border-light);
                    background:transparent; cursor:pointer;
                    display:flex; align-items:center; justify-content:center;
                    color:var(--t-text-muted);
                    transition:all .15s; flex-shrink:0;
                }
                .ch-icon-btn:hover {
                    background:var(--t-surface);
                    border-color:var(--t-border);
                    color:var(--t-text);
                }
                .ch-icon-active {
                    background:rgba(0,114,181,0.06) !important;
                    border-color:#0072b5 !important;
                    color:#0072b5 !important;
                }
            `}</style>
        </div>
    )
}
