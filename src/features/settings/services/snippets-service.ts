import { apiClient } from "@/lib/api-client"
import type {
    ApiResponse,
    Snippet, SnippetsListData, CreateSnippetPayload, UpdateSnippetPayload,
    MediaUploadResponse,
} from "../types/snippets.types"

const h = (tid: string) => ({ "X-Tenant-ID": tid })

/* ═════════════════════════════════════
   SNIPPETS — /snippets
═════════════════════════════════════ */

/** GET /snippets — قائمة مع فلترة حسب topic */
export const getAllSnippets = (tid: string, topic?: string) =>
    apiClient.get<ApiResponse<SnippetsListData>>("/snippets", {
        headers: h(tid),
        params: topic ? { topic } : {},
    }).then(r => r.data)

/** GET /snippets/{field_id} — snippet محدد */
export const getSnippetById = (fieldId: string, tid: string) =>
    apiClient.get<ApiResponse<Snippet>>(`/snippets/${fieldId}`, { headers: h(tid) }).then(r => r.data)

/** POST /snippets — إنشاء snippet */
export const createSnippet = (payload: CreateSnippetPayload, tid: string) =>
    apiClient.post<ApiResponse<Snippet>>("/snippets", payload, { headers: h(tid) }).then(r => r.data)

/** PATCH /snippets/{field_id} — تحديث snippet */
export const updateSnippet = (fieldId: string, payload: UpdateSnippetPayload, tid: string) =>
    apiClient.patch<ApiResponse<Snippet>>(`/snippets/${fieldId}`, payload, { headers: h(tid) }).then(r => r.data)

/** DELETE /snippets/{field_id} — حذف snippet */
export const deleteSnippet = (fieldId: string, tid: string) =>
    apiClient.delete<ApiResponse<{ success: boolean; field_id: string }>>(`/snippets/${fieldId}`, { headers: h(tid) }).then(r => r.data)

/* ═════════════════════════════════════
   MEDIA UPLOAD — /media/upload
═════════════════════════════════════ */

/** POST /media/upload — رفع ملف وإرجاع الرابط */
export const uploadMedia = (
    file: File,
    tid: string,
    options?: { platform?: string; context?: string; tags?: string }
) => {
    const form = new FormData()
    form.append("file", file)
    if (options?.platform) form.append("platform", options.platform)
    if (options?.context) form.append("context", options.context)
    if (options?.tags) form.append("tags", options.tags)
    return apiClient.post<ApiResponse<MediaUploadResponse>>("/media/upload", form, {
        headers: h(tid),
        timeout: 120000, // 2 minutes for large video uploads
    }).then(r => r.data)
}
