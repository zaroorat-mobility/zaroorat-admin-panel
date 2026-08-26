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
    list: '/drivers',
    detail: (id: string) => `/drivers/${id}`,
    update: (id: string) => `/drivers/${id}`,
    verify: (id: string) => `/drivers/${id}/verify`,
    documents: (id: string) => `/drivers/${id}/documents`,
  },
  verification: {
    list: '/verifications',
    detail: (id: string) => `/verifications/${id}`,
    approve: (id: string) => `/verifications/${id}/approve`,
    reject: (id: string) => `/verifications/${id}/reject`,
  },
} as const

export type ApiEndpoints = typeof API_ENDPOINTS
