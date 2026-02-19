import apiClient from "@/lib/api-client"
import type {
    ApiResponse,
    AISettings, UpdateAIPayload,
    LLMProvider, UpdateProviderPayload, CreateProviderPayload,
    AddModelPayload,
    AIFeatures, UpdateAIFeaturesPayload,
    PromptsSettings, UpdatePromptsPayload,
    FeaturesSettings, UpdateFeaturesPayload,
    TTSSettings, UpdateTTSPayload,
    TTSProvider, UpdateTTSProviderPayload,
} from "../types"

const PREFIX = "/ai-settings"

/* ============================================================
   1. AI SETTINGS — /ai-settings/ai
   ============================================================ */
export const getAISettings = async (tid: string) => {
    const { data } = await apiClient.get<ApiResponse<AISettings>>(`${PREFIX}/ai`)
    return data
}

export const updateAISettings = async (payload: UpdateAIPayload, tid: string) => {
    const { data } = await apiClient.patch<ApiResponse<AISettings>>(`${PREFIX}/ai`, payload)
    return data
}

/* ============================================================
   2. AI PROVIDERS — /ai-settings/ai/providers/{name}
   ============================================================ */
export const getProvider = async (name: string, tid: string) => {
    const { data } = await apiClient.get<ApiResponse<LLMProvider>>(`${PREFIX}/ai/providers/${name}`)
    return data
}

export const updateProvider = async (name: string, payload: UpdateProviderPayload, tid: string) => {
    const { data } = await apiClient.patch<ApiResponse<AISettings>>(`${PREFIX}/ai/providers/${name}`, payload)
    return data
}

export const createProvider = async (name: string, payload: CreateProviderPayload, tid: string) => {
    const { data } = await apiClient.post<ApiResponse<AISettings>>(`${PREFIX}/ai/providers/${name}`, payload)
    return data
}

export const deleteProvider = async (name: string, tid: string) => {
    await apiClient.delete(`${PREFIX}/ai/providers/${name}`)
}

/* ============================================================
   3. PROVIDER MODELS — /ai-settings/ai/providers/{name}/models
   ============================================================ */
export const addModelToProvider = async (providerName: string, payload: AddModelPayload, tid: string) => {
    const { data } = await apiClient.post<ApiResponse<AISettings>>(`${PREFIX}/ai/providers/${providerName}/models`, payload)
    return data
}

export const deleteModelFromProvider = async (providerName: string, modelId: string, tid: string) => {
    const { data } = await apiClient.delete<ApiResponse<AISettings>>(`${PREFIX}/ai/providers/${providerName}/models/${encodeURIComponent(modelId)}`)
    return data
}

/* ============================================================
   4. AI FEATURES — /ai-settings/ai/features
   ============================================================ */
export const getAIFeatures = async (tid: string) => {
    const { data } = await apiClient.get<ApiResponse<AIFeatures>>(`${PREFIX}/ai/features`)
    return data
}

export const updateAIFeatures = async (payload: UpdateAIFeaturesPayload, tid: string) => {
    const { data } = await apiClient.patch<ApiResponse<AISettings>>(`${PREFIX}/ai/features`, payload)
    return data
}

/* ============================================================
   5. GENERAL FEATURES — /ai-settings/features
   ============================================================ */
export const getFeaturesSettings = async (tid: string) => {
    const { data } = await apiClient.get<ApiResponse<FeaturesSettings>>(`${PREFIX}/features`)
    return data
}

export const updateFeaturesSettings = async (payload: UpdateFeaturesPayload, tid: string) => {
    const { data } = await apiClient.patch<ApiResponse<FeaturesSettings>>(`${PREFIX}/features`, payload)
    return data
}

/* ============================================================
   6. PROMPTS — /ai-settings/prompts
   ============================================================ */
export const getPromptsSettings = async (tid: string) => {
    const { data } = await apiClient.get<ApiResponse<PromptsSettings>>(`${PREFIX}/prompts`)
    return data
}

export const updatePromptsSettings = async (payload: UpdatePromptsPayload, tid: string) => {
    const { data } = await apiClient.patch<ApiResponse<PromptsSettings>>(`${PREFIX}/prompts`, payload)
    return data
}

/* ============================================================
   7. TTS — /ai-settings/tts
   ============================================================ */
export const getTTSSettings = async (tid: string) => {
    const { data } = await apiClient.get<ApiResponse<TTSSettings>>(`${PREFIX}/tts`)
    return data
}

export const updateTTSSettings = async (payload: UpdateTTSPayload, tid: string) => {
    const { data } = await apiClient.patch<ApiResponse<TTSSettings>>(`${PREFIX}/tts`, payload)
    return data
}

/* ============================================================
   8. TTS TOGGLE — /ai-settings/tts/toggle
   ============================================================ */
export const toggleTTS = async (enabled: boolean, tid: string) => {
    const { data } = await apiClient.post<ApiResponse<TTSSettings>>(`${PREFIX}/tts/toggle`, { enabled })
    return data
}

/* ============================================================
   9. TTS PROVIDERS — /ai-settings/tts/providers/{name}
   ============================================================ */
export const getTTSProvider = async (name: string, tid: string) => {
    const { data } = await apiClient.get<ApiResponse<TTSProvider>>(`${PREFIX}/tts/providers/${name}`)
    return data
}

export const updateTTSProvider = async (name: string, payload: UpdateTTSProviderPayload, tid: string) => {
    const { data } = await apiClient.patch<ApiResponse<TTSSettings>>(`${PREFIX}/tts/providers/${name}`, payload)
    return data
}
