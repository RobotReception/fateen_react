# توثيق Endpoints صفحات الإعدادات الكاملة

جميع الصفحات الموجودة في الشريط الجانبي للإعدادات، مرتبة حسب الأقسام.

---

## 1. الإعدادات العامة (`OrganizationTab`)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 1 | GET | `/organization` | جلب بيانات المؤسسة | `getOrganization()` |
| 2 | PATCH | `/organization` | تحديث بيانات المؤسسة (الاسم، الصناعة، اللوغو..) | `updateOrganization()` |

**الملف:** `settings/services/settings-service.ts` → **Hook:** `use-settings.ts`

---

## 2. إدارة المستخدمين (`UsersPage`)

### 2.1 إدارة المستخدمين (CRUD)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 1 | GET | `/admin/get-all-users` | جلب قائمة المستخدمين (مع بحث/فلترة/صفحات) | `getAllUsers()` |
| 2 | GET | `/admin/brief/{user_id}` | جلب تفاصيل مستخدم محدد | `getUserBrief()` |
| 3 | GET | `/admin/me` | جلب بيانات المستخدم الحالي | `getCurrentUser()` |
| 4 | POST | `/admin/create-user` | إنشاء مستخدم جديد | `createUser()` |
| 5 | PUT | `/admin/update-user` | تحديث بيانات مستخدم | `updateUser()` |
| 6 | DELETE | `/admin/delete-user` | حذف مستخدم نهائياً | `deleteUser()` |
| 7 | PATCH | `/admin/update-user-status` | تفعيل/تعطيل مستخدم | `updateUserStatus()` |

### 2.2 إدارة الجلسات (Sessions)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 8 | GET | `/admin/get-session-info` | جلب تفاصيل جلسة واحدة | `getSessionInfo()` |
| 9 | GET | `/admin/get-all-session-handles-for-user` | جلب كل جلسات مستخدم | `getUserSessions()` |
| 10 | POST | `/admin/revoke-user-session` | إلغاء جلسة واحدة | `revokeSession()` |
| 11 | POST | `/admin/revoke-multiple-user-sessions` | إلغاء عدة جلسات | `revokeMultipleSessions()` |
| 12 | POST | `/admin/revoke-all-sessions-for-user` | إلغاء كل جلسات مستخدم | `revokeAllSessionsForUser()` |

### 2.3 كلمة المرور والأدوار (من داخل الصفحة)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 13 | POST | `/auth/admin/set` | تعيين كلمة مرور لمستخدم (من قبل الأدمن) | `adminSetPassword()` |
| 14 | GET | `/roles/get-roles` | جلب قائمة الأدوار (لتعيين دور للمستخدم) | `getRoles()` |
| 15 | POST | `/roles/assign-role` | تعيين دور لمستخدم | `assignRole()` |

**الملف:** `users/services/users-service.ts` → **Hook:** `use-users.ts`

---

## 3. الأدوار والصلاحيات (`RolesPage`)

### 3.1 إدارة الأدوار (CRUD)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 1 | GET | `/roles/get-roles` | جلب جميع الأدوار | `getRoles()` |
| 2 | POST | `/roles/create-role` | إنشاء دور جديد | `createRole()` |
| 3 | DELETE | `/roles/delete-role/{role}` | حذف دور | `deleteRole()` |

### 3.2 إدارة صلاحيات الدور

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 4 | GET | `/roles/get-role-permissions/{role}` | جلب صلاحيات دور محدد | `getRolePermissions()` |
| 5 | POST | `/roles/add-role-permissions/{role}` | إضافة صلاحيات لدور | `addRolePermissions()` |
| 6 | DELETE | `/roles/remove-role-permissions/{role}` | إزالة صلاحيات من دور | `removeRolePermissions()` |
| 7 | GET | `/roles/get-roles-by-permission/{permission}` | جلب الأدوار حسب صلاحية | `getRolesByPermission()` |
| 8 | GET | `/permissions/get-permission-admin-permissions` | جلب كل الصلاحيات المتاحة بالنظام | `getAllPermissions()` |

### 3.3 ربط المستخدمين بالأدوار

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 9 | POST | `/roles/assign-role` | تعيين دور لمستخدم | `assignUserRole()` |
| 10 | DELETE | `/roles/remove-role` | إزالة دور من مستخدم | `removeUserRole()` |
| 11 | GET | `/roles/get-user-roles/{user_id}` | جلب أدوار مستخدم | `getUserRoles()` |
| 12 | GET | `/roles/get-users-with-role/{role}` | جلب مستخدمي دور معين | `getUsersWithRole()` |

### 3.4 صلاحيات المستخدم الحالي

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 13 | GET | `/roles/get-my-permissions` | جلب صلاحيات المستخدم الحالي (bitwise) | `getMyPermissions()` |

**الملف:** `roles/services/roles-service.ts` → **Hook:** `use-roles.ts`

---

## 4. الفرق (`TeamsTab`)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 1 | GET | `/teams` | جلب جميع الفرق | `getAllTeams()` |
| 2 | POST | `/teams` | إنشاء فريق جديد | `createTeam()` |
| 3 | PATCH | `/teams/{team_id}` | تحديث بيانات فريق | `updateTeam()` |
| 4 | DELETE | `/teams/{team_id}` | حذف (تعطيل) فريق | `deleteTeam()` |
| 5 | GET | `/teams/deleted` | جلب الفرق المعطلة | `getDeletedTeams()` |
| 6 | PATCH | `/teams/{team_id}/restore` | استعادة فريق معطل | `restoreTeam()` |
| 7 | GET | `/teams/{team_id}/members` | جلب أعضاء فريق | `getTeamMembers()` |
| 8 | POST | `/teams/{team_id}/members/{user_id}` | إضافة عضو للفريق | `addTeamMember()` |
| 9 | DELETE | `/teams/{team_id}/members/{user_id}` | إزالة عضو من الفريق | `removeTeamMember()` |
| 10 | GET | `/brief-users` | جلب المستخدمين المختصرة (لاختيار الأعضاء) | `getBriefUsers()` |

**الملف:** `settings/services/teams-tags-service.ts` → **Hook:** `use-teams-tags.ts`

---

## 5. القنوات (`ChannelsPage`)

### 5.1 إدارة القنوات (CRUD)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 1 | GET | `/channels/{platform}` | جلب قنوات منصة محددة | `listChannels()` |
| 2 | GET | `/channels/{platform}/{identifier}` | جلب تفاصيل قناة واحدة | `getChannel()` |
| 3 | POST | `/channels/{platform}/add` | إنشاء قناة جديدة | `createChannel()` |
| 4 | PATCH | `/channels/{platform}/{identifier}` | تحديث قناة | `updateChannel()` |
| 5 | DELETE | `/channels/{platform}/{identifier}` | حذف قناة | `deleteChannel()` |

### 5.2 تبديل الحالة (Toggle)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 6 | PATCH | `/channels/{platform}/toggle` | تفعيل/إيقاف منصة كاملة | `togglePlatform()` |
| 7 | PATCH | `/channels/{platform}/{identifier}/toggle` | تفعيل/إيقاف قناة واحدة | `toggleChannel()` |

### 5.3 الأعلام والبيانات (Flags)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 8 | GET | `/channels/{platform}/{identifier}/flags` | جلب أعلام قناة | `getChannelFlags()` |
| 9 | PATCH | `/channels/{platform}/{identifier}/flags` | تحديث أعلام قناة | `updateChannelFlags()` |
| 10 | GET | `/data/flags?id={id}` | جلب أعلام بمعرف عام | `getDataFlags()` |
| 11 | GET | `/data/flags/platforms` | حالة جميع المنصات | `getPlatformsStatus()` |

**الملف:** `channels/services/channels-service.ts` → **Hook:** `use-channels.ts`
**المنصات المدعومة:** `whatsapp` · `facebook` · `instagram` · `appchat` · `webchat`

---

## 6. حقول جهات الاتصال (`ContactFieldsTab`)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 1 | GET | `/contacts/dynamic-fields` | جلب جميع الحقول الديناميكية | `getAllDynamicFields()` |
| 2 | POST | `/contacts/dynamic-fields` | إنشاء حقل ديناميكي جديد | `createDynamicField()` |
| 3 | PUT | `/contacts/dynamic-fields/{field_name}` | تحديث حقل ديناميكي | `updateDynamicField()` |
| 4 | DELETE | `/contacts/dynamic-fields/{field_name}` | حذف حقل ديناميكي | `deleteDynamicField()` |

**الملف:** `settings/services/contact-fields-service.ts` → **Hook:** `use-contact-fields.ts`

---

## 7. دورات الحياة (`LifecyclesTab`)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 1 | GET | `/lifecycles` | جلب جميع المراحل | `getAllLifecycles()` |
| 2 | POST | `/lifecycles` | إنشاء مرحلة جديدة | `createLifecycle()` |
| 3 | PATCH | `/lifecycles/{code}` | تحديث مرحلة | `updateLifecycle()` |
| 4 | DELETE | `/lifecycles/{code}` | حذف مرحلة (مع `reassign_to` اختياري) | `deleteLifecycle()` |
| 5 | GET | `/lifecycles/deleted` | جلب المراحل المعطلة | `getDeletedLifecycles()` |
| 6 | PATCH | `/lifecycles/{code}/restore` | استعادة مرحلة معطلة | `restoreLifecycle()` |

**الملف:** `settings/services/lifecycles-service.ts` → **Hook:** `use-lifecycles.ts`

---

## 8. القوالب الجاهزة — Snippets (`SnippetsTab`)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 1 | GET | `/snippets` | جلب جميع القوالب (فلترة بـ topic) | `getAllSnippets()` |
| 2 | GET | `/snippets/{field_id}` | جلب قالب محدد | `getSnippetById()` |
| 3 | POST | `/snippets` | إنشاء قالب جديد | `createSnippet()` |
| 4 | PATCH | `/snippets/{field_id}` | تحديث قالب | `updateSnippet()` |
| 5 | DELETE | `/snippets/{field_id}` | حذف قالب | `deleteSnippet()` |
| 6 | POST | `/media/upload` | رفع ملف وسائط (صورة/صوت/فيديو/مستند) | `uploadMedia()` |

**الملف:** `settings/services/snippets-service.ts` → **Hook:** `use-snippets.ts`

---

## 9. التاجات (`TagsTab`)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 1 | GET | `/tags` | جلب جميع الوسوم | `getAllTags()` |
| 2 | POST | `/tags` | إنشاء وسم جديد | `createTag()` |
| 3 | PATCH | `/tags/{tag_id}` | تحديث وسم | `updateTag()` |
| 4 | DELETE | `/tags/{tag_id}` | حذف (تعطيل) وسم | `deleteTag()` |
| 5 | GET | `/tags/deleted` | جلب الوسوم المعطلة | `getDeletedTags()` |
| 6 | PATCH | `/tags/{tag_id}/restore` | استعادة وسم معطل | `restoreTag()` |

**الملف:** `settings/services/tags-service.ts` → **Hook:** `use-tags.ts`

---

## 10. الاشتراك والدفع (`BillingTab`)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 1 | GET | `/organization` | جلب بيانات الاشتراك والحدود | `getOrganization()` |

**الملف:** `settings/services/settings-service.ts` → **Hook:** `use-settings.ts`
**ملاحظة:** يعرض `plan_snapshot`، `effective_limits`، الفترة التجريبية، وحالة الاشتراك.

---

## 11. الملف الشخصي (`ProfileTab`)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 1 | GET | `/admin/me` | جلب بيانات المستخدم الحالي | `getUserProfile()` |
| 2 | PUT | `/admin/update-user` | تحديث بيانات المستخدم | `updateUserProfile()` |
| 3 | POST | `/media/upload` | رفع صورة الملف الشخصي | `uploadMedia()` |

**الملف:** `settings/services/settings-service.ts` → **Hook:** `use-settings.ts`

---

## 12. الأمان وكلمة المرور (`SecurityTab`)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 1 | GET | `/admin/me` | جلب بيانات الجلسة النشطة والتحقق | `getUserProfile()` |

**ملاحظة:** يعرض بيانات الجلسة (IP، المتصفح، وقت الدخول، انتهاء الصلاحية) + حالة التحقق من البريد.

---

## 13. الإشعارات (`NotificationsTab`)

> **لا يوجد endpoints** — يعمل بالكامل على `localStorage` فقط (نغمة الإشعار، مستوى الصوت، تفعيل/تعطيل).

---

## ملخص الإجمالي

| الصفحة | عدد الـ Endpoints | الخدمة الأساسية |
|--------|------------------|----------------|
| الإعدادات العامة | 2 | `settings-service.ts` |
| إدارة المستخدمين | 15 | `users-service.ts` |
| الأدوار والصلاحيات | 13 | `roles-service.ts` |
| الفرق | 10 | `teams-tags-service.ts` |
| القنوات | 11 | `channels-service.ts` |
| حقول جهات الاتصال | 4 | `contact-fields-service.ts` |
| دورات الحياة | 6 | `lifecycles-service.ts` |
| القوالب الجاهزة | 6 | `snippets-service.ts` |
| التاجات | 6 | `tags-service.ts` |
| الاشتراك والدفع | 1 | `settings-service.ts` |
| الملف الشخصي | 3 | `settings-service.ts` |
| الأمان | 1 | `settings-service.ts` |
| الإشعارات | 0 | `localStorage` |
| **الإجمالي** | **78** | **9 ملفات خدمات** |

---

## ملفات الخدمات (Services)

| الملف | الموقع الكامل |
|-------|--------------|
| `settings-service.ts` | `src/features/settings/services/settings-service.ts` |
| `users-service.ts` | `src/features/users/services/users-service.ts` |
| `roles-service.ts` | `src/features/roles/services/roles-service.ts` |
| `teams-tags-service.ts` | `src/features/settings/services/teams-tags-service.ts` |
| `channels-service.ts` | `src/features/channels/services/channels-service.ts` |
| `tags-service.ts` | `src/features/settings/services/tags-service.ts` |
| `snippets-service.ts` | `src/features/settings/services/snippets-service.ts` |
| `lifecycles-service.ts` | `src/features/settings/services/lifecycles-service.ts` |
| `contact-fields-service.ts` | `src/features/settings/services/contact-fields-service.ts` |

---

## ملاحظات مهمة

- **Authentication:** جميع الطلبات تتطلب `Authorization: Bearer <token>` و `X-Tenant-ID`
- **Soft Delete:** الفرق، الوسوم، ودورات الحياة تدعم الحذف المؤقت مع إمكانية الاستعادة
- **Endpoints مشتركة:** بعض الصفحات تشارك endpoints مع services أخرى:
  - `TeamsTab` ← `getBriefUsers()` من `inbox-service.ts`
  - `ProfileTab` ← `uploadMedia()` من `inbox-service.ts`
  - `UsersPage` ← `getRoles()` و `assignRole()` من `roles-service.ts`
- **ManagementAPI:** صفحة المستخدمين تشمل إدارة الجلسات وكلمة المرور كوظائف إدارية متقدمة
- **Bitwise Permissions:** صفحة الأدوار تتحكم بنظام صلاحيات bitwise يُستخدم في كامل النظام
