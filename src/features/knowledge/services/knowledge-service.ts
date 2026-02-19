import apiClient from "@/lib/api-client"
import type {
    // Departments
    DepartmentLookupResponse,
    DepartmentListResponse,
    DepartmentDetailResponse,
    CreateDepartmentPayload,
    UpdateDepartmentPayload,
    DeleteDepartmentResponse,
    LinkCategoryPayload,
    LinkCategoryResponse,
    UnlinkCategoryResponse,
    PaginatedParams,
    // Categories
    DepartmentCategoriesResponse,
    CategoryListResponse,
    CategoryDetailResponse,
    CreateCategoryPayload,
    UpdateCategoryPayload,
    DeleteCategoryResponse,
    // Documents
    SearchDocumentsResponse,
    SearchDocumentsParams,
    UpdateDocumentPayload,
    UpdateDocumentResponse,
    DeleteDocumentPayload,
    DeleteDocumentResponse,
    TrainDataResponse,
    AddDataJsonPayload,
    AddDataJsonResponse,
    // User Files / Analytics
    UserFilesDataResponse,
    UserFilesDetailResponse,
    UserFilesParams,
    FileDocsParams,
    DownloadUserFileParams,
    DeleteByDepartmentPayload,
    DeleteByDepartmentResponse,
    DeleteByCategoryPayload,
    DeleteByCategoryResponse,
    // Delete operations
    DeleteDocsByUsernamePayload,
    DeleteDocsByUsernameResponse,
    DeleteDocsByFilenamePayload,
    DeleteDocsByFilenameResponse,
    DeleteCollectionPayload,
    DeleteCollectionResponse,
    // Analytics
    TenantAnalyticsResponse,
    TenantAnalyticsParams,
} from "../types"

// ── Helper: tenant + language headers ──
function headers(tenantId: string, lang = "ar") {
    return {
        "X-Tenant-ID": tenantId,
        "Accept-Language": lang,
    }
}

/* ============================================================
   DEPARTMENTS API
   ============================================================ */

/** POST /departments/departments — create a department */
export async function createDepartment(
    payload: CreateDepartmentPayload,
    tenantId: string
): Promise<DepartmentDetailResponse> {
    const { data } = await apiClient.post<DepartmentDetailResponse>(
        "/departments/departments",
        payload,
        { headers: headers(tenantId) }
    )
    return data
}

/** GET /departments/departments — paginated list */
export async function listDepartments(
    params: PaginatedParams,
    tenantId: string
): Promise<DepartmentListResponse> {
    const { data } = await apiClient.get<DepartmentListResponse>(
        "/departments/departments",
        {
            params,
            headers: headers(tenantId),
        }
    )
    return data
}

/** GET /departments/departments/lookup — simplified list */
export async function getDepartmentsLookup(
    tenantId: string,
    isActive = true
): Promise<DepartmentLookupResponse> {
    const { data } = await apiClient.get<DepartmentLookupResponse>(
        "/departments/departments/lookup",
        {
            params: { is_active: isActive },
            headers: headers(tenantId),
        }
    )
    return data
}

/** GET /departments/departments/{department_id} — full detail */
export async function getDepartment(
    departmentId: string,
    tenantId: string
): Promise<DepartmentDetailResponse> {
    const { data } = await apiClient.get<DepartmentDetailResponse>(
        `/departments/departments/${departmentId}`,
        { headers: headers(tenantId) }
    )
    return data
}

/** PATCH /departments/departments/{department_id} — partial update */
export async function updateDepartment(
    departmentId: string,
    payload: UpdateDepartmentPayload,
    tenantId: string
): Promise<DepartmentDetailResponse> {
    const { data } = await apiClient.patch<DepartmentDetailResponse>(
        `/departments/departments/${departmentId}`,
        payload,
        { headers: headers(tenantId) }
    )
    return data
}

/** DELETE /departments/departments/{department_id} — delete */
export async function deleteDepartment(
    departmentId: string,
    tenantId: string
): Promise<DeleteDepartmentResponse> {
    const { data } = await apiClient.delete<DeleteDepartmentResponse>(
        `/departments/departments/${departmentId}`,
        { headers: headers(tenantId) }
    )
    return data
}

/** POST /departments/departments/{department_id}/categories/link — link a category */
export async function linkCategoryToDepartment(
    departmentId: string,
    payload: LinkCategoryPayload,
    tenantId: string
): Promise<LinkCategoryResponse> {
    const { data } = await apiClient.post<LinkCategoryResponse>(
        `/departments/departments/${departmentId}/categories/link`,
        payload,
        { headers: headers(tenantId) }
    )
    return data
}

/** GET /departments/departments/{department_id}/categories — linked categories */
export async function getDepartmentCategories(
    departmentId: string,
    tenantId: string
): Promise<DepartmentCategoriesResponse> {
    const { data } = await apiClient.get<DepartmentCategoriesResponse>(
        `/departments/departments/${departmentId}/categories`,
        { headers: headers(tenantId) }
    )
    return data
}

/** DELETE /departments/departments/{department_id}/categories/{category_id} — unlink */
export async function unlinkCategoryFromDepartment(
    departmentId: string,
    categoryId: string,
    tenantId: string
): Promise<UnlinkCategoryResponse> {
    const { data } = await apiClient.delete<UnlinkCategoryResponse>(
        `/departments/departments/${departmentId}/categories/${categoryId}`,
        { headers: headers(tenantId) }
    )
    return data
}

/* ============================================================
   CATEGORIES API (standalone /categories endpoints)
   ============================================================ */

/** POST /categories — create a standalone category */
export async function createCategory(
    payload: CreateCategoryPayload,
    tenantId: string
): Promise<CategoryDetailResponse> {
    const { data } = await apiClient.post<CategoryDetailResponse>(
        "/categories",
        payload,
        { headers: headers(tenantId) }
    )
    return data
}

/** GET /categories — paginated list */
export async function listCategories(
    params: PaginatedParams,
    tenantId: string
): Promise<CategoryListResponse> {
    const { data } = await apiClient.get<CategoryListResponse>(
        "/categories",
        {
            params,
            headers: headers(tenantId),
        }
    )
    return data
}

/** GET /categories/{category_id} — full detail */
export async function getCategory(
    categoryId: string,
    tenantId: string
): Promise<CategoryDetailResponse> {
    const { data } = await apiClient.get<CategoryDetailResponse>(
        `/categories/${categoryId}`,
        { headers: headers(tenantId) }
    )
    return data
}

/** PATCH /categories/{category_id} — partial update */
export async function updateCategory(
    categoryId: string,
    payload: UpdateCategoryPayload,
    tenantId: string
): Promise<CategoryDetailResponse> {
    const { data } = await apiClient.patch<CategoryDetailResponse>(
        `/categories/${categoryId}`,
        payload,
        { headers: headers(tenantId) }
    )
    return data
}

/** DELETE /categories/{category_id} — permanently delete (removes from all departments) */
export async function deleteCategory(
    categoryId: string,
    tenantId: string
): Promise<DeleteCategoryResponse> {
    const { data } = await apiClient.delete<DeleteCategoryResponse>(
        `/categories/${categoryId}`,
        { headers: headers(tenantId) }
    )
    return data
}

/* ============================================================
   DOCUMENTS API
   ============================================================ */

/** GET /documents/search-documents — search documents with filters */
export async function searchDocuments(
    params: SearchDocumentsParams,
    tenantId: string
): Promise<SearchDocumentsResponse> {
    const { data } = await apiClient.get<SearchDocumentsResponse>(
        "/documents/search-documents",
        {
            params,
            headers: headers(tenantId),
        }
    )
    return data
}

/** POST /documents/requests-update-data — update a document */
export async function updateDocument(
    payload: UpdateDocumentPayload,
    tenantId: string
): Promise<UpdateDocumentResponse> {
    const { data } = await apiClient.post<UpdateDocumentResponse>(
        "/documents/requests-update-data",
        payload,
        { headers: headers(tenantId) }
    )
    return data
}

/** DELETE /documents/delete-doc-by-id — delete one or more documents */
export async function deleteDocuments(
    payload: DeleteDocumentPayload,
    tenantId: string
): Promise<DeleteDocumentResponse> {
    const { data } = await apiClient.delete<DeleteDocumentResponse>(
        "/documents/delete-doc-by-id",
        {
            data: payload,
            headers: headers(tenantId),
        }
    )
    return data
}

/** POST /documents/train-data-request — upload TXT/CSV files for training */
export async function trainDataRequest(
    formData: FormData,
    tenantId: string
): Promise<TrainDataResponse> {
    const { data } = await apiClient.post<TrainDataResponse>(
        "/documents/train-data-request",
        formData,
        {
            headers: {
                ...headers(tenantId),
                "Content-Type": "multipart/form-data",
            },
        }
    )
    return data
}

/** POST /training/train-txt-request — upload TXT-only files for training */
export async function trainTxtRequest(
    formData: FormData,
    tenantId: string
): Promise<TrainDataResponse> {
    const { data } = await apiClient.post<TrainDataResponse>(
        "/training/train-txt-request",
        formData,
        {
            headers: {
                ...headers(tenantId),
                "Content-Type": "multipart/form-data",
            },
        }
    )
    return data
}

/** POST /training/train-csv-request — upload CSV-only files for training */
export async function trainCsvRequest(
    formData: FormData,
    tenantId: string
): Promise<TrainDataResponse> {
    const { data } = await apiClient.post<TrainDataResponse>(
        "/training/train-csv-request",
        formData,
        {
            headers: {
                ...headers(tenantId),
                "Content-Type": "multipart/form-data",
            },
        }
    )
    return data
}

/** GET /training/check-data-model-health — check data model API health */
export async function checkDataModelHealth(
    tenantId: string
): Promise<{ success: boolean; message: string; data: { status: string; details?: Record<string, unknown> } | null }> {
    const { data } = await apiClient.get(
        "/training/check-data-model-health",
        { headers: headers(tenantId) }
    )
    return data
}

/** POST /documents/requests-add-data-json — add text-only data */
export async function addDataJson(
    payload: AddDataJsonPayload,
    tenantId: string
): Promise<AddDataJsonResponse> {
    const { data } = await apiClient.post<AddDataJsonResponse>(
        "/documents/requests-add-data-json",
        payload,
        { headers: headers(tenantId) }
    )
    return data
}

/* ============================================================
   USER FILES / ANALYTICS API
   ============================================================ */

/** GET /documents/get-files/data — list users with file counts */
export async function getUserFilesData(
    params: UserFilesParams,
    tenantId: string
): Promise<UserFilesDataResponse> {
    const { data } = await apiClient.get<UserFilesDataResponse>(
        "/documents/get-files/data",
        {
            params,
            headers: headers(tenantId),
        }
    )
    return data
}

/** GET /documents/get-user-files/{username} — get files for a specific user */
export async function getUserFiles(
    username: string,
    params: UserFilesParams,
    tenantId: string
): Promise<UserFilesDetailResponse> {
    const { data } = await apiClient.get<UserFilesDetailResponse>(
        `/documents/get-user-files/${encodeURIComponent(username)}`,
        {
            params,
            headers: headers(tenantId),
        }
    )
    return data
}

/* ============================================================
   DELETE OPERATIONS
   ============================================================ */

/** DELETE /documents/delete-docs-by-username — delete all docs for a user */
export async function deleteDocsByUsername(
    payload: DeleteDocsByUsernamePayload,
    tenantId: string
): Promise<DeleteDocsByUsernameResponse> {
    const { data } = await apiClient.delete<DeleteDocsByUsernameResponse>(
        "/documents/delete-docs-by-username",
        {
            data: payload,
            headers: headers(tenantId),
        }
    )
    return data
}

/** DELETE /documents/delete-docs-by-filename — delete docs for a specific file */
export async function deleteDocsByFilename(
    payload: DeleteDocsByFilenamePayload,
    tenantId: string
): Promise<DeleteDocsByFilenameResponse> {
    const { data } = await apiClient.delete<DeleteDocsByFilenameResponse>(
        "/documents/delete-docs-by-filename",
        {
            data: payload,
            headers: headers(tenantId),
        }
    )
    return data
}

/** DELETE /documents/delete-collection — delete an entire collection */
export async function deleteCollection(
    payload: DeleteCollectionPayload,
    tenantId: string
): Promise<DeleteCollectionResponse> {
    const { data } = await apiClient.delete<DeleteCollectionResponse>(
        "/documents/delete-collection",
        {
            data: payload,
            headers: headers(tenantId),
        }
    )
    return data
}

/** DELETE /documents/request-delete-collection-admin — delete all data (admin) */
export async function requestDeleteCollectionAdmin(
    tenantId: string
): Promise<DeleteCollectionResponse> {
    const { data } = await apiClient.delete<DeleteCollectionResponse>(
        "/documents/request-delete-collection-admin",
        {
            headers: headers(tenantId),
        }
    )
    return data
}

/** GET /documents/files/docs/{username}/{filename} — get document records for a specific user file */
export async function getFileDocs(
    username: string,
    filename: string,
    params: FileDocsParams,
    tenantId: string
): Promise<SearchDocumentsResponse> {
    const { data } = await apiClient.get<SearchDocumentsResponse>(
        `/documents/files/docs/${encodeURIComponent(username)}/${encodeURIComponent(filename)}`,
        {
            params,
            headers: headers(tenantId),
        }
    )
    return data
}

/** GET /documents/download-user-file — download a user file */
export async function downloadUserFile(
    params: DownloadUserFileParams,
    tenantId: string
): Promise<Blob> {
    const { data } = await apiClient.get(
        "/documents/download-user-file",
        {
            params,
            headers: headers(tenantId),
            responseType: "blob",
        }
    )
    return data
}

/** DELETE /documents/request-delete-by-department — delete all docs in a department */
export async function requestDeleteByDepartment(
    payload: DeleteByDepartmentPayload,
    tenantId: string
): Promise<DeleteByDepartmentResponse> {
    const { data } = await apiClient.delete<DeleteByDepartmentResponse>(
        "/documents/request-delete-by-department",
        {
            data: payload,
            headers: headers(tenantId),
        }
    )
    return data
}

/** DELETE /documents/request-delete-by-category — delete all docs in a category */
export async function requestDeleteByCategory(
    payload: DeleteByCategoryPayload,
    tenantId: string
): Promise<DeleteByCategoryResponse> {
    const { data } = await apiClient.delete<DeleteByCategoryResponse>(
        "/documents/request-delete-by-category",
        {
            data: payload,
            headers: headers(tenantId),
        }
    )
    return data
}

/* ============================================================
   TENANT ANALYTICS API
   ============================================================ */

/** GET /documents/files/analytics/tenant — tenant-level document analytics */
export async function getTenantAnalytics(
    params: TenantAnalyticsParams,
    tenantId: string
): Promise<TenantAnalyticsResponse> {
    const { data } = await apiClient.get<TenantAnalyticsResponse>(
        "/documents/files/analytics/tenant",
        {
            params,
            headers: headers(tenantId),
        }
    )
    return data
}

