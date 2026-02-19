/* ═══════════════════════════════════════════════════════
   USERS — QUERY KEY FACTORY
   ═══════════════════════════════════════════════════════ */

export const usersKeys = {
    all: (tenantId: string) => ["users", tenantId] as const,
    list: (tenantId: string, params: Record<string, unknown>) =>
        [...usersKeys.all(tenantId), "list", params] as const,
    detail: (tenantId: string, userId: string) =>
        [...usersKeys.all(tenantId), "detail", userId] as const,
    roles: (tenantId: string) =>
        [...usersKeys.all(tenantId), "roles"] as const,
}
