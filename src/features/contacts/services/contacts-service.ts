import { apiClient } from "@/lib/api-client"
import type {
    ContactsResponse,
    ContactsQueryParams,
    Contact,
    UpdateContactPayload,
} from "../types/contacts.types"

// ─── List Contacts ──────────────────────────────────────
// GET /contacts
export async function getContacts(params?: ContactsQueryParams): Promise<ContactsResponse> {
    const { data } = await apiClient.get("/contacts", { params })
    return data.data
}

// ─── Get Contact Detail ─────────────────────────────────
// GET /contacts/{customer_id}
export async function getContactDetail(customerId: string, accountId?: string): Promise<Contact> {
    const { data } = await apiClient.get(`/contacts/${customerId}`, {
        params: accountId ? { account_id: accountId } : undefined,
    })
    return data.data
}

// ─── Update Contact ─────────────────────────────────────
// PUT /contacts/{customer_id}
export async function updateContact(
    customerId: string,
    payload: UpdateContactPayload,
    accountId?: string
): Promise<Contact> {
    const { data } = await apiClient.put(`/contacts/${customerId}`, payload, {
        params: accountId ? { account_id: accountId } : undefined,
    })
    return data.data
}

// ─── Update Custom Fields Only ──────────────────────────
// PUT /contacts/{customer_id}/custom-fields
export async function updateContactCustomFields(
    customerId: string,
    customFields: Record<string, string>,
    accountId?: string
): Promise<Contact> {
    const { data } = await apiClient.put(`/contacts/${customerId}/custom-fields`, {
        custom_fields: customFields,
    }, {
        params: accountId ? { account_id: accountId } : undefined,
    })
    return data.data
}

// ─── Delete Contact (Soft Delete) ───────────────────────
// DELETE /contacts/{customer_id}
export async function deleteContact(customerId: string, accountId?: string): Promise<Contact> {
    const { data } = await apiClient.delete(`/contacts/${customerId}`, {
        params: accountId ? { account_id: accountId } : undefined,
    })
    return data.data
}

// ─── Convert Customer ↔ Contact ─────────────────────────
// POST /contacts/{customer_id}/convert
export async function convertContact(customerId: string, isContact: boolean, accountId?: string) {
    const { data } = await apiClient.post(`/contacts/${customerId}/convert`, {
        is_contact: isContact,
    }, {
        params: accountId ? { account_id: accountId } : undefined,
    })
    return data.data
}

// ─── Create Contact ─────────────────────────────────────
// POST /contacts
export async function createContact(payload: {
    customer_id: string
    additional_fields?: Record<string, string>
    notes?: string
}, options?: { accountId?: string; username?: string }): Promise<Contact> {
    const { data } = await apiClient.post("/contacts", payload, {
        params: {
            ...(options?.accountId && { account_id: options.accountId }),
            ...(options?.username && { username: options.username }),
        },
    })
    return data.data
}

// ─── Statistics ─────────────────────────────────────────
// GET /contacts/stats/summary
export interface ContactsStatsSummary {
    total_contacts: number
    total_customers: number
    contacts_percentage: number
    platform_breakdown: { platform: string; count: number }[]
    recent_contacts: number
}

export async function getContactsStats(accountId?: string): Promise<ContactsStatsSummary> {
    const { data } = await apiClient.get("/contacts/stats/summary", {
        params: accountId ? { account_id: accountId } : undefined,
    })
    return data.data
}

// ─── Filters ────────────────────────────────────────────
// GET /contacts/filters
export async function getContactsFilters(accountId?: string) {
    const { data } = await apiClient.get("/contacts/filters", {
        params: accountId ? { account_id: accountId } : undefined,
    })
    return data.data
}

// ─── Sidebar Summary ────────────────────────────────────
// GET /contacts/sidebar-summary

export interface ContactsSidebarLifecycle {
    name: string
    code: string
    icon: string | null
    count: number
}

export interface ContactsSidebarTeam {
    _id: string
    team_id: string
    name: string
    description?: string
    icon?: string | null
    members: string[]
    color: string
    created_at: string
    updated_at: string
    customers: string[]
    members_count: number
    customers_count: number
    assigned_count: number
}

export interface ContactsSidebarSummary {
    all: number
    mine: number
    unassigned: number
    lifecycles: ContactsSidebarLifecycle[]
    teams: ContactsSidebarTeam[]
}

export async function getContactsSidebarSummary(accountId?: string): Promise<ContactsSidebarSummary> {
    const { data } = await apiClient.get("/contacts/sidebar-summary", {
        params: accountId ? { account_id: accountId } : undefined,
    })
    return data.data
}

// ─── Bulk Operations ────────────────────────────────────

// POST /contacts/bulk/convert
export async function bulkConvert(customerIds: string[], requestedBy: string, accountId?: string) {
    const { data } = await apiClient.post("/contacts/bulk/convert", {
        customer_ids: customerIds,
        requested_by: requestedBy,
    }, {
        params: accountId ? { account_id: accountId } : undefined,
    })
    return data.data
}

// POST /contacts/bulk/fields
export async function bulkUpdateFields(
    updates: { customer_id: string; additional_fields: Record<string, string> }[],
    accountId?: string
) {
    const { data } = await apiClient.post("/contacts/bulk/fields", { updates }, {
        params: accountId ? { account_id: accountId } : undefined,
    })
    return data.data
}

// ─── Search Customers (for conversion) ──────────────────
// GET /contacts/search/customers
export async function searchCustomersForConversion(search: string, limit = 10) {
    const { data } = await apiClient.get("/contacts/search/customers", {
        params: { search, limit },
    })
    return data.data
}

// ─── Dynamic Fields ─────────────────────────────────────

export interface DynamicField {
    field_name: string
    field_label: string
    field_type: string
    required: boolean
    default_value: string
    options: string[]
    is_active: boolean
    display_order: number
}

// GET /contacts/dynamic-fields
export async function getDynamicFields(fieldType?: string) {
    const { data } = await apiClient.get("/contacts/dynamic-fields", {
        params: fieldType ? { field_type: fieldType } : undefined,
    })
    return data.data
}

// POST /contacts/dynamic-fields
export async function createDynamicField(payload: Omit<DynamicField, "display_order"> & { display_order?: number }) {
    const { data } = await apiClient.post("/contacts/dynamic-fields", payload)
    return data.data
}

// PUT /contacts/dynamic-fields/{field_name}
export async function updateDynamicField(fieldName: string, payload: Partial<DynamicField>) {
    const { data } = await apiClient.put(`/contacts/dynamic-fields/${fieldName}`, payload)
    return data.data
}

// DELETE /contacts/dynamic-fields/{field_name}
export async function deleteDynamicField(fieldName: string) {
    const { data } = await apiClient.delete(`/contacts/dynamic-fields/${fieldName}`)
    return data.data
}

// GET /contacts/fields/required
export async function getRequiredFields() {
    const { data } = await apiClient.get("/contacts/fields/required")
    return data.data
}
