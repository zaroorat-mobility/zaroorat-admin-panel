import React from 'react'
import type { RefundRequest } from '../types'
import { Card, CardHeader, CardContent } from '@/shared/components/ui/Card'
import { ShieldCheck, User, Calendar, CheckSquare } from 'lucide-react'

interface RefundApprovalPanelProps {
  request: RefundRequest
}

export const RefundApprovalPanel: React.FC<RefundApprovalPanelProps> = ({ request }) => {
  return (
    <Card className="premium-card text-left text-xs space-y-4">
      <CardHeader className="pb-3 border-b border-border">
        <h3 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Approval & Settlement Trail</span>
        </h3>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        
        {/* Tier criteria warning */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl leading-normal text-[10px] text-slate-500">
          <p>
            <strong className="font-bold text-slate-700">Approval Tier Rules:</strong><br />
            - Amounts <strong className="font-bold">≤ ₹500.00</strong> require basic Support Agent clearance.<br />
            - Amounts <strong className="font-bold">&gt; ₹500.00</strong> require Finance Manager escalation.
          </p>
        </div>

        {/* Review Stage */}
        <div className="space-y-2 border-b pb-3 border-border">
          <p className="font-bold text-slate-800 dark:text-slate-150 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
            <CheckSquare className="h-3.5 w-3.5 text-indigo-500" />
            <span>1. Review Stage</span>
          </p>
          {request.reviewedAt ? (
            <div className="space-y-1.5 font-medium pl-5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Reviewer:</span>
                <span className="text-slate-800 dark:text-white flex items-center gap-1 font-bold">
                  <User className="h-3 w-3 text-slate-400" />
                  {request.reviewedBy}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reviewed Date:</span>
                <span className="text-slate-800 dark:text-white font-mono flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  {new Date(request.reviewedAt).toLocaleDateString('en-IN')}
                </span>
              </div>
              {request.approvedAmount !== undefined && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Approved Value:</span>
                  <strong className="text-primary font-mono">₹{request.approvedAmount.toFixed(2)}</strong>
                </div>
              )}
              {request.notes && (
                <div className="space-y-0.5">
                  <span className="text-slate-500">Reviewer Notes:</span>
                  <p className="text-slate-600 italic">"{request.notes}"</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-400 italic pl-5 font-semibold text-[10px]">Pending operator review logs.</p>
          )}
        </div>

        {/* Payout Stage */}
        <div className="space-y-2">
          <p className="font-bold text-slate-800 dark:text-slate-150 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
            <CheckSquare className="h-3.5 w-3.5 text-indigo-500" />
            <span>2. Payout Stage</span>
          </p>
          {request.processedAt ? (
            <div className="space-y-1.5 font-medium pl-5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Processor:</span>
                <span className="text-slate-800 dark:text-white flex items-center gap-1 font-bold">
                  <User className="h-3 w-3 text-slate-400" />
                  {request.processedBy}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Processing Date:</span>
                <span className="text-slate-800 dark:text-white font-mono flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  {new Date(request.processedAt).toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 italic pl-5 font-semibold text-[10px]">Pending payout settlement logs.</p>
          )}
        </div>

      </CardContent>
    </Card>
  )
}

export default RefundApprovalPanel
