import { apiClient } from "@/lib/api-client"
import type {
    ApiResponse,
    Team, TeamStatisticsData, TeamsListData, TeamListAllData,
    CreateTeamPayload, UpdateTeamPayload, UpdateTeamMembersPayload,
    AssignCustomerPayload, AssignCustomerResponse,
    AssignCustomersBulkPayload, AssignCustomersBulkResponse,
    CustomersByTeamParams, CustomersByTeamData,
    CacheViewData, TeamMembersResponse,
} from "../types/teams-tags"

const h = (tid: string) => ({ "X-Tenant-ID": tid })

/* ═════════════════════════════════════
   TEAMS — /teams
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

/** DELETE /teams/{team_id} — تعطيل فريق (soft delete) */
export const deleteTeam = (teamId: string, tid: string) =>
    apiClient.delete<ApiResponse<{ success: boolean; team_id: string; deactivated_at: string }>>(`/teams/${teamId}`, { headers: h(tid) }).then(r => r.data)

/** GET /teams/deleted — الفرق المحذوفة (المعطّلة) */
export const getDeletedTeams = (tid: string, page = 1, pageSize = 20) =>
    apiClient.get<ApiResponse<TeamsListData>>("/teams/deleted", {
        headers: h(tid),
        params: { page, page_size: pageSize },
    }).then(r => r.data)

/** PATCH /teams/{team_id}/restore — استعادة فريق معطّل */
export const restoreTeam = (teamId: string, tid: string) =>
    apiClient.patch<ApiResponse<Team>>(`/teams/${teamId}/restore`, {}, { headers: h(tid) }).then(r => r.data)

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
   BACKWARD-COMPATIBLE RE-EXPORTS
   (so existing imports from this file don't break)
═════════════════════════════════════ */
export { getAllTags, getTagById, createTag, updateTag, deleteTag, getDeletedTags, restoreTag } from "./tags-service"
export { getAllSnippets, getSnippetById, createSnippet, updateSnippet, deleteSnippet, uploadMedia } from "./snippets-service"
export { getAllLifecycles, createLifecycle, updateLifecycle, deleteLifecycle, getDeletedLifecycles, restoreLifecycle, changeCustomerLifecycle } from "./lifecycles-service"
export { getAllDynamicFields, getDynamicFieldByName, createDynamicField, updateDynamicField, deleteDynamicField } from "./contact-fields-service"
