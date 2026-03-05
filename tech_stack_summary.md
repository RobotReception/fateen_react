# 🛠️  Admin — ملخص التقنيات والأدوات المستخدمة

## ⚙️ بيئة التطوير والبناء

| الأداة | الإصدار | الوظيفة |
|--------|---------|---------|
| **Vite** | 7.3 | أداة البناء و Dev Server |
| **TypeScript** | 5.9 | لغة البرمجة الأساسية (Type-safe JavaScript) |
| **ESLint** | 9.x | تحليل وفحص جودة الكود |
| **Node.js + npm** | — | إدارة الحزم وتشغيل السكربتات |

---

## 🎨 الواجهة الأمامية (Frontend)

| الأداة | الإصدار | الوظيفة |
|--------|---------|---------|
| **React** | 19.2 | مكتبة بناء واجهات المستخدم |
| **React DOM** | 19.2 | ربط React بالمتصفح |
| **React Router DOM** | 7.13 | التنقل بين الصفحات (Routing) |
| **TailwindCSS** | 4.1 | تصميم الواجهة بأسلوب Utility-First CSS |
| **tailwind-merge** | 3.4 | دمج كلاسات Tailwind بدون تعارض |
| **class-variance-authority (CVA)** | 0.7 | إنشاء متغيرات للمكونات (Component Variants) |
| **clsx** | 2.1 | دمج الكلاسات الشرطية |

---

## 📦 إدارة البيانات والحالة (State & Data)

| الأداة | الإصدار | الوظيفة |
|--------|---------|---------|
| **TanStack React Query** | 5.x | إدارة البيانات من الـ API (Caching, Fetching, Mutations) |
| **TanStack React Table** | 8.x | بناء جداول تفاعلية متقدمة |
| **Zustand** | 5.0 | إدارة الحالة العامة (Global State Management) |
| **Axios** | 1.13 | HTTP Client للتواصل مع الـ API |

---

## 📝 النماذج والتحقق (Forms & Validation)

| الأداة | الإصدار | الوظيفة |
|--------|---------|---------|
| **React Hook Form** | 7.x | إدارة النماذج بأداء عالي |
| **@hookform/resolvers** | 5.x | ربط مكتبات التحقق مع React Hook Form |
| **Zod** | 4.x | التحقق من البيانات (Schema Validation) |

---

## 🎯 الأيقونات والمكونات البصرية

| الأداة | الإصدار | الوظيفة |
|--------|---------|---------|
| **Lucide React** | 0.564 | مكتبة أيقونات أساسية |
| **Phosphor Icons** | 2.1 | مكتبة أيقونات إضافية |
| **Recharts** | 3.7 | رسوم بيانية وتحليلات (Charts) |
| **Sonner** | 2.0 | إشعارات Toast |

---

## 🔊 وسائط متعددة

| الأداة | الوظيفة |
|--------|---------|
| **lamejs** | معالجة وتحويل ملفات الصوت MP3 |

---

## 🏗️ هيكل المشروع (Architecture)

```
src/
├── app/            ← إعدادات التطبيق والـ Router
├── components/     ← مكونات مشتركة (Layout, Guards, UI)
├── features/       ← الوحدات الرئيسية (Feature-based)
│   └── users/            ← إدارة المستخدمين
├── lib/            ← أدوات مشتركة (API Client, Permissions)
└── stores/         ← حالة التطبيق (Auth, Theme)
```

---

## 🔐 نظام الصلاحيات

- **Bitwise Permissions** — نظام صلاحيات متقدم يعتمد على العمليات البتية
- **Permission Guards** — حماية الصفحات والعناصر حسب صلاحيات المستخدم
- **Role-Based Access Control (RBAC)** — تحكم بالوصول حسب الأدوار

---

## 🌐 الاتصال بالخادم

- **Proxy عبر Vite** — توجيه طلبات `/api` إلى الخادم الخلفي
- **API Client مركزي** — عميل Axios موحد مع إدارة Tokens وInterceptors

---

## ✅ ملخص سريع

> المنصة مبنية بـ **React 19 + TypeScript** مع **Vite** كأداة بناء.
> التصميم يعتمد على **TailwindCSS 4**.
> إدارة البيانات عبر **React Query + Zustand**.
> النماذج تُدار بـ **React Hook Form + Zod**.
> هيكل المشروع يتبع نمط **Feature-based Architecture** مع نظام صلاحيات **Bitwise**.
