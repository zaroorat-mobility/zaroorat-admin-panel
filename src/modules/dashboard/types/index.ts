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

