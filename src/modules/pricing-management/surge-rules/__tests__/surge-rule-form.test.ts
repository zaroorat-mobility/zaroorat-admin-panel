/**
 * The real SurgeRuleWizardForm. Every control it shows must change what riders pay, so the
 * thresholds, the 0.5x preset and the version number must not come back.
 */
import '../../../dashboard/__tests__/dom-env'
import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { InternalAxiosRequestConfig } from 'axios'
import { api, API_ENDPOINTS } from '@/infrastructure/api'
import { SurgeRuleWizardForm, surgeMultiplierError, SURGE_PRESETS } from '../components/SurgeRuleWizardForm'
import type { SurgeRule } from '../types'

const originalAdapter = api.defaults.adapter
let container: HTMLDivElement
let root: Root
let submitted: Array<Record<string, unknown>>
const MINI = '22222222-2222-4222-8222-222222222222'
const XL = '33333333-3333-4333-8333-333333333333'

const flush = () => act(async () => new Promise((r) => setTimeout(r, 0)))
const settle = async () => {
  for (let i = 0; i < 6; i++) await flush()
}

const existing: SurgeRule = {
  id: 'w1',
  ruleName: 'Evening',
  vehicleLabel: 'Premium Cab',
  zoneId: 'z1',
  zoneName: 'Lal Chowk',
  multiplier: 1.5,
  effectiveFrom: '2026-11-10',
  effectiveTo: '2026-11-20',
  status: 'active',
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
}

async function render(initialValues?: SurgeRule) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  await act(async () =>
    root.render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(SurgeRuleWizardForm, {
          ...(initialValues ? { initialValues } : {}),
          onSubmit: (data: Record<string, unknown>) => submitted.push(data),
        }),
      ),
    ),
  )
  await settle()
}

async function openStep(label: string) {
  const tab = [...container.querySelectorAll('button')].find((b) => b.textContent?.includes(label))
  assert.ok(tab, `step "${label}"`)
  await act(async () => tab.click())
  await settle()
}

const text = () => container.textContent ?? ''

beforeEach(() => {
  submitted = []
  api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const reply = (data: unknown) => ({ data, status: 200, statusText: 'OK', headers: {}, config })
    if (config.url === API_ENDPOINTS.surgeZones.list) {
      return reply([{ id: 'z1', cityCode: 'SGR', name: 'Lal Chowk', isActive: true, createdAt: '' }])
    }
    if (config.url === API_ENDPOINTS.geographic.cities) {
      return reply({ data: [{ id: 'c1', code: 'SGR', name: 'Srinagar', stateId: null, isActive: true }] })
    }
    if (config.url === API_ENDPOINTS.vehicleTypes.list) {
      return reply({
        data: [
          { id: MINI, code: 'CAB_MINI_AC', name: 'Mini AC', isActive: true },
          { id: XL, code: 'CAB_XL_AC', name: 'XL AC', isActive: true },
          { id: 'old', code: 'CAB_ECONOMY', name: 'Retired Cab', isActive: false },
        ],
      })
    }
    return reply({ data: [] })
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

describe('surgeMultiplierError', () => {
  it('refuses anything that would not raise the fare or that passes the limit', () => {
    assert.ok(surgeMultiplierError(0.5))
    assert.ok(surgeMultiplierError(1))
    assert.ok(surgeMultiplierError(2.1))
  })

  it('accepts a real surge', () => {
    assert.equal(surgeMultiplierError(1.1), null)
    assert.equal(surgeMultiplierError(2), null)
  })

  it('never offers a preset that does nothing', () => {
    assert.ok(SURGE_PRESETS.every((m) => surgeMultiplierError(m) === null))
  })
})

describe('SurgeRuleWizardForm', () => {
  async function fillFirstStep() {
    const name = container.querySelector<HTMLInputElement>('input[type="text"]')
    assert.ok(name, 'rule name')
    await act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(
        name,
        'Evening',
      )
      name.dispatchEvent(new window.Event('input', { bubbles: true }))
    })
    const zone = [...container.querySelectorAll('select')].find((s) =>
      [...s.options].some((o) => o.value === 'z1'),
    )
    assert.ok(zone, 'surge zone')
    await act(async () => {
      zone.value = 'z1'
      zone.dispatchEvent(new window.Event('change', { bubbles: true }))
    })
    await settle()
  }

  const button = (label: string) => {
    const found = [...container.querySelectorAll('button')].find((b) =>
      b.textContent?.includes(label),
    )
    assert.ok(found, `button "${label}"`)
    return found
  }
  const click = async (label: string) => {
    await act(async () => button(label).click())
    await settle()
  }
  const finish = async () => {
    for (let i = 0; i < 4; i++) await click('Next')
    await click('Create Surge Rule')
  }

  it('defaults to all vehicles, and sends no vehicle list', async () => {
    await render()
    assert.ok(text().includes('All vehicles (recommended)'))
    assert.ok(!text().includes('Mini AC'), 'the list stays closed until asked for')

    await fillFirstStep()
    await finish()
    assert.equal(submitted.length, 1)
    assert.deepEqual(submitted[0].vehicleTypeIds, [])
  })

  it('offers the real active vehicle types, and sends the ones chosen', async () => {
    await render()
    await fillFirstStep()
    await click('Only these')

    assert.ok(text().includes('Mini AC'))
    assert.ok(text().includes('XL AC'))
    assert.ok(!text().includes('Retired Cab'), 'a retired type would charge nobody')

    const mini = [...container.querySelectorAll('label')].find((l) =>
      l.textContent?.includes('Mini AC'),
    )
    const checkbox = mini?.querySelector('input')
    assert.ok(checkbox, 'Mini AC checkbox')
    await act(async () => checkbox.click())
    await settle()

    await finish()
    assert.deepEqual(submitted[0].vehicleTypeIds, [MINI])
  })

  it('will not continue with Only these and nothing chosen', async () => {
    await render()
    await fillFirstStep()
    await click('Only these')
    await click('Next')
    assert.ok(text().includes('Choose at least one vehicle'))
  })

  it('has no demand or supply step, and calls daily hours what they are', async () => {
    await render(existing)
    assert.ok(!text().includes('Demand'))
    assert.ok(text().includes('Daily Hours'))

    await openStep('Daily Hours')
    assert.ok(!text().includes('Threshold'))
    assert.ok(text().includes('Repeat every day'))
  })

  it('does not call first and last day times daily', async () => {
    await render(existing)
    await openStep('Dates')
    assert.ok(!text().includes('Daily Start Time'))
    assert.ok(text().includes('Start time on first day'))
    assert.ok(text().includes('End time on last day'))
  })

  it('offers no 0.5x or 1.0x preset', async () => {
    await render(existing)
    await openStep('Multiplier')
    assert.ok(!text().includes('0.5x'))
    assert.ok(!text().includes('1.0x'))
    assert.ok(text().includes('1.2x'))
  })

  it('will not leave the first step of a new rule without a name', async () => {
    await render()
    await openStep('Multiplier')
    assert.ok(text().includes('Rule name is required.'))
  })

  it('saves an edit without a version number, and shows zone and vehicle as fixed', async () => {
    await render(existing)
    assert.ok(text().includes('Lal Chowk'))
    assert.ok(text().includes('Premium Cab'))
    assert.ok(text().includes('create a new rule'))

    await openStep('Review')
    assert.ok(text().includes('Save Changes'))
    assert.ok(!text().includes('Version'))
    assert.ok(!text().includes('V2'))
  })
})
