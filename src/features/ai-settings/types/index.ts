/* ============================================================
   AI SETTINGS / AGENTS FEATURE — TYPE DEFINITIONS
   (aligned with /api/v1/agents API)
   ============================================================ */

// ── Generic API response wrapper ──
export interface ApiResponse<T> {
    success: boolean
    message: string
    data: T | null
}

// ─────────────────────────────────────────────────────────────
//  0. Agent entity
// ─────────────────────────────────────────────────────────────
export interface Agent {
    id: string
    tenant_id: string
    name: string
    description?: string
    status: "active" | "inactive"
    departments: string[]
    categories: string[]
    ai: Partial<AISettings>
    prompts: Partial<PromptsSettings>
    tts: Partial<TTSSettings>
    created_at: string
    updated_at: string
}

export interface CreateAgentPayload {
    name: string
    description?: string
    status?: "active" | "inactive"
    departments?: string[]
    categories?: string[]
}

export type UpdateAgentPayload = Partial<CreateAgentPayload>

// ─────────────────────────────────────────────────────────────
//  1. AI Settings (per agent)
// ─────────────────────────────────────────────────────────────
export interface LLMProviderConfig {
    temperature?: number
    max_tokens?: number
    timeout?: number
    [key: string]: unknown
}

export interface LLMProvider {
    enabled: boolean
    api_key: string
    available_models: string[]
    selected_model: string
    config: LLMProviderConfig
}

export interface AIFeatures {
    enable_sentiment_analysis: boolean
    enable_auto_classification: boolean
    enable_summarization: boolean
}

export interface AISettings {
    enabled: boolean
    default_llm: string
    llm_providers: Record<string, LLMProvider>
    features: AIFeatures
    test_url: string
}

export type UpdateAIPayload = Partial<Pick<AISettings, "enabled" | "default_llm" | "test_url">>
export type UpdateProviderPayload = Partial<Omit<LLMProvider, "config">> & { config?: LLMProviderConfig }
export type CreateProviderPayload = Partial<LLMProvider>

// ─────────────────────────────────────────────────────────────
//  2. Models (per provider)
// ─────────────────────────────────────────────────────────────
export interface AddModelPayload {
    model_id: string
    type?: "available_models" | "available_embedding_models"
}

// ─────────────────────────────────────────────────────────────
//  3. AI Features
// ─────────────────────────────────────────────────────────────
export type UpdateAIFeaturesPayload = Partial<AIFeatures>



// ─────────────────────────────────────────────────────────────
//  5. Prompts Settings
// ─────────────────────────────────────────────────────────────
export interface PromptsSettings {
    general_prompt: string
    system_prompt: string
    retrieval_prompt: string
    classification_prompt: string
    summarization_prompt: string
    qa_prompt: string
}

export type UpdatePromptsPayload = Partial<PromptsSettings>

// ─────────────────────────────────────────────────────────────
//  6. TTS Settings
// ─────────────────────────────────────────────────────────────
export interface TTSProvider {
    enabled: boolean
    region_name?: string
    voice_id?: string
    engine?: string
    output_format?: string
    access_key_id?: string
    secret_access_key?: string
    [key: string]: unknown
}

export interface TTSSettings {
    enabled: boolean
    default_provider: string
    providers: Record<string, TTSProvider>
}

export type UpdateTTSPayload = Partial<Pick<TTSSettings, "enabled" | "default_provider">>
export type UpdateTTSProviderPayload = Partial<TTSProvider>
