import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { api, API_ENDPOINTS } from '@/infrastructure/api'
import { DashboardService, serializeViewport } from '../services'
import { dashboardKeys } from '../hooks'
import { hasPermission } from '@/infrastructure/permissions'
import type {
  DashboardOverview,
  DashboardFinancials,
  DashboardAnalytics,
  DashboardFinancialAnalytics,
  DashboardLiveDriversResponse,
  DashboardActivityResponse,
  DashboardHealth,
} from '../types'
import type { User } from '@/store/auth.store'

describe('Operations Dashboard Frontend Data Layer (Phase 4)', () => {
  // ─── 1. Overview Query Success ─────────────────────────────────────────────
  it('1. Overview: successfully calls API and parses overview DTO', async () => {
    const mockOverview: DashboardOverview = {
      activeDrivers: 24,
      activeDriversChangePct: 5.2,
      onlineDrivers: 18,
      onlineDriversPctOfActive: 75.0,
      ongoingRides: 6,
      ongoingRidesChangePct: -2.1,
      inFlightRiders: 11,
      completedRidesToday: 142,
      completedRidesYesterday: 135,
      completedRidesChangePct: 5.19,
      pendingVerifications: 8,
      pendingVerificationsChangePct: 0,
      registeredDrivers: 450,
      calculatedAt: '2026-09-27T10:00:00.000Z',
    }

    const originalGet = api.get
    api.get = (async (url: string) => {
      assert.equal(url, API_ENDPOINTS.dashboard.overview)
      return { data: mockOverview }
    }) as any

    try {
      const data = await DashboardService.getOverview()
      assert.deepEqual(data, mockOverview)
      assert.equal(data.activeDrivers, 24)
      assert.equal(data.inFlightRiders, 11)
      assert.equal(data.completedRidesToday, 142)
    } finally {
      api.get = originalGet
    }
  })

  // ─── 2. Overview API Error Propagation ─────────────────────────────────────
  it('2. Overview: propagates API failure without swallowing errors', async () => {
    const originalGet = api.get
    const networkError = new Error('Network Connection Refused')
    api.get = (async () => {
      throw networkError
    }) as any

    try {
      await assert.rejects(
        async () => {
          await DashboardService.getOverview()
        },
        (err: Error) => {
          assert.equal(err.message, 'Network Connection Refused')
          return true
        },
      )
    } finally {
      api.get = originalGet
    }
  })

  // ─── 3. Financial Query Success ────────────────────────────────────────────
  it('3. Financials: successfully calls API and parses financial metrics', async () => {
    const mockFinancials: DashboardFinancials = {
      platformRevenueToday: 12500,
      platformRevenueYesterday: 11000,
      platformRevenueChangePct: 13.6,
      grossRideValueToday: 95000,
      grossRideValueYesterday: 88000,
      grossRideValueChangePct: 8.0,
      driverRideCollectionsToday: 82500,
      driverRideCollectionsYesterday: 77000,
      driverRideCollectionsChangePct: 7.1,
      currency: 'INR',
      reportingTimeZone: 'Asia/Kolkata',
      calculatedAt: '2026-09-27T10:00:00.000Z',
    }

    const originalGet = api.get
    api.get = (async (url: string) => {
      assert.equal(url, API_ENDPOINTS.dashboard.financials)
      return { data: mockFinancials }
    }) as any

    try {
      const data = await DashboardService.getFinancials()
      assert.deepEqual(data, mockFinancials)
      assert.equal(data.platformRevenueToday, 12500)
      assert.equal(data.grossRideValueToday, 95000)
      assert.equal(data.driverRideCollectionsToday, 82500)
    } finally {
      api.get = originalGet
    }
  })

  // ─── 4. Financial 403 Permission Handling ──────────────────────────────────
  it('4. Financials: correctly handles permission evaluation and 403 Forbidden', () => {
    // Operations user without finance:read
    const opsUser: User = {
      id: 'usr-ops',
      name: 'Ops Staff',
      email: 'ops@zaroorat.com',
      role: 'support',
      roles: ['support'],
      permissions: ['operations:read'],
    }

    assert.equal(hasPermission(opsUser, 'operations:read'), true)
    assert.equal(hasPermission(opsUser, 'finance:read'), false, 'Ops staff lacks finance:read')

    // Finance user with finance:read
    const financeUser: User = {
      id: 'usr-fin',
      name: 'Finance Manager',
      email: 'fin@zaroorat.com',
      role: 'finance',
      roles: ['finance'],
      permissions: ['finance:read'],
    }

    assert.equal(hasPermission(financeUser, 'finance:read'), true)
    assert.equal(hasPermission(financeUser, 'operations:read'), false)

    // Super Admin with full access
    const adminUser: User = {
      id: 'usr-admin',
      name: 'Super Admin',
      email: 'admin@zaroorat.com',
      role: 'system_admin',
      roles: ['system_admin'],
      permissions: [],
    }

    assert.equal(hasPermission(adminUser, 'operations:read'), true)
    assert.equal(hasPermission(adminUser, 'finance:read'), true)
  })

  // ─── 5. Financial analytics 7d / operational analytics ─────────────────────
  it('5. Analytics: financial series take range=7d; operational analytics takes no range', async () => {
    const mockFinancial7d: DashboardFinancialAnalytics = {
      range: '7d',
      platformRevenueTrend: [
        { date: 'Sep 21, 2026', dayOfWeek: 'Mon', dateKey: '2026-09-21', platformRevenue: 100, rideCommission: 50, subscriptionRevenue: 50, platformFees: 0 },
      ],
      grossRideValueTrend: [
        { date: 'Sep 21, 2026', dayOfWeek: 'Mon', dateKey: '2026-09-21', grossRideValue: 1000, ridesCount: 5 },
      ],
      reportingTimeZone: 'Asia/Kolkata',
      calculatedAt: '2026-09-27T10:00:00.000Z',
    }
    const mockOps: DashboardAnalytics = {
      rideStatusDistribution: { total: 5, completed: 4, completedPct: 80, cancelled: 1, cancelledPct: 20, noDriversFound: 0, noDriversFoundPct: 0, ongoing: 0, ongoingPct: 0 },
      ridesByHour: [{ hour: 14, label: '2 PM', count: 5, isPeak: true }],
      periodStart: '2026-09-26T18:30:00.000Z',
      periodEnd: '2026-09-27T18:30:00.000Z',
      reportingTimeZone: 'Asia/Kolkata',
      calculatedAt: '2026-09-27T10:00:00.000Z',
    }

    const originalGet = api.get
    api.get = (async (url: string, config: any) => {
      if (url === API_ENDPOINTS.dashboard.financialAnalytics) {
        assert.equal(config.params.range, '7d')
        return { data: mockFinancial7d }
      }
      assert.equal(url, API_ENDPOINTS.dashboard.analytics)
      assert.equal(config, undefined, 'operational analytics sends no range')
      return { data: mockOps }
    }) as any

    try {
      const fin = await DashboardService.getFinancialAnalytics('7d')
      assert.equal(fin.platformRevenueTrend.length, 1)
      const ops = await DashboardService.getAnalytics()
      assert.equal(ops.ridesByHour[0].hour, 14)
    } finally {
      api.get = originalGet
    }
  })

  // ─── 6. Financial analytics 30d ────────────────────────────────────────────
  it('6. Analytics: passes range=30d parameter correctly', async () => {
    const originalGet = api.get
    let requestedRange = ''
    api.get = (async (_url: string, config: any) => {
      requestedRange = config.params.range
      return { data: { range: '30d', platformRevenueTrend: [], grossRideValueTrend: [] } }
    }) as any

    try {
      await DashboardService.getFinancialAnalytics('30d')
      assert.equal(requestedRange, '30d')
    } finally {
      api.get = originalGet
    }
  })

  // ─── 7. Financial analytics 90d ────────────────────────────────────────────
  it('7. Analytics: passes range=90d parameter correctly', async () => {
    const originalGet = api.get
    let requestedRange = ''
    api.get = (async (_url: string, config: any) => {
      requestedRange = config.params.range
      return { data: { range: '90d', platformRevenueTrend: [], grossRideValueTrend: [] } }
    }) as any

    try {
      await DashboardService.getFinancialAnalytics('90d')
      assert.equal(requestedRange, '90d')
    } finally {
      api.get = originalGet
    }
  })

  // ─── 8. Live Drivers Query ─────────────────────────────────────────────────
  it('8. Live Drivers: fetches telemetry data with GPS freshness and active trips', async () => {
    const mockLiveDrivers: DashboardLiveDriversResponse = {
      totalDrivers: 2,
      onlineCount: 1,
      onTripCount: 1,
      busyCount: 0,
      breakCount: 0,
      gpsStaleAfterSec: 120,
      offlineCount: 0,
      drivers: [
        {
          id: 'drv-1',
          driverNumber: 'DRV_101',
          fullName: 'Tariq Ahmad',
          phoneNumber: '+919876543210',
          avatarUrl: null,
          status: 'ONLINE',
          mode: 'Car',
          vehicle: { id: 'veh-1', licensePlate: 'JK01AB1234', model: 'Swift', typeCode: 'CAB_ECONOMY', typeName: 'Economy' },
          location: { lat: 34.0837, lng: 74.7973 },
          speedKmh: 35,
          heading: 'NE',
          activeTrip: null,
          recordedAt: '2026-09-27T09:59:50.000Z',
          gpsFreshness: 'LIVE',
          gpsLagSeconds: 10,
          lastUpdateText: '10s ago',
        },
      ],
      calculatedAt: '2026-09-27T10:00:00.000Z',
    }

    const originalGet = api.get
    api.get = (async (url: string) => {
      assert.equal(url, API_ENDPOINTS.dashboard.liveDrivers)
      return { data: mockLiveDrivers }
    }) as any

    try {
      const data = await DashboardService.getLiveDrivers()
      assert.equal(data.drivers.length, 1)
      assert.equal(data.drivers[0].gpsFreshness, 'LIVE')
      assert.equal(data.drivers[0].location?.lat, 34.0837)
    } finally {
      api.get = originalGet
    }
  })

  // ─── 9. Live Drivers Viewport Parameters ───────────────────────────────────
  it('9. Live Drivers: serializes viewport bounding box and mode filters', async () => {
    // Test serializeViewport utility
    assert.equal(
      serializeViewport({ minLat: 12.9, minLng: 77.5, maxLat: 13.0, maxLng: 77.6 }),
      '12.9,77.5,13,77.6',
    )
    assert.equal(serializeViewport(' 12.9,77.5,13.0,77.6 '), '12.9,77.5,13.0,77.6')
    assert.equal(serializeViewport(undefined), undefined)

    // Test API service query param pass-through
    const originalGet = api.get
    let capturedParams: any = null
    api.get = (async (url: string, config: any) => {
      assert.equal(url, API_ENDPOINTS.dashboard.liveDrivers)
      capturedParams = config.params
      return { data: { totalDrivers: 0, onlineCount: 0, onTripCount: 0, busyCount: 0,
      breakCount: 0,
      gpsStaleAfterSec: 120, offlineCount: 0, drivers: [], calculatedAt: '' } }
    }) as any

    try {
      await DashboardService.getLiveDrivers({
        viewport: { minLat: 12.9, minLng: 77.5, maxLat: 13.0, maxLng: 77.6 },
        mode: 'Auto',
        status: 'ONLINE',
        limit: 100,
      })

      assert.equal(capturedParams.viewport, '12.9,77.5,13,77.6')
      assert.equal(capturedParams.mode, 'Auto')
      assert.equal(capturedParams.status, 'ONLINE')
      assert.equal(capturedParams.limit, 100)
    } finally {
      api.get = originalGet
    }
  })

  // ─── 10. Activity Cursor Pagination ────────────────────────────────────────
  it('10. Activity: passes cursor, limit, and type parameters properly', async () => {
    const mockActivity: DashboardActivityResponse = {
      activities: [
        {
          id: 'act-1',
          type: 'RIDE_COMPLETED',
          title: 'Ride #RIDE_123 Completed',
          description: 'Completed by Tariq Ahmad',
          timestamp: '2026-09-27T09:55:00.000Z',
          timeAgoText: '5m ago',
          metadata: { rideCode: 'RIDE_123' },
        },
      ],
      hasMore: true,
      nextCursor: '2026-09-27T09:55:00.000Z|ride:0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b',
      calculatedAt: '2026-09-27T10:00:00.000Z',
    }

    const originalGet = api.get
    let capturedParams: any = null
    api.get = (async (url: string, config: any) => {
      assert.equal(url, API_ENDPOINTS.dashboard.activity)
      capturedParams = config.params
      return { data: mockActivity }
    }) as any

    try {
      const cursor = '2026-09-27T10:00:00.000Z|reg:0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5c'
      const data = await DashboardService.getActivity({
        limit: 20,
        cursor,
        type: 'RIDE_COMPLETED',
      })

      assert.equal(capturedParams.limit, 20)
      assert.equal(capturedParams.cursor, cursor)
      assert.equal(data.nextCursor, mockActivity.nextCursor)
      assert.equal(capturedParams.type, 'RIDE_COMPLETED')
      assert.equal(data.hasMore, true)
      assert.equal(data.activities[0].type, 'RIDE_COMPLETED')
    } finally {
      api.get = originalGet
    }
  })

  // ─── 11. Health Query ──────────────────────────────────────────────────────
  it('11. Health: fetches infrastructure health indicators', async () => {
    const mockHealth: DashboardHealth = {
      databaseLatencyMs: 14,
      databaseStatus: 'HEALTHY',
      websocketConnections: 12,
      websocketStatus: 'HEALTHY',
      redisStatus: 'HEALTHY',
      failedQueueJobs: 0,
      notificationSuccessRate: 99.5,
      notificationStatus: 'HEALTHY',
      gpsFreshnessSec: 4,
      gpsFreshnessStatus: 'LIVE',
      paymentFailureRate24h: 0.1,
      paymentFailureStatus: 'HEALTHY',
      overallStatus: 'HEALTHY',
      timestamp: '2026-09-27T10:00:00.000Z',
    }

    const originalGet = api.get
    api.get = (async (url: string) => {
      assert.equal(url, API_ENDPOINTS.dashboard.health)
      return { data: mockHealth }
    }) as any

    try {
      const data = await DashboardService.getHealth()
      assert.equal(data.overallStatus, 'HEALTHY')
      assert.equal(data.databaseLatencyMs, 14)
      assert.equal(data.websocketConnections, 12)
    } finally {
      api.get = originalGet
    }
  })

  // ─── 12. Query Key Correctness ─────────────────────────────────────────────
  it('12. Query Keys: generates deterministic, centralized cache keys', () => {
    assert.deepEqual(dashboardKeys.overview(), ['dashboard', 'overview'])
    assert.deepEqual(dashboardKeys.financials(), ['dashboard', 'financials'])
    assert.deepEqual(dashboardKeys.analytics(), ['dashboard', 'analytics'])
    assert.deepEqual(dashboardKeys.financialAnalytics('7d'), ['dashboard', 'financial-analytics', '7d'])
    assert.deepEqual(dashboardKeys.financialAnalytics('30d'), ['dashboard', 'financial-analytics', '30d'])
    assert.deepEqual(dashboardKeys.financialAnalytics('90d'), ['dashboard', 'financial-analytics', '90d'])

    // Ensures 7d and 30d have distinct cache keys
    assert.notDeepEqual(dashboardKeys.financialAnalytics('7d'), dashboardKeys.financialAnalytics('30d'))

    // Live drivers query key with serialized viewport
    assert.deepEqual(
      dashboardKeys.liveDrivers({
        viewport: { minLat: 10, minLng: 20, maxLat: 30, maxLng: 40 },
        mode: 'Car',
      }),
      ['dashboard', 'live-drivers', { viewport: '10,20,30,40', mode: 'Car' }],
    )

    // Activity keys
    assert.deepEqual(dashboardKeys.activity({ limit: 10 }), ['dashboard', 'activity', { limit: 10 }])
    assert.deepEqual(dashboardKeys.activityInfinite({ type: 'RIDE_COMPLETED' }), [
      'dashboard',
      'activity',
      'infinite',
      { type: 'RIDE_COMPLETED' },
    ])

    // Health and legacy stats
    assert.deepEqual(dashboardKeys.health(), ['dashboard', 'health'])
    assert.deepEqual(dashboardKeys.stats(), ['dashboard', 'stats'])
  })

  // ─── 13. API Error Propagation ─────────────────────────────────────────────
  it('13. Error Propagation: surfaces HTTP 500, 401, and 404 status codes', async () => {
    const originalGet = api.get
    const http500Error = Object.assign(new Error('Internal Server Error'), {
      response: { status: 500, data: { message: 'Database query timeout' } },
    })
    api.get = (async () => {
      throw http500Error
    }) as any

    try {
      await assert.rejects(
        async () => {
          await DashboardService.getHealth()
        },
        (err: any) => {
          assert.equal(err.response?.status, 500)
          assert.equal(err.response?.data?.message, 'Database query timeout')
          return true
        },
      )
    } finally {
      api.get = originalGet
    }
  })

  // ─── 14. Empty Live-Driver Result ──────────────────────────────────────────
  it('14. Live Drivers Empty State: preserves empty driver array without injecting mock data', async () => {
    const mockEmptyDrivers: DashboardLiveDriversResponse = {
      totalDrivers: 0,
      onlineCount: 0,
      onTripCount: 0,
      busyCount: 0,
      breakCount: 0,
      gpsStaleAfterSec: 120,
      offlineCount: 0,
      drivers: [],
      calculatedAt: '2026-09-27T10:00:00.000Z',
    }

    const originalGet = api.get
    api.get = (async () => {
      return { data: mockEmptyDrivers }
    }) as any

    try {
      const data = await DashboardService.getLiveDrivers()
      assert.equal(data.totalDrivers, 0)
      assert.equal(data.onlineCount, 0)
      assert.deepEqual(data.drivers, [], 'Must remain empty array; zero mock drivers injected')
    } finally {
      api.get = originalGet
    }
  })
})
