import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
    getAllTeams, getTeamsPaginated, getTeamById,
    getTeamStatistics, createTeam, updateTeam, updateTeamMembers, deleteTeam,
    assignCustomerToTeams, assignCustomersBulk, getCustomersByTeam,
    getAllTags, getTagById, createTag, updateTag, deleteTag,
    getAllSnippets, createSnippet, updateSnippet, deleteSnippet,
    getAllLifecycles, createLifecycle, updateLifecycle, deleteLifecycle, changeCustomerLifecycle,
} from "../services/teams-tags-service"
import type {
    CreateTeamPayload, UpdateTeamPayload, UpdateTeamMembersPayload,
    AssignCustomerPayload, AssignCustomersBulkPayload, CustomersByTeamParams,
    CreateTagPayload, UpdateTagPayload,
    CreateSnippetPayload, UpdateSnippetPayload,
    CreateLifecyclePayload, UpdateLifecyclePayload,
    DeleteLifecycleParams, ChangeCustomerLifecyclePayload,
} from "../types/teams-tags"



/* ── Query Keys ── */
const keys = {
    teams: (tid: string) => ["teams", tid] as const,
    teamsPaginated: (tid: string, page: number, size: number, search?: string) =>
        ["teams-paginated", tid, page, size, search] as const,
    teamById: (tid: string, teamId: string) => ["team", tid, teamId] as const,
    teamStats: (tid: string) => ["teams-stats", tid] as const,
    customersByTeam: (tid: string, teamName: string) => ["customers-by-team", tid, teamName] as const,
    tags: (tid: string) => ["tags", tid] as const,
    snippets: (tid: string, topic?: string) => ["snippets", tid, topic] as const,
    lifecycles: (tid: string) => ["lifecycles", tid] as const,
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
                toast.success("تم حذف الفريق")
                qc.invalidateQueries({ queryKey: keys.teams(tid) })
                qc.invalidateQueries({ queryKey: ["teams-paginated", tid] })
                qc.invalidateQueries({ queryKey: keys.teamStats(tid) })
            } else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء حذف الفريق"),
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

/* ════════════════════════════════════════════
   TAGS
════════════════════════════════════════════ */
/** جميع التاجات (GET /tags) */
export function useTags(tid: string, page = 1, pageSize = 100) {
    return useQuery({
        queryKey: keys.tags(tid),
        queryFn: () => getAllTags(tid, page, pageSize),
        enabled: !!tid,
        select: r => r.data?.items ?? [],
    })
}

/** تاج محدد (GET /tags/{tag_id}) */
export function useTagById(tid: string, tagId: string) {
    return useQuery({
        queryKey: [...keys.tags(tid), tagId],
        queryFn: () => getTagById(tagId, tid),
        enabled: !!tid && !!tagId,
        select: r => r.data,
    })
}



export function useCreateTag(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (p: CreateTagPayload) => createTag(p, tid),
        onSuccess: r => {
            if (r.success) { toast.success("تم إنشاء التاج"); qc.invalidateQueries({ queryKey: keys.tags(tid) }) }
            else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء إنشاء التاج"),
    })
}

export function useUpdateTag(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ tagId, payload }: { tagId: string; payload: UpdateTagPayload }) =>
            updateTag(tagId, payload, tid),
        onSuccess: r => {
            if (r.success) { toast.success("تم تحديث التاج"); qc.invalidateQueries({ queryKey: keys.tags(tid) }) }
            else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء تحديث التاج"),
    })
}

export function useDeleteTag(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (tagId: string) => deleteTag(tagId, tid),
        onSuccess: r => {
            if (r.success) { toast.success("تم حذف التاج"); qc.invalidateQueries({ queryKey: keys.tags(tid) }) }
            else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء حذف التاج"),
    })
}

/* ════════════════════════════════════════════
   SNIPPETS
════════════════════════════════════════════ */
export function useSnippets(tid: string, topic?: string) {
    return useQuery({
        queryKey: keys.snippets(tid, topic),
        queryFn: () => getAllSnippets(tid, topic),
        enabled: !!tid,
        select: r => r.data?.items ?? [],
    })
}


export function useCreateSnippet(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (p: CreateSnippetPayload) => createSnippet(p, tid),
        onSuccess: r => {
            if (r.success) { toast.success("تم إنشاء الـ Snippet"); qc.invalidateQueries({ queryKey: keys.snippets(tid) }) }
            else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء إنشاء الـ Snippet"),
    })
}

export function useUpdateSnippet(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ fieldId, payload }: { fieldId: string; payload: UpdateSnippetPayload }) =>
            updateSnippet(fieldId, payload, tid),
        onSuccess: r => {
            if (r.success) { toast.success("تم تحديث الـ Snippet"); qc.invalidateQueries({ queryKey: keys.snippets(tid) }) }
            else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء تحديث الـ Snippet"),
    })
}

export function useDeleteSnippet(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (fieldId: string) => deleteSnippet(fieldId, tid),
        onSuccess: r => {
            if (r.success) { toast.success("تم حذف الـ Snippet"); qc.invalidateQueries({ queryKey: keys.snippets(tid) }) }
            else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء حذف الـ Snippet"),
    })
}

/* ════════════════════════════════════════════
   LIFECYCLES
════════════════════════════════════════════ */
export function useLifecycles(tid: string) {
    return useQuery({
        queryKey: keys.lifecycles(tid),
        queryFn: () => getAllLifecycles(tid),
        enabled: !!tid,
        select: r => r.data?.items ?? [],
    })
}

export function useCreateLifecycle(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (p: CreateLifecyclePayload) => createLifecycle(p, tid),
        onSuccess: r => {
            if (r.success) { toast.success("تم إنشاء دورة الحياة"); qc.invalidateQueries({ queryKey: keys.lifecycles(tid) }) }
            else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء إنشاء دورة الحياة"),
    })
}

export function useUpdateLifecycle(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ code, payload }: { code: string; payload: UpdateLifecyclePayload }) =>
            updateLifecycle(code, payload, tid),
        onSuccess: r => {
            if (r.success) { toast.success("تم تحديث دورة الحياة"); qc.invalidateQueries({ queryKey: keys.lifecycles(tid) }) }
            else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء تحديث دورة الحياة"),
    })
}

export function useDeleteLifecycle(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ code, params }: { code: string; params: DeleteLifecycleParams }) =>
            deleteLifecycle(code, params, tid),
        onSuccess: r => {
            if (r.success) { toast.success("تم حذف دورة الحياة"); qc.invalidateQueries({ queryKey: keys.lifecycles(tid) }) }
            else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء حذف دورة الحياة"),
    })
}

/** PATCH /lifecycles/customers/{customer_id}/lifecycle */
export function useChangeCustomerLifecycle(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ customerId, payload }: { customerId: string; payload: ChangeCustomerLifecyclePayload }) =>
            changeCustomerLifecycle(customerId, payload, tid),
        onSuccess: r => {
            if (r.success) { toast.success("تم تغيير مرحلة العميل"); qc.invalidateQueries({ queryKey: keys.lifecycles(tid) }) }
            else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء تغيير مرحلة العميل"),
    })
}
