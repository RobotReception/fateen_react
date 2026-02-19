/** React Query key factory for settings feature */
export const settingsKeys = {
    all: ["settings"] as const,

    // ── Organization ──
    organization: (tenantId: string) =>
        [...settingsKeys.all, "organization", tenantId] as const,

    // ── User Profile ──
    profile: () => [...settingsKeys.all, "profile"] as const,
}
