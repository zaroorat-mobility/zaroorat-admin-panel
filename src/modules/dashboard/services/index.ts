import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type {
  DashboardOverview,
  DashboardFinancials,
  DashboardAnalytics,
  DashboardFinancialAnalytics,
  AnalyticsRange,
  DashboardLiveDriversResponse,
  LiveDriversParams,
  LiveDriversViewport,
  DashboardActivityResponse,
  DashboardActivityParams,
  DashboardHealth,
  DashboardData,
} from '../types'

/**
 * Serializes viewport boundary parameters into the comma-separated string format
 * expected by the backend (`minLat,minLng,maxLat,maxLng`).
 */
export function serializeViewport(viewport?: LiveDriversViewport | string): string | undefined {
  if (!viewport) return undefined
  if (typeof viewport === 'string') return viewport.trim()
  return `${viewport.minLat},${viewport.minLng},${viewport.maxLat},${viewport.maxLng}`
}

export const DashboardService = {
  /**
   * Fetch high-level operational overview KPIs and 24h comparisons
   * Requires permission: operations:read
   */
  async getOverview(): Promise<DashboardOverview> {
    const response = await api.get<DashboardOverview>(API_ENDPOINTS.dashboard.overview)
    return response.data
  },

  /**
   * Fetch operational financial performance, revenue, gross ride values, and collections
   * Requires permission: finance:read
   */
  async getFinancials(): Promise<DashboardFinancials> {
    const response = await api.get<DashboardFinancials>(API_ENDPOINTS.dashboard.financials)
    return response.data
  },

  /**
   * Fetch today's ride outcome distribution and rides by hour (IST)
   * Requires permission: operations:read
   */
  async getAnalytics(): Promise<DashboardAnalytics> {
    const response = await api.get<DashboardAnalytics>(API_ENDPOINTS.dashboard.analytics)
    return response.data
  },

  /**
   * Fetch daily platform revenue and gross ride value series for the range
   * Requires permission: finance:read
   */
  async getFinancialAnalytics(range: AnalyticsRange = '7d'): Promise<DashboardFinancialAnalytics> {
    const response = await api.get<DashboardFinancialAnalytics>(API_ENDPOINTS.dashboard.financialAnalytics, {
      params: { range },
    })
    return response.data
  },

  /**
   * Fetch live driver telemetries, active ride details, and GPS freshness
   * Supports bounding-box viewport and mode filters
   * Requires permission: operations:read
   */
  async getLiveDrivers(params: LiveDriversParams = {}): Promise<DashboardLiveDriversResponse> {
    const queryParams: Record<string, string | number> = {}

    if (params.viewport) {
      const vp = serializeViewport(params.viewport)
      if (vp) queryParams.viewport = vp
    }
    if (params.status) queryParams.status = params.status
    if (params.mode) queryParams.mode = params.mode
    if (params.limit !== undefined && params.limit > 0) queryParams.limit = params.limit

    const response = await api.get<DashboardLiveDriversResponse>(API_ENDPOINTS.dashboard.liveDrivers, {
      params: queryParams,
    })
    return response.data
  },

  /**
   * Fetch chronological operational activity feed (rides, driver approvals, KYC, alerts)
   * Supports cursor pagination
   * Requires permission: operations:read
   */
  async getActivity(params: DashboardActivityParams = {}): Promise<DashboardActivityResponse> {
    const queryParams: Record<string, string | number> = {}

    if (params.limit !== undefined && params.limit > 0) queryParams.limit = params.limit
    if (params.cursor) queryParams.cursor = params.cursor
    if (params.type) queryParams.type = params.type

    const response = await api.get<DashboardActivityResponse>(API_ENDPOINTS.dashboard.activity, {
      params: queryParams,
    })
    return response.data
  },

  /**
   * Fetch real-time system infrastructure health probes (DB, Redis, WS, GPS, Notifications)
   * Requires permission: operations:read
   */
  async getHealth(): Promise<DashboardHealth> {
    const response = await api.get<DashboardHealth>(API_ENDPOINTS.dashboard.health)
    return response.data
  },

  /**
   * Backward-compatibility method fetching legacy stats and 7d earning trend
   */
  async getDashboardData(): Promise<DashboardData> {
    const response = await api.get<DashboardData>(API_ENDPOINTS.dashboard.stats)
    return response.data
  },
}

export default DashboardService
