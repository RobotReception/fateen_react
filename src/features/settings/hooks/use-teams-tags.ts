import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
    getAllTeams, getTeamsPaginated, getTeamById,
    getTeamStatistics, createTeam, updateTeam, updateTeamMembers, deleteTeam,
    assignCustomerToTeams, assignCustomersBulk, getCustomersByTeam,
    getTeamsCacheView, getTeamMembers, addTeamMember, removeTeamMember,
    getAllTags, getTagById, createTag, updateTag, deleteTag,
    getAllSnippets, createSnippet, updateSnippet, deleteSnippet,
    getAllLifecycles, createLifecycle, updateLifecycle, deleteLifecycle, changeCustomerLifecycle,
    getAllDynamicFields, createDynamicField, updateDynamicField, deleteDynamicField,
} from "../services/teams-tags-service"
import type {
    CreateTeamPayload, UpdateTeamPayload, UpdateTeamMembersPayload,
    AssignCustomerPayload, AssignCustomersBulkPayload, CustomersByTeamParams,
    CreateTagPayload, UpdateTagPayload,
    CreateSnippetPayload, UpdateSnippetPayload,
    CreateLifecyclePayload, UpdateLifecyclePayload,
    DeleteLifecycleParams, ChangeCustomerLifecyclePayload,
    CreateDynamicFieldPayload, UpdateDynamicFieldPayload,
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
    customersByTeam: (tid: string, teamName: string) => ["customers-by-team", tid, teamName] as const,
    tags: (tid: string) => ["tags", tid] as const,
    snippets: (tid: string, topic?: string) => ["snippets", tid, topic] as const,
    lifecycles: (tid: string) => ["lifecycles", tid] as const,
    dynamicFields: (tid: string) => ["dynamic-fields", tid] as const,
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

/* ════════════════════════════════════════════
   DYNAMIC FIELDS (Contact Fields)
════════════════════════════════════════════ */

/** جميع الحقول الديناميكية (GET /contacts/dynamic-fields) */
export function useDynamicFields(tid: string) {
    return useQuery({
        queryKey: keys.dynamicFields(tid),
        queryFn: () => getAllDynamicFields(tid),
        enabled: !!tid,
        select: r => {
            const d = r.data
            if (Array.isArray(d)) return d
            if (d && typeof d === "object" && "items" in d) return (d as any).items ?? []
            return []
        },
    })
}

export function useCreateDynamicField(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (p: CreateDynamicFieldPayload) => createDynamicField(p, tid),
        onSuccess: r => {
            if (r.success) { toast.success("تم إنشاء الحقل"); qc.invalidateQueries({ queryKey: keys.dynamicFields(tid) }) }
            else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء إنشاء الحقل"),
    })
}

export function useUpdateDynamicField(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ fieldName, payload }: { fieldName: string; payload: UpdateDynamicFieldPayload }) =>
            updateDynamicField(fieldName, payload, tid),
        onSuccess: r => {
            if (r.success) { toast.success("تم تحديث الحقل"); qc.invalidateQueries({ queryKey: keys.dynamicFields(tid) }) }
            else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء تحديث الحقل"),
    })
}

export function useDeleteDynamicField(tid: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (fieldName: string) => deleteDynamicField(fieldName, tid),
        onSuccess: r => {
            if (r.success) { toast.success("تم حذف الحقل"); qc.invalidateQueries({ queryKey: keys.dynamicFields(tid) }) }
            else toast.error(r.message)
        },
        onError: () => toast.error("حدث خطأ أثناء حذف الحقل"),
    })
}
