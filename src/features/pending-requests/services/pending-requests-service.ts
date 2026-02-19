import apiClient from "@/lib/api-client"
import type {
    GetPendingOrdersParams,
    GetPendingOrdersResponse,
    SearchPendingOrdersParams,
    SearchPendingOrdersResponse,
    GetRequestDetailsResponse,
    ApproveRejectResponse,
} from "../types"

// ── Helper: tenant + language headers ──
function headers(tenantId: string, lang = "ar") {
    return {
        "X-Tenant-ID": tenantId,
        "Accept-Language": lang,
    }
}

/* ============================================================
   PENDING REQUESTS API
   ============================================================ */

/** GET /get-pending-orders — paginated list */
export async function getPendingOrders(
    params: GetPendingOrdersParams,
    tenantId: string
): Promise<GetPendingOrdersResponse> {
    const { data } = await apiClient.get<GetPendingOrdersResponse>(
        "/get-pending-orders",
        { params, headers: headers(tenantId) }
    )
    return data
}

/** GET /search-pending-orders — search with filters */
export async function searchPendingOrders(
    params: SearchPendingOrdersParams,
    tenantId: string
): Promise<SearchPendingOrdersResponse> {
    const { data } = await apiClient.get<SearchPendingOrdersResponse>(
        "/pending/search-pending-orders",
        { params, headers: headers(tenantId) }
    )
    return data
}

/** GET /get-request-details — single request details */
export async function getRequestDetails(
    requestId: string,
    tenantId: string
): Promise<GetRequestDetailsResponse> {
    const { data } = await apiClient.get<GetRequestDetailsResponse>(
        "/pending/get-request-details",
        { params: { request_id: requestId }, headers: headers(tenantId) }
    )
    return data
}

/** POST /process-approve — approve a pending request */
export async function processApprove(
    requestId: string,
    tenantId: string
): Promise<ApproveRejectResponse> {
    const { data } = await apiClient.post<ApproveRejectResponse>(
        "/pending/process-approve",
        null,
        {
            params: { request_id: requestId },
            headers: { ...headers(tenantId), "Content-Type": "application/x-www-form-urlencoded" },
        }
    )
    return data
}

/** POST /process-reject — reject a pending request */
export async function processReject(
    requestId: string,
    rejectionReason: string,
    tenantId: string
): Promise<ApproveRejectResponse> {
    const { data } = await apiClient.post<ApproveRejectResponse>(
        "/pending/process-reject",
        null,
        {
            params: { request_id: requestId, rejection_reason: rejectionReason },
            headers: { ...headers(tenantId), "Content-Type": "application/x-www-form-urlencoded" },
        }
    )
    return data
}

/** GET /download-request-train-file — download the training file (blob) */
export async function downloadRequestTrainFile(
    requestId: string,
    tenantId: string
): Promise<Blob> {
    const { data } = await apiClient.get<Blob>(
        "/pending/download-request-train-file",
        {
            params: { request_id: requestId },
            headers: headers(tenantId),
            responseType: "blob",
        }
    )
    return data
}
