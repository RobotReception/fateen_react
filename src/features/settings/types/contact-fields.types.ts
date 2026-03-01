// ============================================================
// Types: Dynamic Fields (Contact Fields)
// API: /api/backend/v2/contacts/dynamic-fields
// ============================================================

/* ── Shared wrapper ── */
export interface ApiResponse<T> {
    success: boolean
    message: string
    data: T
}

/* ════════════════════════════════════
   DYNAMIC FIELDS (Contact Fields)
════════════════════════════════════ */
export type DynamicFieldType =
    | "text" | "number" | "email" | "phone"
    | "date" | "boolean" | "select" | "multi_select"
    | "url" | "textarea"

export interface DynamicField {
    id: string
    field_name: string
    field_label: string
    label?: string           // resolved by Accept-Language
    label_ar?: string
    label_en?: string
    field_type: DynamicFieldType
    required: boolean
    default_value?: string | null
    options?: string[] | null
    validation_rules?: Record<string, unknown> | null
    is_active: boolean
    display_order?: number | null
    description?: string | null
    created_at?: string
    updated_at?: string
}

/** GET /contacts/dynamic-fields returns array directly */
export type DynamicFieldsListData = DynamicField[]

export interface CreateDynamicFieldPayload {
    field_name: string            // required, snake_case, 1-50
    field_label: string           // required, 1-100
    label_ar?: string
    label_en?: string
    field_type?: DynamicFieldType  // default: "text"
    required?: boolean             // default: false
    default_value?: string         // max 500
    options?: string[]             // required for select / multi_select
    validation_rules?: Record<string, unknown>
    is_active?: boolean            // default: true
    display_order?: number
    description?: string           // max 500
}

export interface UpdateDynamicFieldPayload {
    field_label?: string
    label_ar?: string
    label_en?: string
    required?: boolean
    default_value?: string
    options?: string[]
    is_active?: boolean
    display_order?: number
    description?: string
    // NOTE: field_name, field_type, validation_rules cannot be changed after creation
}
