/**
 * The real CreateSurgeZoneModal against a fake API. Changing city must leave a default zone
 * the form accepts, not one stranded in the previous city.
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
import { generateCirclePolygon } from '../../CreateCityModal/geoUtils'
import { CreateSurgeZoneModal } from '../CreateSurgeZoneModal'

const CENTERS: Record<string, { lat: number; lng: number }> = {
  ATQ: { lat: 31.634, lng: 74.8723 },
  // Not in any hard-coded list, so only the server can say where it is.
  NEW: { lat: 26.85, lng: 80.95 },
}
const CITIES = [
  { id: 'id-ATQ', code: 'ATQ', name: 'Amritsar', state: 'Punjab', stateId: null, country: 'India', isActive: true, hasBoundary: true, zoneCount: 0 },
  { id: 'id-NEW', code: 'NEW', name: 'Newtown', state: 'UP', stateId: null, country: 'India', isActive: true, hasBoundary: true, zoneCount: 0 },
]

const originalAdapter = api.defaults.adapter
let container: HTMLDivElement
let root: Root

const flush = () => act(async () => new Promise((r) => setTimeout(r, 0)))
const settle = async () => {
  for (let i = 0; i < 10; i++) await flush()
}

beforeEach(() => {
  api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const ok = (data: unknown) => ({ data, status: 200, statusText: 'OK', headers: {}, config })
    if (config.url === API_ENDPOINTS.settings.mapsClientConfig) return ok({ data: { providers: {} } })
    if (config.url === API_ENDPOINTS.surgeZones.list) return ok([])
    if (config.url === API_ENDPOINTS.geographic.cities) return ok({ data: CITIES })
    const city = CITIES.find((c) => config.url === API_ENDPOINTS.geographic.city(c.id))
    if (city) {
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

describe('Create surge zone: the default zone belongs to the selected city', () => {
  it('can be saved after changing to a city with no hard-coded location', async () => {
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
              createElement(CreateSurgeZoneModal, { isOpen: true, onClose: () => {} }),
            ),
          ),
        ),
      ),
    )
    await settle()

    const select = [...container.querySelectorAll('select')].find((s) =>
      [...s.options].some((o) => o.value === 'NEW'),
    )
    assert.ok(select, 'city select')
    await act(async () => {
      select.value = 'NEW'
      select.dispatchEvent(new window.Event('change', { bubbles: true }))
    })
    await settle()

    const save = [...container.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Create Surge Zone'),
    )
    assert.ok(save, 'save button')
    assert.equal(save.disabled, false, 'default zone should be inside the selected city')
  })
})
