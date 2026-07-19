import React from 'react'
import type { SettlementStatus } from '../types'

interface Props { status: SettlementStatus }

export const SettlementStatusBadge: React.FC<Props> = ({ status }) => {
  const styles: Record<SettlementStatus, string> = {
    draft: 'bg-slate-50 text-slate-600 border-slate-200',
    pending: 'bg-blue-50 text-blue-700 border-blue-100 animate-pulse font-bold',
    processing: 'bg-indigo-50 text-indigo-700 border-indigo-100 animate-pulse',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    failed: 'bg-rose-50 text-rose-700 border-rose-100 font-bold'
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${styles[status]}`}>
      {status}
    </span>
  )
}

export default SettlementStatusBadge
