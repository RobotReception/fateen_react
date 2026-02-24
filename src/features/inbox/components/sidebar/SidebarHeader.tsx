import { Search, Plus } from "lucide-react"

interface SidebarHeaderProps {
    searchQuery: string
    onSearch: (v: string) => void
}

export function SidebarHeader({ searchQuery, onSearch }: SidebarHeaderProps) {
    return (
        <div style={{ padding: "14px 12px 8px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--t-text)" }}>المحادثات</h2>
                <button
                    title="محادثة جديدة"
                    style={{
                        width: 32, height: 32, borderRadius: 8,
                        border: "1px solid var(--t-border)",
                        background: "var(--t-surface)",
                        cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "var(--t-text-secondary)",
                        transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--t-card-hover)" }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--t-surface)" }}
                >
                    <Plus size={15} />
                </button>
            </div>

            {/* Search */}
            <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 10px",
                background: "var(--t-surface)",
                border: "1px solid var(--t-border-light)",
                borderRadius: 8,
            }}>
                <Search size={13} style={{ color: "var(--t-text-faint)", flexShrink: 0 }} />
                <input
                    type="text"
                    placeholder="بحث في المحادثات..."
                    value={searchQuery}
                    onChange={(e) => onSearch(e.target.value)}
                    style={{
                        flex: 1, border: "none", outline: "none",
                        background: "transparent",
                        fontSize: 12, color: "var(--t-text)",
                        direction: "rtl",
                    }}
                />
            </div>
        </div>
    )
}
