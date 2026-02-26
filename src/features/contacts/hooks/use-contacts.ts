import { useQuery } from "@tanstack/react-query"
import { getContacts, getContactDetail } from "../services/contacts-service"
import type { ContactsQueryParams } from "../types/contacts.types"

export function useContacts(params: ContactsQueryParams) {
    return useQuery({
        queryKey: ["contacts", params],
        queryFn: () => getContacts(params),
        refetchInterval: 30_000,
    })
}

export function useContactDetail(customerId: string | null) {
    return useQuery({
        queryKey: ["contact-detail", customerId],
        queryFn: () => getContactDetail(customerId!),
        enabled: !!customerId,
    })
}
