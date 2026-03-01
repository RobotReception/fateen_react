# 📘 توثيق API — إعدادات المؤسسة (كامل)

> **Base URL:** `/api/backend/v2`
> **Auth:** `Authorization: Bearer <token>` | **Tenant:** `X-Tenant-ID: <tenant_id>`
> **آخر تحديث:** 2026-03-01 | **الإجمالي:** 103 endpoint

---

## 📊 ملخّص شامل

| # | التبويب | ملف الخدمة | Endpoints |
|:-:|--------|-----------|:-:|
| 1 | الإعدادات العامة | `settings-service.ts` | 4 |
| 2 | إدارة المستخدمين | `users-service.ts` | 15 |
| 3 | الأدوار والصلاحيات | `roles-service.ts` | 12 |
| 4 | الفرق | `teams-tags-service.ts` | 17 |
| 5 | القنوات | `channels-service.ts` | 11 |
| 6 | الذكاء الاصطناعي | `ai-settings-service.ts` | 19 |
| 7 | حقول جهات الاتصال | `contact-fields-service.ts` | 5 |
| 8 | دورات الحياة | `lifecycles-service.ts` | 7 |
| 9 | Snippets | `snippets-service.ts` | 6 |
| 10 | التاجات | `tags-service.ts` | 7 |
| 11 | تخصيص المظهر | *(يستخدم localStorage فقط)* | 0 |
| 12 | الاشتراك والدفع | `settings-service.ts` | 0 |
| | **الإجمالي** | | **103** |

---

# 1️⃣ الإعدادات العامة — `settings-service.ts`

| # | Method | Path | الوصف |
|:-:|:------:|------|-------|
| 1 | `GET` | `/organization` | جلب بيانات المؤسسة |
| 2 | `PATCH` | `/organization` | تحديث بيانات المؤسسة |
| 3 | `GET` | `/admin/me` | الملف الشخصي للمستخدم الحالي |
| 4 | `PUT` | `/admin/update-user` | تحديث الملف الشخصي |

---

# 2️⃣ إدارة المستخدمين — `users-service.ts`

| # | Method | Path | الوصف |
|:-:|:------:|------|-------|
| 1 | `GET` | `/admin/get-all-users` | قائمة المستخدمين (Paginated) |
| 2 | `GET` | `/admin/brief/{user_id}` | تفاصيل مستخدم |
| 3 | `GET` | `/admin/me` | المستخدم الحالي |
| 4 | `POST` | `/admin/create-user` | إنشاء مستخدم |
| 5 | `PUT` | `/admin/update-user` | تحديث مستخدم |
| 6 | `DELETE` | `/admin/delete-user` | حذف مستخدم |
| 7 | `PATCH` | `/admin/update-user-status` | تفعيل/تعطيل مستخدم |
| 8 | `GET` | `/admin/get-session-info` | تفاصيل جلسة |
| 9 | `GET` | `/admin/get-all-session-handles-for-user` | جلسات المستخدم |
| 10 | `POST` | `/admin/revoke-user-session` | إلغاء جلسة واحدة |
| 11 | `POST` | `/admin/revoke-multiple-user-sessions` | إلغاء جلسات متعددة |
| 12 | `POST` | `/admin/revoke-all-sessions-for-user` | إلغاء كل الجلسات |
| 13 | `GET` | `/roles/get-roles` | قائمة الأدوار |
| 14 | `POST` | `/roles/assign-role` | تعيين دور لمستخدم |
| 15 | `POST` | `/auth/admin/set` | تعيين كلمة مرور |

---

# 3️⃣ الأدوار والصلاحيات — `roles-service.ts`

| # | Method | Path | الوصف |
|:-:|:------:|------|-------|
| 1 | `GET` | `/roles/get-roles` | قائمة الأدوار |
| 2 | `POST` | `/roles/create-role` | إنشاء دور |
| 3 | `DELETE` | `/roles/delete-role/{role}` | حذف دور |
| 4 | `GET` | `/roles/get-role-permissions/{role}` | صلاحيات دور |
| 5 | `POST` | `/roles/add-role-permissions/{role}` | إضافة صلاحيات لدور |
| 6 | `DELETE` | `/roles/remove-role-permissions/{role}` | إزالة صلاحيات من دور |
| 7 | `GET` | `/roles/get-roles-by-permission/{permission}` | أدوار حسب صلاحية |
| 8 | `POST` | `/roles/assign-role` | تعيين دور لمستخدم |
| 9 | `DELETE` | `/roles/remove-role` | إزالة دور من مستخدم |
| 10 | `GET` | `/roles/get-user-roles/{user_id}` | أدوار مستخدم |
| 11 | `GET` | `/roles/get-users-with-role/{role}` | مستخدمو دور معين |
| 12 | `GET` | `/permissions/get-permission-admin-permissions` | كل صلاحيات النظام |

---

# 4️⃣ الفرق — `teams-tags-service.ts`

| # | Method | Path | الوصف |
|:-:|:------:|------|-------|
| 1 | `GET` | `/teams/statistics` | إحصائيات الفرق |
| 2 | `GET` | `/get_teams` | قائمة الفرق (Paginated) |
| 3 | `GET` | `/teams` | جميع الفرق |
| 4 | `GET` | `/teams/{team_id}` | فريق محدد |
| 5 | `POST` | `/teams` | إنشاء فريق |
| 6 | `PATCH` | `/teams/{team_id}` | تحديث فريق |
| 7 | `PATCH` | `/teams/{team_id}/members` | تحديث أعضاء الفريق |
| 8 | `PATCH` | `/teams/assign-customer` | تعيين عميل لفرق |
| 9 | `PATCH` | `/teams/assign-customers-bulk` | تعيين عملاء متعددين |
| 10 | `GET` | `/customers-by-team` | عملاء فريق معين |
| 11 | `DELETE` | `/teams/{team_id}` | تعطيل فريق |
| 12 | `GET` | `/teams/deleted` | الفرق المعطّلة |
| 13 | `PATCH` | `/teams/{team_id}/restore` | استعادة فريق |
| 14 | `GET` | `/teams/cache-view` | قائمة مصغرة (dropdown) |
| 15 | `GET` | `/teams/{team_id}/members` | أعضاء الفريق بالتفاصيل |
| 16 | `POST` | `/teams/{team_id}/members/{user_id}` | إضافة عضو |
| 17 | `DELETE` | `/teams/{team_id}/members/{user_id}` | إزالة عضو |

---

# 5️⃣ القنوات — `channels-service.ts`

| # | Method | Path | الوصف |
|:-:|:------:|------|-------|
| 1 | `POST` | `/channels/{platform}/add` | إضافة قناة |
| 2 | `GET` | `/channels/{platform}` | قنوات منصة |
| 3 | `GET` | `/channels/{platform}/{identifier}` | قناة محددة |
| 4 | `PATCH` | `/channels/{platform}/{identifier}` | تحديث قناة |
| 5 | `DELETE` | `/channels/{platform}/{identifier}` | حذف قناة |
| 6 | `PATCH` | `/channels/{platform}/toggle` | تفعيل/تعطيل منصة |
| 7 | `PATCH` | `/channels/{platform}/{identifier}/toggle` | تفعيل/تعطيل قناة |
| 8 | `GET` | `/channels/{platform}/{identifier}/flags` | أعلام قناة |
| 9 | `PATCH` | `/channels/{platform}/{identifier}/flags` | تحديث أعلام |
| 10 | `GET` | `/data/flags` | أعلام بالـ ID |
| 11 | `GET` | `/data/flags/platforms` | حالة جميع المنصات |

> **المنصات:** `whatsapp` · `telegram` · `instagram` · `messenger`

---

# 6️⃣ الذكاء الاصطناعي — `ai-settings-service.ts`

**Base URL:** `/api/backend/v2/agents`

### Agents CRUD
| # | Method | Path | الوصف |
|:-:|:------:|------|-------|
| 1 | `GET` | `/` | قائمة الوكلاء |
| 2 | `GET` | `/{id}` | وكيل محدد |
| 3 | `POST` | `/` | إنشاء وكيل |
| 4 | `PATCH` | `/{id}` | تحديث وكيل |
| 5 | `DELETE` | `/{id}` | حذف وكيل |

### AI Settings
| # | Method | Path | الوصف |
|:-:|:------:|------|-------|
| 6 | `GET` | `/{id}/ai` | إعدادات AI |
| 7 | `PATCH` | `/{id}/ai` | تحديث إعدادات AI |

### Providers
| # | Method | Path | الوصف |
|:-:|:------:|------|-------|
| 8 | `GET` | `/{id}/ai/providers/{name}` | مزود محدد |
| 9 | `PATCH` | `/{id}/ai/providers/{name}` | تحديث مزود |
| 10 | `POST` | `/{id}/ai/providers/{name}` | إنشاء مزود |
| 11 | `DELETE` | `/{id}/ai/providers/{name}` | حذف مزود |
| 12 | `POST` | `/{id}/ai/providers/{name}/models` | إضافة نموذج |
| 13 | `DELETE` | `/{id}/ai/providers/{name}/models/{modelId}` | حذف نموذج |

### Features & Prompts
| # | Method | Path | الوصف |
|:-:|:------:|------|-------|
| 14 | `GET` | `/{id}/ai/features` | ميزات AI |
| 15 | `PATCH` | `/{id}/ai/features` | تحديث الميزات |
| 16 | `GET` | `/{id}/prompts` | إعدادات البرومبتات |
| 17 | `PATCH` | `/{id}/prompts` | تحديث البرومبتات |

### TTS (تحويل النص لكلام)
| # | Method | Path | الوصف |
|:-:|:------:|------|-------|
| 18 | `GET` | `/{id}/tts` | إعدادات TTS |
| 19 | `PATCH` | `/{id}/tts` | تحديث TTS |
| 20 | `POST` | `/{id}/tts/toggle` | تفعيل/تعطيل TTS |
| 21 | `GET` | `/{id}/tts/providers/{name}` | مزود TTS |
| 22 | `PATCH` | `/{id}/tts/providers/{name}` | تحديث مزود TTS |

---

# 7️⃣ حقول جهات الاتصال — `contact-fields-service.ts`

| # | Method | Path | الوصف |
|:-:|:------:|------|-------|
| 1 | `GET` | `/contacts/dynamic-fields` | جميع الحقول |
| 2 | `GET` | `/contacts/dynamic-fields/{field_name}` | حقل محدد |
| 3 | `POST` | `/contacts/dynamic-fields` | إنشاء حقل |
| 4 | `PUT` | `/contacts/dynamic-fields/{field_name}` | تحديث حقل |
| 5 | `DELETE` | `/contacts/dynamic-fields/{field_name}` | حذف حقل |

---

# 8️⃣ دورات الحياة — `lifecycles-service.ts`

| # | Method | Path | الوصف |
|:-:|:------:|------|-------|
| 1 | `GET` | `/lifecycles` | جميع المراحل |
| 2 | `POST` | `/lifecycles` | إضافة مرحلة |
| 3 | `PATCH` | `/lifecycles/{code}` | تعديل مرحلة |
| 4 | `DELETE` | `/lifecycles/{code}` | تعطيل مرحلة |
| 5 | `GET` | `/lifecycles/deleted` | المراحل المعطّلة |
| 6 | `PATCH` | `/lifecycles/{code}/restore` | استعادة مرحلة |
| 7 | `PATCH` | `/lifecycles/customers/{customer_id}/lifecycle` | تغيير مرحلة عميل |

---

# 9️⃣ Snippets — `snippets-service.ts`

| # | Method | Path | الوصف |
|:-:|:------:|------|-------|
| 1 | `GET` | `/snippets` | قائمة القوالب |
| 2 | `GET` | `/snippets/{field_id}` | قالب محدد |
| 3 | `POST` | `/snippets` | إنشاء قالب |
| 4 | `PATCH` | `/snippets/{field_id}` | تحديث قالب |
| 5 | `DELETE` | `/snippets/{field_id}` | حذف قالب |
| 6 | `POST` | `/media/upload` | رفع ملف وسائط |

---

# 🔟 التاجات — `tags-service.ts`

| # | Method | Path | الوصف |
|:-:|:------:|------|-------|
| 1 | `GET` | `/tags` | قائمة التاجات (Paginated) |
| 2 | `GET` | `/tags/{tag_id}` | تاج محدد |
| 3 | `POST` | `/tags` | إنشاء تاج |
| 4 | `PATCH` | `/tags/{tag_id}` | تحديث تاج |
| 5 | `DELETE` | `/tags/{tag_id}` | تعطيل تاج |
| 6 | `GET` | `/tags/deleted` | التاجات المعطّلة |
| 7 | `PATCH` | `/tags/{tag_id}/restore` | استعادة تاج |

---

# 1️⃣1️⃣ تخصيص المظهر

> ⚠️ لا يستخدم API — يعتمد على `localStorage` لتخزين إعدادات الثيم (الوضع المظلم/الفاتح، الألوان).

---

# 1️⃣2️⃣ الاشتراك والدفع

> ⚠️ يعتمد على بيانات المؤسسة من `GET /organization` — لا يوجد endpoints مستقلة للفوترة حالياً.
