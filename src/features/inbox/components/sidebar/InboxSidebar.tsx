import { useInboxStore } from "../../store/inbox.store"
import { useConversations } from "../../hooks/use-conversations"
import { SidebarHeader } from "./SidebarHeader"
import { FilterTabs } from "./FilterTabs"
import { ConversationList } from "./ConversationList"
import { useParams } from "react-router-dom"

export function InboxSidebar() {
    const { filter, setFilter, searchQuery, setSearchQuery } = useInboxStore()
    const { id: selectedId } = useParams()
    const { data: conversations = [], isLoading } = useConversations(filter, searchQuery)

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
            <FilterTabs active={filter} onChange={setFilter} />
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
