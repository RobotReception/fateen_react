import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { toast } from "sonner"
import { knowledgeKeys } from "./query-keys"
import {
    listCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    requestDeleteByCategory,
} from "../services/knowledge-service"
import type {
    PaginatedParams,
    CreateCategoryPayload,
    UpdateCategoryPayload,
    DeleteByCategoryPayload,
} from "../types"

/* ── Queries ────────────────────────────────────────────── */

/** Paginated category list for management */
export function useCategoriesList(tenantId: string, params: PaginatedParams) {
    return useQuery({
        queryKey: knowledgeKeys.categories.list(tenantId, params as Record<string, unknown>),
        queryFn: () => listCategories(params, tenantId),
        enabled: !!tenantId,
        placeholderData: keepPreviousData,
    })
}

/** Small list of categories for dropdowns/filters (cached 10 min) */
export function useCategoriesLookup(tenantId: string) {
    return useQuery({
        queryKey: knowledgeKeys.categories.lookup(tenantId),
        queryFn: () => listCategories({ page: 1, page_size: 100 }, tenantId),
        enabled: !!tenantId,
        staleTime: 10 * 60 * 1000,
    })
}

/* ── Mutations ──────────────────────────────────────────── */

export function useCreateCategory(tenantId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (payload: CreateCategoryPayload) => createCategory(payload, tenantId),
        onSuccess: (res) => {
            if (res.success) {
                toast.success("تم إنشاء الفئة بنجاح")
                qc.invalidateQueries({ queryKey: knowledgeKeys.categories.all(tenantId) })
            } else {
                toast.error(res.message || "فشل إنشاء الفئة")
            }
        },
        onError: () => toast.error("حدث خطأ أثناء الإنشاء"),
    })
}

export function useUpdateCategory(tenantId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ categoryId, payload }: { categoryId: string; payload: UpdateCategoryPayload }) =>
            updateCategory(categoryId, payload, tenantId),
        onSuccess: (res) => {
            if (res.success) {
                toast.success("تم تحديث الفئة بنجاح")
                qc.invalidateQueries({ queryKey: knowledgeKeys.categories.all(tenantId) })
            } else {
                toast.error(res.message || "فشل التحديث")
            }
        },
        onError: () => toast.error("حدث خطأ أثناء التحديث"),
    })
}

export function useDeleteCategory(tenantId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (categoryId: string) => deleteCategory(categoryId, tenantId),
        onSuccess: (res) => {
            if (res.success) {
                toast.success("تم حذف الفئة بنجاح")
                qc.invalidateQueries({ queryKey: knowledgeKeys.categories.all(tenantId) })
            } else {
                toast.error(res.message || "فشل الحذف")
            }
        },
        onError: () => toast.error("حدث خطأ أثناء الحذف"),
    })
}

/** Delete all documents in a specific category */
export function useDeleteCategoryData(tenantId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (payload: DeleteByCategoryPayload) => requestDeleteByCategory(payload, tenantId),
        onSuccess: (res) => {
            if (res.success) {
                toast.success("تم حذف بيانات الفئة بنجاح")
                qc.invalidateQueries({ queryKey: knowledgeKeys.categories.all(tenantId) })
                qc.invalidateQueries({ queryKey: knowledgeKeys.documents.all(tenantId) })
            } else {
                toast.error(res.message || "فشل حذف البيانات")
            }
        },
        onError: () => toast.error("حدث خطأ أثناء حذف البيانات"),
    })
}
