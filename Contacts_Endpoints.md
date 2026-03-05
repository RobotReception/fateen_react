# 📇 جهات الاتصال — الـ Endpoints المستخدمة في الصفحة

الصفحة مبنية من **3 ألواح (Panels)** — **الصلاحية:** `CONTACTS`

---

## 1. 📌 الشريط الجانبي (`ContactsNavSidebar`)

| # | Method | Endpoint | الوصف | الـ Hook |
|---|--------|----------|-------|---------|
| 1 | GET | `/contacts/sidebar-summary` | ملخص الشريط الجانبي (عدادات + مراحل + فرق) | `useContactsSidebarSummary` |

---

## 2. 📋 قائمة جهات الاتصال (`ContactsListPanel`)

| # | Method | Endpoint | الوصف | الـ Hook |
|---|--------|----------|-------|---------|
| 1 | GET | `/contacts` | جلب قائمة جهات الاتصال (بحث + فلترة + pagination) | `useContacts` |
| 2 | GET | `/contacts/filters` | فلاتر البحث (facets: منصة، حالة، مرحلة...) | `useContactsFilters` |
| 3 | GET | `/tags` | جلب الوسوم | `useTags` (عبر `useContactLookups`) |
| 4 | GET | `/lifecycles` | جلب مراحل الحياة | `useLifecycles` (عبر `useContactLookups`) |

---

## 3. 👤 تفاصيل جهة الاتصال (`ContactDetailPanel`)

| # | Method | Endpoint | الوصف | الـ Hook |
|---|--------|----------|-------|---------|
| 1 | GET | `/contacts/{customer_id}` | تفاصيل جهة اتصال | `useContactDetail` |
| 2 | PUT | `/contacts/{customer_id}` | تحديث بيانات (اسم، ملاحظات) | `useUpdateContact` |
| 3 | PUT | `/contacts/{customer_id}/custom-fields` | تحديث الحقول المخصصة | `useUpdateContactCustomFields` |
| 4 | DELETE | `/contacts/{customer_id}` | حذف جهة اتصال | `useDeleteContact` |
| 5 | POST | `/contacts/{customer_id}/convert` | تحويل عميل ↔ جهة اتصال | `useConvertContact` |
| 6 | GET | `/contacts/dynamic-fields` | الحقول الديناميكية (لنموذج التعديل) | `useDynamicFields` |
| 7 | GET | `/tags` | جلب الوسوم | `useTags` (عبر `useContactLookups`) |
| 8 | GET | `/lifecycles` | جلب مراحل الحياة | `useLifecycles` (عبر `useContactLookups`) |

---

##  ملخص

| المنطقة | عدد الـ Endpoints |
|---------|:-----------------:|
| الشريط الجانبي | 1 |
| قائمة جهات الاتصال | 4 |
| تفاصيل جهة الاتصال | 8 |
| **المجموع** | **13** |

> بعض الـ endpoints مشتركة بين الألواح (مثل `/tags` و `/lifecycles`)، العدد الفريد **~9 endpoint**.
