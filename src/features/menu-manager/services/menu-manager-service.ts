import apiClient from "@/lib/api-client"
import type {
    ApiResponse,
    Template,
    TemplatesListData,
    CreateTemplatePayload,
    UpdateTemplatePayload,
    MenuTreeNode,
    ItemsListData,
    MenuItem,
    CreateMenuItemPayload,
    UpdateMenuItemPayload,
    MoveItemPayload,
    ReorderItem,
    DuplicateItemPayload,
    Assignment,
    AssignmentsListData,
    CreateAssignmentPayload,
    UpdateAssignmentPayload,
    AccountGroup,
    GroupsListData,
    CreateGroupPayload,
    UpdateGroupPayload,
    AccountMainMenu,
    AccountMenuItemDetail,
    CompiledMenuData,
} from "../types"

const BASE = "/menu-manager"

/* ============================================================
   TEMPLATES API
   ============================================================ */

export async function listTemplates(params?: {
    page?: number
    limit?: number
    status?: string
    include_deleted?: boolean
}): Promise<ApiResponse<TemplatesListData>> {
    const { data } = await apiClient.get(`${BASE}/templates`, { params })
    return data
}

export async function getTemplate(
    templateId: string,
    includeDeleted = false
): Promise<ApiResponse<Template>> {
    const { data } = await apiClient.get(`${BASE}/templates/${templateId}`, {
        params: { include_deleted: includeDeleted },
    })
    return data
}

export async function createTemplate(
    payload: CreateTemplatePayload
): Promise<ApiResponse<Template>> {
    const { data } = await apiClient.post(`${BASE}/templates`, payload)
    return data
}

export async function updateTemplate(
    templateId: string,
    payload: UpdateTemplatePayload
): Promise<ApiResponse<Template>> {
    const { data } = await apiClient.put(
        `${BASE}/templates/${templateId}`,
        payload
    )
    return data
}

export async function deleteTemplate(
    templateId: string
): Promise<ApiResponse<{ message: string }>> {
    const { data } = await apiClient.delete(`${BASE}/templates/${templateId}`)
    return data
}

/* ============================================================
   MENU ITEMS / TREE API
   ============================================================ */

export async function getTemplateTree(
    templateId: string,
    params?: { format?: string; include_assets?: boolean; include_inactive?: boolean; start_key?: string }
): Promise<ApiResponse<MenuTreeNode>> {
    const { data } = await apiClient.get(
        `${BASE}/templates/${templateId}/tree`,
        { params }
    )
    return data
}

export async function listItems(
    templateId: string,
    includeDeleted = false
): Promise<ApiResponse<ItemsListData>> {
    const { data } = await apiClient.get(
        `${BASE}/templates/${templateId}/items`,
        { params: { include_deleted: includeDeleted } }
    )
    return data
}

export async function getItem(
    templateId: string,
    itemId: string,
    includeDeleted = false
): Promise<ApiResponse<MenuItem>> {
    const { data } = await apiClient.get(
        `${BASE}/templates/${templateId}/items/${itemId}`,
        { params: { include_deleted: includeDeleted } }
    )
    return data
}

export async function createItem(
    templateId: string,
    payload: CreateMenuItemPayload
): Promise<ApiResponse<MenuItem>> {
    const { data } = await apiClient.post(
        `${BASE}/templates/${templateId}/items`,
        payload
    )
    return data
}

export async function updateItem(
    templateId: string,
    itemId: string,
    payload: UpdateMenuItemPayload
): Promise<ApiResponse<MenuItem>> {
    const { data } = await apiClient.put(
        `${BASE}/templates/${templateId}/items/${itemId}`,
        payload
    )
    return data
}

export async function deleteItem(
    templateId: string,
    itemId: string
): Promise<ApiResponse<{ message: string }>> {
    const { data } = await apiClient.delete(
        `${BASE}/templates/${templateId}/items/${itemId}`
    )
    return data
}

export async function moveItem(
    templateId: string,
    itemId: string,
    payload: MoveItemPayload
): Promise<ApiResponse<MenuItem>> {
    const { data } = await apiClient.post(
        `${BASE}/templates/${templateId}/items/${itemId}/move`,
        payload
    )
    return data
}

export async function reorderItems(
    templateId: string,
    parentId: string,
    items: ReorderItem[]
): Promise<ApiResponse<{ updated_count: number }>> {
    const { data } = await apiClient.post(
        `${BASE}/templates/${templateId}/items/reorder`,
        { items },
        { params: { parent_id: parentId } }
    )
    return data
}

export async function duplicateItem(
    templateId: string,
    itemId: string,
    payload: DuplicateItemPayload
): Promise<ApiResponse<MenuItem>> {
    const { data } = await apiClient.post(
        `${BASE}/templates/${templateId}/items/${itemId}/duplicate`,
        payload
    )
    return data
}

export async function deleteItemAsset(
    templateId: string,
    itemId: string,
    assetId: string
): Promise<ApiResponse<{ message: string }>> {
    const { data } = await apiClient.delete(
        `${BASE}/templates/${templateId}/items/${itemId}/assets/${assetId}`
    )
    return data
}

/* ============================================================
   ASSIGNMENTS API
   ============================================================ */

export async function listAssignments(params?: {
    page?: number
    limit?: number
    assignment_type?: string
    target_id?: string
    template_id?: string
    menu_key?: string
    active_only?: boolean
}): Promise<ApiResponse<AssignmentsListData>> {
    const { data } = await apiClient.get(`${BASE}/assignments`, { params })
    return data
}

export async function getAssignment(
    assignmentId: string
): Promise<ApiResponse<Assignment>> {
    const { data } = await apiClient.get(
        `${BASE}/assignments/${assignmentId}`
    )
    return data
}

export async function createAssignment(
    payload: CreateAssignmentPayload
): Promise<ApiResponse<Assignment>> {
    const { data } = await apiClient.post(`${BASE}/assignments`, payload)
    return data
}

export async function updateAssignment(
    assignmentId: string,
    payload: UpdateAssignmentPayload
): Promise<ApiResponse<Assignment>> {
    const { data } = await apiClient.put(
        `${BASE}/assignments/${assignmentId}`,
        payload
    )
    return data
}

export async function deleteAssignment(
    assignmentId: string
): Promise<ApiResponse<{ status: string; message: string; cache_invalidated: boolean }>> {
    const { data } = await apiClient.delete(
        `${BASE}/assignments/${assignmentId}`
    )
    return data
}

/* ============================================================
   ACCOUNT GROUPS API
   ============================================================ */

export async function listGroups(params?: {
    page?: number
    limit?: number
    active_only?: boolean
}): Promise<ApiResponse<GroupsListData>> {
    const { data } = await apiClient.get(`${BASE}/account-groups`, { params })
    return data
}

export async function getGroup(
    groupId: string
): Promise<ApiResponse<AccountGroup>> {
    const { data } = await apiClient.get(`${BASE}/account-groups/${groupId}`)
    return data
}

export async function createGroup(
    payload: CreateGroupPayload
): Promise<ApiResponse<AccountGroup>> {
    const { data } = await apiClient.post(`${BASE}/account-groups`, payload)
    return data
}

export async function updateGroup(
    groupId: string,
    payload: UpdateGroupPayload
): Promise<ApiResponse<AccountGroup>> {
    const { data } = await apiClient.put(
        `${BASE}/account-groups/${groupId}`,
        payload
    )
    return data
}

export async function deleteGroup(
    groupId: string
): Promise<ApiResponse<{ status: string; message: string; affected_assignments: number; cache_invalidated: boolean }>> {
    const { data } = await apiClient.delete(
        `${BASE}/account-groups/${groupId}`
    )
    return data
}

export async function addAccountsToGroup(
    groupId: string,
    accountIds: string[]
): Promise<ApiResponse<{ status: string; message: string; added_count: number; total_accounts: number; cache_invalidated: boolean }>> {
    const { data } = await apiClient.post(
        `${BASE}/account-groups/${groupId}/accounts`,
        { account_ids: accountIds }
    )
    return data
}

export async function removeAccountsFromGroup(
    groupId: string,
    accountIds: string[]
): Promise<ApiResponse<{ status: string; message: string; removed_count: number; total_accounts: number; cache_invalidated: boolean }>> {
    const { data } = await apiClient.delete(
        `${BASE}/account-groups/${groupId}/accounts`,
        { data: { account_ids: accountIds } }
    )
    return data
}

/* ============================================================
   ACCOUNT MENUS (Runtime / Preview)
   ============================================================ */

export async function getAccountMainMenu(
    accountId: string
): Promise<ApiResponse<AccountMainMenu>> {
    const { data } = await apiClient.get(
        `${BASE}/accounts/${accountId}/menu/main`
    )
    return data
}

export async function getAccountMenuItem(
    accountId: string,
    itemIdOrKey: string
): Promise<ApiResponse<AccountMenuItemDetail>> {
    const { data } = await apiClient.get(
        `${BASE}/accounts/${accountId}/menu/items/${itemIdOrKey}`
    )
    return data
}

export async function getAccountMenuSiblings(
    accountId: string,
    itemIdOrKey: string
): Promise<ApiResponse<{ header: string; footer: string; button: string; items: AccountMainMenu["items"] }>> {
    const { data } = await apiClient.get(
        `${BASE}/accounts/${accountId}/menu/items/${itemIdOrKey}/siblings`
    )
    return data
}

export async function getCompiledMenu(
    accountId: string,
    menuKey: string = "root"
): Promise<ApiResponse<CompiledMenuData>> {
    const { data } = await apiClient.get(
        `${BASE}/accounts/${accountId}/menus/${menuKey}/compiled`
    )
    return data
}

export async function getCompiledMenuLegacy(
    menuId: string,
    accountId?: string
): Promise<ApiResponse<CompiledMenuData>> {
    const { data } = await apiClient.get(
        `${BASE}/menus/${menuId}/compiled`,
        { params: accountId ? { account_id: accountId } : undefined }
    )
    return data
}

export async function clearAccountCache(
    accountId: string,
    menuKey: string = "root"
): Promise<ApiResponse<{ message: string; account_id: string; menu_key: string }>> {
    const { data } = await apiClient.delete(
        `${BASE}/cache/accounts/${accountId}/menus`,
        { params: { menu_key: menuKey } }
    )
    return data
}

export async function clearTemplateCache(
    templateId: string
): Promise<ApiResponse<{ message: string; template_id: string; invalidated_count: number }>> {
    const { data } = await apiClient.delete(
        `${BASE}/cache/templates/${templateId}`
    )
    return data
}

/* ============================================================
   MEDIA API
   ============================================================ */

export interface MediaPublicUrlData {
    media_id: string
    url: string
}

export interface MediaUploadData {
    media_id: string
    proxy_url: string
    public_url: string
    filename: string
    original_filename: string
    saved_filename: string
    file_size: number
}

export interface MediaInfoData {
    media_id: string
    content_type: string
    content_length: number
    last_modified: string
    etag: string
}

export async function getMediaPublicUrl(
    mediaId: string
): Promise<ApiResponse<MediaPublicUrlData>> {
    const { data } = await apiClient.get(`/media/${mediaId}/public-url`)
    return data
}

export async function uploadMedia(
    file: File,
    options?: {
        platform?: string
        owner_type?: string
        owner_id?: string
        source?: string
        tags?: string
    }
): Promise<ApiResponse<MediaUploadData>> {
    const formData = new FormData()
    formData.append("file", file)
    if (options?.platform) formData.append("platform", options.platform)
    if (options?.owner_type) formData.append("owner_type", options.owner_type)
    if (options?.owner_id) formData.append("owner_id", options.owner_id)
    if (options?.source) formData.append("source", options.source)
    if (options?.tags) formData.append("tags", options.tags)

    const { data } = await apiClient.post("/media/upload", formData, {
        timeout: 120000, // 2 minutes for large video uploads
    })
    return data
}

export async function getMediaInfo(
    mediaId: string
): Promise<ApiResponse<MediaInfoData>> {
    const { data } = await apiClient.get(`/media/${mediaId}/info`)
    return data
}
