/**
 * The real GoogleZoneDrawingMap under StrictMode, with a stand-in for Google's classes.
 * Map setup ran twice and created two maps, leaving the zone and the Operating Area on the
 * hidden one. The admin saw a map with nothing on it.
 */
import '@/modules/dashboard/__tests__/dom-env'
import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { act, createElement, StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { InternalAxiosRequestConfig } from 'axios'
import { api, API_ENDPOINTS } from '@/infrastructure/api'
import { GoogleZoneDrawingMap } from '../GoogleZoneDrawingMap'

const CENTER = { lat: 34.209, lng: 74.3436 }
const CITY = [
  [
    [74.2, 34.1],
    [74.5, 34.1],
    [74.5, 34.3],
    [74.2, 34.3],
    [74.2, 34.1],
  ],
]
const ZONE = [
  [
    [74.33, 34.2],
    [74.35, 34.2],
    [74.35, 34.22],
    [74.33, 34.22],
    [74.33, 34.2],
  ],
]

let maps: FakeMap[]
let polygons: FakePolygon[]

class FakeMap {
  constructor() {
    maps.push(this)
  }
  addListener() {}
  setMapTypeId() {}
  fitBounds() {}
  setCenter() {}
  setZoom() {}
  getZoom() {
    return 12
  }
  panTo() {}
}

class FakePolygon {
  map: unknown
  path: Array<{ lat: number; lng: number }>
  constructor(options: { map: unknown; paths: Array<{ lat: number; lng: number }> }) {
    this.map = options.map
    this.path = options.paths
    polygons.push(this)
  }
  setMap(map: unknown) {
    this.map = map
  }
  getPath() {
    const points = this.path.map((p) => ({ lat: () => p.lat, lng: () => p.lng }))
    return { addListener() {}, getArray: () => points, forEach: points.forEach.bind(points) }
  }
  setPaths(paths: Array<{ lat: number; lng: number }>) {
    this.path = paths
  }
  setOptions() {}
}

const originalAdapter = api.defaults.adapter
const originalGoogle = (window as unknown as { google?: unknown }).google
let container: HTMLDivElement
let root: Root

const flush = () => act(async () => new Promise((r) => setTimeout(r, 0)))
const settle = async () => {
  for (let i = 0; i < 10; i++) await flush()
}

beforeEach(() => {
  maps = []
  polygons = []
  const fakeGoogle = {
    maps: {
      importLibrary: async () => ({}),
      Map: FakeMap,
      Polygon: FakePolygon,
      LatLngBounds: class {
        extend() {}
      },
      MapTypeId: { ROADMAP: 'roadmap', SATELLITE: 'satellite', TERRAIN: 'terrain', HYBRID: 'hybrid' },
    },
  }
  // The component reads window.google; Google's loader reads the bare global.
  ;(window as unknown as { google: unknown }).google = fakeGoogle
  ;(globalThis as unknown as { google: unknown }).google = fakeGoogle
  api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const data =
      config.url === API_ENDPOINTS.settings.mapsClientConfig
        ? { data: { providers: { google: { clientSdkKey: 'test-key' } } } }
        : { data: [] }
    return { data, status: 200, statusText: 'OK', headers: {}, config }
  }
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  api.defaults.adapter = originalAdapter
  ;(window as unknown as { google?: unknown }).google = originalGoogle
  ;(globalThis as unknown as { google?: unknown }).google = originalGoogle
})

describe('GoogleZoneDrawingMap', () => {
  it('creates one map and draws the zone and Operating Area on it', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    // As on the map step: an earlier step already loaded the key, so setup starts at once.
    client.setQueryData(['settings', 'maps', 'client-config'], {
      providers: { google: { clientSdkKey: 'test-key' } },
    })
    await act(async () =>
      root.render(
        createElement(
          StrictMode,
          null,
          createElement(
            QueryClientProvider,
            { client },
            createElement(GoogleZoneDrawingMap, {
              coordinates: ZONE,
              onChange: () => {},
              cityBoundary: CITY,
              center: CENTER,
              cityName: 'Baramulla',
              zoneName: 'Test Zone',
              height: '300px',
            }),
          ),
        ),
      ),
    )
    await settle()

    assert.equal(maps.length, 1, `created ${maps.length} maps`)
    const onScreen = polygons.filter((p) => p.map === maps[0])
    assert.equal(onScreen.length, 2, 'Operating Area and zone are both on the visible map')
  })
})
