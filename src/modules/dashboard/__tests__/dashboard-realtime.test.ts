/**
 * Phase 3 realtime: connection lifecycle, listener hygiene, and the event → query
 * invalidation matrix, measured as real React Query refetches (queryFn calls).
 */
import { describe, it, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { QueryClient, QueryObserver, notifyManager } from '@tanstack/react-query'
import {
  startDashboardRealtime,
  acquireDashboardRealtime,
  invalidationTargets,
  getDashboardRealtimeState,
  DASHBOARD_SOCKET_EVENTS,
  type RealtimeStatus,
} from '../realtime'
import { dashboardKeys } from '../hooks'
import { FakeSocket, fakeSocketFactory, hint } from './fake-socket'

notifyManager.setScheduler((cb) => cb())
const flush = () => new Promise((resolve) => setImmediate(resolve))

/** Every dashboard query, as DashboardPage keys them, each counting its fetches. */
async function queryWorld({ finance = true } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })
  const keys = {
    overview: dashboardKeys.overview(),
    financials: dashboardKeys.financials(),
    financialAnalytics: dashboardKeys.financialAnalytics('7d'),
    analytics: dashboardKeys.analytics(),
    liveDrivers: dashboardKeys.liveDrivers({ limit: 200 }),
    activity: dashboardKeys.activity({ limit: 10 }),
    health: dashboardKeys.health(),
  }
  const calls = Object.fromEntries(Object.keys(keys).map((k) => [k, 0])) as Record<keyof typeof keys, number>
  const unsubscribes = Object.entries(keys).map(([name, queryKey]) => {
    const observer = new QueryObserver(client, {
      queryKey,
      queryFn: async () => ({ fetch: ++calls[name as keyof typeof keys] }),
      // hooks disable finance queries for a user without finance:read
      enabled: name.startsWith('financ') ? finance : true,
    })
    return observer.subscribe(() => {})
  })
  await flush()
  const reset = () => Object.keys(calls).forEach((k) => (calls[k as keyof typeof keys] = 0))
  reset()
  return { client, calls, reset, close: () => unsubscribes.forEach((u) => u()) }
}

function start(client: QueryClient, overrides: Partial<Parameters<typeof startDashboardRealtime>[0]> = {}) {
  const factory = fakeSocketFactory()
  const statuses: RealtimeStatus[] = []
  let token = 'token-1'
  const stop = startDashboardRealtime({
    queryClient: client,
    url: 'http://api.test',
    path: '/socket.io',
    getToken: () => token,
    refreshToken: async () => null,
    onStatus: (s) => statuses.push(s),
    connect: factory.connect,
    ...overrides,
  })
  const socket = factory.sockets[0]
  return { socket, sockets: factory.sockets, statuses, stop, setToken: (t: string) => (token = t) }
}

const LIFECYCLE_EVENTS = ['connect', 'disconnect', 'connect_error']

describe('Phase 3: dashboard realtime', () => {
  beforeEach(() => mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 1_000_000 }))
  afterEach(() => mock.timers.reset())

  describe('connection and listener hygiene', () => {
    it('opens exactly one socket, websocket-only, presenting the current token on every (re)connect', async () => {
      const w = await queryWorld()
      const rt = start(w.client)
      assert.equal(rt.sockets.length, 1)
      assert.equal(rt.socket.url, 'http://api.test')
      assert.deepEqual(rt.socket.opts.transports, ['websocket'])
      const auth = rt.socket.opts.auth as (cb: (d: unknown) => void) => void
      let sent: unknown
      auth((d) => (sent = d))
      assert.deepEqual(sent, { token: 'token-1' })
      rt.setToken('token-2')
      auth((d) => (sent = d))
      assert.deepEqual(sent, { token: 'token-2' }, 'a reconnect uses the refreshed token')
      rt.stop()
      w.close()
    })

    it('registers each listener exactly once and never accumulates them across reconnects', async () => {
      const w = await queryWorld()
      const rt = start(w.client)
      for (const event of [...LIFECYCLE_EVENTS, ...DASHBOARD_SOCKET_EVENTS]) {
        assert.equal(rt.socket.listenerCount(event), 1, `one ${event} listener`)
      }
      for (let i = 0; i < 10; i++) {
        rt.socket.serverSends('disconnect', 'transport close')
        rt.socket.serverSends('connect')
      }
      for (const event of [...LIFECYCLE_EVENTS, ...DASHBOARD_SOCKET_EVENTS]) {
        assert.equal(rt.socket.listenerCount(event), 1, `still one ${event} listener after 10 reconnects`)
      }
      assert.equal(rt.socket.emitted.filter((e) => e.event === 'dashboard.subscribe').length, 10, 're-subscribes per connect')
      rt.stop()
      assert.equal(rt.socket.listenerCount(), 0, 'teardown removes every listener')
      assert.equal(rt.socket.disconnectCalls, 1)
      w.close()
    })

    it('shares one connection between holders and closes it with the last release (100 mount/unmount cycles)', () => {
      let opened = 0
      let closed = 0
      const startFn = () => {
        opened++
        return () => closed++
      }
      const a = acquireDashboardRealtime(startFn)
      const b = acquireDashboardRealtime(startFn)
      assert.equal(opened, 1, 'two holders, one connection')
      a()
      a() // a double cleanup must not close b's connection
      mock.timers.tick(1)
      assert.equal(closed, 0)
      b()
      assert.equal(closed, 0, 'closed on the next tick, not synchronously')
      mock.timers.tick(1)
      assert.equal(closed, 1)
      for (let i = 0; i < 100; i++) {
        const release = acquireDashboardRealtime(startFn)
        assert.equal(opened - closed, 1, 'never more than one open')
        release()
        mock.timers.tick(1)
      }
      assert.equal(opened, 101)
      assert.equal(closed, 101)
      assert.equal(getDashboardRealtimeState().status, 'offline')
    })

    it("StrictMode's mount → unmount → mount reuses the socket instead of opening a second", () => {
      let opened = 0
      let closed = 0
      const startFn = () => {
        opened++
        return () => closed++
      }
      const first = acquireDashboardRealtime(startFn)
      first() // StrictMode's simulated unmount
      const second = acquireDashboardRealtime(startFn) // and remount, same tick
      mock.timers.tick(1)
      assert.deepEqual({ opened, closed }, { opened: 1, closed: 0 })
      second()
      mock.timers.tick(1)
      assert.deepEqual({ opened, closed }, { opened: 1, closed: 1 })
    })
  })

  describe('status', () => {
    it('is live only after the server grants rooms; reconnecting on transport loss', async () => {
      const w = await queryWorld()
      const rt = start(w.client)
      rt.socket.serverSends('connect')
      assert.deepEqual(rt.statuses, ['live'])
      rt.socket.serverSends('disconnect', 'transport close')
      assert.equal(rt.statuses.at(-1), 'reconnecting')
      rt.socket.serverSends('disconnect', 'io server disconnect')
      assert.equal(rt.statuses.at(-1), 'offline', 'socket.io does not retry a server disconnect')
      rt.stop()
      w.close()
    })

    it('reports forbidden and closes the socket when the server refuses the rooms', async () => {
      const w = await queryWorld()
      const rt = start(w.client)
      rt.socket.subscribeAck = { ok: false, error: { code: 'ROOM_ACCESS_DENIED' } }
      rt.socket.serverSends('connect')
      assert.equal(rt.statuses.at(-1), 'forbidden')
      assert.equal(rt.socket.disconnectCalls, 1)
      rt.stop()
      w.close()
    })

    it('refreshes an expired token once, then reports unauthorized', async () => {
      const w = await queryWorld()
      let refreshes = 0
      const rt = start(w.client, { refreshToken: async () => (++refreshes === 1 ? 'fresh' : null) })
      rt.socket.active = false // socket.io marks a refused handshake inactive
      rt.socket.serverSends('connect_error', Object.assign(new Error('x'), { data: { code: 'SOCKET_UNAUTHENTICATED' } }))
      await flush()
      assert.equal(refreshes, 1)
      assert.equal(rt.socket.connectCalls, 1, 'reconnects with the refreshed token')
      rt.socket.active = false
      rt.socket.serverSends('connect_error', Object.assign(new Error('x'), { data: { code: 'SOCKET_UNAUTHENTICATED' } }))
      await flush()
      assert.equal(refreshes, 1, 'refreshes at most once per failed connection')
      assert.equal(rt.statuses.at(-1), 'unauthorized')
      rt.stop()
      w.close()
    })
  })

  describe('event → query invalidation (counted as real refetches)', () => {
    const cases: Array<[string, Record<string, unknown>, string[]]> = [
      ['dashboard.ride.changed', { rideId: 'r', status: 'ACCEPTED' }, ['overview', 'analytics', 'liveDrivers']],
      ['dashboard.ride.changed', { rideId: 'r', status: 'COMPLETED' }, ['overview', 'analytics', 'liveDrivers', 'activity']],
      ['dashboard.ride.changed', { rideId: 'r', status: 'CANCELLED' }, ['overview', 'analytics', 'liveDrivers', 'activity']],
      ['dashboard.ride_request.changed', { requestId: 'q', status: 'SEARCHING' }, ['overview']],
      ['dashboard.ride_request.changed', { requestId: 'q', status: 'ABANDONED' }, ['overview']],
      ['dashboard.ride_request.changed', { requestId: 'q', status: 'EXPIRED' }, ['overview', 'analytics']],
      ['dashboard.driver.status_changed', { driverId: 'd', status: 'ONLINE' }, ['overview', 'liveDrivers']],
      ['dashboard.driver.registration_changed', { driverId: 'd', change: 'VERIFIED' }, ['overview', 'activity']],
      ['dashboard.financials.changed', {}, ['financials', 'financialAnalytics']],
    ]
    for (const [event, data, expected] of cases) {
      it(`${event} ${JSON.stringify(data)} refetches exactly ${expected.join(', ')}`, async () => {
        const w = await queryWorld()
        const rt = start(w.client)
        rt.socket.serverSends('connect')
        rt.socket.serverSends(event, hint(data))
        await flush()
        const refetched = Object.entries(w.calls).filter(([, n]) => n > 0).map(([k]) => k).sort()
        assert.deepEqual(refetched, [...expected].sort())
        assert.ok(Object.values(w.calls).every((n) => n <= 1), 'one refetch each')
        rt.stop()
        w.close()
      })
    }

    it('unrelated or malformed events refetch nothing', async () => {
      const w = await queryWorld()
      const rt = start(w.client)
      rt.socket.serverSends('connect')
      for (const [event, payload] of [
        ['ride.completed', hint({ rideId: 'r' })],
        ['chat.message.new', hint({ rideId: 'r' })],
        ['connection.ready', { userId: 'u' }],
        ['dashboard.ride.changed', hint({ rideId: 'r', status: 'STARTED' })],
        ['dashboard.ride.changed', { rideId: 'r', status: 'COMPLETED' }],
        ['dashboard.driver.status_changed', hint({ driverId: 7, status: 'ONLINE' })],
      ] as const) {
        rt.socket.serverSends(event, payload)
        assert.equal(invalidationTargets(event, payload), null)
      }
      await flush()
      assert.deepEqual(Object.values(w.calls), [0, 0, 0, 0, 0, 0, 0])
      rt.stop()
      w.close()
    })

    it('never refetches health (no event source) or a finance query the user cannot read', async () => {
      const w = await queryWorld({ finance: false })
      const rt = start(w.client)
      rt.socket.serverSends('connect')
      for (const [event, data] of cases) rt.socket.serverSends(event, hint(data))
      await flush()
      assert.equal(w.calls.health, 0)
      assert.equal(w.calls.financials, 0)
      assert.equal(w.calls.financialAnalytics, 0)
      rt.stop()
      w.close()
    })

    it('collapses a burst: 50 ride completions in 1 s cost 2 overview refetches, not 50', async () => {
      const w = await queryWorld()
      const rt = start(w.client)
      rt.socket.serverSends('connect')
      for (let i = 0; i < 50; i++) {
        rt.socket.serverSends('dashboard.ride.changed', hint({ rideId: `r${i}`, status: 'COMPLETED' }))
        rt.socket.serverSends('dashboard.financials.changed', hint({}))
        mock.timers.tick(20)
      }
      await flush()
      assert.equal(w.calls.overview, 1, 'leading edge: the first hint refetches at once')
      mock.timers.tick(2_000)
      await flush()
      assert.equal(w.calls.overview, 2, 'trailing edge: one more for the rest of the burst')
      assert.equal(w.calls.financials, 1)
      mock.timers.tick(10_000)
      await flush()
      assert.equal(w.calls.financials, 2, 'financials: at most one refetch per 10 s')
      assert.equal(w.calls.financialAnalytics, 1)
      mock.timers.tick(60_000)
      await flush()
      assert.equal(w.calls.financialAnalytics, 2, 'financial series: at most one per 60 s')
      rt.stop()
      w.close()
    })

    it('resyncs every section once after a reconnect, but not on the first connect', async () => {
      const w = await queryWorld()
      const rt = start(w.client)
      rt.socket.serverSends('connect')
      await flush()
      assert.deepEqual(Object.values(w.calls), [0, 0, 0, 0, 0, 0, 0], 'first connect: data just loaded')
      rt.socket.serverSends('disconnect', 'transport close')
      rt.socket.serverSends('connect')
      await flush()
      assert.deepEqual(w.calls, {
        overview: 1,
        financials: 1,
        financialAnalytics: 1,
        analytics: 1,
        liveDrivers: 1,
        activity: 1,
        health: 0,
      })
      rt.stop()
      w.close()
    })

    it('a disconnect changes no data: last server values stay, nothing is refetched or zeroed', async () => {
      const w = await queryWorld()
      const before = w.client.getQueryData(dashboardKeys.overview())
      const rt = start(w.client)
      rt.socket.serverSends('connect')
      rt.socket.serverSends('disconnect', 'transport close')
      await flush()
      assert.deepEqual(w.client.getQueryData(dashboardKeys.overview()), before)
      assert.deepEqual(Object.values(w.calls), [0, 0, 0, 0, 0, 0, 0])
      assert.equal(rt.statuses.at(-1), 'reconnecting')
      rt.stop()
      w.close()
    })

    it('teardown cancels pending refetches', async () => {
      const w = await queryWorld()
      const rt = start(w.client)
      rt.socket.serverSends('connect')
      rt.socket.serverSends('dashboard.driver.status_changed', hint({ driverId: 'd', status: 'ONLINE' }))
      rt.socket.serverSends('dashboard.driver.status_changed', hint({ driverId: 'd', status: 'OFFLINE' }))
      rt.stop()
      mock.timers.tick(5_000)
      await flush()
      assert.equal(w.calls.overview, 1, 'only the leading refetch; the trailing one was cancelled')
      w.close()
    })
  })
})

// Keep FakeSocket referenced for type-only consumers.
export type { FakeSocket }
