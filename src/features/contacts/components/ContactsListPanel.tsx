import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"
import { useContactsStore } from "../store/contacts.store"
import { useContacts } from "../hooks/use-contacts"
import { useContactLookups } from "../hooks/use-contact-lookups"
import { ContactItem } from "./ContactItem"

interface TableColumn {
    key: string
    label: string
    width?: string
    sortable?: boolean
}

// Static columns (always shown)
const STATIC_COLUMNS_LEFT: TableColumn[] = [
    { key: "check", label: "", width: "40px" },
    { key: "name", label: "Name", sortable: true },
    { key: "channels", label: "Channel(s)" },
    { key: "lifecycle", label: "Lifecycle" },
]

const STATIC_COLUMNS_RIGHT: TableColumn[] = [
    { key: "tags", label: "Tags" },
    { key: "teams", label: "Teams" },
    { key: "status", label: "Conversation Status" },
]

/** Pretty-print a custom_fields key as a column header */
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
        filters,
        filterPanelOpen, toggleFilterPanel,
    } = useContactsStore()

    // Build query params
    const skip = (currentPage - 1) * pageSize
    const lifecycleFilter = activeSection.startsWith("lc_")
        ? activeSection.slice(3) : filters.lifecycle
    const queryParams = {
        skip,
        limit: pageSize,
        search: searchQuery || undefined,
        platform: filters.platform,
        session_status: filters.session_status,
        assigned_to: filters.assigned_to,
        lifecycle: lifecycleFilter,
        tags: filters.tags,
        enable_ai: filters.enable_ai,
        conversation_status: filters.conversation_status,
        sort_by: sortBy,
        sort_order: sortOrder,
    }

    const { data, isLoading, isFetching, refetch } = useContacts(queryParams)
    const { tagMap, lifecycleMap } = useContactLookups()
    const contacts = data?.contacts ?? []
    const pagination = data?.pagination

    const totalCount = pagination?.totalCount ?? 0
    const totalPages = pagination?.totalPages ?? 1

    // Dynamically detect all custom_fields keys across all contacts
    const customFieldKeys = Array.from(
        new Set(contacts.flatMap(c => Object.keys(c.custom_fields ?? {})))
    )

    // Build full columns: static left + dynamic custom_fields + static right
    const TABLE_COLUMNS: TableColumn[] = [
        ...STATIC_COLUMNS_LEFT,
        ...customFieldKeys.map(key => ({ key: `cf_${key}`, label: formatFieldLabel(key) })),
        ...STATIC_COLUMNS_RIGHT,
    ]
    const startItem = totalCount === 0 ? 0 : skip + 1
    const endItem = Math.min(skip + pageSize, totalCount)

    return (
        <div className="clp2-root">
            {/* ── Top Bar ── */}
            <div className="clp2-topbar">
                {/* Search */}
                <div className="clp2-search-wrap">
                    <Search size={14} className="clp2-search-icon" />
                    <input
                        type="text"
                        placeholder="Search Contacts"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="clp2-search-input"
                    />
                </div>

                {/* Right actions */}
                <div className="clp2-actions">
                    <button
                        className="clp2-filter-btn"
                        onClick={toggleFilterPanel}
                        style={{
                            background: filterPanelOpen ? "var(--t-accent-muted)" : "transparent",
                            color: filterPanelOpen ? "var(--t-accent)" : "var(--t-text-muted)",
                        }}
                        title="فلترة"
                    >
                        <SlidersHorizontal size={14} />
                    </button>

                    <button
                        className="clp2-filter-btn"
                        onClick={() => refetch()}
                        title="تحديث"
                        style={{
                            background: isFetching ? "var(--t-accent-muted)" : "transparent",
                            color: isFetching ? "var(--t-accent)" : "var(--t-text-muted)",
                        }}
                    >
                        <RefreshCw size={14} className={isFetching ? "clp2-spin" : ""} />
                    </button>


                </div>
            </div>

            {/* ── Loading bar ── */}
            <div className={`clp2-progress ${isFetching ? "clp2-progress-active" : ""}`} />

            {/* ── Table ── */}
            <div className="clp2-table-wrap">
                {isLoading ? (
                    <div className="clp2-loading">
                        <div className="clp2-spinner" />
                        <span>جاري تحميل جهات الاتصال…</span>
                    </div>
                ) : contacts.length === 0 ? (
                    <div className="clp2-empty">
                        <div className="clp2-empty-icon">👥</div>
                        <p className="clp2-empty-title">
                            {searchQuery ? "لا توجد نتائج" : "لا توجد جهات اتصال"}
                        </p>
                        <p className="clp2-empty-sub">
                            {searchQuery ? "حاول تغيير البحث" : "جهات الاتصال الجديدة ستظهر هنا"}
                        </p>
                    </div>
                ) : (
                    <table className="clp2-table">
                        <thead>
                            <tr className="clp2-thead-row">
                                {TABLE_COLUMNS.map((col) => (
                                    <th key={col.key} className="clp2-th"
                                        style={col.width ? { width: col.width } : undefined}>
                                        {col.key === "check" ? (
                                            <input type="checkbox" className="ct-checkbox" />
                                        ) : (
                                            <div className="clp2-th-inner">
                                                <span>{col.label}</span>
                                                {col.sortable && (
                                                    <span className="clp2-sort-icon">⇅</span>
                                                )}
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
                <div className="clp2-footer">
                    <div className="clp2-page-size">
                        <span>Contacts per page:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                            className="clp2-page-select"
                        >
                            {PAGE_SIZES.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div className="clp2-page-info">
                        <span>{startItem}–{endItem} of {totalCount}</span>
                        <button
                            className="clp2-page-btn"
                            disabled={currentPage <= 1}
                            onClick={() => setCurrentPage(currentPage - 1)}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            className="clp2-page-btn"
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(currentPage + 1)}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                .clp2-root {
                    flex:1; display:flex; flex-direction:column;
                    background:var(--t-page);
                    overflow:hidden; min-width:0;
                }

                /* Top bar */
                .clp2-topbar {
                    display:flex; align-items:center;
                    justify-content:space-between;
                    padding:10px 16px;
                    background:var(--t-card);
                    border-bottom:1px solid var(--t-border-light);
                    gap:12px; flex-shrink:0;
                }
                .clp2-search-wrap {
                    display:flex; align-items:center; gap:8px;
                    background:var(--t-surface);
                    border:1px solid var(--t-border-light);
                    border-radius:8px; padding:6px 10px;
                    flex:0 0 220px;
                    transition:border-color .2s;
                }
                .clp2-search-wrap:focus-within {
                    border-color:var(--t-accent);
                }
                .clp2-search-icon { color:var(--t-text-faint); flex-shrink:0; }
                .clp2-search-input {
                    border:none; background:transparent; outline:none;
                    font-size:13px; color:var(--t-text);
                    width:100%;
                }
                .clp2-search-input::placeholder { color:var(--t-text-faint); }

                .clp2-actions {
                    display:flex; align-items:center; gap:6px;
                }
                .clp2-filter-btn {
                    width:32px; height:32px; border-radius:8px;
                    border:1px solid var(--t-border-light);
                    display:flex; align-items:center; justify-content:center;
                    cursor:pointer; transition:all .12s;
                }
                .clp2-filter-btn:hover {
                    background:var(--t-surface);
                }
                .clp2-add-btn {
                    display:flex; align-items:center; gap:6px;
                    padding:6px 14px; border-radius:8px;
                    background:var(--t-accent);
                    color:var(--t-text-on-accent);
                    border:none; cursor:pointer;
                    font-size:13px; font-weight:600;
                    transition:opacity .15s;
                }
                .clp2-add-btn:hover { opacity:0.9; }
                .clp2-add-dropdown {
                    padding:6px 6px; border-radius:0 8px 8px 0;
                    background:var(--t-accent);
                    color:var(--t-text-on-accent);
                    border:none; border-left:1px solid rgba(255,255,255,0.2);
                    cursor:pointer; display:flex; align-items:center;
                    margin-left:-6px;
                    transition:opacity .15s;
                }
                .clp2-add-dropdown:hover { opacity:0.9; }

                /* Progress */
                .clp2-progress {
                    height:2px; flex-shrink:0;
                    background:transparent; transition:background .2s;
                }
                .clp2-progress-active {
                    background:linear-gradient(90deg, transparent, var(--t-accent), transparent);
                    animation:clp2Shimmer 1.5s ease-in-out infinite;
                }

                /* Table */
                .clp2-table-wrap {
                    flex:1; overflow:auto;
                }
                .clp2-table-wrap::-webkit-scrollbar { width:4px; height:4px; }
                .clp2-table-wrap::-webkit-scrollbar-thumb {
                    background:rgba(0,0,0,.12); border-radius:4px;
                }
                .clp2-table {
                    width:100%; border-collapse:collapse; min-width:900px;
                }
                .clp2-thead-row {
                    position:sticky; top:0; z-index:2;
                    background:var(--t-card);
                    border-bottom:1px solid var(--t-border);
                }
                .clp2-th {
                    padding:10px 12px; text-align:left;
                    font-size:12px; font-weight:600;
                    color:var(--t-text-muted);
                    white-space:nowrap;
                    user-select:none;
                }
                .clp2-th-inner {
                    display:flex; align-items:center; gap:4px;
                }
                .clp2-sort-icon {
                    font-size:10px; color:var(--t-text-faint);
                    cursor:pointer;
                }

                /* Loading & Empty */
                .clp2-loading {
                    display:flex; flex-direction:column;
                    align-items:center; justify-content:center;
                    height:100%; gap:10px;
                }
                .clp2-spinner {
                    width:28px; height:28px; border-radius:50%;
                    border:3px solid var(--t-border-light);
                    border-top-color:var(--t-accent);
                    animation:spin 0.7s linear infinite;
                }
                .clp2-empty {
                    display:flex; flex-direction:column;
                    align-items:center; justify-content:center;
                    height:100%; gap:8px; padding:24px; text-align:center;
                }
                .clp2-empty-icon {
                    width:56px; height:56px; border-radius:50%;
                    background:var(--t-surface); display:flex;
                    align-items:center; justify-content:center; font-size:26px;
                }
                .clp2-empty-title {
                    font-size:14px; font-weight:600;
                    color:var(--t-text-secondary); margin:0;
                }
                .clp2-empty-sub {
                    font-size:12px; color:var(--t-text-faint); margin:0;
                }

                /* Footer */
                .clp2-footer {
                    display:flex; align-items:center;
                    justify-content:flex-end;
                    padding:8px 16px; gap:20px;
                    border-top:1px solid var(--t-border-light);
                    background:var(--t-card);
                    flex-shrink:0;
                }
                .clp2-page-size {
                    display:flex; align-items:center; gap:6px;
                    font-size:12px; color:var(--t-text-muted);
                }
                .clp2-page-select {
                    border:1px solid var(--t-border-light);
                    border-radius:6px; padding:2px 6px;
                    font-size:12px; background:var(--t-card);
                    color:var(--t-text); outline:none;
                    cursor:pointer;
                }
                .clp2-page-info {
                    display:flex; align-items:center; gap:8px;
                    font-size:12px; color:var(--t-text-muted);
                }
                .clp2-page-btn {
                    width:28px; height:28px; border-radius:6px;
                    border:1px solid var(--t-border-light);
                    background:var(--t-card); cursor:pointer;
                    display:flex; align-items:center; justify-content:center;
                    color:var(--t-text-muted); transition:all .12s;
                }
                .clp2-page-btn:hover:not(:disabled) {
                    background:var(--t-surface);
                    color:var(--t-text);
                }
                .clp2-page-btn:disabled {
                    opacity:0.4; cursor:not-allowed;
                }

                @keyframes spin { to { transform:rotate(360deg) } }
                @keyframes clp2Shimmer {
                    0% { background-position:-200px 0; }
                    100% { background-position:200px 0; }
                }
                .clp2-spin {
                    animation:spin 0.8s linear infinite;
                }
            `}</style>
        </div>
    )
}
