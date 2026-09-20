import type {
  AppClient,
  AppColorScheme,
  ComponentSpecs,
  ThemeTokens,
} from '@/design-system/tokens'

export type {
  AppClient,
  AppColorScheme,
  AppConfigBundle,
  AppFontSpec,
  AppLocaleSpec,
  ButtonVariant,
  ComponentSpecs,
  FontSource,
  ThemeBundle,
  ThemeTokens,
  TranslationMap,
  PartialDeep,
} from '@/design-system/tokens'

/** Prisma / admin API enum casing for app client */
export type ApiAppKey = 'DRIVER' | 'RIDER' | 'ADMIN'

/** Prisma / admin API enum casing for color scheme */
export type ApiColorScheme = 'LIGHT' | 'DARK'

export type ApiFontSource = 'BUNDLED' | 'GOOGLE' | 'REMOTE'

export interface AppThemeRecord {
  id: string
  appKey: ApiAppKey
  colorScheme: ApiColorScheme
  tokens: ThemeTokens | Record<string, unknown>
  components: ComponentSpecs | Record<string, unknown>
  isActive: boolean
  isDefault: boolean
  version: number
  createdAt: string
  updatedAt: string
}

export interface AppFontRecord {
  id: string
  appKey: ApiAppKey
  family: string
  weight: string
  style: string
  source: ApiFontSource
  url: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AppLocaleRecord {
  id: string
  code: string
  label: string
  nativeLabel: string
  isRtl: boolean
  isActive: boolean
  isDefault: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface AppTranslationRecord {
  id: string
  localeCode: string
  appKey: ApiAppKey
  key: string
  value: string
  createdAt: string
  updatedAt: string
}

export interface UpdateThemeBody {
  app: AppClient
  colorScheme: AppColorScheme
  tokens?: Record<string, unknown>
  components?: Record<string, unknown>
}

export interface UpdateFontsBody {
  app: AppClient
  fonts: Array<{
    family: string
    weight: string
    style?: string
    source?: ApiFontSource
    url?: string | null
    isActive?: boolean
  }>
}

export interface UpdateLocaleBody {
  code: string
  label: string
  nativeLabel: string
  isRtl?: boolean
  isActive?: boolean
  isDefault?: boolean
  sortOrder?: number
}

export interface UpsertTranslationsBody {
  app: AppClient
  locale: string
  entries: Array<{ key: string; value: string }>
}

export interface ResetThemeBody {
  app: AppClient
  colorScheme: AppColorScheme
  tokens?: Record<string, unknown>
  components?: Record<string, unknown>
}

export interface PublishResult {
  version: number
}
