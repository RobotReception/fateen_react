import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { toast } from "sonner"
import { pendingKeys } from "./query-keys"
import {
    searchPendingOrders,
    processApprove,
    processReject,
} from "../services/pending-requests-service"
import type { SearchPendingOrdersParams } from "../types"

/* ─── Queries ─── */

/** Paginated pending orders with keepPreviousData for smooth pagination */
export function usePendingOrders(tenantId: string, params: SearchPendingOrdersParams) {
    return useQuery({
        queryKey: pendingKeys.search(tenantId, params as Record<string, unknown>),
        queryFn: () => searchPendingOrders(params, tenantId),
        enabled: !!tenantId,
        staleTime: 2 * 60 * 1000,
        placeholderData: keepPreviousData,
    })
}

/* ─── Mutations ─── */

export function useApproveRequest(tenantId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (requestId: string) => processApprove(requestId, tenantId),
        onSuccess: (res) => {
            if (res.success) {
                toast.success(res.message || "تمت الموافقة على الطلب بنجاح")
                qc.invalidateQueries({ queryKey: pendingKeys.all(tenantId) })
            } else {
                toast.error(res.message || "فشلت عملية الموافقة")
            }
        },
        onError: () => toast.error("حدث خطأ أثناء الموافقة"),
    })
}

export function useRejectRequest(tenantId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ requestId, reason }: { requestId: string; reason: string }) =>
            processReject(requestId, reason, tenantId),
        onSuccess: (res) => {
            if (res.success) {
                toast.success(res.message || "تم رفض الطلب")
                qc.invalidateQueries({ queryKey: pendingKeys.all(tenantId) })
            } else {
                toast.error(res.message || "فشلت عملية الرفض")
            }
        },
        onError: () => toast.error("حدث خطأ أثناء الرفض"),
    })
}
