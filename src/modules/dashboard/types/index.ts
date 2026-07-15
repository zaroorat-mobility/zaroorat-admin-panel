export interface LiveStats {
  activeDrivers: number
  activeRiders: number
  ongoingRides: number
  pendingVerifications: number
}

export interface EarningStat {
  date: string
  earnings: number
  ridesCount: number
}

export interface DashboardData {
  stats: LiveStats
  earningTrend: EarningStat[]
}
