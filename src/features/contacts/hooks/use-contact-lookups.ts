import { useMemo } from "react"
import { useTags, useLifecycles } from "@/features/settings/hooks/use-teams-tags"
import { useAuthStore } from "@/stores/auth-store"

/**
 * Provides name-resolution maps for tag IDs → names and lifecycle codes → details.
 * Reusable across ContactItem, ContactDetailPanel, etc.
 */
export function useContactLookups() {
    const tenantId = useAuthStore((s) => s.user?.tenant_id) ?? ""

    const { data: tags } = useTags(tenantId)
    const { data: lifecycles } = useLifecycles(tenantId)

    const tagMap = useMemo(() => {
        const m = new Map<string, { name: string; emoji?: string }>()
        if (tags) {
            for (const t of tags) {
                m.set(t.id, { name: t.name, emoji: t.emoji })
            }
        }
        return m
    }, [tags])

    const lifecycleMap = useMemo(() => {
        const m = new Map<string, { name: string; icon?: string; color?: string }>()
        if (lifecycles) {
            for (const lc of lifecycles) {
                m.set(lc.code, { name: lc.name, icon: lc.icon, color: lc.color })
            }
        }
        return m
    }, [lifecycles])

    return { tagMap, lifecycleMap }
}
