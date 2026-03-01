import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
    getAllTags, getTagById, createTag, updateTag, deleteTag,
    getDeletedTags, restoreTag,
} from "../services/tags-service"
import type { CreateTagPayload, UpdateTagPayload } from "../types/tags.types"

/* ── Query Keys ── */
const keys = {
    tags: (tid: string) => ["tags", tid] as const,
    deletedTags: (tid: string) => ["deleted-tags", tid] as const,
}

/* ════════════════════════════════════════════
   TAGS
════════════════════════════════════════════ */

/** جميع التاجات (GET /tags) */
export function useTags(tid: string, page = 1, pageSize = 100) {
    return useQuery({
        queryKey: keys.tags(tid),
        queryFn: () => getAllTags(tid, page, pageSize),
        enabled: !!tid,
        select: r => r.data?.items ?? [],
    })
}

/** تاج محدد (GET /tags/{tag_id}) */
export function useTagById(tid: string, tagId: string) {
    return useQuery({
        queryKey: [...keys.tags(tid), tagId],
        queryFn: () => getTagById(tagId, tid),
        enabled: !!tid && !!tagId,
        select: r => r.data,
    })
}

export function useCreateTag(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (p: CreateTagPayload) => createTag(p, tid),
        onSuccess: r => {
            if (r.success) { toast.success("تم إنشاء التاج"); qc.invalidateQueries({ queryKey: keys.tags(tid) }) }
            else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء إنشاء التاج"),
    })
}

export function useUpdateTag(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ tagId, payload }: { tagId: string; payload: UpdateTagPayload }) =>
            updateTag(tagId, payload, tid),
        onSuccess: r => {
            if (r.success) { toast.success("تم تحديث التاج"); qc.invalidateQueries({ queryKey: keys.tags(tid) }) }
            else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء تحديث التاج"),
    })
}

export function useDeleteTag(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (tagId: string) => deleteTag(tagId, tid),
        onSuccess: r => {
            if (r.success) {
                toast.success("تم تعطيل التاج")
                qc.invalidateQueries({ queryKey: keys.tags(tid) })
                qc.invalidateQueries({ queryKey: keys.deletedTags(tid) })
            } else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء تعطيل التاج"),
    })
}

/** التاجات المعطّلة (GET /tags/deleted) */
export function useDeletedTags(tid: string, page = 1, pageSize = 20) {
    return useQuery({
        queryKey: keys.deletedTags(tid),
        queryFn: () => getDeletedTags(tid, page, pageSize),
        enabled: !!tid,
        select: r => r.data,
    })
}

/** استعادة تاج معطّل (PATCH /tags/{tag_id}/restore) */
export function useRestoreTag(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (tagId: string) => restoreTag(tagId, tid),
        onSuccess: r => {
            if (r.success) {
                toast.success("تم استعادة التاج")
                qc.invalidateQueries({ queryKey: keys.tags(tid) })
                qc.invalidateQueries({ queryKey: keys.deletedTags(tid) })
            } else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء استعادة التاج"),
    })
}
