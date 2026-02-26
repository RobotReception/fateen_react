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
export async function getContactDetail(customerId: string): Promise<Contact> {
    const { data } = await apiClient.get(`/contacts/${customerId}`)
    return data.data
}

// ─── Update Contact ─────────────────────────────────────
// PUT /contacts/{customer_id}
export async function updateContact(
    customerId: string,
    payload: UpdateContactPayload
): Promise<Contact> {
    const { data } = await apiClient.put(`/contacts/${customerId}`, payload)
    return data.data
}

// ─── Delete Contact (Soft Delete) ───────────────────────
// DELETE /contacts/{customer_id}
export async function deleteContact(customerId: string): Promise<Contact> {
    const { data } = await apiClient.delete(`/contacts/${customerId}`)
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
    lifecycles: ContactsSidebarLifecycle[]
    teams: ContactsSidebarTeam[]
}

export async function getContactsSidebarSummary(): Promise<ContactsSidebarSummary> {
    const { data } = await apiClient.get("/contacts/sidebar-summary")
    return data.data
}
