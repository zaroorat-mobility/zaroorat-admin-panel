/**
 * Phase 3: the real DashboardPage mounted in jsdom, with the HTTP adapter and the socket
 * replaced by recorders. Measures initial requests, socket connections, listeners, and what
 * a realtime hint actually refetches (Step 15).
 */
import './dom-env'
import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { act, createElement, StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import type { InternalAxiosRequestConfig } from 'axios'
import { api } from '@/infrastructure/api'
import { useAuthStore, type User } from '@/store/auth.store'
import { DashboardPage } from '../pages/DashboardPage'
import { socketFactory } from '../realtime'
import { fakeSocketFactory, hint, type FakeSocket } from './fake-socket'
import type { DashboardLiveDriversResponse } from '../types'

const admin: User = {
  id: 'u-admin',
  name: 'Ops Admin',
  email: 'ops@zaroorat.test',
  role: 'admin',
  roles: ['admin'],
  permissions: ['operations:read', 'finance:read'],
}

function generatedDrivers(n: number): DashboardLiveDriversResponse['drivers'] {
  let x = 11
  const rand = () => (x = (x * 16807) % 2147483647) / 2147483647
  return Array.from({ length: n }, (_, i) => ({
    id: `drv-${i}`,
    driverNumber: `D-${i}`,
    fullName: `Driver ${i}`,
    phoneNumber: '',
    avatarUrl: null,
    status: 'ONLINE' as const,
    mode: null,
    vehicle: null,
    location: { lat: 20 + rand(), lng: 70 + rand() }, // generated test coordinates
    speedKmh: null,
    heading: null,
    activeTrip: null,
    recordedAt: '2026-09-30T06:00:00.000Z',
    gpsFreshness: 'LIVE' as const,
    gpsLagSeconds: 3,
    lastUpdateText: '3s ago',
  }))
}

const FIXTURES: Record<string, unknown> = {
  '/dashboard/overview': {
    activeDrivers: 37, activeDriversChangePct: null, onlineDrivers: 20, onlineDriversPctOfActive: 54,
    ongoingRides: 9, ongoingRidesChangePct: null, inFlightRiders: 11, completedRidesToday: 41,
    completedRidesYesterday: 30, completedRidesChangePct: 36.7, pendingVerifications: 2,
    pendingVerificationsChangePct: null, registeredDrivers: 90, calculatedAt: '2026-09-30T06:00:00.000Z',
  },
  '/dashboard/financials': {
    platformRevenueToday: -120, platformRevenueYesterday: 300, platformRevenueChangePct: -140,
    grossRideValueToday: 900, grossRideValueYesterday: 800, grossRideValueChangePct: 12.5,
    driverRideCollectionsToday: 700, driverRideCollectionsYesterday: 650, driverRideCollectionsChangePct: 7.7,
    currency: 'INR', reportingTimeZone: 'Asia/Kolkata', calculatedAt: '2026-09-30T06:00:00.000Z',
  },
  '/dashboard/financial-analytics': {
    range: '7d',
    platformRevenueTrend: [
      { date: 'Sep 29, 2026', dayOfWeek: 'Tue', dateKey: '2026-09-29', platformRevenue: 300, rideCommission: 300, subscriptionRevenue: 0, platformFees: 0 },
      { date: 'Sep 30, 2026', dayOfWeek: 'Wed', dateKey: '2026-09-30', platformRevenue: -120, rideCommission: -120, subscriptionRevenue: 0, platformFees: 0 },
    ],
    grossRideValueTrend: [
      { date: 'Sep 29, 2026', dayOfWeek: 'Tue', dateKey: '2026-09-29', grossRideValue: 800, ridesCount: 3 },
      { date: 'Sep 30, 2026', dayOfWeek: 'Wed', dateKey: '2026-09-30', grossRideValue: 900, ridesCount: 4 },
    ],
    reportingTimeZone: 'Asia/Kolkata', calculatedAt: '2026-09-30T06:00:00.000Z',
  },
  '/dashboard/analytics': {
    rideStatusDistribution: { total: 10, completed: 6, completedPct: 60, cancelled: 2, cancelledPct: 20, noDriversFound: 1, noDriversFoundPct: 10, ongoing: 1, ongoingPct: 10 },
    ridesByHour: Array.from({ length: 24 }, (_, hour) => ({ hour, label: `${hour}h`, count: hour === 9 ? 5 : 0, isPeak: hour === 9 })),
    periodStart: '', periodEnd: '', reportingTimeZone: 'Asia/Kolkata', calculatedAt: '2026-09-30T06:00:00.000Z',
  },
  '/dashboard/activity': { activities: [], hasMore: false, nextCursor: null, calculatedAt: '2026-09-30T06:00:00.000Z' },
  '/dashboard/health': {
    databaseLatencyMs: 4, databaseStatus: 'HEALTHY', websocketConnections: 3, websocketStatus: 'HEALTHY',
    redisStatus: 'HEALTHY', failedQueueJobs: 0, notificationSuccessRate: null, notificationStatus: 'NO_DATA',
    gpsFreshnessSec: 3, gpsFreshnessStatus: 'LIVE', paymentFailureRate24h: null, paymentFailureStatus: 'NO_DATA',
    overallStatus: 'HEALTHY', timestamp: '2026-09-30T06:00:00.000Z',
  },
  '/admin/settings/maps/client-config': { data: null },
}

let driverCount = 50
const requests: string[] = []
const originalAdapter = api.defaults.adapter

function liveDrivers(): DashboardLiveDriversResponse {
  return {
    totalDrivers: driverCount, onlineCount: driverCount, onTripCount: 0, busyCount: 0, breakCount: 0, offlineCount: 0,
    gpsStaleAfterSec: 120, drivers: generatedDrivers(driverCount), calculatedAt: '2026-09-30T06:00:00.000Z',
  }
}

const flush = () => act(async () => new Promise((r) => setTimeout(r, 0)))
async function settle() {
  let last = -1
  while (last !== requests.length) {
    last = requests.length
    for (let i = 0; i < 5; i++) await flush()
  }
}
const countBy = () => requests.reduce<Record<string, number>>((acc, url) => ((acc[url] = (acc[url] ?? 0) + 1), acc), {})

let container: HTMLDivElement
let root: Root
let factory: ReturnType<typeof fakeSocketFactory>
const originalConnect = socketFactory.connect

function page(strict = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const tree = createElement(
    QueryClientProvider,
    { client },
    createElement(MemoryRouter, null, createElement(DashboardPage)),
  )
  return strict ? createElement(StrictMode, null, tree) : tree
}

beforeEach(() => {
  requests.length = 0
  driverCount = 50
  api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const url = config.url ?? ''
    requests.push(url)
    const data = url === '/dashboard/live-drivers' ? liveDrivers() : FIXTURES[url]
    if (data === undefined) throw new Error(`unexpected request ${url}`)
    return { data, status: 200, statusText: 'OK', headers: {}, config }
  }
  factory = fakeSocketFactory()
  socketFactory.connect = factory.connect
  useAuthStore.setState({ user: admin, token: 'token-1', isAuthenticated: true })
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  api.defaults.adapter = originalAdapter
  socketFactory.connect = originalConnect
})

const openSockets = () => factory.sockets.filter((s: FakeSocket) => s.open)

describe('Phase 3: DashboardPage mount, realtime and request budget', () => {
  for (const n of [10, 50, 100, 200]) {
    it(`mount with ${n} drivers: one request per section, one socket, one listener per event`, async (t) => {
      driverCount = n
      const t0 = performance.now()
      await act(async () => root.render(page()))
      await settle()
      const mountMs = performance.now() - t0

      assert.deepEqual(countBy(), {
        '/dashboard/overview': 1,
        '/dashboard/financials': 1,
        '/dashboard/financial-analytics': 1,
        '/dashboard/analytics': 1,
        '/dashboard/live-drivers': 1,
        '/dashboard/activity': 1,
        '/dashboard/health': 1,
        '/admin/settings/maps/client-config': 1,
      })
      assert.equal(factory.sockets.length, 1)
      const socket = factory.sockets[0]
      const perEvent = [...socket.listeners.entries()].map(([e, set]) => [e, set.size] as const)
      assert.ok(perEvent.every(([, size]) => size === 1), `one listener per event: ${JSON.stringify(perEvent)}`)
      assert.equal(container.querySelectorAll('.leaflet-marker-icon').length, n)
      t.diagnostic(
        `PAGE n=${n} mount=${mountMs.toFixed(0)}ms initialRequests=${requests.length} sockets=${factory.sockets.length} socketListeners=${socket.listenerCount()} markers=${n}`,
      )
    })
  }

  it('a hint refetches only its mapped sections; the connection badge tracks the socket', async () => {
    await act(async () => root.render(page()))
    await settle()
    const socket = factory.sockets[0]
    await act(async () => socket.serverSends('connect'))
    assert.match(container.textContent ?? '', /Live updates on/)
    assert.deepEqual(socket.emitted.map((e) => e.event), ['dashboard.subscribe'])

    requests.length = 0
    await act(async () =>
      socket.serverSends('dashboard.driver.status_changed', hint({ driverId: 'drv-1', status: 'OFFLINE' })),
    )
    await settle()
    assert.deepEqual(countBy(), { '/dashboard/overview': 1, '/dashboard/live-drivers': 1 })

    // Disconnected: the badge says so, the last server values stay, nothing is refetched
    requests.length = 0
    await act(async () => socket.serverSends('disconnect', 'transport close'))
    await settle()
    assert.match(container.textContent ?? '', /Live updates interrupted, reconnecting/)
    assert.match(container.textContent ?? '', /37/, 'last overview value still shown')
    assert.deepEqual(requests, [])
  })

  it('10 mount/unmount cycles never hold two sockets and leave no listener behind', async () => {
    for (let i = 0; i < 10; i++) {
      await act(async () => root.render(page()))
      await settle()
      assert.equal(openSockets().length, 1, `cycle ${i}: one open socket`)
      await act(async () => root.unmount())
      root = createRoot(container)
      await flush() // the connection closes on the tick after the last holder leaves
      assert.equal(openSockets().length, 0, `cycle ${i}: closed on unmount`)
    }
    assert.equal(factory.sockets.length, 10)
    assert.ok(factory.sockets.every((s) => s.listenerCount() === 0 && s.disconnectCalls === 1))
  })

  it('StrictMode double effects create one socket, not two, and no duplicate requests', async (t) => {
    await act(async () => root.render(page(true)))
    await settle()
    assert.equal(factory.sockets.length, 1, 'the simulated remount reuses the socket')
    assert.equal(openSockets().length, 1)
    assert.ok(openSockets()[0].listenerCount('dashboard.ride.changed') === 1)
    const dup = Object.entries(countBy()).filter(([, n]) => n > 1)
    assert.deepEqual(dup, [], 'React Query dedupes the StrictMode double mount')
    t.diagnostic(`STRICT sockets created=${factory.sockets.length} open=${openSockets().length} requests=${requests.length}`)
  })

  it('opens no socket for a user without any dashboard permission', async () => {
    useAuthStore.setState({ user: { ...admin, roles: ['support'], role: 'support', permissions: ['riders:read'] } })
    await act(async () => root.render(page()))
    await settle()
    assert.equal(factory.sockets.length, 0)
    assert.deepEqual(requests, [], 'forbidden sections are not requested either')
    assert.doesNotMatch(container.textContent ?? '', /Live updates/)
  })
})
