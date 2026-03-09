import { useInboxStore } from "../../store/inbox.store"
import { useCustomers } from "../../hooks/use-customers"
import { SidebarHeader } from "./SidebarHeader"
import { FilterTabs } from "./FilterTabs"
import { ConversationList } from "./ConversationList"
import { useParams } from "react-router-dom"

export function InboxSidebar() {
    const { statusFilter, setStatusFilter, searchQuery, setSearchQuery } = useInboxStore()
    const { id: selectedId } = useParams()
    const { data, isLoading } = useCustomers({
        session_status: statusFilter === "all" ? undefined : statusFilter as any,
        search: searchQuery || undefined,
    })
    const conversations = data?.items ?? []

    return (
        <aside style={{
            width: 300,
            minWidth: 300,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            borderLeft: "1px solid var(--t-border)",
            background: "var(--t-card)",
            overflow: "hidden",
        }}>
            <SidebarHeader searchQuery={searchQuery} onSearch={setSearchQuery} />
            <FilterTabs active={statusFilter} onChange={setStatusFilter} />
            <div style={{ flex: 1, overflowY: "auto" }}>
                <ConversationList
                    conversations={conversations}
                    selectedId={selectedId ?? null}
                    isLoading={isLoading}
                />
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
            `}</style>
        </aside>
    )
}
