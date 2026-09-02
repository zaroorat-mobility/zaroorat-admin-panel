export interface MapProviderClientConfig {
  enabled: boolean
  baseUrl: string
  /** Full tile URL template when backend provides a ready-to-use layer. */
  tileUrl?: string
  /** Scoped client key for tile requests (when exposed by backend). */
  apiKey?: string
}

export interface MapClientConfig {
  primaryProvider: string
  /** Optional ready-to-use tile layer from backend (highest priority). */
  tileUrl?: string
  providers: {
    ola: MapProviderClientConfig
    google: MapProviderClientConfig
    mappls: MapProviderClientConfig
  }
}

export interface MapTileLayerConfig {
  url: string
  attribution: string
}

export const OSM_TILE_LAYER: MapTileLayerConfig = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}

const MAPPLS_TILES_BASE = 'https://apis.mappls.com/advancedmaps/v1'
const MAPPLS_DEFAULT_TILE_LAYER = 'bhuvan_imagery'

function appendQueryParam(url: string, key: string, value: string): string {
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`
}

function buildProviderTileLayer(
  providerKey: keyof MapClientConfig['providers'],
  provider: MapProviderClientConfig,
): MapTileLayerConfig | null {
  if (!provider.enabled) return null

  if (provider.tileUrl?.trim()) {
    // Ola authenticates tiles via api_key query param; Mappls embeds the license key in the path.
    let url = provider.tileUrl.trim()
    if (provider.apiKey?.trim() && providerKey === 'ola') {
      url = appendQueryParam(url, 'api_key', provider.apiKey.trim())
    }
    return {
      url,
      attribution:
        providerKey === 'ola'
          ? '&copy; Ola Maps'
          : providerKey === 'mappls'
            ? '&copy; MapmyIndia'
            : '&copy; Google Maps',
    }
  }

  const base = provider.baseUrl?.trim().replace(/\/$/, '')
  if (!base) return null

  switch (providerKey) {
    case 'mappls': {
      if (!provider.apiKey?.trim()) return null
      const tilesBase = base.includes('route.mappls.com') ? MAPPLS_TILES_BASE : base
      return {
        url: `${tilesBase}/${provider.apiKey.trim()}/${MAPPLS_DEFAULT_TILE_LAYER}/{z}/{x}/{y}.png`,
        attribution: '&copy; MapmyIndia',
      }
    }
    case 'ola': {
      if (!provider.apiKey?.trim()) return null
      const stylePath =
        provider.tileUrl?.trim() ||
        `${base}/tiles/v1/styles/default-light-standard/{z}/{x}/{y}.png`
      return {
        url: appendQueryParam(stylePath, 'api_key', provider.apiKey.trim()),
        attribution: '&copy; Ola Maps',
      }
    }
    default:
      return null
  }
}

export function resolveMapTileLayer(config?: MapClientConfig | null): MapTileLayerConfig {
  if (!config) return OSM_TILE_LAYER

  if (config.tileUrl?.trim()) {
    return {
      url: config.tileUrl.trim(),
      attribution: '&copy; Map Provider',
    }
  }

  const providerKey = config.primaryProvider as keyof MapClientConfig['providers']
  const primary = config.providers[providerKey]
  const primaryLayer = primary ? buildProviderTileLayer(providerKey, primary) : null
  if (primaryLayer) return primaryLayer

  return OSM_TILE_LAYER
}
