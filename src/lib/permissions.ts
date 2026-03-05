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
    // uid 8 — لوحة التحكم
    DASHBOARD: 8,
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
    // uid 32768 — إدارة المستخدمين
    ADMIN_USERS: 32768,
    // uid 131072 — القنوات
    CHANNELS: 131072,
    // uid 524288 — الأقسام
    DEPARTMENTS: 524288,
    // uid 2097152 — المنظمة
    ORGANIZATION: 2097152,
    // uid 4194304 — الملف الشخصي
    USER_PROFILE: 4194304,
    // uid 8388608 — الوكلاء
    AGENTS: 8388608,
    // uid 16777216 — صندوق الوارد
    INBOX: 16777216,
    // uid 33554432 — المستندات
    DOCUMENTS: 33554432,
    // uid 67108864 — الوسائط
    MEDIA: 67108864,
    // uid 134217728 — طلبات التدريب
    TRAIN_REQUESTS: 134217728,
    // uid 268435456 — الإشعارات
    NOTIFICATIONS: 268435456,
    // uid 536870912 — إدارة القوالب (Menu Manager)
    MENU_MANAGER: 536870912,
} as const

export type PageBit = (typeof PAGE_BITS)[keyof typeof PAGE_BITS]

// ══════════════════════════════════════════════════════════════
//  ACTION BITS — مطابقة لـ action_weights[].weight في seed_permissions_data.json
//  ملاحظة: نفس الـ weight يمكن استخدامه في sections مختلفة؛
//          السياق يتحدد أولاً بـ pageValue ثم بـ actionBit.
// ══════════════════════════════════════════════════════════════

export const ACTION_BITS = {
    // ══════════════════════════════════════════════════════════
    //  إجراءات المستخدمين — section: admin_users (base_bit: 32768)
    // ══════════════════════════════════════════════════════════
    GET_CURRENT_USER: 1,            // uid 1032
    GET_USERS_BRIEF: 2,             // uid 1033
    GET_USER_BY_ID: 4,              // uid 1034
    GET_ALL_USERS: 8,               // uid 1035
    CREATE_USER: 16,                // uid 1036
    UPDATE_USER: 32,                // uid 1037
    DELETE_USER: 64,                // uid 1038
    UPDATE_USER_STATUS: 128,        // uid 1039
    EXPORT_USERS: 256,              // uid 1040
    GET_SESSION_INFO: 512,          // uid 1041
    GET_USER_SESSIONS: 1024,        // uid 1042
    REVOKE_SESSION: 2048,           // uid 1043
    REVOKE_MULTIPLE_SESSIONS: 4096, // uid 1044
    REVOKE_ALL_SESSIONS: 8192,      // uid 1045
    ADMIN_SET_PASSWORD: 16384,      // uid 10053
    ASSIGN_ROLE_USER: 32768,        // admin_users:assign_role
    LIST_ROLES_USER: 65536,         // admin_users:list_roles

    // ══════════════════════════════════════════════════════════
    //  إجراءات الوكلاء — section: agents (base_bit: 8388608)
    // ══════════════════════════════════════════════════════════
    CREATE_AGENT: 1,                // uid 8001
    LIST_AGENTS: 2,                 // uid 8002
    GET_AGENT: 4,                   // uid 8003
    UPDATE_AGENT: 8,                // uid 8004
    DELETE_AGENT: 16,               // uid 8005
    GET_AGENT_AI_SETTINGS: 32,      // agents:get_ai_settings
    UPDATE_AGENT_AI_SETTINGS: 64,   // agents:update_ai_settings
    GET_AGENT_AI_PROVIDER: 128,     // agents:get_ai_provider
    CREATE_AGENT_AI_PROVIDER: 256,  // agents:create_ai_provider
    UPDATE_AGENT_AI_PROVIDER: 512,  // agents:update_ai_provider
    DELETE_AGENT_AI_PROVIDER: 1024, // agents:delete_ai_provider
    ADD_AGENT_MODEL: 2048,          // agents:add_model
    DELETE_AGENT_MODEL: 4096,       // agents:delete_model
    GET_AGENT_AI_FEATURES: 8192,    // agents:get_ai_features
    UPDATE_AGENT_AI_FEATURES: 16384,// agents:update_ai_features
    GET_AGENT_PROMPTS: 32768,       // agents:get_prompts
    UPDATE_AGENT_PROMPTS: 65536,    // agents:update_prompts
    GET_AGENT_FEATURES: 131072,     // agents:get_features
    UPDATE_AGENT_FEATURES: 262144,  // agents:update_features
    GET_AGENT_TTS: 524288,          // agents:get_tts
    UPDATE_AGENT_TTS: 1048576,      // agents:update_tts
    TOGGLE_AGENT_TTS: 2097152,      // agents:toggle_tts
    GET_AGENT_TTS_PROVIDER: 4194304,// agents:get_tts_provider
    UPDATE_AGENT_TTS_PROVIDER: 8388608, // agents:update_tts_provider

    // ══════════════════════════════════════════════════════════
    //  إجراءات القنوات — section: channels (base_bit: 131072)
    // ══════════════════════════════════════════════════════════
    GET_CHANNEL: 1,                 // uid 9802
    LIST_CHANNELS: 2,               // uid 10098
    CREATE_CHANNEL: 4,              // uid 10064
    TOGGLE_PLATFORM: 8,             // uid 9801
    UPDATE_CHANNEL: 16,             // uid 10112
    DELETE_CHANNEL: 32,             // uid 10071
    TOGGLE_CHANNEL: 64,             // uid 9803
    GET_CHANNEL_FLAGS: 128,         // uid 9804
    UPDATE_CHANNEL_FLAGS: 256,      // uid 9805
    GET_FLAGS: 512,                 // uid 9806
    GET_PLATFORMS_STATUS: 1024,     // uid 9807

    // ══════════════════════════════════════════════════════════
    //  إجراءات حقول الاتصال — section: contact_fields (base_bit: 1)
    // ══════════════════════════════════════════════════════════
    CREATE_DYNAMIC_FIELD: 1,        // uid 9501
    LIST_DYNAMIC_FIELDS: 2,         // uid 9502
    GET_DYNAMIC_FIELD: 4,           // uid 9503
    UPDATE_DYNAMIC_FIELD: 8,        // uid 9504
    DELETE_DYNAMIC_FIELD: 16,       // uid 9505

    // ══════════════════════════════════════════════════════════
    //  إجراءات جهات الاتصال — section: contacts (base_bit: 2)
    // ══════════════════════════════════════════════════════════
    LIST_CONTACTS: 2,               // uid 9507
    CREATE_CONTACT: 4,              // uid 9506 (weight 32 → mapped as action_code 4)
    GET_CONTACT: 128,               // uid 9508
    UPDATE_CONTACT: 256,            // uid 9509
    DELETE_CONTACT: 512,            // uid 9510
    EXPORT_CONTACTS: 131072,        // uid 9518
    BULK_CONVERT_CONTACTS: 262144,  // uid 9519
    BULK_UPDATE_FIELDS: 524288,     // uid 9520
    CONVERT_CONTACT: 1048576,       // uid 9521
    GET_CONTACT_STATS: 2097152,     // uid 9522
    LIST_CONTACT_FILTERS: 4194304,  // uid 9523
    LIST_REQUIRED_FIELDS: 8388608,  // uid 9524
    SEARCH_CUSTOMERS: 16777216,     // uid 9525
    UPDATE_CUSTOM_FIELDS_CONTACT: 33554432, // uid 9526

    // ══════════════════════════════════════════════════════════
    //  إجراءات لوحة التحكم — section: dashboard (base_bit: 8)
    // ══════════════════════════════════════════════════════════
    GET_GENERAL_ANALYTICS: 1,       // uid 10084

    // ══════════════════════════════════════════════════════════
    //  إجراءات الأقسام — section: departments (base_bit: 524288)
    // ══════════════════════════════════════════════════════════
    CREATE_DEPARTMENT: 2,           // uid 2002
    UPDATE_DEPARTMENT: 8,           // uid 2004
    DELETE_DEPARTMENT: 16,          // uid 2005
    CREATE_CATEGORY: 32,            // uid 2006
    UPDATE_CATEGORY: 128,           // uid 2008
    DELETE_CATEGORY: 256,           // uid 2009

    // ══════════════════════════════════════════════════════════
    //  إجراءات المستندات — section: documents (base_bit: 33554432)
    // ══════════════════════════════════════════════════════════
    UPLOAD_DOCUMENT: 1,             // uid 9101
    UPDATE_DOCUMENT: 4,             // uid 9103
    DELETE_DOCUMENT: 8,             // uid 9104
    DELETE_DOCS_BY_USER: 16,        // uid 9105
    DELETE_DOCS_BY_FILE: 32,        // uid 9106
    GET_DOCUMENT: 64,               // uid 9107
    DELETE_COLLECTION: 128,         // uid 9108
    SEARCH_DOCUMENTS: 256,          // uid 9109
    LIST_USER_FILES: 512,           // uid 9110
    SEARCH_USER_FILES: 1024,        // uid 9111
    GET_ALL_ANALYTICS: 2048,        // uid 9112
    GET_USER_FILE_ANALYTICS: 4096,  // uid 9113
    GET_TENANT_ANALYTICS: 16384,    // documents:get_tenant_analytics
    DELETE_BY_DEPARTMENT: 32768,     // documents:delete_by_department
    DELETE_BY_CATEGORY: 65536,       // documents:delete_by_category
    TRAIN_CSV_DOC: 131072,          // documents:train_csv
    TRAIN_DATA_DOC: 262144,         // documents:train_data
    TRAIN_TXT_DOC: 524288,          // documents:train_txt

    // ══════════════════════════════════════════════════════════
    //  إجراءات صندوق الوارد — section: inbox (base_bit: 16777216)
    // ══════════════════════════════════════════════════════════
    // LIST_PENDING_INBOX: 1,       // لم يعد موجوداً في الجديد
    GET_INBOX_ITEM: 2,              // uid 9002
    LIST_INBOX_STATUS: 4,           // uid 9003
    CREATE_INBOX_ITEM: 8,           // uid 9004
    GET_SIDEBAR_SUMMARY: 64,        // uid 10035
    LIST_CUSTOMERS_INBOX: 128,      // inbox:list_customers
    LIST_ACCOUNTS: 256,             // uid 10036
    UPDATE_CUSTOMER_STATUS: 512,    // inbox:update_customer_status
    ASSIGN_CUSTOMER_AGENT: 1024,    // uid 9410
    UPDATE_CUSTOMER_LIFECYCLE: 2048,// inbox:update_customer_lifecycle
    TOGGLE_AI: 4096,                // uid 10037
    TOGGLE_FAVORITE: 8192,          // uid 10038
    TOGGLE_MUTE: 16384,             // uid 10039
    UPDATE_SESSION_STATUS: 32768,   // uid 10040
    MANAGE_CUSTOMER_TEAMS: 65536,   // uid 10041
    MANAGE_CUSTOMER_TAGS: 131072,   // uid 10042
    GET_CUSTOMER_MESSAGES: 262144,  // inbox:get_customer
    GET_BASIC_INFO: 524288,         // uid 10043
    AI_CHECK: 1048576,              // uid 10044
    ADD_COMMENT: 2097152,           // uid 10045
    GET_ACTIVITY: 4194304,          // uid 10046
    GET_SESSION_RECENT_ACTIVITY: 8388608,   // uid 10047
    GET_SESSION_TIMELINE: 16777216,         // uid 10048
    GET_SESSION_EVENT_COUNT: 33554432,      // uid 10049
    GET_CUSTOMER_TIMELINE: 67108864,        // uid 10050
    GET_USER_EVENTS: 134217728,             // uid 10051
    GET_EVENTS_BY_TYPE: 268435456,          // uid 10052
    GET_USERS_BRIEF_INBOX: 536870912,       // inbox:get_users_brief
    LIST_DYNAMIC_FIELDS_INBOX: 1073741824,  // inbox:list_dynamic_fields
    LIST_SNIPPETS_INBOX: 2147483648,        // inbox:list_snippets
    LIST_TAGS_INBOX: 4294967296,            // inbox:list_tags
    UPDATE_CUSTOM_FIELDS_INBOX: 8589934592, // inbox:update_custom_fields
    UPLOAD_MEDIA_INBOX: 17179869184,        // inbox:upload_media

    // ══════════════════════════════════════════════════════════
    //  إجراءات دورات الحياة — section: lifecycles (base_bit: 32)
    // ══════════════════════════════════════════════════════════
    LIST_LIFECYCLES: 2,             // lifecycles:list_lifecycles
    CREATE_LIFECYCLE: 4,            // lifecycles:create_lifecycle
    UPDATE_LIFECYCLE: 8,            // lifecycles:update_lifecycle
    DELETE_LIFECYCLE: 16,           // lifecycles:delete_lifecycle
    UPDATE_CUSTOMER_LIFECYCLE_ACTION: 32, // lifecycles:update_customer_lifecycle
    RESTORE_LIFECYCLE: 2048,        // uid 9602
    LIST_DELETED_LIFECYCLES: 4096,  // uid 10058

    // ══════════════════════════════════════════════════════════
    //  إجراءات الوسائط — section: media (base_bit: 67108864)
    // ══════════════════════════════════════════════════════════
    UPLOAD_MEDIA: 2,                // uid 10033
    GET_MEDIA_PUBLIC_URL: 4,        // uid 10034
    DOWNLOAD_MEDIA: 8,              // uid 10078 (weight 1 → mapped as action_code 8)
    GET_MEDIA_INFO: 16,             // uid 10085
    GET_MEDIA_SIGNED_URL: 32,       // uid 10086

    // ══════════════════════════════════════════════════════════
    //  إجراءات إدارة القوالب — section: menu_manager (base_bit: 536870912)
    // ══════════════════════════════════════════════════════════
    LIST_TEMPLATES: 1,              // uid 10008
    GET_TEMPLATE: 2,                // uid 10009
    CREATE_TEMPLATE: 4,             // uid 10010
    UPDATE_TEMPLATE: 8,             // uid 10011
    DELETE_TEMPLATE: 16,            // uid 10012
    GET_TEMPLATE_TREE: 32,          // uid 10013
    LIST_MENU_ITEMS: 64,            // uid 10014
    GET_MENU_ITEM: 128,             // uid 10015
    CREATE_MENU_ITEM: 256,          // uid 10016
    UPDATE_MENU_ITEM: 512,          // uid 10017
    DELETE_MENU_ITEM: 1024,         // uid 10018
    MOVE_MENU_ITEM: 2048,           // uid 10019
    REORDER_MENU_ITEMS: 4096,       // uid 10020
    LIST_ASSIGNMENTS: 8192,         // uid 10021
    GET_ASSIGNMENT: 16384,          // uid 10022
    CREATE_ASSIGNMENT: 32768,       // uid 10023
    UPDATE_ASSIGNMENT: 65536,       // uid 10024
    DELETE_ASSIGNMENT: 131072,      // uid 10025
    LIST_ACCOUNT_GROUPS: 262144,    // uid 10026
    GET_ACCOUNT_GROUP: 524288,      // uid 10027
    CREATE_ACCOUNT_GROUP: 1048576,  // uid 10028
    UPDATE_ACCOUNT_GROUP: 2097152,  // uid 10029
    DELETE_ACCOUNT_GROUP: 4194304,  // uid 10030
    MANAGE_GROUP_ACCOUNTS: 8388608, // uid 10031
    PREVIEW_ACCOUNT_MENU: 16777216, // uid 10032
    DOWNLOAD_MEDIA_MM: 33554432,    // menu_manager:download_media
    GET_MEDIA_INFO_MM: 67108864,    // menu_manager:get_media_info
    GET_MEDIA_PUBLIC_URL_MM: 134217728,  // menu_manager:get_media_public_url
    GET_MEDIA_SIGNED_URL_MM: 268435456,  // menu_manager:get_media_signed_url
    LIST_ACCOUNTS_MM: 536870912,         // menu_manager:list_accounts
    UPLOAD_MEDIA_MM: 1073741824,         // menu_manager:upload_media

    // ══════════════════════════════════════════════════════════
    //  إجراءات القوائم — section: menus (base_bit: 64)
    // ══════════════════════════════════════════════════════════
    CREATE_MENU: 1,                 // uid 10066
    DELETE_MENU: 2,                 // uid 10073
    GET_MENU: 4,                    // uid 10087
    GET_MENU_BY_ROLE: 8,            // uid 10088
    LIST_MENUS: 16,                 // uid 10100
    UPDATE_MENU: 32,                // uid 10115

    // ══════════════════════════════════════════════════════════
    //  إجراءات الإشعارات — section: notifications (base_bit: 268435456)
    // ══════════════════════════════════════════════════════════
    SEND_NOTIFICATION: 32,           // uid 10006
    GET_NOTIFICATION_COUNT: 128,     // uid 10089
    LIST_NOTIFICATIONS: 256,         // uid 10101
    MARK_ALL_NOTIFICATIONS_READ: 512,// uid 10106
    MARK_NOTIFICATION_READ: 1024,    // uid 10107

    // ══════════════════════════════════════════════════════════
    //  إجراءات سجل العمليات — section: operation_history (base_bit: 128)
    // ══════════════════════════════════════════════════════════
    GET_OPERATIONS: 134217728,           // uid 1027
    GET_OPERATION_DETAILS: 268435456,    // uid 1028
    SEARCH_OPERATIONS: 536870912,        // uid 1029
    DOWNLOAD_OPERATIONS_CSV: 1073741824, // uid 1030
    DOWNLOAD_OPERATION_TRAIN_FILE: 2147483648, // uid 1031

    // ══════════════════════════════════════════════════════════
    //  إجراءات المنظمة — section: organization (base_bit: 2097152)
    // ══════════════════════════════════════════════════════════
    VIEW_ORGANIZATION: 1,           // uid 9620
    UPDATE_ORGANIZATION: 2,         // uid 9621

    // ══════════════════════════════════════════════════════════
    //  إجراءات الطلبات المعلقة — section: pending_requests (base_bit: 256)
    // ══════════════════════════════════════════════════════════
    GET_PENDING_ORDERS: 2097152,         // uid 1021
    SEARCH_PENDING_ORDERS: 4194304,      // uid 1022
    GET_REQUEST_DETAILS: 8388608,        // uid 1023
    PROCESS_APPROVE: 16777216,           // uid 1024
    PROCESS_REJECT: 33554432,            // uid 1025
    DOWNLOAD_REQUEST_TRAIN_FILE: 67108864, // uid 1026
    PROCESS_TRAIN_REQUEST: 1073741824,   // uid 9702

    // ══════════════════════════════════════════════════════════
    //  إجراءات إدارة الصلاحيات — section: permission_admin (base_bit: 512)
    // ══════════════════════════════════════════════════════════
    SNAPSHOT: 1,                    // uid 3001
    SECTIONS_LIST: 2,               // uid 3002
    SECTIONS_UPDATE: 8,             // uid 3004
    SECTIONS_DELETE: 16,            // uid 3005
    ACTION_WEIGHTS_LIST: 32,        // uid 3006
    ACTION_WEIGHTS_UPDATE: 128,     // uid 3008
    ACTION_WEIGHTS_DELETE: 256,     // uid 3009
    PERMISSIONS_LIST: 512,          // uid 3010
    PERMISSIONS_UPDATE: 2048,       // uid 3012
    PERMISSIONS_DELETE: 4096,       // uid 3013
    BACKFILL_ACTION_UIDS: 8192,     // uid 3014

    // ══════════════════════════════════════════════════════════
    //  إجراءات الأدوار — section: roles (base_bit: 1024)
    // ══════════════════════════════════════════════════════════
    PERMISSIONS_ME: 1,              // uid 4001
    LIST_ROLES: 2,                  // uid 4002
    CREATE_ROLE: 4,                 // uid 4003
    DELETE_ROLE: 8,                 // uid 4004
    GET_ROLE_PERMISSIONS: 16,       // uid 4005
    ADD_ROLE_PERMISSIONS: 32,       // uid 4006
    REMOVE_ROLE_PERMISSIONS: 64,    // uid 4007
    ROLES_BY_PERMISSION: 128,       // uid 4008
    ASSIGN_ROLE: 256,               // uid 4009
    REMOVE_ROLE: 512,               // uid 4010
    LIST_USER_ROLES: 1024,          // uid 4011
    LIST_USERS_WITH_ROLE: 2048,     // uid 4012
    // roles section also includes permission_admin actions:
    ACTION_WEIGHTS_DELETE_ROLES: 4096, // roles:action_weights_delete
    ACTION_WEIGHTS_LIST_ROLES: 8192,   // roles:action_weights_list
    ACTION_WEIGHTS_UPDATE_ROLES: 16384,// roles:action_weights_update
    BACKFILL_ACTION_UIDS_ROLES: 32768, // roles:backfill_action_uids
    PERMISSIONS_DELETE_ROLES: 65536,   // roles:permissions_delete
    PERMISSIONS_LIST_ROLES: 131072,    // roles:permissions_list
    PERMISSIONS_UPDATE_ROLES: 262144,  // roles:permissions_update
    SECTIONS_DELETE_ROLES: 524288,     // roles:sections_delete
    SECTIONS_LIST_ROLES: 1048576,      // roles:sections_list
    SECTIONS_UPDATE_ROLES: 2097152,    // roles:sections_update
    SNAPSHOT_ROLES: 4194304,           // roles:snapshot

    // ══════════════════════════════════════════════════════════
    //  إجراءات المقتطفات — section: snippets (base_bit: 2048)
    // ══════════════════════════════════════════════════════════
    CREATE_SNIPPET: 1,              // uid 10067
    LIST_SNIPPETS: 2,               // uid 10102
    GET_SNIPPET: 4,                 // uid 10091
    UPDATE_SNIPPET: 8,              // uid 10117
    DELETE_SNIPPET: 16,             // uid 10075
    UPLOAD_MEDIA_SNIPPET: 32,       // snippets:upload_media

    // ══════════════════════════════════════════════════════════
    //  إجراءات الوسوم — section: tags (base_bit: 4096)
    // ══════════════════════════════════════════════════════════
    CREATE_TAG: 1,                  // uid 10068
    LIST_TAGS: 2,                   // uid 10103
    GET_TAG: 4,                     // uid 10092
    UPDATE_TAG: 8,                  // uid 10118
    DELETE_TAG: 16,                 // uid 10076
    RESTORE_TAG: 32,                // uid 9610
    LIST_DELETED_TAGS: 64,          // uid 10059

    // ══════════════════════════════════════════════════════════
    //  إجراءات الفرق — section: teams (base_bit: 8192)
    // ══════════════════════════════════════════════════════════
    GET_TEAM_STATISTICS: 1,          // uid 10094
    LIST_TEAMS_PAGINATED: 2,         // uid 10105
    ASSIGN_CUSTOMER_TO_TEAMS: 4,     // uid 10061
    ASSIGN_CUSTOMERS_BULK: 8,        // uid 10062
    GET_CUSTOMERS_BY_TEAM: 16,       // uid 10082
    CREATE_TEAM: 32,                 // uid 10069
    UPDATE_TEAM: 64,                 // uid 10119
    UPDATE_TEAM_MEMBERS: 128,        // uid 10120
    DELETE_TEAM: 256,                // uid 10077
    LIST_TEAMS: 512,                 // uid 10104
    GET_TEAM: 1024,                  // uid 10093
    UNASSIGN_CUSTOMER_TO_TEAMS: 2048,// uid 9630
    LIST_DELETED_TEAMS: 4096,        // uid 10054
    RESTORE_TEAM: 8192,              // uid 10055
    GET_TEAM_MEMBERS: 16384,         // uid 10056
    CACHE_VIEW: 32768,               // uid 10057
    GET_USERS_BRIEF_TEAMS: 65536,    // teams:get_users_brief

    // ══════════════════════════════════════════════════════════
    //  إجراءات طلبات التدريب — section: train_requests (base_bit: 134217728)
    // ══════════════════════════════════════════════════════════
    CHECK_MODEL_HEALTH: 8,          // uid 9304

    // ══════════════════════════════════════════════════════════
    //  إجراءات الملف الشخصي — section: user_profile (base_bit: 4194304)
    // ══════════════════════════════════════════════════════════
    VIEW_PROFILE: 1,                // uid 9622
    UPDATE_PROFILE: 2,              // uid 9623
    GET_CURRENT_USER_PROFILE: 4,    // user_profile:get_current_user
    UPDATE_USER_PROFILE: 8,         // user_profile:update_user
    UPLOAD_MEDIA_PROFILE: 16,       // user_profile:upload_media
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
