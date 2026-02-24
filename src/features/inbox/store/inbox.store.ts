import { create } from "zustand"
import type { Customer } from "../types/inbox.types"

export type InboxSection = "all" | "mine" | "unassigned" | `lc_${string}` | `team_${string}`
export type StatusFilter = "all" | "open" | "closed" | "pending"

// ── Advanced filters that map directly to API query params ──
export interface AdvancedFilters {
    platform?: string
    lifecycle?: string
    assigned_to?: string
    team_id?: string
    start_date?: string
    end_date?: string
    unread_only?: boolean
    favorite?: boolean
    muted?: boolean
    enable_ai_q?: string
}

interface InboxState {
    // Navigation
    activeSection: InboxSection
    setActiveSection: (s: InboxSection) => void

    // Status filter (quick pills)
    statusFilter: StatusFilter
    setStatusFilter: (s: StatusFilter) => void

    // Search
    searchQuery: string
    setSearchQuery: (q: string) => void

    // Advanced filters
    advancedFilters: AdvancedFilters
    setFilter: <K extends keyof AdvancedFilters>(key: K, value: AdvancedFilters[K]) => void
    clearFilters: () => void
    filterPanelOpen: boolean
    toggleFilterPanel: () => void

    // Sidebar collapse
    sidebarCollapsed: boolean
    toggleSidebar: () => void

    // Selection
    selectedId: string | null
    setSelectedId: (id: string | null) => void

    // Sidebar collapse
    collapsedSections: Record<string, boolean>
    toggleSection: (key: string) => void

    // Customer data (for optimistic updates)
    customers: Customer[]
    setCustomers: (list: Customer[]) => void
    updateCustomer: (partial: Partial<Customer> & { customer_id: string }) => void
}

const EMPTY_FILTERS: AdvancedFilters = {}

export const useInboxStore = create<InboxState>((set) => ({
    activeSection: "all",
    setActiveSection: (activeSection) => set({ activeSection }),

    statusFilter: "open",
    setStatusFilter: (statusFilter) => set({ statusFilter }),

    searchQuery: "",
    setSearchQuery: (searchQuery) => set({ searchQuery }),

    advancedFilters: { ...EMPTY_FILTERS },
    setFilter: (key, value) =>
        set((s) => ({
            advancedFilters: { ...s.advancedFilters, [key]: value },
        })),
    clearFilters: () => set({ advancedFilters: { ...EMPTY_FILTERS } }),
    filterPanelOpen: false,
    toggleFilterPanel: () => set((s) => ({ filterPanelOpen: !s.filterPanelOpen })),

    sidebarCollapsed: false,
    toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

    selectedId: null,
    setSelectedId: (selectedId) => set({ selectedId }),

    collapsedSections: {},
    toggleSection: (key) =>
        set((s) => ({
            collapsedSections: {
                ...s.collapsedSections,
                [key]: !s.collapsedSections[key],
            },
        })),

    customers: [],
    setCustomers: (customers) => set({ customers }),
    updateCustomer: (partial) =>
        set((state) => ({
            customers: state.customers.map((c) =>
                c.customer_id === partial.customer_id ? { ...c, ...partial } : c
            ),
        })),
}))
