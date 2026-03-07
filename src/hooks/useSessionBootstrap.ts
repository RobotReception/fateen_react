import { useEffect, useRef, useState } from "react"
import axios from "axios"
import apiClient from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type { User } from "@/stores/auth-store"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/backend/v2"

/**
 * مدة التجديد الاستباقي — 12 دقيقة
 * (التوكن يعيش 15 دقيقة، نجدّد قبل الانتهاء بـ 3 دقائق)
 */
const REFRESH_INTERVAL_MS = 12 * 60 * 1000

// ══════════════════════════════════════════════════════
//  Module-level singleton — يمنع StrictMode من تشغيل
//  bootstrap مرتين (مهم جداً لتجنب Token Rotation Reuse)
// ══════════════════════════════════════════════════════
let bootstrapPromise: Promise<string | null> | null = null

/**
 * يُرجع true عندما يكون الـ bootstrap اكتمل بنجاح.
 * مفيد للشروط الخارجية (مثل تأخير React Query).
 */
export let isBootstrapDone = false

/**
 * Session Bootstrap + Proactive Refresh Hook
 *
 * عند تحميل التطبيق (reload / فتح tab جديد):
 * 1. يتحقق أن المستخدم كان مسجل دخول (isAuthenticated محفوظ)
 * 2. يستدعي /auth/refresh-token عبر الكوكي → يحصل على access token جديد
 * 3. يستدعي /admin/me → يُحدّث بيانات المستخدم من السيرفر
 * 4. يُشغّل timer يجدّد التوكن كل 12 دقيقة استباقياً
 *
 * هذا ضروري لأن access_token يعيش فقط في الذاكرة (15 دقيقة)
 * ويُفقد عند reload.
 */
export function useSessionBootstrap() {
    const [ready, setReady] = useState(false)
    const { isAuthenticated, logout } = useAuthStore()
    const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null)

    // ── دالة التجديد الاستباقي (تُستخدم بعد الـ bootstrap فقط) ──
    const silentRefresh = async () => {
        try {
            // نستخدم axios مباشرة (بدون interceptors) لتجنب loops
            const { data } = await axios.post(
                `${API_BASE_URL}/auth/refresh-token`,
                {},
                { headers: { "Content-Type": "application/json" }, withCredentials: true }
            )
            const newToken = data.data?.token
            if (newToken) {
                useAuthStore.getState().setToken(newToken)
                return newToken
            }
        } catch {
            // Refresh فشل → الجلسة انتهت (rotation reuse detection أو انتهاء صلاحية)
            useAuthStore.getState().logout()
            isBootstrapDone = false
            bootstrapPromise = null
            window.location.href = "/login"
        }
        return null
    }

    // ── بدء/إيقاف الـ timer ──
    const startRefreshTimer = () => {
        stopRefreshTimer()
        refreshTimer.current = setInterval(silentRefresh, REFRESH_INTERVAL_MS)
    }

    const stopRefreshTimer = () => {
        if (refreshTimer.current) {
            clearInterval(refreshTimer.current)
            refreshTimer.current = null
        }
    }

    useEffect(() => {
        // إذا لا توجد بيانات جلسة محفوظة → هو ضيف بالتأكيد
        if (!isAuthenticated) {
            console.log("[Bootstrap] ⏭ Guest — skip")
            setReady(true)
            return
        }

        console.log("[Bootstrap] 🔄 Starting session recovery...")

        /**
         * Singleton: إذا كان هناك bootstrap سابق شغّال (من StrictMode mount/remount)
         * نستخدم نفس الـ Promise بدلاً من إرسال طلب جديد (يمنع rotation reuse)
         */
        if (!bootstrapPromise) {
            bootstrapPromise = doBootstrap()
        }

        bootstrapPromise
            .then((token) => {
                if (!token) {
                    console.warn("[Bootstrap] ❌ No token — logging out")
                    logout()
                    return
                }

                console.log("[Bootstrap] ✅ Session recovered successfully")
                isBootstrapDone = true
                startRefreshTimer()
            })
            .catch((err) => {
                console.error("[Bootstrap] ❌ Failed:", err?.message || err)
                logout()
            })
            .finally(() => {
                setReady(true)
            })

        return () => stopRefreshTimer()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    return ready
}

/**
 * الدالة الفعلية للـ Bootstrap — تُنفّذ مرة واحدة فقط
 * تُرجع التوكن الجديد أو null
 */
async function doBootstrap(): Promise<string | null> {
    const { setToken, setUser } = useAuthStore.getState()

    try {
        // الخطوة 1: احصل على access token جديد عبر كوكي الـ refresh
        // نستخدم axios مباشرة (بدون interceptors) لتجنب أي تداخل
        const { data: refreshData } = await axios.post(
            `${API_BASE_URL}/auth/refresh-token`,
            {},
            { headers: { "Content-Type": "application/json" }, withCredentials: true }
        )

        const newToken = refreshData.data?.token
        if (!newToken) {
            console.warn("[Bootstrap] Refresh response has no token")
            return null
        }

        // خزّن التوكن في الذاكرة فقط
        setToken(newToken)
        console.log("[Bootstrap] 🔑 Token refreshed OK")

        // الخطوة 2: احصل على بيانات المستخدم من السيرفر
        const { data: meData } = await apiClient.get("/admin/me")
        const me = meData?.data

        if (!me) {
            console.warn("[Bootstrap] /admin/me returned no data")
            return null
        }

        const user: User = {
            id: me.user_id,
            email: me.email,
            tenant_id: me.tenant_id,
            role: me.role,
            first_name: me.first_name,
            last_name: me.last_name,
            phone: me.phone,
            profile_picture: me.profile_picture,
            email_verified: me.email_verified,
            onboarding_complete: true,
            pageWithPermission: me.permissions,
        }
        setUser(user)
        console.log("[Bootstrap] 👤 User data updated")

        return newToken
    } catch (err: any) {
        console.error("[Bootstrap] doBootstrap error:", err?.response?.status, err?.message)
        return null
    }
}
