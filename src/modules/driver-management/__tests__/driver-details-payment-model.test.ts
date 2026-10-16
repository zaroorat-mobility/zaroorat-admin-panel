/**
 * The real DriverDetailsPage against fixture drivers. Commission or Subscription is the
 * driver's own choice, made in the driver app after approval: the admin page shows what the
 * driver chose, says plainly when nothing is chosen yet, and offers no way to choose for them.
 */
import '../../dashboard/__tests__/dom-env'
import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { InternalAxiosRequestConfig } from 'axios'
import { api } from '@/infrastructure/api'
import { useAuthStore, type User } from '@/store/auth.store'
import { ToastProvider } from '@/shared/context/toast'
import { DriverDetailsPage } from '../pages/drivers/DriverDetailsPage'

const admin: User = {
  id: 'u-admin',
  name: 'Ops Admin',
  email: 'ops@zaroorat.test',
  role: 'admin',
  roles: ['admin'],
  permissions: ['drivers:read', 'drivers:write', 'drivers:verify'],
}

function driver(extra: Record<string, unknown> = {}) {
  return {
    id: 'drv-1',
    applicationId: 'DRV_TEST_0001',
    driverCode: 'DRV_TEST_0001',
    driverName: 'Just Approved',
    mobileNumber: '+919800000001',
    vehicleType: 'cab',
    driverStatus: 'active',
    verificationStatus: 'VERIFIED',
    ratingAvg: 0,
    totalTrips: 0,
    walletBalance: 0,
    joinedAt: '2026-10-10T04:27:32.000Z',
    isOnline: false,
    isSuspended: false,
    isBlocked: false,
    createdAt: '2026-10-10T04:27:32.000Z',
    updatedAt: '2026-10-10T04:27:32.000Z',
    documents: [],
    timeline: [],
    ...extra,
  }
}

const originalAdapter = api.defaults.adapter
let fixture: ReturnType<typeof driver>
let container: HTMLDivElement
let root: Root

const flush = () => act(async () => new Promise((r) => setTimeout(r, 0)))
const settle = async () => {
  for (let i = 0; i < 10; i++) await flush()
}

async function render(extra: Record<string, unknown> = {}) {
  fixture = driver(extra)
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
            { initialEntries: ['/driver-management/drivers/drv-1'] },
            createElement(
              Routes,
              null,
              createElement(Route, {
                path: '/driver-management/drivers/:id',
                element: createElement(DriverDetailsPage),
              }),
            ),
          ),
        ),
      ),
    ),
  )
  await settle()
}

const text = () => container.textContent ?? ''
const buttons = (label: string) =>
  [...container.querySelectorAll('button')].filter((b) => b.textContent?.trim() === label)

async function openTab(label: string) {
  const tab = [...container.querySelectorAll('button')].find((b) => b.textContent?.trim() === label)
  assert.ok(tab, `tab "${label}"`)
  await act(async () => {
    tab.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
  })
  await settle()
}

beforeEach(() => {
  api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const ok = (data: unknown) => ({ data, status: 200, statusText: 'OK', headers: {}, config })
    if (config.url === '/admin/drivers/drv-1') return ok({ data: fixture })
    // Anything else the page loads (wallet, rides…) is beside the point here.
    return ok({ data: [] })
  }
  useAuthStore.setState({ user: admin, token: 'token-1', isAuthenticated: true })
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  api.defaults.adapter = originalAdapter
})

describe('DriverDetailsPage — the payment model is the driver’s choice', () => {
  it('says nothing is chosen yet for a just-approved driver, never "Commission"', async () => {
    await render()

    assert.ok(text().includes('Not chosen yet'), text().slice(0, 400))
    assert.ok(!/Standard Commission|Commission Model|7% Commission|Auto Monthly Plan/.test(text()))

    await openTab('Subscription')
    assert.ok(text().includes('Not chosen yet'))
    assert.ok(!/Auto Monthly Plan|7% Commission Plan/.test(text()))
  })

  it('shows Commission once the driver chose it', async () => {
    await render({ paymentModel: 'COMMISSION' })
    assert.ok(text().includes('Commission'))
    assert.ok(!text().includes('Not chosen yet'))
  })

  it('shows the subscription plan the driver bought', async () => {
    await render({
      paymentModel: 'SUBSCRIPTION',
      subscription: { planName: 'Weekly Saver', status: 'ACTIVE' },
    })
    assert.ok(text().includes('Weekly Saver'))
    assert.ok(!text().includes('Not chosen yet'))
  })

  it('offers the admin no way to choose a plan for the driver', async () => {
    await render()
    // Counts, not elements: a failing diff of a DOM node exhausts memory.
    assert.equal(buttons('Manage').length, 0)
    await openTab('Subscription')
    assert.equal(buttons('Change Plan').length, 0)
    assert.ok(!text().includes('Change Monetization Plan'))

    // Nor tucked away in the ⋮ menu.
    const more = container.querySelector('button svg.lucide-ellipsis-vertical')?.closest('button')
    assert.ok(more, 'the ⋮ menu button')
    await act(async () => {
      more.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
    })
    await settle()
    assert.ok(text().includes('Add Timeline Note'), 'the menu is open')
    assert.ok(!/Billing Plan/.test(text()))
  })
})
