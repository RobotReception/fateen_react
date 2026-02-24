import { useParams } from "react-router-dom"
import { useInboxStore } from "../../store/inbox.store"
import { useCustomers } from "../../hooks/use-customers"
import { ConversationItem } from "./ConversationItem"
import { FilterBar } from "./FilterBar"
import { useAuthStore } from "@/stores/auth-store"
import type { SessionStatus } from "../../types/inbox.types"

export function ConversationListPanel() {
    const { id: selectedId } = useParams()

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
        // Status
        session_status: statusParam,
        // Search
        search: searchQuery || undefined,
        // Section nav
        ...sectionFilters,
        ...(activeSection === "unassigned" ? { is_assigned: "false" } : {}),
        // Advanced filters (only pass defined values)
        ...(advancedFilters.platform ? { platform: advancedFilters.platform } : {}),
        ...(advancedFilters.lifecycle && !activeSection.startsWith("lc_") ? { lifecycle: advancedFilters.lifecycle } : {}),
        ...(advancedFilters.assigned_to && activeSection !== "mine" ? { assigned_to: advancedFilters.assigned_to } : {}),
        ...(advancedFilters.team_id && !activeSection.startsWith("team_") ? { team_id: advancedFilters.team_id } : {}),
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
        <div style={{
            width: 310,
            minWidth: 310,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            borderLeft: "1px solid var(--t-border-light)",
            background: "var(--t-bg, var(--t-surface))",
            overflow: "hidden",
        }}>
            {/* ── Filters ── */}
            <FilterBar availableFilters={availableFilters} />

            {/* ── Loading bar (thin accent line during refetch) ── */}
            <div style={{
                height: 2,
                background: isFetching ? "var(--t-accent)" : "transparent",
                transition: "background 0.2s",
                flexShrink: 0,
                ...(isFetching ? { animation: "loading-bar 1.2s ease-in-out infinite" } : {}),
            }} />

            {/* ── Conversation list ── */}
            <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
                {isLoading ? (
                    <LoadingSpinner />
                ) : customers.length === 0 ? (
                    <EmptyState hasFilters={!!searchQuery || Object.values(advancedFilters).some(Boolean)} />
                ) : (
                    <div>
                        {/* Count header */}
                        <div style={{
                            padding: "6px 14px 4px",
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                        }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--t-text-faint)" }}>
                                {totalCount} conversation{totalCount !== 1 ? "s" : ""}
                            </span>
                            {isFetching && !isLoading && (
                                <span style={{ fontSize: 10, color: "var(--t-text-faint)", display: "flex", alignItems: "center", gap: 4 }}>
                                    <span style={{
                                        width: 8, height: 8, borderRadius: "50%",
                                        border: "1.5px solid var(--t-accent)",
                                        borderTopColor: "transparent",
                                        animation: "spin 0.6s linear infinite",
                                        display: "inline-block",
                                    }} />
                                    Updating…
                                </span>
                            )}
                        </div>
                        {customers.map((customer) => (
                            <ConversationItem
                                key={customer.customer_id}
                                customer={customer}
                                isSelected={customer.customer_id === selectedId}
                            />
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
                @keyframes spin { to { transform: rotate(360deg) } }
                @keyframes loading-bar {
                    0% { opacity: 0.4 }
                    50% { opacity: 1 }
                    100% { opacity: 0.4 }
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
                borderTopColor: "var(--t-accent)",
                animation: "spin 0.7s linear infinite",
            }} />
            <span style={{ fontSize: 12, color: "var(--t-text-faint)", fontWeight: 500 }}>
                Loading conversations…
            </span>
        </div>
    )
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
    return (
        <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            height: "100%", gap: 8, padding: 24,
            textAlign: "center",
        }}>
            <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "var(--t-surface)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22,
            }}>
                {hasFilters ? "🔍" : "💬"}
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--t-text-secondary)", margin: 0 }}>
                {hasFilters ? "No results found" : "No conversations yet"}
            </p>
            <p style={{ fontSize: 11, color: "var(--t-text-faint)", margin: 0 }}>
                {hasFilters ? "Try adjusting your filters or search" : "New conversations will appear here"}
            </p>
        </div>
    )
}

