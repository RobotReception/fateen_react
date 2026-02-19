/**
 * Centralized query key factory for the Knowledge Base feature.
 * Organized hierarchically — parent keys can be used to invalidate
 * all children (e.g. knowledgeKeys.departments.all(tenantId) invalidates
 * lookup, list, and per-department categories at once).
 */
export const knowledgeKeys = {
    /* ── Departments ── */
    departments: {
        /** Invalidates everything department-related for the tenant */
        all: (tenantId: string) => ["departments", tenantId] as const,
        /** GET /departments/departments/lookup */
        lookup: (tenantId: string) => ["departments", tenantId, "lookup"] as const,
        /** GET /departments/departments (paginated) */
        list: (tenantId: string, filters: Record<string, unknown> = {}) =>
            ["departments", tenantId, "list", filters] as const,
        /** GET /departments/{id}/categories */
        categories: (tenantId: string, deptId: string) =>
            ["departments", tenantId, deptId, "categories"] as const,
    },

    /* ── Categories ── */
    categories: {
        all: (tenantId: string) => ["categories", tenantId] as const,
        /** GET /categories (paginated) */
        list: (tenantId: string, filters: Record<string, unknown> = {}) =>
            ["categories", tenantId, "list", filters] as const,
        /** GET /categories (small page, for dropdowns) */
        lookup: (tenantId: string) => ["categories", tenantId, "lookup"] as const,
    },

    /* ── Documents ── */
    documents: {
        all: (tenantId: string) => ["documents", tenantId] as const,
        /** GET /documents/search-documents */
        search: (tenantId: string, filters: Record<string, unknown> = {}) =>
            ["documents", tenantId, "search", filters] as const,
    },

    /* ── Users ── */
    users: {
        all: (tenantId: string) => ["users", tenantId] as const,
        /** GET /documents/get-files/data */
        list: (tenantId: string, filters: Record<string, unknown> = {}) =>
            ["users", tenantId, "list", filters] as const,
    },

    /* ── Analytics ── */
    analytics: {
        all: (tenantId: string) => ["analytics", tenantId] as const,
        /** GET /documents/files/analytics/tenant */
        tenant: (tenantId: string, params: Record<string, unknown> = {}) =>
            ["analytics", tenantId, "tenant", params] as const,
    },
} as const
