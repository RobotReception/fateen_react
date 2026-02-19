/* ============================================================
   AI SETTINGS FEATURE — TYPE DEFINITIONS
   (aligned with /api/backend/v2/ai-settings API — actual response)
   ============================================================ */

// ── Generic API response wrapper ──
export interface ApiResponse<T> {
    success: boolean
    message: string
    data: T | null
}

// ─────────────────────────────────────────────────────────────
//  1. AI Settings (top-level)
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
    type?: "available_models"
}

// ─────────────────────────────────────────────────────────────
//  3. AI Features
// ─────────────────────────────────────────────────────────────
export type UpdateAIFeaturesPayload = Partial<AIFeatures>

// ─────────────────────────────────────────────────────────────
//  4. General Features (platform)
// ─────────────────────────────────────────────────────────────
export interface FeaturesSettings {
    enable_notifications: boolean
    enable_analytics: boolean
    enable_caching: boolean
    cache_ttl_seconds: number
    enable_rate_limiting: boolean
    rate_limit_requests: number
    rate_limit_window: number
}

export type UpdateFeaturesPayload = Partial<FeaturesSettings>

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
