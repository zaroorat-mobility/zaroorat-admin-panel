import { useMapClientConfig } from './useMapClientConfig'

/**
 * The Google Maps browser key: the one the backend serves, else the build's
 * VITE_GOOGLE_MAPS_API_KEY. `isResolving` stays true until the backend request settles,
 * because the Maps API takes only one key per page load.
 */
export function useGoogleMapsKey(): { apiKey: string; isResolving: boolean } {
  const { data, isPending } = useMapClientConfig()
  const envKey = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GOOGLE_MAPS_API_KEY : undefined
  const apiKey = data?.providers.google?.clientSdkKey?.trim() || (typeof envKey === 'string' ? envKey.trim() : '')
  return { apiKey, isResolving: isPending }
}
