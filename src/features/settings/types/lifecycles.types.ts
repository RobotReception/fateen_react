// ============================================================
// Types: Lifecycles
// API: /api/backend/v2/lifecycles
// ============================================================

/* ── Shared wrapper ── */
export interface ApiResponse<T> {
    success: boolean
    message: string
    data: T
}

/* ════════════════════════════════════
   LIFECYCLES
════════════════════════════════════ */
export interface Lifecycle {
    id: string          // MongoDB _id
    code: string          // e.g. "lc_c384f0ab" (auto-generated)
    name: string          // localised name
    name_ar?: string
    name_en?: string
    description?: string          // localised description
    description_ar?: string
    description_en?: string
    icon?: string
    color?: string          // HEX, e.g. "#53b1df"
    order?: number
    is_active?: boolean
    deactivated_at?: string      // timestamp when deactivated
    created_at?: string
    updated_at?: string
}

/** Full list — GET /lifecycles */
export interface LifecyclesListData {
    items: Lifecycle[]
    total: number
}

export interface CreateLifecyclePayload {
    name: string          // required
    name_ar?: string
    name_en?: string
    description?: string
    description_ar?: string
    description_en?: string
    icon?: string          // default: ""
    color?: string          // HEX, default: "#53b1df"
    order?: number          // default: 1
}

export interface UpdateLifecyclePayload {
    name?: string
    name_ar?: string
    name_en?: string
    description?: string
    description_ar?: string
    description_en?: string
    icon?: string
    color?: string          // must start with # and be 7 chars
    order?: number
    is_active?: boolean
}

/** DELETE /lifecycles/{code} uses query param */
export interface DeleteLifecycleParams {
    reassign_to?: string            // code of fallback lifecycle
}

/** PATCH /lifecycles/customers/{customer_id}/lifecycle */
export interface ChangeCustomerLifecyclePayload {
    lifecycle_code: string          // required
    performed_by?: string          // injected from JWT if omitted
}

export interface ChangeCustomerLifecycleResponse {
    success: boolean
    customer_id: string
    new_lifecycle: string
}
