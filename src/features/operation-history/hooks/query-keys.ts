/* ═══════════════════════════════════════════════════════
   OPERATION HISTORY — QUERY KEY FACTORY
   ═══════════════════════════════════════════════════════ */

export const operationKeys = {
    all: (tenantId: string) => ["operation-history", tenantId] as const,
    search: (tenantId: string, params: Record<string, unknown>) =>
        [...operationKeys.all(tenantId), "search", params] as const,
    details: (tenantId: string, operationId: string) =>
        [...operationKeys.all(tenantId), "details", operationId] as const,
}
