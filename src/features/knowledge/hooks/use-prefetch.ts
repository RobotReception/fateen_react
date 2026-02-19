import { useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import { knowledgeKeys } from "./query-keys"
import { listDepartments, listCategories, searchDocuments, getUserFilesData } from "../services/knowledge-service"

/**
 * Returns prefetch handlers for paginated "Next page" buttons.
 * Call the returned function onMouseEnter to warm the cache before the user clicks.
 */

export function usePrefetchDepartments(tenantId: string) {
    const qc = useQueryClient()
    return useCallback((nextPage: number, pageSize: number, search = "") => {
        const params = { page: nextPage, page_size: pageSize, search }
        qc.prefetchQuery({
            queryKey: knowledgeKeys.departments.list(tenantId, params as Record<string, unknown>),
            queryFn: () => listDepartments(params, tenantId),
            staleTime: 5 * 60 * 1000,
        })
    }, [qc, tenantId])
}

export function usePrefetchCategories(tenantId: string) {
    const qc = useQueryClient()
    return useCallback((nextPage: number, pageSize: number, search = "") => {
        const params = { page: nextPage, page_size: pageSize, search }
        qc.prefetchQuery({
            queryKey: knowledgeKeys.categories.list(tenantId, params as Record<string, unknown>),
            queryFn: () => listCategories(params, tenantId),
            staleTime: 5 * 60 * 1000,
        })
    }, [qc, tenantId])
}

export function usePrefetchDocuments(tenantId: string) {
    const qc = useQueryClient()
    return useCallback((params: Record<string, unknown>) => {
        qc.prefetchQuery({
            queryKey: knowledgeKeys.documents.search(tenantId, params),
            queryFn: () => searchDocuments(params as Parameters<typeof searchDocuments>[0], tenantId),
            staleTime: 3 * 60 * 1000,
        })
    }, [qc, tenantId])
}

export function usePrefetchUsers(tenantId: string) {
    const qc = useQueryClient()
    return useCallback((params: Record<string, unknown>) => {
        qc.prefetchQuery({
            queryKey: knowledgeKeys.users.list(tenantId, params),
            queryFn: () => getUserFilesData(params as Parameters<typeof getUserFilesData>[0], tenantId),
            staleTime: 5 * 60 * 1000,
        })
    }, [qc, tenantId])
}
