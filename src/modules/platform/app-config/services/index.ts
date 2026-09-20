import {
  createDefaultBundle,
  darkTokens,
  defaultComponents,
  lightTokens,
  type AppClient,
  type AppColorScheme,
  type AppFontSpec,
  type ComponentSpecs,
  type FontSource,
  type ThemeTokens,
} from '@/design-system/tokens'
import { deepMerge } from '@/design-system/web/merge'
import type {
  ApiAppKey,
  ApiColorScheme,
  ApiFontSource,
  AppFontRecord,
  AppThemeRecord,
  UpdateFontsBody,
  UpdateThemeBody,
} from '../types'

export function toAppClientSlug(appKey: ApiAppKey | AppClient): AppClient {
  const key = String(appKey).toLowerCase()
  if (key === 'driver' || key === 'rider' || key === 'admin') return key
  return 'admin'
}

export function toColorSchemeSlug(scheme: ApiColorScheme | AppColorScheme): AppColorScheme {
  const key = String(scheme).toLowerCase()
  return key === 'dark' ? 'dark' : 'light'
}

export function toApiFontSource(source: FontSource | ApiFontSource | string): ApiFontSource {
  const upper = String(source).toUpperCase()
  if (upper === 'GOOGLE' || upper === 'REMOTE' || upper === 'BUNDLED') return upper
  return 'BUNDLED'
}

export function toFontSourceSlug(source: FontSource | ApiFontSource | string): FontSource {
  const lower = String(source).toLowerCase()
  if (lower === 'google' || lower === 'remote' || lower === 'bundled') return lower
  return 'bundled'
}

export function defaultTokensForScheme(scheme: AppColorScheme): ThemeTokens {
  return scheme === 'dark' ? darkTokens : lightTokens
}

export function resolveThemeTokens(
  record: AppThemeRecord | undefined,
  app: AppClient,
  scheme: AppColorScheme,
): ThemeTokens {
  const defaults = createDefaultBundle(app, 'en').theme[scheme].tokens
  if (!record?.tokens || typeof record.tokens !== 'object') return defaults
  return deepMerge(defaults, record.tokens as Partial<ThemeTokens>)
}

export function resolveThemeComponents(
  record: AppThemeRecord | undefined,
  app: AppClient,
  scheme: AppColorScheme,
): ComponentSpecs {
  const defaults = createDefaultBundle(app, 'en').theme[scheme].components ?? defaultComponents
  if (!record?.components || typeof record.components !== 'object') return defaults
  return deepMerge(defaults, record.components as Partial<ComponentSpecs>)
}

export function findThemeRecord(
  themes: AppThemeRecord[],
  app: AppClient,
  scheme: AppColorScheme,
): AppThemeRecord | undefined {
  const appKey = app.toUpperCase() as ApiAppKey
  const colorScheme = scheme.toUpperCase() as ApiColorScheme
  return themes.find((t) => t.appKey === appKey && t.colorScheme === colorScheme)
}

export function buildUpdateThemeBody(
  app: AppClient,
  colorScheme: AppColorScheme,
  tokens?: ThemeTokens,
  components?: ComponentSpecs,
): UpdateThemeBody {
  return {
    app,
    colorScheme,
    ...(tokens ? { tokens: tokens as unknown as Record<string, unknown> } : {}),
    ...(components ? { components: components as unknown as Record<string, unknown> } : {}),
  }
}

export function mapFontRecordsToSpecs(records: AppFontRecord[]): AppFontSpec[] {
  return records.map((f) => ({
    family: f.family,
    weight: f.weight,
    style: f.style === 'italic' ? 'italic' : 'normal',
    source: toFontSourceSlug(f.source),
    url: f.url,
    isActive: f.isActive,
  }))
}

export function buildUpdateFontsBody(app: AppClient, fonts: AppFontSpec[]): UpdateFontsBody {
  return {
    app,
    fonts: fonts.map((f) => ({
      family: f.family,
      weight: f.weight,
      style: f.style,
      source: toApiFontSource(f.source),
      url: f.url ?? null,
      isActive: f.isActive,
    })),
  }
}

export function buildResetThemeBody(
  app: AppClient,
  colorScheme: AppColorScheme,
): UpdateThemeBody {
  return {
    app,
    colorScheme,
    tokens: defaultTokensForScheme(colorScheme) as unknown as Record<string, unknown>,
    components: defaultComponents as unknown as Record<string, unknown>,
  }
}
