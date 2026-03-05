# 📋 القوائم (Menu Manager) — الـ Endpoints حسب كل تبويب

الصفحة تحتوي **5 تبويبات**

---

## 1. 📄 القوالب (`TemplatesTab`)

إدارة قوالب القوائم (إنشاء، تعديل، حذف، تغيير حالة).

| # | Method | Endpoint | الوصف | Function |
|---|--------|----------|-------|----------|
| 1 | GET | `/menu-manager/templates` | جلب قائمة القوالب | `listTemplates` |
| 2 | POST | `/menu-manager/templates` | إنشاء قالب جديد | `createTemplate` |
| 3 | PUT | `/menu-manager/templates/{templateId}` | تعديل قالب (اسم، وصف، metadata، حالة) | `updateTemplate` |
| 4 | DELETE | `/menu-manager/templates/{templateId}` | حذف قالب | `deleteTemplate` |

---

## 2. 🌳 محرر الشجرة (`TreeEditorTab`)

بناء وإدارة عناصر القائمة (شجرة هرمية) + رفع وسائط.

| # | Method | Endpoint | الوصف | Function |
|---|--------|----------|-------|----------|
| 1 | GET | `/menu-manager/templates` | جلب قائمة القوالب (لاختيار القالب) | `listTemplates` |
| 2 | GET | `/menu-manager/templates/{templateId}/tree` | جلب الشجرة الكاملة | `getTemplateTree` |
| 3 | GET | `/menu-manager/templates/{templateId}/items/{itemId}` | تفاصيل عنصر | `getItem` |
| 4 | POST | `/menu-manager/templates/{templateId}/items` | إنشاء عنصر جديد | `createItem` |
| 5 | PUT | `/menu-manager/templates/{templateId}/items/{itemId}` | تعديل عنصر | `updateItem` |
| 6 | DELETE | `/menu-manager/templates/{templateId}/items/{itemId}` | حذف عنصر | `deleteItem` |
| 7 | POST | `/media/upload` | رفع وسائط (صور/ملفات/فيديو) | `uploadMedia` |
| 8 | GET | `/media/{mediaId}/public-url` | جلب رابط الوسائط | `getMediaPublicUrl` |

---

## 3. 🔗 التعيينات (`AssignmentsTab`)

ربط القوالب بالحسابات أو المجموعات أو المستأجرين.

| # | Method | Endpoint | الوصف | Function |
|---|--------|----------|-------|----------|
| 1 | GET | `/menu-manager/assignments` | جلب قائمة التعيينات | `listAssignments` |
| 2 | GET | `/menu-manager/templates` | جلب القوالب (للاختيار في النموذج) | `listTemplates` |
| 3 | POST | `/menu-manager/assignments` | إنشاء تعيين جديد | `createAssignment` |
| 4 | PUT | `/menu-manager/assignments/{assignmentId}` | تعديل تعيين | `updateAssignment` |
| 5 | DELETE | `/menu-manager/assignments/{assignmentId}` | حذف تعيين | `deleteAssignment` |
| 6 | GET | `/inbox/accounts` | جلب الحسابات (لاختيار الهدف) ⬅️ من خدمة Inbox | `getAccounts` |

---

## 4. 👥 مجموعات الحسابات (`AccountGroupsTab`)

تنظيم الحسابات في مجموعات + إضافة/إزالة حسابات.

| # | Method | Endpoint | الوصف | Function |
|---|--------|----------|-------|----------|
| 1 | GET | `/menu-manager/account-groups` | جلب المجموعات | `listGroups` |
| 2 | POST | `/menu-manager/account-groups` | إنشاء مجموعة | `createGroup` |
| 3 | PUT | `/menu-manager/account-groups/{groupId}` | تعديل مجموعة | `updateGroup` |
| 4 | DELETE | `/menu-manager/account-groups/{groupId}` | حذف مجموعة | `deleteGroup` |
| 5 | POST | `/menu-manager/account-groups/{groupId}/accounts` | إضافة حسابات للمجموعة | `addAccountsToGroup` |
| 6 | DELETE | `/menu-manager/account-groups/{groupId}/accounts` | إزالة حسابات من المجموعة | `removeAccountsFromGroup` |
| 7 | GET | `/inbox/accounts` | جلب الحسابات (للاختيار) ⬅️ من خدمة Inbox | `getAccounts` |

---

## 5. 👁️ المعاينة (`PreviewTab`)

محاكي واتساب لمعاينة القائمة كما يراها المستخدم.

| # | Method | Endpoint | الوصف | Function |
|---|--------|----------|-------|----------|
| 1 | GET | `/menu-manager/templates` | جلب القوالب (لاختيار القالب) | `listTemplates` |
| 2 | GET | `/menu-manager/templates/{templateId}/tree` | جلب الشجرة للعرض | `getTemplateTree` |
| 3 | GET | `/media/{mediaId}/public-url` | جلب روابط الوسائط (صور/فيديو) | `getMediaPublicUrl` |

---

## 📊 ملخص

| التبويب | عدد الـ Endpoints | ملاحظة |
|---------|:-----------------:|--------|
| القوالب | 4 | CRUD كامل |
| محرر الشجرة | 8 | CRUD عناصر + وسائط |
| التعيينات | 6 | CRUD + حسابات Inbox |
| مجموعات الحسابات | 7 | CRUD + إضافة/إزالة حسابات |
| المعاينة | 3 | قراءة فقط |
| **المجموع** | **28** | |

> بعض الـ endpoints مشتركة (مثل `listTemplates` و `getAccounts`)، العدد الفريد **~18 endpoint**.
