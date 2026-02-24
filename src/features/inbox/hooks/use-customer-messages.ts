import { useQuery } from "@tanstack/react-query"
import { getCustomerMessages } from "../services/inbox-service"

export function useCustomerMessages(customerId: string | null) {
    return useQuery({
        queryKey: ["customer-messages", customerId],
        queryFn: () => getCustomerMessages(customerId!, { page: 1, page_size: 50 }),
        enabled: !!customerId,
        refetchInterval: 8_000,
        select: (data) => data?.messages ?? [],
    })
}
