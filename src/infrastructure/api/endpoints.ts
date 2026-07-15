/**
 * Centralized Endpoints Registry for API requests
 */
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
    refreshToken: '/auth/refresh-token',
  },
  dashboard: {
    stats: '/dashboard/stats',
    trends: '/dashboard/trends',
    liveRides: '/dashboard/live-rides',
  },
  users: {
    list: '/users',
    detail: (id: string) => `/users/${id}`,
    create: '/users',
    update: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
  },
  riders: {
    list: '/riders',
    detail: (id: string) => `/riders/${id}`,
    update: (id: string) => `/riders/${id}`,
    history: (id: string) => `/riders/${id}/history`,
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
