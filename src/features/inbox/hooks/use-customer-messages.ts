import { useInfiniteQuery } from "@tanstack/react-query"
import { getCustomerMessages } from "../services/inbox-service"
import type { Message, MessagesResponse } from "../types/inbox.types"

const PAGE_SIZE = 20

export function useCustomerMessages(customerId: string | null, accountId?: string) {
    return useInfiniteQuery<MessagesResponse, Error>({
        // Key intentionally excludes accountId to keep it stable as customer data loads.
        // accountId is still forwarded to the API via the queryFn closure.
        queryKey: ["customer-messages", customerId],
        queryFn: ({ pageParam }) =>
            getCustomerMessages(customerId!, {
                page: pageParam as number,
                page_size: PAGE_SIZE,
                ...(accountId && { account_id: accountId }),
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const pg = lastPage.pagination
            if (!pg?.hasNext) return undefined
            const current = pg.currentPage ?? pg.page ?? 1
            return current + 1
        },
        // ── Refresh behaviour ──────────────────────────────
        enabled: !!customerId,
        staleTime: 0,                    // always consider data stale → refetch on navigation
        refetchOnMount: "always",        // fetch fresh messages every time conversation opens
        refetchOnWindowFocus: true,      // refresh when user tabs back in
        refetchInterval: 8_000,          // background poll every 8s
        // Limit to 3 pages so polling only re-fetches the 3 most recent pages,
        // not the entire history (which would never surface new messages at page 1)
        maxPages: 3,
    })
}



/** Flatten all pages into a single sorted messages array */
export function flattenMessages(data: ReturnType<typeof useCustomerMessages>["data"]): Message[] {
    if (!data?.pages) return []
    // Pages come newest-first from API, so reverse pages order then concat  
    const allMsgs: Message[] = []
    // Iterate pages in reverse so oldest pages come first
    for (let i = data.pages.length - 1; i >= 0; i--) {
        const page = data.pages[i]
        allMsgs.push(...(page.messages ?? []))
    }
    return allMsgs
}
