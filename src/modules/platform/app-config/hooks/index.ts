import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getFonts,
  getLocales,
  getPublicAppConfig,
  getThemes,
  getTranslations,
  publishAppConfig,
  resetAppConfig,
  updateFonts,
  updateLocale,
  updateTheme,
  upsertTranslations,
} from '../api'
import type {
  AppClient,
  ResetThemeBody,
  UpdateFontsBody,
  UpdateLocaleBody,
  UpdateThemeBody,
  UpsertTranslationsBody,
} from '../types'

export const appConfigKey = ['app-config'] as const

export const usePublicAppConfig = (app: AppClient = 'admin', locale = 'en') =>
  useQuery({
    queryKey: [...appConfigKey, 'public', app, locale],
    queryFn: () => getPublicAppConfig(app, locale),
  })

export const useThemes = (app?: AppClient) =>
  useQuery({
    queryKey: [...appConfigKey, 'themes', app ?? 'all'],
    queryFn: () => getThemes(app),
  })

export const useUpdateTheme = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateThemeBody) => updateTheme(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...appConfigKey, 'themes'] })
      void qc.invalidateQueries({ queryKey: [...appConfigKey, 'public'] })
    },
  })
}

export const useFonts = (app: AppClient) =>
  useQuery({
    queryKey: [...appConfigKey, 'fonts', app],
    queryFn: () => getFonts(app),
  })

export const useUpdateFonts = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateFontsBody) => updateFonts(body),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: [...appConfigKey, 'fonts', variables.app] })
      void qc.invalidateQueries({ queryKey: [...appConfigKey, 'public'] })
    },
  })
}

export const useLocales = () =>
  useQuery({
    queryKey: [...appConfigKey, 'locales'],
    queryFn: getLocales,
  })

export const useUpdateLocale = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateLocaleBody) => updateLocale(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...appConfigKey, 'locales'] })
      void qc.invalidateQueries({ queryKey: [...appConfigKey, 'public'] })
    },
  })
}

export const useTranslations = (app: AppClient, locale: string) =>
  useQuery({
    queryKey: [...appConfigKey, 'translations', app, locale],
    queryFn: () => getTranslations(app, locale),
  })

export const useUpsertTranslations = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpsertTranslationsBody) => upsertTranslations(body),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({
        queryKey: [...appConfigKey, 'translations', variables.app, variables.locale],
      })
      void qc.invalidateQueries({ queryKey: [...appConfigKey, 'public'] })
    },
  })
}

export const usePublishAppConfig = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: publishAppConfig,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: appConfigKey })
    },
  })
}

export const useResetAppConfig = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ResetThemeBody) => resetAppConfig(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: appConfigKey })
    },
  })
}
