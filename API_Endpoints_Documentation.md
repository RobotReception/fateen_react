# جميع الـ Endpoints في النظام وأماكن استخدامها

> [!NOTE]
> المجموع الكلي: **~170 endpoint** موزعة على **20 ملف خدمة** و **16 صفحة/تبويب**.

---

## 1. 🔐 المصادقة (Auth)

**ملف الخدمة:** `features/auth/services/auth-service.ts`
**الصفحة:** Login, Register, Verify Email, Onboarding, Forgot Password

| # | Method | Endpoint | الوصف | الصفحة |
|---|--------|----------|-------|--------|
| 1 | POST | `/auth/register-initial` | تسجيل مستخدم جديد | Register |
| 2 | POST | `/auth/verify-email` | التحقق من البريد (OTP) | Verify Email |
| 3 | POST | `/auth/resend-verification-email` | إعادة إرسال التحقق | Verify Email |
| 4 | POST | `/auth/login` | تسجيل الدخول | Login |
| 5 | POST | `/auth/complete-onboarding` | إكمال التهيئة | Onboarding |
| 6 | GET | `/auth/onboarding-settings-options` | خيارات نموذج التهيئة | Onboarding |
| 7 | POST | `/auth/refresh-token` | تحديث التوكن | عام (interceptor) |
| 8 | POST | `/auth/logout` | تسجيل الخروج | عام |
| 9 | POST | `/auth/password/reset/request` | طلب إعادة تعيين كلمة المرور | Forgot Password |
| 10 | POST | `/auth/password/reset/confirm` | تأكيد إعادة تعيين كلمة المرور | Forgot Password |

---

## 2. 📊 لوحة التحكم (Dashboard)

**ملف الخدمة:** `features/dashboard/services/analytics-service.ts`
**الصفحة:** Dashboard

| # | Method | Endpoint | الوصف | الصفحة |
|---|--------|----------|-------|--------|
| 1 | GET | `/analytics/general` | إحصائيات عامة | Dashboard |

---

## 3. 📥 صندوق الوارد (Inbox)

**ملف الخدمة:** `features/inbox/services/inbox-service.ts`
**الصفحة:** Inbox (`/dashboard/inbox`) + Conversation (`/dashboard/inbox/:id`)

| # | Method | Endpoint | الوصف | الصفحة |
|---|--------|----------|-------|--------|
| 1 | GET | `/inbox/sidebar-summary` | ملخص الشريط الجانبي | Inbox |
| 2 | GET | `/customers/accounts` | قائمة الحسابات | Inbox |
| 3 | GET | `/inbox/customers` | قائمة العملاء | Inbox |
| 4 | GET | `/inbox/customers/{id}/messages` | رسائل العميل | Conversation |
| 5 | POST | `/inbox/send-message` | إرسال رسالة | Conversation |
| 6 | POST | `/inbox/comments` | إضافة تعليق داخلي | Conversation |
| 7 | POST | `/media/upload` | رفع وسائط | Conversation |
| 8 | PATCH | `/customers/{id}/close-conversation` | إغلاق محادثة | Conversation |
| 9 | PATCH | `/customers/{id}/reopen-conversation` | إعادة فتح محادثة | Conversation |
| 10 | PATCH | `/customers/{id}/assign` | تعيين وكيل | Conversation |
| 11 | PATCH | `/customers/{id}/lifecycle` | تحديث دورة الحياة | Conversation |
| 12 | PATCH | `/customers/{id}/enable-ai` | تبديل الذكاء الاصطناعي | Conversation |
| 13 | PATCH | `/customers/{id}/favorite` | مفضلة | Inbox |
| 14 | PATCH | `/customers/{id}/mute` | كتم | Inbox |
| 15 | PATCH | `/customers/{id}/session-status` | حالة الجلسة | Conversation |
| 16 | PUT | `/customers/{id}/teams` | تعيين فرق | Conversation |
| 17 | DELETE | `/customers/{id}/teams` | إزالة فرق | Conversation |
| 18 | GET | `/customers/{id}/teams` | فرق العميل | Conversation |
| 19 | POST | `/customers/{id}/tags` | إضافة وسوم | Conversation |
| 20 | DELETE | `/customers/{id}/tags` | إزالة وسوم | Conversation |
| 21 | GET | `/customers/{id}/basic-info` | معلومات أساسية | Conversation |
| 22 | GET | `/customers/{id}/ai-check` | فحص AI | Conversation |
| 23 | PUT | `/contacts/{id}/custom-fields` | تحديث الحقول المخصصة | Conversation |
| 24 | GET | `/admin/brief` | المستخدمين المختصر (للتعيين) | Conversation |
| 25 | GET | `/activity?session_id={id}` | نشاط الجلسة | Conversation |

---

## 4. 👥 جهات الاتصال (Contacts)

**ملف الخدمة:** `features/contacts/services/contacts-service.ts`
**الصفحة:** Contacts (`/dashboard/contacts`)

| # | Method | Endpoint | الوصف | الصفحة |
|---|--------|----------|-------|--------|
| 1 | GET | `/contacts` | قائمة جهات الاتصال | Contacts |
| 2 | GET | `/contacts/{id}` | تفاصيل جهة اتصال | Contacts |
| 3 | PUT | `/contacts/{id}` | تحديث جهة اتصال | Contacts |
| 4 | PUT | `/contacts/{id}/custom-fields` | تحديث الحقول المخصصة | Contacts |
| 5 | DELETE | `/contacts/{id}` | حذف جهة اتصال | Contacts |
| 6 | POST | `/contacts/{id}/convert` | تحويل عميل ↔ جهة اتصال | Contacts |
| 7 | POST | `/contacts` | إنشاء جهة اتصال | Contacts |
| 8 | GET | `/contacts/stats/summary` | إحصائيات | Contacts |
| 9 | GET | `/contacts/filters` | فلاتر | Contacts |
| 10 | GET | `/contacts/sidebar-summary` | ملخص الشريط الجانبي | Contacts |
| 11 | POST | `/contacts/bulk/convert` | تحويل بالجملة | Contacts |
| 12 | POST | `/contacts/bulk/fields` | تحديث حقول بالجملة | Contacts |
| 13 | GET | `/contacts/search/customers` | بحث عملاء للتحويل | Contacts |
| 14 | GET | `/contacts/dynamic-fields` | الحقول الديناميكية | Contacts + Contact Fields |
| 15 | POST | `/contacts/dynamic-fields` | إنشاء حقل ديناميكي | Contacts + Contact Fields |
| 16 | PUT | `/contacts/dynamic-fields/{name}` | تحديث حقل ديناميكي | Contacts + Contact Fields |
| 17 | DELETE | `/contacts/dynamic-fields/{name}` | حذف حقل ديناميكي | Contacts + Contact Fields |
| 18 | GET | `/contacts/fields/required` | الحقول المطلوبة | Contacts |

---

## 5. 📚 قاعدة المعرفة (Knowledge Base)

**ملف الخدمة:** `features/knowledge/services/knowledge-service.ts`
**الصفحة:** Knowledge (`/dashboard/knowledge`)

| # | Method | Endpoint | الوصف | الصفحة |
|---|--------|----------|-------|--------|
| 1 | POST | `/departments` | إنشاء قسم | Knowledge |
| 2 | GET | `/departments` | قائمة الأقسام | Knowledge |
| 3 | GET | `/departments/lookup` | أقسام مختصرة | Knowledge |
| 4 | GET | `/departments/{id}` | تفاصيل قسم | Knowledge |
| 5 | PATCH | `/departments/{id}` | تحديث قسم | Knowledge |
| 6 | DELETE | `/departments/{id}` | حذف قسم | Knowledge |
| 7 | POST | `/departments/{id}/categories/link` | ربط فئة بقسم | Knowledge |
| 8 | GET | `/departments/{id}/categories` | فئات القسم | Knowledge |
| 9 | DELETE | `/departments/{id}/categories/{cid}` | فك ربط فئة | Knowledge |
| 10 | POST | `/categories` | إنشاء فئة | Knowledge |
| 11 | GET | `/categories` | قائمة الفئات | Knowledge |
| 12 | GET | `/categories/{id}` | تفاصيل فئة | Knowledge |
| 13 | PATCH | `/categories/{id}` | تحديث فئة | Knowledge |
| 14 | DELETE | `/categories/{id}` | حذف فئة | Knowledge |
| 15 | GET | `/documents/search-documents` | بحث المستندات | Knowledge |
| 16 | POST | `/documents/requests-update-data` | تحديث مستند | Knowledge |
| 17 | DELETE | `/documents/delete-doc-by-id` | حذف مستندات | Knowledge |
| 18 | POST | `/documents/train-data-request` | رفع ملف تدريب (مختلط) | Knowledge |
| 19 | POST | `/training/train-txt-request` | رفع ملف TXT للتدريب | Knowledge |
| 20 | POST | `/training/train-csv-request` | رفع ملف CSV للتدريب | Knowledge |
| 21 | GET | `/training/check-data-model-health` | فحص صحة النموذج | Knowledge |
| 22 | POST | `/documents/requests-add-data-json` | إضافة بيانات نصية | Knowledge |
| 23 | GET | `/documents/get-files/data` | قائمة ملفات المستخدمين | Knowledge |
| 24 | GET | `/documents/get-user-files/{username}` | ملفات مستخدم | Knowledge |
| 25 | DELETE | `/documents/delete-docs-by-username` | حذف مستندات مستخدم | Knowledge |
| 26 | DELETE | `/documents/delete-docs-by-filename` | حذف مستندات ملف | Knowledge |
| 27 | DELETE | `/documents/delete-collection` | حذف مجموعة | Knowledge |
| 28 | DELETE | `/documents/request-delete-collection-admin` | حذف الكل (مشرف) | Knowledge |
| 29 | GET | `/documents/files/docs/{user}/{file}` | مستندات ملف محدد | Knowledge |
| 30 | GET | `/documents/download-user-file` | تنزيل ملف | Knowledge |
| 31 | DELETE | `/documents/request-delete-by-department` | حذف حسب القسم | Knowledge |
| 32 | DELETE | `/documents/request-delete-by-category` | حذف حسب الفئة | Knowledge |
| 33 | GET | `/documents/files/analytics/tenant` | تحليلات المستأجر | Knowledge |

---

## 6. 👤 إدارة المستخدمين (Users)

**ملف الخدمة:** `features/users/services/users-service.ts` + `features/roles/services/admin-service.ts`
**الصفحة:** Users (`/dashboard/users`) + الإعدادات → المستخدمين

| # | Method | Endpoint | الوصف | الصفحة |
|---|--------|----------|-------|--------|
| 1 | GET | `/admin/get-all-users` | قائمة المستخدمين | Users |
| 2 | GET | `/admin/brief/{user_id}` | تفاصيل مستخدم | Users |
| 3 | GET | `/admin/me` | المستخدم الحالي | Users + Profile |
| 4 | POST | `/admin/create-user` | إنشاء مستخدم | Users |
| 5 | PUT | `/admin/update-user` | تحديث مستخدم | Users + Profile |
| 6 | DELETE | `/admin/delete-user` | حذف مستخدم | Users |
| 7 | PATCH | `/admin/update-user-status` | تبديل حالة المستخدم | Users |
| 8 | GET | `/admin/get-session-info` | معلومات جلسة | Users |
| 9 | GET | `/admin/get-all-session-handles-for-user` | جلسات المستخدم | Users |
| 10 | POST | `/admin/revoke-user-session` | إلغاء جلسة | Users |
| 11 | POST | `/admin/revoke-multiple-user-sessions` | إلغاء جلسات متعددة | Users |
| 12 | POST | `/admin/revoke-all-sessions-for-user` | إلغاء كل جلسات مستخدم | Users |
| 13 | GET | `/roles/get-roles` | قائمة الأدوار (للتعيين) | Users |
| 14 | POST | `/roles/assign-role` | إسناد دور | Users |
| 15 | POST | `/auth/admin/set` | تعيين كلمة مرور بواسطة المشرف | Users |

---

## 7. 🛡️ الأدوار والصلاحيات (Roles)

**ملف الخدمة:** `features/roles/services/roles-service.ts`
**الصفحة:** Roles (`/dashboard/roles`) + الإعدادات → الأدوار

| # | Method | Endpoint | الوصف | الصفحة |
|---|--------|----------|-------|--------|
| 1 | GET | `/roles/get-roles` | قائمة الأدوار | Roles |
| 2 | POST | `/roles/create-role` | إنشاء دور | Roles |
| 3 | DELETE | `/roles/delete-role/{role}` | حذف دور | Roles |
| 4 | GET | `/roles/get-role-permissions/{role}` | صلاحيات الدور | Roles |
| 5 | POST | `/roles/add-role-permissions/{role}` | إضافة صلاحيات | Roles |
| 6 | DELETE | `/roles/remove-role-permissions/{role}` | إزالة صلاحيات | Roles |
| 7 | GET | `/roles/get-roles-by-permission/{perm}` | أدوار بصلاحية | Roles |
| 8 | POST | `/roles/assign-role` | إسناد دور لمستخدم | Roles |
| 9 | DELETE | `/roles/remove-role` | إزالة دور من مستخدم | Roles |
| 10 | GET | `/roles/get-user-roles/{user_id}` | أدوار المستخدم | Roles |
| 11 | GET | `/roles/get-users-with-role/{role}` | مستخدمين بدور | Roles |
| 12 | GET | `/permissions/get-permission-admin-permissions` | كل صلاحيات النظام | Roles |
| 13 | GET | `/roles/get-my-permissions` | صلاحياتي | عام (الإعدادات) |

---

## 8. 📡 القنوات (Channels)

**ملف الخدمة:** `features/channels/services/channels-service.ts`
**الصفحة:** Channels (`/dashboard/channels`) + الإعدادات → القنوات

| # | Method | Endpoint | الوصف | الصفحة |
|---|--------|----------|-------|--------|
| 1 | GET | `/channels/{platform}` | قائمة القنوات | Channels |
| 2 | GET | `/channels/{platform}/{id}` | تفاصيل قناة | Channels |
| 3 | POST | `/channels/{platform}/add` | إنشاء قناة | Channels |
| 4 | PATCH | `/channels/{platform}/{id}` | تحديث قناة | Channels |
| 5 | DELETE | `/channels/{platform}/{id}` | حذف قناة | Channels |
| 6 | PATCH | `/channels/{platform}/toggle` | تبديل منصة | Channels |
| 7 | PATCH | `/channels/{platform}/{id}/toggle` | تبديل قناة | Channels |
| 8 | GET | `/channels/{platform}/{id}/flags` | أعلام القناة | Channels |
| 9 | PATCH | `/channels/{platform}/{id}/flags` | تحديث أعلام | Channels |
| 10 | GET | `/data/flags?id={id}` | أعلام بمعرّف | Channels |
| 11 | GET | `/data/flags/platforms` | حالة المنصات | Channels |

---

## 9. 🤖 الذكاء الاصطناعي / الوكلاء (AI / Agents)

**ملف الخدمة:** `features/ai-settings/services/ai-settings-service.ts`
**الصفحة:** الإعدادات → AI (`/dashboard/settings/ai/:agentId`)

| # | Method | Endpoint | الوصف | الصفحة |
|---|--------|----------|-------|--------|
| 1 | GET | `/agents` | قائمة الوكلاء | AI Settings |
| 2 | GET | `/agents/{id}` | تفاصيل وكيل | Agent Detail |
| 3 | POST | `/agents` | إنشاء وكيل | AI Settings |
| 4 | PATCH | `/agents/{id}` | تحديث وكيل | Agent Detail |
| 5 | DELETE | `/agents/{id}` | حذف وكيل | AI Settings |
| 6 | GET | `/agents/{id}/ai` | إعدادات AI | Agent Detail |
| 7 | PATCH | `/agents/{id}/ai` | تحديث إعدادات AI | Agent Detail |
| 8 | GET | `/agents/{id}/ai/providers/{name}` | مزود AI | Agent Detail |
| 9 | PATCH | `/agents/{id}/ai/providers/{name}` | تحديث مزود AI | Agent Detail |
| 10 | POST | `/agents/{id}/ai/providers/{name}` | إنشاء مزود AI | Agent Detail |
| 11 | DELETE | `/agents/{id}/ai/providers/{name}` | حذف مزود AI | Agent Detail |
| 12 | POST | `/agents/{id}/ai/providers/{name}/models` | إضافة نموذج | Agent Detail |
| 13 | DELETE | `/agents/{id}/ai/providers/{name}/models/{model}` | حذف نموذج | Agent Detail |
| 14 | GET | `/agents/{id}/ai/features` | ميزات AI | Agent Detail |
| 15 | PATCH | `/agents/{id}/ai/features` | تحديث ميزات AI | Agent Detail |
| 16 | GET | `/agents/{id}/prompts` | الأوامر النصية | Agent Detail |
| 17 | PATCH | `/agents/{id}/prompts` | تحديث الأوامر | Agent Detail |
| 18 | GET | `/agents/{id}/tts` | إعدادات TTS | Agent Detail |
| 19 | PATCH | `/agents/{id}/tts` | تحديث TTS | Agent Detail |
| 20 | POST | `/agents/{id}/tts/toggle` | تبديل TTS | Agent Detail |
| 21 | GET | `/agents/{id}/tts/providers/{name}` | مزود TTS | Agent Detail |
| 22 | PATCH | `/agents/{id}/tts/providers/{name}` | تحديث مزود TTS | Agent Detail |

---

## 10. 🍽️ إدارة القوائم (Menu Manager)

**ملف الخدمة:** `features/menu-manager/services/menu-manager-service.ts`
**الصفحة:** Menu Manager (`/dashboard/menu-manager`)

### Templates
| # | Method | Endpoint | الوصف |
|---|--------|----------|-------|
| 1 | GET | `/menu-manager/templates` | قائمة القوالب |
| 2 | GET | `/menu-manager/templates/{id}` | تفاصيل قالب |
| 3 | POST | `/menu-manager/templates` | إنشاء قالب |
| 4 | PUT | `/menu-manager/templates/{id}` | تحديث قالب |
| 5 | DELETE | `/menu-manager/templates/{id}` | حذف قالب |

### Menu Items / Tree
| # | Method | Endpoint | الوصف |
|---|--------|----------|-------|
| 6 | GET | `/menu-manager/templates/{id}/tree` | شجرة القائمة |
| 7 | GET | `/menu-manager/templates/{id}/items` | قائمة العناصر |
| 8 | GET | `/menu-manager/templates/{id}/items/{itemId}` | عنصر واحد |
| 9 | POST | `/menu-manager/templates/{id}/items` | إنشاء عنصر |
| 10 | PUT | `/menu-manager/templates/{id}/items/{itemId}` | تحديث عنصر |
| 11 | DELETE | `/menu-manager/templates/{id}/items/{itemId}` | حذف عنصر |
| 12 | POST | `/menu-manager/templates/{id}/items/{itemId}/move` | نقل عنصر |
| 13 | POST | `/menu-manager/templates/{id}/items/reorder` | إعادة ترتيب |

### Assignments
| # | Method | Endpoint | الوصف |
|---|--------|----------|-------|
| 14 | GET | `/menu-manager/assignments` | قائمة التعيينات |
| 15 | GET | `/menu-manager/assignments/{id}` | تفاصيل تعيين |
| 16 | POST | `/menu-manager/assignments` | إنشاء تعيين |
| 17 | PUT | `/menu-manager/assignments/{id}` | تحديث تعيين |
| 18 | DELETE | `/menu-manager/assignments/{id}` | حذف تعيين |

### Account Groups
| # | Method | Endpoint | الوصف |
|---|--------|----------|-------|
| 19 | GET | `/menu-manager/account-groups` | قائمة المجموعات |
| 20 | GET | `/menu-manager/account-groups/{id}` | تفاصيل مجموعة |
| 21 | POST | `/menu-manager/account-groups` | إنشاء مجموعة |
| 22 | PUT | `/menu-manager/account-groups/{id}` | تحديث مجموعة |
| 23 | DELETE | `/menu-manager/account-groups/{id}` | حذف مجموعة |
| 24 | POST | `/menu-manager/account-groups/{id}/accounts` | إضافة حسابات |
| 25 | DELETE | `/menu-manager/account-groups/{id}/accounts` | إزالة حسابات |

### Account Menus (Preview)
| # | Method | Endpoint | الوصف |
|---|--------|----------|-------|
| 26 | GET | `/menu-manager/accounts/{id}/menu/main` | القائمة الرئيسية |
| 27 | GET | `/menu-manager/accounts/{id}/menu/items/{key}` | عنصر قائمة |
| 28 | GET | `/menu-manager/accounts/{id}/menu/items/{key}/siblings` | العناصر المجاورة |
| 29 | GET | `/menu-manager/accounts/{id}/menus/{key}/compiled` | القائمة المجمّعة |
| 30 | GET | `/menu-manager/menus/{id}/compiled` | القائمة المجمعة (Legacy) |

### Cache + Media
| # | Method | Endpoint | الوصف |
|---|--------|----------|-------|
| 31 | DELETE | `/menu-manager/cache/accounts/{id}/menus` | مسح كاش الحساب |
| 32 | DELETE | `/menu-manager/cache/templates/{id}` | مسح كاش القالب |
| 33 | GET | `/media/{id}/public-url` | رابط عام للوسائط |
| 34 | POST | `/media/upload` | رفع وسائط |
| 35 | GET | `/media/{id}/info` | معلومات الوسائط |

---

## 11. ⚙️ الإعدادات العامة (Organization + Profile)

**ملف الخدمة:** `features/settings/services/settings-service.ts`
**الصفحة:** الإعدادات → الإعدادات العامة + الملف الشخصي

| # | Method | Endpoint | الوصف | الصفحة |
|---|--------|----------|-------|--------|
| 1 | GET | `/organization` | بيانات المؤسسة | الإعدادات العامة |
| 2 | PATCH | `/organization` | تحديث المؤسسة | الإعدادات العامة |
| 3 | GET | `/admin/me` | الملف الشخصي | الملف الشخصي |
| 4 | PUT | `/admin/update-user` | تحديث الملف الشخصي | الملف الشخصي |

---

## 12. 👥 الفرق (Teams)

**ملف الخدمة:** `features/settings/services/teams-tags-service.ts`
**الصفحة:** الإعدادات → الفرق

| # | Method | Endpoint | الوصف | الصفحة |
|---|--------|----------|-------|--------|
| 1 | GET | `/teams/statistics` | إحصائيات الفرق | Teams |
| 2 | GET | `/get_teams` | قائمة مع Pagination | Teams |
| 3 | GET | `/teams` | جميع الفرق | Teams |
| 4 | GET | `/teams/{id}` | فريق محدد | Teams |
| 5 | POST | `/teams` | إنشاء فريق | Teams |
| 6 | PATCH | `/teams/{id}` | تحديث فريق | Teams |
| 7 | PATCH | `/teams/{id}/members` | تحديث الأعضاء | Teams |
| 8 | PATCH | `/teams/assign-customer` | تعيين عميل | Teams + Inbox |
| 9 | PATCH | `/teams/assign-customers-bulk` | تعيين عملاء متعددين | Teams |
| 10 | GET | `/customers-by-team` | عملاء الفريق | Teams |
| 11 | DELETE | `/teams/{id}` | حذف فريق | Teams |
| 12 | GET | `/teams/deleted` | الفرق المحذوفة | Teams |
| 13 | PATCH | `/teams/{id}/restore` | استعادة فريق | Teams |
| 14 | GET | `/teams/cache-view` | قائمة مصغرة | Teams + Inbox |
| 15 | GET | `/teams/{id}/members` | أعضاء الفريق | Teams |
| 16 | POST | `/teams/{id}/members/{uid}` | إضافة عضو | Teams |
| 17 | DELETE | `/teams/{id}/members/{uid}` | إزالة عضو | Teams |

---

## 13. 🏷️ التاجات (Tags)

**ملف الخدمة:** `features/settings/services/tags-service.ts`
**الصفحة:** الإعدادات → التاجات

| # | Method | Endpoint | الوصف | الصفحة |
|---|--------|----------|-------|--------|
| 1 | GET | `/tags` | قائمة التاجات | Tags |
| 2 | GET | `/tags/{id}` | تاج محدد | Tags |
| 3 | POST | `/tags` | إنشاء تاج | Tags |
| 4 | PATCH | `/tags/{id}` | تحديث تاج | Tags |
| 5 | DELETE | `/tags/{id}` | حذف تاج | Tags |
| 6 | GET | `/tags/deleted` | التاجات المحذوفة | Tags |
| 7 | PATCH | `/tags/{id}/restore` | استعادة تاج | Tags |

---

## 14. 📝 المقتطفات (Snippets)

**ملف الخدمة:** `features/settings/services/snippets-service.ts`
**الصفحة:** الإعدادات → Snippets + Inbox (للاستخدام)

| # | Method | Endpoint | الوصف | الصفحة |
|---|--------|----------|-------|--------|
| 1 | GET | `/snippets` | قائمة المقتطفات | Snippets |
| 2 | GET | `/snippets/{id}` | مقتطف محدد | Snippets |
| 3 | POST | `/snippets` | إنشاء مقتطف | Snippets |
| 4 | PATCH | `/snippets/{id}` | تحديث مقتطف | Snippets |
| 5 | DELETE | `/snippets/{id}` | حذف مقتطف | Snippets |
| 6 | POST | `/media/upload` | رفع وسائط للمقتطف | Snippets |

---

## 15. 🔄 دورات الحياة (Lifecycles)

**ملف الخدمة:** `features/settings/services/lifecycles-service.ts`
**الصفحة:** الإعدادات → دورات الحياة

| # | Method | Endpoint | الوصف | الصفحة |
|---|--------|----------|-------|--------|
| 1 | GET | `/lifecycles` | جميع المراحل | Lifecycles |
| 2 | POST | `/lifecycles` | إضافة مرحلة | Lifecycles |
| 3 | PATCH | `/lifecycles/{code}` | تعديل مرحلة | Lifecycles |
| 4 | DELETE | `/lifecycles/{code}` | حذف مرحلة | Lifecycles |
| 5 | GET | `/lifecycles/deleted` | المراحل المعطّلة | Lifecycles |
| 6 | PATCH | `/lifecycles/{code}/restore` | استعادة مرحلة | Lifecycles |
| 7 | PATCH | `/lifecycles/customers/{id}/lifecycle` | تغيير مرحلة عميل | Lifecycles + Inbox |

---

## 16. 📋 حقول جهات الاتصال (Contact Fields)

**ملف الخدمة:** `features/settings/services/contact-fields-service.ts`
**الصفحة:** الإعدادات → حقول جهات الاتصال

| # | Method | Endpoint | الوصف | الصفحة |
|---|--------|----------|-------|--------|
| 1 | GET | `/contacts/dynamic-fields` | جميع الحقول | Contact Fields |
| 2 | GET | `/contacts/dynamic-fields/{name}` | حقل واحد | Contact Fields |
| 3 | POST | `/contacts/dynamic-fields` | إنشاء حقل | Contact Fields |
| 4 | PUT | `/contacts/dynamic-fields/{name}` | تحديث حقل | Contact Fields |
| 5 | DELETE | `/contacts/dynamic-fields/{name}` | حذف حقل | Contact Fields |

---

## 17. 🔔 الإشعارات (Notifications)

**ملف الخدمة:** `features/notifications/services/notification-service.ts`
**الصفحة:** شريط التنبيهات (عام — كل الصفحات)

| # | Method | Endpoint | الوصف | الصفحة |
|---|--------|----------|-------|--------|
| 1 | GET | `/notifications` | قائمة الإشعارات | عام |
| 2 | POST | `/notifications/{id}/mark-read` | تحديد كمقروء | عام |
| 3 | POST | `/notifications/mark-all-read` | تحديد الكل كمقروء | عام |
| 4 | GET | `/notifications/count` | عداد الإشعارات | عام |

---

## 18. 📜 سجل العمليات (Operation History)

**ملف الخدمة:** `features/operation-history/services/operation-history-service.ts`
**الصفحة:** Operation History (غير مفعّل كمسار حالياً — يعمل من الإعدادات)

| # | Method | Endpoint | الوصف | الصفحة |
|---|--------|----------|-------|--------|
| 1 | GET | `/history/search-operations` | بحث العمليات | Operation History |
| 2 | GET | `/history/get-operation-details` | تفاصيل عملية | Operation History |
| 3 | GET | `/history/download-operations-csv` | تنزيل CSV | Operation History |
| 4 | GET | `/history/download-operation-train-file` | تنزيل ملف تدريب | Operation History |

---

## 19. ⏳ الطلبات المعلقة (Pending Requests)

**ملف الخدمة:** `features/pending-requests/services/pending-requests-service.ts`
**الصفحة:** Pending Requests (غير مفعّل كمسار حالياً — يعمل من الإعدادات)

| # | Method | Endpoint | الوصف | الصفحة |
|---|--------|----------|-------|--------|
| 1 | GET | `/get-pending-orders` | قائمة الطلبات المعلقة | Pending Requests |
| 2 | GET | `/pending/search-pending-orders` | بحث الطلبات | Pending Requests |
| 3 | GET | `/pending/get-request-details` | تفاصيل طلب | Pending Requests |
| 4 | POST | `/pending/process-approve` | الموافقة على طلب | Pending Requests |
| 5 | POST | `/pending/process-reject` | رفض طلب | Pending Requests |
| 6 | GET | `/pending/download-request-train-file` | تنزيل ملف تدريب | Pending Requests |

---

## 📊 ملخص إحصائي

| الصفحة | عدد الـ Endpoints | ملف الخدمة الرئيسي |
|--------|:-----------------:|---------------------|
| Auth (Login/Register...) | 10 | `auth-service.ts` |
| Dashboard | 1 | `analytics-service.ts` |
| Inbox + Conversation | 25 | `inbox-service.ts` |
| Contacts | 18 | `contacts-service.ts` |
| Knowledge Base | 33 | `knowledge-service.ts` |
| Users | 15 | `users-service.ts` |
| Roles | 13 | `roles-service.ts` |
| Channels | 11 | `channels-service.ts` |
| AI / Agents | 22 | `ai-settings-service.ts` |
| Menu Manager | 35 | `menu-manager-service.ts` |
| Organization Settings | 2 | `settings-service.ts` |
| Profile | 2 | `settings-service.ts` |
| Teams | 17 | `teams-tags-service.ts` |
| Tags | 7 | `tags-service.ts` |
| Snippets | 6 | `snippets-service.ts` |
| Lifecycles | 7 | `lifecycles-service.ts` |
| Contact Fields | 5 | `contact-fields-service.ts` |
| Notifications | 4 | `notification-service.ts` |
| Operation History | 4 | `operation-history-service.ts` |
| Pending Requests | 6 | `pending-requests-service.ts` |
| **المجموع** | **~243** | **20 ملف** |

> [!TIP]
> بعض الـ endpoints مشتركة بين أكثر من صفحة (مثل `/media/upload`, `/admin/brief`, `/contacts/dynamic-fields`)، لذلك العدد الفعلي للـ endpoints الفريدة حوالي **~170**.
