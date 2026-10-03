/**
 * Phase 3: negative-value charts, error typing and retry policy, accessibility, and tooling.
 * Components are rendered with react-dom/server and the real DTO types.
 */
import './dom-env' // the map section imports Leaflet, which needs window at load
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import type { AxiosError } from 'axios'
import { responseErrorInterceptor } from '@/infrastructure/api/interceptors'
import { PlatformRevenueAreaChart } from '../components/PlatformRevenueAreaChart'
import { GrossRideValueAreaChart } from '../components/GrossRideValueAreaChart'
import { RideStatusDonutChart } from '../components/RideStatusDonutChart'
import { RidesByHourBarChart } from '../components/RidesByHourBarChart'
import { LiveDriversTable } from '../components/LiveDriversTable'
import { LiveOperationsMapSection, driverMarker } from '../components/LiveOperationsMapSection'
import { DashboardErrorCard, RealtimeStatusBadge } from '../components/DashboardSkeletons'
import { errorStatus, dashboardRetry } from '../hooks'
import { valueScale } from '../utils/chartScale'
import { formatInr } from '../utils/formatters'
import type { GrossRideValueTrend, LiveDriver, PlatformRevenueTrend } from '../types'
import type { RealtimeStatus } from '../realtime'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../../../..')
const html = (el: ReactElement) => renderToStaticMarkup(el)
const text = (el: ReactElement) =>
  html(el).replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()

// ─── Charts ──────────────────────────────────────────────────────────────────

const SERIES: Record<string, number[]> = {
  'all positive': [100, 400, 250, 900, 50, 0, 300],
  'all zero': [0, 0, 0, 0, 0, 0, 0],
  'mixed positive/negative': [300, -120, 0, 450, -600, 80, 10],
  'all negative': [-50, -400, -20, -900, -10, -300, -70],
  'single negative point': [-250],
}

const revenue = (values: number[]): PlatformRevenueTrend[] =>
  values.map((v, i) => ({
    date: `Sep ${20 + i}, 2026`,
    dayOfWeek: 'Mon',
    dateKey: `2026-09-${20 + i}`,
    platformRevenue: v,
    rideCommission: v,
    subscriptionRevenue: 0,
    platformFees: 0,
  }))
const grv = (values: number[]): GrossRideValueTrend[] =>
  values.map((v, i) => ({ date: `Sep ${20 + i}, 2026`, dayOfWeek: 'Mon', dateKey: `2026-09-${20 + i}`, grossRideValue: v, ridesCount: 1 }))

/** Plot area of both charts: paddingTop 25 … height 195 − paddingBottom 30. */
const PLOT = { top: 25, bottom: 165 }

describe('Phase 3: financial charts keep real negative values', () => {
  for (const [name, values] of Object.entries(SERIES)) {
    it(`scale: ${name}`, () => {
      const s = valueScale(values, PLOT.top, PLOT.bottom - PLOT.top)
      for (const v of values) {
        const y = s.y(v)
        assert.ok(y >= PLOT.top - 1e-9 && y <= PLOT.bottom + 1e-9, `${v} → y ${y} inside the plot`)
        if (v < 0) assert.ok(y > s.zeroY, `${v} plots below the zero line`)
        if (v > 0) assert.ok(y < s.zeroY, `${v} plots above the zero line`)
      }
      assert.equal(s.min, Math.min(0, ...values), 'domain min = min(0, lowest)')
      assert.equal(s.max, Math.max(0, ...values), 'domain max = max(0, highest)')
      if (values.every((v) => v === 0)) {
        assert.deepEqual(s.ticks, [0])
        assert.equal(s.zeroY, PLOT.bottom, 'all-zero series lies on the floor')
      } else {
        assert.equal(s.ticks[0], s.max)
        assert.equal(s.ticks.at(-1), s.min)
      }
    })

    for (const [chart, render] of [
      ['PlatformRevenueAreaChart', () => createElement(PlatformRevenueAreaChart, { data: revenue(values), range: '7d', onRangeChange: () => {} })],
      ['GrossRideValueAreaChart', () => createElement(GrossRideValueAreaChart, { data: grv(values), range: '7d', onRangeChange: () => {} })],
    ] as const) {
      it(`${chart}: ${name} renders every value unclamped and inside the plot`, () => {
        const out = html(render())
        // every data point circle (≤ 7 points are all drawn) sits inside the plot area
        const cys = [...out.matchAll(/<circle cx="[^"]+" cy="([^"]+)"/g)].map((m) => Number(m[1]))
        assert.equal(cys.length, values.length)
        for (const cy of cys) assert.ok(cy >= PLOT.top - 1e-6 && cy <= PLOT.bottom + 1e-6, `cy ${cy} inside plot`)
        // the accessible table lists each real value, negatives included
        for (const v of values) assert.ok(out.includes(`<td>${formatInr(v)}</td>`), `table lists ${formatInr(v)}`)
        const lowest = Math.min(...values)
        assert.match(out, new RegExp(`lowest ${formatInr(lowest).replace(/[₹-]/g, (c) => `\\${c}`)}`))
      })
    }
  }

  it('formats negatives with the sign before the symbol, compact or not', () => {
    assert.equal(formatInr(-500), '-₹500')
    assert.equal(formatInr(-1500, true), '-₹1.5K')
    assert.equal(formatInr(-0.2), '₹0')
    assert.equal(formatInr(1250), '₹1,250')
  })
})

// ─── Errors ──────────────────────────────────────────────────────────────────

async function interceptorError(status?: number, code?: string): Promise<unknown> {
  const axiosError = {
    config: { url: '/dashboard/overview', headers: {} },
    response: status === undefined ? undefined : { status, data: { error: { message: `HTTP ${status}` } } },
    code,
    message: code === 'ECONNABORTED' ? 'timeout of 15000ms exceeded' : 'Request failed',
  } as unknown as AxiosError
  return responseErrorInterceptor(axiosError).then(
    () => assert.fail('must reject'),
    (e: unknown) => e,
  )
}

describe('Phase 3: request failures stay distinguishable (through the real interceptor)', () => {
  const cases: Array<[string, number | undefined, string | undefined, ReturnType<typeof errorStatus>, boolean]> = [
    ['400 validation', 400, 'ERR_BAD_REQUEST', 400, false],
    ['401 unauthorized', 401, 'ERR_BAD_REQUEST', 401, false],
    ['403 forbidden', 403, 'ERR_BAD_REQUEST', 403, false],
    ['404 not found', 404, 'ERR_BAD_REQUEST', 404, false],
    ['429 rate limited', 429, 'ERR_BAD_REQUEST', 429, true],
    ['500 server error', 500, 'ERR_BAD_RESPONSE', 500, true],
    ['503 degraded backend', 503, 'ERR_BAD_RESPONSE', 503, true],
    ['timeout', undefined, 'ECONNABORTED', 'timeout', true],
    ['network failure', undefined, 'ERR_NETWORK', 'network', true],
  ]
  for (const [name, status, code, expected, transient] of cases) {
    it(`${name} → ${expected}, ${transient ? 'retried once' : 'never retried'}`, async () => {
      const original = console.error
      console.error = () => {}
      const error = await interceptorError(status, code)
      console.error = original
      assert.equal(errorStatus(error), expected)
      assert.equal(dashboardRetry(0, error), transient)
      assert.equal(dashboardRetry(1, error), false, 'at most one retry')
    })
  }

  it('each failure renders its own message in an alert, never a number or "healthy"', () => {
    const messages: Array<[Parameters<typeof DashboardErrorCard>[0]['status'], RegExp]> = [
      [400, /rejected this request as invalid \(400\)/],
      [401, /session is no longer valid/],
      [500, /failed to load this section \(500\)/],
      ['timeout', /did not answer in time/],
      ['network', /could not be reached/],
    ]
    for (const [status, pattern] of messages) {
      const card = createElement(DashboardErrorCard, { title: 'Section unavailable', status })
      assert.match(html(card), /role="alert"/)
      assert.match(text(card), pattern)
      assert.doesNotMatch(text(card), /healthy|₹0|\b0\b/i, 'visible text fabricates no value')
    }
  })

  it('every realtime state is stated in words and carries no metric', () => {
    const states: RealtimeStatus[] = ['connecting', 'live', 'reconnecting', 'offline', 'unauthorized', 'forbidden']
    for (const status of states) {
      const out = html(createElement(RealtimeStatusBadge, { state: { status, rooms: [] } }))
      assert.match(out, /role="status"/)
      assert.match(out, /aria-live="polite"/)
      assert.doesNotMatch(text(createElement(RealtimeStatusBadge, { state: { status, rooms: [] } })), /\d/)
    }
    assert.equal(html(createElement(RealtimeStatusBadge, { state: null })), '')
  })
})

// ─── Live drivers: degraded refresh, freshness in words ──────────────────────

const driver = (over: Partial<LiveDriver> = {}): LiveDriver => ({
  id: 'd1',
  driverNumber: 'D-1',
  fullName: 'Asha Rao',
  phoneNumber: '',
  avatarUrl: null,
  status: 'ON_TRIP',
  mode: 'Car',
  vehicle: null,
  location: { lat: 20.5, lng: 70.5 },
  speedKmh: 32,
  heading: 'N',
  activeTrip: { id: 'r1', rideCode: 'ZR100', status: 'IN_PROGRESS' },
  recordedAt: '2026-09-30T06:00:00.000Z',
  gpsFreshness: 'LIVE',
  gpsLagSeconds: 4,
  lastUpdateText: '4s ago',
  ...over,
})

describe('Phase 3: live drivers under failure and staleness', () => {
  const table = (props: Parameters<typeof LiveDriversTable>[0]) =>
    createElement(MemoryRouter, null, createElement(LiveDriversTable, props))

  it('a failed refresh keeps the last rows and says so; a failed first load shows the error card', () => {
    const kept = text(table({ drivers: [driver()], isError: true, errorStatus: 503, onlineCount: 1 }))
    assert.match(kept, /Asha Rao/)
    assert.match(kept, /Could not refresh drivers \(503\)/)
    const failed = html(table({ isError: true, errorStatus: 'timeout' }))
    assert.match(failed, /role="alert"/)
    assert.match(failed, /did not answer in time/)
    assert.doesNotMatch(failed, /Asha Rao/)
  })

  it('states freshness in words: stale and no-fix are different, and neither relies on colour', () => {
    const out = text(
      table({
        drivers: [
          driver({ id: 'a', gpsFreshness: 'STALE', lastUpdateText: '6m ago' }),
          driver({ id: 'b', fullName: 'Ravi', location: null, recordedAt: null, gpsFreshness: 'UNKNOWN', lastUpdateText: 'No GPS signal' }),
        ],
      }),
    )
    assert.match(out, /6m ago Stale/)
    assert.match(out, /No GPS fix/)
  })

  it('marker semantics come from backend fields only', () => {
    const live = driverMarker(driver())!
    assert.equal(live.stale, false)
    assert.equal(live.color, '#2563EB')
    assert.match(live.label!, /Asha Rao, On trip, GPS live, last fix 4s ago/)
    const stale = driverMarker(driver({ gpsFreshness: 'STALE' }))!
    assert.equal(stale.stale, true)
    assert.match(stale.label!, /GPS stale/)
    assert.equal(driverMarker(driver({ location: null, gpsFreshness: 'UNKNOWN' })), null)
    assert.equal(driverMarker(driver({ location: { lat: 91, lng: 70 } })), null)
    const offline = driverMarker(driver({ status: 'OFFLINE', gpsFreshness: 'OFFLINE' }))!
    assert.equal(offline.color, '#64748B')
    assert.equal(offline.stale, false)
    assert.match(offline.label!, /Offline, Off duty/)
  })

  it('a failed map refresh keeps positions and labels them with the time they are from', () => {
    const out = text(
      createElement(LiveOperationsMapSection, {
        drivers: [],
        isError: true,
        errorStatus: 500,
        dataUpdatedAt: Date.UTC(2026, 8, 30, 6, 0, 0),
      }),
    )
    assert.match(out, /Could not refresh driver positions \(500\)\. Showing positions from/)
    const first = html(createElement(LiveOperationsMapSection, { isError: true, errorStatus: 500 }))
    assert.match(first, /Telemetry map unavailable/)
  })
})

// ─── Accessibility ───────────────────────────────────────────────────────────

describe('Phase 3: accessibility', () => {
  it('the ride link in the drivers table is a keyboard-operable button', () => {
    const out = html(createElement(MemoryRouter, null, createElement(LiveDriversTable, { drivers: [driver()] })))
    assert.match(out, /<button type="button"[^>]*title="Monitor this ride"[^>]*>#ZR100<\/button>/)
    assert.doesNotMatch(out, /<span[^>]*onClick/i)
  })

  it('map view modes are buttons with pressed state; unavailable ones are disabled, not silent', () => {
    const out = html(createElement(LiveOperationsMapSection, { drivers: [] }))
    assert.match(out, /aria-pressed="true"[^>]*>Live Map</)
    assert.match(out, /aria-pressed="false" disabled="" title="Heatmap is not available yet"/)
    assert.match(out, /aria-pressed="false" disabled="" title="Zones is not available yet"/)
    assert.match(out, /<ul aria-label="Map legend"/)
    assert.match(out, /Stale GPS/)
    assert.doesNotMatch(out, /Active Ride/)
  })

  it('area charts expose a text summary, a data table, and a labelled period control', () => {
    const out = html(createElement(PlatformRevenueAreaChart, { data: revenue(SERIES['mixed positive/negative']), range: '30d', onRangeChange: () => {} }))
    assert.match(out, /<svg[^>]*role="img"[^>]*aria-label="Platform revenue by day, last 30 days: total/)
    // the wrapper clips: sr-only directly on a <table> does not shrink it and widened the page
    assert.match(out, /<div class="sr-only"><table><caption>Platform revenue by day, last 30 days<\/caption>/)
    assert.match(out, /<select aria-label="Revenue chart period"/)
  })

  it('no dead controls: the donut has no week/month choice it cannot honour; the bar chart has no no-op link', () => {
    const donut = html(
      createElement(RideStatusDonutChart, {
        distribution: { total: 4, completed: 2, completedPct: 50, cancelled: 1, cancelledPct: 25, noDriversFound: 1, noDriversFoundPct: 25, ongoing: 0, ongoingPct: 0 },
      }),
    )
    assert.doesNotMatch(donut, /<select|This Week|This Month/)
    assert.match(donut, /Today/)
    const bars = html(
      createElement(RidesByHourBarChart, {
        data: Array.from({ length: 24 }, (_, hour) => ({ hour, label: `${hour}:00`, count: hour === 9 ? 7 : 0, isPeak: hour === 9 })),
      }),
    )
    assert.doesNotMatch(bars, /View All/)
    assert.match(bars, /<ul class="sr-only" aria-label="Rides by hour today"><li>9:00: 7 rides \(peak\)<\/li><\/ul>/)
  })

  it('dashboard components put no click handler on a non-interactive element', () => {
    const dir = path.resolve(__dirname, '../components')
    for (const file of fs.readdirSync(dir)) {
      const source = fs.readFileSync(path.join(dir, file), 'utf-8')
      assert.doesNotMatch(source, /<(div|span|li|td|tr|p)\b[^>]*\bonClick=/, `${file} has a clickable non-button`)
    }
  })
})

// ─── Tooling and fabrication guards ──────────────────────────────────────────

describe('Phase 3: tooling', () => {
  it('npm run type-check checks the application (and type-check:test checks the tests)', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')) as { scripts: Record<string, string> }
    const configs = [...pkg.scripts['type-check'].matchAll(/tsc -p (\S+)/g)].map((m) => m[1])
    assert.deepEqual(configs, ['tsconfig.app.json', 'tsconfig.node.json'])
    assert.match(pkg.scripts['type-check:test'], /tsc -p tsconfig\.test\.json/)

    const tsc = path.join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc')
    const list = (config: string) =>
      execFileSync(process.execPath, [tsc, '-p', config, '--listFilesOnly'], { cwd: ROOT, encoding: 'utf-8' })
        .split(/\r?\n/)
        .filter((f) => f.includes('/src/') || f.endsWith('vite.config.ts'))
    const app = list('tsconfig.app.json')
    assert.ok(app.length > 400, `app config checks ${app.length} source files`)
    assert.ok(app.some((f) => f.endsWith('modules/dashboard/pages/DashboardPage.tsx')))
    assert.ok(app.some((f) => f.endsWith('modules/dashboard/realtime.ts')))
    assert.ok(list('tsconfig.node.json').some((f) => f.endsWith('vite.config.ts')))
    const tests = list('tsconfig.test.json')
    assert.ok(tests.some((f) => f.endsWith('dashboard-phase3.test.ts')), 'test config includes the tests')
  })

  it('no hardcoded city or fallback coordinates in dashboard or shared map code', () => {
    const files = [
      ...fs.readdirSync(path.resolve(__dirname, '../components')).map((f) => path.resolve(__dirname, '../components', f)),
      path.resolve(__dirname, '../pages/DashboardPage.tsx'),
      path.resolve(__dirname, '../realtime.ts'),
      path.resolve(ROOT, 'src/shared/components/maps/LiveMap.tsx'),
    ]
    for (const file of files) {
      const source = fs.readFileSync(file, 'utf-8')
      for (const forbidden of ['12.9716', '77.5946', '34.0837', '74.7973', 'Bengaluru', 'Srinagar', 'TARGET_']) {
        assert.ok(!source.includes(forbidden), `${path.basename(file)} contains ${forbidden}`)
      }
    }
  })
})
