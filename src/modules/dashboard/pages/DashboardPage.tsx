import React, { useState } from 'react'
import { RefreshCw, Download } from 'lucide-react'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { Button } from '@/shared/components/ui/Button'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import {
  useDashboardOverview,
  useDashboardFinancials,
  useDashboardAnalytics,
  useDashboardFinancialAnalytics,
  useLiveDrivers,
  useDashboardActivity,
  useDashboardHealth,
  errorStatus,
} from '../hooks'
import { useDashboardRealtime } from '../realtime'
import type { AnalyticsRange } from '../types'
import {
  OperationalKpis,
  FinancialKpis,
  PlatformRevenueAreaChart,
  GrossRideValueAreaChart,
  RideStatusDonutChart,
  RidesByHourBarChart,
  LiveOperationsMapSection,
  LiveDriversTable,
  RecentActivityTimeline,
  SystemHealthSection,
  RealtimeStatusBadge,
} from '../components'

export const DashboardPage: React.FC = () => {
  const [analyticsRange, setAnalyticsRange] = useState<AnalyticsRange>('7d')
  const user = useAuthStore((state) => state.user)

  // One socket for the page; the server grants rooms from operations:read / finance:read.
  // Its hints invalidate specific queries (see realtime.ts); nothing is ever read from it.
  const realtime = useDashboardRealtime(
    hasPermission(user, 'operations:read') || hasPermission(user, 'finance:read'),
  )

  // Real React Query data hooks; each exposes isForbidden (missing permission or backend 403)
  const overview = useDashboardOverview()
  const financials = useDashboardFinancials()
  const financialAnalytics = useDashboardFinancialAnalytics(analyticsRange)
  const analytics = useDashboardAnalytics()
  // 200 = backend maximum, so the map is not silently cut at the default 50
  const liveDrivers = useLiveDrivers({ limit: 200 })
  const activity = useDashboardActivity({ limit: 10 })
  const health = useDashboardHealth()

  // Coordinated manual refresh; forbidden sections are skipped (the request would only 403)
  const handleRefreshAll = () => {
    for (const q of [overview, financials, financialAnalytics, analytics, liveDrivers, activity, health]) {
      if (!q.isForbidden) q.refetch()
    }
  }

  // Revenue and ride-value series (finance:read)
  const financialAnalyticsState = {
    isLoading: financialAnalytics.isLoading,
    isError: financialAnalytics.isError,
    isForbidden: financialAnalytics.isForbidden,
    errorStatus: errorStatus(financialAnalytics.error),
    onRetry: financialAnalytics.refetch,
  }

  // Today's ride outcomes and rides by hour (operations:read)
  const analyticsState = {
    isLoading: analytics.isLoading,
    isError: analytics.isError,
    isForbidden: analytics.isForbidden,
    errorStatus: errorStatus(analytics.error),
    onRetry: analytics.refetch,
  }

  const liveDriversState = {
    isLoading: liveDrivers.isLoading,
    isError: liveDrivers.isError,
    isForbidden: liveDrivers.isForbidden,
    errorStatus: errorStatus(liveDrivers.error),
    onRetry: liveDrivers.refetch,
  }

  return (
    <PageWrapper className="max-w-[1720px] w-full">
      {/* ─── DASHBOARD HEADER ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5 text-left">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Operations Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time overview of rides, drivers, revenue and platform health.
          </p>
          <div className="mt-1.5">
            <RealtimeStatusBadge state={realtime} />
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            loading={overview.isFetching}
            className="text-xs font-semibold"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${overview.isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {/* Export Report Action */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.print()}
            className="text-xs font-bold shadow-xs bg-primary hover:bg-primary-hover"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="space-y-6 pt-5 text-left">
        {/* ─── SECTION A: OPERATIONAL KPIS ─────────────────────────────────── */}
        <section aria-label="Operational KPIs">
          <OperationalKpis
            overview={overview.data}
            isLoading={overview.isLoading}
            isError={overview.isError}
            isForbidden={overview.isForbidden}
            errorStatus={errorStatus(overview.error)}
            onRetry={overview.refetch}
          />
        </section>

        {/* ─── SECTION B: FINANCIAL KPIS ───────────────────────────────────── */}
        <section aria-label="Financial KPIs">
          <FinancialKpis
            financials={financials.data}
            isLoading={financials.isLoading}
            isError={financials.isError}
            isForbidden={financials.isForbidden}
            errorStatus={errorStatus(financials.error)}
            onRetry={financials.refetch}
          />
        </section>

        {/* ─── SECTION C: ANALYTICS & STATUS DISTRIBUTION ──────────────────── */}
        <section aria-label="Operational Analytics" className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Revenue Chart (Last 7/30/90 Days) */}
          <PlatformRevenueAreaChart
            data={financialAnalytics.data?.platformRevenueTrend}
            range={analyticsRange}
            onRangeChange={setAnalyticsRange}
            {...financialAnalyticsState}
          />

          {/* Gross Ride Value Chart */}
          <GrossRideValueAreaChart
            data={financialAnalytics.data?.grossRideValueTrend}
            range={analyticsRange}
            onRangeChange={setAnalyticsRange}
            {...financialAnalyticsState}
          />

          {/* Ride Status Distribution Donut */}
          <RideStatusDonutChart
            distribution={analytics.data?.rideStatusDistribution}
            {...analyticsState}
          />
        </section>

        {/* ─── SECTION D: LIVE OPERATIONS MAP, DRIVERS & ACTIVITY ───────────── */}
        <section aria-label="Live Telemetry" className="grid grid-cols-1 xl:grid-cols-[3.6fr_5.8fr_2.6fr] gap-4 items-stretch">
          {/* Live Operations Map */}
          <div className="h-full flex flex-col min-w-0">
            <LiveOperationsMapSection
              drivers={liveDrivers.data?.drivers}
              onlineCount={liveDrivers.data?.onlineCount}
              onTripCount={liveDrivers.data?.onTripCount}
              busyCount={liveDrivers.data?.busyCount}
              breakCount={liveDrivers.data?.breakCount}
              offlineCount={liveDrivers.data?.offlineCount}
              gpsStaleAfterSec={liveDrivers.data?.gpsStaleAfterSec}
              dataUpdatedAt={liveDrivers.dataUpdatedAt || undefined}
              {...liveDriversState}
            />
          </div>

          {/* Live Drivers & Vehicles Table */}
          <div className="h-full flex flex-col min-w-0">
            <LiveDriversTable
              drivers={liveDrivers.data?.drivers}
              onlineCount={liveDrivers.data?.onlineCount}
              {...liveDriversState}
            />
          </div>

          {/* Recent Activity Timeline */}
          <div className="h-full flex flex-col min-w-0">
            <RecentActivityTimeline
              activities={activity.data?.activities}
              isLoading={activity.isLoading}
              isError={activity.isError}
              isForbidden={activity.isForbidden}
              errorStatus={errorStatus(activity.error)}
              onRetry={activity.refetch}
            />
          </div>
        </section>

        {/* ─── SECTION E: SYSTEM HEALTH & HOURLY PATTERNS ──────────────────── */}
        <section aria-label="System Infrastructure & Hourly Pattern" className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
          {/* System Health Panel - 8 columns (66.7% width) holding 6 sub-cards side by side */}
          <div className="xl:col-span-8 flex flex-col">
            <SystemHealthSection
              health={health.data}
              isLoading={health.isLoading}
              isError={health.isError}
              isForbidden={health.isForbidden}
              errorStatus={errorStatus(health.error)}
              onRetry={health.refetch}
            />
          </div>

          {/* Rides by Hour (Today) - 4 columns (33.3% width) */}
          <div className="xl:col-span-4 flex flex-col">
            <RidesByHourBarChart
              data={analytics.data?.ridesByHour}
              {...analyticsState}
            />
          </div>
        </section>
      </div>
    </PageWrapper>
  )
}

export default DashboardPage
