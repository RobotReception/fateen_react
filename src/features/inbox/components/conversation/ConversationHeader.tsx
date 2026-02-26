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
                        <Avatar name={displayName} size={28} />
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

            <style>{`
                .ch-row {
                    display:flex; align-items:center; justify-content:space-between;
                    padding:0 12px; height:42px;
                    background:var(--t-card);
                    border-bottom:1px solid var(--t-border-light);
                    flex-shrink:0; gap:10px;
                    direction:rtl;
                }
                .ch-identity {
                    display:flex; align-items:center; gap:8px;
                    min-width:0; flex-shrink:1; overflow:hidden;
                }
                .ch-avatar-click {
                    display:flex; align-items:center; gap:8px;
                    cursor:pointer; border-radius:8px;
                    padding:2px 6px 2px 2px;
                    transition:background .12s;
                }
                .ch-avatar-click:hover { background:var(--t-accent-muted); }
                .ch-avatar {
                    width:28px; height:28px; border-radius:50%;
                    object-fit:cover; flex-shrink:0;
                }
                .ch-name {
                    font-size:13px; font-weight:700;
                    color:var(--t-text);
                    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
                }
                .ch-sep { color:var(--t-text-faint); font-size:13px; flex-shrink:0; }
                .ch-lifecycle-badge {
                    display:inline-flex; align-items:center; gap:4px;
                    padding:2px 8px; border-radius:6px;
                    font-size:11px; font-weight:600;
                    white-space:nowrap; flex-shrink:0;
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
                    width:28px; height:28px; border-radius:6px;
                    border:1px solid var(--t-border-light);
                    background:transparent; cursor:pointer;
                    display:flex; align-items:center; justify-content:center;
                    color:var(--t-text-muted);
                    transition:all .12s; flex-shrink:0;
                }
                .ch-icon-btn:hover { background:var(--t-surface); border-color:var(--t-border); }
                .ch-icon-active { background:var(--t-surface) !important; border-color:var(--t-accent) !important; color:var(--t-accent) !important; }
            `}</style>
        </div>
    )
}
