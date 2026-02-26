import { useQuery } from "@tanstack/react-query"
import { getGeneralAnalytics } from "../services/analytics-service"

export function useAnalytics() {
    return useQuery({
        queryKey: ["analytics", "general"],
        queryFn: async () => {
            const res = await getGeneralAnalytics()
            return res.data
        },
        staleTime: 60_000,       // 1 min — avoid hammering the endpoint
        refetchOnWindowFocus: false,
    })
}
