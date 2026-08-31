export interface MapClientConfig {
  primaryProvider: string
  providers: {
    ola: { enabled: boolean; baseUrl: string }
    google: { enabled: boolean; baseUrl: string }
    mappls: { enabled: boolean; baseUrl: string }
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

export function resolveMapTileLayer(config?: MapClientConfig | null): MapTileLayerConfig {
  if (!config) return OSM_TILE_LAYER

  const providerKey = config.primaryProvider as keyof MapClientConfig['providers']
  const provider = config.providers[providerKey]

  if (!provider?.enabled || !provider.baseUrl?.trim()) {
    return OSM_TILE_LAYER
  }

  const base = provider.baseUrl.replace(/\/$/, '')

  switch (providerKey) {
    case 'mappls':
      return {
        url: `${base}/map/{z}/{x}/{y}.png`,
        attribution: '&copy; MapmyIndia',
      }
    case 'ola':
      return {
        url: `${base}/tiles/v1/{z}/{x}/{y}.png`,
        attribution: '&copy; Ola Maps',
      }
    default:
      return OSM_TILE_LAYER
  }
}
