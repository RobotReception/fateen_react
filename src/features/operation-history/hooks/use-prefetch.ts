import { useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import { operationKeys } from "./query-keys"
import { searchOperations } from "../services/operation-history-service"
import type { SearchOperationsParams } from "../types"

/**
 * Prefetch next page of operations on button hover.
 */
export function usePrefetchOperations(tenantId: string) {
    const qc = useQueryClient()
    return useCallback((params: SearchOperationsParams) => {
        qc.prefetchQuery({
            queryKey: operationKeys.search(tenantId, params as Record<string, unknown>),
            queryFn: () => searchOperations(params, tenantId),
            staleTime: 2 * 60 * 1000,
        })
    }, [qc, tenantId])
}
