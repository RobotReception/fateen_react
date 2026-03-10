import { useState, useEffect, useMemo, useCallback, memo, lazy, Suspense } from "react"
import { useParams, useSearchParams, Navigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { InboxNavSidebar } from "../components/sidebar/InboxNavSidebar"
import { ConversationListPanel } from "../components/sidebar/ConversationListPanel"
import { ConversationHeader } from "../components/conversation/ConversationHeader"
import { MessagesList } from "../components/conversation/MessagesList"
import { MessageComposer } from "../components/conversation/MessageComposer"
import { useCustomerMessages, flattenMessages } from "../hooks/use-customer-messages"
import { useConversationStore } from "../store/conversation.store"
import { useInboxSocket } from "@/hooks/use-inbox-socket"
import type { Customer, CustomersResponse } from "../types/inbox.types"

const ConversationDetails = lazy(() =>
    import("../components/conversation/ConversationDetails").then(m => ({ default: m.ConversationDetails }))
)

function findCustomerInCache(
    qc: ReturnType<typeof useQueryClient>,
    customerId: string,
    accountId?: string,
): Customer | null {
    const queries = qc.getQueriesData<CustomersResponse>({ queryKey: ["inbox-customers"] })
    for (const [, data] of queries) {
        if (!data?.items) continue
        const found = data.items.find(c =>
            c.customer_id === customerId &&
            (accountId ? c.account_id === accountId : true)
        )
        if (found) return found
    }
    return null
}

function shallowEqual(a: Customer | null, b: Customer | null): boolean {
    if (a === b) return true
    if (!a || !b) return false

    // Identity fields
    if (a.customer_id !== b.customer_id || a.account_id !== b.account_id) return false

    // Message/unread fields
    if (a.unread_count !== b.unread_count) return false
    if (a.last_message !== b.last_message) return false
    if (a.last_timestamp !== b.last_timestamp) return false

    // Status fields
    if (a.session_status !== b.session_status) return false
    if (a.enable_ai !== b.enable_ai) return false
    if (a.favorite !== b.favorite) return false
    if (a.muted !== b.muted) return false
    if (a.sender_name !== b.sender_name) return false

    // Assigned agent
    if (a.assigned?.assigned_to !== b.assigned?.assigned_to) return false
    if (a.assigned?.is_assigned !== b.assigned?.is_assigned) return false

    // Lifecycle
    if (a.lifecycle?.code !== b.lifecycle?.code) return false

    // Conversation status (close/reopen)
    if (a.conversation_status?.is_closed !== b.conversation_status?.is_closed) return false

    // Teams — compare team IDs
    const aTeams = a.team_ids?.teams ?? []
    const bTeams = b.team_ids?.teams ?? []
    if (aTeams.length !== bTeams.length) return false
    for (let i = 0; i < aTeams.length; i++) {
        if (aTeams[i].team_id !== bTeams[i].team_id) return false
    }

    // Tags (TagDetail objects — compare by id)
    const aTags = a.tags ?? []
    const bTags = b.tags ?? []
    if (aTags.length !== bTags.length) return false
    for (let i = 0; i < aTags.length; i++) {
        if (aTags[i]?.id !== bTags[i]?.id) return false
    }

    return true
}

function useCachedCustomer(customerId: string, accountId?: string): Customer | null {
    const queryClient = useQueryClient()

    const [customer, setCustomer] = useState<Customer | null>(() =>
        findCustomerInCache(queryClient, customerId, accountId)
    )

    useEffect(() => {
        setCustomer(findCustomerInCache(queryClient, customerId, accountId))

        let rafId: number | null = null
        const unsubscribe = queryClient.getQueryCache().subscribe(event => {
            const key = event?.query?.queryKey
            if (!Array.isArray(key) || key[0] !== "inbox-customers") return

            if (rafId !== null) cancelAnimationFrame(rafId)
            rafId = requestAnimationFrame(() => {
                rafId = null
                const next = findCustomerInCache(queryClient, customerId, accountId)
                setCustomer(prev => shallowEqual(prev, next) ? prev : next)
            })
        })

        return () => {
            unsubscribe()
            if (rafId !== null) cancelAnimationFrame(rafId)
        }
    }, [queryClient, customerId, accountId])

    return customer
}

const SidebarSection = memo(function SidebarSection() {
    return (
        <>
            <InboxNavSidebar />
            <ConversationListPanel />
        </>
    )
})

const DetailsSuspense = memo(function DetailsSuspense({ customer }: { customer: Customer }) {
    return (
        <Suspense fallback={<DetailsSkeleton />}>
            <ConversationDetails customer={customer} />
        </Suspense>
    )
})

function ConversationPageInner({ id, accountId }: { id: string; accountId?: string }) {
    const queryClient = useQueryClient()
    const customer = useCachedCustomer(id, accountId)
    const resolvedAccountId = customer?.account_id ?? accountId

    // Live inbox events via WebSocket
    useInboxSocket()

    const {
        data, isLoading: loadingMsgs,
        fetchNextPage, hasNextPage, isFetchingNextPage,
    } = useCustomerMessages(id, resolvedAccountId)

    const messages = useMemo(() => flattenMessages(data), [data])
    const pendingMessages = useConversationStore(s => s.pendingMessages)
    const handleLoadMore = useCallback(() => fetchNextPage(), [fetchNextPage])

    useEffect(() => {
        queryClient.invalidateQueries({ queryKey: ["customer-messages", id, resolvedAccountId] })
    }, [id, resolvedAccountId, queryClient])

    return (
        <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
            <SidebarSection />

            <div style={{
                flex: 1, display: "flex", flexDirection: "column",
                overflow: "hidden", background: "var(--t-bg, #f8fafc)",
            }}>
                {customer ? <ConversationHeader customer={customer} /> : <HeaderSkeleton />}

                <div style={{ flex: 1, overflow: "hidden" }}>
                    <MessagesList
                        messages={messages}
                        pendingMessages={pendingMessages}
                        isLoading={loadingMsgs}
                        isFetchingMore={isFetchingNextPage}
                        hasMore={!!hasNextPage}
                        onLoadMore={handleLoadMore}
                    />
                </div>

                <MessageComposer customerId={id} customer={customer ?? null} />
            </div>

            {customer && <DetailsSuspense customer={customer} />}
        </div>
    )
}

export function ConversationPage() {
    const { id } = useParams<{ id: string }>()
    const [searchParams] = useSearchParams()
    const accountId = searchParams.get("acc") ?? undefined
    if (!id) return <Navigate to="/dashboard/inbox" replace />
    return <ConversationPageInner key={`${id}:${accountId ?? ""}`} id={id} accountId={accountId} />
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

function DetailsSkeleton() {
    return (
        <div style={{
            width: 320, minWidth: 320, borderRight: "1px solid var(--t-border-light)",
            background: "var(--t-card)", display: "flex", alignItems: "center",
            justifyContent: "center",
        }}>
            <div style={{
                width: 24, height: 24, borderRadius: "50%",
                border: "2.5px solid var(--t-border-light)",
                borderTopColor: "#0072b5",
                animation: "spin .7s linear infinite",
            }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )
}
