import { apiClient } from "@/lib/api-client"
import type {
    ApiResponse,
    Tag, TagsListData, CreateTagPayload, UpdateTagPayload,
} from "../types/tags.types"

const h = (tid: string) => ({ "X-Tenant-ID": tid })

/* ═════════════════════════════════════
   TAGS — /tags
═════════════════════════════════════ */

/** GET /tags — قائمة التاجات مع Pagination */
export const getAllTags = (tid: string, page = 1, pageSize = 20) =>
    apiClient.get<ApiResponse<TagsListData>>("/tags", {
        headers: h(tid),
        params: { page, pageSize },
    }).then(r => r.data)

/** GET /tags/{tag_id} — تاج محدد */
export const getTagById = (tagId: string, tid: string) =>
    apiClient.get<ApiResponse<Tag>>(`/tags/${tagId}`, { headers: h(tid) }).then(r => r.data)

/** POST /tags — إنشاء تاج */
export const createTag = (payload: CreateTagPayload, tid: string) =>
    apiClient.post<ApiResponse<Tag>>("/tags", payload, { headers: h(tid) }).then(r => r.data)

/** PATCH /tags/{tag_id} — تحديث تاج */
export const updateTag = (tagId: string, payload: UpdateTagPayload, tid: string) =>
    apiClient.patch<ApiResponse<Tag>>(`/tags/${tagId}`, payload, { headers: h(tid) }).then(r => r.data)

/** DELETE /tags/{tag_id} — تعطيل تاج (soft delete) */
export const deleteTag = (tagId: string, tid: string) =>
    apiClient.delete<ApiResponse<{ success: boolean; tag_id: string }>>(`/tags/${tagId}`, { headers: h(tid) }).then(r => r.data)

/** GET /tags/deleted — التاجات المعطّلة */
export const getDeletedTags = (tid: string, page = 1, pageSize = 20) =>
    apiClient.get<ApiResponse<TagsListData>>("/tags/deleted", {
        headers: h(tid),
        params: { page, pageSize },
    }).then(r => r.data)

/** PATCH /tags/{tag_id}/restore — استعادة تاج معطّل */
export const restoreTag = (tagId: string, tid: string) =>
    apiClient.patch<ApiResponse<Tag>>(`/tags/${tagId}/restore`, {}, { headers: h(tid) }).then(r => r.data)
