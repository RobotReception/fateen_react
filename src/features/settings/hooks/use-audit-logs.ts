import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "@/stores/auth-store"
import { getAuditLogs, type AuditLogsFilters } from "../services/audit-logs-service"

export const auditLogsKeys = {
    all: ["audit-logs"] as const,
    list: (tenantId: string, filters: AuditLogsFilters) =>
        [...auditLogsKeys.all, "list", tenantId, filters] as const,
}

export function useAuditLogs(filters: AuditLogsFilters = {}) {
    const user = useAuthStore((s) => s.user)
    const tenantId = user?.tenant_id || ""
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

    return useQuery({
        queryKey: auditLogsKeys.list(tenantId, filters),
        queryFn: () => getAuditLogs(tenantId, filters),
        enabled: !!tenantId && isAuthenticated,
        select: (res) => res.data,
        staleTime: 30 * 1000,     // 30 seconds — audit logs are live data
        refetchInterval: 60_000,  // auto-refresh every minute
        retry: 1,
    })
}
