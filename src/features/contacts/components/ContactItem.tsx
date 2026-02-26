import type { Contact } from "../types/contacts.types"

interface ContactItemProps {
    contact: Contact
    isSelected: boolean
    onClick: () => void
    tagMap: Map<string, { name: string; emoji?: string }>
    lifecycleMap: Map<string, { name: string; icon?: string; color?: string }>
    customFieldKeys: string[]
}

export function ContactItem({ contact: c, isSelected, onClick, lifecycleMap, customFieldKeys }: ContactItemProps) {
    const name = c.sender_name?.trim() || c.customer_id
    const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()

    // Resolve lifecycle code → name + icon
    const lc = c.lifecycle ? lifecycleMap.get(c.lifecycle) : null

    const isClosed = c.conversation_status?.is_closed

    return (
        <tr
            className={`ct-row ${isSelected ? "ct-row-selected" : ""}`}
            onClick={onClick}
        >
            {/* Checkbox */}
            <td className="ct-td ct-td-check">
                <input type="checkbox" className="ct-checkbox" onClick={(e) => e.stopPropagation()} />
            </td>

            {/* Name */}
            <td className="ct-td ct-td-name">
                <div className="ct-name-cell">
                    {c.platform_icon ? (
                        <img src={c.platform_icon} alt="" className="ct-avatar-img"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }} />
                    ) : (
                        <div className="ct-avatar">{initials}</div>
                    )}
                    <span className="ct-name-text">{name}</span>
                </div>
            </td>

            {/* Channel(s) */}
            <td className="ct-td">
                {c.platform_icon ? (
                    <img src={c.platform_icon} alt={c.platform} className="ct-channel-icon" />
                ) : (
                    <span className="ct-channel-text">{c.platform || "—"}</span>
                )}
            </td>

            {/* Lifecycle (resolved name) */}
            <td className="ct-td">
                {lc ? (
                    <span className="ct-lifecycle-badge" style={{
                        background: lc.color ? `${lc.color}18` : undefined,
                        color: lc.color || undefined,
                    }}>
                        {lc.icon && <span style={{ marginLeft: 2 }}>{lc.icon}</span>}
                        {lc.name}
                    </span>
                ) : "—"}
            </td>

            {/* ── Dynamic custom_fields columns ── */}
            {customFieldKeys.map((key) => {
                const val = c.custom_fields?.[key] ?? ""
                return (
                    <td key={key} className="ct-td ct-td-secondary">
                        {val || "—"}
                    </td>
                )
            })}

            {/* Tags (count) */}
            <td className="ct-td ct-td-secondary">
                {(c.tags?.length ?? 0) > 0 ? `${c.tags!.length} تاج` : "—"}
            </td>

            {/* Teams (count) */}
            <td className="ct-td ct-td-secondary">
                {(c.team_ids?.teams?.length ?? 0) > 0
                    ? `${c.team_ids!.teams.length} فريق`
                    : "—"
                }
            </td>

            {/* Conversation Status */}
            <td className="ct-td">
                <span className={`ct-status ${isClosed ? "ct-status-closed" : "ct-status-open"}`}>
                    {isClosed ? "Closed" : "Open"}
                </span>
            </td>

            <style>{`
                .ct-row {
                    cursor:pointer;
                    transition:background .12s;
                    border-bottom:1px solid var(--t-border-light);
                }
                .ct-row:hover {
                    background:var(--t-surface);
                }
                .ct-row-selected {
                    background:var(--t-accent-muted) !important;
                }
                .ct-td {
                    padding:10px 12px;
                    font-size:13px;
                    color:var(--t-text-secondary);
                    white-space:nowrap;
                    vertical-align:middle;
                }
                .ct-td-check {
                    width:40px; text-align:center;
                }
                .ct-checkbox {
                    width:15px; height:15px;
                    border-radius:3px; cursor:pointer;
                    accent-color:var(--t-accent);
                }
                .ct-td-name { min-width:180px; }
                .ct-name-cell {
                    display:flex; align-items:center; gap:10px;
                }
                .ct-avatar {
                    width:32px; height:32px; border-radius:50%;
                    background:var(--t-accent);
                    color:var(--t-text-on-accent);
                    display:flex; align-items:center; justify-content:center;
                    font-size:11px; font-weight:700; flex-shrink:0;
                }
                .ct-avatar-img {
                    width:32px; height:32px; border-radius:50%;
                    object-fit:cover; flex-shrink:0;
                }
                .ct-name-text {
                    font-weight:600; color:var(--t-text);
                    overflow:hidden; text-overflow:ellipsis;
                }
                .ct-channel-icon {
                    width:20px; height:20px; object-fit:contain;
                }
                .ct-channel-text {
                    font-size:12px; color:var(--t-text-faint);
                    text-transform:capitalize;
                }
                .ct-lifecycle-badge {
                    display:inline-flex; align-items:center; gap:4px;
                    padding:3px 10px; border-radius:12px;
                    font-size:11px; font-weight:600;
                    background:var(--t-info-soft, rgba(59,130,246,0.1));
                    color:var(--t-info, #3b82f6);
                }
                .ct-td-secondary {
                    color:var(--t-text-muted);
                    font-size:12px;
                }
                .ct-status {
                    font-size:11px; font-weight:600;
                    padding:3px 10px; border-radius:12px;
                }
                .ct-status-open {
                    background:var(--t-success-soft, rgba(34,197,94,0.1));
                    color:var(--t-success, #22c55e);
                }
                .ct-status-closed {
                    background:var(--t-danger-soft, rgba(239,68,68,0.1));
                    color:var(--t-danger, #ef4444);
                }
            `}</style>
        </tr>
    )
}
