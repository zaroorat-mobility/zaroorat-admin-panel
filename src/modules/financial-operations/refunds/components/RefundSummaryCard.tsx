import React from 'react'
import type { RefundRequest } from '../types'
import { Card, CardHeader, CardContent } from '@/shared/components/ui/Card'
import { FileText, User, Calendar, Tag, ShieldCheck } from 'lucide-react'

interface RefundSummaryCardProps {
  request: RefundRequest
}

export const RefundSummaryCard: React.FC<RefundSummaryCardProps> = ({ request }) => {
  return (
    <Card className="premium-card text-left text-xs">
      <CardHeader className="pb-3 border-b border-border">
        <h3 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span>Refund Request Summary</span>
        </h3>
      </CardHeader>
      
      <CardContent className="p-4 space-y-3 font-medium">
        <div className="flex justify-between">
          <span className="text-slate-500 flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-slate-400" />
            <span>Refund Reference:</span>
          </span>
          <strong className="text-slate-800 dark:text-white font-mono">{request.refundId}</strong>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-500 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <span>Rider / Passenger:</span>
          </span>
          <strong className="text-slate-800 dark:text-white">{request.riderName}</strong>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-500 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>Requested Date:</span>
          </span>
          <strong className="text-slate-800 dark:text-white font-mono">
            {new Date(request.requestedAt).toLocaleString('en-IN')}
          </strong>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
            <span>Approval Level Required:</span>
          </span>
          <strong className={`uppercase px-2 py-0.5 rounded text-[9px] font-black tracking-wider ${
            request.approvalLevel === 'finance'
              ? 'bg-rose-50 text-rose-700 border border-rose-100'
              : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
          }`}>
            {request.approvalLevel} tier
          </strong>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-500 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-slate-400" />
            <span>Origin Origin Source:</span>
          </span>
          <strong className="text-slate-800 dark:text-white uppercase font-mono text-[10px]">
            {request.refundSource}
          </strong>
        </div>
      </CardContent>
    </Card>
  )
}

export default RefundSummaryCard
