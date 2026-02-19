import apiClient from "@/lib/api-client"

/* ============================================================
   TYPES
   ============================================================ */

export interface RegisterPayload {
    email: string
    password: string
    first_name?: string
    last_name?: string
}

export interface RegisterResponse {
    success: boolean
    data: {
        user_id: string
        email: string
        email_verified: boolean
    }
    message: string
}

export interface VerifyEmailPayload {
    email: string
    verification_token: string
    purpose?: "email_verification" | "reset_password"
}

export interface VerifyEmailResponse {
    success: boolean
    data: {
        user_id: string
        email: string
        email_verified?: boolean
        verification_token?: string
        purpose?: string
    }
    message: string
}

export interface LoginPayload {
    email: string
    password: string
    tenant_id?: string
}

export interface LoginResponse {
    success: boolean
    data: {
        user: {
            id: string
            email: string
            username: string
            tenant_id: string
            role: string
            first_name: string
            last_name: string
            phone: string | null
            profile_picture: string | null
            email_verified: boolean
            onboarding_complete: boolean
            pageWithPermission: {
                totalPages: number
                permissions: { pageValue: number; totalValue: number }[]
            }
        }
        token: string
        refresh_token: string
        expires_in: number
    }
    message: string
}

export interface OnboardingPayload {
    user_id: string
    organization_name: string
    phone: string
    industry: string
    employee_count: string
    primary_customer: string
    customer_acquisition: string
    contact_reason: string
    data_storage: string
    user_position: string
    domain?: string
}

export interface OnboardingResponse {
    success: boolean
    data: {
        tenant_id: string
        organization_name: string
        subscription: {
            plan: string
            status: string
            trial_end_date: string
            created_at: string
        }
        user: LoginResponse["data"]["user"]
        access_token: string
        token: string
        refresh_token: string
        expires_in: number
    }
    message: string
}

export interface OnboardingOption {
    label_ar: string
    label_en: string
    value: string
}

export interface OnboardingOptionsResponse {
    success: boolean
    data: {
        industries: OnboardingOption[]
        employee_counts: OnboardingOption[]
        primary_customers: OnboardingOption[]
        customer_acquisitions: OnboardingOption[]
        contact_reasons: OnboardingOption[]
        data_storages: OnboardingOption[]
        user_positions: OnboardingOption[]
    }
    message: string
}

/* ============================================================
   API FUNCTIONS
   ============================================================ */

/** Step 1: Register a new user */
export async function registerInitial(payload: RegisterPayload): Promise<RegisterResponse> {
    const { data } = await apiClient.post<RegisterResponse>("/auth/register-initial", payload)
    return data
}

/** Step 2: Verify email with OTP */
export async function verifyEmail(payload: VerifyEmailPayload): Promise<VerifyEmailResponse> {
    const { data } = await apiClient.post<VerifyEmailResponse>("/auth/verify-email", payload)
    return data
}

/** Step 3: Resend verification email (also used for forgot password) */
export async function resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
    const { data } = await apiClient.post("/auth/resend-verification-email", { email })
    return data
}

/** Login */
export async function login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>("/auth/login", payload)
    return data
}

/** Complete onboarding (create organization) */
export async function completeOnboarding(payload: OnboardingPayload): Promise<OnboardingResponse> {
    const { data } = await apiClient.post<OnboardingResponse>("/auth/complete-onboarding", payload)
    return data
}

/** Get onboarding form dropdown options */
export async function getOnboardingOptions(): Promise<OnboardingOptionsResponse> {
    const { data } = await apiClient.get<OnboardingOptionsResponse>("/auth/onboarding-settings-options")
    return data
}

/** Refresh token */
export async function refreshToken(refresh_token: string) {
    const { data } = await apiClient.post("/auth/refresh-token", { refresh_token })
    return data
}

/** Logout */
export async function logout(token: string) {
    const { data } = await apiClient.post("/auth/logout", null, {
        headers: { Authorization: `Bearer ${token}` },
    })
    return data
}

/** Request password reset (sends OTP to email) */
export async function requestPasswordReset(email: string) {
    const { data } = await apiClient.post("/auth/password/reset/request", { email })
    return data
}

/** Confirm password reset with verification token */
export async function confirmPasswordReset(
    email: string,
    verification_token: string,
    new_password: string
) {
    const { data } = await apiClient.post("/auth/password/reset/confirm", {
        email,
        verification_token,
        new_password,
    })
    return data
}
