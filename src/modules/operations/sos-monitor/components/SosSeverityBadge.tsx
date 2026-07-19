import React from 'react'
import type { SosPriority } from '../types'

interface SosSeverityBadgeProps {
  priority: SosPriority
}

export const SosSeverityBadge: React.FC<SosSeverityBadgeProps> = ({ priority }) => {
  const getStyles = (level: SosPriority) => {
    switch (level) {
      case 'critical':
        return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400'
      case 'high':
        return 'bg-red-50 text-red-650 border-red-100 dark:bg-red-950/20 dark:text-red-400'
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400'
      case 'low':
        return 'bg-slate-100 text-slate-650 border-slate-200 dark:bg-slate-800'
      default:
        return 'bg-slate-50 text-slate-500 border-slate-100'
    }
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${getStyles(priority)}`}>
      {priority}
    </span>
  )
}

export default SosSeverityBadge
