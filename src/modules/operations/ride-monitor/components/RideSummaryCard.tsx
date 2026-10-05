import React from 'react'
import type { Ride } from '../types'
import { InfoCard } from '@/shared/components/InfoCard'
import { Activity, Search, ShieldAlert, Navigation, CreditCard, CheckSquare, XOctagon } from 'lucide-react'

interface RideSummaryCardProps {
  rides: Ride[]
}

export const RideSummaryCard: React.FC<RideSummaryCardProps> = ({ rides }) => {
  // Funnel calculations
  const live = rides.filter(r => ['REQUESTED', 'SEARCHING', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVED', 'OTP_VERIFIED', 'IN_PROGRESS'].includes(r.status)).length
  const searching = rides.filter(r => r.status === 'SEARCHING' || r.status === 'REQUESTED').length
  const assigned = rides.filter(r => r.status === 'DRIVER_ASSIGNED' || r.status === 'DRIVER_ARRIVED').length
  const inProgress = rides.filter(r => r.status === 'IN_PROGRESS' || r.status === 'OTP_VERIFIED').length
  const paymentPending = rides.filter(r => r.status === 'PAYMENT_PENDING').length
  
  // Today's boundaries
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  
  const completedToday = rides.filter(r => 
    r.status === 'COMPLETED' && 
    new Date(r.updatedAt).getTime() >= startOfToday.getTime()
  ).length

  const cancelledToday = rides.filter(r => 
    ['CANCELLED_BY_RIDER', 'CANCELLED_BY_DRIVER', 'NO_DRIVER_FOUND', 'RIDER_NO_SHOW'].includes(r.status) &&
    new Date(r.updatedAt).getTime() >= startOfToday.getTime()
  ).length

  const items = [
    { label: 'Live Rides', value: live, icon: <Activity className="w-5 h-5" />, variant: 'blue' as const },
    { label: 'Searching', value: searching, icon: <Search className="w-5 h-5" />, variant: 'blue' as const },
    { label: 'Assigned', value: assigned, icon: <ShieldAlert className="w-5 h-5" />, variant: 'blue' as const },
    { label: 'In Progress', value: inProgress, icon: <Navigation className="w-5 h-5" />, variant: 'blue' as const },
    { label: 'Payment Pending', value: paymentPending, icon: <CreditCard className="w-5 h-5" />, variant: 'blue' as const },
    { label: 'Completed Today', value: completedToday, icon: <CheckSquare className="w-5 h-5" />, variant: 'blue' as const },
    { label: 'Cancelled Today', value: cancelledToday, icon: <XOctagon className="w-5 h-5" />, variant: 'red' as const },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-left">
      {items.map((item, idx) => (
        <InfoCard
          key={idx}
          label={item.label}
          value={item.value}
          icon={item.icon}
          variant={item.variant}
        />
      ))}
    </div>
  )
}

export default RideSummaryCard
