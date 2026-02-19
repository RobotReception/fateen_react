import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { operationKeys } from "./query-keys"
import { searchOperations } from "../services/operation-history-service"
import type { SearchOperationsParams } from "../types"

/* ─── Queries ─── */

/** Paginated operation history with keepPreviousData for smooth pagination */
export function useOperationsList(tenantId: string, params: SearchOperationsParams) {
    return useQuery({
        queryKey: operationKeys.search(tenantId, params as Record<string, unknown>),
        queryFn: () => searchOperations(params, tenantId),
        enabled: !!tenantId,
        staleTime: 2 * 60 * 1000,
        placeholderData: keepPreviousData,
    })
}
