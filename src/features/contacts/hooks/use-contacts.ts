import { useQuery } from "@tanstack/react-query"
import { getContacts, getContactDetail, getContactsFilters } from "../services/contacts-service"
import type { ContactsQueryParams } from "../types/contacts.types"

export function useContacts(params: ContactsQueryParams) {
    return useQuery({
        queryKey: ["contacts", params],
        queryFn: () => getContacts(params),
        refetchInterval: 30_000,
    })
}

export function useContactDetail(customerId: string | null, accountId?: string) {
    return useQuery({
        queryKey: ["contact-detail", customerId, accountId],
        queryFn: () => getContactDetail(customerId!, accountId),
        enabled: !!customerId,
        staleTime: 30_000,
    })
}

export function useContactsFilters(accountId?: string) {
    return useQuery({
        queryKey: ["contacts-filters", accountId],
        queryFn: () => getContactsFilters(accountId),
        staleTime: 60_000,
    })
}
