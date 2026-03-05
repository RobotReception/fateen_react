# توثيق كامل جميع Endpoints النظام

جميع الصفحات والخدمات في نظام فاتن الإداري.

---

## 1. المصادقة — Auth (`auth-service.ts`)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 1 | POST | `/auth/register-initial` | تسجيل مستخدم جديد | `registerInitial()` |
| 2 | POST | `/auth/verify-email` | التحقق من البريد بـ OTP | `verifyEmail()` |
| 3 | POST | `/auth/resend-verification-email` | إعادة إرسال رمز التحقق | `resendVerificationEmail()` |
| 4 | POST | `/auth/login` | تسجيل الدخول | `login()` |
| 5 | POST | `/auth/complete-onboarding` | إكمال التسجيل (إنشاء مؤسسة) | `completeOnboarding()` |
| 6 | GET | `/auth/onboarding-settings-options` | خيارات نموذج التسجيل | `getOnboardingOptions()` |
| 7 | POST | `/auth/refresh-token` | تجديد التوكن | `refreshToken()` |
| 8 | POST | `/auth/logout` | تسجيل الخروج | `logout()` |
| 9 | POST | `/auth/password/reset/request` | طلب استعادة كلمة المرور | `requestPasswordReset()` |
| 10 | POST | `/auth/password/reset/confirm` | تأكيد استعادة كلمة المرور | `confirmPasswordReset()` |

**الملف:** `features/auth/services/auth-service.ts`

---

## 2. لوحة التحكم — Dashboard (`analytics-service.ts`)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 1 | GET | `/analytics/general` | جلب إحصائيات عامة | `getGeneralAnalytics()` |

**الملف:** `features/dashboard/services/analytics-service.ts`

---

## 3. الإشعارات — Notifications (`notification-service.ts`)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 1 | GET | `/notifications?limit=X&offset=Y` | جلب قائمة الإشعارات (مع صفحات) | `getNotifications()` |
| 2 | POST | `/notifications/{id}/mark-read` | تحديد إشعار كمقروء | `markNotificationRead()` |
| 3 | POST | `/notifications/mark-all-read` | تحديد جميع الإشعارات كمقروءة | `markAllNotificationsRead()` |
| 4 | GET | `/notifications/count` | عداد الإشعارات (غير مقروءة/إجمالي) | `getNotificationCount()` |

**الملف:** `features/notifications/services/notification-service.ts`
**ملاحظة:** يوجد أيضاً WebSocket لتحديث العداد بشكل لحظي.

---

## 4. المحادثات — Inbox (`inbox-service.ts`)

> 📄 موثقة بالكامل في: [Inbox_Endpoints.md](file:///d:/fateen/server_data/fateen_admin/Inbox_Endpoints.md)

---

## 5. جهات الاتصال — Contacts (`contacts-service.ts`)

> 📄 موثقة بالكامل في: [Contacts_Endpoints.md](file:///d:/fateen/server_data/fateen_admin/Contacts_Endpoints.md)

---

## 6. قاعدة المعرفة — Knowledge Base

> 📄 موثقة بالكامل في: [Knowledge_Base_Endpoints.md](file:///d:/fateen/server_data/fateen_admin/Knowledge_Base_Endpoints.md)

---

## 7. مدير القوائم — Menu Manager

> 📄 موثقة بالكامل في: [Menu_Manager_Endpoints.md](file:///d:/fateen/server_data/fateen_admin/Menu_Manager_Endpoints.md)

---

## 8. الإعدادات العامة (`settings-service.ts`)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 1 | GET | `/organization` | جلب بيانات المؤسسة | `getOrganization()` |
| 2 | PATCH | `/organization` | تحديث بيانات المؤسسة | `updateOrganization()` |
| 3 | GET | `/admin/me` | جلب بيانات المستخدم الحالي | `getUserProfile()` |
| 4 | PUT | `/admin/update-user` | تحديث بيانات المستخدم | `updateUserProfile()` |

**الملف:** `features/settings/services/settings-service.ts`

---

## 9. إدارة المستخدمين (`users-service.ts`)

### 9.1 CRUD المستخدمين

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 1 | GET | `/admin/get-all-users` | جلب قائمة المستخدمين (بحث/فلترة/صفحات) | `getAllUsers()` |
| 2 | GET | `/admin/brief/{user_id}` | جلب تفاصيل مستخدم | `getUserBrief()` |
| 3 | GET | `/admin/me` | جلب بيانات المستخدم الحالي | `getCurrentUser()` |
| 4 | POST | `/admin/create-user` | إنشاء مستخدم جديد | `createUser()` |
| 5 | PUT | `/admin/update-user` | تحديث بيانات مستخدم | `updateUser()` |
| 6 | DELETE | `/admin/delete-user` | حذف مستخدم نهائياً | `deleteUser()` |
| 7 | PATCH | `/admin/update-user-status` | تفعيل/تعطيل مستخدم | `updateUserStatus()` |

### 9.2 إدارة الجلسات

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 8 | GET | `/admin/get-session-info` | تفاصيل جلسة واحدة | `getSessionInfo()` |
| 9 | GET | `/admin/get-all-session-handles-for-user` | كل جلسات مستخدم | `getUserSessions()` |
| 10 | POST | `/admin/revoke-user-session` | إلغاء جلسة واحدة | `revokeSession()` |
| 11 | POST | `/admin/revoke-multiple-user-sessions` | إلغاء عدة جلسات | `revokeMultipleSessions()` |
| 12 | POST | `/admin/revoke-all-sessions-for-user` | إلغاء كل جلسات مستخدم | `revokeAllSessionsForUser()` |

### 9.3 كلمة المرور والأدوار

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 13 | POST | `/auth/admin/set` | تعيين كلمة مرور من الأدمن | `adminSetPassword()` |
| 14 | GET | `/roles/get-roles` | جلب الأدوار المتاحة | `getRoles()` |
| 15 | POST | `/roles/assign-role` | تعيين دور لمستخدم | `assignRole()` |

**الملف:** `features/users/services/users-service.ts`

---

## 10. الأدوار والصلاحيات (`roles-service.ts`)

### 10.1 CRUD الأدوار

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 1 | GET | `/roles/get-roles` | جلب جميع الأدوار | `getRoles()` |
| 2 | POST | `/roles/create-role` | إنشاء دور جديد | `createRole()` |
| 3 | DELETE | `/roles/delete-role/{role}` | حذف دور | `deleteRole()` |

### 10.2 صلاحيات الأدوار

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 4 | GET | `/roles/get-role-permissions/{role}` | جلب صلاحيات دور | `getRolePermissions()` |
| 5 | POST | `/roles/add-role-permissions/{role}` | إضافة صلاحيات لدور | `addRolePermissions()` |
| 6 | DELETE | `/roles/remove-role-permissions/{role}` | إزالة صلاحيات من دور | `removeRolePermissions()` |
| 7 | GET | `/roles/get-roles-by-permission/{permission}` | أدوار حسب صلاحية | `getRolesByPermission()` |
| 8 | GET | `/permissions/get-permission-admin-permissions` | كل الصلاحيات المتاحة | `getAllPermissions()` |

### 10.3 المستخدمين والأدوار

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 9 | POST | `/roles/assign-role` | تعيين دور لمستخدم | `assignUserRole()` |
| 10 | DELETE | `/roles/remove-role` | إزالة دور من مستخدم | `removeUserRole()` |
| 11 | GET | `/roles/get-user-roles/{user_id}` | أدوار مستخدم | `getUserRoles()` |
| 12 | GET | `/roles/get-users-with-role/{role}` | مستخدمو دور معين | `getUsersWithRole()` |
| 13 | GET | `/roles/get-my-permissions` | صلاحيات المستخدم الحالي (bitwise) | `getMyPermissions()` |

**الملف:** `features/roles/services/roles-service.ts`

---

## 11. الفرق (`teams-tags-service.ts`)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 1 | GET | `/teams` | جلب جميع الفرق | `getAllTeams()` |
| 2 | POST | `/teams` | إنشاء فريق جديد | `createTeam()` |
| 3 | PATCH | `/teams/{team_id}` | تحديث فريق | `updateTeam()` |
| 4 | DELETE | `/teams/{team_id}` | حذف فريق | `deleteTeam()` |
| 5 | GET | `/teams/deleted` | الفرق المعطلة | `getDeletedTeams()` |
| 6 | PATCH | `/teams/{team_id}/restore` | استعادة فريق | `restoreTeam()` |
| 7 | GET | `/teams/{team_id}/members` | أعضاء فريق | `getTeamMembers()` |
| 8 | POST | `/teams/{team_id}/members/{user_id}` | إضافة عضو | `addTeamMember()` |
| 9 | DELETE | `/teams/{team_id}/members/{user_id}` | إزالة عضو | `removeTeamMember()` |
| 10 | GET | `/brief-users` | قائمة المستخدمين المختصرة | `getBriefUsers()` |

**الملف:** `features/settings/services/teams-tags-service.ts`

---

## 12. القنوات (`channels-service.ts`)

### 12.1 CRUD القنوات

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 1 | GET | `/channels/{platform}` | قنوات منصة | `listChannels()` |
| 2 | GET | `/channels/{platform}/{identifier}` | تفاصيل قناة | `getChannel()` |
| 3 | POST | `/channels/{platform}/add` | إنشاء قناة | `createChannel()` |
| 4 | PATCH | `/channels/{platform}/{identifier}` | تحديث قناة | `updateChannel()` |
| 5 | DELETE | `/channels/{platform}/{identifier}` | حذف قناة | `deleteChannel()` |

### 12.2 التبديل (Toggle)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 6 | PATCH | `/channels/{platform}/toggle` | تفعيل/إيقاف منصة | `togglePlatform()` |
| 7 | PATCH | `/channels/{platform}/{identifier}/toggle` | تفعيل/إيقاف قناة | `toggleChannel()` |

### 12.3 الأعلام (Flags)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 8 | GET | `/channels/{platform}/{identifier}/flags` | أعلام قناة | `getChannelFlags()` |
| 9 | PATCH | `/channels/{platform}/{identifier}/flags` | تحديث أعلام | `updateChannelFlags()` |
| 10 | GET | `/data/flags?id={id}` | أعلام بمعرف | `getDataFlags()` |
| 11 | GET | `/data/flags/platforms` | حالة المنصات | `getPlatformsStatus()` |

**الملف:** `features/channels/services/channels-service.ts`
**المنصات:** `whatsapp` · `facebook` · `instagram` · `appchat` · `webchat`

---

## 13. حقول جهات الاتصال (`contact-fields-service.ts`)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 1 | GET | `/contacts/dynamic-fields` | جلب الحقول الديناميكية | `getAllDynamicFields()` |
| 2 | POST | `/contacts/dynamic-fields` | إنشاء حقل | `createDynamicField()` |
| 3 | PUT | `/contacts/dynamic-fields/{field_name}` | تحديث حقل | `updateDynamicField()` |
| 4 | DELETE | `/contacts/dynamic-fields/{field_name}` | حذف حقل | `deleteDynamicField()` |

**الملف:** `features/settings/services/contact-fields-service.ts`

---

## 14. دورات الحياة (`lifecycles-service.ts`)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 1 | GET | `/lifecycles` | جلب المراحل | `getAllLifecycles()` |
| 2 | POST | `/lifecycles` | إنشاء مرحلة | `createLifecycle()` |
| 3 | PATCH | `/lifecycles/{code}` | تحديث مرحلة | `updateLifecycle()` |
| 4 | DELETE | `/lifecycles/{code}` | حذف مرحلة | `deleteLifecycle()` |
| 5 | GET | `/lifecycles/deleted` | المراحل المعطلة | `getDeletedLifecycles()` |
| 6 | PATCH | `/lifecycles/{code}/restore` | استعادة مرحلة | `restoreLifecycle()` |

**الملف:** `features/settings/services/lifecycles-service.ts`

---

## 15. القوالب الجاهزة — Snippets (`snippets-service.ts`)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 1 | GET | `/snippets` | جلب القوالب | `getAllSnippets()` |
| 2 | GET | `/snippets/{field_id}` | قالب محدد | `getSnippetById()` |
| 3 | POST | `/snippets` | إنشاء قالب | `createSnippet()` |
| 4 | PATCH | `/snippets/{field_id}` | تحديث قالب | `updateSnippet()` |
| 5 | DELETE | `/snippets/{field_id}` | حذف قالب | `deleteSnippet()` |
| 6 | POST | `/media/upload` | رفع وسائط | `uploadMedia()` |

**الملف:** `features/settings/services/snippets-service.ts`

---

## 16. التاجات (`tags-service.ts`)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 1 | GET | `/tags` | جلب الوسوم | `getAllTags()` |
| 2 | POST | `/tags` | إنشاء وسم | `createTag()` |
| 3 | PATCH | `/tags/{tag_id}` | تحديث وسم | `updateTag()` |
| 4 | DELETE | `/tags/{tag_id}` | حذف وسم | `deleteTag()` |
| 5 | GET | `/tags/deleted` | الوسوم المعطلة | `getDeletedTags()` |
| 6 | PATCH | `/tags/{tag_id}/restore` | استعادة وسم | `restoreTag()` |

**الملف:** `features/settings/services/tags-service.ts`

---

## 17. إعدادات الذكاء الاصطناعي (`ai-settings-service.ts`)

### 17.1 الوكلاء (Agents)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 1 | GET | `/agents` | جلب جميع الوكلاء | `listAgents()` |
| 2 | GET | `/agents/{id}` | تفاصيل وكيل | `getAgent()` |
| 3 | POST | `/agents` | إنشاء وكيل | `createAgent()` |
| 4 | PATCH | `/agents/{id}` | تحديث وكيل | `updateAgent()` |
| 5 | DELETE | `/agents/{id}` | حذف وكيل | `deleteAgent()` |

### 17.2 إعدادات AI

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 6 | GET | `/agents/{id}/ai` | جلب إعدادات AI | `getAISettings()` |
| 7 | PATCH | `/agents/{id}/ai` | تحديث إعدادات AI | `updateAISettings()` |

### 17.3 مزودي الخدمة (Providers)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 8 | GET | `/agents/{id}/ai/providers/{name}` | جلب مزود | `getProvider()` |
| 9 | PATCH | `/agents/{id}/ai/providers/{name}` | تحديث مزود | `updateProvider()` |
| 10 | POST | `/agents/{id}/ai/providers/{name}` | إنشاء مزود | `createProvider()` |
| 11 | DELETE | `/agents/{id}/ai/providers/{name}` | حذف مزود | `deleteProvider()` |

### 17.4 نماذج المزودين (Models)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 12 | POST | `/agents/{id}/ai/providers/{name}/models` | إضافة نموذج | `addModelToProvider()` |
| 13 | DELETE | `/agents/{id}/ai/providers/{name}/models/{modelId}` | حذف نموذج | `deleteModelFromProvider()` |

### 17.5 ميزات AI (Features)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 14 | GET | `/agents/{id}/ai/features` | جلب ميزات AI | `getAIFeatures()` |
| 15 | PATCH | `/agents/{id}/ai/features` | تحديث ميزات AI | `updateAIFeatures()` |

### 17.6 البرومبتات (Prompts)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 16 | GET | `/agents/{id}/prompts` | جلب إعدادات البرومبتات | `getPromptsSettings()` |
| 17 | PATCH | `/agents/{id}/prompts` | تحديث البرومبتات | `updatePromptsSettings()` |

### 17.7 تحويل النص لصوت (TTS)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 18 | GET | `/agents/{id}/tts` | جلب إعدادات TTS | `getTTSSettings()` |
| 19 | PATCH | `/agents/{id}/tts` | تحديث TTS | `updateTTSSettings()` |
| 20 | POST | `/agents/{id}/tts/toggle` | تفعيل/إيقاف TTS | `toggleTTS()` |
| 21 | GET | `/agents/{id}/tts/providers/{name}` | جلب مزود TTS | `getTTSProvider()` |
| 22 | PATCH | `/agents/{id}/tts/providers/{name}` | تحديث مزود TTS | `updateTTSProvider()` |

**الملف:** `features/ai-settings/services/ai-settings-service.ts`

---

## 18. سجل العمليات — Operation History (`operation-history-service.ts`)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 1 | GET | `/history/search-operations` | بحث وفلترة العمليات | `searchOperations()` |
| 2 | GET | `/history/get-operation-details` | تفاصيل عملية | `getOperationDetails()` |
| 3 | GET | `/history/download-operations-csv` | تصدير CSV | `downloadOperationsCsv()` |
| 4 | GET | `/history/download-operation-train-file` | تحميل ملف تدريب | `downloadOperationTrainFile()` |

**الملف:** `features/operation-history/services/operation-history-service.ts`

---

## 19. الطلبات المعلقة — Pending Requests (`pending-requests-service.ts`)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 1 | GET | `/get-pending-orders` | قائمة الطلبات المعلقة | `getPendingOrders()` |
| 2 | GET | `/pending/search-pending-orders` | بحث في الطلبات | `searchPendingOrders()` |
| 3 | GET | `/pending/get-request-details` | تفاصيل طلب | `getRequestDetails()` |
| 4 | POST | `/pending/process-approve` | قبول طلب | `processApprove()` |
| 5 | POST | `/pending/process-reject` | رفض طلب | `processReject()` |
| 6 | GET | `/pending/download-request-train-file` | تحميل ملف تدريب الطلب | `downloadRequestTrainFile()` |

**الملف:** `features/pending-requests/services/pending-requests-service.ts`

---

## الملخص الشامل

| القسم | عدد الـ Endpoints | ملف الخدمة |
|-------|------------------|-----------|
| المصادقة (Auth) | 10 | `auth-service.ts` |
| لوحة التحكم (Dashboard) | 1 | `analytics-service.ts` |
| الإشعارات (Notifications) | 4 | `notification-service.ts` |
| المحادثات (Inbox) | 📄 ملف منفصل | `inbox-service.ts` |
| جهات الاتصال (Contacts) | 📄 ملف منفصل | `contacts-service.ts` |
| قاعدة المعرفة (Knowledge) | 📄 ملف منفصل | `knowledge-service.ts` |
| مدير القوائم (Menu Manager) | 📄 ملف منفصل | `menu-manager-service.ts` |
| الإعدادات العامة | 4 | `settings-service.ts` |
| إدارة المستخدمين | 15 | `users-service.ts` |
| الأدوار والصلاحيات | 13 | `roles-service.ts` |
| الفرق | 10 | `teams-tags-service.ts` |
| القنوات | 11 | `channels-service.ts` |
| حقول جهات الاتصال | 4 | `contact-fields-service.ts` |
| دورات الحياة | 6 | `lifecycles-service.ts` |
| القوالب الجاهزة | 6 | `snippets-service.ts` |
| التاجات | 6 | `tags-service.ts` |
| إعدادات الذكاء الاصطناعي | 22 | `ai-settings-service.ts` |
| سجل العمليات | 4 | `operation-history-service.ts` |
| الطلبات المعلقة | 6 | `pending-requests-service.ts` |
| **الإجمالي (هذا الملف)** | **~122** | **13 ملف خدمة** |
