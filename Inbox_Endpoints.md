# 📨 صندوق الوارد (Inbox) — الـ Endpoints حسب كل جزء

الصفحة مكونة من **4 أجزاء رئيسية**: شريط التنقل ← قائمة المحادثات ← نافذة المحادثة ← تفاصيل العميل

---

## 1. 📊 شريط التنقل (`InboxNavSidebar`)

عرض ملخص الصندوق (العدادات، الحالات، دورات الحياة).

| # | Method | Endpoint | الوصف | Function |
|---|--------|----------|-------|----------|
| 1 | GET | `/inbox/sidebar-summary` | ملخص الصندوق (أعداد، حالات، فلاتر) | `getSidebarSummary` |

---

## 2. 📋 قائمة المحادثات (`ConversationListPanel` + `FilterBar`)

جلب العملاء/المحادثات + الفلاتر والبحث.

| # | Method | Endpoint | الوصف | Function |
|---|--------|----------|-------|----------|
| 1 | GET | `/inbox/customers` | جلب قائمة العملاء (مع فلترة وبحث وعد الصفحات) | `getCustomers` |
| 2 | GET | `/inbox/sidebar-summary` | جلب الملخص (لعدادات الفلاتر) | `getSidebarSummary` |
| 3 | GET | `/admin/brief` | جلب المستخدمين المختصر (لفلتر "معيّن لـ") | `getBriefUsers` |
| 4 | GET | `/customers/accounts` | جلب الحسابات (لفلتر الحسابات) | `getAccounts` |

---

## 3. 💬 نافذة المحادثة (Chat Window)

### 3أ. رأس المحادثة (`ConversationHeader` + `CustomerActionsMenu`)

إجراءات على العميل: إغلاق/فتح، تعيين، دورة حياة، AI، مفضلة، كتم.

| # | Method | Endpoint | الوصف | Function |
|---|--------|----------|-------|----------|
| 1 | PATCH | `/customers/{id}/close-conversation` | إغلاق المحادثة | `closeConversation` |
| 2 | PATCH | `/customers/{id}/reopen-conversation` | إعادة فتح المحادثة | `reopenConversation` |
| 3 | PATCH | `/customers/{id}/assign` | تعيين/إلغاء تعيين موظف | `assignCustomerAgent` |
| 4 | PATCH | `/customers/{id}/lifecycle` | تغيير دورة حياة العميل | `updateCustomerLifecycle` |
| 5 | PATCH | `/customers/{id}/enable-ai` | تفعيل/تعطيل AI | `toggleCustomerAI` |
| 6 | PATCH | `/customers/{id}/favorite` | إضافة/إزالة من المفضلة | `toggleFavorite` |
| 7 | PATCH | `/customers/{id}/mute` | كتم/إلغاء كتم | `toggleMuted` |
| 8 | PATCH | `/customers/{id}/session-status` | تغيير حالة الجلسة | `updateSessionStatus` |
| 9 | GET | `/admin/brief` | جلب المستخدمين (لقائمة التعيين) | `getBriefUsers` |
| 10 | GET | `/inbox/sidebar-summary` | جلب دورات الحياة والفرق | `getSidebarSummary` |

### 3ب. لوحة التعيين (`AssignPanel`)

تعيين الموظفين والفرق.

| # | Method | Endpoint | الوصف | Function |
|---|--------|----------|-------|----------|
| 1 | PATCH | `/customers/{id}/assign` | تعيين موظف | `assignCustomerAgent` |
| 2 | PUT | `/customers/{id}/teams` | تعيين فرق | `assignCustomerTeams` |
| 3 | DELETE | `/customers/{id}/teams` | إزالة فرق | `removeCustomerTeams` |
| 4 | GET | `/admin/brief` | جلب المستخدمين | `getBriefUsers` |
| 5 | GET | `/inbox/sidebar-summary` | جلب الفرق المتاحة | `getSidebarSummary` |

### 3ج. الرسائل (`MessagesList`)

عرض الرسائل مع تحميل تصاعدي (infinite scroll).

| # | Method | Endpoint | الوصف | Function |
|---|--------|----------|-------|----------|
| 1 | GET | `/inbox/customers/{id}/messages` | جلب رسائل العميل (مع صفحات) | `getCustomerMessages` |

### 3د. كتابة الرسائل (`MessageComposer`)

إرسال رسائل + رفع وسائط + تعليقات داخلية + ردود جاهزة.

| # | Method | Endpoint | الوصف | Function |
|---|--------|----------|-------|----------|
| 1 | POST | `/inbox/send-message` | إرسال رسالة | `sendMessage` |
| 2 | POST | `/media/upload` | رفع ملف/صورة/فيديو/صوت | `uploadMedia` |
| 3 | POST | `/inbox/comments` | إضافة تعليق داخلي | `addComment` |
| 4 | GET | `/admin/brief` | جلب المستخدمين (لذكر في التعليقات) | `getBriefUsers` |
| 5 | GET | `/snippets` | جلب الردود الجاهزة ⬅️ من خدمة Settings | `getAllSnippets` |

---

## 4. 📄 تفاصيل العميل (`ConversationDetails`)

عرض بيانات العميل + تاقات + حقول مخصصة + سجل النشاط.

| # | Method | Endpoint | الوصف | Function |
|---|--------|----------|-------|----------|
| 1 | POST | `/customers/{id}/tags` | إضافة تاقات | `addCustomerTags` |
| 2 | DELETE | `/customers/{id}/tags` | إزالة تاقات | `removeCustomerTags` |
| 3 | PUT | `/contacts/{id}/custom-fields` | تعديل الحقول المخصصة | `updateContactCustomFields` |
| 4 | GET | `/activity?session_id={id}` | جلب سجل نشاط الجلسة | `getSessionActivity` |
| 5 | GET | `/tags` | جلب كل التاقات المتاحة ⬅️ من خدمة Settings | `getTags` |
| 6 | GET | `/contact-fields` | جلب الحقول المخصصة المعرّفة ⬅️ من خدمة Settings | `getDynamicFields` |

---

## 📊 ملخص

| الجزء | عدد الـ Endpoints | ملاحظة |
|-------|:-----------------:|--------|
| شريط التنقل | 1 | ملخص فقط |
| قائمة المحادثات + الفلاتر | 4 | جلب + فلترة + بحث |
| رأس المحادثة + الإجراءات | 10 | جميع إجراءات العميل |
| لوحة التعيين | 5 | موظفين + فرق |
| الرسائل | 1 | infinite scroll |
| كتابة الرسائل | 5 | إرسال + وسائط + تعليقات + ردود جاهزة |
| تفاصيل العميل | 6 | تاقات + حقول + نشاط |
| **المجموع** | **32** | |

> بعض الـ endpoints مشتركة بين الأجزاء (مثل `getSidebarSummary` و `getBriefUsers`)، العدد الفريد **~22 endpoint**.
> تُستخدم أيضاً endpoints من خدمات **Settings** (`snippets`, `tags`, `contact-fields`).
