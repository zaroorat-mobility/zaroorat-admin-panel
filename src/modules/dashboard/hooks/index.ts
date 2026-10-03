import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import DashboardService, { serializeViewport } from '../services'
import type {
  DashboardOverview,
  DashboardFinancials,
  DashboardAnalytics,
  DashboardFinancialAnalytics,
  AnalyticsRange,
  DashboardLiveDriversResponse,
  LiveDriversParams,
  DashboardActivityResponse,
  DashboardActivityParams,
  DashboardHealth,
  DashboardErrorStatus,
} from '../types'

// ─── Query Keys Factory ──────────────────────────────────────────────────────

export const dashboardKeys = {
  all: ['dashboard'] as const,
  overview: () => [...dashboardKeys.all, 'overview'] as const,
  financials: () => [...dashboardKeys.all, 'financials'] as const,
  analytics: () => [...dashboardKeys.all, 'analytics'] as const,
  financialAnalytics: (range: AnalyticsRange = '7d') =>
    [...dashboardKeys.all, 'financial-analytics', range] as const,
  liveDrivers: (params: LiveDriversParams = {}) =>
    [
      ...dashboardKeys.all,
      'live-drivers',
      {
        ...params,
        viewport: serializeViewport(params.viewport),
      },
    ] as const,
  activity: (params: DashboardActivityParams = {}) =>
    [...dashboardKeys.all, 'activity', params] as const,
  activityInfinite: (params: Omit<DashboardActivityParams, 'cursor'> = {}) =>
    [...dashboardKeys.all, 'activity', 'infinite', params] as const,
  health: () => [...dashboardKeys.all, 'health'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
}

// ─── Error helpers ───────────────────────────────────────────────────────────

/**
 * HTTP status of a failed dashboard request, or 'timeout' / 'network' when no response
 * arrived. The shared axios interceptor rethrows a plain Error carrying `status` and the
 * axios `code` (no `.response`), so both shapes are read.
 */
export function errorStatus(error: unknown): DashboardErrorStatus | undefined {
  const e = error as { status?: number; code?: string; response?: { status?: number } } | null | undefined
  const status = e?.status ?? e?.response?.status
  if (status !== undefined) return status
  if (e?.code === 'ECONNABORTED' || e?.code === 'ETIMEDOUT') return 'timeout'
  if (e?.code === 'ERR_NETWORK') return 'network'
  return undefined
}

/**
 * A failure a second attempt can fix: timeout, network loss, 408, 429 or 5xx.
 * 400 (validation), 401, 403 and 404 answer the same way every time.
 */
export function isTransientError(error: unknown): boolean {
  const s = errorStatus(error)
  return s === 'timeout' || s === 'network' || s === 408 || s === 429 || (typeof s === 'number' && s >= 500)
}

/** Retry policy for every dashboard query: one retry, transient failures only. */
export const dashboardRetry = (failureCount: number, error: unknown): boolean =>
  failureCount < 1 && isTransientError(error)

/** Adds `isForbidden`: the permission is missing client-side, or the backend answered 403. */
function withForbidden<T extends { error: unknown }>(query: T, canRead: boolean) {
  return { ...query, isForbidden: !canRead || errorStatus(query.error) === 403 }
}

// ─── Options Interfaces ──────────────────────────────────────────────────────

export interface QueryHookOptions {
  enabled?: boolean
  refetchInterval?: number | false
}

// ─── 1. Overview Hook ────────────────────────────────────────────────────────

/**
 * Real-time operational overview KPIs (active drivers, ongoing rides, in-flight riders, verifications).
 * Stale time: 30s. Polling is disabled by default; pass refetchInterval if desired.
 */
export const useDashboardOverview = (options?: QueryHookOptions) => {
  const user = useAuthStore((state) => state.user)
  const canReadOps = hasPermission(user, 'operations:read')
  const isEnabled = (options?.enabled ?? true) && canReadOps

  return withForbidden(
    useQuery<DashboardOverview, Error>({
      queryKey: dashboardKeys.overview(),
      queryFn: () => DashboardService.getOverview(),
      retry: dashboardRetry,
      enabled: isEnabled,
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: options?.refetchInterval ?? false,
      refetchIntervalInBackground: false,
    }),
    canReadOps,
  )
}

// ─── 2. Financials Hook ──────────────────────────────────────────────────────

export interface FinancialsQueryHookResult {
  isForbidden: boolean
}

/**
 * Operational financial metrics (Platform Revenue, Gross Ride Value, Driver Collections).
 * Requires permission: finance:read.
 * Gracefully exposes isForbidden when the user lacks financial permissions.
 */
export const useDashboardFinancials = (options?: QueryHookOptions) => {
  const user = useAuthStore((state) => state.user)
  const canReadFinance = hasPermission(user, 'finance:read')
  const isEnabled = (options?.enabled ?? true) && canReadFinance

  const query = useQuery<DashboardFinancials, Error>({
    queryKey: dashboardKeys.financials(),
    queryFn: () => DashboardService.getFinancials(),
    enabled: isEnabled,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: options?.refetchInterval ?? false,
    refetchIntervalInBackground: false,
    retry: dashboardRetry,
  })

  return withForbidden(query, canReadFinance)
}

// ─── 3. Analytics Hook ───────────────────────────────────────────────────────

/**
 * Today's ride outcome distribution and rides by hour (Asia/Kolkata).
 * Requires permission: operations:read. Stale time: 5 minutes.
 */
export const useDashboardAnalytics = (options?: Omit<QueryHookOptions, 'refetchInterval'>) => {
  const user = useAuthStore((state) => state.user)
  const canReadOps = hasPermission(user, 'operations:read')
  const isEnabled = (options?.enabled ?? true) && canReadOps

  return withForbidden(
    useQuery<DashboardAnalytics, Error>({
      queryKey: dashboardKeys.analytics(),
      queryFn: () => DashboardService.getAnalytics(),
      retry: dashboardRetry,
      enabled: isEnabled,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    }),
    canReadOps,
  )
}

/**
 * Daily platform revenue and gross ride value series (7d, 30d, 90d) in Asia/Kolkata days.
 * Requires permission: finance:read. Stale time: 5 minutes; range-aware cache keys.
 */
export const useDashboardFinancialAnalytics = (
  range: AnalyticsRange = '7d',
  options?: Omit<QueryHookOptions, 'refetchInterval'>,
) => {
  const user = useAuthStore((state) => state.user)
  const canReadFinance = hasPermission(user, 'finance:read')
  const isEnabled = (options?.enabled ?? true) && canReadFinance

  return withForbidden(
    useQuery<DashboardFinancialAnalytics, Error>({
      queryKey: dashboardKeys.financialAnalytics(range),
      queryFn: () => DashboardService.getFinancialAnalytics(range),
      enabled: isEnabled,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: dashboardRetry,
    }),
    canReadFinance,
  )
}

// ─── 4. Live Drivers Hook ────────────────────────────────────────────────────

/**
 * Real-time driver telemetry streaming with bounding box viewport support, mode filter,
 * and GPS freshness tracking.
 * Stale time: 10s. Controlled refetch interval (default 15s when active).
 */
export const useLiveDrivers = (
  params: LiveDriversParams = {},
  options?: QueryHookOptions,
) => {
  const user = useAuthStore((state) => state.user)
  const canReadOps = hasPermission(user, 'operations:read')
  const isEnabled = (options?.enabled ?? true) && canReadOps

  return withForbidden(
    useQuery<DashboardLiveDriversResponse, Error>({
      queryKey: dashboardKeys.liveDrivers(params),
      queryFn: () => DashboardService.getLiveDrivers(params),
      retry: dashboardRetry,
      enabled: isEnabled,
      staleTime: 10 * 1000, // 10 seconds
      refetchInterval: options?.refetchInterval !== undefined ? options.refetchInterval : 15 * 1000,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
    }),
    canReadOps,
  )
}

// ─── 5. Activity Feed Hooks ──────────────────────────────────────────────────

/**
 * Single-page operational activity query with cursor and type filter.
 */
export const useDashboardActivity = (
  params: DashboardActivityParams = {},
  options?: QueryHookOptions,
) => {
  const user = useAuthStore((state) => state.user)
  const canReadOps = hasPermission(user, 'operations:read')
  const isEnabled = (options?.enabled ?? true) && canReadOps

  return withForbidden(
    useQuery<DashboardActivityResponse, Error>({
      queryKey: dashboardKeys.activity(params),
      queryFn: () => DashboardService.getActivity(params),
      retry: dashboardRetry,
      enabled: isEnabled,
      staleTime: 20 * 1000, // 20 seconds
      refetchInterval: options?.refetchInterval ?? false,
      refetchIntervalInBackground: false,
    }),
    canReadOps,
  )
}

/**
 * Infinite scrolling operational activity query leveraging backend cursor pagination.
 */
export const useDashboardActivityInfinite = (
  params: Omit<DashboardActivityParams, 'cursor'> = {},
  options?: { enabled?: boolean },
) => {
  const user = useAuthStore((state) => state.user)
  const canReadOps = hasPermission(user, 'operations:read')
  const isEnabled = (options?.enabled ?? true) && canReadOps

  return useInfiniteQuery<DashboardActivityResponse, Error>({
    queryKey: dashboardKeys.activityInfinite(params),
    queryFn: ({ pageParam }) =>
      DashboardService.getActivity({
        ...params,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined,
    retry: dashboardRetry,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: isEnabled,
    staleTime: 20 * 1000,
    refetchIntervalInBackground: false,
  })
}

// ─── 6. System Health Hook ───────────────────────────────────────────────────

/**
 * System infrastructure health probe (DB, Redis, Socket.IO, GPS, Notifications).
 * Stale time: 15s. Controlled periodic refresh: 30s.
 */
export const useDashboardHealth = (options?: QueryHookOptions) => {
  const user = useAuthStore((state) => state.user)
  const canReadOps = hasPermission(user, 'operations:read')
  const isEnabled = (options?.enabled ?? true) && canReadOps

  return withForbidden(
    useQuery<DashboardHealth, Error>({
      queryKey: dashboardKeys.health(),
      queryFn: () => DashboardService.getHealth(),
      retry: dashboardRetry,
      enabled: isEnabled,
      staleTime: 15 * 1000, // 15 seconds
      refetchInterval: options?.refetchInterval !== undefined ? options.refetchInterval : 30 * 1000,
      refetchIntervalInBackground: false,
    }),
    canReadOps,
  )
}
