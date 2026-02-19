/* ============================================================
   SETTINGS FEATURE — TYPE DEFINITIONS
   ============================================================ */

// ── Organization — nested types ──

export interface ContactInfo {
    phone?: string | null
    email?: string | null
}

export interface BillingInfo {
    country?: string
    [key: string]: unknown
}

export interface OrganizationMetadata {
    industry?: string
    employee_count?: string
    primary_customer?: string
    customer_acquisition?: string
    contact_reason?: string
    data_storage?: string
    onboarding_completed?: boolean
    onboarding_source?: string
    [key: string]: unknown
}

export interface OrganizationOwner {
    user_id: string
    email: string
    name: string
    position?: string
}

export interface LimitItem {
    max_count?: number
    current_count?: number
    max_per_month?: number
    current_month_count?: number
    max_size_gb?: number
    current_size_gb?: number
    max_requests_per_day?: number
    current_requests_today?: number
    rate_limit_per_minute?: number
    unlimited?: boolean
    reset_date?: string | null
}

export interface EffectiveLimits {
    users?: LimitItem
    contacts?: LimitItem
    messages?: LimitItem
    storage?: LimitItem
    api?: LimitItem
    [key: string]: LimitItem | undefined
}

export interface PlanSnapshot {
    plan_id?: string
    plan_name?: string
    plan_version?: string
    features?: Record<string, unknown>
    limits?: EffectiveLimits
}

export interface OnboardingSteps {
    email_verified?: boolean
    organization_created?: boolean
    subscription_created?: boolean
    [key: string]: boolean | undefined
}

// ── Organization — main data ──

export interface OrganizationData {
    tenant_id: string
    name: string
    domain: string
    slug?: string
    subdomain?: string
    type?: string
    status: string
    logo: string | null
    industry: string | null
    country: string | null
    timezone: string | null
    language: string | null
    phone: string | null
    address: string | null
    website: string | null
    description: string | null
    plan: string | null
    contact_info?: ContactInfo
    billing_info?: BillingInfo
    metadata?: OrganizationMetadata
    owner?: OrganizationOwner
    plan_snapshot?: PlanSnapshot
    effective_limits?: EffectiveLimits
    trial_started_at?: string | null
    trial_ends_at?: string | null
    is_active?: boolean
    is_verified?: boolean
    onboarding_completed?: boolean
    onboarding_steps?: OnboardingSteps
    created_at: string
    updated_at: string
    [key: string]: unknown
}

export interface UpdateOrganizationPayload {
    logo?: string | null
    industry?: string | null
    country?: string | null
    timezone?: string | null
    language?: string | null
    phone?: string | null
    address?: string | null
    website?: string | null
    description?: string | null
}

export interface OrganizationResponse {
    success: boolean
    data: OrganizationData | null
    message: string
}



// ── User Profile (/admin/me) ──

export interface UserSessionData {
    session_handle: string
    created_at: string
    expires_at: string
    login_time: string
    ip_address: string
    user_agent: string
}

export interface UserProfileData {
    user_id: string
    email: string
    tenant_id: string
    first_name: string
    last_name: string
    full_name: string
    phone: string | null
    profile_picture: string | null
    position: string | null
    role: string
    roles: string[]
    email_verified: boolean
    is_active: boolean
    is_owner: boolean
    session?: UserSessionData
    /** permissions exist but not displayed */
    permissions?: unknown
    [key: string]: unknown
}

export interface UpdateUserProfilePayload {
    user_id: string
    username_login: string
    first_name?: string | null
    last_name?: string | null
    phone?: string | null
    profile_picture?: string | null
    is_active?: boolean | null
}

export interface UserProfileResponse {
    success: boolean
    data: UserProfileData | null
    message: string
}

