/** React Query key factory for Agents & AI Settings */
export const agentKeys = {
    /* agents */
    all: (tid: string) => ["agents", tid] as const,
    detail: (tid: string, id: string) => ["agents", tid, id] as const,

    /* per-agent settings */
    ai: (tid: string, agentId: string) => ["agents", tid, agentId, "ai"] as const,
    provider: (tid: string, agentId: string, name: string) => ["agents", tid, agentId, "provider", name] as const,
    aiFeatures: (tid: string, agentId: string) => ["agents", tid, agentId, "ai-features"] as const,
    prompts: (tid: string, agentId: string) => ["agents", tid, agentId, "prompts"] as const,
    tts: (tid: string, agentId: string) => ["agents", tid, agentId, "tts"] as const,
    ttsProvider: (tid: string, agentId: string, name: string) => ["agents", tid, agentId, "tts-provider", name] as const,
}

/** @deprecated — use agentKeys instead */
export const aiSettingsKeys = agentKeys
