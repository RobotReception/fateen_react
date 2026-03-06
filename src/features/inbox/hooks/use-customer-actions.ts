import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { invalidateCustomerCaches } from "@/lib/query-keys"
import {
    closeConversation,
    reopenConversation,
    assignCustomerAgent,
    updateCustomerLifecycle,
    toggleCustomerAI,
    toggleFavorite,
    toggleMuted,
    updateSessionStatus,
    assignCustomerTeams,
    removeCustomerTeams,
} from "../services/inbox-service"
import type {
    Customer,
    CustomersResponse,
    SessionStatus,
    SidebarSummary,
} from "../types/inbox.types"

/* ═══════════════════════════════════════════════ */
/*         Optimistic cache‑update helpers         */
/* ═══════════════════════════════════════════════ */

type Snapshot = {
    customerQueries: [readonly unknown[], CustomersResponse | undefined][]
    summaryQueries: [readonly unknown[], SidebarSummary | undefined][]
}

/**
 * Snapshot all cached `inbox-customers` and `inbox-summary` queries
 * so we can roll back on error.
 */
function snapshotInbox(qc: ReturnType<typeof useQueryClient>): Snapshot {
    return {
        customerQueries: qc.getQueriesData<CustomersResponse>({ queryKey: ["inbox-customers"] }),
        summaryQueries: qc.getQueriesData<SidebarSummary>({ queryKey: ["inbox-summary"] }),
    }
}

/** Restore the snapshot */
function rollback(qc: ReturnType<typeof useQueryClient>, snap: Snapshot) {
    for (const [key, data] of snap.customerQueries) {
        qc.setQueryData(key, data)
    }
    for (const [key, data] of snap.summaryQueries) {
        qc.setQueryData(key, data)
    }
}

/**
 * Apply a partial update to every cached customer that matches `customerId`.
 * Works across all paginated/filtered cache entries.
 */
function patchCustomer(
    qc: ReturnType<typeof useQueryClient>,
    customerId: string,
    updater: (c: Customer) => Partial<Customer>,
    accountId?: string,
) {
    const queries = qc.getQueriesData<CustomersResponse>({ queryKey: ["inbox-customers"] })
    for (const [key, data] of queries) {
        if (!data?.items) continue
        const idx = data.items.findIndex(c =>
            c.customer_id === customerId &&
            (accountId ? c.account_id === accountId : true)
        )
        if (idx === -1) continue
        const updated = { ...data.items[idx], ...updater(data.items[idx]) }
        const newItems = [...data.items]
        newItems[idx] = updated
        qc.setQueryData(key, { ...data, items: newItems })
    }
}

/** Invalidate + background refetch to sync with server truth across ALL features. */
function settleInbox(qc: ReturnType<typeof useQueryClient>, customerId?: string) {
    invalidateCustomerCaches(qc, customerId)
}


/* ═══════════════════════════════════════════════ */
/*               Close / Reopen                    */
/* ═══════════════════════════════════════════════ */

export function useCloseConversation(customerId: string, accountId?: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (p: { reason: string; category: string; lang?: string }) =>
            closeConversation(customerId, p, accountId),

        onMutate: async (p) => {
            await qc.cancelQueries({ queryKey: ["inbox-customers"] })
            const snap = snapshotInbox(qc)
            patchCustomer(qc, customerId, () => ({
                conversation_status: {
                    is_closed: true,
                    close_reason: p.reason,
                    close_category: p.category,
                    closed_at: new Date().toISOString(),
                },
            }), accountId)
            return snap
        },
        onSuccess: () => toast.success("تم إغلاق المحادثة"),
        onError: (e: any, _v, snap) => {
            if (snap) rollback(qc, snap)
            toast.error(e?.response?.status === 423 ? "المحادثة مغلقة مسبقاً" : "فشل إغلاق المحادثة")
        },
        onSettled: () => settleInbox(qc, customerId),
    })
}

export function useReopenConversation(customerId: string, accountId?: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (userId: string) =>
            reopenConversation(customerId, { user_id: userId }, accountId),

        onMutate: async () => {
            await qc.cancelQueries({ queryKey: ["inbox-customers"] })
            const snap = snapshotInbox(qc)
            patchCustomer(qc, customerId, () => ({
                conversation_status: null,
            }), accountId)
            return snap
        },
        onSuccess: () => toast.success("تم إعادة فتح المحادثة"),
        onError: (_e, _v, snap) => {
            if (snap) rollback(qc, snap)
            toast.error("فشل إعادة فتح المحادثة")
        },
        onSettled: () => settleInbox(qc, customerId),
    })
}


/* ═══════════════════════════════════════════════ */
/*                Assign Agent                     */
/* ═══════════════════════════════════════════════ */

export function useAssignAgent(customerId: string, accountId?: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (p: { assigned_to: string | null; is_assigned: boolean; performed_by_name?: string }) =>
            assignCustomerAgent(customerId, p, accountId),

        onMutate: async (p) => {
            await qc.cancelQueries({ queryKey: ["inbox-customers"] })
            const snap = snapshotInbox(qc)
            patchCustomer(qc, customerId, () => ({
                assigned: {
                    assigned_to: p.assigned_to,
                    assigned_to_username: p.performed_by_name ?? null,
                    is_assigned: p.is_assigned,
                    updated_at: new Date().toISOString(),
                },
                assigned_to: p.assigned_to,
            }), accountId)
            return snap
        },
        onSuccess: (_d, v) => toast.success(v.is_assigned ? "تم تعيين الموظف" : "تم إلغاء التعيين"),
        onError: (_e, _v, snap) => {
            if (snap) rollback(qc, snap)
            toast.error("فشل تعيين الموظف")
        },
        onSettled: () => settleInbox(qc, customerId),
    })
}


/* ═══════════════════════════════════════════════ */
/*                  Lifecycle                      */
/* ═══════════════════════════════════════════════ */

export function useUpdateLifecycle(customerId: string, accountId?: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (lifecycleCode: string) =>
            updateCustomerLifecycle(customerId, lifecycleCode, accountId),

        onMutate: async (code) => {
            await qc.cancelQueries({ queryKey: ["inbox-customers"] })
            const snap = snapshotInbox(qc)

            if (!code) {
                // Remove lifecycle
                patchCustomer(qc, customerId, () => ({ lifecycle: null }), accountId)
            } else {
                // Find lifecycle info from summary cache
                const summaries = qc.getQueriesData<SidebarSummary>({ queryKey: ["inbox-summary"] })
                let lcName = code
                let lcIcon: string | null = null
                for (const [, s] of summaries) {
                    const found = s?.lifecycles?.find(l => l.code === code)
                    if (found) { lcName = found.name; lcIcon = found.icon; break }
                }
                patchCustomer(qc, customerId, () => ({
                    lifecycle: { code, name: lcName, icon: lcIcon },
                }), accountId)
            }
            return snap
        },
        onSuccess: () => toast.success("تم تحديث دورة الحياة"),
        onError: (_e, _v, snap) => {
            if (snap) rollback(qc, snap)
            toast.error("فشل تحديث دورة الحياة")
        },
        onSettled: () => settleInbox(qc, customerId),
    })
}


/* ═══════════════════════════════════════════════ */
/*                  AI Toggle                      */
/* ═══════════════════════════════════════════════ */

export function useToggleAI(customerId: string, accountId?: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (enableAi: boolean) =>
            toggleCustomerAI(customerId, enableAi, accountId),

        onMutate: async (enableAi) => {
            await qc.cancelQueries({ queryKey: ["inbox-customers"] })
            const snap = snapshotInbox(qc)
            patchCustomer(qc, customerId, () => ({ enable_ai: enableAi }), accountId)
            return snap
        },
        onSuccess: (_d, v) => toast.success(v ? "تم تفعيل AI" : "تم تعطيل AI"),
        onError: (_e, _v, snap) => {
            if (snap) rollback(qc, snap)
            toast.error("فشل تغيير حالة AI")
        },
        onSettled: () => settleInbox(qc, customerId),
    })
}


/* ═══════════════════════════════════════════════ */
/*              Favorite / Muted                   */
/* ═══════════════════════════════════════════════ */

export function useToggleFavorite(customerId: string, accountId?: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (favorite: boolean) =>
            toggleFavorite(customerId, favorite, accountId),

        onMutate: async (favorite) => {
            await qc.cancelQueries({ queryKey: ["inbox-customers"] })
            const snap = snapshotInbox(qc)
            patchCustomer(qc, customerId, () => ({ favorite }), accountId)
            return snap
        },
        onSuccess: (_d, v) => toast.success(v ? "أُضيف إلى المفضلة" : "أُزيل من المفضلة"),
        onError: (_e, _v, snap) => {
            if (snap) rollback(qc, snap)
            toast.error("فشل تحديث المفضلة")
        },
        onSettled: () => settleInbox(qc, customerId),
    })
}

export function useToggleMuted(customerId: string, accountId?: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (muted: boolean) =>
            toggleMuted(customerId, muted, accountId),

        onMutate: async (muted) => {
            await qc.cancelQueries({ queryKey: ["inbox-customers"] })
            const snap = snapshotInbox(qc)
            patchCustomer(qc, customerId, () => ({ muted }), accountId)
            return snap
        },
        onSuccess: (_d, v) => toast.success(v ? "تم كتم المحادثة" : "تم إلغاء الكتم"),
        onError: (_e, _v, snap) => {
            if (snap) rollback(qc, snap)
            toast.error("فشل تحديث الكتم")
        },
        onSettled: () => settleInbox(qc, customerId),
    })
}



export function useUpdateSessionStatus(customerId: string, accountId?: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (status: SessionStatus) =>
            updateSessionStatus(customerId, status, accountId),

        onMutate: async (status) => {
            await qc.cancelQueries({ queryKey: ["inbox-customers"] })
            const snap = snapshotInbox(qc)
            patchCustomer(qc, customerId, () => ({ session_status: status }), accountId)
            return snap
        },
        onSuccess: () => toast.success("تم تحديث حالة الجلسة"),
        onError: (_e, _v, snap) => {
            if (snap) rollback(qc, snap)
            toast.error("فشل تحديث حالة الجلسة")
        },
        onSettled: () => settleInbox(qc, customerId),
    })
}


/* ═══════════════════════════════════════════════ */
/*                    Teams                        */
/* ═══════════════════════════════════════════════ */

export function useAssignTeams(customerId: string, accountId?: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (teamIds: string[]) =>
            assignCustomerTeams(customerId, teamIds, accountId),

        onMutate: async (teamIds) => {
            await qc.cancelQueries({ queryKey: ["inbox-customers"] })
            const snap = snapshotInbox(qc)
            patchCustomer(qc, customerId, (c) => {
                const existingTeams = c.team_ids?.teams ?? []
                const existingIds = existingTeams.map(t => t.team_id)
                const newTeams = teamIds
                    .filter(id => !existingIds.includes(id))
                    .map(id => ({ team_id: id, name: id }))
                return {
                    team_ids: {
                        teams: [...existingTeams, ...newTeams],
                        is_assigned_team: true,
                    },
                }
            }, accountId)
            return snap
        },
        onSuccess: () => toast.success("تم تعيين الفرق"),
        onError: (_e, _v, snap) => {
            if (snap) rollback(qc, snap)
            toast.error("فشل تعيين الفرق")
        },
        onSettled: () => settleInbox(qc, customerId),
    })
}

export function useRemoveTeams(customerId: string, accountId?: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (teamIds: string[]) =>
            removeCustomerTeams(customerId, teamIds, accountId),

        onMutate: async (teamIds) => {
            await qc.cancelQueries({ queryKey: ["inbox-customers"] })
            const snap = snapshotInbox(qc)
            patchCustomer(qc, customerId, (c) => {
                const remaining = (c.team_ids?.teams ?? []).filter(t => !teamIds.includes(t.team_id))
                return {
                    team_ids: {
                        teams: remaining,
                        is_assigned_team: remaining.length > 0,
                    },
                }
            }, accountId)
            return snap
        },
        onSuccess: () => toast.success("تم إزالة الفرق"),
        onError: (_e, _v, snap) => {
            if (snap) rollback(qc, snap)
            toast.error("فشل إزالة الفرق")
        },
        onSettled: () => settleInbox(qc, customerId),
    })
}
