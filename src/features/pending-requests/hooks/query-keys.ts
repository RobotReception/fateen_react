/* ═══════════════════════════════════════════════════════
   PENDING REQUESTS — QUERY KEY FACTORY
   ═══════════════════════════════════════════════════════ */

export const pendingKeys = {
    all: (tenantId: string) => ["pending-requests", tenantId] as const,
    search: (tenantId: string, params: Record<string, unknown>) =>
        [...pendingKeys.all(tenantId), "search", params] as const,
    details: (tenantId: string, requestId: string) =>
        [...pendingKeys.all(tenantId), "details", requestId] as const,
}
