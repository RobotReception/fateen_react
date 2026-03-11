import { useParams, useSearchParams } from "react-router-dom"
import { useInboxStore } from "../../store/inbox.store"
import { useCustomers } from "../../hooks/use-customers"
import { ConversationItem } from "./ConversationItem"
import { FilterBar } from "./FilterBar"
import { useAuthStore } from "@/stores/auth-store"
import type { SessionStatus } from "../../types/inbox.types"

export function ConversationListPanel() {
    const { id: selectedId } = useParams()
    const [searchParams] = useSearchParams()
    const selectedAcc = searchParams.get("acc") ?? undefined

    const {
        statusFilter,
        searchQuery,
        activeSection,
        advancedFilters,
    } = useInboxStore()

    const { user } = useAuthStore()

    // ── Derive status param ──
    const statusParam: SessionStatus | undefined =
        statusFilter === "all" ? undefined
            : statusFilter === "open" ? "open"
                : statusFilter === "closed" ? "closed"
                    : statusFilter === "pending" ? "pending"
                        : undefined

    // ── Section-level filters (from left nav) ──
    const sectionFilters = (() => {
        if (activeSection === "all") return {}
        if (activeSection === "mine" && user?.id)
            return { assigned_to: user.id }
        if (activeSection === "unassigned")
            return {}
        if (activeSection.startsWith("lc_"))
            return { lifecycle: activeSection.slice(3) }
        if (activeSection.startsWith("team_"))
            return { team_id: activeSection.slice(5) }
        return {}
    })()

    // ── Merge all filters → API params ──
    const customerParams = {
        session_status: statusParam,
        search: searchQuery || undefined,
        ...sectionFilters,
        ...(activeSection === "unassigned" ? { is_assigned: "false" } : {}),
        ...(advancedFilters.platform ? { platform: advancedFilters.platform } : {}),
        ...(advancedFilters.lifecycle && !activeSection.startsWith("lc_") ? { lifecycle: advancedFilters.lifecycle } : {}),
        ...(advancedFilters.assigned_to && activeSection !== "mine" ? { assigned_to: advancedFilters.assigned_to } : {}),
        ...(advancedFilters.team_id && !activeSection.startsWith("team_") ? { team_id: advancedFilters.team_id } : {}),
        ...(advancedFilters.account_id ? { account_id: advancedFilters.account_id } : {}),
        ...(advancedFilters.start_date ? { start_date: advancedFilters.start_date } : {}),
        ...(advancedFilters.end_date ? { end_date: advancedFilters.end_date } : {}),
        ...(advancedFilters.unread_only ? { unread_only: true } : {}),
        ...(advancedFilters.favorite ? { favorite: true } : {}),
        ...(advancedFilters.muted ? { muted: true } : {}),
        ...(advancedFilters.enable_ai_q ? { enable_ai_q: advancedFilters.enable_ai_q } : {}),
    }

    const { data, isLoading, isFetching } = useCustomers(customerParams)
    const customers = data?.items ?? []
    const availableFilters = data?.filters ?? null
    const totalCount = data?.pagination?.totalCount ?? customers.length

    return (
        <div className="clp-root">
            {/* ── Brand accent strip ── */}
            <div className="clp-accent-strip" />

            {/* ── Filters ── */}
            <FilterBar availableFilters={availableFilters} />

            {/* ── Loading progress bar ── */}
            <div className={`clp-progress ${isFetching ? "clp-progress-active" : ""}`} />

            {/* ── Conversation list ── */}
            <div className="clp-list">
                {isLoading ? (
                    <LoadingSpinner />
                ) : customers.length === 0 ? (
                    <EmptyState hasFilters={!!searchQuery || Object.values(advancedFilters).some(Boolean)} />
                ) : (
                    <>
                        {/* Count header */}
                        <div className="clp-count-row">
                            <span className="clp-count">
                                <span className="clp-count-num">{totalCount}</span> محادثة
                            </span>
                            {isFetching && !isLoading && (
                                <span className="clp-updating">
                                    <span className="clp-spinner-mini" />
                                    جاري التحديث
                                </span>
                            )}
                        </div>
                        {customers.map((customer) => (
                            <ConversationItem
                                key={`${customer.customer_id}:${customer.account_id ?? ""}`}
                                customer={customer}
                                isSelected={
                                    customer.customer_id === selectedId &&
                                    (selectedAcc ? customer.account_id === selectedAcc : true)
                                }
                            />
                        ))}
                    </>
                )}
            </div>

            <style>{`
                .clp-root {
                    width:320px; min-width:320px; height:100%;
                    display:flex; flex-direction:column;
                    border-left:1px solid var(--t-border-light);
                    background:var(--t-card);
                    overflow:hidden;
                    position:relative;
                }

                /* Brand accent */
                .clp-accent-strip {
                    height:3px; flex-shrink:0;
                    background:var(--t-gradient-accent-h);
                    opacity:0.85;
                }

                /* Progress bar */
                .clp-progress {
                    height:2px; flex-shrink:0;
                    background:transparent;
                    transition:background .2s;
                }
                .clp-progress-active {
                    background:linear-gradient(90deg, transparent, var(--t-accent-secondary), transparent);
                    background-size:200% 100%;
                    animation:clpShimmer 1.5s ease-in-out infinite;
                }

                /* List */
                .clp-list {
                    flex:1; overflow-y:auto; position:relative;
                }
                .clp-list::-webkit-scrollbar { width:4px; }
                .clp-list::-webkit-scrollbar-thumb {
                    background:rgba(0,0,0,.1); border-radius:4px;
                }
                .clp-list::-webkit-scrollbar-track { background:transparent; }

                /* Count row */
                .clp-count-row {
                    padding:8px 14px 4px;
                    display:flex; align-items:center; justify-content:space-between;
                    border-bottom:1px solid var(--t-border-light);
                }
                .clp-count {
                    font-size:11px; font-weight:600;
                    color:var(--t-text-faint);
                }
                .clp-count-num {
                    font-weight:800; color:var(--t-text-muted);
                    font-size:12px;
                }
                .clp-updating {
                    font-size:10px; color:var(--t-text-faint);
                    display:flex; align-items:center; gap:4px;
                }
                .clp-spinner-mini {
                    width:8px; height:8px; border-radius:50%;
                    border:1.5px solid var(--t-accent-secondary);
                    border-top-color:transparent;
                    animation:spin .6s linear infinite;
                    display:inline-block;
                }

                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
                @keyframes spin { to { transform: rotate(360deg) } }
                @keyframes clpShimmer {
                    0% { background-position: -200px 0; }
                    100% { background-position: 200px 0; }
                }
            `}</style>
        </div>
    )
}

function LoadingSpinner() {
    return (
        <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            height: "100%", gap: 12,
        }}>
            <div style={{
                width: 32, height: 32, borderRadius: "50%",
                border: "3px solid var(--t-border-light)",
                borderTopColor: "var(--t-accent-secondary)",
                animation: "spin 0.7s linear infinite",
            }} />
            <span style={{
                fontSize: 12, color: "var(--t-text-faint)", fontWeight: 600,
                letterSpacing: "-0.01em",
            }}>
                جاري تحميل المحادثات…
            </span>
        </div>
    )
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
    return (
        <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            height: "100%", gap: 10, padding: 32,
            textAlign: "center",
        }}>
            <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(27,80,145,0.08), var(--t-accent-muted))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24,
                border: "1px solid rgba(27,80,145,0.1)",
            }}>
                {hasFilters ? "🔍" : "💬"}
            </div>
            <p style={{
                fontSize: 13, fontWeight: 700, color: "var(--t-text-secondary)",
                margin: 0, letterSpacing: "-0.01em",
            }}>
                {hasFilters ? "لا توجد نتائج" : "لا توجد محادثات بعد"}
            </p>
            <p style={{ fontSize: 11, color: "var(--t-text-faint)", margin: 0, lineHeight: 1.5 }}>
                {hasFilters ? "حاول تغيير الفلاتر أو البحث" : "المحادثات الجديدة ستظهر هنا"}
            </p>
        </div>
    )
}
