/**
 * Bitwise Permissions System
 * 
 * كل صلاحية تُمثَّل كـ bit واحد. يتم التحقق باستخدام Bitwise AND (&).
 * 
 * المستوى الأول: صلاحية دخول الصفحة → (totalPages & PAGE_BIT) !== 0
 * المستوى الثاني: صلاحية إجراء داخل الصفحة → (totalValue & ACTION_BIT) !== 0
 */

// ══════════════════════════════════════════════════════════════
//  PAGE BITS — مطابقة لـ sections[].base_bit في seed_permissions_data.json
// ══════════════════════════════════════════════════════════════

export const PAGE_BITS = {
    CONTACT_FIELDS: 1,
    CONTACTS: 2,
    CUSTOMERS: 4,
    DOCUMENT_MANAGEMENT: 16,
    LIFECYCLES: 32,
    MENUS: 64,
    OPERATION_HISTORY: 128,
    PENDING_REQUESTS: 256,
    PERMISSION_ADMIN: 512,
    ROLES: 1024,
    SNIPPETS: 2048,
    TAGS: 4096,
    TEAMS: 8192,
    TRAIN_REQUESTS: 16384,
    ADMIN_USERS: 32768,
    AUTH_ADMIN: 65536,
    CHANNELS: 131072,
    DOCUMENT_ANALYTICS: 262144,
} as const

export type PageBit = (typeof PAGE_BITS)[keyof typeof PAGE_BITS]

// ══════════════════════════════════════════════════════════════
//  ACTION BITS — مطابقة لـ action_weights[].weight في seed_permissions_data.json
// ══════════════════════════════════════════════════════════════

export const ACTION_BITS = {
    // ── إجراءات عامة (CRUD) ──
    VIEW_PAGE: 1,
    VIEW: 2,
    CREATE: 4,
    UPDATE: 8,
    DELETE: 16,

    // ── إجراءات المستندات ──
    ADD_DOCUMENT: 32,
    EDIT_DOCUMENT: 64,
    TRAIN_DATA_REQUEST: 128,
    TRAIN_TXT_REQUEST: 256,
    TRAIN_CSV_REQUEST: 512,
    ADD_DOCUMENT_JSON: 1024,
    GET_DOCUMENT_MANAGEMENT: 2048,
    SEARCH_DOCUMENT_MANAGEMENT: 4096,
    DELETE_COLLECTION: 8192,

    // ── إجراءات التحليلات ──
    GET_USER_FILES: 16384,
    GET_USER_FILES_WITH_QUERY: 32768,
    GET_ALL_ANALYTICS: 65536,
    GET_USER_FILE_ANALYTICS: 131072,
    DOWNLOAD_USER_FILE: 262144,
    DELETE_DOCS_BY_USERNAME: 524288,
    DELETE_DOCS_BY_FILENAME: 1048576,

    // ── إجراءات الطلبات المعلقة ──
    GET_PENDING_ORDERS: 2097152,
    SEARCH_PENDING_ORDERS: 4194304,
    GET_REQUEST_DETAILS: 8388608,
    PROCESS_APPROVE: 16777216,
    PROCESS_REJECT: 33554432,
    DOWNLOAD_REQUEST_TRAIN_FILE: 67108864,

    // ── إجراءات سجل العمليات ──
    GET_OPERATIONS: 134217728,
    GET_OPERATION_DETAILS: 268435456,
    SEARCH_OPERATIONS: 536870912,
    DOWNLOAD_OPERATIONS_CSV: 1073741824,
    DOWNLOAD_OPERATION_TRAIN_FILE: 2147483648,

    // ── إجراءات إدارة المستخدمين ──
    GET_CURRENT_USER: 1,
    GET_USERS_BRIEF: 2,
    GET_USER_BY_ID: 4,
    GET_ALL_USERS: 8,
    CREATE_USER: 16,
    UPDATE_USER: 32,
    DELETE_USER: 64,
    UPDATE_USER_STATUS: 128,
    EXPORT_USERS: 256,
    GET_SESSION_INFO: 512,
    GET_USER_SESSIONS: 1024,
    REVOKE_SESSION: 2048,
    REVOKE_MULTIPLE_SESSIONS: 4096,
    REVOKE_ALL_SESSIONS: 8192,
} as const

export type ActionBit = (typeof ACTION_BITS)[keyof typeof ACTION_BITS]

// ══════════════════════════════════════════════════════════════
//  TYPES
// ══════════════════════════════════════════════════════════════

export interface PagePermission {
    pageValue: number
    totalValue: number
}

export interface PageWithPermission {
    totalPages: number
    permissions: PagePermission[]
}

// ══════════════════════════════════════════════════════════════
//  HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════

/**
 * هل يملك المستخدم صلاحية دخول صفحة معينة؟
 * @param totalPages - قيمة totalPages من بيانات المستخدم
 * @param pageBit - الـ base_bit للصفحة (من PAGE_BITS)
 */
export function hasPageAccess(totalPages: number, pageBit: number): boolean {
    return (totalPages & pageBit) !== 0
}

/**
 * هل يملك المستخدم صلاحية إجراء معين في صفحة معينة؟
 * @param permissions - مصفوفة الصلاحيات من بيانات المستخدم
 * @param pageBit - الـ base_bit للصفحة
 * @param actionBit - الـ weight للإجراء (من ACTION_BITS)
 */
export function hasActionAccess(
    permissions: PagePermission[],
    pageBit: number,
    actionBit: number
): boolean {
    const pagePerm = permissions.find((p) => p.pageValue === pageBit)
    if (!pagePerm) return false
    return (pagePerm.totalValue & actionBit) !== 0
}

/**
 * الحصول على قائمة الصفحات المتاحة
 * @param totalPages - قيمة totalPages من بيانات المستخدم
 * @returns مصفوفة الـ base_bits للصفحات المتاحة
 */
export function getAccessiblePages(totalPages: number): number[] {
    return Object.values(PAGE_BITS).filter(
        (bit) => (totalPages & bit) !== 0
    )
}

/**
 * الحصول على قائمة الإجراءات المتاحة في صفحة معينة
 * @param permissions - مصفوفة الصلاحيات
 * @param pageBit - الـ base_bit للصفحة
 * @returns مصفوفة الـ action codes المتاحة
 */
export function getAvailableActions(
    permissions: PagePermission[],
    pageBit: number
): number[] {
    const pagePerm = permissions.find((p) => p.pageValue === pageBit)
    if (!pagePerm) return []
    return Object.values(ACTION_BITS).filter(
        (bit) => (pagePerm.totalValue & bit) !== 0
    )
}
