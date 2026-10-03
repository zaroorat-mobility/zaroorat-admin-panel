/**
 * Dashboard data-integrity tests (Phase 1).
 *
 * Renders the real section components to HTML with react-dom/server and asserts that
 * zero, empty, missing, forbidden and error states show exactly that — never demo data.
 * Uses the real DTO types, so a contract drift fails type-checking.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { OperationalKpis } from '../components/OperationalKpis'
import { FinancialKpis } from '../components/FinancialKpis'
import { PlatformRevenueAreaChart } from '../components/PlatformRevenueAreaChart'
import { GrossRideValueAreaChart } from '../components/GrossRideValueAreaChart'
import { RideStatusDonutChart } from '../components/RideStatusDonutChart'
import { RidesByHourBarChart } from '../components/RidesByHourBarChart'
import { SystemHealthSection } from '../components/SystemHealthSection'
import { LiveDriversTable } from '../components/LiveDriversTable'
import { RecentActivityTimeline } from '../components/RecentActivityTimeline'
import { errorStatus } from '../hooks'
import type {
  DashboardOverview,
  DashboardFinancials,
  PlatformRevenueTrend,
  GrossRideValueTrend,
  RideStatusDistribution,
  RideHourDistribution,
  DashboardHealth,
  LiveDriver,
  DashboardActivity,
} from '../types'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Visible text of a rendered element, whitespace-collapsed. */
function text(el: ReactElement): string {
  return renderToStaticMarkup(el)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function assertNoneOf(output: string, forbidden: string[]) {
  for (const s of forbidden) assert.ok(!output.includes(s), `rendered output must not contain "${s}": ${output}`)
}

// ─── Fixtures: real DTO shapes, zero-valued as the backend returns them ──────

const zeroOverview: DashboardOverview = {
  activeDrivers: 0,
  activeDriversChangePct: 0,
  onlineDrivers: 0,
  onlineDriversPctOfActive: 0,
  ongoingRides: 0,
  ongoingRidesChangePct: 0,
  inFlightRiders: 0,
  completedRidesToday: 0,
  completedRidesYesterday: 0,
  completedRidesChangePct: 0,
  pendingVerifications: 0,
  pendingVerificationsChangePct: 0,
  registeredDrivers: 0,
  calculatedAt: '2026-09-29T06:00:00.000Z',
}

const zeroFinancials: DashboardFinancials = {
  platformRevenueToday: 0,
  platformRevenueYesterday: 0,
  platformRevenueChangePct: 0,
  grossRideValueToday: 0,
  grossRideValueYesterday: 0,
  grossRideValueChangePct: 0,
  driverRideCollectionsToday: 0,
  driverRideCollectionsYesterday: 0,
  driverRideCollectionsChangePct: 0,
  currency: 'INR',
  reportingTimeZone: 'Asia/Kolkata',
  calculatedAt: '2026-09-29T06:00:00.000Z',
}

const days = ['2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27', '2026-09-28', '2026-09-29']

const zeroRevenueTrend: PlatformRevenueTrend[] = days.map((dateKey) => ({
  date: dateKey,
  dayOfWeek: 'Mon',
  dateKey,
  platformRevenue: 0,
  rideCommission: 0,
  subscriptionRevenue: 0,
  platformFees: 0,
}))

const zeroGrossTrend: GrossRideValueTrend[] = days.map((dateKey) => ({
  date: dateKey,
  dayOfWeek: 'Mon',
  dateKey,
  grossRideValue: 0,
  ridesCount: 0,
}))

const zeroDistribution: RideStatusDistribution = {
  total: 0,
  completed: 0,
  completedPct: 0,
  cancelled: 0,
  cancelledPct: 0,
  noDriversFound: 0,
  noDriversFoundPct: 0,
  ongoing: 0,
  ongoingPct: 0,
}

const zeroHours: RideHourDistribution[] = Array.from({ length: 24 }, (_, hour) => ({
  hour,
  label: `${hour}`,
  count: 0,
  isPeak: false,
}))

const baseHealth: DashboardHealth = {
  databaseLatencyMs: 12,
  databaseStatus: 'HEALTHY',
  websocketConnections: 5,
  websocketStatus: 'HEALTHY',
  redisStatus: 'HEALTHY',
  failedQueueJobs: 0,
  notificationSuccessRate: 97.5,
  notificationStatus: 'HEALTHY',
  gpsFreshnessSec: 4,
  gpsFreshnessStatus: 'LIVE',
  paymentFailureRate24h: 0,
  paymentFailureStatus: 'HEALTHY',
  overallStatus: 'HEALTHY',
  timestamp: '2026-09-29T06:00:00.000Z',
}

const noop = () => {}
const chartProps = { range: '7d' as const, onRangeChange: noop }

// Every value that appeared in the removed TARGET_* datasets.
const DEMO_OVERVIEW = ['842', '621', '198', '2,841', '2,401', '1,240', '74%', '12%', '11%', '18%', '24%', '↑ 8%']
const DEMO_FINANCIALS = ['4,28,650', '28,45,320', '26,98,140', '16%', '20%']
const DEMO_HEALTH = ['124 ms', '3,842', '99.2%', '1.8 sec', '0.12%', '28%', '32%', '40%']

describe('Dashboard data integrity: zero stays zero, never demo data', () => {
  it('TEST 1: overview with activeDrivers = 0 and completedRidesToday = 0 shows 0, not 842', () => {
    const out = text(createElement(OperationalKpis, { overview: zeroOverview }))
    for (const label of ['Active Drivers', 'Online Drivers', 'Ongoing Rides', 'Completed Rides Today', 'Pending Verifications']) {
      assert.ok(out.includes(`${label} 0 `), `${label} must render 0: ${out}`)
    }
    assert.ok(out.includes('of 0 registered'))
    assert.ok(out.includes('vs 0 by this time yesterday'))
    assertNoneOf(out, DEMO_OVERVIEW)
  })

  it('real non-zero overview values pass through unchanged', () => {
    const out = text(
      createElement(OperationalKpis, {
        overview: { ...zeroOverview, activeDrivers: 3, registeredDrivers: 7, completedRidesYesterday: 5, completedRidesChangePct: -40 },
      }),
    )
    assert.ok(out.includes('Active Drivers 3 '))
    assert.ok(out.includes('of 7 registered'))
    assert.ok(out.includes('↓ 40%'))
  })

  it('TEST 2: grossRideValueToday = 0 shows ₹ 0, not ₹28,45,320', () => {
    const out = text(createElement(FinancialKpis, { financials: zeroFinancials }))
    assert.equal(out.match(/₹ 0/g)?.length, 3, out)
    assertNoneOf(out, DEMO_FINANCIALS)
  })

  it('a subscription-only day (GRV 0, revenue > 0) shows the real revenue, not demo cards', () => {
    const out = text(createElement(FinancialKpis, { financials: { ...zeroFinancials, platformRevenueToday: 199 } }))
    assert.ok(out.includes('₹ 199'))
    assertNoneOf(out, DEMO_FINANCIALS)
  })

  it('TEST 3: all-zero platform revenue trend renders zero, not ₹3,02,450', () => {
    const out = text(createElement(PlatformRevenueAreaChart, { ...chartProps, data: zeroRevenueTrend }))
    assert.ok(out.includes('₹ 0'), out)
    assertNoneOf(out, ['3,02,450', '302450', '18%', 'vs previous week', '₹ 80K', 'Sep 20'])
  })

  it('TEST 4: all-zero gross ride value trend renders zero, not ₹28,45,320', () => {
    const out = text(createElement(GrossRideValueAreaChart, { ...chartProps, data: zeroGrossTrend }))
    assert.ok(out.includes('₹ 0'), out)
    assertNoneOf(out, ['28,45,320', '2845320', '20%', 'vs previous week', '₹ 8L', 'Sep 20'])
  })

  it('TEST 5: ride distribution total = 0 shows the empty state, not 3,425', () => {
    const out = text(createElement(RideStatusDonutChart, { distribution: zeroDistribution }))
    assert.ok(out.includes('No ride data available'), out)
    assertNoneOf(out, ['3,425', '2,841', '82.9%'])
  })

  it('TEST 6: all-zero hourly rides show the zero state, not a 312 peak', () => {
    const out = text(createElement(RidesByHourBarChart, { data: zeroHours }))
    assert.ok(out.includes('No rides recorded in this period'), out)
    assertNoneOf(out, ['312', '4PM rides'])
  })

  it('hourly chart scales from real data and highlights the backend peak', () => {
    const hours = zeroHours.map((h) => (h.hour === 9 ? { ...h, label: '9 AM', count: 3, isPeak: true } : h))
    const out = text(createElement(RidesByHourBarChart, { data: hours }))
    assert.ok(out.includes('9 AM 3 rides'), out)
    assertNoneOf(out, ['400', '312'])
  })

  it('TEST 7: websocketConnections = 0 shows 0 and the backend status, not 3,842 / Healthy', () => {
    const out = text(
      createElement(SystemHealthSection, {
        health: { ...baseHealth, websocketConnections: 0, websocketStatus: 'DOWN', overallStatus: 'DEGRADED' },
      }),
    )
    assert.ok(out.includes('WebSockets (this instance) 0 Down'), out)
    assert.ok(out.includes('System Health Degraded'), out)
    assertNoneOf(out, DEMO_HEALTH)
  })

  it('TEST 8: stale GPS shows Stale with the real lag, not a fake 1.8 sec', () => {
    const out = text(
      createElement(SystemHealthSection, {
        health: { ...baseHealth, gpsFreshnessSec: 125, gpsFreshnessStatus: 'STALE' },
      }),
    )
    assert.ok(out.includes('Latest GPS Update 125 sec ago Stale'), out)
    assertNoneOf(out, DEMO_HEALTH)
  })

  it('health shows the backend error-rate percentage as-is (1.5 → 1.5%, not 150%)', () => {
    const out = text(
      createElement(SystemHealthSection, { health: { ...baseHealth, paymentFailureRate24h: 1.5 } }),
    )
    assert.ok(out.includes('Payment Failures (24h) 1.5% Healthy'), out)
    assert.ok(!out.includes('150'), out)
  })

  it('health shows Down and "—" when Redis is down (failed-job count is not measured then)', () => {
    const out = text(createElement(SystemHealthSection, { health: { ...baseHealth, redisStatus: 'DOWN', failedQueueJobs: null } }))
    assert.ok(out.includes('Redis / Queue Health — Down'), out)
  })

  it('health shows "—" and No data when there is nothing to measure, never a stand-in number', () => {
    const out = text(
      createElement(SystemHealthSection, {
        health: {
          ...baseHealth,
          notificationSuccessRate: null,
          notificationStatus: 'NO_DATA',
          gpsFreshnessSec: null,
          gpsFreshnessStatus: 'NO_DATA',
          paymentFailureRate24h: null,
          paymentFailureStatus: 'NO_DATA',
          websocketConnections: null,
          websocketStatus: 'DISABLED',
        },
      }),
    )
    assert.ok(out.includes('Notifications Delivery — No data'), out)
    assert.ok(out.includes('Latest GPS Update — No data'), out)
    assert.ok(out.includes('Payment Failures (24h) — No data'), out)
    assert.ok(out.includes('WebSockets (this instance) — Disabled'), out)
    assertNoneOf(out, ['100.0%', '0.0%', '0 sec'])
  })

  it('ride distribution labels expired requests as No Driver Found', () => {
    const out = text(
      createElement(RideStatusDonutChart, {
        distribution: { ...zeroDistribution, total: 4, completed: 3, completedPct: 75, noDriversFound: 1, noDriversFoundPct: 25 },
      }),
    )
    assert.ok(out.includes('No Driver Found 1 (25.0%)'), out)
    assert.ok(!out.includes('No Show'), out)
  })

  it('TEST 9: a negative financial delta renders ↓ with its real magnitude, not a green ↑', () => {
    const out = text(
      createElement(FinancialKpis, {
        financials: { ...zeroFinancials, platformRevenueToday: 750, platformRevenueChangePct: -25 },
      }),
    )
    assert.ok(out.includes('₹ 750 ↓ 25%'), out)
    assert.ok(!out.includes('↑ 25%'), out)
  })

  it('TEST 10: missing backend data shows an unavailable state in every section, never demo data', () => {
    const outputs = [
      text(createElement(OperationalKpis, {})),
      text(createElement(FinancialKpis, {})),
      text(createElement(PlatformRevenueAreaChart, chartProps)),
      text(createElement(GrossRideValueAreaChart, chartProps)),
      text(createElement(RideStatusDonutChart, {})),
      text(createElement(RidesByHourBarChart, {})),
      text(createElement(SystemHealthSection, {})),
    ]
    for (const out of outputs) {
      assert.ok(out.includes('No data is available for this section.'), out)
      assertNoneOf(out, [...DEMO_OVERVIEW, ...DEMO_FINANCIALS, ...DEMO_HEALTH, '3,02,450', '3,425'])
    }
  })

  it('forbidden sections show the permission notice, never data', () => {
    const outputs = [
      text(createElement(OperationalKpis, { overview: zeroOverview, isForbidden: true })),
      text(createElement(PlatformRevenueAreaChart, { ...chartProps, data: zeroRevenueTrend, isForbidden: true })),
      text(createElement(SystemHealthSection, { health: baseHealth, isForbidden: true })),
      text(createElement(FinancialKpis, { isForbidden: true })),
    ]
    for (const out of outputs) {
      assert.ok(/(operations|finance):read required/.test(out), out)
      assertNoneOf(out, [...DEMO_OVERVIEW, ...DEMO_FINANCIALS, ...DEMO_HEALTH, '₹ 0'])
    }
  })

  it('errors show a status-specific message and a retry, never data', () => {
    const cases: Array<[number | undefined, string]> = [
      [401, 'Sign in again'],
      [404, 'not found on the server (404)'],
      [429, 'Too many requests'],
      [503, 'The server failed to load this section (503)'],
      [undefined, 'Please check network connectivity'],
    ]
    for (const [status, message] of cases) {
      const out = text(createElement(OperationalKpis, { isError: true, errorStatus: status, onRetry: noop }))
      assert.ok(out.includes(message), `${status}: ${out}`)
      assert.ok(out.includes('Retry Section'))
      assertNoneOf(out, DEMO_OVERVIEW)
    }
  })

  it('loading shows a skeleton, never numbers', () => {
    const out = text(createElement(OperationalKpis, { isLoading: true }))
    assert.equal(out, '')
  })

  it('errorStatus reads the interceptor error shape and the axios shape (403 detection)', () => {
    const interceptorError = Object.assign(new Error('Insufficient permission'), { status: 403 })
    assert.equal(errorStatus(interceptorError), 403)
    assert.equal(errorStatus({ response: { status: 403 } }), 403)
    assert.equal(errorStatus(new Error('Network Error')), undefined)
    assert.equal(errorStatus(null), undefined)
  })
})

describe('Dashboard data integrity: no invented labels', () => {
  const driver: LiveDriver = {
    id: 'drv-1',
    driverNumber: 'DRV-0001',
    fullName: 'Test Driver',
    phoneNumber: '',
    avatarUrl: null,
    status: 'ONLINE',
    mode: null,
    vehicle: null,
    location: { lat: 34.1, lng: 74.8 },
    speedKmh: null,
    heading: 'N',
    activeTrip: null,
    recordedAt: '2026-09-29T06:00:00.000Z',
    gpsFreshness: 'LIVE',
    gpsLagSeconds: 3,
    lastUpdateText: 'Just now',
  }

  it('a driver without an address shows "Address unavailable", not "Dispatch Point"; no vehicle → no mode', () => {
    const out = text(createElement(MemoryRouter, null, createElement(LiveDriversTable, { drivers: [driver], onlineCount: 1 })))
    assert.ok(out.includes('Address unavailable'), out)
    assert.ok(out.includes('34.1000, 74.8000'), out)
    assertNoneOf(out, ['Dispatch Point', ' Car '])
  })

  it('shows the real driver status and "—" for unknown speed', () => {
    const out = text(
      createElement(MemoryRouter, null, createElement(LiveDriversTable, { drivers: [{ ...driver, status: 'BUSY' }], onlineCount: 0 })),
    )
    assert.ok(out.includes('BUSY'), out)
    assert.ok(!out.includes('IDLE'), 'BUSY is an engaged state, not idle')
    assert.ok(!out.includes('km/h'), 'unknown speed is not shown as 0 km/h')
  })

  it('activity titles are shown exactly as the backend sends them', () => {
    const activity: DashboardActivity = {
      id: 'log-1',
      type: 'SYSTEM_ALERT',
      title: 'Admin Action: CREATE',
      description: 'Application Manually Created by Admin',
      timestamp: '2026-09-29T06:00:00.000Z',
      timeAgoText: '2m ago',
    }
    const out = text(createElement(MemoryRouter, null, createElement(RecentActivityTimeline, { activities: [activity] })))
    assert.ok(out.includes('Admin Action: CREATE'), out)
    assert.ok(!out.includes('Surge Zone Created'), out)
  })
})

describe('Dashboard data integrity: static scan of production code', () => {
  const root = path.resolve(__dirname, '..')
  const files = ['components', 'pages', 'hooks', 'services', 'utils', 'types']
    .flatMap((dir) => fs.readdirSync(path.join(root, dir)).map((f) => path.join(root, dir, f)))
    .filter((f) => /\.(ts|tsx)$/.test(f))

  /** Source with comments removed, so documentation examples do not count as data. */
  const code = (file: string) =>
    fs.readFileSync(file, 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

  it('no TARGET_* datasets, numeric fallbacks, constant sparklines or invented labels', () => {
    const banned: Array<[RegExp, string]> = [
      [/TARGET_/, 'TARGET_* mock dataset'],
      [/(\|\||\?\?)\s*\d/, 'numeric || / ?? fallback'],
      [/sparkPoints|MiniBars|HealthSparkline|PinnedIndex|isPeak4PM/, 'fabricated chart decoration'],
      [/Dispatch Point|Surge Zone Created/, 'invented label'],
      [/\b(842|1,?240|621|2,?841|2,?401|428650|2845320|2698140|302450|3,?425|3,?842|99\.2|0\.12)\b/, 'demo number'],
      [/Math\.random|setInterval\(|setTimeout\(/, 'random/timer-generated data'],
    ]
    const violations: string[] = []
    for (const file of files) {
      const src = code(file)
      for (const [re, what] of banned) {
        if (re.test(src)) violations.push(`${path.relative(root, file)}: ${what} (${re})`)
      }
    }
    assert.deepEqual(violations, [])
  })
})
