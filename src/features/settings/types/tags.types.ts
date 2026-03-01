// ============================================================
// Types: Tags
// API: /api/backend/v2/tags
// ============================================================

/* ── Shared wrapper ── */
export interface ApiResponse<T> {
    success: boolean
    message: string
    data: T
}

/* ════════════════════════════════════
   TAGS
════════════════════════════════════ */
export interface Tag {
    id: string          // MongoDB _id
    tag_id?: string          // legacy field (may not be present)
    name: string          // localised name
    name_ar?: string
    name_en?: string
    emoji?: string
    description?: string
    category?: string
    source?: string
    created_by?: string
    is_active?: boolean          // soft-delete flag
    deactivated_at?: string      // timestamp when deactivated
    created_at?: string
    last_edited_by?: string
    last_edited_at?: string
    // legacy compat
    updated_at?: string
}

/** Paginated response — GET /tags */
export interface TagsListData {
    items: Tag[]
    total: number
    page: number
    page_size: number
    total_pages: number
    has_previous: boolean
    has_next: boolean
}

/** @deprecated use TagsListData (paginated) */
export interface TagsFlatData {
    tags: Tag[]
}

export interface CreateTagPayload {
    name: string          // required
    name_ar?: string
    name_en?: string
    emoji?: string          // max 8 bytes
    description?: string          // max 200 chars
    category?: string          // max 30 chars
    source?: string          // default: "User", max 30 chars
}

export interface UpdateTagPayload {
    name?: string          // max 50 chars
    name_ar?: string          // max 50 chars
    name_en?: string          // max 50 chars
    emoji?: string          // max 8 bytes
    description?: string          // max 200 chars
    category?: string          // max 30 chars
    source?: string          // max 30 chars
}
