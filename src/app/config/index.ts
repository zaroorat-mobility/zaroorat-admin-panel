/**
 * Application Configuration Registry
 */
export const APP_CONFIG = {
  appName: 'Zaroorat Mobility',
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.zaroorat-myride.local/v1',
    timeout: 15000,
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
    enabled: import.meta.env.PROD,
    trackingId: import.meta.env.VITE_ANALYTICS_ID || '',
  },
} as const;

export type AppConfig = typeof APP_CONFIG;
