import axios from "axios"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://161.97.117.77:4488/api/backend/v2"

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
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

// ── Request interceptor — inject JWT token (skip for public endpoints) ──
apiClient.interceptors.request.use(
    (config) => {
        if (!isPublicEndpoint(config.url)) {
            const token = localStorage.getItem("access_token")
            if (token) {
                config.headers.Authorization = `Bearer ${token}`
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

            const refreshToken = localStorage.getItem("refresh_token")
            if (!refreshToken) {
                // No refresh token — clear and redirect
                localStorage.removeItem("access_token")
                localStorage.removeItem("refresh_token")
                localStorage.removeItem("fateen-auth-storage")
                window.location.href = "/login"
                return Promise.reject(error)
            }

            try {
                const { data } = await axios.post(
                    `${API_BASE_URL}/auth/refresh-token`,
                    { refresh_token: refreshToken },
                    { headers: { "Content-Type": "application/json" } }
                )

                const newToken = data.data.token
                const newRefresh = data.data.refresh_token

                localStorage.setItem("access_token", newToken)
                localStorage.setItem("refresh_token", newRefresh)

                // Update Zustand persisted store
                try {
                    const stored = localStorage.getItem("fateen-auth-storage")
                    if (stored) {
                        const parsed = JSON.parse(stored)
                        parsed.state.token = newToken
                        parsed.state.refreshToken = newRefresh
                        localStorage.setItem("fateen-auth-storage", JSON.stringify(parsed))
                    }
                } catch { /* silent */ }

                processQueue(null, newToken)

                originalRequest.headers.Authorization = `Bearer ${newToken}`
                return apiClient(originalRequest)
            } catch (refreshError) {
                processQueue(refreshError, null)
                localStorage.removeItem("access_token")
                localStorage.removeItem("refresh_token")
                localStorage.removeItem("fateen-auth-storage")
                window.location.href = "/login"
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }

        // ── 403: Log warning ──
        if (status === 403) {
            console.warn("Access forbidden:", error.response?.data?.message)
        }

        // ── 500: Log error ──
        if (status === 500) {
            console.error("Server error:", error.response?.data)
        }

        return Promise.reject(error)
    }
)

export default apiClient
