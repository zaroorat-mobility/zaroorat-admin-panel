/**
 * Dashboard realtime: one Socket.IO connection to the existing backend gateway, joined to
 * the admin dashboard rooms the server grants on `dashboard.subscribe` (operations:read →
 * dashboard:ops, finance:read → dashboard:finance, checked server-side).
 *
 * Server events are invalidation hints only (ids and statuses, never numbers). Every value
 * on the dashboard is still re-read from the permission-checked REST API, so a lost or
 * duplicated hint can delay a refresh but never put a wrong number on screen.
 */
import { useEffect, useSyncExternalStore } from 'react'
import { io, type ManagerOptions, type Socket, type SocketOptions } from 'socket.io-client'
import { useQueryClient, type QueryClient, type QueryKey } from '@tanstack/react-query'
import { z } from 'zod'
import { APP_CONFIG } from '@/app/config'
import { refreshSession } from '@/infrastructure/auth/session-refresh'
import { useAuthStore } from '@/store/auth.store'
import { dashboardKeys } from './hooks'

/** Server → client hint events (backend `SOCKET_EVENT.DASHBOARD_*`). */
export const DASHBOARD_SOCKET_EVENTS = [
  'dashboard.ride.changed',
  'dashboard.ride_request.changed',
  'dashboard.driver.status_changed',
  'dashboard.driver.registration_changed',
  'dashboard.financials.changed',
] as const

export type RealtimeStatus = 'connecting' | 'live' | 'reconnecting' | 'offline' | 'unauthorized' | 'forbidden'

export interface RealtimeState {
  status: RealtimeStatus
  /** Rooms the server granted on the last successful subscribe. */
  rooms: string[]
}

// ─── Event → query invalidation matrix ───────────────────────────────────────

export type InvalidationTarget =
  | 'overview'
  | 'analytics'
  | 'liveDrivers'
  | 'activity'
  | 'financials'
  | 'financialAnalytics'

/** The query prefix each target invalidates, and the minimum spacing between two refetches. */
export const INVALIDATION_TARGETS: Record<InvalidationTarget, { queryKey: QueryKey; minIntervalMs: number }> = {
  overview: { queryKey: dashboardKeys.overview(), minIntervalMs: 2_000 },
  analytics: { queryKey: dashboardKeys.analytics(), minIntervalMs: 2_000 },
  liveDrivers: { queryKey: [...dashboardKeys.all, 'live-drivers'], minIntervalMs: 2_000 },
  activity: { queryKey: [...dashboardKeys.all, 'activity'], minIntervalMs: 2_000 },
  // ~0.2 s of SQL at 200k rides (Phase 2 §11): a burst of completions refetches at most every 10 s
  financials: { queryKey: dashboardKeys.financials(), minIntervalMs: 10_000 },
  // the 90-day series costs ~0.4–0.6 s and only today's bucket can move
  financialAnalytics: { queryKey: [...dashboardKeys.all, 'financial-analytics'], minIntervalMs: 60_000 },
}

const envelope = <T extends z.ZodRawShape>(data: T) =>
  z.object({ eventId: z.string(), occurredAt: z.string(), data: z.object(data) })

const rideChanged = envelope({ rideId: z.string(), status: z.enum(['ACCEPTED', 'COMPLETED', 'CANCELLED']) })
const requestChanged = envelope({ requestId: z.string(), status: z.enum(['SEARCHING', 'EXPIRED', 'ABANDONED']) })
const driverStatusChanged = envelope({ driverId: z.string(), status: z.enum(['ONLINE', 'OFFLINE']) })
const driverRegistrationChanged = envelope({ driverId: z.string(), change: z.enum(['ONBOARDED', 'VERIFIED']) })
const financialsChanged = envelope({})

/**
 * The queries a server event makes stale; null for an unknown event or a payload that fails
 * validation (nothing is refetched on a message the dashboard cannot vouch for).
 */
export function invalidationTargets(event: string, payload: unknown): InvalidationTarget[] | null {
  switch (event) {
    case 'dashboard.ride.changed': {
      const p = rideChanged.safeParse(payload)
      if (!p.success) return null
      // Accepted: ongoing rides, today's rides and the driver's status move.
      // Completed / cancelled also add an activity item.
      return p.data.data.status === 'ACCEPTED'
        ? ['overview', 'analytics', 'liveDrivers']
        : ['overview', 'analytics', 'liveDrivers', 'activity']
    }
    case 'dashboard.ride_request.changed': {
      const p = requestChanged.safeParse(payload)
      if (!p.success) return null
      // Every request moves in-flight riders; only an expiry is a "No Driver Found" outcome.
      return p.data.data.status === 'EXPIRED' ? ['overview', 'analytics'] : ['overview']
    }
    case 'dashboard.driver.status_changed':
      return driverStatusChanged.safeParse(payload).success ? ['overview', 'liveDrivers'] : null
    case 'dashboard.driver.registration_changed':
      return driverRegistrationChanged.safeParse(payload).success ? ['overview', 'activity'] : null
    case 'dashboard.financials.changed':
      return financialsChanged.safeParse(payload).success ? ['financials', 'financialAnalytics'] : null
    default:
      return null
  }
}

// ─── Connection ──────────────────────────────────────────────────────────────

type SocketFactory = (url: string, opts: Partial<ManagerOptions & SocketOptions>) => Socket

/** socket.io-client `io`. Tests replace it so a mounted page never touches the network. */
export const socketFactory: { connect: SocketFactory } = { connect: io }

type SubscribeAck = { ok: boolean; rooms?: string[]; error?: { code?: string } }

export interface DashboardRealtimeOptions {
  queryClient: QueryClient
  url: string
  path: string
  getToken: () => string | null
  refreshToken: () => Promise<string | null>
  onStatus: (status: RealtimeStatus, rooms: string[]) => void
  /** Defaults to `socketFactory.connect`. */
  connect?: SocketFactory
}

/** Opens the connection and returns its teardown, which removes every listener it added. */
export function startDashboardRealtime(o: DashboardRealtimeOptions): () => void {
  const socket = (o.connect ?? socketFactory.connect)(o.url, {
    path: o.path,
    // WebSocket only: long-polling would need sticky sessions across API instances.
    transports: ['websocket'],
    // Called on every (re)connect, so a reconnect presents the current access token.
    auth: (cb) => cb({ token: o.getToken() ?? '' }),
  })
  let subscribedBefore = false
  let triedRefresh = false
  const lastRun = new Map<InvalidationTarget, number>()
  const pending = new Map<InvalidationTarget, ReturnType<typeof setTimeout>>()

  const run = (target: InvalidationTarget) => {
    lastRun.set(target, Date.now())
    void o.queryClient.invalidateQueries({ queryKey: INVALIDATION_TARGETS[target].queryKey })
  }
  // Leading + trailing throttle per target: the first hint refetches at once; a burst
  // inside the window collapses into one more refetch when the window ends.
  const schedule = (target: InvalidationTarget) => {
    if (pending.has(target)) return
    const wait = (lastRun.get(target) ?? -Infinity) + INVALIDATION_TARGETS[target].minIntervalMs - Date.now()
    if (wait <= 0) return run(target)
    pending.set(
      target,
      setTimeout(() => {
        pending.delete(target)
        run(target)
      }, wait),
    )
  }

  const handlers: Record<string, (...args: never[]) => void> = {
    connect: () => {
      triedRefresh = false
      socket.emit('dashboard.subscribe', {}, (res: SubscribeAck | undefined) => {
        if (res?.ok) {
          // Hints sent while disconnected are lost: re-read every section once, as the
          // gateway's resync rule asks. Not on the first connect, when all just loaded.
          if (subscribedBefore) for (const t of Object.keys(INVALIDATION_TARGETS)) schedule(t as InvalidationTarget)
          subscribedBefore = true
          o.onStatus('live', res.rooms ?? [])
        } else if (res?.error?.code === 'ROOM_ACCESS_DENIED') {
          o.onStatus('forbidden', [])
          socket.disconnect()
        } else {
          o.onStatus('offline', [])
        }
      })
    },
    disconnect: (reason: string) => {
      // Our own teardown, or a refusal that already set its status.
      if (reason === 'io client disconnect') return
      // socket.io retries every loss except a server-initiated disconnect.
      o.onStatus(reason === 'io server disconnect' ? 'offline' : 'reconnecting', [])
    },
    connect_error: (err: Error & { data?: { code?: string } }) => {
      // Transport failure: socket.io keeps retrying with backoff.
      if (socket.active) return o.onStatus('reconnecting', [])
      // The server refused the handshake, which socket.io never retries. An expired
      // access token is refreshed once; anything else stops here.
      const unauthenticated = err.data?.code === 'SOCKET_UNAUTHENTICATED'
      if (!unauthenticated || triedRefresh) return o.onStatus(unauthenticated ? 'unauthorized' : 'offline', [])
      triedRefresh = true
      void o.refreshToken().then((token) => (token ? socket.connect() : o.onStatus('unauthorized', [])))
    },
  }
  for (const event of DASHBOARD_SOCKET_EVENTS) {
    handlers[event] = (payload: unknown) => {
      for (const target of invalidationTargets(event, payload) ?? []) schedule(target)
      if (event === 'dashboard.ride.changed') {
        void o.queryClient.invalidateQueries({ queryKey: ['operations', 'rides'] })
        void o.queryClient.invalidateQueries({ queryKey: ['operations', 'live'] })
        const p = rideChanged.safeParse(payload)
        if (p.success && p.data.data.rideId) {
          void o.queryClient.invalidateQueries({ queryKey: ['operations', 'ride', p.data.data.rideId] })
        }
      } else if (event === 'dashboard.ride_request.changed') {
        void o.queryClient.invalidateQueries({ queryKey: ['operations', 'dispatch'] })
        void o.queryClient.invalidateQueries({ queryKey: ['operations', 'live'] })
      }
    }
  }
  for (const [event, handler] of Object.entries(handlers)) socket.on(event, handler as (...args: any[]) => void)

  return () => {
    for (const timer of pending.values()) clearTimeout(timer)
    pending.clear()
    for (const [event, handler] of Object.entries(handlers)) socket.off(event, handler as (...args: any[]) => void)
    socket.disconnect()
  }
}

// ─── Shared connection + React hook ──────────────────────────────────────────

let state: RealtimeState = { status: 'offline', rooms: [] }
const stateListeners = new Set<() => void>()
const setState = (status: RealtimeStatus, rooms: string[]) => {
  state = { status, rooms }
  stateListeners.forEach((listener) => listener())
}
const subscribeState = (listener: () => void) => {
  stateListeners.add(listener)
  return () => {
    stateListeners.delete(listener)
  }
}
export const getDashboardRealtimeState = (): RealtimeState => state

let refs = 0
let teardown: (() => void) | null = null
let closing: ReturnType<typeof setTimeout> | null = null

/**
 * One connection however many components hold it: the first acquire opens it, the last
 * release closes it on the next tick, so an immediate re-acquire (StrictMode's mount →
 * unmount → mount, a quick route bounce) keeps the same socket instead of opening a
 * second one. Releasing twice is a no-op, so a double cleanup cannot close a connection
 * another holder still uses.
 */
export function acquireDashboardRealtime(
  start: (onStatus: DashboardRealtimeOptions['onStatus']) => () => void,
): () => void {
  if (closing) {
    clearTimeout(closing)
    closing = null
  } else if (refs === 0) {
    setState('connecting', [])
    teardown = start(setState)
  }
  refs++
  let released = false
  return () => {
    if (released) return
    released = true
    if (--refs > 0) return
    closing = setTimeout(() => {
      closing = null
      teardown?.()
      teardown = null
      setState('offline', [])
    }, 0)
  }
}

/** Connection state for the dashboard; null when the user holds no dashboard permission. */
export function useDashboardRealtime(enabled: boolean): RealtimeState | null {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (!enabled) return
    return acquireDashboardRealtime((onStatus) =>
      startDashboardRealtime({
        queryClient,
        url: new URL(APP_CONFIG.api.baseUrl, window.location.origin).origin,
        path: APP_CONFIG.realtime.path,
        getToken: () => useAuthStore.getState().token,
        refreshToken: () => refreshSession({ force: true }),
        onStatus,
      }),
    )
  }, [enabled, queryClient])
  const current = useSyncExternalStore(subscribeState, getDashboardRealtimeState, getDashboardRealtimeState)
  return enabled ? current : null
}
