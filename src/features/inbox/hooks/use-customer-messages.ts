import { useInfiniteQuery } from "@tanstack/react-query"
import { getCustomerMessages } from "../services/inbox-service"
import type { Message, MessagesResponse } from "../types/inbox.types"

const PAGE_SIZE = 20

export function useCustomerMessages(customerId: string | null) {
    return useInfiniteQuery<MessagesResponse, Error>({
        queryKey: ["customer-messages", customerId],
        queryFn: ({ pageParam }) =>
            getCustomerMessages(customerId!, { page: pageParam as number, page_size: PAGE_SIZE }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const pg = lastPage.pagination
            if (!pg?.hasNext) return undefined
            const current = pg.currentPage ?? pg.page ?? 1
            return current + 1
        },
        enabled: !!customerId,
        refetchInterval: 5_000,
        // Only auto-refetch page 1 (latest messages) to avoid refetching all pages
        refetchOnWindowFocus: false,
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
