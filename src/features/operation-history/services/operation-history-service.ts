import apiClient from "@/lib/api-client"
import type {
    SearchOperationsParams,
    SearchOperationsResponse,
    GetOperationDetailsResponse,
    DownloadCsvParams,
} from "../types"

// ── Helper: tenant + language headers ──
function headers(tenantId: string, lang = "ar") {
    return {
        "X-Tenant-ID": tenantId,
        "Accept-Language": lang,
    }
}

/* ============================================================
   OPERATION HISTORY API
   ============================================================ */

/** GET /search-operations — search with filters (also used as main list) */
export async function searchOperations(
    params: SearchOperationsParams,
    tenantId: string
): Promise<SearchOperationsResponse> {
    const { data } = await apiClient.get<SearchOperationsResponse>(
        "/history/search-operations",
        { params, headers: headers(tenantId) }
    )
    return data
}

/** GET /get-operation-details — single operation details */
export async function getOperationDetails(
    operationId: string,
    tenantId: string
): Promise<GetOperationDetailsResponse> {
    const { data } = await apiClient.get<GetOperationDetailsResponse>(
        "/history/get-operation-details",
        { params: { operation_id: operationId }, headers: headers(tenantId) }
    )
    return data
}

/** GET /download-operations-csv — download CSV export */
export async function downloadOperationsCsv(
    params: DownloadCsvParams,
    tenantId: string
): Promise<Blob> {
    const { data } = await apiClient.get<Blob>(
        "/history/download-operations-csv",
        {
            params,
            headers: headers(tenantId),
            responseType: "blob",
        }
    )
    return data
}

/** GET /download-operation-train-file — download training file */
export async function downloadOperationTrainFile(
    operationId: string,
    tenantId: string
): Promise<Blob> {
    const { data } = await apiClient.get<Blob>(
        "/history/download-operation-train-file",
        {
            params: { operation_id: operationId },
            headers: headers(tenantId),
            responseType: "blob",
        }
    )
    return data
}
