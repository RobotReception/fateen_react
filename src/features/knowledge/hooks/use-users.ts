import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { toast } from "sonner"
import { knowledgeKeys } from "./query-keys"
import {
    getUserFilesData,
    deleteDocsByUsername,
    deleteDocsByFilename,
    requestDeleteCollectionAdmin,
} from "../services/knowledge-service"
import type {
    UserFilesParams,
    DeleteDocsByUsernamePayload,
    DeleteDocsByFilenamePayload,
} from "../types"

/* ── Queries ────────────────────────────────────────────── */

/** Paginated user files list */
export function useUserFilesList(tenantId: string, params: UserFilesParams) {
    return useQuery({
        queryKey: knowledgeKeys.users.list(tenantId, params as Record<string, unknown>),
        queryFn: () => getUserFilesData(params, tenantId),
        enabled: !!tenantId,
        placeholderData: keepPreviousData,
    })
}

/* ── Mutations ──────────────────────────────────────────── */

export function useDeleteUserData(tenantId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (payload: DeleteDocsByUsernamePayload) => deleteDocsByUsername(payload, tenantId),
        onSuccess: (res, payload) => {
            if (res.success) {
                toast.success(`تم حذف جميع بيانات ${payload.username}`)
                qc.invalidateQueries({ queryKey: knowledgeKeys.users.all(tenantId) })
            } else {
                toast.error(res.message || "فشل الحذف")
            }
        },
        onError: () => toast.error("حدث خطأ أثناء الحذف"),
    })
}

export function useDeleteUserFile(tenantId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (payload: DeleteDocsByFilenamePayload) => deleteDocsByFilename(payload, tenantId),
        onSuccess: (res, payload) => {
            if (res.success) {
                toast.success(`تم حذف الملف: ${payload.filename}`)
                qc.invalidateQueries({ queryKey: knowledgeKeys.users.all(tenantId) })
            } else {
                toast.error(res.message || "فشل حذف الملف")
            }
        },
        onError: () => toast.error("حدث خطأ أثناء حذف الملف"),
    })
}

export function useDeleteCollection(tenantId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: () => requestDeleteCollectionAdmin(tenantId),
        onSuccess: (res) => {
            if (res.success) {
                toast.success("تم حذف جميع البيانات بنجاح")
                qc.invalidateQueries({ queryKey: knowledgeKeys.users.all(tenantId) })
            } else {
                toast.error(res.message || "فشل حذف البيانات")
            }
        },
        onError: () => toast.error("حدث خطأ أثناء الحذف"),
    })
}
