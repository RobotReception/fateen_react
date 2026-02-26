import { apiClient } from "@/lib/api-client"
import type { AnalyticsResponse } from "../types"

/** GET /analytics/general — fetch general analytics for current tenant */
export async function getGeneralAnalytics(): Promise<AnalyticsResponse> {
    const { data } = await apiClient.get<AnalyticsResponse>("/analytics/general")
    return data
}
