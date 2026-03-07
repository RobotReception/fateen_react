import axios from "axios"
import { useAuthStore } from "@/stores/auth-store"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/backend/v2"

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
    timeout: 30000,
})

// ── Auth endpoints that should NOT send tokens or trigger 401 redirects ──
const PUBLIC_ENDPOINTS = [
    "/auth/login",
    "/auth/register-initial",
    "/auth/verify-email",
    "/auth/resend-verification-email",
    "/auth/complete-onboarding",
    "/auth/onboarding-settings-options",
    "/auth/password/reset/request",
    "/auth/password/reset/confirm",
    "/auth/refresh-token",
]

function isPublicEndpoint(url: string | undefined): boolean {
    if (!url) return false
    return PUBLIC_ENDPOINTS.some((ep) => url.includes(ep))
}

// ── Request interceptor — inject JWT token + X-Tenant-ID (skip for public endpoints) ──
apiClient.interceptors.request.use(
    (config) => {
        if (!isPublicEndpoint(config.url)) {
            // Read token from Zustand memory state (not localStorage)
            const token = useAuthStore.getState().token
            if (token) {
                config.headers.Authorization = `Bearer ${token}`
            }

            // Inject X-Tenant-ID from persisted auth store (user data is still persisted)
            if (!config.headers["X-Tenant-ID"]) {
                const tenantId = useAuthStore.getState().user?.tenant_id
                if (tenantId) {
                    config.headers["X-Tenant-ID"] = tenantId
                }
            }
        }
        return config
    },
    (error) => Promise.reject(error)
)

// ── Response interceptor — handle errors + auto token refresh ──
let isRefreshing = false
let failedQueue: Array<{
    resolve: (value: unknown) => void
    reject: (reason?: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null = null) {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error)
        } else {
            prom.resolve(token)
        }
    })
    failedQueue = []
}

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config
        const status = error.response?.status

        // ── 401: Try token refresh (only for protected endpoints) ──
        if (
            status === 401 &&
            !originalRequest._retry &&
            !isPublicEndpoint(originalRequest.url)
        ) {
            // If already refreshing, queue this request
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`
                    return apiClient(originalRequest)
                })
            }

            originalRequest._retry = true
            isRefreshing = true

            try {
                const { data } = await axios.post(
                    `${API_BASE_URL}/auth/refresh-token`,
                    {},
                    { headers: { "Content-Type": "application/json" }, withCredentials: true }
                )

                const newToken = data.data.token

                // Update Zustand memory state with new token
                useAuthStore.getState().setToken(newToken)

                // Resolve queued requests with the new token, THEN reset flag
                processQueue(null, newToken)
                isRefreshing = false

                originalRequest.headers.Authorization = `Bearer ${newToken}`
                return apiClient(originalRequest)
            } catch (refreshError) {
                processQueue(refreshError, null)
                isRefreshing = false
                useAuthStore.getState().logout()
                window.location.href = "/login"
                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    }
)

export default apiClient
