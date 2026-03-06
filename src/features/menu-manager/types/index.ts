// ══════════════════════════════════════════════════════════════
//  Menu Manager — TypeScript Types (matches actual API)
// ══════════════════════════════════════════════════════════════

// ── Shared API response wrapper ──

export interface ApiResponse<T> {
    success: boolean
    message: string
    data: T
}

export interface PaginationInfo {
    page: number
    limit: number
    total: number
    pages: number
}

// ── Templates ──

export type TemplateStatus = "draft" | "published" | "archived"

export interface TemplateMetadata {
    header?: string
    footer?: string
    button?: string
}

export interface Template {
    template_id: string
    tenant_id: string
    name: string
    description?: string | null
    metadata?: TemplateMetadata | null
    status: TemplateStatus
    root_menu_id?: string
    created_at: string
    updated_at: string
    deleted_at?: string | null
    created_by?: string
}

export interface TemplatesListData {
    templates: Template[]
    pagination: PaginationInfo
}

export interface CreateTemplatePayload {
    name: string
    description?: string
    metadata?: TemplateMetadata
    created_by?: string
}

export interface UpdateTemplatePayload {
    name?: string
    description?: string
    status?: TemplateStatus
    metadata?: TemplateMetadata
}

// ── Menu Items ──

export type MenuItemType =
    | "submenu"
    | "text"
    | "action"
    | "images"
    | "files"
    | "videos"
    | "buttons"
    | "list"
    | "quick_reply"

export interface MenuItemContent {
    // submenu presentation
    presentation?: { header?: string; footer?: string; button?: string }
    // text
    reply?: string
    format?: string
    // action
    action?: { type: string; params?: Record<string, unknown> }
    // media
    reply_after_media?: string | null
    asset_ids?: string[]
    // images (new format)
    caption?: string
    images?: { url: string; alt?: string }[]
    // files (new format)
    files?: { url: string; filename: string; mime_type?: string }[]
    // buttons (new format)
    buttons?: { type: "url" | "reply"; title: string; value: string }[]
    // generic fallback
    [key: string]: unknown
}

export interface MenuItem {
    id: string
    item_id?: string
    tenant_id?: string
    template_id: string
    root_id?: string
    parent_id: string | null
    key: string
    type: MenuItemType
    title: string
    description?: string | null
    content: MenuItemContent
    order: number
    is_active: boolean
    created_at?: string
    updated_at?: string
    deleted_at?: string | null
}

/** Tree node returned by GET /templates/{id}/tree — { item, children } wrapper */
export interface MenuTreeNode {
    item: MenuItem
    children: MenuTreeNode[]
}

export interface ItemsListData {
    items: MenuItem[]
    count: number
}

export interface CreateMenuItemPayload {
    parent_id: string
    key?: string
    type: MenuItemType
    title: string
    description?: string
    content?: MenuItemContent
    is_active?: boolean
    order?: number
    // submenu-specific (API also accepts top-level)
    header?: string
    footer?: string
    button?: string
}

export interface UpdateMenuItemPayload {
    key?: string
    title?: string
    description?: string
    type?: MenuItemType
    content?: MenuItemContent
    is_active?: boolean
    order?: number
    parent_id?: string
    header?: string
    footer?: string
    button?: string
}

export interface MoveItemPayload {
    new_parent_id?: string | null
    new_order?: number
}

export interface ReorderItem {
    id: string
    order: number
}

// ── Assignments ──

export type AssignmentType = "account" | "group" | "tenant"

export interface AssignmentCustomizations {
    items?: { template_item_id: string; title?: string; enabled: boolean }[]
    metadata?: TemplateMetadata | null
}

export interface Assignment {
    assignment_id: string
    tenant?: string
    assignment_type: AssignmentType
    target_id: string
    template_id: string
    menu_key?: string
    priority: number
    customizations?: AssignmentCustomizations
    is_active: boolean
    effective_from?: string | null
    effective_until?: string | null
    created_at: string
    updated_at: string
    created_by?: string
}

export interface AssignmentsListData {
    assignments: Assignment[]
    pagination: PaginationInfo
}

export interface CreateAssignmentPayload {
    assignment_type: AssignmentType
    target_id: string
    template_id: string
    menu_key?: string
    priority?: number
    is_active?: boolean
    customizations?: AssignmentCustomizations
    effective_from?: string
    effective_until?: string
}

export interface UpdateAssignmentPayload {
    template_id?: string
    menu_key?: string
    priority?: number
    is_active?: boolean
    customizations?: AssignmentCustomizations
    effective_from?: string | null
    effective_until?: string | null
}

// ── Account Groups ──

export interface AccountGroup {
    group_id: string
    tenant?: string
    name: string
    description?: string
    account_ids: string[]
    accounts_count?: number
    is_active?: boolean
    created_at: string
    updated_at: string
    created_by?: string
}

export interface GroupsListData {
    groups: AccountGroup[]
    pagination: PaginationInfo
}

export interface CreateGroupPayload {
    name: string
    description: string
    account_ids: string[]
}

export interface UpdateGroupPayload {
    name?: string
    description?: string
    is_active?: boolean
}

// ── Account Menus (Runtime) ──

export interface AccountMainMenu {
    menu_id: string
    template_id: string
    root_id: string
    header?: string
    footer?: string
    button?: string
    items: {
        id: string
        key: string
        title: string
        description?: string
        type: string
        order: number
    }[]
}

export interface AccountMenuItemDetail {
    id: string
    parent_id: string | null
    key: string
    title: string
    type: string
    order: number
    header?: string
    footer?: string
    button?: string
    items?: AccountMainMenu["items"]
    content?: MenuItemContent
}

// ── Compiled Menu ──

export interface CompiledMenuData {
    v: number
    tenant: string
    account_id: string
    menu_key: string
    template_id: string
    assignment_id: string
    title: string
    type: string
    content: Record<string, unknown>
    items: unknown[]
    footer?: string
    button?: string
    header?: string
    compiled_at: string
    cache_ttl: number
}

// ── Menu Item Type Config (UI) ──

export interface MenuItemTypeConfig {
    value: MenuItemType
    label: string
    color: string
    icon: string
}

export const MENU_ITEM_TYPES: MenuItemTypeConfig[] = [
    { value: "submenu", label: "قائمة فرعية", color: "#1976d2", icon: "folder" },
    { value: "text", label: "نص", color: "#2e7d32", icon: "text" },
    { value: "action", label: "إجراء", color: "#ed6c02", icon: "zap" },
    { value: "images", label: "صور", color: "#e91e63", icon: "image" },
    { value: "files", label: "ملفات", color: "#9c27b0", icon: "file" },
    { value: "videos", label: "فيديوهات", color: "#f44336", icon: "video" },
    { value: "buttons", label: "أزرار", color: "#7b1fa2", icon: "mouse-pointer" },
    { value: "list", label: "قائمة", color: "#00796b", icon: "list" },
    { value: "quick_reply", label: "رد سريع", color: "#009688", icon: "reply" },
]
