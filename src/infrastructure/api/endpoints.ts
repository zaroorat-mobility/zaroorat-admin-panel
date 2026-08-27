/**
 * Centralized Endpoints Registry for API requests
 */
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/admin/login',
    logout: '/auth/logout',
    me: '/auth/me',
    refreshToken: '/auth/token/refresh',
    otpSend: '/auth/admin/otp/send',
    otpVerify: '/auth/admin/otp/verify',
  },
  dashboard: {
    stats: '/dashboard/stats',
    trends: '/dashboard/trends',
    liveRides: '/dashboard/live-rides',
  },
  users: {
    list: '/admin/users',
    detail: (id: string) => `/admin/users/${id}`,
    create: '/admin/users',
    update: (id: string) => `/admin/users/${id}`,
    delete: (id: string) => `/admin/users/${id}`,
  },
  rbac: {
    permissions: '/admin/rbac/permissions',
    roles: '/admin/rbac/roles',
    rolePermissions: (slug: string) => `/admin/rbac/roles/${slug}/permissions`,
  },
  riders: {
    list: '/admin/riders',
    detail: (id: string) => `/admin/riders/${id}`,
    suspend: (id: string) => `/admin/riders/${id}/suspend`,
    block: (id: string) => `/admin/riders/${id}/block`,
    activate: (id: string) => `/admin/riders/${id}/activate`,
  },
  drivers: {
    list: '/admin/drivers',
    detail: (id: string) => `/admin/drivers/${id}`,
    suspend: (id: string) => `/admin/drivers/${id}/suspend`,
    block: (id: string) => `/admin/drivers/${id}/block`,
    activate: (id: string) => `/admin/drivers/${id}/activate`,
    verify: (id: string) => `/admin/drivers/${id}/verify`,
    documentReview: (driverId: string, documentId: string) =>
      `/admin/drivers/${driverId}/documents/${documentId}/review`,
  },
  applications: {
    list: '/admin/applications',
    create: '/admin/applications',
    detail: (id: string) => `/admin/applications/${id}`,
    approve: (id: string) => `/admin/applications/${id}/approve`,
    reject: (id: string) => `/admin/applications/${id}/reject`,
    requestResubmission: (id: string) => `/admin/applications/${id}/request-resubmission`,
    documentReview: (id: string, documentId: string) =>
      `/admin/applications/${id}/documents/${documentId}/review`,
  },
  vehicles: {
    list: '/admin/vehicles',
    detail: (id: string) => `/admin/vehicles/${id}`,
    flagRenewal: (id: string) => `/admin/vehicles/${id}/flag-renewal`,
    review: (id: string) => `/admin/vehicles/${id}/review`,
    verify: (id: string) => `/admin/vehicles/${id}/verify`,
    documentReview: (vehicleId: string, documentId: string) =>
      `/admin/vehicles/${vehicleId}/documents/${documentId}/review`,
  },
  vehicleTypes: {
    list: '/vehicle-types',
  },
  fareRules: {
    list: '/admin/fare-rules',
    detail: (id: string) => `/admin/fare-rules/${id}`,
    create: '/admin/fare-rules',
    update: (id: string) => `/admin/fare-rules/${id}`,
    activate: (id: string) => `/admin/fare-rules/${id}/activate`,
    deactivate: (id: string) => `/admin/fare-rules/${id}/deactivate`,
    delete: (id: string) => `/admin/fare-rules/${id}`,
  },
  surgeZones: {
    list: '/admin/surge-zones',
    detail: (id: string) => `/admin/surge-zones/${id}`,
  },
  surgeWindows: {
    list: '/admin/surge-windows',
    detail: (id: string) => `/admin/surge-windows/${id}`,
    create: '/admin/surge-windows',
    update: (id: string) => `/admin/surge-windows/${id}`,
    delete: (id: string) => `/admin/surge-windows/${id}`,
  },
  cancellationPolicies: {
    list: '/admin/cancellation-policies',
    detail: (id: string) => `/admin/cancellation-policies/${id}`,
    create: '/admin/cancellation-policies',
    update: (id: string) => `/admin/cancellation-policies/${id}`,
    activate: (id: string) => `/admin/cancellation-policies/${id}/activate`,
    deactivate: (id: string) => `/admin/cancellation-policies/${id}/deactivate`,
    delete: (id: string) => `/admin/cancellation-policies/${id}`,
  },
  promotions: {
    list: '/admin/promotions',
    detail: (id: string) => `/admin/promotions/${id}`,
    create: '/admin/promotions',
    update: (id: string) => `/admin/promotions/${id}`,
    activate: (id: string) => `/admin/promotions/${id}/activate`,
    deactivate: (id: string) => `/admin/promotions/${id}/deactivate`,
    reportOverview: '/admin/promotions/reports/overview',
    performance: (id: string) => `/admin/promotions/${id}/performance`,
  },
  campaigns: {
    list: '/admin/campaigns',
    detail: (id: string) => `/admin/campaigns/${id}`,
    create: '/admin/campaigns',
    update: (id: string) => `/admin/campaigns/${id}`,
    targets: (id: string) => `/admin/campaigns/${id}/targets`,
  },
  segments: {
    list: '/admin/segments',
    detail: (id: string) => `/admin/segments/${id}`,
    create: '/admin/segments',
    update: (id: string) => `/admin/segments/${id}`,
    delete: (id: string) => `/admin/segments/${id}`,
  },
  couponBatches: {
    list: '/admin/coupon-batches',
    detail: (id: string) => `/admin/coupon-batches/${id}`,
    create: '/admin/coupon-batches',
    generate: (id: string) => `/admin/coupon-batches/${id}/generate`,
    activate: (id: string) => `/admin/coupon-batches/${id}/activate`,
    deactivate: (id: string) => `/admin/coupon-batches/${id}/deactivate`,
  },
  coupons: {
    list: '/admin/coupons',
  },
  promoBanners: {
    list: '/admin/promo-banners',
    detail: (id: string) => `/admin/promo-banners/${id}`,
    create: '/admin/promo-banners',
    update: (id: string) => `/admin/promo-banners/${id}`,
    activate: (id: string) => `/admin/promo-banners/${id}/activate`,
    deactivate: (id: string) => `/admin/promo-banners/${id}/deactivate`,
    delete: (id: string) => `/admin/promo-banners/${id}`,
  },
  cities: {
    list: '/admin/cities',
  },
  referralPrograms: {
    list: '/admin/referral-programs',
    detail: (id: string) => `/admin/referral-programs/${id}`,
    create: '/admin/referral-programs',
    update: (id: string) => `/admin/referral-programs/${id}`,
    activate: (id: string) => `/admin/referral-programs/${id}/activate`,
    deactivate: (id: string) => `/admin/referral-programs/${id}/deactivate`,
    milestones: (id: string) => `/admin/referral-programs/${id}/milestones`,
  },
  referralMilestones: {
    update: (id: string) => `/admin/referral-milestones/${id}`,
    activate: (id: string) => `/admin/referral-milestones/${id}/activate`,
    deactivate: (id: string) => `/admin/referral-milestones/${id}/deactivate`,
  },
  referralCodes: {
    list: '/admin/referral-codes',
    activate: (id: string) => `/admin/referral-codes/${id}/activate`,
    deactivate: (id: string) => `/admin/referral-codes/${id}/deactivate`,
  },
  referrals: {
    list: '/admin/referrals',
    detail: (id: string) => `/admin/referrals/${id}`,
  },
  verification: {
    list: '/verifications',
    detail: (id: string) => `/verifications/${id}`,
    approve: (id: string) => `/verifications/${id}/approve`,
    reject: (id: string) => `/verifications/${id}/reject`,
  },
  files: {
    create: '/files',
    complete: (id: string) => `/files/${id}/complete`,
    readUrl: (id: string) => `/files/${id}/url`,
  },
} as const

export type ApiEndpoints = typeof API_ENDPOINTS
