import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { toast } from "sonner"
import { knowledgeKeys } from "./query-keys"
import {
    getDepartmentsLookup,
    listDepartments,
    getDepartmentCategories,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    requestDeleteByDepartment,
    linkCategoryToDepartment,
    unlinkCategoryFromDepartment,
} from "../services/knowledge-service"
import type {
    PaginatedParams,
    CreateDepartmentPayload,
    UpdateDepartmentPayload,
    LinkCategoryPayload,
    DeleteByDepartmentPayload,
} from "../types"

/* ── Queries ────────────────────────────────────────────── */

/** Lightweight department list for dropdowns/filters (cached 10 min) */
export function useDepartmentsLookup(tenantId: string) {
    return useQuery({
        queryKey: knowledgeKeys.departments.lookup(tenantId),
        queryFn: () => getDepartmentsLookup(tenantId),
        enabled: !!tenantId,
        staleTime: 10 * 60 * 1000,
    })
}

/** Paginated department list for management */
export function useDepartmentsList(tenantId: string, params: PaginatedParams) {
    return useQuery({
        queryKey: knowledgeKeys.departments.list(tenantId, params as Record<string, unknown>),
        queryFn: () => listDepartments(params, tenantId),
        enabled: !!tenantId,
        placeholderData: keepPreviousData,
    })
}

/** Categories linked to a specific department (cached 5 min) */
export function useDepartmentCategories(tenantId: string, departmentId: string | null) {
    return useQuery({
        queryKey: knowledgeKeys.departments.categories(tenantId, departmentId ?? ""),
        queryFn: () => getDepartmentCategories(departmentId!, tenantId),
        enabled: !!tenantId && !!departmentId,
        staleTime: 5 * 60 * 1000,
    })
}

/* ── Mutations ──────────────────────────────────────────── */

export function useCreateDepartment(tenantId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (payload: CreateDepartmentPayload) => createDepartment(payload, tenantId),
        onSuccess: (res) => {
            if (res.success) {
                toast.success("تم إنشاء القسم بنجاح")
                qc.invalidateQueries({ queryKey: knowledgeKeys.departments.all(tenantId) })
            } else {
                toast.error(res.message || "فشل إنشاء القسم")
            }
        },
        onError: () => toast.error("حدث خطأ أثناء الإنشاء"),
    })
}

export function useUpdateDepartment(tenantId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ departmentId, payload }: { departmentId: string; payload: UpdateDepartmentPayload }) =>
            updateDepartment(departmentId, payload, tenantId),
        onSuccess: (res) => {
            if (res.success) {
                toast.success("تم تحديث القسم بنجاح")
                qc.invalidateQueries({ queryKey: knowledgeKeys.departments.all(tenantId) })
            } else {
                toast.error(res.message || "فشل التحديث")
            }
        },
        onError: () => toast.error("حدث خطأ أثناء التحديث"),
    })
}

export function useDeleteDepartment(tenantId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (departmentId: string) => deleteDepartment(departmentId, tenantId),
        onSuccess: (res) => {
            if (res.success) {
                toast.success("تم حذف القسم بنجاح")
                qc.invalidateQueries({ queryKey: knowledgeKeys.departments.all(tenantId) })
            } else {
                toast.error(res.message || "فشل الحذف")
            }
        },
        onError: () => toast.error("حدث خطأ أثناء الحذف"),
    })
}

export function useDeleteDepartmentData(tenantId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (payload: DeleteByDepartmentPayload) => requestDeleteByDepartment(payload, tenantId),
        onSuccess: (res) => {
            if (res.success) {
                toast.success("تم إرسال طلب حذف بيانات القسم")
                qc.invalidateQueries({ queryKey: knowledgeKeys.departments.all(tenantId) })
                qc.invalidateQueries({ queryKey: knowledgeKeys.documents.all(tenantId) })
            } else {
                toast.error(res.message || "فشل حذف البيانات")
            }
        },
        onError: () => toast.error("حدث خطأ أثناء حذف البيانات"),
    })
}

export function useLinkCategory(tenantId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ departmentId, payload }: { departmentId: string; payload: LinkCategoryPayload }) =>
            linkCategoryToDepartment(departmentId, payload, tenantId),
        onSuccess: (res, { departmentId }) => {
            if (res.success) {
                toast.success("تم ربط الفئة بالقسم")
                qc.invalidateQueries({ queryKey: knowledgeKeys.departments.categories(tenantId, departmentId) })
            } else {
                toast.error(res.message || "فشل ربط الفئة")
            }
        },
        onError: () => toast.error("حدث خطأ أثناء ربط الفئة"),
    })
}

export function useUnlinkCategory(tenantId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ departmentId, categoryId }: { departmentId: string; categoryId: string }) =>
            unlinkCategoryFromDepartment(departmentId, categoryId, tenantId),
        onSuccess: (res, { departmentId }) => {
            if (res.success) {
                toast.success("تم إلغاء ربط الفئة")
                qc.invalidateQueries({ queryKey: knowledgeKeys.departments.categories(tenantId, departmentId) })
            } else {
                toast.error(res.message || "فشل إلغاء الربط")
            }
        },
        onError: () => toast.error("حدث خطأ أثناء إلغاء الربط"),
    })
}
