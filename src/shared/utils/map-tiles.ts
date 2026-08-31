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
    const url = provider.apiKey?.trim()
      ? appendQueryParam(provider.tileUrl.trim(), 'api_key', provider.apiKey.trim())
      : provider.tileUrl.trim()
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
    case 'mappls':
      return {
        url: provider.apiKey?.trim()
          ? appendQueryParam(`${base}/map/{z}/{x}/{y}.png`, 'api_key', provider.apiKey.trim())
          : `${base}/map/{z}/{x}/{y}.png`,
        attribution: '&copy; MapmyIndia',
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

  // Try fallback providers in order
  for (const key of ['ola', 'mappls', 'google'] as const) {
    if (key === providerKey) continue
    const layer = buildProviderTileLayer(key, config.providers[key])
    if (layer) return layer
  }

  return OSM_TILE_LAYER
}
