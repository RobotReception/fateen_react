import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
    hasPageAccess as checkPageAccess,
    hasActionAccess as checkActionAccess,
} from "@/lib/permissions"

export interface User {
    id: string
    email: string
    username?: string
    tenant_id: string
    role: string
    first_name: string
    last_name: string
    phone: string | null
    profile_picture: string | null
    email_verified: boolean
    onboarding_complete: boolean
    pageWithPermission?: {
        totalPages: number
        permissions: { pageValue: number; totalValue: number }[]
    }
}

interface AuthState {
    user: User | null
    token: string | null
    refreshToken: string | null
    isAuthenticated: boolean

    // Registration flow state
    registrationUserId: string | null
    registrationEmail: string | null

    // Actions
    login: (user: User, token: string, refreshToken: string) => void
    logout: () => void
    setUser: (user: User) => void
    setToken: (token: string) => void
    setRegistrationData: (userId: string, email: string) => void
    clearRegistrationData: () => void

    // Permissions
    hasPageAccess: (pageBit: number) => boolean
    hasActionAccess: (pageBit: number, actionBit: number) => boolean
    /** @deprecated استخدم hasPageAccess أو hasActionAccess بدلاً منها */
    hasPermission: (permissionCode: number) => boolean
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            registrationUserId: null,
            registrationEmail: null,

            login: (user, token, refreshToken) => {
                localStorage.setItem("access_token", token)
                localStorage.setItem("refresh_token", refreshToken)
                set({
                    user,
                    token,
                    refreshToken,
                    isAuthenticated: true,
                    registrationUserId: null,
                    registrationEmail: null,
                })
            },

            logout: () => {
                localStorage.removeItem("access_token")
                localStorage.removeItem("refresh_token")
                set({
                    user: null,
                    token: null,
                    refreshToken: null,
                    isAuthenticated: false,
                    registrationUserId: null,
                    registrationEmail: null,
                })
            },

            setUser: (user) => set({ user }),

            setToken: (token) => {
                localStorage.setItem("access_token", token)
                set({ token })
            },

            setRegistrationData: (userId, email) =>
                set({ registrationUserId: userId, registrationEmail: email }),

            clearRegistrationData: () =>
                set({ registrationUserId: null, registrationEmail: null }),

            hasPageAccess: (pageBit) => {
                const { user } = get()
                if (!user?.pageWithPermission) return false
                return checkPageAccess(user.pageWithPermission.totalPages, pageBit)
            },

            hasActionAccess: (pageBit, actionBit) => {
                const { user } = get()
                if (!user?.pageWithPermission) return false
                if (!checkPageAccess(user.pageWithPermission.totalPages, pageBit)) return false
                return checkActionAccess(user.pageWithPermission.permissions, pageBit, actionBit)
            },

            hasPermission: (permissionCode) => {
                const { user } = get()
                if (!user?.pageWithPermission) return false
                return user.pageWithPermission.permissions.some(
                    (p) => (p.totalValue & permissionCode) !== 0
                )
            },
        }),
        {
            name: "fateen-auth-storage",
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
                registrationUserId: state.registrationUserId,
                registrationEmail: state.registrationEmail,
            }),
        }
    )
)
