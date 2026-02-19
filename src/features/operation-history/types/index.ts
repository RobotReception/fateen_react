/* ═══════════════════════════════════════════════════════
   OPERATION HISTORY — TYPES
   ═══════════════════════════════════════════════════════ */

// ── Core data models ──

export interface Operation {
    index: number
    id: string
    operation: string
    username: string
    status: string
    created_at: string
    approved_by: string
    completed_at: string
}

export interface OperationDetails extends Operation {
    rejection_reason: string | null
    text: string
    doc_id: string
}

export interface OperationPagination {
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

export interface OperationUniqueValues {
    username: FilterOption[]
    operation: FilterOption[]
    status: FilterOption[]
    approved_by: FilterOption[]
}

// ── Request params ──

export interface GetOperationsParams {
    page?: number
    page_size?: number
}

export interface SearchOperationsParams {
    operation?: string
    username?: string
    status?: string
    approved_by?: string
    page?: number
    page_size?: number
}

export interface DownloadCsvParams {
    filter_user?: string
    filter_operation?: string
    filter_status?: string
    filter_approved_by?: string
}

// ── API Responses ──

export interface GetOperationsResponse {
    success: boolean
    message: string
    data: {
        pagination: OperationPagination
        operations: Operation[]
    }
}

export interface SearchOperationsResponse {
    success: boolean
    message: string
    data: {
        pagination: OperationPagination
        results: Operation[]
        unique_values: OperationUniqueValues
    }
}

export interface GetOperationDetailsResponse {
    success: boolean
    message: string
    data: {
        operation_details: OperationDetails
    }
}
