import { create } from "zustand"

export type ContactsSection = "all" | `lc_${string}` | `team_${string}` | `seg_${string}`

export interface ContactsFilters {
    platform?: string
    session_status?: string
    assigned_to?: string
    lifecycle?: string
    tags?: string
    enable_ai?: boolean
    conversation_status?: string
}

interface ContactsState {
    // Navigation
    activeSection: ContactsSection
    setActiveSection: (s: ContactsSection) => void

    // Search
    searchQuery: string
    setSearchQuery: (q: string) => void

    // Filters
    filters: ContactsFilters
    setFilter: <K extends keyof ContactsFilters>(key: K, value: ContactsFilters[K]) => void
    clearFilters: () => void
    filterPanelOpen: boolean
    toggleFilterPanel: () => void

    // Selection
    selectedContactId: string | null
    setSelectedContactId: (id: string | null) => void

    // Pagination
    currentPage: number
    pageSize: number
    setCurrentPage: (p: number) => void
    setPageSize: (s: number) => void

    // Sort
    sortBy: string
    sortOrder: "asc" | "desc"
    setSortBy: (field: string) => void
    setSortOrder: (order: "asc" | "desc") => void

    // Sidebar collapse
    sidebarCollapsed: boolean
    toggleSidebar: () => void
    collapsedSections: Record<string, boolean>
    toggleCollapsedSection: (key: string) => void
}

const EMPTY_FILTERS: ContactsFilters = {}

export const useContactsStore = create<ContactsState>((set) => ({
    activeSection: "all",
    setActiveSection: (activeSection) => set({ activeSection, currentPage: 1 }),

    searchQuery: "",
    setSearchQuery: (searchQuery) => set({ searchQuery, currentPage: 1 }),

    filters: { ...EMPTY_FILTERS },
    setFilter: (key, value) =>
        set((s) => ({ filters: { ...s.filters, [key]: value }, currentPage: 1 })),
    clearFilters: () => set({ filters: { ...EMPTY_FILTERS }, currentPage: 1 }),
    filterPanelOpen: false,
    toggleFilterPanel: () => set((s) => ({ filterPanelOpen: !s.filterPanelOpen })),

    selectedContactId: null,
    setSelectedContactId: (selectedContactId) => set({ selectedContactId }),

    currentPage: 1,
    pageSize: 25,
    setCurrentPage: (currentPage) => set({ currentPage }),
    setPageSize: (pageSize) => set({ pageSize, currentPage: 1 }),

    sortBy: "updated_at",
    sortOrder: "desc",
    setSortBy: (sortBy) => set({ sortBy }),
    setSortOrder: (sortOrder) => set({ sortOrder }),

    sidebarCollapsed: false,
    toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    collapsedSections: {},
    toggleCollapsedSection: (key) =>
        set((s) => ({
            collapsedSections: { ...s.collapsedSections, [key]: !s.collapsedSections[key] },
        })),
}))
