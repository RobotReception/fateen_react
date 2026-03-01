import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
    getAllLifecycles, createLifecycle, updateLifecycle, deleteLifecycle,
    getDeletedLifecycles, restoreLifecycle, changeCustomerLifecycle,
} from "../services/lifecycles-service"
import type {
    CreateLifecyclePayload, UpdateLifecyclePayload,
    DeleteLifecycleParams, ChangeCustomerLifecyclePayload,
} from "../types/lifecycles.types"

/* ── Query Keys ── */
const keys = {
    lifecycles: (tid: string) => ["lifecycles", tid] as const,
    deletedLifecycles: (tid: string) => ["deleted-lifecycles", tid] as const,
}

/* ════════════════════════════════════════════
   LIFECYCLES
════════════════════════════════════════════ */

export function useLifecycles(tid: string) {
    return useQuery({
        queryKey: keys.lifecycles(tid),
        queryFn: () => getAllLifecycles(tid),
        enabled: !!tid,
        select: r => r.data?.items ?? [],
    })
}

export function useCreateLifecycle(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (p: CreateLifecyclePayload) => createLifecycle(p, tid),
        onSuccess: r => {
            if (r.success) { toast.success("تم إنشاء دورة الحياة"); qc.invalidateQueries({ queryKey: keys.lifecycles(tid) }) }
            else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء إنشاء دورة الحياة"),
    })
}

export function useUpdateLifecycle(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ code, payload }: { code: string; payload: UpdateLifecyclePayload }) =>
            updateLifecycle(code, payload, tid),
        onSuccess: r => {
            if (r.success) { toast.success("تم تحديث دورة الحياة"); qc.invalidateQueries({ queryKey: keys.lifecycles(tid) }) }
            else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء تحديث دورة الحياة"),
    })
}

export function useDeleteLifecycle(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ code, params }: { code: string; params: DeleteLifecycleParams }) =>
            deleteLifecycle(code, params, tid),
        onSuccess: r => {
            if (r.success) {
                toast.success("تم تعطيل دورة الحياة")
                qc.invalidateQueries({ queryKey: keys.lifecycles(tid) })
                qc.invalidateQueries({ queryKey: keys.deletedLifecycles(tid) })
            } else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء تعطيل دورة الحياة"),
    })
}

/** المراحل المعطّلة (GET /lifecycles/deleted) */
export function useDeletedLifecycles(tid: string) {
    return useQuery({
        queryKey: keys.deletedLifecycles(tid),
        queryFn: () => getDeletedLifecycles(tid),
        enabled: !!tid,
        select: r => r.data,
    })
}

/** استعادة مرحلة معطّلة (PATCH /lifecycles/{code}/restore) */
export function useRestoreLifecycle(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (code: string) => restoreLifecycle(code, tid),
        onSuccess: r => {
            if (r.success) {
                toast.success("تم استعادة دورة الحياة")
                qc.invalidateQueries({ queryKey: keys.lifecycles(tid) })
                qc.invalidateQueries({ queryKey: keys.deletedLifecycles(tid) })
            } else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء استعادة دورة الحياة"),
    })
}

/** PATCH /lifecycles/customers/{customer_id}/lifecycle */
export function useChangeCustomerLifecycle(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ customerId, payload }: { customerId: string; payload: ChangeCustomerLifecyclePayload }) =>
            changeCustomerLifecycle(customerId, payload, tid),
        onSuccess: r => {
            if (r.success) { toast.success("تم تغيير مرحلة العميل"); qc.invalidateQueries({ queryKey: keys.lifecycles(tid) }) }
            else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء تغيير مرحلة العميل"),
    })
}
