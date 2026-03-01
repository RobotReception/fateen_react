import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
    getAllSnippets, createSnippet, updateSnippet, deleteSnippet,
} from "../services/snippets-service"
import type { CreateSnippetPayload, UpdateSnippetPayload } from "../types/snippets.types"

/* ── Query Keys ── */
const keys = {
    snippets: (tid: string, topic?: string) => ["snippets", tid, topic] as const,
}

/* ════════════════════════════════════════════
   SNIPPETS
════════════════════════════════════════════ */

export function useSnippets(tid: string, topic?: string) {
    return useQuery({
        queryKey: keys.snippets(tid, topic),
        queryFn: () => getAllSnippets(tid, topic),
        enabled: !!tid,
        select: r => r.data?.items ?? [],
    })
}

export function useCreateSnippet(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (p: CreateSnippetPayload) => createSnippet(p, tid),
        onSuccess: r => {
            if (r.success) { toast.success("تم إنشاء الـ Snippet"); qc.invalidateQueries({ queryKey: keys.snippets(tid) }) }
            else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء إنشاء الـ Snippet"),
    })
}

export function useUpdateSnippet(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ fieldId, payload }: { fieldId: string; payload: UpdateSnippetPayload }) =>
            updateSnippet(fieldId, payload, tid),
        onSuccess: r => {
            if (r.success) { toast.success("تم تحديث الـ Snippet"); qc.invalidateQueries({ queryKey: keys.snippets(tid) }) }
            else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء تحديث الـ Snippet"),
    })
}

export function useDeleteSnippet(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (fieldId: string) => deleteSnippet(fieldId, tid),
        onSuccess: r => {
            if (r.success) { toast.success("تم حذف الـ Snippet"); qc.invalidateQueries({ queryKey: keys.snippets(tid) }) }
            else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء حذف الـ Snippet"),
    })
}
