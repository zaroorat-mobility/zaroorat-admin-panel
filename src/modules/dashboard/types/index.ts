/**
 * Operations Dashboard Frontend Type Definitions
 *
 * Strict TypeScript models matching the Zaroorat backend DTO contracts exactly.
 * Aligns with PostgreSQL aggregations, telemetry streams, event sourcing, and health probes.
 */

// ─── 1. Overview Types ────────────────────────────────────────────────────────

// Mirrors backend dashboard.dto.ts. A value the backend could not measure or
// compare is null. "Yesterday" means yesterday up to the same IST time of day.

export interface DashboardOverview {
  /** Total on-duty drivers (ONLINE + ON_TRIP + BUSY + BREAK) */
  activeDrivers: number
  /** % change vs drivers on duty at the same time yesterday; null without a baseline */
  activeDriversChangePct: number | null
  /** Total drivers currently available for instant dispatch (status = ONLINE) */
  onlineDrivers: number
  /** Percentage of active drivers currently in ONLINE state */
  onlineDriversPctOfActive: number
  /** Total ongoing ride transactions in progress (ACCEPTED..IN_PROGRESS) */
  ongoingRides: number
  /** % change vs rides ongoing at the same time yesterday; null without a baseline */
  ongoingRidesChangePct: number | null
  /** Unique riders currently in-flight (searching or on trip) */
  inFlightRiders: number
  /** Rides completed today so far (IST) */
  completedRidesToday: number
  /** Rides completed yesterday up to the same IST time of day */
  completedRidesYesterday: number
  /** % change vs yesterday at the same time; null without a baseline */
  completedRidesChangePct: number | null
  /** Drivers awaiting verification (PENDING + DOCUMENT_REVIEW) */
  pendingVerifications: number
  /** Always null: no verification history exists to compare with */
  pendingVerificationsChangePct: number | null
  /** Registered driver accounts, excluding deleted drivers */
  registeredDrivers: number
  /** Timestamp when the overview snapshot was calculated */
  calculatedAt: string
}

// ─── 2. Financials Types ──────────────────────────────────────────────────────

export interface DashboardFinancials {
  /** Platform revenue today (ledger posting date): Subscriptions + Commission + Platform Fees */
  platformRevenueToday: number
  /** Platform revenue yesterday up to the same IST time of day */
  platformRevenueYesterday: number
  /** % change vs yesterday at the same time; null without a baseline */
  platformRevenueChangePct: number | null

  /** Gross ride value today: fares of rides completed today so far */
  grossRideValueToday: number
  /** Gross ride value yesterday up to the same IST time of day */
  grossRideValueYesterday: number
  /** % change vs yesterday at the same time; null without a baseline */
  grossRideValueChangePct: number | null

  /**
   * Driver ride collections today: Gross Ride Value minus the commission and
   * platform-fee legs of those rides. Subscriptions are NOT deducted. May be negative.
   */
  driverRideCollectionsToday: number
  /** Driver ride collections yesterday up to the same IST time of day */
  driverRideCollectionsYesterday: number
  /** % change vs yesterday at the same time; null without a baseline */
  driverRideCollectionsChangePct: number | null

  /** Currency symbol / ISO code */
  currency: string
  /** Timezone used for daily cutoff */
  reportingTimeZone: string
  /** Timestamp of calculation */
  calculatedAt: string
}

// ─── 3. Analytics Types ───────────────────────────────────────────────────────

export type AnalyticsRange = '7d' | '30d' | '90d'

export interface PlatformRevenueTrend {
  date: string // e.g. "Sep 23, 2026"
  dayOfWeek: string // e.g. "Wed"
  dateKey: string // e.g. "2026-09-23"
  platformRevenue: number
  rideCommission: number
  subscriptionRevenue: number
  platformFees: number
}
export type PlatformRevenueTrendPoint = PlatformRevenueTrend

export interface GrossRideValueTrend {
  date: string // e.g. "Sep 23, 2026"
  dayOfWeek: string // e.g. "Wed"
  dateKey: string // e.g. "2026-09-23"
  grossRideValue: number
  ridesCount: number
}
export type GrossRideValueTrendPoint = GrossRideValueTrend

/**
 * Outcomes of today's demand: rides accepted today by current status, plus
 * requests that expired with no driver accepting (noDriversFound).
 */
export interface RideStatusDistribution {
  total: number
  completed: number
  completedPct: number
  cancelled: number
  cancelledPct: number
  noDriversFound: number
  noDriversFoundPct: number
  ongoing: number
  ongoingPct: number
}

export interface RideHourDistribution {
  hour: number // 0..23
  label: string // e.g. "12 AM", "4 PM"
  count: number
  isPeak: boolean
}
export type RideHourBucket = RideHourDistribution

/** GET /dashboard/analytics (operations:read): today's operational analytics (IST). */
export interface DashboardAnalytics {
  rideStatusDistribution: RideStatusDistribution
  ridesByHour: RideHourDistribution[]
  periodStart: string
  periodEnd: string
  reportingTimeZone: string
  calculatedAt: string
}

/** GET /dashboard/financial-analytics (finance:read): daily financial series for the range. */
export interface DashboardFinancialAnalytics {
  range: AnalyticsRange
  platformRevenueTrend: PlatformRevenueTrend[]
  grossRideValueTrend: GrossRideValueTrend[]
  reportingTimeZone: string
  calculatedAt: string
}

// ─── 4. Live Drivers Types ───────────────────────────────────────────────────

export interface LiveDriverVehicle {
  id: string | null
  licensePlate: string | null
  model: string | null
  typeCode: string
  typeName: string
}

export interface LiveDriverLocation {
  lat: number
  lng: number
  address?: string | null
}

export interface ActiveTrip {
  id: string
  rideCode: string
  status: string
}

/**
 * LIVE / STALE: on-duty driver whose last fix is within / older than the dispatch
 * staleness threshold (gpsStaleAfterSec). OFFLINE: off duty. UNKNOWN: on duty, no fix.
 */
export type GpsFreshness = 'LIVE' | 'STALE' | 'OFFLINE' | 'UNKNOWN'

export interface LiveDriver {
  id: string
  driverNumber: string
  fullName: string
  phoneNumber: string
  avatarUrl: string | null
  status: 'ONLINE' | 'ON_TRIP' | 'BUSY' | 'BREAK' | 'OFFLINE'
  /** null when no vehicle is assigned */
  mode: 'Car' | 'Auto' | 'Bike' | null
  vehicle: LiveDriverVehicle | null
  location: LiveDriverLocation | null
  /** null when the fix carried no speed */
  speedKmh: number | null
  /** "N", "NE", …; null when the fix carried no heading */
  heading: string | null
  activeTrip: ActiveTrip | null
  recordedAt: string | null
  gpsFreshness: GpsFreshness
  gpsLagSeconds: number | null
  lastUpdateText: string
}

export interface LiveDriversViewport {
  minLat: number
  minLng: number
  maxLat: number
  maxLng: number
}

export interface LiveDriversParams {
  viewport?: LiveDriversViewport | string
  status?: 'ONLINE' | 'ON_TRIP' | 'BUSY' | 'BREAK' | 'OFFLINE'
  mode?: 'Car' | 'Auto' | 'Bike'
  limit?: number
}

export interface DashboardLiveDriversResponse {
  /** Non-deleted drivers; the sum of the five status counts */
  totalDrivers: number
  onlineCount: number
  onTripCount: number
  busyCount: number
  breakCount: number
  /** OFFLINE, including drivers who have never gone online */
  offlineCount: number
  /** GPS age (seconds) above which an on-duty driver is STALE */
  gpsStaleAfterSec: number
  /** On-duty drivers by default, freshest GPS first */
  drivers: LiveDriver[]
  calculatedAt: string
}

// ─── 5. Activity Timeline Types ──────────────────────────────────────────────

export type DashboardActivityType =
  | 'DRIVER_REGISTERED'
  | 'KYC_APPROVED'
  | 'DRIVER_VERIFIED'
  | 'DRIVER_REJECTED'
  | 'RIDE_COMPLETED'
  | 'RIDE_CANCELLED'
  | 'PAYMENT_SETTLED'
  | 'VEHICLE_ADDED'
  | 'HIGH_CANCELLATION_RATE'
  | 'SYSTEM_ALERT'
  | 'ADMIN_ACTION'

export type DashboardActivityMetadata = Record<string, unknown>

export interface DashboardActivity {
  id: string
  type: DashboardActivityType
  title: string
  description: string
  entityType?: 'driver' | 'ride' | 'vehicle' | 'payment' | 'system'
  entityId?: string
  actorName?: string
  timestamp: string // ISO 8601
  timeAgoText: string
  metadata?: DashboardActivityMetadata
}

export interface DashboardActivityParams {
  limit?: number
  cursor?: string
  type?: DashboardActivityType | string
}

export interface DashboardActivityResponse {
  activities: DashboardActivity[]
  hasMore: boolean
  /** Cursor for the next page; null on the last page */
  nextCursor: string | null
  calculatedAt: string
}

// ─── 6. System Health Types ──────────────────────────────────────────────────

export interface DashboardHealth {
  /** PostgreSQL `SELECT 1` round-trip; null when the probe failed */
  databaseLatencyMs: number | null
  databaseStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN'
  /** Socket.IO connections on the API instance that answered; null when unknown */
  websocketConnections: number | null
  websocketStatus: 'HEALTHY' | 'DOWN' | 'DISABLED' | 'UNAVAILABLE'
  redisStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN'
  /** Failed jobs retained by the queues; null when not measured */
  failedQueueJobs: number | null
  notificationSuccessRate: number | null
  notificationStatus: 'HEALTHY' | 'DEGRADED' | 'NO_DATA' | 'UNAVAILABLE'
  /** Age of the latest GPS fix from any on-duty driver; null with no data */
  gpsFreshnessSec: number | null
  gpsFreshnessStatus: 'LIVE' | 'STALE' | 'NO_DATA' | 'UNAVAILABLE'
  /** Failed share (%) of settled online payments in the last 24 h */
  paymentFailureRate24h: number | null
  paymentFailureStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'NO_DATA' | 'UNAVAILABLE'
  overallStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL'
  timestamp: string
}

// ─── Request Failure ─────────────────────────────────────────────────────────

/** HTTP status of a failed request, or why there is none (timeout, network failure). */
export type DashboardErrorStatus = number | 'timeout' | 'network'

// ─── Backward-Compatibility Aliases ──────────────────────────────────────────

export interface LiveStats {
  activeDrivers: number
  activeRiders: number // backward-compatibility alias for inFlightRiders
  inFlightRiders?: number
  ongoingRides: number
  pendingVerifications: number
}

export interface EarningStat {
  date: string
  platformRevenue: number
  earnings: number // backward-compatibility alias for platformRevenue
  rideCommission: number
  subscriptionRevenue: number
  platformFees: number
  grossRideValue: number
  ridesCount: number
}

export interface DashboardData {
  stats: LiveStats
  earningTrend: EarningStat[]
}
