import { apiClient } from "@/lib/api-client"
import type {
    ApiResponse,
    Lifecycle, LifecyclesListData,
    CreateLifecyclePayload, UpdateLifecyclePayload,
    DeleteLifecycleParams, ChangeCustomerLifecyclePayload, ChangeCustomerLifecycleResponse,
} from "../types/lifecycles.types"

const h = (tid: string) => ({ "X-Tenant-ID": tid })

/* ═════════════════════════════════════
   LIFECYCLES — /lifecycles
═════════════════════════════════════ */

/** GET /lifecycles — جميع المراحل */
export const getAllLifecycles = (tid: string) =>
    apiClient.get<ApiResponse<LifecyclesListData>>("/lifecycles", { headers: h(tid) }).then(r => r.data)

/** POST /lifecycles — إضافة مرحلة */
export const createLifecycle = (payload: CreateLifecyclePayload, tid: string) =>
    apiClient.post<ApiResponse<Lifecycle>>("/lifecycles", payload, { headers: h(tid) }).then(r => r.data)

/** PATCH /lifecycles/{code} — تعديل مرحلة */
export const updateLifecycle = (code: string, payload: UpdateLifecyclePayload, tid: string) =>
    apiClient.patch<ApiResponse<Lifecycle>>(`/lifecycles/${code}`, payload, { headers: h(tid) }).then(r => r.data)

/** DELETE /lifecycles/{code} — reassign_to via query param */
export const deleteLifecycle = (code: string, params: DeleteLifecycleParams, tid: string) =>
    apiClient.delete<ApiResponse<{ success: boolean; deleted_lifecycle: string; customers_reassigned_to: string | null }>>(
        `/lifecycles/${code}`,
        {
            headers: h(tid),
            params: params.reassign_to ? { reassign_to: params.reassign_to } : {},
        }
    ).then(r => r.data)

/** GET /lifecycles/deleted — المراحل المعطّلة */
export const getDeletedLifecycles = (tid: string) =>
    apiClient.get<ApiResponse<LifecyclesListData>>("/lifecycles/deleted", { headers: h(tid) }).then(r => r.data)

/** PATCH /lifecycles/{code}/restore — استعادة مرحلة معطّلة */
export const restoreLifecycle = (code: string, tid: string) =>
    apiClient.patch<ApiResponse<Lifecycle>>(`/lifecycles/${code}/restore`, {}, { headers: h(tid) }).then(r => r.data)

/** PATCH /lifecycles/customers/{customer_id}/lifecycle — تغيير مرحلة عميل */
export const changeCustomerLifecycle = (
    customerId: string,
    payload: ChangeCustomerLifecyclePayload,
    tid: string
) =>
    apiClient.patch<ApiResponse<ChangeCustomerLifecycleResponse>>(
        `/lifecycles/customers/${customerId}/lifecycle`,
        payload,
        { headers: h(tid) }
    ).then(r => r.data)
