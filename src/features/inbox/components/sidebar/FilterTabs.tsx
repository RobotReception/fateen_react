import type { InboxFilter } from "../../types/inbox.types"

const TABS: { key: InboxFilter; label: string }[] = [
    { key: "all", label: "الكل" },
    { key: "open", label: "مفتوح" },
    { key: "closed", label: "مغلق" },
    { key: "mine", label: "لي" },
]

interface FilterTabsProps {
    active: InboxFilter
    onChange: (f: InboxFilter) => void
}

export function FilterTabs({ active, onChange }: FilterTabsProps) {
    return (
        <div style={{
            display: "flex",
            gap: 2,
            padding: "4px 10px 8px",
            overflowX: "auto",
        }}>
            {TABS.map((tab) => {
                const isActive = tab.key === active
                return (
                    <button
                        key={tab.key}
                        onClick={() => onChange(tab.key)}
                        style={{
                            padding: "5px 12px",
                            borderRadius: 20,
                            border: "none",
                            fontSize: 12,
                            fontWeight: isActive ? 700 : 500,
                            cursor: "pointer",
                            transition: "all 0.15s",
                            whiteSpace: "nowrap",
                            background: isActive ? "var(--t-accent)" : "var(--t-surface)",
                            color: isActive ? "var(--t-text-on-accent)" : "var(--t-text-secondary)",
                        }}
                    >
                        {tab.label}
                    </button>
                )
            })}
        </div>
    )
}
