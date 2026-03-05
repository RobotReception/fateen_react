# توثيق Endpoints الإشعارات ولوحة التحكم وإعدادات الذكاء الاصطناعي

---

## 🔔 الإشعارات — Notifications

**الملف:** `src/features/notifications/services/notification-service.ts`
**Hook:** `src/features/notifications/hooks/useNotifications.ts`

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 1 | GET | `/notifications?limit=X&offset=Y` | جلب قائمة الإشعارات (مع صفحات) | `getNotifications()` |
| 2 | POST | `/notifications/{id}/mark-read` | تحديد إشعار واحد كمقروء | `markNotificationRead()` |
| 3 | POST | `/notifications/mark-all-read` | تحديد جميع الإشعارات كمقروءة | `markAllNotificationsRead()` |
| 4 | GET | `/notifications/count` | عداد الإشعارات (إجمالي + غير مقروءة) | `getNotificationCount()` |

**ملاحظات:**
- يوجد أيضاً **WebSocket** لتحديث عداد الإشعارات بشكل لحظي دون polling
- نغمة الإشعار ومستوى الصوت يُخزنان في `localStorage` (لا يوجد endpoint لها)

---

## 📊 لوحة التحكم — Dashboard

**الملف:** `src/features/dashboard/services/analytics-service.ts`

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 1 | GET | `/analytics/general` | جلب الإحصائيات العامة للمؤسسة | `getGeneralAnalytics()` |

**ملاحظة:** يُرجع بيانات شاملة تتضمن: إجمالي المحادثات، المحادثات النشطة، معدل الاستجابة، توزيع المنصات، وإحصائيات الأداء.

---

## 🤖 إعدادات الذكاء الاصطناعي — AI Settings

**الملف:** `src/features/ai-settings/services/ai-settings-service.ts`
**Hook:** `src/features/ai-settings/hooks/use-ai-settings.ts`
**Base URL:** `/api/backend/v2/agents`

### 1. الوكلاء (Agents CRUD)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 1 | GET | `/agents` | جلب جميع الوكلاء | `listAgents()` |
| 2 | GET | `/agents/{id}` | جلب تفاصيل وكيل محدد | `getAgent()` |
| 3 | POST | `/agents` | إنشاء وكيل جديد | `createAgent()` |
| 4 | PATCH | `/agents/{id}` | تحديث بيانات وكيل | `updateAgent()` |
| 5 | DELETE | `/agents/{id}` | حذف وكيل | `deleteAgent()` |

### 2. إعدادات AI العامة

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 6 | GET | `/agents/{id}/ai` | جلب إعدادات AI للوكيل | `getAISettings()` |
| 7 | PATCH | `/agents/{id}/ai` | تحديث إعدادات AI | `updateAISettings()` |

### 3. مزودي الخدمة (LLM Providers)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 8 | GET | `/agents/{id}/ai/providers/{name}` | جلب تفاصيل مزود | `getProvider()` |
| 9 | POST | `/agents/{id}/ai/providers/{name}` | إنشاء مزود جديد | `createProvider()` |
| 10 | PATCH | `/agents/{id}/ai/providers/{name}` | تحديث إعدادات مزود | `updateProvider()` |
| 11 | DELETE | `/agents/{id}/ai/providers/{name}` | حذف مزود | `deleteProvider()` |

### 4. نماذج المزودين (Provider Models)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 12 | POST | `/agents/{id}/ai/providers/{name}/models` | إضافة نموذج لمزود | `addModelToProvider()` |
| 13 | DELETE | `/agents/{id}/ai/providers/{name}/models/{modelId}` | حذف نموذج من مزود | `deleteModelFromProvider()` |

### 5. ميزات AI (Features)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 14 | GET | `/agents/{id}/ai/features` | جلب ميزات AI المفعلة | `getAIFeatures()` |
| 15 | PATCH | `/agents/{id}/ai/features` | تحديث ميزات AI | `updateAIFeatures()` |

### 6. البرومبتات (Prompts)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 16 | GET | `/agents/{id}/prompts` | جلب إعدادات البرومبتات | `getPromptsSettings()` |
| 17 | PATCH | `/agents/{id}/prompts` | تحديث البرومبتات | `updatePromptsSettings()` |

### 7. تحويل النص لصوت (TTS)

| # | Method | Endpoint | الوظيفة | الدالة |
|---|--------|----------|---------|--------|
| 18 | GET | `/agents/{id}/tts` | جلب إعدادات TTS | `getTTSSettings()` |
| 19 | PATCH | `/agents/{id}/tts` | تحديث إعدادات TTS | `updateTTSSettings()` |
| 20 | POST | `/agents/{id}/tts/toggle` | تفعيل/إيقاف TTS | `toggleTTS()` |
| 21 | GET | `/agents/{id}/tts/providers/{name}` | جلب مزود TTS | `getTTSProvider()` |
| 22 | PATCH | `/agents/{id}/tts/providers/{name}` | تحديث مزود TTS | `updateTTSProvider()` |

---

## ملخص

| القسم | عدد الـ Endpoints |
|-------|------------------|
| الإشعارات | 4 |
| لوحة التحكم | 1 |
| إعدادات الذكاء الاصطناعي | 22 |
| **الإجمالي** | **27** |
