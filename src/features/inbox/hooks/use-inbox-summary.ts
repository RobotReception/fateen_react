import { useQuery } from "@tanstack/react-query"
import { getSidebarSummary } from "../services/inbox-service"

export function useInboxSummary(userId?: string) {
    return useQuery({
        queryKey: ["inbox-summary", userId],
        queryFn: () => getSidebarSummary(userId),
        refetchInterval: 30_000,
    })
}
