import type { SessionStatus } from "../../types/inbox.types"

const MAP: Record<SessionStatus, { label: string; color: string; bg: string }> = {
    open: { label: "مفتوح", color: "#059669", bg: "#d1fae5" },
    closed: { label: "مغلق", color: "var(--t-text-muted)", bg: "var(--t-surface)" },
    pending: { label: "معلق", color: "#d97706", bg: "#fef3c7" },
}

export function StatusBadge({ status }: { status: SessionStatus }) {
    const { label, color, bg } = MAP[status] ?? MAP.pending
    return (
        <span style={{
            fontSize: 10, fontWeight: 700,
            padding: "2px 7px", borderRadius: 10,
            color, background: bg,
            display: "inline-block",
        }}>
            {label}
        </span>
    )
}
