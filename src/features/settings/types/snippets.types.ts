// ============================================================
// Types: Snippets + Media Upload
// API: /api/backend/v2/snippets, /api/backend/v2/media
// ============================================================

/* ── Shared wrapper ── */
export interface ApiResponse<T> {
    success: boolean
    message: string
    data: T
}

/* ════════════════════════════════════
   SNIPPETS
════════════════════════════════════ */
export type SnippetMessageType = "text" | "image" | "audio" | "video" | "file" | "document"

export interface SnippetContent {
    // text
    text?: string
    // media
    url?: string
    caption?: string
    filename?: string
    size?: number
    mime_type?: string
    // audio/video extras
    duration?: number
    transcript?: string
    // any other keys
    [key: string]: unknown
}

export interface Snippet {
    id: string          // MongoDB _id
    field_id: string          // e.g. "snip_193a8ce7" (auto-generated)
    name: string
    title?: string          // localised title
    title_ar?: string
    title_en?: string
    topic?: string
    created_by?: string
    message_type: SnippetMessageType
    content?: SnippetContent
    content_ar?: string          // localised text shorthand
    content_en?: string
    created_at?: string
    updated_at?: string
    // legacy compat
    message?: string
}

/** Paginated list — GET /snippets */
export interface SnippetsListData {
    items: Snippet[]
    total: number
}

export interface CreateSnippetPayload {
    name: string              // required
    title_ar?: string
    title_en?: string
    message_type: SnippetMessageType  // required
    content: SnippetContent      // required, shape depends on message_type
    content_ar?: string
    content_en?: string
    topic?: string
}

export interface UpdateSnippetPayload {
    name?: string
    title_ar?: string
    title_en?: string
    message_type?: SnippetMessageType
    content?: SnippetContent
    content_ar?: string
    content_en?: string
    topic?: string
}

/* Media Upload — POST /media/upload */
export interface MediaUploadResponse {
    media_id: string
    proxy_url: string
    public_url: string
    filename: string
    original_filename: string
    saved_filename: string
    file_size: number
}
