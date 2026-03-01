import { useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import { knowledgeKeys } from "./query-keys"
import { pendingKeys } from "@/features/pending-requests/hooks/query-keys"
import { operationKeys } from "@/features/operation-history/hooks/query-keys"

/**
 * Centralized event-driven cache invalidation for Knowledge Base.
 *
 * Each method corresponds to a user action and invalidates ALL
 * related query caches across tabs so the UI stays consistent.
 *
 * ┌──────────────────────┬──────────────────────────────────────────────┐
 * │ Event                │ Invalidated Caches                          │
 * ├──────────────────────┼──────────────────────────────────────────────┤
 * │ onDataAdded          │ pending-requests, analytics, documents      │
 * │ onFileUploaded       │ pending-requests, analytics, documents,     │
 * │                      │ users                                       │
 * │ onDocumentUpdated    │ pending-requests, documents                 │
 * │ onDocumentDeleted    │ analytics, documents, users                 │
 * │ onRequestApproved    │ pending-requests, documents, analytics,     │
 * │                      │ users, operation-history                    │
 * │ onRequestRejected    │ pending-requests, operation-history         │
 * └──────────────────────┴──────────────────────────────────────────────┘
 */
export function useKnowledgeEvents(tenantId: string) {
    const qc = useQueryClient()

    /** After adding text (addDataJson) → creates a pending request */
    const onDataAdded = useCallback(() => {
        qc.invalidateQueries({ queryKey: pendingKeys.all(tenantId) })
        qc.invalidateQueries({ queryKey: knowledgeKeys.analytics.all(tenantId) })
        qc.invalidateQueries({ queryKey: knowledgeKeys.documents.all(tenantId) })
    }, [qc, tenantId])

    /** After uploading files (trainTxt/trainCsv) → creates pending request(s) */
    const onFileUploaded = useCallback(() => {
        qc.invalidateQueries({ queryKey: pendingKeys.all(tenantId) })
        qc.invalidateQueries({ queryKey: knowledgeKeys.analytics.all(tenantId) })
        qc.invalidateQueries({ queryKey: knowledgeKeys.documents.all(tenantId) })
        qc.invalidateQueries({ queryKey: knowledgeKeys.users.all(tenantId) })
    }, [qc, tenantId])

    /** After updating a document → creates a pending request */
    const onDocumentUpdated = useCallback(() => {
        qc.invalidateQueries({ queryKey: pendingKeys.all(tenantId) })
        qc.invalidateQueries({ queryKey: knowledgeKeys.documents.all(tenantId) })
    }, [qc, tenantId])

    /** After deleting document(s) → immediate effect */
    const onDocumentDeleted = useCallback(() => {
        qc.invalidateQueries({ queryKey: knowledgeKeys.analytics.all(tenantId) })
        qc.invalidateQueries({ queryKey: knowledgeKeys.documents.all(tenantId) })
        qc.invalidateQueries({ queryKey: knowledgeKeys.users.all(tenantId) })
    }, [qc, tenantId])

    /** After approving a pending request → data lands in system */
    const onRequestApproved = useCallback(() => {
        qc.invalidateQueries({ queryKey: pendingKeys.all(tenantId) })
        qc.invalidateQueries({ queryKey: knowledgeKeys.documents.all(tenantId) })
        qc.invalidateQueries({ queryKey: knowledgeKeys.analytics.all(tenantId) })
        qc.invalidateQueries({ queryKey: knowledgeKeys.users.all(tenantId) })
        qc.invalidateQueries({ queryKey: operationKeys.all(tenantId) })
    }, [qc, tenantId])

    /** After rejecting a pending request → only history changes */
    const onRequestRejected = useCallback(() => {
        qc.invalidateQueries({ queryKey: pendingKeys.all(tenantId) })
        qc.invalidateQueries({ queryKey: operationKeys.all(tenantId) })
    }, [qc, tenantId])

    return {
        onDataAdded,
        onFileUploaded,
        onDocumentUpdated,
        onDocumentDeleted,
        onRequestApproved,
        onRequestRejected,
    }
}
