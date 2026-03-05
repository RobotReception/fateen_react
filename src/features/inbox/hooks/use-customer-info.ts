import { useQuery } from "@tanstack/react-query"
import { getCustomerBasicInfo, getCustomerAICheck } from "../services/inbox-service"

// ─── Basic Info ─────────────────────────────────────────
// GET /customers/{id}/basic-info?account_id=
export function useCustomerBasicInfo(customerId: string | null, accountId?: string) {
    return useQuery({
        queryKey: ["customer-basic-info", customerId, accountId],
        queryFn: () => getCustomerBasicInfo(customerId!, accountId),
        enabled: !!customerId,
        staleTime: 30_000,
    })
}

// ─── AI Check ───────────────────────────────────────────
// GET /customers/{id}/ai-check?account_id=
export function useCustomerAICheck(customerId: string | null, accountId?: string) {
    return useQuery({
        queryKey: ["customer-ai-check", customerId, accountId],
        queryFn: () => getCustomerAICheck(customerId!, accountId),
        enabled: !!customerId,
    })
}
