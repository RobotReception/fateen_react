import axios from "axios"
import type {
    ApiResponse,
    Agent, CreateAgentPayload, UpdateAgentPayload,
    AISettings, UpdateAIPayload,
    LLMProvider, UpdateProviderPayload, CreateProviderPayload,
    AddModelPayload,
    AIFeatures, UpdateAIFeaturesPayload,
    PromptsSettings, UpdatePromptsPayload,
    TTSSettings, UpdateTTSPayload,
    TTSProvider, UpdateTTSProviderPayload,
} from "../types"

/* ── Agents API lives at /api/v1/agents ── */
const AGENTS_BASE =
    (import.meta.env.VITE_API_BASE_URL || "http://161.97.117.77:4488/api/backend/v2")
        .replace(/\/api\/backend\/v2\/?$/, "/api/backend/v2/agents")

const client = axios.create({ baseURL: AGENTS_BASE, timeout: 30000 })

// Inject JWT + tenant-id automatically
client.interceptors.request.use((cfg) => {
    const token = localStorage.getItem("access_token")
    if (token) cfg.headers.Authorization = `Bearer ${token}`
    cfg.headers["Content-Type"] = "application/json"
    return cfg
})

function h(tid: string) { return { "X-Tenant-ID": tid } }

/* ============================================================
   0. AGENT CRUD — /agents
   ============================================================ */
export const listAgents = async (tid: string) => {
    const { data } = await client.get<ApiResponse<Agent[]>>("", { headers: h(tid) })
    return data
}
export const getAgent = async (id: string, tid: string) => {
    const { data } = await client.get<ApiResponse<Agent>>(`/${id}`, { headers: h(tid) })
    return data
}
export const createAgent = async (payload: CreateAgentPayload, tid: string) => {
    const { data } = await client.post<ApiResponse<Agent>>("", payload, { headers: h(tid) })
    return data
}
export const updateAgent = async (id: string, payload: UpdateAgentPayload, tid: string) => {
    const { data } = await client.patch<ApiResponse<Agent>>(`/${id}`, payload, { headers: h(tid) })
    return data
}
export const deleteAgent = async (id: string, tid: string) => {
    const { data } = await client.delete<ApiResponse<null>>(`/${id}`, { headers: h(tid) })
    return data
}

/* ============================================================
   1. AI SETTINGS — /agents/{id}/ai
   ============================================================ */
export const getAISettings = async (agentId: string, tid: string) => {
    const { data } = await client.get<ApiResponse<AISettings>>(`/${agentId}/ai`, { headers: h(tid) })
    return data
}
export const updateAISettings = async (agentId: string, payload: UpdateAIPayload, tid: string) => {
    const { data } = await client.patch<ApiResponse<AISettings>>(`/${agentId}/ai`, payload, { headers: h(tid) })
    return data
}

/* ============================================================
   2. AI PROVIDERS — /agents/{id}/ai/providers/{name}
   ============================================================ */
export const getProvider = async (agentId: string, name: string, tid: string) => {
    const { data } = await client.get<ApiResponse<LLMProvider>>(`/${agentId}/ai/providers/${name}`, { headers: h(tid) })
    return data
}
export const updateProvider = async (agentId: string, name: string, payload: UpdateProviderPayload, tid: string) => {
    const { data } = await client.patch<ApiResponse<AISettings>>(`/${agentId}/ai/providers/${name}`, payload, { headers: h(tid) })
    return data
}
export const createProvider = async (agentId: string, name: string, payload: CreateProviderPayload, tid: string) => {
    const { data } = await client.post<ApiResponse<AISettings>>(`/${agentId}/ai/providers/${name}`, payload, { headers: h(tid) })
    return data
}
export const deleteProvider = async (agentId: string, name: string, tid: string) => {
    const { data } = await client.delete<ApiResponse<null>>(`/${agentId}/ai/providers/${name}`, { headers: h(tid) })
    return data
}

/* ============================================================
   3. PROVIDER MODELS — /agents/{id}/ai/providers/{name}/models
   ============================================================ */
export const addModelToProvider = async (agentId: string, providerName: string, payload: AddModelPayload, tid: string) => {
    const { data } = await client.post<ApiResponse<AISettings>>(`/${agentId}/ai/providers/${providerName}/models`, payload, { headers: h(tid) })
    return data
}
export const deleteModelFromProvider = async (agentId: string, providerName: string, modelId: string, tid: string) => {
    const { data } = await client.delete<ApiResponse<AISettings>>(`/${agentId}/ai/providers/${providerName}/models/${encodeURIComponent(modelId)}`, { headers: h(tid) })
    return data
}

/* ============================================================
   4. AI FEATURES — /agents/{id}/ai/features
   ============================================================ */
export const getAIFeatures = async (agentId: string, tid: string) => {
    const { data } = await client.get<ApiResponse<AIFeatures>>(`/${agentId}/ai/features`, { headers: h(tid) })
    return data
}
export const updateAIFeatures = async (agentId: string, payload: UpdateAIFeaturesPayload, tid: string) => {
    const { data } = await client.patch<ApiResponse<AISettings>>(`/${agentId}/ai/features`, payload, { headers: h(tid) })
    return data
}


/* ============================================================
   6. PROMPTS — /agents/{id}/prompts
   ============================================================ */
export const getPromptsSettings = async (agentId: string, tid: string) => {
    const { data } = await client.get<ApiResponse<PromptsSettings>>(`/${agentId}/prompts`, { headers: h(tid) })
    return data
}
export const updatePromptsSettings = async (agentId: string, payload: UpdatePromptsPayload, tid: string) => {
    const { data } = await client.patch<ApiResponse<PromptsSettings>>(`/${agentId}/prompts`, payload, { headers: h(tid) })
    return data
}

/* ============================================================
   7. TTS — /agents/{id}/tts
   ============================================================ */
export const getTTSSettings = async (agentId: string, tid: string) => {
    const { data } = await client.get<ApiResponse<TTSSettings>>(`/${agentId}/tts`, { headers: h(tid) })
    return data
}
export const updateTTSSettings = async (agentId: string, payload: UpdateTTSPayload, tid: string) => {
    const { data } = await client.patch<ApiResponse<TTSSettings>>(`/${agentId}/tts`, payload, { headers: h(tid) })
    return data
}

/* ============================================================
   8. TTS TOGGLE — /agents/{id}/tts/toggle
   ============================================================ */
export const toggleTTS = async (agentId: string, enabled: boolean, tid: string) => {
    const { data } = await client.post<ApiResponse<TTSSettings>>(`/${agentId}/tts/toggle`, { enabled }, { headers: h(tid) })
    return data
}

/* ============================================================
   9. TTS PROVIDERS — /agents/{id}/tts/providers/{name}
   ============================================================ */
export const getTTSProvider = async (agentId: string, name: string, tid: string) => {
    const { data } = await client.get<ApiResponse<TTSProvider>>(`/${agentId}/tts/providers/${name}`, { headers: h(tid) })
    return data
}
export const updateTTSProvider = async (agentId: string, name: string, payload: UpdateTTSProviderPayload, tid: string) => {
    const { data } = await client.patch<ApiResponse<TTSSettings>>(`/${agentId}/tts/providers/${name}`, payload, { headers: h(tid) })
    return data
}
