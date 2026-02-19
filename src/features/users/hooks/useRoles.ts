import { useState, useEffect } from "react"
import { getRoles } from "../services/users-service"
import { useAuthStore } from "@/stores/auth-store"

/** A role can be a plain string OR an object {id, name, description} */
export interface RoleItem {
    id: string
    name: string
    description?: string
}

/**
 * Hook to fetch available roles from the API.
 * Normalizes the response — whether roles come as string[] or object[].
 */
export function useRoles() {
    const { user } = useAuthStore()
    const tenantId = user?.tenant_id || ""

    const [roles, setRoles] = useState<RoleItem[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!tenantId) return

        let cancelled = false
        setLoading(true)
        setError(null)

        getRoles(tenantId)
            .then((result) => {
                if (cancelled) return
                if (result.success && result.data?.roles) {
                    // Normalize: API may return string[] or object[]
                    const raw = result.data.roles as unknown[]
                    const normalized: RoleItem[] = raw.map((r) => {
                        if (typeof r === "string") {
                            return { id: r, name: r }
                        }
                        // Object shape: { id, name, description }
                        const obj = r as Record<string, unknown>
                        return {
                            id: String(obj.id || obj.name || ""),
                            name: String(obj.name || obj.id || ""),
                            description: obj.description ? String(obj.description) : undefined,
                        }
                    })
                    setRoles(normalized)
                } else {
                    setError(result.message || "فشل تحميل الأدوار")
                }
            })
            .catch((err) => {
                if (cancelled) return
                const e = err as { response?: { data?: { message?: string } } }
                setError(e.response?.data?.message || "حدث خطأ أثناء تحميل الأدوار")
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [tenantId])

    return { roles, loading, error }
}
