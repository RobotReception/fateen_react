import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useAuthStore } from "@/stores/auth-store"
import { aiSettingsKeys } from "./query-keys"
import {
    getAISettings, updateAISettings,
    getProvider, updateProvider, createProvider, deleteProvider,
    addModelToProvider, deleteModelFromProvider,
    getAIFeatures, updateAIFeatures,
    getFeaturesSettings, updateFeaturesSettings,
    getPromptsSettings, updatePromptsSettings,
    getTTSSettings, updateTTSSettings, toggleTTS,
    getTTSProvider, updateTTSProvider,
} from "../services/ai-settings-service"
import type {
    UpdateAIPayload, UpdateProviderPayload, CreateProviderPayload,
    AddModelPayload, UpdateAIFeaturesPayload,
    UpdateFeaturesPayload, UpdatePromptsPayload,
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
        // Axios response error
        if (ax.response?.data?.message) return ax.response.data.message
        if (ax.response?.data?.detail) return ax.response.data.detail
        // Network error
        if (ax.code === "ERR_NETWORK") return "خطأ في الاتصال بالخادم — تحقق من الشبكة"
        if (ax.code === "ECONNABORTED") return "انتهت مهلة الاتصال — حاول مرة أخرى"
        // HTTP status
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
   1. AI SETTINGS
   ═══════════════════════════════════════════════════════════ */
export function useAISettings() {
    const tid = useTenantId()
    return useQuery({
        queryKey: aiSettingsKeys.ai(tid),
        queryFn: () => getAISettings(tid),
        enabled: !!tid,
        staleTime: 30_000,
        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
        select: r => r.data,
    })
}

export function useUpdateAISettings() {
    const tid = useTenantId()
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (p: UpdateAIPayload) =>
            mutationWithToast(updateAISettings(p, tid), {
                loading: "جاري تحديث إعدادات AI...",
                success: "تم تحديث إعدادات AI بنجاح ✓",
                errorFallback: "فشل تحديث إعدادات AI",
            }),
        onSettled: () => qc.invalidateQueries({ queryKey: aiSettingsKeys.ai(tid) }),
    })
}

/* ═══════════════════════════════════════════════════════════
   2. AI PROVIDERS
   ═══════════════════════════════════════════════════════════ */
export function useUpdateProvider() {
    const tid = useTenantId()
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ name, payload }: { name: string; payload: UpdateProviderPayload }) =>
            mutationWithToast(updateProvider(name, payload, tid), {
                loading: `جاري تحديث المزود "${name}"...`,
                success: `تم تحديث المزود "${name}" ✓`,
                errorFallback: "فشل تحديث المزود",
            }),
        onSettled: () => qc.invalidateQueries({ queryKey: aiSettingsKeys.ai(tid) }),
    })
}

export function useCreateProvider() {
    const tid = useTenantId()
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ name, payload }: { name: string; payload: CreateProviderPayload }) =>
            mutationWithToast(createProvider(name, payload, tid), {
                loading: `جاري إنشاء المزود "${name}"...`,
                success: `تم إنشاء المزود "${name}" بنجاح ✓`,
                errorFallback: "فشل إنشاء المزود",
            }),
        onSettled: () => qc.invalidateQueries({ queryKey: aiSettingsKeys.ai(tid) }),
    })
}

export function useDeleteProvider() {
    const tid = useTenantId()
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (name: string) =>
            mutationWithToast(deleteProvider(name, tid), {
                loading: `جاري حذف المزود "${name}"...`,
                success: `تم حذف المزود "${name}" ✓`,
                errorFallback: "فشل حذف المزود",
            }),
        onSettled: () => qc.invalidateQueries({ queryKey: aiSettingsKeys.ai(tid) }),
    })
}

/* ═══════════════════════════════════════════════════════════
   3. AI MODELS
   ═══════════════════════════════════════════════════════════ */
export function useAddModel() {
    const tid = useTenantId()
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ provider, payload }: { provider: string; payload: AddModelPayload }) =>
            mutationWithToast(addModelToProvider(provider, payload, tid), {
                loading: `جاري إضافة الموديل "${payload.model_id}"...`,
                success: `تم إضافة الموديل "${payload.model_id}" ✓`,
                errorFallback: "فشل إضافة الموديل",
            }),
        onSettled: () => qc.invalidateQueries({ queryKey: aiSettingsKeys.ai(tid) }),
    })
}

export function useDeleteModel() {
    const tid = useTenantId()
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ provider, modelId }: { provider: string; modelId: string }) =>
            mutationWithToast(deleteModelFromProvider(provider, modelId, tid), {
                loading: `جاري حذف الموديل "${modelId}"...`,
                success: `تم حذف الموديل "${modelId}" ✓`,
                errorFallback: "فشل حذف الموديل",
            }),
        onSettled: () => qc.invalidateQueries({ queryKey: aiSettingsKeys.ai(tid) }),
    })
}

/* ═══════════════════════════════════════════════════════════
   4. AI FEATURES
   ═══════════════════════════════════════════════════════════ */
export function useAIFeatures() {
    const tid = useTenantId()
    return useQuery({
        queryKey: aiSettingsKeys.aiFeatures(tid),
        queryFn: () => getAIFeatures(tid),
        enabled: !!tid,
        staleTime: 30_000,
        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
        select: r => r.data,
    })
}

export function useUpdateAIFeatures() {
    const tid = useTenantId()
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (p: UpdateAIFeaturesPayload) =>
            mutationWithToast(updateAIFeatures(p, tid), {
                loading: "جاري تحديث ميزات AI...",
                success: "تم تحديث ميزات AI ✓",
                errorFallback: "فشل تحديث ميزات AI",
            }),
        onSettled: () => qc.invalidateQueries({ queryKey: aiSettingsKeys.aiFeatures(tid) }),
    })
}

/* ═══════════════════════════════════════════════════════════
   5. GENERAL FEATURES (platform)
   ═══════════════════════════════════════════════════════════ */
export function useFeaturesSettings() {
    const tid = useTenantId()
    return useQuery({
        queryKey: aiSettingsKeys.features(tid),
        queryFn: () => getFeaturesSettings(tid),
        enabled: !!tid,
        staleTime: 30_000,
        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
        select: r => r.data,
    })
}

export function useUpdateFeaturesSettings() {
    const tid = useTenantId()
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (p: UpdateFeaturesPayload) =>
            mutationWithToast(updateFeaturesSettings(p, tid), {
                loading: "جاري تحديث الميزات العامة...",
                success: "تم تحديث الميزات العامة ✓",
                errorFallback: "فشل تحديث الميزات العامة",
            }),
        onSettled: () => qc.invalidateQueries({ queryKey: aiSettingsKeys.features(tid) }),
    })
}

/* ═══════════════════════════════════════════════════════════
   6. PROMPTS
   ═══════════════════════════════════════════════════════════ */
export function usePromptsSettings() {
    const tid = useTenantId()
    return useQuery({
        queryKey: aiSettingsKeys.prompts(tid),
        queryFn: () => getPromptsSettings(tid),
        enabled: !!tid,
        staleTime: 30_000,
        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
        select: r => r.data,
    })
}

export function useUpdatePromptsSettings() {
    const tid = useTenantId()
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (p: UpdatePromptsPayload) =>
            mutationWithToast(updatePromptsSettings(p, tid), {
                loading: "جاري حفظ البرومبت...",
                success: "تم حفظ البرومبت بنجاح ✓",
                errorFallback: "فشل حفظ البرومبت",
            }),
        onSettled: () => qc.invalidateQueries({ queryKey: aiSettingsKeys.prompts(tid) }),
    })
}

/* ═══════════════════════════════════════════════════════════
   7. TTS
   ═══════════════════════════════════════════════════════════ */
export function useTTSSettings() {
    const tid = useTenantId()
    return useQuery({
        queryKey: aiSettingsKeys.tts(tid),
        queryFn: () => getTTSSettings(tid),
        enabled: !!tid,
        staleTime: 30_000,
        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
        select: r => r.data,
    })
}

export function useUpdateTTSSettings() {
    const tid = useTenantId()
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (p: UpdateTTSPayload) =>
            mutationWithToast(updateTTSSettings(p, tid), {
                loading: "جاري تحديث إعدادات TTS...",
                success: "تم تحديث إعدادات TTS ✓",
                errorFallback: "فشل تحديث إعدادات TTS",
            }),
        onSettled: () => qc.invalidateQueries({ queryKey: aiSettingsKeys.tts(tid) }),
    })
}

export function useToggleTTS() {
    const tid = useTenantId()
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (enabled: boolean) =>
            mutationWithToast(toggleTTS(enabled, tid), {
                loading: enabled ? "جاري تفعيل TTS..." : "جاري إيقاف TTS...",
                success: enabled ? "تم تفعيل TTS ✓" : "تم إيقاف TTS ✓",
                errorFallback: "فشل تغيير حالة TTS",
            }),
        onSettled: () => qc.invalidateQueries({ queryKey: aiSettingsKeys.tts(tid) }),
    })
}

export function useUpdateTTSProvider() {
    const tid = useTenantId()
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ name, payload }: { name: string; payload: UpdateTTSProviderPayload }) =>
            mutationWithToast(updateTTSProvider(name, payload, tid), {
                loading: `جاري تحديث مزود TTS "${name}"...`,
                success: `تم تحديث مزود TTS "${name}" ✓`,
                errorFallback: "فشل تحديث مزود TTS",
            }),
        onSettled: () => qc.invalidateQueries({ queryKey: aiSettingsKeys.tts(tid) }),
    })
}
