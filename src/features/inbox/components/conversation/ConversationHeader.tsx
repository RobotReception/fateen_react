import { Avatar } from "../ui/Avatar"
import { useQueryClient } from "@tanstack/react-query"
import type { Customer } from "../../types/inbox.types"
import { AssignPanel } from "./AssignPanel"
import { PlatformLogo, getPlatformColor } from "@/utils/platform-icons"

interface Props { customer: Customer }

export function ConversationHeader({ customer: c }: Props) {
    const customName = [c.custom_fields?.first_name, c.custom_fields?.last_name].filter(Boolean).join(" ").trim()
    const displayName = customName || c.sender_name?.trim() || c.customer_id
    const queryClient = useQueryClient()

    // Resolve account name from cached accounts data
    const accountName = (() => {
        if (!c.account_id) return null
        const accountsData = queryClient.getQueryData<{ accounts?: { account_id: string; name?: string; platform?: string }[] }>(["customer-accounts"])
        const account = accountsData?.accounts?.find(a => a.account_id === c.account_id)
        return account?.name || c.platform || null
    })()

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
                <>
                    <span className="ch-sep">›</span>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, borderRadius: "50%", background: getPlatformColor(c.platform), flexShrink: 0 }}>
                        <PlatformLogo platform={c.platform} fill="#fff" size={10} />
                    </span>
                </>
                {accountName && (
                    <span className="ch-account-name" title={`الحساب: ${accountName}`}>
                        {accountName}
                    </span>
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
                    background:linear-gradient(90deg, transparent, rgba(0,114,181,0.15), var(--t-accent-muted), rgba(0,114,181,0.15), transparent);
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
                    background:var(--t-accent-muted);
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
                    background:rgba(27,80,145,0.06);
                    color:var(--t-accent);
                    border:1px solid rgba(27,80,145,0.1);
                }
                .ch-account-name {
                    font-size:10.5px; font-weight:600;
                    color:var(--t-text-muted, var(--t-text-muted));
                    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
                    max-width:140px; flex-shrink:1;
                    padding:2px 8px; border-radius:5px;
                    background:var(--t-surface, var(--t-surface));
                    border:1px solid var(--t-border-light, var(--t-border));
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
                    background:var(--t-accent-muted) !important;
                    border-color:var(--t-accent-secondary) !important;
                    color:var(--t-accent-secondary) !important;
                }
            `}</style>
        </div>
    )
}

