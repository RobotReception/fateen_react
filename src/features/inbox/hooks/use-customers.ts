import { useQuery } from "@tanstack/react-query"
import { getCustomers } from "../services/inbox-service"
import type { SessionStatus } from "../types/inbox.types"

interface UseCustomersParams {
    page?: number
    page_size?: number
    platform?: string
    lifecycle?: string
    assigned_to?: string
    session_status?: SessionStatus
    account_id?: string
    team_id?: string
    is_assigned_team?: string
    is_assigned?: string
    enable_ai_q?: string
    start_date?: string
    end_date?: string
    unread_only?: boolean
    is_open?: boolean
    favorite?: boolean
    muted?: boolean
    search?: string
    include_filters?: boolean
}

export function useCustomers(params: UseCustomersParams) {
    return useQuery({
        queryKey: ["inbox-customers", params],
        queryFn: () => getCustomers({
            ...params,
            page_size: params.page_size ?? 80,
            include_filters: true,   // always fetch filter options
        }),
        refetchInterval: 15_000,
    })
}
