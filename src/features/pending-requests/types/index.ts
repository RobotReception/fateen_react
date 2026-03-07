/* ═══════════════════════════════════════════════════════
   PENDING REQUESTS — TYPES
   ═══════════════════════════════════════════════════════ */

// ── Core data models ──

export interface PendingOrder {
    index: number
    id: string
    operation: string
    username: string
    tenant_id?: string
    status: string
    created_at: string
    text?: string
    doc_id?: string

    // File / train fields
    file_name?: string
    file_path?: string
    file_url?: string
    media_id?: string
    public_url?: string
    proxy_url?: string

    // Classification
    department_id?: string
    category_id?: string

    // CSV / Excel specifics
    has_header?: boolean
    delimiter?: string | null
    encoding?: string | null
    question_col?: number
    answer_col?: number
    sheet?: number

    // Allow unknown future fields
    [key: string]: unknown
}

export interface RequestDetails extends PendingOrder {
    completed_at?: string
    approved_by?: string
    rejection_reason?: string
    file_size?: string
}

export interface PendingPagination {
    totalCount: number
    totalPages: number
    hasPrevious: boolean
    hasNext: boolean
    currentPage: number
    pageSize: number
}

export interface FilterOption {
    label: string
    value: string
}

export interface UniqueValues {
    username: FilterOption[]
    operation: FilterOption[]
}

// ── Request params ──

export interface GetPendingOrdersParams {
    page?: number
    page_size?: number
}

export interface SearchPendingOrdersParams {
    username?: string
    operation?: string
    page?: number
    page_size?: number
}

// ── API Responses ──

export interface GetPendingOrdersResponse {
    success: boolean
    message: string
    data: {
        pending_orders: PendingOrder[]
        pagination: PendingPagination
    }
}

export interface SearchPendingOrdersResponse {
    success: boolean
    message: string
    data: {
        search_results: PendingOrder[]
        unique_values: UniqueValues
        pagination: PendingPagination
    }
}

export interface GetRequestDetailsResponse {
    success: boolean
    message: string
    data: {
        operation_details: RequestDetails
    }
}

export interface ApproveRejectResponse {
    success: boolean
    message: string
}
