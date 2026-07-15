import { useQuery } from '@tanstack/react-query'
import DashboardService from '../services'
import type { DashboardData } from '../types'

/**
 * Custom Query Hook for dashboard statistics
 */
export const useDashboardData = () => {
  return useQuery<DashboardData, Error>({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => DashboardService.getDashboardData(),
    placeholderData: {
      stats: {
        activeDrivers: 142,
        activeRiders: 980,
        ongoingRides: 87,
        pendingVerifications: 12,
      },
      earningTrend: [
        { date: 'Mon', earnings: 12000, ridesCount: 150 },
        { date: 'Tue', earnings: 15000, ridesCount: 180 },
        { date: 'Wed', earnings: 14000, ridesCount: 170 },
        { date: 'Thu', earnings: 18000, ridesCount: 210 },
        { date: 'Fri', earnings: 22000, ridesCount: 260 },
        { date: 'Sat', earnings: 25000, ridesCount: 300 },
        { date: 'Sun', earnings: 20000, ridesCount: 240 },
      ],
    },
  })
}
