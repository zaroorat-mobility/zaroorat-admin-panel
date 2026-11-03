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

const VEHICLE_ID = '11111111-1111-4111-8111-111111111111'

const originalAdapter = api.defaults.adapter
let container: HTMLDivElement
let root: Root
let held: Map<string, () => void>
let holdCityDetails: boolean
let failCityDetails: boolean
let cityBoundaries: Record<string, number[][][] | null>
let zoneDetail: Record<string, unknown> | null
let zoneList: Array<Record<string, unknown>>
let coverageMode: 'WHOLE_CITY' | 'ZONES_ONLY'
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
  failCityDetails = false
  cityBoundaries = {}
  zoneDetail = null
  zoneList = []
  coverageMode = 'WHOLE_CITY'
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
    if (config.url === API_ENDPOINTS.geographic.serviceZones) return ok({ data: zoneList })
    if (config.url === API_ENDPOINTS.vehicleTypes.list) {
      return ok({ data: [{ id: VEHICLE_ID, code: 'CAB_ECONOMY', name: 'Economy Cab', isActive: true }] })
    }
    const city = CITIES.find((c) => config.url === API_ENDPOINTS.geographic.city(c.id))
    if (city) {
      if (failCityDetails) throw new Error('city detail unavailable')
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
          coverageMode,
          boundary:
            city.code in cityBoundaries
              ? cityBoundaries[city.code]
              : generateCirclePolygon(CENTERS[city.code], 8, 32),
        },
      })
    }
    if (zoneDetail && config.url === API_ENDPOINTS.geographic.serviceZone(String(zoneDetail.id))) {
      return ok({ data: zoneDetail })
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

describe('Create zone: the form says what each setting does', () => {
  function typeSelect(): HTMLSelectElement {
    const select = [...container.querySelectorAll('select')].find((s) =>
      [...s.options].some((o) => o.value === 'RESTRICTED'),
    )
    assert.ok(select, 'zone type select')
    return select
  }

  async function chooseType(type: string) {
    const select = typeSelect()
    await act(async () => {
      select.value = type
      select.dispatchEvent(new window.Event('change', { bubbles: true }))
    })
    await settle()
  }

  it('makes a restricted zone block pickup and drop unless told otherwise', async () => {
    await renderModal()
    await chooseType('RESTRICTED')

    const text = container.textContent ?? ''
    assert.ok(text.includes('Create Restricted Zone'))
    assert.ok(text.includes('Block pickups'))
    assert.ok(text.includes('Block drop-offs'))

    await click('Next: Define Zone on Map')
    await click('Next: Review & Create')
    await click('Create Restricted Zone')

    assert.equal(sent.length, 1)
    assert.equal(sent[0].body.zoneType, 'RESTRICTED')
    assert.equal(sent[0].body.allowsPickup, false)
    assert.equal(sent[0].body.allowsDropoff, false)
  })

  it('will not continue with a restricted zone that blocks nothing', async () => {
    await renderModal()
    await chooseType('RESTRICTED')
    await click('Block pickups')
    await click('Block drop-offs')

    assert.equal(button('Next: Define Zone on Map').disabled, true)
    assert.ok((container.textContent ?? '').includes('Choose at least one'))
  })

  it('skips the vehicle step for a restricted zone, which applies to all vehicles', async () => {
    await renderModal()
    await chooseType('RESTRICTED')
    assert.ok(!(container.textContent ?? '').includes('Vehicle Categories'))
    assert.ok(!(container.textContent ?? '').includes('vehicle categories'))
  })

  it('has no Priority field and sends none', async () => {
    await renderModal()
    assert.ok(!(container.textContent ?? '').includes('Priority'))

    await click('Next: Vehicle Categories')
    await click('Next: Define Zone on Map')
    await click('Next: Review & Create')
    assert.ok(!(container.textContent ?? '').includes('Priority'))

    await click('Create Service Zone')
    assert.equal('priority' in sent[0].body, false)
  })

  it('offers no drop-off switch on a service zone, where it would do nothing', async () => {
    await renderModal()
    const text = container.textContent ?? ''
    assert.ok(text.includes('Allow Pickups'))
    assert.ok(!text.includes('Allow Drop-offs'))
  })

  it('says a service zone does not limit where rides start in a whole-city city', async () => {
    coverageMode = 'WHOLE_CITY'
    await renderModal()
    assert.ok((container.textContent ?? '').includes('does not limit where rides start'))
    assert.ok(!(container.textContent ?? '').includes('stops taking rides'))
  })

  it('says nothing of the kind in a city limited to its zones', async () => {
    coverageMode = 'ZONES_ONLY'
    await renderModal()
    assert.ok(!(container.textContent ?? '').includes('does not limit where rides start'))
  })

  it('defaults to all vehicles, selects nothing, and sends no vehicle list', async () => {
    await renderModal()
    await click('Next: Vehicle Categories')

    assert.ok((container.textContent ?? '').includes('All vehicles (recommended)'))
    assert.ok(!(container.textContent ?? '').includes('Economy Cab'))

    await click('Next: Define Zone on Map')
    await click('Next: Review & Create')
    await click('Create Service Zone')

    assert.equal('vehicleTypeIds' in sent[0].body, false)
  })

  it('needs a vehicle before continuing with Only these, then sends just that one', async () => {
    await renderModal()
    await click('Next: Vehicle Categories')
    await click('Only these')

    assert.equal(button('Next: Define Zone on Map').disabled, true)

    const card = [...container.querySelectorAll('div')].find(
      (d) => d.className.includes('min-h-[148px]') && d.textContent?.includes('Economy Cab'),
    )
    assert.ok(card, 'vehicle card')
    await act(async () => card.click())
    await settle()

    await click('Next: Define Zone on Map')
    await click('Next: Review & Create')
    await click('Create Service Zone')

    assert.deepEqual(sent[0].body.vehicleTypeIds, [VEHICLE_ID])
  })
})

describe('Create zone: honest messages and no invented city data', () => {
  it('resets an airport zone to the city centre, as the button says', async () => {
    await renderModal({ initialZoneType: 'AIRPORT' })
    await click('Next: Vehicle Categories')
    await click('Next: Define Zone on Map')

    // Amritsar airport is 11 km out, beyond this city's 8 km Operating Area.
    assert.ok((container.textContent ?? '').includes('Part of this zone is outside Amritsar'))

    await click('Reset zone to city centre')

    assert.ok(farthestFrom('ATQ') < 2.1, `zone is ${farthestFrom('ATQ').toFixed(1)} km from Amritsar`)
    assert.ok((container.textContent ?? '').includes('Inside Amritsar'))
  })

  it('does not spin forever on a zone whose city is not in the active list', async () => {
    zoneDetail = {
      id: 'zone-2',
      code: 'OLD_SZ_01',
      name: 'Old Zone',
      zoneType: 'SERVICE',
      cityCode: 'OLD',
      cityId: 'id-OLD',
      isActive: true,
      allowsPickup: true,
      allowsDropoff: true,
      fareRuleCount: 0,
      boundary: generateCirclePolygon(CENTERS.ATQ, 2, 8),
      vehicleTypeIds: [],
      vehicleTypeCodes: [],
    }
    await renderModal({ zoneId: 'zone-2' })
    assert.ok((container.textContent ?? '').includes('Could not load the Operating Area'))
  })

  it('shows city and zone code as fixed when editing, because the server cannot change them', async () => {
    zoneDetail = {
      id: 'zone-1',
      code: 'BRM_SZ_01',
      name: 'Baramulla Service Zone',
      zoneType: 'SERVICE',
      cityCode: 'BRM',
      cityId: 'id-BRM',
      isActive: true,
      allowsPickup: true,
      allowsDropoff: true,
      fareRuleCount: 0,
      boundary: generateCirclePolygon(CENTERS.BRM, 2, 8),
      vehicleTypeIds: [],
      vehicleTypeCodes: [],
    }
    await renderModal({ zoneId: 'zone-1' })
    assert.equal(citySelect().disabled, true)
    const codeInput = [...container.querySelectorAll('input')].find((i) => i.value === 'BRM_SZ_01')
    assert.ok(codeInput, 'zone code input')
    assert.equal(codeInput.disabled, true)
  })

  it('explains a zone outside the city and resets it, without advising a bigger city', async () => {
    zoneDetail = {
      id: 'zone-1',
      code: 'BRM_SZ_01',
      name: 'Baramulla Service Zone',
      zoneType: 'SERVICE',
      cityCode: 'BRM',
      cityId: 'id-BRM',
      isActive: true,
      allowsPickup: true,
      allowsDropoff: true,
      fareRuleCount: 0,
      boundary: generateCirclePolygon(CENTERS.ATQ, 2, 8),
      vehicleTypeIds: [],
      vehicleTypeCodes: [],
    }
    await renderModal({ zoneId: 'zone-1' })
    await click('Next: Vehicle Categories')
    await click('Next: Define Zone on Map')

    const text = container.textContent ?? ''
    assert.ok(text.includes('Part of this zone is outside Baramulla'))
    assert.ok(!text.includes('Expand Radius'))
    assert.ok(!text.includes('Polygon is completely inside'))
    assert.equal(button('Next: Review & Update').disabled, true)

    await click('Reset zone to city centre')

    assert.ok(farthestFrom('BRM') < 2.1)
    assert.ok((container.textContent ?? '').includes('Inside Baramulla'))
    assert.equal(button('Next: Review & Update').disabled, false)
  })

  it('stops with Try again when the city will not load, and invents nothing', async () => {
    failCityDetails = true
    await renderModal()

    const text = container.textContent ?? ''
    assert.ok(text.includes('Could not load the Operating Area'))
    assert.ok(!text.includes('294.8'))
    assert.equal(button('Next: Vehicle Categories').disabled, true)

    failCityDetails = false
    await click('Try again')

    assert.equal(button('Next: Vehicle Categories').disabled, false)
    await click('Next: Vehicle Categories')
    await click('Next: Define Zone on Map')
    assert.ok(farthestFrom('ATQ') < 2.1)
  })

  it('treats a city with no boundary as not ready, not as a 9.5 km circle', async () => {
    cityBoundaries.ATQ = null
    await renderModal()
    assert.ok((container.textContent ?? '').includes('Could not load the Operating Area'))
    assert.equal(button('Next: Vehicle Categories').disabled, true)
  })

  it('calls the area what it is and drops the false boundary source', async () => {
    await renderModal()
    const text = container.textContent ?? ''
    assert.ok(text.includes('Operating Area'))
    assert.ok(!text.includes('City administrative boundary'))
    assert.ok(!text.includes('City Boundary'))
  })
})
