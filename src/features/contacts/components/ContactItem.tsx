import type { Contact } from "../types/contacts.types"
import { PlatformLogo, getPlatformColor } from "@/utils/platform-icons"

interface ContactItemProps {
    contact: Contact
    isSelected: boolean
    onClick: () => void
    tagMap: Map<string, { name: string; emoji?: string }>
    lifecycleMap: Map<string, { name: string; icon?: string; color?: string }>
    customFieldKeys: string[]
}

export function ContactItem({ contact: c, isSelected, onClick, lifecycleMap, customFieldKeys }: ContactItemProps) {
    const customName = [c.custom_fields?.first_name, c.custom_fields?.last_name].filter(Boolean).join(" ").trim()
    const name = customName || c.sender_name?.trim() || c.customer_id
    const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    const lc = c.lifecycle ? lifecycleMap.get(c.lifecycle) : null
    const isClosed = c.conversation_status?.is_closed

    return (
        <tr className={`ci-row ${isSelected ? "ci-sel" : ""}`} onClick={onClick}>
            <td className="ci-td ci-td-chk">
                <input type="checkbox" className="ci-chk" onClick={(e) => e.stopPropagation()} />
            </td>

            <td className="ci-td ci-td-name">
                <div className="ci-name-cell">
                    {c.platform_icon ? (
                        <img src={c.platform_icon} alt="" className="ci-avatar-img"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }} />
                    ) : (
                        <div className="ci-avatar">{initials}</div>
                    )}
                    <span className="ci-name-text">{name}</span>
                </div>
            </td>

            <td className="ci-td">
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", background: getPlatformColor(c.platform) }}>
                    <PlatformLogo platform={c.platform} fill="#fff" size={11} />
                </span>
            </td>

            <td className="ci-td">
                {lc ? (
                    <span className="ci-lc" style={{
                        background: lc.color ? `${lc.color}14` : "rgba(27,80,145,.05)",
                        color: lc.color || "var(--t-accent)",
                        borderColor: lc.color ? `${lc.color}25` : "rgba(27,80,145,.1)",
                    }}>
                        {lc.icon && <span style={{ marginLeft: 2 }}>{lc.icon}</span>}
                        {lc.name}
                    </span>
                ) : <span className="ci-muted">—</span>}
            </td>

            {customFieldKeys.map((key) => (
                <td key={key} className="ci-td ci-muted">{c.custom_fields?.[key] || "—"}</td>
            ))}

            <td className="ci-td ci-muted">
                {(c.tags?.length ?? 0) > 0 ? `${c.tags!.length} وسم` : "—"}
            </td>

            <td className="ci-td ci-muted">
                {(c.team_ids?.teams?.length ?? 0) > 0 ? `${c.team_ids!.teams.length} فريق` : "—"}
            </td>

            <td className="ci-td">
                <span className={`ci-status ${isClosed ? "ci-status-closed" : "ci-status-open"}`}>
                    {isClosed ? "مغلقة" : "مفتوحة"}
                </span>
            </td>

            <style>{`
                .ci-row{cursor:pointer;transition:background .1s;border-bottom:1px solid #f0f1f3}
                .ci-row:hover{background:var(--t-page)}
                .ci-sel{background:rgba(27,80,145,.03)!important}
                .ci-sel:hover{background:rgba(27,80,145,.05)!important}
                .ci-td{padding:9px 12px;font-size:12.5px;color:var(--t-text-secondary);white-space:nowrap;vertical-align:middle;font-weight:500}
                .ci-td-chk{width:36px;text-align:center}
                .ci-chk{width:13px;height:13px;border-radius:3px;cursor:pointer;accent-color:var(--t-accent)}
                .ci-td-name{min-width:160px}
                .ci-name-cell{display:flex;align-items:center;gap:8px}
                .ci-avatar{width:30px;height:30px;border-radius:50%;background:var(--t-gradient-accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0}
                .ci-avatar-img{width:30px;height:30px;border-radius:50%;object-fit:cover;flex-shrink:0}
                .ci-name-text{font-weight:600;color:var(--t-text);overflow:hidden;text-overflow:ellipsis;font-size:12.5px}
                .ci-channel{width:18px;height:18px;object-fit:contain}
                .ci-channel-text{font-size:11px;color:#b0b7c3;text-transform:capitalize}
                .ci-lc{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:600;border:1px solid}
                .ci-muted{color:#b0b7c3;font-size:11px}
                .ci-status{font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px}
                .ci-status-open{background:rgba(22,163,74,.06);color:#16a34a}
                .ci-status-closed{background:rgba(239,68,68,.06);color:var(--t-danger)}
            `}</style>
        </tr>
    )
}
