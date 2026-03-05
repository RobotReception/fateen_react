import { useQuery } from "@tanstack/react-query"
import { getContactsSidebarSummary } from "../services/contacts-service"

export function useContactsSidebarSummary(accountId?: string) {
    return useQuery({
        queryKey: ["contacts-sidebar-summary", accountId],
        queryFn: () => getContactsSidebarSummary(accountId),
        refetchInterval: 30_000,
    })
}
