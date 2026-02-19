import { useQuery, useQueryClient } from "@tanstack/react-query"
import { knowledgeKeys } from "./query-keys"
import { getTenantAnalytics } from "../services/knowledge-service"
import type { TenantAnalyticsParams } from "../types"

/* ── Queries ────────────────────────────────────────────── */

/** Tenant-level analytics with filters */
export function useTenantAnalytics(tenantId: string, params: TenantAnalyticsParams) {
    return useQuery({
        queryKey: knowledgeKeys.analytics.tenant(tenantId, params as Record<string, unknown>),
        queryFn: () => getTenantAnalytics(params, tenantId),
        enabled: !!tenantId,
    })
}

/** Helper to manually refresh analytics data */
export function useInvalidateAnalytics(tenantId: string) {
    const qc = useQueryClient()
    return () => qc.invalidateQueries({ queryKey: knowledgeKeys.analytics.all(tenantId) })
}
