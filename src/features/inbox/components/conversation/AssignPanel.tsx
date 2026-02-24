import { UserCircle, Users, Tag, Bot } from "lucide-react"
import type { Customer } from "../../types/inbox.types"

interface Props { customer: Customer }

export function AssignPanel({ customer: c }: Props) {
    const agentName = c.assigned?.assigned_to_username || c.assigned?.assigned_to || c.assigned_to
    const teamNames = c.team_ids?.teams?.join(", ")

    return (
        <div style={{
            display: "flex", gap: 8, padding: "6px 12px 8px",
            borderBottom: "1px solid var(--t-border-light)",
            background: "var(--t-card)", flexShrink: 0, flexWrap: "wrap",
        }}>
            {/* Agent */}
            <Chip icon={<UserCircle size={12} />}
                value={agentName || "لا يوجد وكيل"}
                empty={!agentName} />

            {/* Team */}
            {teamNames && (
                <Chip icon={<Users size={12} />} value={teamNames} />
            )}

            {/* Lifecycle */}
            {c.lifecycle?.name && (
                <Chip
                    icon={<span style={{ fontSize: 11 }}>{c.lifecycle.icon || "📌"}</span>}
                    value={c.lifecycle.name}
                />
            )}

            {/* AI */}
            <Chip
                icon={<Bot size={12} />}
                value={c.enable_ai ? "AI مفعّل" : "AI معطّل"}
            />
        </div>
    )
}

function Chip({ icon, value, empty }: { icon: React.ReactNode; value: string; empty?: boolean }) {
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "4px 8px", borderRadius: 8,
            background: "var(--t-surface)",
            border: "1px solid var(--t-border-light)",
        }}>
            <span style={{ color: "var(--t-text-faint)", flexShrink: 0 }}>{icon}</span>
            <span style={{ fontSize: 11, color: empty ? "var(--t-text-faint)" : "var(--t-text)" }}>{value}</span>
        </div>
    )
}
