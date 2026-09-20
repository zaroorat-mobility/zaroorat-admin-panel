import type { AppConfigBundle, PartialDeep } from '@/design-system/tokens'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Deep-merge remote partial over defaults. Arrays and primitives replace; objects merge. */
export function deepMerge<T>(base: T, override: PartialDeep<T> | undefined | null): T {
  if (override == null) return base
  if (!isObject(base) || !isObject(override)) {
    return (override as T) ?? base
  }

  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) }
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue
    const current = result[key]
    if (isObject(current) && isObject(value)) {
      result[key] = deepMerge(current, value)
    } else {
      result[key] = value
    }
  }
  return result as T
}

export function mergeBundle(
  defaults: AppConfigBundle,
  remote: PartialDeep<AppConfigBundle> | null,
): AppConfigBundle {
  if (!remote) return defaults
  return deepMerge(defaults, remote)
}

export function isValidBundleShape(value: unknown): value is PartialDeep<AppConfigBundle> {
  if (!isObject(value)) return false
  if (value.theme != null && !isObject(value.theme)) return false
  if (value.strings != null && !isObject(value.strings)) return false
  if (value.fonts != null && !Array.isArray(value.fonts)) return false
  if (value.locales != null && !Array.isArray(value.locales)) return false
  return true
}
