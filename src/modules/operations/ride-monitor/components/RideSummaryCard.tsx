import React from 'react'
import type { Ride } from '../types'
import { Card, CardContent } from '@/shared/components/ui/Card'
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
    { label: 'Live Rides', value: live, icon: <Activity className="h-4 w-4" />, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20' },
    { label: 'Searching', value: searching, icon: <Search className="h-4 w-4" />, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/20' },
    { label: 'Assigned', value: assigned, icon: <ShieldAlert className="h-4 w-4" />, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20' },
    { label: 'In Progress', value: inProgress, icon: <Navigation className="h-4 w-4" />, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' },
    { label: 'Payment Pending', value: paymentPending, icon: <CreditCard className="h-4 w-4" />, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20' },
    { label: 'Completed Today', value: completedToday, icon: <CheckSquare className="h-4 w-4" />, color: 'text-slate-650 bg-slate-50 dark:bg-slate-900/50' },
    { label: 'Cancelled Today', value: cancelledToday, icon: <XOctagon className="h-4 w-4" />, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/20' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-left">
      {items.map((item, idx) => (
        <Card key={idx} className="premium-card">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider line-clamp-1">{item.label}</span>
              <span className={`p-1 rounded ${item.color}`}>{item.icon}</span>
            </div>
            <p className="text-xl font-black text-slate-850 dark:text-white tracking-tight">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default RideSummaryCard
