/**
 * The real ApplicationsListPage against fixture stats and rows. Its KPI cards must show the
 * backend's counts — the resubmission count included, kept apart from Pending Review — and
 * loading the page must not change how the list is requested.
 */
import '../../dashboard/__tests__/dom-env'
import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import type { InternalAxiosRequestConfig } from 'axios'
import { api } from '@/infrastructure/api'
import { useAuthStore, type User } from '@/store/auth.store'
import { ToastProvider } from '@/shared/context/toast'
import { ApplicationsListPage } from '../pages/applications/ApplicationsListPage'

const admin: User = {
  id: 'u-admin',
  name: 'Ops Admin',
  email: 'ops@zaroorat.test',
  role: 'admin',
  roles: ['admin'],
  permissions: ['drivers:read', 'drivers:verify'],
}

const stats = {
  total: 19,
  approved: 7,
  rejected: 3,
  pendingReview: 2,
  resubmissionRequired: 4,
  underReview: 3,
  suspended: 0,
  blocked: 0,
  recentRejections: [],
}

const row = {
  id: 'drv-1',
  applicationId: 'DRV_TEST_0001',
  driverId: 'drv-1',
  driverName: 'Sent Back',
  mobileNumber: '+919800000001',
  vehicleType: 'cab',
  applicationStatus: 'resubmission_required',
  source: 'driver_app',
  submittedAt: '2026-10-10T04:27:32.000Z',
  createdAt: '2026-10-10T04:27:32.000Z',
  updatedAt: '2026-10-10T04:27:32.000Z',
}

const originalAdapter = api.defaults.adapter
let statsPayload: Record<string, unknown>
let listRequests: unknown[]
let container: HTMLDivElement
let root: Root

const flush = () => act(async () => new Promise((r) => setTimeout(r, 0)))
const settle = async () => {
  for (let i = 0; i < 10; i++) await flush()
}

async function render() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  await act(async () =>
    root.render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(
          ToastProvider,
          null,
          createElement(MemoryRouter, null, createElement(ApplicationsListPage)),
        ),
      ),
    ),
  )
  await settle()
}

/// The number shown on the KPI card with this label.
function card(label: string): string {
  const caption = [...container.querySelectorAll('p')].find((p) => p.textContent === label)
  assert.ok(caption, `card "${label}"`)
  return caption.previousElementSibling?.textContent ?? ''
}

beforeEach(() => {
  statsPayload = stats
  listRequests = []
  api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const ok = (data: unknown) => ({ data, status: 200, statusText: 'OK', headers: {}, config })
    if (config.url === '/admin/applications/stats') return ok({ data: statsPayload })
    if (config.url === '/admin/applications') {
      listRequests.push(config.params)
      return ok({
        data: [row],
        meta: { currentPage: 1, totalPages: 1, pageSize: 100, totalCount: 1 },
      })
    }
    throw new Error(`unexpected request ${config.url}`)
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

describe('ApplicationsListPage — KPI cards', () => {
  it('shows the backend resubmission count on its own card, apart from Pending Review', async () => {
    await render()

    assert.equal(card('Resubmission Required'), '4')
    assert.equal(card('Pending Review'), '2')
    assert.equal(card('Under Review'), '3')
    assert.equal(card('Approved'), '7')
    assert.equal(card('Rejected'), '3')
    assert.equal(card('Total Applications'), '19')
  })

  it('lists a sent-back application with the same status the card counts', async () => {
    await render()

    const badge = [...container.querySelectorAll('span')].find(
      (s) => s.textContent === 'Resubmission Required',
    )
    assert.ok(badge, 'the row carries the resubmission status')
  })

  it('shows no number rather than a made-up zero when the backend sends no count', async () => {
    const { resubmissionRequired: _omitted, ...older } = stats
    statsPayload = older
    await render()

    assert.equal(card('Resubmission Required'), '—')
  })

  it('requests the list exactly as before: newest 100, every open status', async () => {
    await render()

    assert.deepEqual(listRequests, [{ limit: 100 }])
  })
})
