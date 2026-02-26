import { useSyncExternalStore } from "react"
import { useParams, Navigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { InboxNavSidebar } from "../components/sidebar/InboxNavSidebar"
import { ConversationListPanel } from "../components/sidebar/ConversationListPanel"
import { ConversationHeader } from "../components/conversation/ConversationHeader"
import { MessagesList } from "../components/conversation/MessagesList"
import { MessageComposer } from "../components/conversation/MessageComposer"
import { ConversationDetails } from "../components/conversation/ConversationDetails"
import { useCustomerMessages, flattenMessages } from "../hooks/use-customer-messages"
import { useConversationStore } from "../store/conversation.store"
import type { Customer, CustomersResponse } from "../types/inbox.types"

// Reactive hook: subscribes to cache changes so optimistic patches re-render instantly
function useCachedCustomer(customerId: string): Customer | null {
    const queryClient = useQueryClient()
    const cache = queryClient.getQueryCache()

    // Subscribe to cache changes (any mutation/query update triggers this)
    const customer = useSyncExternalStore(
        (onStoreChange) => cache.subscribe(onStoreChange),
        () => {
            const queries = queryClient.getQueriesData<CustomersResponse>({ queryKey: ["inbox-customers"] })
            for (const [, data] of queries) {
                if (!data?.items) continue
                const found = data.items.find((c) => c.customer_id === customerId)
                if (found) return found
            }
            return null
        },
    )
    return customer
}

export function ConversationPage() {
    const { id } = useParams<{ id: string }>()
    if (!id) return <Navigate to="/dashboard/inbox" replace />

    const customer = useCachedCustomer(id)
    const { data, isLoading: loadingMsgs, fetchNextPage, hasNextPage, isFetchingNextPage } = useCustomerMessages(id)
    const messages = flattenMessages(data)
    const { pendingMessages } = useConversationStore()

    return (
        <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
            <InboxNavSidebar />
            <ConversationListPanel />

            {/* Chat window */}
            <div style={{
                flex: 1, display: "flex", flexDirection: "column",
                overflow: "hidden", background: "var(--t-bg, #f8fafc)",
            }}>
                {customer ? (
                    <ConversationHeader customer={customer} />) : (
                    <HeaderSkeleton />
                )}

                <div style={{ flex: 1, overflow: "hidden" }}>
                    <MessagesList
                        messages={messages}
                        pendingMessages={pendingMessages}
                        isLoading={loadingMsgs}
                        isFetchingMore={isFetchingNextPage}
                        hasMore={!!hasNextPage}
                        onLoadMore={() => fetchNextPage()}
                    />
                </div>

                <MessageComposer customerId={id} customer={customer ?? null} />
            </div>

            {customer && <ConversationDetails customer={customer} />}
        </div>
    )
}

function HeaderSkeleton() {
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px", borderBottom: "1px solid var(--t-border-light)",
            background: "var(--t-card)",
        }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--t-surface)", animation: "pulse 1.5s infinite" }} />
            <div style={{ flex: 1 }}>
                <div style={{ height: 12, width: 120, background: "var(--t-surface)", borderRadius: 6, marginBottom: 6, animation: "pulse 1.5s infinite" }} />
                <div style={{ height: 10, width: 70, background: "var(--t-surface)", borderRadius: 6, animation: "pulse 1.5s infinite" }} />
            </div>
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
        </div>
    )
}
