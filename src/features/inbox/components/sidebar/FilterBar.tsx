import { useRef } from "react"
import { SlidersHorizontal, Search, X, ChevronDown, Star, BellOff, Mail, Bot } from "lucide-react"
import { useInboxStore, type StatusFilter, type AdvancedFilters } from "../../store/inbox.store"
import type { AvailableFilters } from "../../types/inbox.types"

interface Props {
    availableFilters: AvailableFilters | null
}

const STATUS_PILLS: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "open", label: "Open" },
    { key: "pending", label: "Pending" },
    { key: "closed", label: "Closed" },
]

export function FilterBar({ availableFilters }: Props) {
    const {
        statusFilter, setStatusFilter,
        searchQuery, setSearchQuery,
        advancedFilters, setFilter, clearFilters,
        filterPanelOpen, toggleFilterPanel,
    } = useInboxStore()

    const activeCount = countActiveFilters(advancedFilters)

    return (
        <div style={{ flexShrink: 0, background: "var(--t-card)" }}>
            {/* ── Quick bar: search + status pills + filter toggle ── */}
            <div style={{ padding: "10px 12px 6px", display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Search */}
                <SearchInput value={searchQuery} onChange={setSearchQuery} />

                {/* Status pills + filter button */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ display: "flex", gap: 3, flex: 1, flexWrap: "wrap" }}>
                        {STATUS_PILLS.map((p) => (
                            <PillButton
                                key={p.key}
                                label={p.label}
                                isActive={statusFilter === p.key}
                                onClick={() => setStatusFilter(p.key)}
                            />
                        ))}
                    </div>
                    <button
                        onClick={toggleFilterPanel}
                        style={{
                            display: "flex", alignItems: "center", gap: 4,
                            padding: "4px 8px", borderRadius: 6, border: "none",
                            fontSize: 11, fontWeight: 600, cursor: "pointer",
                            background: filterPanelOpen || activeCount > 0
                                ? "var(--t-accent)" : "var(--t-surface)",
                            color: filterPanelOpen || activeCount > 0
                                ? "var(--t-text-on-accent)" : "var(--t-text-muted)",
                            transition: "all 0.15s",
                        }}
                    >
                        <SlidersHorizontal size={12} />
                        {activeCount > 0 && (
                            <span style={{
                                fontSize: 9, fontWeight: 700,
                                background: "rgba(255,255,255,0.3)",
                                padding: "0 4px", borderRadius: 8,
                                minWidth: 14, textAlign: "center",
                            }}>{activeCount}</span>
                        )}
                    </button>
                </div>
            </div>

            {/* ── Expandable filter panel ── */}
            <div style={{
                maxHeight: filterPanelOpen ? 400 : 0,
                overflow: "hidden",
                transition: "max-height 0.25s ease-in-out",
            }}>
                <div style={{
                    padding: "8px 12px 12px",
                    borderTop: "1px solid var(--t-border-light)",
                    display: "flex", flexDirection: "column", gap: 8,
                }}>
                    {/* Row 1: Platform + Lifecycle */}
                    <div style={{ display: "flex", gap: 6 }}>
                        <FilterDropdown
                            label="Platform"
                            value={advancedFilters.platform}
                            options={availableFilters?.platforms ?? []}
                            onChange={(v) => setFilter("platform", v)}
                        />
                        <FilterDropdown
                            label="Lifecycle"
                            value={advancedFilters.lifecycle}
                            options={availableFilters?.lifecycles ?? []}
                            onChange={(v) => setFilter("lifecycle", v)}
                        />
                    </div>

                    {/* Row 2: Assigned To + Team */}
                    <div style={{ display: "flex", gap: 6 }}>
                        <FilterDropdown
                            label="Assigned To"
                            value={advancedFilters.assigned_to}
                            options={availableFilters?.assigned_to ?? []}
                            onChange={(v) => setFilter("assigned_to", v)}
                        />
                        <FilterDropdown
                            label="Team"
                            value={advancedFilters.team_id}
                            options={availableFilters?.teams ?? []}
                            onChange={(v) => setFilter("team_id", v)}
                        />
                    </div>

                    {/* Row 3: Date Range */}
                    <div style={{ display: "flex", gap: 6 }}>
                        <DateInput
                            label="From"
                            value={advancedFilters.start_date ?? ""}
                            onChange={(v) => setFilter("start_date", v || undefined)}
                        />
                        <DateInput
                            label="To"
                            value={advancedFilters.end_date ?? ""}
                            onChange={(v) => setFilter("end_date", v || undefined)}
                        />
                    </div>

                    {/* Row 4: Toggle chips */}
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        <ToggleChip
                            icon={<Mail size={11} />}
                            label="Unread"
                            isActive={!!advancedFilters.unread_only}
                            onClick={() => setFilter("unread_only", advancedFilters.unread_only ? undefined : true)}
                        />
                        <ToggleChip
                            icon={<Star size={11} />}
                            label="Favorites"
                            isActive={!!advancedFilters.favorite}
                            onClick={() => setFilter("favorite", advancedFilters.favorite ? undefined : true)}
                        />
                        <ToggleChip
                            icon={<BellOff size={11} />}
                            label="Muted"
                            isActive={!!advancedFilters.muted}
                            onClick={() => setFilter("muted", advancedFilters.muted ? undefined : true)}
                        />
                        <ToggleChip
                            icon={<Bot size={11} />}
                            label="AI"
                            isActive={advancedFilters.enable_ai_q === "true"}
                            onClick={() => setFilter("enable_ai_q", advancedFilters.enable_ai_q === "true" ? undefined : "true")}
                        />
                    </div>

                    {/* Clear all */}
                    {activeCount > 0 && (
                        <button onClick={clearFilters} style={{
                            padding: "4px 10px", borderRadius: 6, border: "none",
                            fontSize: 10, fontWeight: 600, cursor: "pointer",
                            background: "var(--t-surface)", color: "var(--t-text-muted)",
                            alignSelf: "flex-start", transition: "all 0.12s",
                        }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626" }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--t-surface)"; e.currentTarget.style.color = "var(--t-text-muted)" }}
                        >
                            ✕ Clear All Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Active filters summary chips (shown when panel is closed) */}
            {!filterPanelOpen && activeCount > 0 && (
                <div style={{
                    padding: "4px 12px 8px",
                    display: "flex", gap: 4, flexWrap: "wrap",
                }}>
                    {advancedFilters.platform && <ActiveChip label={`Platform: ${advancedFilters.platform}`} onClear={() => setFilter("platform", undefined)} />}
                    {advancedFilters.lifecycle && <ActiveChip label={`Lifecycle: ${advancedFilters.lifecycle}`} onClear={() => setFilter("lifecycle", undefined)} />}
                    {advancedFilters.assigned_to && <ActiveChip label={`Agent: ${advancedFilters.assigned_to}`} onClear={() => setFilter("assigned_to", undefined)} />}
                    {advancedFilters.team_id && <ActiveChip label={`Team: ${advancedFilters.team_id}`} onClear={() => setFilter("team_id", undefined)} />}
                    {advancedFilters.start_date && <ActiveChip label={`From: ${advancedFilters.start_date.split("T")[0]}`} onClear={() => setFilter("start_date", undefined)} />}
                    {advancedFilters.end_date && <ActiveChip label={`To: ${advancedFilters.end_date.split("T")[0]}`} onClear={() => setFilter("end_date", undefined)} />}
                    {advancedFilters.unread_only && <ActiveChip label="Unread" onClear={() => setFilter("unread_only", undefined)} />}
                    {advancedFilters.favorite && <ActiveChip label="Favorites" onClear={() => setFilter("favorite", undefined)} />}
                    {advancedFilters.muted && <ActiveChip label="Muted" onClear={() => setFilter("muted", undefined)} />}
                    {advancedFilters.enable_ai_q === "true" && <ActiveChip label="AI" onClear={() => setFilter("enable_ai_q", undefined)} />}
                </div>
            )}

            <div style={{ height: 1, background: "var(--t-border-light)" }} />
        </div>
    )
}

// ════════════════════════════════════════════
// Sub-components
// ════════════════════════════════════════════

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const ref = useRef<HTMLInputElement>(null)
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "5px 8px", borderRadius: 8,
            background: "var(--t-surface)",
            border: "1px solid var(--t-border-light)",
            transition: "border-color 0.15s",
        }}
            onFocus={() => ref.current?.parentElement && (ref.current.parentElement.style.borderColor = "var(--t-accent)")}
            onBlur={() => ref.current?.parentElement && (ref.current.parentElement.style.borderColor = "var(--t-border-light)")}
        >
            <Search size={13} style={{ color: "var(--t-text-faint)", flexShrink: 0 }} />
            <input
                ref={ref}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Search by name, phone, email…"
                style={{
                    border: "none", outline: "none", background: "transparent",
                    fontSize: 12, color: "var(--t-text)", flex: 1,
                    fontFamily: "inherit",
                }}
            />
            {value && (
                <button
                    onClick={() => onChange("")}
                    style={{
                        border: "none", background: "transparent",
                        cursor: "pointer", padding: 0,
                        color: "var(--t-text-faint)", display: "flex",
                    }}
                >
                    <X size={12} />
                </button>
            )}
        </div>
    )
}

function PillButton({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
    return (
        <button onClick={onClick} style={{
            padding: "3px 10px", borderRadius: 12,
            border: isActive ? "1.5px solid var(--t-accent)" : "1px solid var(--t-border-light)",
            background: isActive ? "var(--t-accent)" : "transparent",
            color: isActive ? "var(--t-text-on-accent)" : "var(--t-text-muted)",
            fontSize: 11, fontWeight: isActive ? 700 : 500,
            cursor: "pointer", transition: "all 0.12s",
            whiteSpace: "nowrap",
        }}>{label}</button>
    )
}

function FilterDropdown({ label, value, options, onChange }: {
    label: string; value?: string; options: string[]; onChange: (v: string | undefined) => void
}) {
    return (
        <div style={{ flex: 1, minWidth: 0 }}>
            <label style={{ fontSize: 9, fontWeight: 700, color: "var(--t-text-faint)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2, display: "block" }}>
                {label}
            </label>
            <div style={{ position: "relative" }}>
                <select
                    value={value ?? ""}
                    onChange={(e) => onChange(e.target.value || undefined)}
                    style={{
                        width: "100%",
                        appearance: "none", WebkitAppearance: "none",
                        padding: "5px 22px 5px 8px",
                        border: value ? "1.5px solid var(--t-accent)" : "1px solid var(--t-border-light)",
                        borderRadius: 6,
                        background: value ? "rgba(var(--t-accent-rgb, 59,130,246), 0.06)" : "var(--t-surface)",
                        fontSize: 11, fontWeight: value ? 600 : 400,
                        color: "var(--t-text)",
                        cursor: "pointer", outline: "none",
                    }}
                >
                    <option value="">All</option>
                    {options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
                <ChevronDown size={10} style={{
                    position: "absolute", left: 6, top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--t-text-faint)", pointerEvents: "none",
                }} />
            </div>
        </div>
    )
}

function DateInput({ label, value, onChange }: {
    label: string; value: string; onChange: (v: string) => void
}) {
    return (
        <div style={{ flex: 1, minWidth: 0 }}>
            <label style={{ fontSize: 9, fontWeight: 700, color: "var(--t-text-faint)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2, display: "block" }}>
                {label}
            </label>
            <div style={{ position: "relative" }}>
                <input
                    type="date"
                    value={value ? value.split("T")[0] : ""}
                    onChange={(e) => onChange(e.target.value ? `${e.target.value}T00:00:00` : "")}
                    style={{
                        width: "100%",
                        padding: "5px 8px",
                        border: value ? "1.5px solid var(--t-accent)" : "1px solid var(--t-border-light)",
                        borderRadius: 6,
                        background: value ? "rgba(var(--t-accent-rgb, 59,130,246), 0.06)" : "var(--t-surface)",
                        fontSize: 11, fontWeight: value ? 600 : 400,
                        color: "var(--t-text)",
                        cursor: "pointer", outline: "none",
                        fontFamily: "inherit",
                    }}
                />
            </div>
        </div>
    )
}

function ToggleChip({ icon, label, isActive, onClick }: {
    icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void
}) {
    return (
        <button onClick={onClick} style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 8px", borderRadius: 10,
            border: isActive ? "1.5px solid var(--t-accent)" : "1px solid var(--t-border-light)",
            background: isActive ? "var(--t-accent)" : "transparent",
            color: isActive ? "var(--t-text-on-accent)" : "var(--t-text-muted)",
            fontSize: 10, fontWeight: isActive ? 700 : 500,
            cursor: "pointer", transition: "all 0.12s",
        }}>
            {icon}
            {label}
        </button>
    )
}

function ActiveChip({ label, onClear }: { label: string; onClear: () => void }) {
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 3,
            padding: "2px 6px 2px 8px", borderRadius: 10,
            background: "rgba(var(--t-accent-rgb, 59,130,246), 0.1)",
            border: "1px solid rgba(var(--t-accent-rgb, 59,130,246), 0.25)",
            fontSize: 10, fontWeight: 600, color: "var(--t-accent)",
        }}>
            {label}
            <button onClick={onClear} style={{
                border: "none", background: "transparent",
                cursor: "pointer", padding: 0, display: "flex",
                color: "inherit", opacity: 0.7,
            }}>
                <X size={10} />
            </button>
        </span>
    )
}

function countActiveFilters(f: AdvancedFilters): number {
    let n = 0
    if (f.platform) n++
    if (f.lifecycle) n++
    if (f.assigned_to) n++
    if (f.team_id) n++
    if (f.start_date) n++
    if (f.end_date) n++
    if (f.unread_only) n++
    if (f.favorite) n++
    if (f.muted) n++
    if (f.enable_ai_q) n++
    return n
}
