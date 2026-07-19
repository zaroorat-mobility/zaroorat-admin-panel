import React from 'react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { DollarSign, ShieldAlert, CheckCircle2 } from 'lucide-react'

interface RefundAmountCardProps {
  requestedAmount: number
  approvedAmount?: number
  status: string
}

export const RefundAmountCard: React.FC<RefundAmountCardProps> = ({
  requestedAmount,
  approvedAmount,
  status
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
      <Card className="premium-card">
        <CardContent className="p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Refund Requested</span>
            <span className="p-1 rounded bg-blue-50 text-blue-600 dark:bg-blue-950/20"><DollarSign className="h-4 w-4" /></span>
          </div>
          <p className="text-xl font-black text-slate-850 dark:text-white font-mono">₹{requestedAmount.toFixed(2)}</p>
        </CardContent>
      </Card>

      <Card className="premium-card">
        <CardContent className="p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Refund Approved</span>
            <span className="p-1 rounded bg-purple-50 text-purple-600 dark:bg-purple-950/20"><CheckCircle2 className="h-4 w-4" /></span>
          </div>
          <p className="text-xl font-black text-slate-850 dark:text-white font-mono">
            {approvedAmount !== undefined ? `₹${approvedAmount.toFixed(2)}` : 'Pending Approval'}
          </p>
        </CardContent>
      </Card>

      <Card className="premium-card">
        <CardContent className="p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Settlement Stage</span>
            <span className="p-1 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20"><ShieldAlert className="h-4 w-4" /></span>
          </div>
          <p className="text-xl font-black text-slate-850 dark:text-white uppercase tracking-tight">
            {status}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default RefundAmountCard
