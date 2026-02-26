import { useQuery } from "@tanstack/react-query"
import { getContactsSidebarSummary } from "../services/contacts-service"

export function useContactsSidebarSummary() {
    return useQuery({
        queryKey: ["contacts-sidebar-summary"],
        queryFn: getContactsSidebarSummary,
        refetchInterval: 30_000,
    })
}
