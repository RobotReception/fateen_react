import { Routes, Route, Navigate } from "react-router-dom"
import { AdminLayout } from "@/components/layout"
import { PermissionGuard } from "@/components/guards/PermissionGuard"
import { PAGE_BITS } from "@/lib/permissions"
import { useAuthStore } from "@/stores/auth-store"

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
import { PendingRequestsPage } from "@/features/pending-requests/pages/PendingRequestsPage"
import { OperationHistoryPage } from "@/features/operation-history/pages/OperationHistoryPage"
import { OrganizationSettingsPage } from "@/features/settings/pages/OrganizationSettingsPage"
import { ProfileSettingsPage } from "@/features/settings/pages/ProfileSettingsPage"
import { AISettingsPage } from "@/features/ai-settings/pages/AISettingsPage"
import { RolesPage } from "@/features/roles/pages/RolesPage"
import { ChannelsPage } from "@/features/channels/pages/ChannelsPage"
import { InboxPage } from "@/features/inbox/pages/InboxPage"
import { ConversationPage } from "@/features/inbox/pages/ConversationPage"

/** يتحقق من تسجيل الدخول — يحوّل لصفحة Login إذا لم يكن مسجلاً */
function AuthGuard({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    if (!isAuthenticated) return <Navigate to="/login" replace />
    return <>{children}</>
}

export function AppRouter() {
    return (
        <Routes>
            {/* Redirect root to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Admin Routes — محمية بـ AuthGuard + PermissionGuard */}
            <Route path="/dashboard" element={<AuthGuard><AdminLayout /></AuthGuard>}>
                <Route index element={<DashboardPage />} />
                <Route path="users" element={
                    <PermissionGuard pageBit={PAGE_BITS.ADMIN_USERS}>
                        <UsersPage />
                    </PermissionGuard>
                } />
                <Route path="knowledge" element={
                    <PermissionGuard pageBit={PAGE_BITS.DOCUMENT_MANAGEMENT}>
                        <KnowledgeBasePage />
                    </PermissionGuard>
                } />
                <Route path="pending-requests" element={
                    <PermissionGuard pageBit={PAGE_BITS.PENDING_REQUESTS}>
                        <PendingRequestsPage />
                    </PermissionGuard>
                } />
                <Route path="operation-history" element={
                    <PermissionGuard pageBit={PAGE_BITS.OPERATION_HISTORY}>
                        <OperationHistoryPage />
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
                <Route path="settings" element={<Navigate to="/dashboard/settings/organization" replace />} />
                <Route path="settings/organization" element={<OrganizationSettingsPage />} />
                <Route path="settings/profile" element={<ProfileSettingsPage />} />
                <Route path="settings/ai" element={<AISettingsPage />} />
            </Route>

            {/* Catch-all — redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    )
}

