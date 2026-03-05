# 📚 قاعدة المعرفة — الـ Endpoints حسب كل تبويب فرعي (Sub-Tab)

الصفحة تحتوي **7 تبويبات فرعية** — كل تبويب يتم تحميله بشكل lazy ومحمي بصلاحية `PAGE_BIT` خاصة.

---

## 1. 📊 تحليلات المستندات (`doc-analytics`)

**Component:** `DocumentAnalyticsTab` — **PAGE_BIT:** `DOCUMENT_ANALYTICS`

| # | Method | Endpoint | الوصف | الـ Hook |
|---|--------|----------|-------|---------|
| 1 | GET | `/documents/files/analytics/tenant` | تحليلات المستأجر (إحصائيات شاملة) | `useTenantAnalytics` |
| 2 | GET | `/departments/lookup` | أقسام للفلترة | `useDepartmentsLookup` |
| 3 | GET | `/categories` | فئات للفلترة | `useCategoriesLookup` |

---

## 2. 📂 إدارة البيانات (`data`)

**Component:** `DataManagementTab` — **PAGE_BIT:** `DOCUMENTS`

| # | Method | Endpoint | الوصف | الـ Hook / Function |
|---|--------|----------|-------|---------------------|
| 1 | GET | `/documents/search-documents` | بحث وتصفح المستندات | `useSearchDocuments` |
| 2 | POST | `/documents/requests-update-data` | تحديث مستند (طلب معلّق) | `useUpdateDocument` |
| 3 | DELETE | `/documents/delete-doc-by-id` | حذف مستندات | `useDeleteDocuments` |
| 4 | GET | `/departments/lookup` | أقسام (تبويبات فرعية) | `useDepartmentsLookup` |
| 5 | GET | `/departments/{id}/categories` | فئات القسم | `useDepartmentCategories` |
| 6 | POST | `/training/train-txt-request` | رفع ملف TXT للتدريب | `trainTxtRequest` (مباشر) |
| 7 | POST | `/training/train-csv-request` | رفع ملف CSV للتدريب | `trainCsvRequest` (مباشر) |
| 8 | POST | `/documents/requests-add-data-json` | إضافة نص بيانات | `addDataJson` (مباشر) |

---

## 3. 👤 ملفات المستخدمين (`analytics`)

**Component:** `UserAnalyticsTab` — **PAGE_BIT:** `DOCUMENTS`

| # | Method | Endpoint | الوصف | الـ Hook / Function |
|---|--------|----------|-------|---------------------|
| 1 | GET | `/documents/get-files/data` | قائمة ملفات المستخدمين (paginated) | `useUserFilesList` |
| 2 | GET | `/documents/get-user-files/{username}` | ملفات مستخدم محدد | `getUserFiles` (مباشر) |
| 3 | GET | `/documents/download-user-file` | تنزيل ملف | `downloadUserFile` (مباشر) |
| 4 | DELETE | `/documents/delete-docs-by-filename` | حذف ملف محدد | `deleteDocsByFilename` (مباشر) |
| 5 | DELETE | `/documents/delete-docs-by-username` | حذف جميع بيانات مستخدم | `useDeleteUserData` |
| 6 | DELETE | `/documents/request-delete-collection-admin` | حذف جميع البيانات (مشرف) | `useDeleteCollection` |
| 7 | GET | `/departments/lookup` | أقسام للفلترة | `useDepartmentsLookup` |
| 8 | GET | `/categories` | فئات للفلترة | `useCategoriesLookup` |
| 9 | GET | `/documents/files/docs/{user}/{file}` | مستندات ملف محدد (في Modal) | `FileDataModal` |

---

## 4. 🏢 الأقسام (`departments`)

**Component:** `DepartmentsTab` — **PAGE_BIT:** `DEPARTMENTS`

| # | Method | Endpoint | الوصف | الـ Hook |
|---|--------|----------|-------|---------|
| 1 | GET | `/departments` | قائمة الأقسام (paginated) | `useDepartmentsList` |
| 2 | GET | `/departments/lookup` | أقسام مختصرة | `useDepartmentsLookup` |
| 3 | POST | `/departments` | إنشاء قسم | `useCreateDepartment` |
| 4 | PATCH | `/departments/{id}` | تحديث قسم | `useUpdateDepartment` |
| 5 | DELETE | `/departments/{id}` | حذف قسم | `useDeleteDepartment` |
| 6 | GET | `/departments/{id}/categories` | فئات القسم | `useDepartmentCategories` |
| 7 | POST | `/departments/{id}/categories/link` | ربط فئة بقسم | `useLinkCategory` |
| 8 | DELETE | `/departments/{id}/categories/{cid}` | فك ربط فئة | `useUnlinkCategory` |
| 9 | DELETE | `/documents/request-delete-by-department` | حذف بيانات القسم | `useDeleteDepartmentData` |

---

## 5. 📁 الفئات (`categories`)

**Component:** `CategoriesTab` — **PAGE_BIT:** `DEPARTMENTS`

| # | Method | Endpoint | الوصف | الـ Hook |
|---|--------|----------|-------|---------|
| 1 | GET | `/categories` | قائمة الفئات (paginated) | `useCategoriesList` |
| 2 | POST | `/categories` | إنشاء فئة | `useCreateCategory` |
| 3 | PATCH | `/categories/{id}` | تحديث فئة | `useUpdateCategory` |
| 4 | DELETE | `/categories/{id}` | حذف فئة | `useDeleteCategory` |
| 5 | DELETE | `/documents/request-delete-by-category` | حذف بيانات الفئة | `useDeleteCategoryData` |

---

## 6. ⏳ الطلبات المعلقة (`pending-requests`)

**Component:** `PendingRequestsTab` — **PAGE_BIT:** `PENDING_REQUESTS`
**ملف الخدمة:** `features/pending-requests/services/pending-requests-service.ts`

| # | Method | Endpoint | الوصف | Function |
|---|--------|----------|-------|----------|
| 1 | GET | `/get-pending-orders` | قائمة الطلبات المعلقة | `getPendingOrders` |
| 2 | GET | `/pending/search-pending-orders` | بحث الطلبات | `searchPendingOrders` |
| 3 | GET | `/pending/get-request-details` | تفاصيل طلب | `getRequestDetails` |
| 4 | POST | `/pending/process-approve` | الموافقة على طلب | `processApprove` |
| 5 | POST | `/pending/process-reject` | رفض طلب | `processReject` |
| 6 | GET | `/pending/download-request-train-file` | تنزيل ملف تدريب | `downloadRequestTrainFile` |

---

## 7. 📜 سجل العمليات (`operation-history`)

**Component:** `OperationHistoryTab` — **PAGE_BIT:** `OPERATION_HISTORY`
**ملف الخدمة:** `features/operation-history/services/operation-history-service.ts`

| # | Method | Endpoint | الوصف | Function |
|---|--------|----------|-------|----------|
| 1 | GET | `/history/search-operations` | بحث العمليات | `searchOperations` |
| 2 | GET | `/history/get-operation-details` | تفاصيل عملية | `getOperationDetails` |
| 3 | GET | `/history/download-operations-csv` | تنزيل CSV | `downloadOperationsCsv` |
| 4 | GET | `/history/download-operation-train-file` | تنزيل ملف تدريب | `downloadOperationTrainFile` |

---

## 📊 ملخص

| التبويب | عدد الـ Endpoints | الصلاحية |
|---------|:-----------------:|----------|
| تحليلات المستندات | 3 | `DOCUMENT_ANALYTICS` |
| إدارة البيانات | 8 | `DOCUMENTS` |
| ملفات المستخدمين | 9 | `DOCUMENTS` |
| الأقسام | 9 | `DEPARTMENTS` |
| الفئات | 5 | `DEPARTMENTS` |
| الطلبات المعلقة | 6 | `PENDING_REQUESTS` |
| سجل العمليات | 4 | `OPERATION_HISTORY` |
| **المجموع** | **44** | |

> بعض الـ endpoints مشتركة بين أكثر من تبويب (مثل `/departments/lookup` و `/categories`)، العدد الفريد حوالي **~35 endpoint**.
