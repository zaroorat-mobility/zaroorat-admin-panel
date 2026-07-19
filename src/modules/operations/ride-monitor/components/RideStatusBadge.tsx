import React from 'react'
import type { RideStatus } from '../types'

interface RideStatusBadgeProps {
  status: RideStatus
}

export const RideStatusBadge: React.FC<RideStatusBadgeProps> = ({ status }) => {
  const getStyles = (state: RideStatus) => {
    switch (state) {
      case 'REQUESTED':
        return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-450 dark:border-blue-900'
      case 'SEARCHING':
        return 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900 animate-pulse'
      case 'DRIVER_ASSIGNED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900'
      case 'DRIVER_ARRIVED':
        return 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900'
      case 'OTP_VERIFIED':
      case 'IN_PROGRESS':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900 font-bold'
      case 'PAYMENT_PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900'
      case 'COMPLETED':
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
      case 'CANCELLED_BY_RIDER':
      case 'CANCELLED_BY_DRIVER':
      case 'NO_DRIVER_FOUND':
      case 'RIDER_NO_SHOW':
        return 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900'
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-900 dark:text-slate-400'
    }
  }

  const label = status.replace(/_/g, ' ')

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${getStyles(status)}`}>
      {label}
    </span>
  )
}

export default RideStatusBadge
