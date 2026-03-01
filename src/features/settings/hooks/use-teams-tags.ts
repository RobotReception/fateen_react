import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
    getAllTeams, getTeamsPaginated, getTeamById,
    getTeamStatistics, createTeam, updateTeam, updateTeamMembers, deleteTeam,
    assignCustomerToTeams, assignCustomersBulk, getCustomersByTeam,
    getTeamsCacheView, getTeamMembers, addTeamMember, removeTeamMember,
    getDeletedTeams, restoreTeam,
} from "../services/teams-tags-service"
import type {
    CreateTeamPayload, UpdateTeamPayload, UpdateTeamMembersPayload,
    AssignCustomerPayload, AssignCustomersBulkPayload, CustomersByTeamParams,
} from "../types/teams-tags"



/* ── Query Keys ── */
const keys = {
    teams: (tid: string) => ["teams", tid] as const,
    teamsPaginated: (tid: string, page: number, size: number, search?: string) =>
        ["teams-paginated", tid, page, size, search] as const,
    teamById: (tid: string, teamId: string) => ["team", tid, teamId] as const,
    teamStats: (tid: string) => ["teams-stats", tid] as const,
    teamsCacheView: (tid: string) => ["teams-cache-view", tid] as const,
    teamMembers: (tid: string, teamId: string) => ["team-members", tid, teamId] as const,
    deletedTeams: (tid: string, page: number, size: number) => ["deleted-teams", tid, page, size] as const,
    customersByTeam: (tid: string, teamName: string) => ["customers-by-team", tid, teamName] as const,
}

/* ════════════════════════════════════════════
   TEAMS
════════════════════════════════════════════ */

/** جميع الفرق (GET /teams) */
export function useTeams(tid: string) {
    return useQuery({
        queryKey: keys.teams(tid),
        queryFn: () => getAllTeams(tid),
        enabled: !!tid,
        select: r => r.data?.items ?? [],
    })
}

/** الفرق مع Pagination (GET /get_teams) */
export function useTeamsPaginated(
    tid: string,
    page = 1,
    pageSize = 20,
    search?: string
) {
    return useQuery({
        queryKey: keys.teamsPaginated(tid, page, pageSize, search),
        queryFn: () => getTeamsPaginated(tid, page, pageSize, search),
        enabled: !!tid,
        select: r => r.data,
    })
}

/** فريق محدد (GET /teams/{team_id}) */
export function useTeamById(tid: string, teamId: string) {
    return useQuery({
        queryKey: keys.teamById(tid, teamId),
        queryFn: () => getTeamById(teamId, tid),
        enabled: !!tid && !!teamId,
        select: r => r.data,
    })
}

/** إحصائيات الفرق (GET /teams/statistics) */
export function useTeamStats(tid: string) {
    return useQuery({
        queryKey: keys.teamStats(tid),
        queryFn: () => getTeamStatistics(tid),
        enabled: !!tid,
        select: r => r.data,
    })
}

export function useCreateTeam(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (p: CreateTeamPayload) => createTeam(p, tid),
        onSuccess: r => {
            if (r.success) {
                toast.success("تم إنشاء الفريق")
                qc.invalidateQueries({ queryKey: keys.teams(tid) })
                qc.invalidateQueries({ queryKey: ["teams-paginated", tid] })
                qc.invalidateQueries({ queryKey: keys.teamStats(tid) })
            } else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء إنشاء الفريق"),
    })
}

export function useUpdateTeam(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ teamId, payload }: { teamId: string; payload: UpdateTeamPayload }) =>
            updateTeam(teamId, payload, tid),
        onSuccess: r => {
            if (r.success) {
                toast.success("تم تحديث الفريق")
                qc.invalidateQueries({ queryKey: keys.teams(tid) })
                qc.invalidateQueries({ queryKey: ["teams-paginated", tid] })
            } else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء تحديث الفريق"),
    })
}

export function useUpdateTeamMembers(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ teamId, payload }: { teamId: string; payload: UpdateTeamMembersPayload }) =>
            updateTeamMembers(teamId, payload, tid),
        onSuccess: r => {
            if (r.success) {
                toast.success("تم تحديث أعضاء الفريق")
                qc.invalidateQueries({ queryKey: keys.teams(tid) })
            } else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء تحديث الأعضاء"),
    })
}

export function useDeleteTeam(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (teamId: string) => deleteTeam(teamId, tid),
        onSuccess: r => {
            if (r.success) {
                toast.success("تم تعطيل الفريق")
                qc.invalidateQueries({ queryKey: keys.teams(tid) })
                qc.invalidateQueries({ queryKey: ["teams-paginated", tid] })
                qc.invalidateQueries({ queryKey: keys.teamStats(tid) })
                qc.invalidateQueries({ queryKey: ["deleted-teams", tid] })
            } else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء تعطيل الفريق"),
    })
}

/** الفرق المحذوفة (GET /teams/deleted) */
export function useDeletedTeams(tid: string, page = 1, pageSize = 20) {
    return useQuery({
        queryKey: keys.deletedTeams(tid, page, pageSize),
        queryFn: () => getDeletedTeams(tid, page, pageSize),
        enabled: !!tid,
        select: r => r.data,
    })
}

/** استعادة فريق معطّل (PATCH /teams/{team_id}/restore) */
export function useRestoreTeam(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (teamId: string) => restoreTeam(teamId, tid),
        onSuccess: r => {
            if (r.success) {
                toast.success("تم استعادة الفريق")
                qc.invalidateQueries({ queryKey: keys.teams(tid) })
                qc.invalidateQueries({ queryKey: ["teams-paginated", tid] })
                qc.invalidateQueries({ queryKey: keys.teamStats(tid) })
                qc.invalidateQueries({ queryKey: ["deleted-teams", tid] })
            } else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء استعادة الفريق"),
    })
}

/** PATCH /teams/assign-customer */
export function useAssignCustomerToTeams(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (p: AssignCustomerPayload) => assignCustomerToTeams(p, tid),
        onSuccess: r => {
            if (r.success) {
                toast.success("تم تعيين العميل للفريق")
                qc.invalidateQueries({ queryKey: ["customers-by-team", tid] })
            } else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء تعيين العميل"),
    })
}

/** PATCH /teams/assign-customers-bulk */
export function useAssignCustomersBulk(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (p: AssignCustomersBulkPayload) => assignCustomersBulk(p, tid),
        onSuccess: r => {
            if (r.success) {
                toast.success(`تم تعيين ${r.data?.updated_count ?? 0} عميل`)
                qc.invalidateQueries({ queryKey: ["customers-by-team", tid] })
            } else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء التعيين الجماعي"),
    })
}

/** GET /customers-by-team */
export function useCustomersByTeam(tid: string, params: CustomersByTeamParams) {
    return useQuery({
        queryKey: keys.customersByTeam(tid, params.team_name),
        queryFn: () => getCustomersByTeam(params, tid),
        enabled: !!tid && !!params.team_name,
        select: r => r.data,
    })
}

/** قائمة مصغرة للـ dropdown (GET /teams/cache-view) */
export function useTeamsCacheView(tid: string) {
    return useQuery({
        queryKey: keys.teamsCacheView(tid),
        queryFn: () => getTeamsCacheView(tid),
        enabled: !!tid,
        select: r => r.data,
    })
}

/** أعضاء فريق مع التفاصيل (GET /teams/{team_id}/members) */
export function useTeamMembers(tid: string, teamId: string) {
    return useQuery({
        queryKey: keys.teamMembers(tid, teamId),
        queryFn: () => getTeamMembers(teamId, tid),
        enabled: !!tid && !!teamId,
        select: r => r.data,
    })
}

/** إضافة عضو واحد (POST /teams/{team_id}/members/{user_id}) */
export function useAddTeamMember(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
            addTeamMember(teamId, userId, tid),
        onSuccess: () => {
            toast.success("تم إضافة العضو")
            qc.invalidateQueries({ queryKey: ["team-members", tid] })
            qc.invalidateQueries({ queryKey: keys.teams(tid) })
            qc.invalidateQueries({ queryKey: keys.teamsCacheView(tid) })
        },
        onError: (e: any) => {
            const status = e?.response?.status
            if (status === 409) toast.error("العضو مُضاف مسبقاً")
            else if (status === 404) toast.error("الفريق أو المستخدم غير موجود")
            else toast.error("حدث خطأ أثناء إضافة العضو")
        },
    })
}

/** إزالة عضو واحد (DELETE /teams/{team_id}/members/{user_id}) */
export function useRemoveTeamMember(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
            removeTeamMember(teamId, userId, tid),
        onSuccess: () => {
            toast.success("تم إزالة العضو")
            qc.invalidateQueries({ queryKey: ["team-members", tid] })
            qc.invalidateQueries({ queryKey: keys.teams(tid) })
            qc.invalidateQueries({ queryKey: keys.teamsCacheView(tid) })
        },
        onError: (e: any) => {
            const status = e?.response?.status
            if (status === 404) toast.error("العضو غير موجود في الفريق")
            else toast.error("حدث خطأ أثناء إزالة العضو")
        },
    })
}

/* ═════════════════════════════════════
   BACKWARD-COMPATIBLE RE-EXPORTS
   (so existing imports from this file don't break)
═════════════════════════════════════ */
export { useTags, useTagById, useCreateTag, useUpdateTag, useDeleteTag, useDeletedTags, useRestoreTag } from "./use-tags"
export { useSnippets, useCreateSnippet, useUpdateSnippet, useDeleteSnippet } from "./use-snippets"
export { useLifecycles, useCreateLifecycle, useUpdateLifecycle, useDeleteLifecycle, useDeletedLifecycles, useRestoreLifecycle, useChangeCustomerLifecycle } from "./use-lifecycles"
export { useDynamicFields, useCreateDynamicField, useUpdateDynamicField, useDeleteDynamicField } from "./use-contact-fields"
