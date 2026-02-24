import { useParams, Navigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { InboxNavSidebar } from "../components/sidebar/InboxNavSidebar"
import { ConversationListPanel } from "../components/sidebar/ConversationListPanel"
import { ConversationHeader } from "../components/conversation/ConversationHeader"
import { MessagesList } from "../components/conversation/MessagesList"
import { MessageComposer } from "../components/conversation/MessageComposer"
import { AssignPanel } from "../components/conversation/AssignPanel"
import { ConversationDetails } from "../components/conversation/ConversationDetails"
import { useCustomerMessages } from "../hooks/use-customer-messages"
import { useConversationStore } from "../store/conversation.store"
import type { Customer, CustomersResponse } from "../types/inbox.types"

// Find customer from cached customers queries
function useCachedCustomer(customerId: string): Customer | null {
    const queryClient = useQueryClient()
    // Search across all cached inbox-customers queries
    const queries = queryClient.getQueriesData<CustomersResponse>({ queryKey: ["inbox-customers"] })
    for (const [, data] of queries) {
        if (!data?.items) continue
        const found = data.items.find((c) => c.customer_id === customerId)
        if (found) return found
    }
    return null
}

export function ConversationPage() {
    const { id } = useParams<{ id: string }>()
    if (!id) return <Navigate to="/dashboard/inbox" replace />

    const customer = useCachedCustomer(id)
    const { data: messages = [], isLoading: loadingMsgs } = useCustomerMessages(id)
    const { detailsOpen, pendingMessages } = useConversationStore()

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
                    <>
                        <ConversationHeader customer={customer} />
                        <AssignPanel customer={customer} />
                    </>
                ) : (
                    <HeaderSkeleton />
                )}

                <div style={{ flex: 1, overflowY: "auto" }}>
                    <MessagesList messages={messages} pendingMessages={pendingMessages} isLoading={loadingMsgs} />
                </div>

                <MessageComposer customerId={id} customer={customer ?? null} />
            </div>

            {detailsOpen && customer && <ConversationDetails customer={customer} />}
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
