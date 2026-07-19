import React from 'react'
import type { RefundStatus } from '../types'

interface RefundStatusBadgeProps {
  status: RefundStatus
}

export const RefundStatusBadge: React.FC<RefundStatusBadgeProps> = ({ status }) => {
  const getStyles = (state: RefundStatus) => {
    switch (state) {
      case 'requested':
        return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900 animate-pulse font-bold'
      case 'under_review':
        return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900'
      case 'approved':
        return 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900 font-bold'
      case 'processing':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900 animate-pulse'
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900 font-semibold'
      default:
        return 'bg-slate-50 text-slate-500 border-slate-100'
    }
  }

  const label = status.replace(/_/g, ' ')

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${getStyles(status)}`}>
      {label}
    </span>
  )
}

export default RefundStatusBadge
