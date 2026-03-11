import { useRef, useMemo } from "react"
import { SlidersHorizontal, Search, X, ChevronDown, Star, BellOff, Mail } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useInboxStore, type StatusFilter, type AdvancedFilters } from "../../store/inbox.store"
import { useInboxSummary } from "../../hooks/use-inbox-summary"
import { getBriefUsers, getAccounts } from "../../services/inbox-service"
import { useAuthStore } from "@/stores/auth-store"
import type { AvailableFilters } from "../../types/inbox.types"

interface Props {
    availableFilters: AvailableFilters | null
}

const STATUS_PILLS: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "open", label: "Open" },
    { key: "closed", label: "Closed" },
]

export function FilterBar({ availableFilters }: Props) {
    const {
        statusFilter, setStatusFilter,
        searchQuery, setSearchQuery,
        advancedFilters, setFilter, clearFilters,
        filterPanelOpen, toggleFilterPanel,
    } = useInboxStore()

    const { user } = useAuthStore()
    const { data: summary } = useInboxSummary(user?.id)
    const { data: briefData } = useQuery({
        queryKey: ["brief-users"],
        queryFn: () => getBriefUsers(1, 100),
        staleTime: 5 * 60 * 1000,
    })
    const { data: accountsData } = useQuery({
        queryKey: ["customer-accounts"],
        queryFn: () => getAccounts(),
        staleTime: 5 * 60 * 1000,
    })

    // Build lookup maps for ID → name resolution
    const userMap = useMemo(() => {
        const m = new Map<string, string>()
        for (const u of briefData?.users ?? []) {
            m.set(u.user_id, u.name)            // UUID → display name
            m.set(u.name.toLowerCase(), u.name)  // lowercase name → display name
            m.set(u.name, u.name)                // exact name → display name
        }
        return m
    }, [briefData])

    const teamMap = useMemo(() => {
        const m = new Map<string, string>()
        for (const t of summary?.teams ?? []) m.set(t.team_id, t.name)
        // Also enrich from filter response team_details (has guaranteed names)
        for (const t of availableFilters?.team_details ?? []) m.set(t.team_id, t.name)
        return m
    }, [summary, availableFilters])

    const lifecycleMap = useMemo(() => {
        const m = new Map<string, string>()
        for (const lc of summary?.lifecycles ?? []) m.set(lc.code, `${lc.icon || ""} ${lc.name}`.trim())
        return m
    }, [summary])

    // Helper: convert string[] (or object[]) to {value, label}[] using a lookup map
    const resolveOpts = (ids: any[], nameMap: Map<string, string>) =>
        ids.map((id: any) => {
            // API sometimes returns objects like {value, count} instead of plain strings
            const strId = typeof id === "object" && id !== null
                ? String(id.value ?? id.code ?? id.name ?? JSON.stringify(id))
                : String(id ?? "")
            return { value: strId, label: nameMap.get(strId) || strId }
        })

    // Resolve a single ID
    const resolveName = (id: string | undefined, nameMap: Map<string, string>) =>
        id ? (nameMap.get(id) || id) : id

    const activeCount = countActiveFilters(advancedFilters)

    return (
        <div className="fb-root">
            {/* ── Quick bar: search + status pills + filter toggle ── */}
            <div className="fb-quick-bar">
                {/* Search */}
                <SearchInput value={searchQuery} onChange={setSearchQuery} />

                {/* Status pills + filter button */}
                <div className="fb-pills-row">
                    <div className="fb-pills">
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
                        className={`fb-filter-toggle ${filterPanelOpen || activeCount > 0 ? "fb-filter-toggle-active" : ""}`}
                    >
                        <SlidersHorizontal size={12} />
                        {activeCount > 0 && (
                            <span className="fb-filter-count">{activeCount}</span>
                        )}
                    </button>
                </div>
            </div>

            {/* ── Expandable filter panel ── */}
            <div className={`fb-panel ${filterPanelOpen ? "fb-panel-open" : ""}`}>
                <div className="fb-panel-inner">
                    {/* Row 1: Platform + Lifecycle */}
                    <div className="fb-filter-row">
                        <FilterDropdown
                            label="المنصة"
                            value={advancedFilters.platform}
                            options={(availableFilters?.platforms ?? []).map(p => {
                                const val = typeof p === "object" && p !== null ? String((p as any).value ?? (p as any).name ?? JSON.stringify(p)) : String(p)
                                return { value: val, label: val }
                            })}
                            onChange={(v) => setFilter("platform", v)}
                        />
                        <FilterDropdown
                            label="دورة الحياة"
                            value={advancedFilters.lifecycle}
                            options={resolveOpts(availableFilters?.lifecycles ?? [], lifecycleMap)}
                            onChange={(v) => setFilter("lifecycle", v)}
                        />
                    </div>

                    {/* Row 2: Assigned To + Team */}
                    <div className="fb-filter-row">
                        <FilterDropdown
                            label="الموظف"
                            value={advancedFilters.assigned_to}
                            options={(briefData?.users ?? []).map(u => ({ value: u.user_id, label: u.name }))}
                            onChange={(v) => setFilter("assigned_to", v)}
                        />
                        <FilterDropdown
                            label="الفريق"
                            value={advancedFilters.team_id}
                            options={(availableFilters?.team_details ?? summary?.teams ?? []).map((t: any) => ({ value: t.team_id, label: t.name }))}
                            onChange={(v) => setFilter("team_id", v)}
                        />
                    </div>

                    {/* Row 3: Account ID */}
                    <div className="fb-filter-row">
                        <FilterDropdown
                            label="الحساب"
                            value={advancedFilters.account_id}
                            options={(accountsData?.accounts ?? []).map((a: any) => {
                                const emoji = a.platform === "whatsapp" ? "📱" : a.platform === "facebook" ? "📘" : a.platform === "instagram" ? "📸" : a.platform === "webchat" ? "🌐" : "💬"
                                const displayName = a.name || a.account_id
                                return {
                                    value: a.account_id,
                                    label: `${emoji} ${displayName} (${a.customer_count})`,
                                }
                            })}
                            onChange={(v) => setFilter("account_id", v)}
                        />
                    </div>

                    {/* Row 3: Date Range */}
                    <div className="fb-filter-row">
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

                    {/* Row 4: Toggle chips + AI dropdown */}
                    <div className="fb-filter-row">
                        <FilterDropdown
                            label="AI"
                            value={advancedFilters.enable_ai_q}
                            options={[
                                { value: "true", label: "✅ مفعّل" },
                                { value: "false", label: "❌ معطّل" },
                            ]}
                            onChange={(v) => setFilter("enable_ai_q", v)}
                        />
                    </div>
                    <div className="fb-toggles">
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
                    </div>

                    {/* Clear all */}
                    {activeCount > 0 && (
                        <button onClick={clearFilters} className="fb-clear-btn">
                            ✕ Clear All Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Active filters summary chips (shown when panel is closed) */}
            {!filterPanelOpen && activeCount > 0 && (
                <div className="fb-active-chips">
                    {advancedFilters.platform && <ActiveChip label={`المنصة: ${advancedFilters.platform}`} onClear={() => setFilter("platform", undefined)} />}
                    {advancedFilters.lifecycle && <ActiveChip label={`الحياة: ${resolveName(advancedFilters.lifecycle, lifecycleMap)}`} onClear={() => setFilter("lifecycle", undefined)} />}
                    {advancedFilters.assigned_to && <ActiveChip label={`الموظف: ${resolveName(advancedFilters.assigned_to, userMap)}`} onClear={() => setFilter("assigned_to", undefined)} />}
                    {advancedFilters.team_id && <ActiveChip label={`الفريق: ${resolveName(advancedFilters.team_id, teamMap)}`} onClear={() => setFilter("team_id", undefined)} />}
                    {advancedFilters.account_id && <ActiveChip label={`الحساب: ${advancedFilters.account_id}`} onClear={() => setFilter("account_id", undefined)} />}
                    {advancedFilters.start_date && <ActiveChip label={`From: ${advancedFilters.start_date.split("T")[0]}`} onClear={() => setFilter("start_date", undefined)} />}
                    {advancedFilters.end_date && <ActiveChip label={`To: ${advancedFilters.end_date.split("T")[0]}`} onClear={() => setFilter("end_date", undefined)} />}
                    {advancedFilters.unread_only && <ActiveChip label="Unread" onClear={() => setFilter("unread_only", undefined)} />}
                    {advancedFilters.favorite && <ActiveChip label="Favorites" onClear={() => setFilter("favorite", undefined)} />}
                    {advancedFilters.muted && <ActiveChip label="Muted" onClear={() => setFilter("muted", undefined)} />}
                    {advancedFilters.enable_ai_q && <ActiveChip label={`AI: ${advancedFilters.enable_ai_q === "true" ? "مفعّل" : "معطّل"}`} onClear={() => setFilter("enable_ai_q", undefined)} />}
                </div>
            )}

            <div className="fb-divider" />

            <style>{`
                .fb-root {
                    flex-shrink:0;
                    background:var(--t-card);
                }

                /* Quick bar */
                .fb-quick-bar {
                    padding:10px 12px 6px;
                    display:flex; flex-direction:column; gap:8px;
                }
                .fb-pills-row {
                    display:flex; align-items:center; gap:6px;
                }
                .fb-pills {
                    display:flex; gap:3px; flex:1; flex-wrap:wrap;
                }

                /* Status pill */
                .fb-pill {
                    padding:3px 11px; border-radius:12px;
                    border:1.5px solid var(--t-border-light);
                    background:transparent;
                    color:var(--t-text-muted);
                    font-size:11px; font-weight:500;
                    cursor:pointer; transition:all .15s;
                    white-space:nowrap;
                }
                .fb-pill:hover { border-color:var(--t-border); }
                .fb-pill-active {
                    background:var(--t-gradient-accent) !important;
                    border-color:rgba(27,80,145,0.3) !important;
                    color:#fff !important;
                    font-weight:700 !important;
                    box-shadow:0 1px 4px var(--t-accent-muted);
                }

                /* Filter toggle */
                .fb-filter-toggle {
                    display:flex; align-items:center; gap:4px;
                    padding:4px 8px; border-radius:7px;
                    border:1px solid var(--t-border-light);
                    fontSize:11px; font-weight:600;
                    cursor:pointer; background:transparent;
                    color:var(--t-text-muted);
                    transition:all .15s;
                }
                .fb-filter-toggle:hover {
                    background:var(--t-surface);
                    border-color:var(--t-border);
                }
                .fb-filter-toggle-active {
                    background:var(--t-gradient-accent) !important;
                    border-color:rgba(27,80,145,0.3) !important;
                    color:#fff !important;
                    box-shadow:0 1px 4px var(--t-accent-muted);
                }
                .fb-filter-count {
                    font-size:9px; font-weight:700;
                    background:rgba(255,255,255,0.3);
                    padding:0 4px; border-radius:8px;
                    min-width:14px; text-align:center;
                }

                /* Search */
                .fb-search-wrap {
                    display:flex; align-items:center; gap:6px;
                    padding:6px 10px; border-radius:8px;
                    background:var(--t-surface);
                    border:1.5px solid var(--t-border-light);
                    transition:border-color .18s, box-shadow .18s;
                }
                .fb-search-wrap:focus-within {
                    border-color:var(--t-accent-secondary);
                    box-shadow:0 0 0 3px var(--t-accent-muted);
                }
                .fb-search-input {
                    border:none; outline:none; background:transparent;
                    font-size:12px; color:var(--t-text); flex:1;
                    font-family:inherit;
                }
                .fb-search-clear {
                    border:none; background:transparent;
                    cursor:pointer; padding:0;
                    color:var(--t-text-faint); display:flex;
                    transition:color .12s;
                }
                .fb-search-clear:hover { color:var(--t-text-muted); }

                /* Filter panel */
                .fb-panel {
                    max-height:0;
                    overflow:hidden;
                    transition:max-height .28s cubic-bezier(.4,0,.2,1);
                }
                .fb-panel-open { max-height:400px; }
                .fb-panel-inner {
                    padding:8px 12px 12px;
                    border-top:1px solid var(--t-border-light);
                    display:flex; flex-direction:column; gap:8px;
                }
                .fb-filter-row { display:flex; gap:6px; }

                /* Dropdown */
                .fb-dropdown-label {
                    font-size:9px; font-weight:700;
                    color:var(--t-text-faint);
                    text-transform:uppercase; letter-spacing:0.05em;
                    margin-bottom:2px; display:block;
                }
                .fb-select {
                    width:100%; appearance:none; -webkit-appearance:none;
                    padding:5px 22px 5px 8px;
                    border-radius:7px;
                    background:var(--t-surface);
                    font-size:11px; font-weight:400;
                    color:var(--t-text);
                    cursor:pointer; outline:none;
                    font-family:inherit;
                    transition:all .15s;
                }
                .fb-select-active {
                    border:1.5px solid var(--t-accent-secondary) !important;
                    background:var(--t-accent-muted) !important;
                    font-weight:600 !important;
                }
                .fb-select:not(.fb-select-active) {
                    border:1px solid var(--t-border-light);
                }
                .fb-select:focus {
                    border-color:var(--t-accent-secondary);
                    box-shadow:0 0 0 2px var(--t-accent-muted);
                }

                /* Date input */
                .fb-date-input {
                    width:100%; padding:5px 8px;
                    border-radius:7px; background:var(--t-surface);
                    font-size:11px; color:var(--t-text);
                    cursor:pointer; outline:none; font-family:inherit;
                    transition:all .15s;
                }
                .fb-date-active {
                    border:1.5px solid var(--t-accent-secondary) !important;
                    background:var(--t-accent-muted) !important;
                    font-weight:600 !important;
                }
                .fb-date-input:not(.fb-date-active) {
                    border:1px solid var(--t-border-light);
                }
                .fb-date-input:focus {
                    border-color:var(--t-accent-secondary);
                    box-shadow:0 0 0 2px var(--t-accent-muted);
                }

                /* Toggle chips */
                .fb-toggles { display:flex; gap:4px; flex-wrap:wrap; }
                .fb-toggle-chip {
                    display:inline-flex; align-items:center; gap:4px;
                    padding:3px 9px; border-radius:10px;
                    font-size:10px; font-weight:500;
                    cursor:pointer; transition:all .15s;
                    border:1.5px solid var(--t-border-light);
                    background:transparent; color:var(--t-text-muted);
                }
                .fb-toggle-chip:hover { border-color:var(--t-border); }
                .fb-toggle-active {
                    background:var(--t-gradient-accent) !important;
                    border-color:rgba(27,80,145,0.3) !important;
                    color:#fff !important;
                    font-weight:700 !important;
                    box-shadow:0 1px 3px rgba(27,80,145,0.15);
                }

                /* Clear button */
                .fb-clear-btn {
                    padding:4px 10px; border-radius:6px;
                    border:1px solid var(--t-border-light);
                    font-size:10px; font-weight:600;
                    cursor:pointer;
                    background:transparent; color:var(--t-text-muted);
                    align-self:flex-start; transition:all .15s;
                }
                .fb-clear-btn:hover {
                    background:rgba(239,68,68,0.06);
                    border-color:rgba(239,68,68,0.2);
                    color:var(--t-danger);
                }

                /* Active chips */
                .fb-active-chips {
                    padding:4px 12px 8px;
                    display:flex; gap:4px; flex-wrap:wrap;
                }
                .fb-active-chip {
                    display:inline-flex; align-items:center; gap:3px;
                    padding:2px 6px 2px 8px; border-radius:10px;
                    background:var(--t-accent-muted);
                    border:1px solid rgba(0,114,181,0.15);
                    font-size:10px; font-weight:600; color:var(--t-accent);
                }
                .fb-active-chip-x {
                    border:none; background:transparent;
                    cursor:pointer; padding:0; display:flex;
                    color:inherit; opacity:0.6;
                    transition:opacity .12s;
                }
                .fb-active-chip-x:hover { opacity:1; }

                /* Divider */
                .fb-divider {
                    height:1px;
                    background:linear-gradient(90deg, transparent, var(--t-border-light), transparent);
                }
            `}</style>
        </div>
    )
}

// ════════════════════════════════════════════
// Sub-components
// ════════════════════════════════════════════

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const ref = useRef<HTMLInputElement>(null)
    return (
        <div className="fb-search-wrap">
            <Search size={13} style={{ color: "var(--t-text-faint)", flexShrink: 0 }} />
            <input
                ref={ref}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Search by name, phone, email…"
                className="fb-search-input"
            />
            {value && (
                <button onClick={() => onChange("")} className="fb-search-clear">
                    <X size={12} />
                </button>
            )}
        </div>
    )
}

function PillButton({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
    return (
        <button onClick={onClick}
            className={`fb-pill ${isActive ? "fb-pill-active" : ""}`}
        >{label}</button>
    )
}

function FilterDropdown({ label, value, options, onChange }: {
    label: string; value?: string; options: { value: string; label: string }[]; onChange: (v: string | undefined) => void
}) {
    return (
        <div style={{ flex: 1, minWidth: 0 }}>
            <label className="fb-dropdown-label">{label}</label>
            <div style={{ position: "relative" }}>
                <select
                    value={value ?? ""}
                    onChange={(e) => onChange(e.target.value || undefined)}
                    className={`fb-select ${value ? "fb-select-active" : ""}`}
                >
                    <option value="">الكل</option>
                    {options.map((opt, i) => {
                        const k = opt.value ? String(opt.value) : `opt-${i}`
                        return (
                            <option key={k} value={String(opt.value ?? "")}>
                                {String(opt.label ?? opt.value ?? "")}
                            </option>
                        )
                    })}
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
            <label className="fb-dropdown-label">{label}</label>
            <input
                type="date"
                value={value ? value.split("T")[0] : ""}
                onChange={(e) => onChange(e.target.value ? `${e.target.value}T00:00:00` : "")}
                className={`fb-date-input ${value ? "fb-date-active" : ""}`}
            />
        </div>
    )
}

function ToggleChip({ icon, label, isActive, onClick }: {
    icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void
}) {
    return (
        <button onClick={onClick}
            className={`fb-toggle-chip ${isActive ? "fb-toggle-active" : ""}`}
        >
            {icon}
            {label}
        </button>
    )
}

function ActiveChip({ label, onClear }: { label: string; onClear: () => void }) {
    return (
        <span className="fb-active-chip">
            {label}
            <button onClick={onClear} className="fb-active-chip-x">
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
    if (f.account_id) n++
    if (f.start_date) n++
    if (f.end_date) n++
    if (f.unread_only) n++
    if (f.favorite) n++
    if (f.muted) n++
    if (f.enable_ai_q) n++
    return n
}
