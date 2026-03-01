import { apiClient } from "@/lib/api-client"
import type {
    ApiResponse,
    DynamicField, DynamicFieldsListData,
    CreateDynamicFieldPayload, UpdateDynamicFieldPayload,
} from "../types/contact-fields.types"

const h = (tid: string) => ({ "X-Tenant-ID": tid })

/* ═════════════════════════════════════
   DYNAMIC FIELDS (Contact Fields) — /contacts/dynamic-fields
═════════════════════════════════════ */

/** GET /contacts/dynamic-fields — جميع الحقول الديناميكية */
export const getAllDynamicFields = (tid: string) =>
    apiClient.get<ApiResponse<DynamicFieldsListData>>("/contacts/dynamic-fields", { headers: h(tid) }).then(r => r.data)

/** GET /contacts/dynamic-fields/{field_name} — حقل واحد */
export const getDynamicFieldByName = (fieldName: string, tid: string) =>
    apiClient.get<ApiResponse<DynamicField>>(`/contacts/dynamic-fields/${fieldName}`, { headers: h(tid) }).then(r => r.data)

/** POST /contacts/dynamic-fields — إنشاء حقل ديناميكي */
export const createDynamicField = (payload: CreateDynamicFieldPayload, tid: string) =>
    apiClient.post<ApiResponse<DynamicField>>("/contacts/dynamic-fields", payload, { headers: h(tid) }).then(r => r.data)

/** PUT /contacts/dynamic-fields/{field_name} — تحديث حقل ديناميكي */
export const updateDynamicField = (fieldName: string, payload: UpdateDynamicFieldPayload, tid: string) =>
    apiClient.put<ApiResponse<DynamicField>>(`/contacts/dynamic-fields/${fieldName}`, payload, { headers: h(tid) }).then(r => r.data)

/** DELETE /contacts/dynamic-fields/{field_name} — حذف حقل ديناميكي */
export const deleteDynamicField = (fieldName: string, tid: string) =>
    apiClient.delete<ApiResponse<{ message: string; field_name: string; deleted: boolean }>>(`/contacts/dynamic-fields/${fieldName}`, { headers: h(tid) }).then(r => r.data)
