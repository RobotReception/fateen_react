import type { QueryClient } from "@tanstack/react-query"

/* ═══════════════════════════════════════════════════════════ */
/*          Centralized React-Query Key Registry              */
/*                                                             */
/*  Every feature references these constants so invalidation   */
/*  is consistent across the whole app.                        */
/* ═══════════════════════════════════════════════════════════ */

export const queryKeys = {
    // ── Inbox ────────────────────────────────────────────────
    inboxCustomers: ["inbox-customers"] as const,
    inboxSummary: ["inbox-summary"] as const,
    customerBasicInfo: (id: string, accountId?: string) =>
        ["customer-basic-info", id, accountId] as const,
    customerAICheck: (id: string, accountId?: string) =>
        ["customer-ai-check", id, accountId] as const,

    // ── Contacts ─────────────────────────────────────────────
    contacts: ["contacts"] as const,
    contactDetail: (id: string, accountId?: string) =>
        ["contact-detail", id, accountId] as const,
    contactsSidebarSummary: ["contacts-sidebar-summary"] as const,

    // ── Activity Timeline ─────────────────────────────────────
    sessionActivity: (sessionId: string) =>
        ["session-activity", sessionId] as const,

    // ── Notifications ────────────────────────────────────────
    notifications: ["notifications"] as const,
}

/* ─────────────────────────────────────────────────────────── */
/*  Cross-feature invalidation helper                          */
/*                                                             */
/*  Call this after ANY customer/contact mutation to ensure     */
/*  ALL interfaces (Inbox + Contacts) stay in sync instantly.  */
/* ─────────────────────────────────────────────────────────── */

export function invalidateCustomerCaches(
    qc: QueryClient,
    customerId?: string,
) {
    // Inbox caches
    qc.invalidateQueries({ queryKey: queryKeys.inboxCustomers })
    qc.invalidateQueries({ queryKey: queryKeys.inboxSummary })

    // Contacts caches
    qc.invalidateQueries({ queryKey: queryKeys.contacts })
    qc.invalidateQueries({ queryKey: queryKeys.contactsSidebarSummary })

    // Per-customer detail caches (scoped invalidation)
    if (customerId) {
        qc.invalidateQueries({
            queryKey: ["contact-detail", customerId],
        })
        qc.invalidateQueries({
            queryKey: ["customer-basic-info", customerId],
        })
    }
}
