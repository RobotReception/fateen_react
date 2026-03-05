import { useState, useEffect, useCallback } from "react"
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

// Find customer from all cached inbox-customers queries
function findCustomerInCache(
    queryClient: ReturnType<typeof useQueryClient>,
    customerId: string,
): Customer | null {
    const queries = queryClient.getQueriesData<CustomersResponse>({ queryKey: ["inbox-customers"] })
    for (const [, data] of queries) {
        if (!data?.items) continue
        const found = data.items.find((c) => c.customer_id === customerId)
        if (found) return found
    }
    return null
}

// Reactive hook: subscribes to cache changes so optimistic patches re-render
// Uses useState + useEffect to avoid synchronous updates during other renders
function useCachedCustomer(customerId: string): Customer | null {
    const queryClient = useQueryClient()
    const cache = queryClient.getQueryCache()

    const [customer, setCustomer] = useState<Customer | null>(() =>
        findCustomerInCache(queryClient, customerId)
    )

    const sync = useCallback(() => {
        setCustomer(findCustomerInCache(queryClient, customerId))
    }, [queryClient, customerId])

    useEffect(() => {
        // Initial sync
        sync()
        // Subscribe to cache changes — updates are deferred by React's setState batching
        const unsub = cache.subscribe(sync)
        return unsub
    }, [cache, sync])

    return customer
}

// Inner component that uses hooks, only rendered if `id` is present
function ConversationPageInner({ id }: { id: string }) {
    const queryClient = useQueryClient()
    const customer = useCachedCustomer(id)

    // Pass accountId so the query key is stable and API receives correct account context
    const accountId = customer?.account_id ?? undefined

    const { data, isLoading: loadingMsgs, fetchNextPage, hasNextPage, isFetchingNextPage } = useCustomerMessages(id, accountId)
    const messages = flattenMessages(data)
    const { pendingMessages } = useConversationStore()

    // Force-invalidate messages every time we navigate to a new conversation
    useEffect(() => {
        queryClient.invalidateQueries({ queryKey: ["customer-messages", id] })
    }, [id, queryClient])

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

export function ConversationPage() {
    const { id } = useParams<{ id: string }>()
    if (!id) return <Navigate to="/dashboard/inbox" replace />

    return <ConversationPageInner id={id} />
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
