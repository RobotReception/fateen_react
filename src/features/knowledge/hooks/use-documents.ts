import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { toast } from "sonner"
import { knowledgeKeys } from "./query-keys"
import {
    searchDocuments,
    updateDocument,
    deleteDocuments,
} from "../services/knowledge-service"
import type {
    SearchDocumentsParams,
    UpdateDocumentPayload,
    DeleteDocumentPayload,
} from "../types"

/* ── Queries ────────────────────────────────────────────── */

/** Search / filter documents with pagination (cached 3 min) */
export function useSearchDocuments(tenantId: string, params: SearchDocumentsParams, enabled = true) {
    return useQuery({
        queryKey: knowledgeKeys.documents.search(tenantId, params as Record<string, unknown>),
        queryFn: () => searchDocuments(params, tenantId),
        enabled: !!tenantId && enabled,
        staleTime: 3 * 60 * 1000,
        placeholderData: keepPreviousData,
    })
}

/* ── Mutations ──────────────────────────────────────────── */

export function useUpdateDocument(tenantId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (payload: UpdateDocumentPayload) => updateDocument(payload, tenantId),
        onSuccess: (res) => {
            if (res.success) {
                toast.success("تم إرسال طلب التحديث بنجاح")
                qc.invalidateQueries({ queryKey: knowledgeKeys.documents.all(tenantId) })
            } else {
                toast.error(res.message || "فشل التحديث")
            }
        },
        onError: () => toast.error("حدث خطأ أثناء التحديث"),
    })
}

export function useDeleteDocuments(tenantId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (payload: DeleteDocumentPayload) => deleteDocuments(payload, tenantId),
        onSuccess: (res, payload) => {
            const count = Array.isArray(payload.doc_id) ? payload.doc_id.length : 1
            if (res.success) {
                toast.success(`تم حذف ${count} مستند بنجاح`)
                qc.invalidateQueries({ queryKey: knowledgeKeys.documents.all(tenantId) })
            } else {
                toast.error(res.message || "فشل الحذف")
            }
        },
        onError: () => toast.error("حدث خطأ أثناء الحذف"),
    })
}
