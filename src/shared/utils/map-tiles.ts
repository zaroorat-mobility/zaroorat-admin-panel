export interface MapProviderClientConfig {
  enabled: boolean
  baseUrl: string
  /** Full tile URL template when backend provides a ready-to-use layer. */
  tileUrl?: string
  /** Browser-publishable client SDK key for tile requests (never a server key). */
  clientSdkKey?: string
}

export interface MapClientConfig {
  primaryProvider: string
  /** Optional ready-to-use tile layer from backend (highest priority). */
  tileUrl?: string
  providers: {
    google: MapProviderClientConfig
    mappls: MapProviderClientConfig
  }
}

export interface MapTileLayerConfig {
  url: string
  attribution: string
  subdomains?: string[] | string
}

const getEnvGoogleKey = (): string =>
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_MAPS_API_KEY
    ? String(import.meta.env.VITE_GOOGLE_MAPS_API_KEY).trim()
    : ''

export const DEFAULT_GOOGLE_TILE_LAYER: MapTileLayerConfig = {
  url: `https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}${getEnvGoogleKey() ? `&key=${encodeURIComponent(getEnvGoogleKey())}` : ''}`,
  attribution: '&copy; Google Maps',
  subdomains: ['0', '1', '2', '3'],
}

/** Fallback layer alias defaulting to Google Maps */
export const OSM_TILE_LAYER: MapTileLayerConfig = DEFAULT_GOOGLE_TILE_LAYER

const MAPPLS_TILES_BASE = 'https://apis.mappls.com/advancedmaps/v1'
const MAPPLS_DEFAULT_TILE_LAYER = 'bhuvan_imagery'

function buildProviderTileLayer(
  providerKey: keyof MapClientConfig['providers'],
  provider: MapProviderClientConfig,
): MapTileLayerConfig | null {
  if (!provider.enabled) return null

  if (provider.tileUrl?.trim()) {
    const url = provider.tileUrl.trim()
    return {
      url,
      attribution:
        providerKey === 'mappls'
          ? '&copy; MapmyIndia'
          : '&copy; Google Maps',
      subdomains: providerKey === 'google' ? ['0', '1', '2', '3'] : ['a', 'b', 'c'],
    }
  }

  const base = provider.baseUrl?.trim().replace(/\/$/, '')

  switch (providerKey) {
    case 'google': {
      const key = provider.clientSdkKey?.trim() || getEnvGoogleKey()
      const keyParam = key ? `&key=${encodeURIComponent(key)}` : ''
      return {
        url: `https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}${keyParam}`,
        attribution: '&copy; Google Maps',
        subdomains: ['0', '1', '2', '3'],
      }
    }
    case 'mappls': {
      if (!provider.clientSdkKey?.trim()) return null
      const tilesBase = base && base.includes('route.mappls.com') ? MAPPLS_TILES_BASE : (base || MAPPLS_TILES_BASE)
      return {
        url: `${tilesBase}/${provider.clientSdkKey.trim()}/${MAPPLS_DEFAULT_TILE_LAYER}/{z}/{x}/{y}.png`,
        attribution: '&copy; MapmyIndia',
      }
    }
    default:
      return null
  }
}

export function resolveMapTileLayer(config?: MapClientConfig | null): MapTileLayerConfig {
  if (!config) return DEFAULT_GOOGLE_TILE_LAYER

  if (config.tileUrl?.trim()) {
    return {
      url: config.tileUrl.trim(),
      attribution: '&copy; Map Provider',
    }
  }

  const providerKey = (config.primaryProvider || 'google') as keyof MapClientConfig['providers']
  const primary = config.providers?.[providerKey]
  const primaryLayer = primary ? buildProviderTileLayer(providerKey, primary) : null
  if (primaryLayer) return primaryLayer

  return DEFAULT_GOOGLE_TILE_LAYER
}
