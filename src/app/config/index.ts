/**
 * Application Configuration Registry
 */
export const APP_CONFIG = {
  appName: 'Zaroorat Mobility',
  api: {
    baseUrl: import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
    timeout: 15000,
  },
  /** Socket.IO on the API host; must match the backend's REALTIME_PATH. */
  realtime: {
    path: import.meta.env?.VITE_REALTIME_PATH || '/socket.io',
  },
  storage: {
    tokenKey: 'zaroorat_auth_token',
    userKey: 'zaroorat_auth_user',
    themeKey: 'zaroorat_theme',
  },
  pagination: {
    defaultPageSize: 10,
  },
  analytics: {
    enabled: Boolean(import.meta.env?.PROD),
    trackingId: import.meta.env?.VITE_ANALYTICS_ID || '',
  },
} as const;

export type AppConfig = typeof APP_CONFIG;
