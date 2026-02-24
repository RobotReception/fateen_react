/**
 * Bitwise Permissions System
 *
 * كل صلاحية تُمثَّل كـ bit واحد. يتم التحقق باستخدام Bitwise AND (&).
 *
 * المستوى الأول: صلاحية دخول الصفحة → (totalPages & PAGE_BIT) !== 0
 * المستوى الثاني: صلاحية إجراء داخل الصفحة → (totalValue & ACTION_BIT) !== 0
 *
 * مصدر الحقيقة: seed_permissions_data.json → sections[].base_bit
 */

// ══════════════════════════════════════════════════════════════
//  PAGE BITS — مطابقة لـ sections[].base_bit في seed_permissions_data.json
// ══════════════════════════════════════════════════════════════

export const PAGE_BITS = {
    // uid 1 — حقول الاتصال الديناميكية
    CONTACT_FIELDS: 1,
    // uid 2 — جهات الاتصال
    CONTACTS: 2,
    // uid 4 — العملاء
    CUSTOMERS: 4,
    // uid 16 — إدارة الوثائق (legacy / search view)
    DOCUMENT_MANAGEMENT: 16,
    // uid 32 — دورات الحياة
    LIFECYCLES: 32,
    // uid 64 — القوائم
    MENUS: 64,
    // uid 128 — سجل العمليات
    OPERATION_HISTORY: 128,
    // uid 256 — الطلبات المعلقة
    PENDING_REQUESTS: 256,
    // uid 512 — إدارة الصلاحيات
    PERMISSION_ADMIN: 512,
    // uid 1024 — الأدوار
    ROLES: 1024,
    // uid 2048 — المقتطفات
    SNIPPETS: 2048,
    // uid 4096 — الوسوم
    TAGS: 4096,
    // uid 8192 — الفرق
    TEAMS: 8192,
    // uid 16384 — طلبات التدريب (legacy)
    TRAINREQUESTS: 16384,
    // uid 32768 — إدارة المستخدمين
    ADMIN_USERS: 32768,
    // uid 65536 — إدارة المصادقة
    AUTH_ADMIN: 65536,
    // uid 131072 — القنوات
    CHANNELS: 131072,
    // uid 262144 — تحليلات الوثائق
    DOCUMENT_ANALYTICS: 262144,
    // uid 524288 — الأقسام
    DEPARTMENTS: 524288,
    // uid 1048576 — إعدادات الذكاء الاصطناعي
    AI_SETTINGS: 1048576,
    // uid 2097152 — المنظمة
    ORGANIZATION: 2097152,
    // uid 4194304 — الملف الشخصي
    USER_PROFILE: 4194304,
    // uid 8388608 — الوكلاء
    AGENTS: 8388608,
    // uid 16777216 — صندوق الوارد
    INBOX: 16777216,
    // uid 33554432 — المستندات (الجديدة - عمليات على الملفات)
    DOCUMENTS: 33554432,
    // uid 67108864 — الوسائط
    MEDIA: 67108864,
    // uid 134217728 — طلبات التدريب (الجديدة)
    TRAIN_REQUESTS: 134217728,
} as const

export type PageBit = (typeof PAGE_BITS)[keyof typeof PAGE_BITS]

// ══════════════════════════════════════════════════════════════
//  ACTION BITS — مطابقة لـ action_weights[].weight في seed_permissions_data.json
//  ملاحظة: نفس الـ weight يمكن استخدامه في sections مختلفة؛
//          السياق يتحدد أولاً بـ pageValue ثم بـ actionBit.
// ══════════════════════════════════════════════════════════════

export const ACTION_BITS = {
    // ── إجراءات CRUD العامة uid: 1000-1004 ──
    VIEW_PAGE: 1,
    VIEW: 2,
    CREATE: 4,
    UPDATE: 8,
    DELETE: 16,

    // ── إجراءات الوثائق (document_management) uid: 1005-1013 ──
    ADD_DOCUMENT: 32,
    EDIT_DOCUMENT: 64,
    TRAIN_DATA_REQUEST: 128,
    TRAIN_TXT_REQUEST: 256,
    TRAIN_CSV_REQUEST: 512,
    ADD_DOCUMENT_JSON: 1024,
    GET_DOCUMENT_MANAGEMENT: 2048,
    SEARCH_DOCUMENT_MANAGEMENT: 4096,
    DELETE_COLLECTION: 8192,             // uid 1013 / documents:delete_collection

    // ── إجراءات تحليلات الملفات uid: 1014-1020 (قديمة legacy) ──
    GET_USER_FILES: 16384,
    GET_USER_FILES_WITH_QUERY: 32768,
    GET_ALL_ANALYTICS: 65536,
    GET_USER_FILE_ANALYTICS: 131072,
    DOWNLOAD_USER_FILE: 262144,
    DELETE_DOCS_BY_USERNAME: 524288,
    DELETE_DOCS_BY_FILENAME: 1048576,

    // ── إجراءات الطلبات المعلقة uid: 1021-1026 ──
    GET_PENDING_ORDERS: 2097152,
    SEARCH_PENDING_ORDERS: 4194304,
    GET_REQUEST_DETAILS: 8388608,
    PROCESS_APPROVE: 16777216,
    PROCESS_REJECT: 33554432,
    DOWNLOAD_REQUEST_TRAIN_FILE: 67108864,

    // ── إجراءات سجل العمليات uid: 1027-1031 ──
    GET_OPERATIONS: 134217728,
    GET_OPERATION_DETAILS: 268435456,
    SEARCH_OPERATIONS: 536870912,
    DOWNLOAD_OPERATIONS_CSV: 1073741824,
    DOWNLOAD_OPERATION_TRAIN_FILE: 2147483648,

    // ── إجراءات المستخدمين uid: 1032-1045 ──
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

    // ── إجراءات الأقسام uid: 2001-2009 ──
    LIST_DEPARTMENT: 1,
    CREATE_DEPARTMENT: 2,
    GET_DEPARTMENT: 4,
    UPDATE_DEPARTMENT: 8,
    DELETE_DEPARTMENT: 16,
    CREATE_CATEGORY: 32,
    LIST_CATEGORY: 64,
    UPDATE_CATEGORY: 128,
    DELETE_CATEGORY: 256,

    // ── إجراءات إدارة الصلاحيات uid: 3001-3014 ──
    SNAPSHOT: 1,
    SECTIONS_LIST: 2,
    SECTIONS_CREATE: 4,
    SECTIONS_UPDATE: 8,
    SECTIONS_DELETE: 16,
    ACTION_WEIGHTS_LIST: 32,
    ACTION_WEIGHTS_CREATE: 64,
    ACTION_WEIGHTS_UPDATE: 128,
    ACTION_WEIGHTS_DELETE: 256,
    PERMISSIONS_LIST: 512,
    PERMISSIONS_CREATE: 1024,
    PERMISSIONS_UPDATE: 2048,
    PERMISSIONS_DELETE: 4096,
    BACKFILL_ACTION_UIDS: 8192,

    // ── إجراءات الأدوار uid: 4001-4012 ──
    PERMISSIONS_ME: 1,
    LIST_ROLES: 2,
    CREATE_ROLE: 4,
    DELETE_ROLE: 8,
    GET_ROLE_PERMISSIONS: 16,
    ADD_ROLE_PERMISSIONS: 32,
    REMOVE_ROLE_PERMISSIONS: 64,
    ROLES_BY_PERMISSION: 128,
    ASSIGN_ROLE: 256,
    REMOVE_ROLE: 512,
    LIST_USER_ROLES: 1024,
    LIST_USERS_WITH_ROLE: 2048,

    // ── إجراءات إعدادات الذكاء الاصطناعي uid: 5001-5029 ──
    GET_GENERAL_SETTINGS: 1,
    UPDATE_GENERAL_SETTINGS: 2,
    GET_AI_SETTINGS: 4,
    UPDATE_AI_SETTINGS: 8,
    GET_AI_PROVIDER: 16,
    UPDATE_AI_PROVIDER: 32,
    CREATE_AI_PROVIDER: 64,
    DELETE_AI_PROVIDER: 128,
    ADD_MODEL_TO_PROVIDER: 256,
    DELETE_MODEL_FROM_PROVIDER: 512,
    GET_AI_FEATURES: 1024,
    UPDATE_AI_FEATURES: 2048,
    GET_DATABASE_SETTINGS: 4096,
    UPDATE_DATABASE_SETTINGS: 8192,
    GET_PROMPTS: 16384,
    UPDATE_PROMPTS: 32768,
    GET_EMBEDDING_SETTINGS: 65536,
    UPDATE_EMBEDDING_SETTINGS: 131072,
    GET_SEARCH_SETTINGS: 262144,
    UPDATE_SEARCH_SETTINGS: 524288,
    GET_PROCESSING_SETTINGS: 1048576,
    UPDATE_PROCESSING_SETTINGS: 2097152,
    GET_FEATURES_SETTINGS: 4194304,
    UPDATE_FEATURES_SETTINGS: 8388608,
    GET_TTS_SETTINGS: 16777216,
    UPDATE_TTS_SETTINGS: 33554432,
    TOGGLE_TTS: 67108864,
    GET_TTS_PROVIDER: 134217728,
    UPDATE_TTS_PROVIDER: 268435456,

    // ── إجراءات المقتطفات uid: 6001-6005 ──
    CREATE_SNIPPET: 1,
    LIST_SNIPPETS: 2,
    GET_SNIPPET: 4,
    UPDATE_SNIPPET: 8,
    DELETE_SNIPPET: 16,

    // ── إجراءات الوسوم uid: 6006-6010 ──
    CREATE_TAG: 1,
    LIST_TAGS: 2,
    GET_TAG: 4,
    UPDATE_TAG: 8,
    DELETE_TAG: 16,

    // ── إجراءات الفرق uid: 6011-6021 ──
    GET_TEAM_STATISTICS: 1,
    LIST_TEAMS_PAGINATED: 2,
    ASSIGN_CUSTOMER_TO_TEAMS: 4,
    ASSIGN_CUSTOMERS_BULK: 8,
    GET_CUSTOMERS_BY_TEAM: 16,
    CREATE_TEAM: 32,
    UPDATE_TEAM: 64,
    UPDATE_TEAM_MEMBERS: 128,
    DELETE_TEAM: 256,
    LIST_TEAMS: 512,
    GET_TEAM: 1024,

    // ── إجراءات المنظمة uid: 7001-7002 ──
    VIEW_ORGANIZATION: 1,
    UPDATE_ORGANIZATION: 2,

    // ── إجراءات الملف الشخصي uid: 7003-7004 ──
    VIEW_PROFILE: 1,
    UPDATE_PROFILE: 2,

    // ── إجراءات الوكلاء uid: 8001-8024 ──
    CREATE_AGENT: 1,
    LIST_AGENTS: 2,
    GET_AGENT: 4,
    UPDATE_AGENT: 8,
    DELETE_AGENT: 16,
    GET_AGENT_AI_SETTINGS: 32,
    UPDATE_AGENT_AI_SETTINGS: 64,
    GET_AGENT_AI_PROVIDER: 128,
    CREATE_AGENT_AI_PROVIDER: 256,
    UPDATE_AGENT_AI_PROVIDER: 512,
    DELETE_AGENT_AI_PROVIDER: 1024,
    ADD_AGENT_MODEL: 2048,
    DELETE_AGENT_MODEL: 4096,
    GET_AGENT_AI_FEATURES: 8192,
    UPDATE_AGENT_AI_FEATURES: 16384,
    GET_AGENT_PROMPTS: 32768,
    UPDATE_AGENT_PROMPTS: 65536,
    GET_AGENT_FEATURES: 131072,
    UPDATE_AGENT_FEATURES: 262144,
    GET_AGENT_TTS: 524288,
    UPDATE_AGENT_TTS: 1048576,
    TOGGLE_AGENT_TTS: 2097152,
    GET_AGENT_TTS_PROVIDER: 4194304,
    UPDATE_AGENT_TTS_PROVIDER: 8388608,

    // ── إجراءات صندوق الوارد uid: 9001-9006 ──
    LIST_PENDING_INBOX: 1,
    GET_INBOX_ITEM: 2,
    LIST_INBOX_STATUS: 4,
    CREATE_INBOX_ITEM: 8,
    UPDATE_INBOX_ITEM: 16,
    PATCH_INBOX_ITEM: 32,

    // ── إجراءات المستندات الجديدة uid: 9101-9117 ──
    UPLOAD_DOCUMENT: 1,
    UPLOAD_DOCUMENT_JSON: 2,
    UPDATE_DOCUMENT: 4,
    DELETE_DOCUMENT: 8,
    DELETE_DOCS_BY_USER: 16,
    DELETE_DOCS_BY_FILE: 32,
    GET_DOCUMENT: 64,
    DELETE_COLLECTION_NEW: 128,
    SEARCH_DOCUMENTS: 256,
    LIST_USER_FILES: 512,
    SEARCH_USER_FILES: 1024,
    GET_ALL_ANALYTICS_NEW: 2048,
    GET_USER_FILE_ANALYTICS_NEW: 4096,
    GET_TENANT_ANALYTICS_DOCS: 16384,
    DELETE_BY_DEPARTMENT: 32768,
    DELETE_BY_CATEGORY: 65536,

    // ── إجراءات الوسائط uid: 9201 ──
    MEDIA_CREATE: 1,

    // ── إجراءات طلبات التدريب الجديدة uid: 9301-9304 ──
    TRAIN_DATA: 1,
    TRAIN_TXT: 2,
    TRAIN_CSV: 4,
    CHECK_MODEL_HEALTH: 8,

    // ── إجراءات العملاء uid: 9401-9410 ──
    LIST_CUSTOMERS: 1,
    UPDATE_CUSTOMER: 2,
    UPDATE_CUSTOMER_STATUS: 4,
    UPDATE_CUSTOMER_LC: 8,
    ADD_CUSTOMER_NOTE: 16,
    DELETE_CUSTOMER_NOTE: 32,
    GET_CUSTOMER_MESSAGES: 64,
    CLOSE_CONVERSATION: 128,
    REOPEN_CONVERSATION: 256,
    ASSIGN_CUSTOMER_AGENT: 512,

    // ── إجراءات جهات الاتصال uid: 9506-9518 ──
    CREATE_CONTACT: 4,
    LIST_CONTACTS: 2,
    GET_CONTACT: 128,
    UPDATE_CONTACT: 256,
    DELETE_CONTACT: 512,
    CONTACT_STATS: 1024,
    CONTACT_FILTERS: 2048,
    CONTACT_REQUIRED_FIELDS: 4096,
    UPDATE_CONTACT_FIELDS: 8192,
    CONVERT_CONTACT: 16384,
    BULK_CONVERT_CONTACTS: 32768,
    BULK_UPDATE_FIELDS: 65536,
    EXPORT_CONTACTS: 131072,

    // ── إجراءات حقول الاتصال uid: 9501-9505 ──
    CREATE_DYNAMIC_FIELD: 1,
    LIST_DYNAMIC_FIELDS: 2,
    GET_DYNAMIC_FIELD: 4,
    UPDATE_DYNAMIC_FIELD: 8,
    DELETE_DYNAMIC_FIELD: 16,

    // ── إجراءات دورات الحياة uid: 9601 ──
    LIST_LIFECYCLES: 2,
    CREATE_LIFECYCLE: 4,
    UPDATE_LIFECYCLE: 8,
    DELETE_LIFECYCLE: 16,
    REORDER_LIFECYCLES: 1024,

    // ── إجراءات الطلبات المعلقة المحسّنة uid: 9701-9702 ──
    APPROVE_REQUEST_ENHANCED: 536870912,
    PROCESS_TRAIN_REQUEST: 1073741824,

    // ── إجراءات القنوات uid: 9801-9807 ──
    GET_CHANNEL: 1,
    LIST_CHANNELS: 2,
    TOGGLE_PLATFORM: 8,
    TOGGLE_CHANNEL: 64,
    GET_CHANNEL_FLAGS: 128,
    UPDATE_CHANNEL_FLAGS: 256,
    GET_FLAGS: 512,
    GET_PLATFORMS_STATUS: 1024,

    // ── إجراءات القوائم uid: 9901-9906 ──
    LIST_MENUS: 2,
    GET_MENU: 1,
    GET_MENU_ROLE: 4,
    CREATE_MENU: 8,
    UPDATE_MENU: 16,
    DELETE_MENU: 32,
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
