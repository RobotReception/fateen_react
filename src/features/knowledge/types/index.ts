// ============================================
// Knowledge Base Types — synced with API v2
// ============================================

// ── Shared pagination params ──
export interface PaginatedParams {
    page?: number
    page_size?: number
    include_inactive?: boolean
}

// ── Generic API response ──
export interface ApiResponse<T = unknown> {
    success: boolean
    data: T
    message: string
}

// ══════════════════════════════════════════════
// DEPARTMENTS
// ══════════════════════════════════════════════

// ── Department (lookup — simplified) ──
export interface DepartmentLookup {
    id: string
    department_id: string
    name: string
    name_ar: string
    icon: string
    order: number
}

export type DepartmentLookupResponse = ApiResponse<DepartmentLookup[]>

// ── Department (full detail) ──
export interface DepartmentDetail {
    id: string
    department_id: string
    name: string
    name_ar?: string
    name_en?: string
    description?: string
    icon?: string
    color?: string
    is_active: boolean
    order: number
    categories?: CategoryItem[]
    tenant_id?: string
    created_by?: string
    created_at?: string
    updated_by?: string
    updated_at?: string
}

// ── Department list (paginated) ──
export interface DepartmentListData {
    departments: DepartmentDetail[]
    total: number
    page: number
    page_size: number
}
export type DepartmentListResponse = ApiResponse<DepartmentListData>
export type DepartmentDetailResponse = ApiResponse<DepartmentDetail>

// ── Create department ──
export interface CreateDepartmentPayload {
    department_id: string
    name: string
    name_ar?: string
    name_en?: string
    description?: string
    icon?: string
    color?: string
    is_active?: boolean
    order?: number
    created_by: string
}

// ── Update department ──
export interface UpdateDepartmentPayload {
    name?: string
    name_ar?: string
    name_en?: string
    description?: string
    icon?: string
    color?: string
    is_active?: boolean
    order?: number
    updated_by: string
}

// ── Delete department ──
export interface DeleteDepartmentData {
    department_id: string
}
export type DeleteDepartmentResponse = ApiResponse<DeleteDepartmentData>

// ── Link category ──
export interface LinkCategoryPayload {
    category_id: string
}
export interface LinkCategoryData {
    department_id: string
    category_ids: string[]
}
export type LinkCategoryResponse = ApiResponse<LinkCategoryData>

// ── Unlink category ──
export interface UnlinkCategoryData {
    department_id: string
    category_id: string
}
export type UnlinkCategoryResponse = ApiResponse<UnlinkCategoryData>

// ══════════════════════════════════════════════
// CATEGORIES
// ══════════════════════════════════════════════

// ── Category item (within a department) ──
export interface CategoryItem {
    category_id: string
    name: string
    name_ar: string
    name_en?: string
    description?: string
    icon: string
    color?: string
    is_active: boolean
    order: number
}

export interface DepartmentCategoriesResponse {
    success: boolean
    data: {
        categories: CategoryItem[]
    }
    message: string
}

// ── Category (full detail from standalone endpoint) ──
export interface CategoryDetail {
    category_id: string
    name: string
    name_ar?: string
    name_en?: string
    description?: string
    icon?: string
    color?: string
    is_active: boolean
    order: number
}
export type CategoryDetailResponse = ApiResponse<CategoryDetail>

// ── Category list (paginated) ──
export interface CategoryListData {
    categories: CategoryDetail[]
    total: number
    page: number
    page_size: number
}
export type CategoryListResponse = ApiResponse<CategoryListData>

// ── Create category ──
export interface CreateCategoryPayload {
    category_id: string
    name: string
    name_ar?: string
    name_en?: string
    description?: string
    icon?: string
    color?: string
    is_active?: boolean
    order?: number
}

// ── Update category ──
export interface UpdateCategoryPayload {
    name?: string
    name_ar?: string
    name_en?: string
    description?: string
    icon?: string
    color?: string
    is_active?: boolean
    order?: number
}

// ── Delete category ──
export interface DeleteCategoryData {
    category_id: string
}
export type DeleteCategoryResponse = ApiResponse<DeleteCategoryData>

// ══════════════════════════════════════════════
// DOCUMENTS
// ══════════════════════════════════════════════

// ── Document search ──
export interface SearchDocumentResult {
    doc_id: string
    text: string
    user: string
    department_id: string
    category_id: string
}

export interface SearchPagination {
    totalCount: number
    pageSize: number
    currentPage: number
    totalPages: number
    hasPrevious: boolean
    hasNext: boolean
}

export interface SearchDocumentsResponse {
    success: boolean
    data: {
        results: SearchDocumentResult[]
        pagination: SearchPagination
    }
    message: string
}

export interface SearchDocumentsParams {
    query?: string
    page?: number
    page_size?: number
    department_id?: string
    category_id?: string
}

// ── Update document ──
export interface UpdateDocumentPayload {
    doc_id: string
    text?: string
    new_text: string
    department_id?: string
    category_id?: string
}

export interface UpdateDocumentResponse {
    success: boolean
    data: {
        request_id: string
        doc_id: string
    } | null
    message: string
}

// ── Delete document(s) ──
export interface DeleteDocumentPayload {
    doc_id: string | string[]
    text?: string
    department_id?: string
    category_id?: string
}

export interface DeleteDocumentResponse {
    success: boolean
    data: {
        deleted_ids: string[]
        result: boolean
    } | null
    message: string
}

// ── Train data request (file upload) ──
export interface TrainProcessedFile {
    filename: string
    status: string
    message: string
    error?: string
}

export interface TrainDataResponse {
    success: boolean
    data: {
        processed_files: TrainProcessedFile[]
        failed_files: { filename: string; error: string }[]
        total_files: number
        file_type: string
        parameters?: {
            has_header: boolean
            delimiter: string
            encoding: string
            question_col: number
            answer_col: number
        }
    } | null
    message: string
}

// ── Add data JSON (text only) ──
export interface AddDataJsonPayload {
    text: string
    department_id?: string
    category_id?: string
}

export interface AddDataJsonResponse {
    success: boolean
    data: {
        request_id: string
        media_id: string
        file_url: string
    } | null
    message: string
}

// ══════════════════════════════════════════════
// USER FILES / ANALYTICS
// ══════════════════════════════════════════════

// ── File item (within user data or user files detail) ──
export interface UserFileItem {
    filename: string
    id_count: number
    filepath: string
    username: string
    file_url: string | null
    media_id: string
    department_id: string | null
    category_id: string | null
}

// ── User summary item (from get-files/data) ──
export interface UserFileSummary {
    username: string
    file_count: number
    total_ids: number
    files: UserFileItem[]
}

// ── GET /documents/get-files/data response ──
export interface UserFilesDataResponse {
    success: boolean
    data: {
        items: UserFileSummary[]
        pagination: {
            totalCount: number
            pageSize: number
            currentPage: number
            totalPages?: number
            hasPrevious?: boolean
            hasNext?: boolean
        }
    }
    message: string
}

// ── GET /documents/get-user-files/{username} response ──
export interface UserFilesDetailResponse {
    success: boolean
    data: {
        files: UserFileItem[]
    }
    message: string
}

// ── Shared query params for user file endpoints ──
export interface UserFilesParams {
    page?: number
    page_size?: number
    query?: string
    department_id?: string
    category_id?: string
}

// ── DELETE /documents/delete-docs-by-username ──
export interface DeleteDocsByUsernamePayload {
    username: string
    text?: string
    department_id?: string
    category_id?: string
}
export interface DeleteDocsByUsernameResponse {
    success: boolean
    data: { target_username: string; status: string } | null
    message: string
}

// ── DELETE /documents/delete-docs-by-filename ──
export interface DeleteDocsByFilenamePayload {
    username: string
    filename: string
    text?: string
    department_id?: string
    category_id?: string
}
export interface DeleteDocsByFilenameResponse {
    success: boolean
    data: { target_username: string; filename: string; status: string } | null
    message: string
}

// ── DELETE /documents/delete-collection ──
export interface DeleteCollectionPayload {
    collection_name: string
    username?: string
    reason?: string
}
export interface DeleteCollectionResponse {
    success: boolean
    data: { message: string; collection_name: string } | null
    message: string
}

// ── GET /documents/files/docs/{username}/{filename} ──
export interface FileDocsParams {
    page?: number
    page_size?: number
    query?: string
    department_id?: string
    category_id?: string
}

// ── GET /documents/download-user-file ──
export interface DownloadUserFileParams {
    file_path?: string
    file_url?: string
    media_id?: string
    filename?: string
}

// ── DELETE /documents/request-delete-by-department ──
export interface DeleteByDepartmentPayload {
    department_id: string
    username?: string | null
}
export interface DeleteByDepartmentResponse {
    success: boolean
    data: unknown
    message: string
}

// ── DELETE /documents/request-delete-by-category ──
export interface DeleteByCategoryPayload {
    category_id: string
    username?: string | null
}
export interface DeleteByCategoryResponse {
    success: boolean
    data: unknown
    message: string
}

// ══════════════════════════════════════════════
// TENANT ANALYTICS
// ══════════════════════════════════════════════

export interface DocPerFile {
    username: string
    filename: string
    id_count: number
    department_id: string | null
    category_id: string | null
}

export interface DocPerUser {
    username: string
    file_count: number
    total_ids: number
}

export interface DocPerDepartment {
    department_id: string
    file_count: number
    total_ids: number
}

export interface DocPerCategory {
    category_id: string
    file_count: number
    total_ids: number
}

export interface TenantAnalyticsData {
    total_files: number
    total_documents: number
    docs_per_file: DocPerFile[]
    docs_per_user: DocPerUser[]
    docs_per_department: DocPerDepartment[]
    docs_per_category: DocPerCategory[]
}

export type TenantAnalyticsResponse = ApiResponse<TenantAnalyticsData>

export interface TenantAnalyticsParams {
    department_id?: string
    category_id?: string
    username?: string
    filename?: string
}

