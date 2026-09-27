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
        activeDrivers: 0,
        activeRiders: 0,
        inFlightRiders: 0,
        ongoingRides: 0,
        pendingVerifications: 0,
      },
      earningTrend: [
        { date: 'Mon', platformRevenue: 0, earnings: 0, rideCommission: 0, subscriptionRevenue: 0, platformFees: 0, grossRideValue: 0, ridesCount: 0 },
        { date: 'Tue', platformRevenue: 0, earnings: 0, rideCommission: 0, subscriptionRevenue: 0, platformFees: 0, grossRideValue: 0, ridesCount: 0 },
        { date: 'Wed', platformRevenue: 0, earnings: 0, rideCommission: 0, subscriptionRevenue: 0, platformFees: 0, grossRideValue: 0, ridesCount: 0 },
        { date: 'Thu', platformRevenue: 0, earnings: 0, rideCommission: 0, subscriptionRevenue: 0, platformFees: 0, grossRideValue: 0, ridesCount: 0 },
        { date: 'Fri', platformRevenue: 0, earnings: 0, rideCommission: 0, subscriptionRevenue: 0, platformFees: 0, grossRideValue: 0, ridesCount: 0 },
        { date: 'Sat', platformRevenue: 0, earnings: 0, rideCommission: 0, subscriptionRevenue: 0, platformFees: 0, grossRideValue: 0, ridesCount: 0 },
        { date: 'Sun', platformRevenue: 0, earnings: 0, rideCommission: 0, subscriptionRevenue: 0, platformFees: 0, grossRideValue: 0, ridesCount: 0 },
      ],
    },
  })
}

