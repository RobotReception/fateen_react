import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
    getAllDynamicFields, createDynamicField, updateDynamicField, deleteDynamicField,
} from "../services/contact-fields-service"
import type { CreateDynamicFieldPayload, UpdateDynamicFieldPayload } from "../types/contact-fields.types"

/* ── Query Keys ── */
const keys = {
    dynamicFields: (tid: string) => ["dynamic-fields", tid] as const,
}

/* ════════════════════════════════════════════
   DYNAMIC FIELDS (Contact Fields)
════════════════════════════════════════════ */

/** جميع الحقول الديناميكية (GET /contacts/dynamic-fields) */
export function useDynamicFields(tid: string) {
    return useQuery({
        queryKey: keys.dynamicFields(tid),
        queryFn: () => getAllDynamicFields(tid),
        enabled: !!tid,
        select: r => {
            const d = r.data
            let list: any[] = []
            if (Array.isArray(d)) list = d
            else if (d && typeof d === "object") {
                if ("data" in d && Array.isArray((d as any).data)) list = (d as any).data
                else if ("items" in d) list = (d as any).items ?? []
            }
            // Sort by display_order (spread first to avoid mutating cache)
            return [...list].sort((a: any, b: any) => (a.display_order ?? 999) - (b.display_order ?? 999))
        },
    })
}

export function useCreateDynamicField(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (p: CreateDynamicFieldPayload) => createDynamicField(p, tid),
        onSuccess: r => {
            if (r.success) { toast.success("تم إنشاء الحقل"); qc.invalidateQueries({ queryKey: keys.dynamicFields(tid) }) }
            else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء إنشاء الحقل"),
    })
}

export function useUpdateDynamicField(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ fieldName, payload }: { fieldName: string; payload: UpdateDynamicFieldPayload }) =>
            updateDynamicField(fieldName, payload, tid),
        onSuccess: r => {
            if (r.success) { toast.success("تم تحديث الحقل"); qc.invalidateQueries({ queryKey: keys.dynamicFields(tid) }) }
            else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء تحديث الحقل"),
    })
}

export function useDeleteDynamicField(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (fieldName: string) => deleteDynamicField(fieldName, tid),
        onSuccess: r => {
            if (r.success) { toast.success("تم حذف الحقل"); qc.invalidateQueries({ queryKey: keys.dynamicFields(tid) }) }
            else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء حذف الحقل"),
    })
}
