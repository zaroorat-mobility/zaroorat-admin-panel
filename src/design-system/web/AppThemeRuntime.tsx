import { useEffect, useRef } from 'react'
import { api, API_ENDPOINTS } from '@/infrastructure/api'
import {
  createDefaultBundle,
  darkTokens,
  lightTokens,
  type AppConfigBundle,
  type AppColorScheme,
  type PartialDeep,
} from '@/design-system/tokens'
import { useThemeStore } from '@/store/theme.store'
import { applyCssVariables } from './applyCssVariables'
import { isValidBundleShape, mergeBundle } from './merge'

let lastBundle: AppConfigBundle | null = null

function schemeTokens(bundle: AppConfigBundle, scheme: AppColorScheme) {
  return bundle.theme[scheme]?.tokens ?? (scheme === 'dark' ? darkTokens : lightTokens)
}

export function resetToBundledDefaults(scheme?: AppColorScheme): void {
  const active = scheme ?? (useThemeStore.getState().theme as AppColorScheme)
  applyCssVariables(active === 'dark' ? darkTokens : lightTokens)
  lastBundle = createDefaultBundle('admin', 'en')
}

async function fetchAdminPublicConfig(): Promise<PartialDeep<AppConfigBundle> | null> {
  try {
    const res = await api.get<{ data: unknown }>(API_ENDPOINTS.appConfig.public, {
      params: { app: 'admin', locale: 'en' },
    })
    const payload = res.data.data
    if (!isValidBundleShape(payload)) return null
    return payload
  } catch {
    return null
  }
}

/**
 * Fetches remote admin app-config on mount and applies CSS variables for the
 * current light/dark scheme. Failures keep theme.css defaults in place.
 */
export function AppThemeRuntime(): null {
  const scheme = useThemeStore((s) => s.theme)
  const bundleRef = useRef<AppConfigBundle | null>(null)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const defaults = createDefaultBundle('admin', 'en')
      const remote = await fetchAdminPublicConfig()
      if (cancelled) return

      if (!remote) {
        // Keep theme.css defaults — do not overwrite unless we have a valid remote merge.
        return
      }

      const merged = mergeBundle(defaults, remote)
      bundleRef.current = merged
      lastBundle = merged
      applyCssVariables(schemeTokens(merged, scheme))
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const bundle = bundleRef.current ?? lastBundle
    if (!bundle) return
    applyCssVariables(schemeTokens(bundle, scheme))
  }, [scheme])

  return null
}

export default AppThemeRuntime
