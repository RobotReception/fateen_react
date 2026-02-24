import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useAuthStore } from "@/stores/auth-store"
import { agentKeys } from "./query-keys"
import {
    listAgents, getAgent, createAgent, updateAgent, deleteAgent,
    getAISettings, updateAISettings,
    updateProvider, createProvider, deleteProvider,
    addModelToProvider, deleteModelFromProvider,
    getAIFeatures, updateAIFeatures,
    getPromptsSettings, updatePromptsSettings,
    getTTSSettings, updateTTSSettings, toggleTTS,
    updateTTSProvider,
} from "../services/ai-settings-service"
import type {
    CreateAgentPayload, UpdateAgentPayload,
    UpdateAIPayload, UpdateProviderPayload, CreateProviderPayload,
    AddModelPayload, UpdateAIFeaturesPayload,
    UpdatePromptsPayload,
    UpdateTTSPayload, UpdateTTSProviderPayload,
} from "../types"

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */
function useTenantId() {
    return useAuthStore(s => s.user?.tenant_id || "")
}

/** Extract readable error message from axios error or plain Error */
function extractError(e: unknown, fallback: string): string {
    if (typeof e === "object" && e !== null) {
        const ax = e as any
        if (ax.response?.data?.message) return ax.response.data.message
        if (ax.response?.data?.detail) return ax.response.data.detail
        if (ax.code === "ERR_NETWORK") return "خطأ في الاتصال بالخادم — تحقق من الشبكة"
        if (ax.code === "ECONNABORTED") return "انتهت مهلة الاتصال — حاول مرة أخرى"
        if (ax.response?.status === 401) return "غير مصرّح — يرجى تسجيل الدخول مرة أخرى"
        if (ax.response?.status === 403) return "ليس لديك صلاحية لهذا الإجراء"
        if (ax.response?.status === 404) return "المورد المطلوب غير موجود"
        if (ax.response?.status === 409) return "تعارض — هذا العنصر موجود مسبقاً"
        if (ax.response?.status === 500) return "خطأ داخلي في الخادم"
        if (ax.message) return ax.message
    }
    return fallback
}

/** Wrap a mutation promise with a toast.promise for professional UX */
function mutationWithToast<T>(
    promise: Promise<T>,
    msgs: { loading: string; success: string; errorFallback: string }
): Promise<T> {
    return new Promise((resolve, reject) => {
        toast.promise(promise, {
            loading: msgs.loading,
            success: () => { return msgs.success },
            error: (e) => extractError(e, msgs.errorFallback),
        })
        promise.then(resolve).catch(reject)
    })
}

/* ═══════════════════════════════════════════════════════════
   0. AGENTS CRUD
   ═══════════════════════════════════════════════════════════ */
export function useAgents() {
    const tid = useTenantId()
    return useQuery({
        queryKey: agentKeys.all(tid),
        queryFn: () => listAgents(tid),
        enabled: !!tid,
        staleTime: 30_000,
        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
        select: r => r.data ?? [],
    })
}

export function useAgent(agentId: string) {
    const tid = useTenantId()
    return useQuery({
        queryKey: agentKeys.detail(tid, agentId),
        queryFn: () => getAgent(agentId, tid),
        enabled: !!tid && !!agentId,
        staleTime: 30_000,
        select: r => r.data,
    })
}

export function useCreateAgent() {
    const tid = useTenantId()
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (p: CreateAgentPayload) =>
            mutationWithToast(createAgent(p, tid), {
                loading: "جاري إنشاء الوكيل...",
                success: "تم إنشاء الوكيل بنجاح ✓",
                errorFallback: "فشل إنشاء الوكيل",
            }),
        onSettled: () => qc.invalidateQueries({ queryKey: agentKeys.all(tid) }),
    })
}

export function useUpdateAgent() {
    const tid = useTenantId()
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateAgentPayload }) =>
            mutationWithToast(updateAgent(id, payload, tid), {
                loading: "جاري تحديث الوكيل...",
                success: "تم تحديث الوكيل بنجاح ✓",
                errorFallback: "فشل تحديث الوكيل",
            }),
        onSettled: () => qc.invalidateQueries({ queryKey: agentKeys.all(tid) }),
    })
}

export function useDeleteAgent() {
    const tid = useTenantId()
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (id: string) =>
            mutationWithToast(deleteAgent(id, tid), {
                loading: "جاري حذف الوكيل...",
                success: "تم حذف الوكيل ✓",
                errorFallback: "فشل حذف الوكيل",
            }),
        onSettled: () => qc.invalidateQueries({ queryKey: agentKeys.all(tid) }),
    })
}

/* ═══════════════════════════════════════════════════════════
   1. AI SETTINGS (per agent)
   ═══════════════════════════════════════════════════════════ */
export function useAISettings(agentId: string) {
    const tid = useTenantId()
    return useQuery({
        queryKey: agentKeys.ai(tid, agentId),
        queryFn: () => getAISettings(agentId, tid),
        enabled: !!tid && !!agentId,
        staleTime: 30_000,
        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
        select: r => r.data,
    })
}

export function useUpdateAISettings(agentId: string) {
    const tid = useTenantId()
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (p: UpdateAIPayload) =>
            mutationWithToast(updateAISettings(agentId, p, tid), {
                loading: "جاري تحديث إعدادات AI...",
                success: "تم تحديث إعدادات AI بنجاح ✓",
                errorFallback: "فشل تحديث إعدادات AI",
            }),
        onSettled: () => qc.invalidateQueries({ queryKey: agentKeys.ai(tid, agentId) }),
    })
}

/* ═══════════════════════════════════════════════════════════
   2. AI PROVIDERS (per agent)
   ═══════════════════════════════════════════════════════════ */
export function useUpdateProvider(agentId: string) {
    const tid = useTenantId()
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ name, payload }: { name: string; payload: UpdateProviderPayload }) =>
            mutationWithToast(updateProvider(agentId, name, payload, tid), {
                loading: `جاري تحديث المزود "${name}"...`,
                success: `تم تحديث المزود "${name}" ✓`,
                errorFallback: "فشل تحديث المزود",
            }),
        onSettled: () => qc.invalidateQueries({ queryKey: agentKeys.ai(tid, agentId) }),
    })
}

export function useCreateProvider(agentId: string) {
    const tid = useTenantId()
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ name, payload }: { name: string; payload: CreateProviderPayload }) =>
            mutationWithToast(createProvider(agentId, name, payload, tid), {
                loading: `جاري إنشاء المزود "${name}"...`,
                success: `تم إنشاء المزود "${name}" بنجاح ✓`,
                errorFallback: "فشل إنشاء المزود",
            }),
        onSettled: () => qc.invalidateQueries({ queryKey: agentKeys.ai(tid, agentId) }),
    })
}

export function useDeleteProvider(agentId: string) {
    const tid = useTenantId()
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (name: string) =>
            mutationWithToast(deleteProvider(agentId, name, tid), {
                loading: `جاري حذف المزود "${name}"...`,
                success: `تم حذف المزود "${name}" ✓`,
                errorFallback: "فشل حذف المزود",
            }),
        onSettled: () => qc.invalidateQueries({ queryKey: agentKeys.ai(tid, agentId) }),
    })
}

/* ═══════════════════════════════════════════════════════════
   3. AI MODELS (per agent)
   ═══════════════════════════════════════════════════════════ */
export function useAddModel(agentId: string) {
    const tid = useTenantId()
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ provider, payload }: { provider: string; payload: AddModelPayload }) =>
            mutationWithToast(addModelToProvider(agentId, provider, payload, tid), {
                loading: `جاري إضافة الموديل "${payload.model_id}"...`,
                success: `تم إضافة الموديل "${payload.model_id}" ✓`,
                errorFallback: "فشل إضافة الموديل",
            }),
        onSettled: () => qc.invalidateQueries({ queryKey: agentKeys.ai(tid, agentId) }),
    })
}

export function useDeleteModel(agentId: string) {
    const tid = useTenantId()
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ provider, modelId }: { provider: string; modelId: string }) =>
            mutationWithToast(deleteModelFromProvider(agentId, provider, modelId, tid), {
                loading: `جاري حذف الموديل "${modelId}"...`,
                success: `تم حذف الموديل "${modelId}" ✓`,
                errorFallback: "فشل حذف الموديل",
            }),
        onSettled: () => qc.invalidateQueries({ queryKey: agentKeys.ai(tid, agentId) }),
    })
}

/* ═══════════════════════════════════════════════════════════
   4. AI FEATURES (per agent)
   ═══════════════════════════════════════════════════════════ */
export function useAIFeatures(agentId: string) {
    const tid = useTenantId()
    return useQuery({
        queryKey: agentKeys.aiFeatures(tid, agentId),
        queryFn: () => getAIFeatures(agentId, tid),
        enabled: !!tid && !!agentId,
        staleTime: 30_000,
        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
        select: r => r.data,
    })
}

export function useUpdateAIFeatures(agentId: string) {
    const tid = useTenantId()
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (p: UpdateAIFeaturesPayload) =>
            mutationWithToast(updateAIFeatures(agentId, p, tid), {
                loading: "جاري تحديث ميزات AI...",
                success: "تم تحديث ميزات AI ✓",
                errorFallback: "فشل تحديث ميزات AI",
            }),
        onSettled: () => qc.invalidateQueries({ queryKey: agentKeys.aiFeatures(tid, agentId) }),
    })
}


/* ═══════════════════════════════════════════════════════════
   6. PROMPTS (per agent)
   ═══════════════════════════════════════════════════════════ */
export function usePromptsSettings(agentId: string) {
    const tid = useTenantId()
    return useQuery({
        queryKey: agentKeys.prompts(tid, agentId),
        queryFn: () => getPromptsSettings(agentId, tid),
        enabled: !!tid && !!agentId,
        staleTime: 30_000,
        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
        select: r => r.data,
    })
}

export function useUpdatePromptsSettings(agentId: string) {
    const tid = useTenantId()
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (p: UpdatePromptsPayload) =>
            mutationWithToast(updatePromptsSettings(agentId, p, tid), {
                loading: "جاري حفظ البرومبت...",
                success: "تم حفظ البرومبت بنجاح ✓",
                errorFallback: "فشل حفظ البرومبت",
            }),
        onSettled: () => qc.invalidateQueries({ queryKey: agentKeys.prompts(tid, agentId) }),
    })
}

/* ═══════════════════════════════════════════════════════════
   7. TTS (per agent)
   ═══════════════════════════════════════════════════════════ */
export function useTTSSettings(agentId: string) {
    const tid = useTenantId()
    return useQuery({
        queryKey: agentKeys.tts(tid, agentId),
        queryFn: () => getTTSSettings(agentId, tid),
        enabled: !!tid && !!agentId,
        staleTime: 30_000,
        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
        select: r => r.data,
    })
}

export function useUpdateTTSSettings(agentId: string) {
    const tid = useTenantId()
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (p: UpdateTTSPayload) =>
            mutationWithToast(updateTTSSettings(agentId, p, tid), {
                loading: "جاري تحديث إعدادات TTS...",
                success: "تم تحديث إعدادات TTS ✓",
                errorFallback: "فشل تحديث إعدادات TTS",
            }),
        onSettled: () => qc.invalidateQueries({ queryKey: agentKeys.tts(tid, agentId) }),
    })
}

export function useToggleTTS(agentId: string) {
    const tid = useTenantId()
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (enabled: boolean) =>
            mutationWithToast(toggleTTS(agentId, enabled, tid), {
                loading: enabled ? "جاري تفعيل TTS..." : "جاري إيقاف TTS...",
                success: enabled ? "تم تفعيل TTS ✓" : "تم إيقاف TTS ✓",
                errorFallback: "فشل تغيير حالة TTS",
            }),
        onSettled: () => qc.invalidateQueries({ queryKey: agentKeys.tts(tid, agentId) }),
    })
}

export function useUpdateTTSProvider(agentId: string) {
    const tid = useTenantId()
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ name, payload }: { name: string; payload: UpdateTTSProviderPayload }) =>
            mutationWithToast(updateTTSProvider(agentId, name, payload, tid), {
                loading: `جاري تحديث مزود TTS "${name}"...`,
                success: `تم تحديث مزود TTS "${name}" ✓`,
                errorFallback: "فشل تحديث مزود TTS",
            }),
        onSettled: () => qc.invalidateQueries({ queryKey: agentKeys.tts(tid, agentId) }),
    })
}
