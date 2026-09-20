import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type {
  AppClient,
  AppConfigBundle,
  AppFontRecord,
  AppLocaleRecord,
  AppThemeRecord,
  AppTranslationRecord,
  PublishResult,
  ResetThemeBody,
  UpdateFontsBody,
  UpdateLocaleBody,
  UpdateThemeBody,
  UpsertTranslationsBody,
} from '../types'

const unwrap = <T>(res: { data: { data: T } }): T => res.data.data

export const getPublicAppConfig = async (
  app: AppClient = 'admin',
  locale = 'en',
): Promise<AppConfigBundle> => {
  const res = await api.get<{ data: AppConfigBundle }>(API_ENDPOINTS.appConfig.public, {
    params: { app, locale },
  })
  return unwrap(res)
}

export const getThemes = async (app?: AppClient): Promise<AppThemeRecord[]> => {
  const res = await api.get<{ data: AppThemeRecord[] }>(API_ENDPOINTS.appConfig.themes, {
    params: app ? { app } : undefined,
  })
  return unwrap(res)
}

export const updateTheme = async (body: UpdateThemeBody): Promise<AppThemeRecord> => {
  const res = await api.put<{ data: AppThemeRecord }>(API_ENDPOINTS.appConfig.themes, body)
  return unwrap(res)
}

export const getFonts = async (app: AppClient): Promise<AppFontRecord[]> => {
  const res = await api.get<{ data: AppFontRecord[] }>(API_ENDPOINTS.appConfig.fonts, {
    params: { app },
  })
  return unwrap(res)
}

export const updateFonts = async (body: UpdateFontsBody): Promise<AppFontRecord[]> => {
  const res = await api.put<{ data: AppFontRecord[] }>(API_ENDPOINTS.appConfig.fonts, body)
  return unwrap(res)
}

export const getLocales = async (): Promise<AppLocaleRecord[]> => {
  const res = await api.get<{ data: AppLocaleRecord[] }>(API_ENDPOINTS.appConfig.locales)
  return unwrap(res)
}

export const updateLocale = async (body: UpdateLocaleBody): Promise<AppLocaleRecord> => {
  const res = await api.put<{ data: AppLocaleRecord }>(API_ENDPOINTS.appConfig.locales, body)
  return unwrap(res)
}

export const getTranslations = async (
  app: AppClient,
  locale: string,
): Promise<AppTranslationRecord[]> => {
  const res = await api.get<{ data: AppTranslationRecord[] }>(API_ENDPOINTS.appConfig.translations, {
    params: { app, locale },
  })
  return unwrap(res)
}

export const upsertTranslations = async (
  body: UpsertTranslationsBody,
): Promise<AppTranslationRecord[]> => {
  const res = await api.put<{ data: AppTranslationRecord[] }>(
    API_ENDPOINTS.appConfig.translations,
    body,
  )
  return unwrap(res)
}

export const publishAppConfig = async (): Promise<PublishResult> => {
  const res = await api.post<{ data: PublishResult }>(API_ENDPOINTS.appConfig.publish)
  return unwrap(res)
}

export const resetAppConfig = async (body: ResetThemeBody): Promise<AppThemeRecord> => {
  const res = await api.post<{ data: AppThemeRecord }>(API_ENDPOINTS.appConfig.reset, body)
  return unwrap(res)
}
