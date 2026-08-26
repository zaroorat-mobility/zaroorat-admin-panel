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
  verification: {
    list: '/verifications',
    detail: (id: string) => `/verifications/${id}`,
    approve: (id: string) => `/verifications/${id}/approve`,
    reject: (id: string) => `/verifications/${id}/reject`,
  },
} as const

export type ApiEndpoints = typeof API_ENDPOINTS
