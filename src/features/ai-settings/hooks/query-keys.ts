/** React Query key factory for AI Settings */
export const aiSettingsKeys = {
    all: ["ai-settings"] as const,

    ai: (tid: string) => [...aiSettingsKeys.all, "ai", tid] as const,
    provider: (tid: string, name: string) => [...aiSettingsKeys.all, "provider", tid, name] as const,
    aiFeatures: (tid: string) => [...aiSettingsKeys.all, "ai-features", tid] as const,
    features: (tid: string) => [...aiSettingsKeys.all, "features", tid] as const,
    prompts: (tid: string) => [...aiSettingsKeys.all, "prompts", tid] as const,
    tts: (tid: string) => [...aiSettingsKeys.all, "tts", tid] as const,
    ttsProvider: (tid: string, name: string) => [...aiSettingsKeys.all, "tts-provider", tid, name] as const,
}
