/**
 * The real CreateCityModal against a fake API: where rides can start, and the legal surge cap.
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
import { useAuthStore, type User } from '@/store/auth.store'
import { ToastProvider } from '@/shared/context/toast'
import { generateCirclePolygon } from '../geoUtils'
import { CreateCityModal } from '../CreateCityModal'

const CENTER = { lat: 34.1, lng: 74.85 }
const CITY = {
  id: 'id-SGR',
  code: 'SGR',
  name: 'Srinagar',
  state: 'J&K',
  stateId: null,
  country: 'India',
  isActive: true,
  hasBoundary: true,
  zoneCount: 1,
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  launchedAt: null,
  center: CENTER,
  boundary: generateCirclePolygon(CENTER, 8, 32),
  coverageMode: 'WHOLE_CITY',
  maxSurgeMultiplier: 2,
}

const admin = (permissions: string[]): User => ({
  id: 'u1',
  name: 'Ops',
  email: 'ops@zaroorat.test',
  role: 'admin',
  roles: ['admin'],
  permissions,
})

const originalAdapter = api.defaults.adapter
let container: HTMLDivElement
let root: Root
let sent: Array<{ method?: string; url?: string; body: Record<string, unknown> }>
let failCap: boolean

const flush = () => act(async () => new Promise((r) => setTimeout(r, 0)))
const settle = async () => {
  for (let i = 0; i < 10; i++) await flush()
}

async function renderModal(props: Record<string, unknown> = { cityId: CITY.id }) {
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
            createElement(CreateCityModal, { isOpen: true, onClose: () => {}, ...props }),
          ),
        ),
      ),
    ),
  )
  await settle()
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

async function setNumber(input: HTMLInputElement, value: string) {
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
    setter?.call(input, value)
    input.dispatchEvent(new window.Event('input', { bubbles: true }))
  })
  await settle()
}

const text = () => container.textContent ?? ''
const capInput = () => container.querySelector<HTMLInputElement>('input[aria-label="Surge cap"]')
const patchesTo = (url: string) => sent.filter((s) => s.url === url)

beforeEach(() => {
  sent = []
  failCap = false
  useAuthStore.setState({
    user: admin(['geography:read', 'geography:write', 'pricing:write']),
    token: 'token-1',
    isAuthenticated: true,
  })
  api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const ok = (data: unknown) => ({ data, status: 200, statusText: 'OK', headers: {}, config })
    if (config.method !== 'get') {
      const body = JSON.parse(String(config.data ?? '{}')) as Record<string, unknown>
      sent.push({ method: config.method, url: config.url, body })
      if (failCap && config.url === API_ENDPOINTS.surgeSettings.update('SGR')) {
        throw new Error('cap refused')
      }
      return ok({ data: { ...CITY, ...body } })
    }
    if (config.url === API_ENDPOINTS.settings.mapsClientConfig) return ok({ data: { providers: {} } })
    if (config.url === API_ENDPOINTS.geographic.city(CITY.id)) return ok({ data: CITY })
    if (config.url === API_ENDPOINTS.geographic.citySetup(CITY.id)) {
      return ok({ data: { zonesCoveredPct: 17.2, coveredPct: 100, issues: [] } })
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

describe('Where can rides start?', () => {
  it('shows the saved setting, and sends a change when saved', async () => {
    await renderModal()
    await click('Next: Define Boundary')

    assert.ok(text().includes('Where can rides start?'))
    assert.equal(button('Everywhere in this city').getAttribute('aria-pressed'), 'true')

    await click('Only inside zones I draw')
    assert.equal(button('Only inside zones I draw').getAttribute('aria-pressed'), 'true')

    await click('Next: Review & Update')
    assert.ok(text().includes('Only inside zones'))
    await click('Save City')

    const saved = patchesTo(API_ENDPOINTS.geographic.city(CITY.id))
    assert.equal(saved.length, 1)
    assert.equal(saved[0].body.coverageMode, 'ZONES_ONLY')
  })

  it('shows the real result before the change is saved', async () => {
    await renderModal()
    await click('Next: Define Boundary')
    assert.ok(!text().includes('17.2%'))

    await click('Only inside zones I draw')
    assert.ok(text().includes('Rides can start in 17.2% of this city'))
  })

  it('warns that a new city set to zones takes no rides until it has a zone', async () => {
    await renderModal({})
    assert.equal(button('Next: Define Boundary').disabled, false)
    await click('Next: Define Boundary')
    assert.ok(!text().includes('no rides can start'))

    await click('Only inside zones I draw')
    assert.ok(text().includes('no rides can start until you add a zone'))
  })
})

describe('Surge cap', () => {
  it('saves a changed cap through the pricing route', async () => {
    await renderModal()
    await click('Next: Define Boundary')
    const input = capInput()
    assert.ok(input, 'cap field')
    assert.equal(input.value, '2')

    await setNumber(input, '1.5')
    await click('Next: Review & Update')
    await click('Save City')

    const saved = patchesTo(API_ENDPOINTS.surgeSettings.update('SGR'))
    assert.equal(saved.length, 1)
    assert.deepEqual(saved[0].body, { maxSurgeMultiplier: 1.5 })
  })

  it('does not call the pricing route when the cap did not change', async () => {
    await renderModal()
    await click('Next: Define Boundary')
    await click('Next: Review & Update')
    await click('Save City')
    assert.equal(patchesTo(API_ENDPOINTS.surgeSettings.update('SGR')).length, 0)
  })

  it('is hidden without pricing:write, and never sent', async () => {
    useAuthStore.setState({ user: admin(['geography:read', 'geography:write']) })
    await renderModal()
    await click('Next: Define Boundary')
    assert.equal(capInput(), null)

    await click('Next: Review & Update')
    await click('Save City')
    assert.equal(patchesTo(API_ENDPOINTS.geographic.city(CITY.id)).length, 1)
    assert.equal(patchesTo(API_ENDPOINTS.surgeSettings.update('SGR')).length, 0)
  })

  it('refuses a cap above the limit before sending anything', async () => {
    await renderModal()
    await click('Next: Define Boundary')
    await setNumber(capInput()!, '2.5')
    await click('Next: Review & Update')
    await click('Save City')

    assert.ok(text().includes('between 1.0x and 2.0x'))
    assert.equal(sent.length, 0)
  })

  it('says so if the city saved but the cap did not', async () => {
    failCap = true
    await renderModal()
    await click('Next: Define Boundary')
    await setNumber(capInput()!, '1.5')
    await click('Next: Review & Update')
    await click('Save City')

    assert.ok(text().includes('the surge cap was not saved'))
  })
})
