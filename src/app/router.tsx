import { Routes, Route, Navigate } from "react-router-dom"
import { AdminLayout } from "@/components/layout"
import { PermissionGuard } from "@/components/guards/PermissionGuard"
import { PAGE_BITS } from "@/lib/permissions"
import { useAuthStore } from "@/stores/auth-store"
import { useSessionBootstrap } from "@/hooks/useSessionBootstrap"
import { Loader2 } from "lucide-react"

// Auth Pages
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { RegisterPage } from "@/features/auth/pages/RegisterPage"
import { VerifyEmailPage } from "@/features/auth/pages/VerifyEmailPage"
import { OnboardingPage } from "@/features/auth/pages/OnboardingPage"
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage"

// Admin Pages
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage"
import { UsersPage } from "@/features/users/pages/UsersPage"
import { KnowledgeBasePage } from "@/features/knowledge/pages/KnowledgeBasePage"
import { OrganizationSettingsPage } from "@/features/settings/pages/OrganizationSettingsPage"
import { ProfileSettingsPage } from "@/features/settings/pages/ProfileSettingsPage"
import { AgentDetailPage } from "@/features/ai-settings/pages/AgentDetailPage"
import { RolesPage } from "@/features/roles/pages/RolesPage"
import { ChannelsPage } from "@/features/channels/pages/ChannelsPage"
import { InboxPage } from "@/features/inbox/pages/InboxPage"
import { ConversationPage } from "@/features/inbox/pages/ConversationPage"
import { ContactsPage } from "@/features/contacts/pages/ContactsPage"
import { MenuManagerPage } from "@/features/menu-manager/pages/MenuManagerPage"

/** يتحقق من تسجيل الدخول — يحوّل لصفحة Login إذا لم يكن مسجلاً */
function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, token } = useAuthStore()

    // بعد useSessionBootstrap(ready=true):
    // - لو الجلسة صالحة → isAuthenticated=true + token موجود
    // - لو فشل الـ refresh → bootstrap استدعى logout() → isAuthenticated=false
    // لذا نتحقق فقط من isAuthenticated + وجود التوكن (بدون فحص exp)
    // فحص exp غير ضروري هنا لأن:
    // 1. useSessionBootstrap يجدد التوكن عند reload
    // 2. api-client interceptor يجدد تلقائياً عند 401
    // 3. silentRefresh كل 12 دقيقة يضمن التوكن صالح
    if (!isAuthenticated || !token) {
        return <Navigate to="/login" replace />
    }

    return <>{children}</>
}

/** يمنع المستخدم المسجّل من الدخول لصفحات تسجيل الدخول/التسجيل */
function GuestGuard({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    const token = useAuthStore((s) => s.token)
    if (isAuthenticated && token) return <Navigate to="/dashboard" replace />
    return <>{children}</>
}

/** الصفحة الرئيسية: إذا مسجّل → Dashboard، وإلا → Login */
function RootRedirect() {
    const { isAuthenticated, token } = useAuthStore()
    if (isAuthenticated && token) {
        return <Navigate to="/dashboard" replace />
    }
    return <Navigate to="/login" replace />
}

export function AppRouter() {
    // ── Session Bootstrap: تحقق من السيرفر عند تحميل التطبيق ──
    const ready = useSessionBootstrap()
    if (!ready) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
                <Loader2 style={{ width: 32, height: 32, animation: "spin 1s linear infinite", color: "var(--t-accent-light)" }} />
            </div>
        )
    }

    return (
        <Routes>
            {/* Redirect root based on auth state */}
            <Route path="/" element={<RootRedirect />} />

            {/* Auth Routes — محمية بـ GuestGuard (لا يدخلها المسجّل) */}
            <Route path="/login" element={<GuestGuard><LoginPage /></GuestGuard>} />
            <Route path="/register" element={<GuestGuard><RegisterPage /></GuestGuard>} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/forgot-password" element={<GuestGuard><ForgotPasswordPage /></GuestGuard>} />

            {/* Admin Routes — محمية بـ AuthGuard + PermissionGuard */}
            <Route path="/dashboard" element={<AuthGuard><AdminLayout /></AuthGuard>}>
                <Route index element={<DashboardPage />} />
                <Route path="users" element={
                    <PermissionGuard pageBit={PAGE_BITS.ADMIN_USERS}>
                        <UsersPage />
                    </PermissionGuard>
                } />
                <Route path="knowledge" element={
                    <PermissionGuard pageBit={PAGE_BITS.DOCUMENTS}>
                        <KnowledgeBasePage />
                    </PermissionGuard>
                } />
                <Route path="menu-manager" element={
                    <PermissionGuard pageBit={PAGE_BITS.MENU_MANAGER}>
                        <MenuManagerPage />
                    </PermissionGuard>
                } />
                <Route path="roles" element={
                    <PermissionGuard pageBit={PAGE_BITS.ROLES}>
                        <RolesPage />
                    </PermissionGuard>
                } />
                <Route path="channels" element={
                    <PermissionGuard pageBit={PAGE_BITS.CHANNELS}>
                        <ChannelsPage />
                    </PermissionGuard>
                } />
                <Route path="inbox" element={
                    <PermissionGuard pageBit={PAGE_BITS.INBOX}>
                        <InboxPage />
                    </PermissionGuard>
                } />
                <Route path="inbox/:id" element={
                    <PermissionGuard pageBit={PAGE_BITS.INBOX}>
                        <ConversationPage />
                    </PermissionGuard>
                } />
                <Route path="contacts" element={
                    <PermissionGuard pageBit={PAGE_BITS.CONTACTS}>
                        <ContactsPage />
                    </PermissionGuard>
                } />
                <Route path="settings" element={<Navigate to="/dashboard/settings/organization" replace />} />
                <Route path="settings/organization" element={<OrganizationSettingsPage />} />
                <Route path="settings/profile" element={<ProfileSettingsPage />} />
                <Route path="settings/ai" element={<Navigate to="/dashboard/settings/organization?tab=ai" replace />} />
                <Route path="settings/ai/:agentId" element={
                    <PermissionGuard pageBit={PAGE_BITS.AGENTS}>
                        <AgentDetailPage />
                    </PermissionGuard>
                } />
            </Route>

            {/* Catch-all — redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    )
}

