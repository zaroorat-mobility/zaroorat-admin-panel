/**
 * The real CreateServiceZoneModal against a fake API. Pins the bug where the map showed
 * Baramulla while the default zone sat in Amritsar, 292.5 km away, and told the admin to
 * expand the city to 295 km.
 */
import '../../../../dashboard/__tests__/dom-env'
import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import type { InternalAxiosRequestConfig } from 'axios'
import { api, API_ENDPOINTS } from '@/infrastructure/api'
import { ToastProvider } from '@/shared/context/toast'
import { generateCirclePolygon, haversineDistanceKm } from '../../CreateCityModal/geoUtils'
import { CreateServiceZoneModal } from '../CreateServiceZoneModal'

const CENTERS: Record<string, { lat: number; lng: number }> = {
  ATQ: { lat: 31.634, lng: 74.8723 },
  BRM: { lat: 34.209, lng: 74.3436 },
  SGR: { lat: 34.1, lng: 74.85 },
}
const CITIES = [
  { id: 'id-ATQ', code: 'ATQ', name: 'Amritsar', state: 'Punjab', stateId: null, country: 'India', isActive: true, hasBoundary: true, zoneCount: 0 },
  { id: 'id-BRM', code: 'BRM', name: 'Baramulla', state: 'J&K', stateId: null, country: 'India', isActive: true, hasBoundary: true, zoneCount: 0 },
  { id: 'id-SGR', code: 'SGR', name: 'Srinagar', state: 'J&K', stateId: null, country: 'India', isActive: true, hasBoundary: true, zoneCount: 0 },
]

const originalAdapter = api.defaults.adapter
let container: HTMLDivElement
let root: Root
let held: Map<string, () => void>
let holdCityDetails: boolean
let sent: Array<{ method?: string; url?: string; body: Record<string, unknown> }>

const flush = () => act(async () => new Promise((r) => setTimeout(r, 0)))
const settle = async () => {
  for (let i = 0; i < 10; i++) await flush()
}

async function renderModal(props: Record<string, unknown> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  await act(async () =>
    root.render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(
          ToastProvider,
          null,
          createElement(
            MemoryRouter,
            null,
            createElement(CreateServiceZoneModal, { isOpen: true, onClose: () => {}, ...props }),
          ),
        ),
      ),
    ),
  )
  await settle()
}

function citySelect(): HTMLSelectElement {
  const select = [...container.querySelectorAll('select')].find((s) =>
    [...s.options].some((o) => o.value === 'BRM'),
  )
  assert.ok(select, 'city select')
  return select
}

async function chooseCity(code: string) {
  const select = citySelect()
  await act(async () => {
    select.value = code
    select.dispatchEvent(new window.Event('change', { bubbles: true }))
  })
}

function button(label: string): HTMLButtonElement {
  const found = [...container.querySelectorAll('button')].find((b) =>
    b.textContent?.includes(label),
  )
  assert.ok(found, `button "${label}"`)
  return found
}

async function click(label: string) {
  await act(async () => button(label).click())
  await settle()
}

/// The polygon the form would save, read from the GeoJSON card on the map step.
function drawnRing(): number[][] {
  const pre = container.querySelector('pre')
  assert.ok(pre, 'GeoJSON card')
  return (JSON.parse(pre.textContent ?? '{}') as { coordinates: number[][][] }).coordinates[0]
}

function farthestFrom(code: string): number {
  return Math.max(
    ...drawnRing().map(([lng, lat]) => haversineDistanceKm(CENTERS[code], { lat, lng })),
  )
}

beforeEach(() => {
  held = new Map()
  holdCityDetails = false
  sent = []
  api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const ok = (data: unknown) => ({ data, status: 200, statusText: 'OK', headers: {}, config })
    if (config.method !== 'get') {
      const body = JSON.parse(String(config.data ?? '{}')) as Record<string, unknown>
      sent.push({ method: config.method, url: config.url, body })
      return ok({ data: { id: 'zone-new', ...body } })
    }
    if (config.url === API_ENDPOINTS.settings.mapsClientConfig) return ok({ data: { providers: {} } })
    if (config.url === API_ENDPOINTS.geographic.cities) return ok({ data: CITIES })
    const city = CITIES.find((c) => config.url === API_ENDPOINTS.geographic.city(c.id))
    if (city) {
      if (holdCityDetails) {
        await new Promise<void>((resolve) => held.set(city.code, resolve))
      }
      return ok({
        data: {
          ...city,
          timezone: 'Asia/Kolkata',
          currency: 'INR',
          launchedAt: null,
          center: CENTERS[city.code],
          boundary: generateCirclePolygon(CENTERS[city.code], 8, 32),
        },
      })
    }
    return ok({ data: [] })
  }
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  api.defaults.adapter = originalAdapter
})

describe('Create zone: the default zone belongs to the selected city', () => {
  it('puts the zone in Baramulla after changing city from Amritsar', async () => {
    await renderModal()
    assert.equal(citySelect().value, 'ATQ')

    await chooseCity('BRM')
    await settle()
    await click('Next: Vehicle Categories')
    await click('Next: Define Zone on Map')

    assert.ok(farthestFrom('BRM') < 2.1, `zone is ${farthestFrom('BRM').toFixed(1)} km from Baramulla`)
    assert.equal(button('Next: Review & Create').disabled, false)
  })

  it('keeps the last city when replies arrive out of order on a slow network', async () => {
    await renderModal()
    await chooseCity('BRM')
    await settle()
    await click('Next: Vehicle Categories')
    await click('Next: Define Zone on Map')
    await click('Back')
    await click('Back')

    holdCityDetails = true
    await chooseCity('SGR')
    await flush()
    await chooseCity('ATQ')
    await flush()
    await chooseCity('SGR')
    await flush()

    // Replies arrive newest first, then the stale one for Amritsar.
    await act(async () => held.get('SGR')?.())
    await settle()
    await act(async () => held.get('ATQ')?.())
    await settle()

    await click('Next: Vehicle Categories')
    await click('Next: Define Zone on Map')
    assert.ok(farthestFrom('SGR') < 2.1, `zone is ${farthestFrom('SGR').toFixed(1)} km from Srinagar`)
  })
})
