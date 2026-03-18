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
    | "list"
    | "multi" // UI-only: accepts any file type, sends as 'images' to backend
    | "api_call"

/** Single asset with per-asset caption */
export interface MediaAssetEntry {
    asset_id: string
    caption?: string | null
}

/** Action definition used in action items and list items */
export interface ActionDefinition {
    type: string
    params?: Record<string, unknown>
}

/** Single list item entry */
export interface ListItemEntry {
    id: string
    title: string
    description?: string
    target_key?: string
    action?: ActionDefinition
}

/** Single input field for api_call — matches backend ApiCallInput */
export interface ApiCallInputField {
    key: string
    label: string
    type: string  // text | number | email | phone | select | select_api | date | image | file | api_enrichment | computed

    required?: boolean
    order?: number

    // Prompts & messages
    prompt_message?: string
    error_message?: string
    placeholder?: string
    default_value?: string | null

    // Validation
    validation_regex?: string
    min_value?: number | null
    max_value?: number | null
    min_length?: number | null
    max_length?: number | null
    type_error?: string

    // Select options (static)
    options?: { value: string; label: string; constraints?: Record<string, unknown> }[]
    display_as?: string  // interactive_list | numbered_list

    // Select API (dynamic options from API)
    options_source?: {
        url: string
        method?: string
        query_params?: Record<string, string>
        headers?: Record<string, string>
        response_path?: string
        label_field?: string
        value_field?: string
        empty_message?: string
    }

    // Image analysis
    image_analysis?: {
        enabled: boolean
        analysis_prompt?: string
        must_be_description?: string
        extract_fields?: string[]
        low_quality_message?: string
        invalid_image_message?: string
        success_message?: string
        partial_message?: string
    }

    // API enrichment (mid-flow API call)
    trigger_after?: string[]
    api_call_config?: {
        url: string
        method?: string
        body?: Record<string, unknown>
        auto_fill_fields?: Record<string, string>
        success_message?: string
        not_found_message?: string
        loading_message?: string
    }

    // Computed
    formula?: string
    display_in_summary?: boolean

    // Dependencies
    depends_on?: string[]
    show_condition?: string
    cross_validation?: { rule: string; error_message: string }[]
    filter_options?: boolean
    default_when?: Record<string, string>

    // File-specific
    accepted_types?: string[]
    max_size_mb?: number
}

/** API call content configuration — matches backend ApiCallContent */
export interface ApiCallContentConfig {
    // Endpoint
    url: string
    method: string  // GET | POST | PUT | PATCH | DELETE
    headers?: Record<string, string>
    timeout_seconds?: number
    retry_count?: number

    // Authentication
    auth_type?: string  // none | bearer | api_key | basic
    auth_config?: Record<string, string>

    // Execution mode
    execution_mode: string  // immediate | collect_data
    collection_strategy?: string  // sequential | ai_managed

    // Inputs
    inputs?: ApiCallInputField[]
    initial_message?: string

    // Request template
    body_template?: Record<string, unknown>
    query_params?: Record<string, string>

    // Confirmation
    require_confirmation?: boolean
    confirmation_template?: string

    // Response handling
    response_type?: string  // text | text_with_media | conditional
    success_template?: string
    error_template?: string
    media_url_path?: string
    media_type?: string  // image | video | document
    media_caption_template?: string
    response_mapping?: Record<string, string>
    conditional_responses?: { condition: string; template: string }[]
}

export interface MenuItemContent {
    // submenu presentation
    presentation?: { header?: string; footer?: string; button?: string }
    // text
    reply?: string
    format?: string
    // action
    action?: ActionDefinition
    // media (images / files / videos) — new assets array structure
    assets?: MediaAssetEntry[]
    // list
    text?: string
    items?: ListItemEntry[]
    // api_call — all fields from ApiCallContentConfig
    url?: string
    method?: string
    headers?: Record<string, string>
    timeout_seconds?: number
    retry_count?: number
    auth_type?: string
    auth_config?: Record<string, string>
    execution_mode?: string
    collection_strategy?: string
    inputs?: ApiCallInputField[]
    initial_message?: string
    body_template?: Record<string, unknown>
    query_params?: Record<string, string>
    require_confirmation?: boolean
    confirmation_template?: string
    response_type?: string
    success_template?: string
    error_template?: string
    media_url_path?: string
    media_type?: string
    media_caption_template?: string
    response_mapping?: Record<string, string>
    conditional_responses?: { condition: string; template: string }[]
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
    parent_id: string | null
    key: string
    type: MenuItemType
    title: string
    description?: string
    content: MenuItemContent
    order?: number
}

export interface UpdateMenuItemPayload {
    title?: string
    description?: string
    content?: MenuItemContent
    is_active?: boolean
    order?: number
}

export interface MoveItemPayload {
    new_parent_id?: string | null
    new_order: number
}

export interface ReorderItem {
    id: string
    order: number
}

export interface DuplicateItemPayload {
    new_key: string
    new_title?: string
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
    { value: "api_call", label: "استدعاء API", color: "#0288d1", icon: "globe" },
    { value: "multi", label: "وسائط متعددة", color: "#795548", icon: "paperclip" },
]
