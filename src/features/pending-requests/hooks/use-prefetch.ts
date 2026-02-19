import { useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import { pendingKeys } from "./query-keys"
import { searchPendingOrders } from "../services/pending-requests-service"
import type { SearchPendingOrdersParams } from "../types"

/**
 * Prefetch next page of pending orders on button hover.
 */
export function usePrefetchPendingOrders(tenantId: string) {
    const qc = useQueryClient()
    return useCallback((params: SearchPendingOrdersParams) => {
        qc.prefetchQuery({
            queryKey: pendingKeys.search(tenantId, params as Record<string, unknown>),
            queryFn: () => searchPendingOrders(params, tenantId),
            staleTime: 2 * 60 * 1000,
        })
    }, [qc, tenantId])
}
