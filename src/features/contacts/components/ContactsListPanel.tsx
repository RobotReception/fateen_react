import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, RefreshCw, Users, X } from "lucide-react"
import { useContactsStore } from "../store/contacts.store"
import { useContacts, useContactsFilters } from "../hooks/use-contacts"
import { useContactLookups } from "../hooks/use-contact-lookups"
import { ContactItem } from "./ContactItem"
import { useAuthStore } from "@/stores/auth-store"

interface TableColumn {
    key: string
    label: string
    width?: string
    sortable?: boolean
}

const STATIC_COLUMNS_LEFT: TableColumn[] = [
    { key: "check", label: "", width: "36px" },
    { key: "name", label: "الاسم", sortable: true },
    { key: "channels", label: "القناة" },
    { key: "lifecycle", label: "المرحلة" },
]

const STATIC_COLUMNS_RIGHT: TableColumn[] = [
    { key: "tags", label: "الوسوم" },
    { key: "teams", label: "الفرق" },
    { key: "status", label: "حالة المحادثة" },
]

function formatFieldLabel(key: string): string {
    return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ")
}

const PAGE_SIZES = [10, 25, 50, 100]

export function ContactsListPanel() {
    const {
        searchQuery, setSearchQuery,
        selectedContactId, setSelectedContactId,
        currentPage, pageSize,
        setCurrentPage, setPageSize,
        sortBy, sortOrder,
        activeSection,
        filters, setFilter, clearFilters,
        filterPanelOpen, toggleFilterPanel,
    } = useContactsStore()
    const userId = useAuthStore((s) => s.user?.id)

    const skip = (currentPage - 1) * pageSize
    const lifecycleFilter = activeSection.startsWith("lc_") ? activeSection.slice(3) : filters.lifecycle
    const teamFilter = activeSection.startsWith("team_") ? activeSection.slice(5) : undefined
    const assignedFilter = activeSection === "mine" ? userId : filters.assigned_to
    const isAssignedTeamFilter = activeSection === "unassigned" ? "false" : undefined
    const queryParams = {
        skip, limit: pageSize,
        search: searchQuery || undefined,
        platform: filters.platform,
        session_status: filters.session_status,
        assigned_to: assignedFilter,
        lifecycle: lifecycleFilter,
        tags: filters.tags,
        team_id: teamFilter,
        is_assigned_team: isAssignedTeamFilter,
        enable_ai: filters.enable_ai,
        conversation_status: filters.conversation_status,
        sort_by: sortBy, sort_order: sortOrder,
    }

    const { data, isLoading, isFetching, refetch } = useContacts(queryParams)
    const { data: filtersData } = useContactsFilters()
    const { tagMap, lifecycleMap } = useContactLookups()
    const contacts = data?.contacts ?? []
    const pagination = data?.pagination

    const totalCount = pagination?.totalCount ?? 0
    const totalPages = pagination?.totalPages ?? 1

    const customFieldKeys = Array.from(
        new Set(contacts.flatMap(c => Object.keys(c.custom_fields ?? {})))
    )

    const TABLE_COLUMNS: TableColumn[] = [
        ...STATIC_COLUMNS_LEFT,
        ...customFieldKeys.map(key => ({ key: `cf_${key}`, label: formatFieldLabel(key) })),
        ...STATIC_COLUMNS_RIGHT,
    ]
    const startItem = totalCount === 0 ? 0 : skip + 1
    const endItem = Math.min(skip + pageSize, totalCount)

    // Count active filters
    const activeFilterCount = Object.values(filters).filter(v => v !== undefined && v !== "").length

    // Extract filter facets from API
    const facets = filtersData?.filters ?? {} as Record<string, { value: any; count: number }[]>

    return (
        <div className="cl-root">
            {/* ── Top Bar ── */}
            <div className="cl-topbar">
                <div className="cl-search-wrap">
                    <Search size={13} className="cl-search-icon" />
                    <input type="text" placeholder="بحث في جهات الاتصال..." value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)} className="cl-search-input" />
                </div>

                <div className="cl-topbar-right">
                    <span className="cl-count-label">
                        <Users size={11} /> {totalCount} جهة اتصال
                    </span>
                    <button className="cl-icon-btn" onClick={toggleFilterPanel} title="فلترة"
                        style={{
                            background: filterPanelOpen ? "rgba(0,71,134,.06)" : undefined,
                            color: filterPanelOpen ? "#004786" : undefined,
                            position: "relative",
                        }}>
                        <SlidersHorizontal size={13} />
                        {activeFilterCount > 0 && (
                            <span style={{
                                position: "absolute", top: -3, right: -3, width: 14, height: 14,
                                borderRadius: "50%", background: "#004786", color: "#fff",
                                fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                            }}>{activeFilterCount}</span>
                        )}
                    </button>
                    <button className="cl-icon-btn" onClick={() => refetch()} title="تحديث"
                        style={{ background: isFetching ? "rgba(0,71,134,.06)" : undefined, color: isFetching ? "#004786" : undefined }}>
                        <RefreshCw size={13} className={isFetching ? "cl-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* ── Filter Panel ── */}
            {filterPanelOpen && (
                <div className="cl-filter-panel">
                    <div className="cl-filter-row">
                        {/* Platform */}
                        <FilterSelect label="المنصة" value={filters.platform ?? ""}
                            onChange={v => setFilter("platform", v || undefined)}
                            options={(facets.platform ?? []).map((f: any) => ({
                                value: typeof f.value === "string" ? f.value : String(f.value),
                                label: typeof f.value === "string" ? f.value : String(f.value),
                                count: f.count,
                            }))} />

                        {/* Session Status */}
                        <FilterSelect label="حالة الجلسة" value={filters.session_status ?? ""}
                            onChange={v => setFilter("session_status", v || undefined)}
                            options={(facets.session_status ?? []).map((f: any) => ({
                                value: typeof f.value === "string" ? f.value : String(f.value),
                                label: f.value === "pending" ? "قيد الانتظار" : f.value === "closed" ? "مغلقة" : String(f.value),
                                count: f.count,
                            }))} />

                        {/* Conversation Status */}
                        <FilterSelect label="حالة المحادثة" value={filters.conversation_status ?? ""}
                            onChange={v => setFilter("conversation_status", v || undefined)}
                            options={(facets.conversation_status ?? []).map((f: any) => ({
                                value: typeof f.value === "string" ? f.value : String(f.value),
                                label: f.value === "open" ? "مفتوحة" : f.value === "closed" ? "مغلقة" : String(f.value),
                                count: f.count,
                            }))} />

                        {/* Lifecycle */}
                        <FilterSelect label="مرحلة الحياة" value={filters.lifecycle ?? ""}
                            onChange={v => setFilter("lifecycle", v || undefined)}
                            options={(facets.lifecycle ?? []).map((f: any) => ({
                                value: typeof f.value === "string" ? f.value : String(f.value),
                                label: lifecycleMap.get(f.value)?.name ?? f.value,
                                count: f.count,
                            }))} />

                        {/* AI */}
                        <FilterSelect label="AI" value={filters.enable_ai === undefined ? "" : String(filters.enable_ai)}
                            onChange={v => setFilter("enable_ai", v === "" ? undefined : v === "true")}
                            options={(facets.enable_ai ?? []).map((f: any) => ({
                                value: String(f.value),
                                label: f.value === "true" || f.value === true ? "مفعّل" : "معطّل",
                                count: f.count,
                            }))} />

                        {/* Tags */}
                        <FilterSelect label="الوسوم" value={filters.tags ?? ""}
                            onChange={v => setFilter("tags", v || undefined)}
                            options={(facets.tags ?? []).map((f: any) => ({
                                value: typeof f.value === "object" ? f.value.id : String(f.value),
                                label: typeof f.value === "object" ? `${f.value.emoji ?? ""} ${f.value.name}`.trim() : String(f.value),
                                count: f.count,
                            }))} />

                        {/* Assigned */}
                        <FilterSelect label="معيّن إلى" value={filters.assigned_to ?? ""}
                            onChange={v => setFilter("assigned_to", v || undefined)}
                            options={(facets.assigned_to ?? []).map((f: any) => ({
                                value: typeof f.value === "string" ? f.value : String(f.value),
                                label: typeof f.value === "string" ? f.value : String(f.value),
                                count: f.count,
                            }))} />
                    </div>

                    {activeFilterCount > 0 && (
                        <button className="cl-filter-clear" onClick={clearFilters}>
                            <X size={10} /> مسح الفلاتر
                        </button>
                    )}
                </div>
            )}

            {/* ── Loading bar ── */}
            {isFetching && (
                <div style={{ height: 2, background: "#ebeef2", overflow: "hidden", position: "relative" }}>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, #004786, transparent)", animation: "clSweep 1.3s ease-in-out infinite" }} />
                </div>
            )}

            {/* ── Table ── */}
            <div className="cl-table-wrap">
                {isLoading ? (
                    <div className="cl-loading">
                        <div className="cl-spinner" />
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>جاري تحميل جهات الاتصال…</span>
                    </div>
                ) : contacts.length === 0 ? (
                    <div className="cl-empty">
                        <div style={{ width: 52, height: 52, borderRadius: 14, background: "#f5f6f8", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                            <Users size={22} style={{ color: "#d1d5db" }} />
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 3 }}>
                            {searchQuery ? "لا توجد نتائج" : "لا توجد جهات اتصال"}
                        </div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>
                            {searchQuery ? "حاول تغيير كلمات البحث" : "جهات الاتصال الجديدة ستظهر هنا"}
                        </div>
                    </div>
                ) : (
                    <table className="cl-table">
                        <thead>
                            <tr className="cl-thead-row">
                                {TABLE_COLUMNS.map((col) => (
                                    <th key={col.key} className="cl-th" style={col.width ? { width: col.width } : undefined}>
                                        {col.key === "check" ? (
                                            <input type="checkbox" className="cl-checkbox" />
                                        ) : (
                                            <div className="cl-th-inner">
                                                <span>{col.label}</span>
                                                {col.sortable && <span className="cl-sort-icon">⇅</span>}
                                            </div>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {contacts.map((contact) => (
                                <ContactItem
                                    key={contact.customer_id}
                                    contact={contact}
                                    isSelected={contact.customer_id === selectedContactId}
                                    onClick={() => setSelectedContactId(
                                        contact.customer_id === selectedContactId ? null : contact.customer_id
                                    )}
                                    tagMap={tagMap}
                                    lifecycleMap={lifecycleMap}
                                    customFieldKeys={customFieldKeys}
                                />
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── Pagination Footer ── */}
            {!isLoading && contacts.length > 0 && (
                <div className="cl-footer">
                    <div className="cl-page-size">
                        <span>لكل صفحة:</span>
                        <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="cl-page-select">
                            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="cl-page-info">
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>{startItem}–{endItem} من {totalCount}</span>
                        <button className="cl-page-btn" disabled={currentPage <= 1} onClick={() => setCurrentPage(currentPage - 1)}><ChevronRight size={14} /></button>
                        <button className="cl-page-btn" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(currentPage + 1)}><ChevronLeft size={14} /></button>
                    </div>
                </div>
            )}

            <style>{`
                .cl-root{flex:1;display:flex;flex-direction:column;background:#fafbfc;overflow:hidden;min-width:0}
                .cl-topbar{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#fff;border-bottom:1px solid #ebeef2;gap:10px;flex-shrink:0}
                .cl-search-wrap{display:flex;align-items:center;gap:7px;background:#f5f6f8;border:1.5px solid #ebeef2;border-radius:8px;padding:6px 10px;flex:0 0 220px;transition:border-color .2s}
                .cl-search-wrap:focus-within{border-color:#004786;background:#fff}
                .cl-search-icon{color:#b0b7c3;flex-shrink:0}
                .cl-search-input{border:none;background:transparent;outline:none;font-size:12px;color:#111827;width:100%;font-family:inherit}
                .cl-search-input::placeholder{color:#b0b7c3}
                .cl-topbar-right{display:flex;align-items:center;gap:6px}
                .cl-count-label{display:flex;align-items:center;gap:4px;font-size:11px;font-weight:600;color:#9ca3af;padding:0 6px}
                .cl-icon-btn{width:30px;height:30px;border-radius:7px;border:1px solid #ebeef2;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#9ca3af;transition:all .12s}
                .cl-icon-btn:hover{background:#f5f6f8;color:#6b7280;border-color:#d1d5db}
                .cl-table-wrap{flex:1;overflow:auto}
                .cl-table-wrap::-webkit-scrollbar{width:3px;height:3px}
                .cl-table-wrap::-webkit-scrollbar-thumb{background:rgba(0,0,0,.1);border-radius:3px}
                .cl-table{width:100%;border-collapse:collapse;min-width:850px}
                .cl-thead-row{position:sticky;top:0;z-index:2;background:#fff;border-bottom:1.5px solid #ebeef2}
                .cl-th{padding:9px 12px;text-align:right;font-size:11px;font-weight:700;color:#9ca3af;white-space:nowrap;user-select:none}
                .cl-th-inner{display:flex;align-items:center;gap:3px}
                .cl-sort-icon{font-size:9px;color:#d1d5db;cursor:pointer}
                .cl-checkbox{width:14px;height:14px;border-radius:3px;cursor:pointer;accent-color:#004786}
                .cl-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:10px}
                .cl-spinner{width:26px;height:26px;border-radius:50%;border:2.5px solid #ebeef2;border-top-color:#004786;animation:spin .7s linear infinite}
                .cl-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:24px;text-align:center}
                .cl-footer{display:flex;align-items:center;justify-content:flex-end;padding:8px 14px;gap:16px;border-top:1px solid #ebeef2;background:#fff;flex-shrink:0}
                .cl-page-size{display:flex;align-items:center;gap:5px;font-size:11px;color:#9ca3af}
                .cl-page-select{border:1px solid #ebeef2;border-radius:6px;padding:2px 6px;font-size:11px;background:#fff;color:#111827;outline:none;cursor:pointer;font-family:inherit}
                .cl-page-info{display:flex;align-items:center;gap:6px;font-size:11px;color:#9ca3af}
                .cl-page-btn{width:26px;height:26px;border-radius:6px;border:1px solid #ebeef2;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#9ca3af;transition:all .12s}
                .cl-page-btn:hover:not(:disabled){background:#f5f6f8;color:#111827}
                .cl-page-btn:disabled{opacity:.35;cursor:not-allowed}
                .cl-filter-panel{padding:10px 14px;background:#fafbfc;border-bottom:1px solid #ebeef2;animation:clFilterFade .15s ease-out}
                .cl-filter-row{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end}
                .cl-filter-clear{display:flex;align-items:center;gap:4px;background:none;border:none;font-size:10.5px;color:#ef4444;cursor:pointer;padding:4px 0 0;font-family:inherit;font-weight:600;transition:opacity .12s}
                .cl-filter-clear:hover{opacity:.7}
                .cl-filter-group{display:flex;flex-direction:column;gap:3px;min-width:120px;flex:1;max-width:180px}
                .cl-filter-label{font-size:9.5px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.04em}
                .cl-filter-select{padding:5px 8px;border:1px solid #e5e7eb;border-radius:7px;font-size:11.5px;background:#fff;color:#111827;outline:none;cursor:pointer;font-family:inherit;transition:border-color .15s;appearance:auto}
                .cl-filter-select:focus{border-color:#004786}
                @keyframes spin{to{transform:rotate(360deg)}}
                @keyframes clSweep{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
                @keyframes clFilterFade{from{opacity:0;max-height:0}to{opacity:1;max-height:200px}}
                .cl-spin{animation:spin .8s linear infinite}
            `}</style>
        </div>
    )
}

/* ── Filter Select ── */
function FilterSelect({ label, value, onChange, options }: {
    label: string
    value: string
    onChange: (v: string) => void
    options: { value: string; label: string; count: number }[]
}) {
    return (
        <div className="cl-filter-group">
            <span className="cl-filter-label">{label}</span>
            <select className="cl-filter-select" value={value}
                onChange={e => onChange(e.target.value)}>
                <option value="">الكل</option>
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label} ({opt.count})
                    </option>
                ))}
            </select>
        </div>
    )
}
