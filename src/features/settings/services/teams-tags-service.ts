import { apiClient } from "@/lib/api-client"
import type {
    ApiResponse,
    Team, TeamStatisticsData, TeamsListData, TeamListAllData,
    CreateTeamPayload, UpdateTeamPayload, UpdateTeamMembersPayload,
    AssignCustomerPayload, AssignCustomerResponse,
    AssignCustomersBulkPayload, AssignCustomersBulkResponse,
    CustomersByTeamParams, CustomersByTeamData,
    CacheViewData, TeamMembersResponse,
    Tag, TagsListData, CreateTagPayload, UpdateTagPayload,
    Snippet, SnippetsListData, CreateSnippetPayload, UpdateSnippetPayload,
    Lifecycle, LifecyclesListData, CreateLifecyclePayload, UpdateLifecyclePayload,
    DeleteLifecycleParams, ChangeCustomerLifecyclePayload, ChangeCustomerLifecycleResponse,
    MediaUploadResponse,
    DynamicField, DynamicFieldsListData, CreateDynamicFieldPayload, UpdateDynamicFieldPayload,
} from "../types/teams-tags"




const h = (tid: string) => ({ "X-Tenant-ID": tid })

/* ═════════════════════════════════════
   TEAMS
═════════════════════════════════════ */

/** GET /teams/statistics — إحصائيات الفرق */
export const getTeamStatistics = (tid: string) =>
    apiClient.get<ApiResponse<TeamStatisticsData>>("/teams/statistics", { headers: h(tid) }).then(r => r.data)

/** GET /get_teams — قائمة مع Pagination */
export const getTeamsPaginated = (
    tid: string,
    page = 1,
    pageSize = 20,
    search?: string,
    sortBy = "created_at",
    order: "asc" | "desc" = "desc"
) =>
    apiClient.get<ApiResponse<TeamsListData>>("/get_teams", {
        headers: h(tid),
        params: {
            page,
            page_size: pageSize,
            sort_by: sortBy,
            order,
            ...(search ? { search } : {}),
        },
    }).then(r => r.data)

/** GET /teams — جميع الفرق */
export const getAllTeams = (tid: string) =>
    apiClient.get<ApiResponse<TeamListAllData>>("/teams", { headers: h(tid) }).then(r => r.data)

/** GET /teams/{team_id} — فريق محدد */
export const getTeamById = (teamId: string, tid: string) =>
    apiClient.get<ApiResponse<Team>>(`/teams/${teamId}`, { headers: h(tid) }).then(r => r.data)

/** POST /teams — إنشاء فريق */
export const createTeam = (payload: CreateTeamPayload, tid: string) =>
    apiClient.post<ApiResponse<Team>>("/teams", payload, { headers: h(tid) }).then(r => r.data)

/** PATCH /teams/{team_id} — تحديث بيانات فريق */
export const updateTeam = (teamId: string, payload: UpdateTeamPayload, tid: string) =>
    apiClient.patch<ApiResponse<Team>>(`/teams/${teamId}`, payload, { headers: h(tid) }).then(r => r.data)

/** PATCH /teams/{team_id}/members — تحديث أعضاء فريق */
export const updateTeamMembers = (teamId: string, payload: UpdateTeamMembersPayload, tid: string) =>
    apiClient.patch<ApiResponse<{ id: string; team_id: string; name: string; members: string[]; updated_at: string }>>(
        `/teams/${teamId}/members`, payload, { headers: h(tid) }
    ).then(r => r.data)

/** PATCH /teams/assign-customer — تعيين عميل لفرق */
export const assignCustomerToTeams = (payload: AssignCustomerPayload, tid: string) =>
    apiClient.patch<ApiResponse<AssignCustomerResponse>>("/teams/assign-customer", payload, { headers: h(tid) }).then(r => r.data)

/** PATCH /teams/assign-customers-bulk — تعيين عملاء متعددين */
export const assignCustomersBulk = (payload: AssignCustomersBulkPayload, tid: string) =>
    apiClient.patch<ApiResponse<AssignCustomersBulkResponse>>("/teams/assign-customers-bulk", payload, { headers: h(tid) }).then(r => r.data)

/** GET /customers-by-team — عملاء فريق محدد */
export const getCustomersByTeam = (params: CustomersByTeamParams, tid: string) =>
    apiClient.get<ApiResponse<CustomersByTeamData>>("/customers-by-team", {
        headers: h(tid),
        params: {
            team_name: params.team_name,
            ...(params.is_assigned_team !== undefined ? { is_assigned_team: params.is_assigned_team } : {}),
            ...(params.page !== undefined ? { page: params.page } : {}),
            ...(params.page_size !== undefined ? { page_size: params.page_size } : {}),
        },
    }).then(r => r.data)

/** DELETE /teams/{team_id} — حذف فريق */
export const deleteTeam = (teamId: string, tid: string) =>
    apiClient.delete<ApiResponse<{ success: boolean; team_id: string }>>(`/teams/${teamId}`, { headers: h(tid) }).then(r => r.data)

/** GET /teams/cache-view — قائمة مصغرة للـ dropdown */
export const getTeamsCacheView = (tid: string) =>
    apiClient.get<ApiResponse<CacheViewData>>("/teams/cache-view", { headers: h(tid) }).then(r => r.data)

/** GET /teams/{team_id}/members — أعضاء الفريق مع التفاصيل */
export const getTeamMembers = (teamId: string, tid: string) =>
    apiClient.get<ApiResponse<TeamMembersResponse>>(`/teams/${teamId}/members`, { headers: h(tid) }).then(r => r.data)

/** POST /teams/{team_id}/members/{user_id} — إضافة عضو واحد */
export const addTeamMember = (teamId: string, userId: string, tid: string) =>
    apiClient.post<ApiResponse<TeamMembersResponse>>(`/teams/${teamId}/members/${userId}`, {}, { headers: h(tid) }).then(r => r.data)

/** DELETE /teams/{team_id}/members/{user_id} — إزالة عضو واحد */
export const removeTeamMember = (teamId: string, userId: string, tid: string) =>
    apiClient.delete<ApiResponse<TeamMembersResponse>>(`/teams/${teamId}/members/${userId}`, { headers: h(tid) }).then(r => r.data)

/* ═════════════════════════════════════
   TAGS
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

/** DELETE /tags/{tag_id} — حذف تاج */
export const deleteTag = (tagId: string, tid: string) =>
    apiClient.delete<ApiResponse<{ success: boolean; tag_id: string }>>(`/tags/${tagId}`, { headers: h(tid) }).then(r => r.data)

/* ═════════════════════════════════════
   SNIPPETS
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
   MEDIA UPLOAD
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
        headers: { ...h(tid), "Content-Type": "multipart/form-data" },
    }).then(r => r.data)
}


/* ═════════════════════════════════════
   LIFECYCLES
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

/* ═════════════════════════════════════
   DYNAMIC FIELDS (Contact Fields)
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
