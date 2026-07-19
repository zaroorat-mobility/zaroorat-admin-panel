import React from 'react'
import type { ComplaintStatus } from '../types'

interface ComplaintStatusBadgeProps {
  status: ComplaintStatus
}

export const ComplaintStatusBadge: React.FC<ComplaintStatusBadgeProps> = ({ status }) => {
  const getStyles = (state: ComplaintStatus) => {
    switch (state) {
      case 'open':
        return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900 animate-pulse font-bold'
      case 'assigned':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900 font-medium'
      case 'investigating':
        return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900 animate-pulse'
      case 'resolved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
      case 'closed':
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700'
      default:
        return 'bg-slate-50 text-slate-500 border-slate-100'
    }
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${getStyles(status)}`}>
      {status}
    </span>
  )
}

export default ComplaintStatusBadge
