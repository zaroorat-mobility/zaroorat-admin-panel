import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRefund, useApproveRefund, useRejectRefund } from '../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { Save, AlertCircle, ShieldAlert } from 'lucide-react'

export const RefundReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: request, isLoading, isError } = useRefund(id || '')
  const { mutate: approve, isPending: isApproving } = useApproveRefund()
  const { mutate: reject, isPending: isRejecting } = useRejectRefund()

  // Form decision states
  const [decision, setDecision] = useState<'approve' | 'reject'>('approve')
  const [approvedAmount, setApprovedAmount] = useState<number>(0)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  // Initialize once loaded
  React.useEffect(() => {
    if (request) {
      setApprovedAmount(request.requestedAmount)
    }
  }, [request])

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center p-12 text-slate-500 font-medium">
          Loading review board...
        </div>
      </PageWrapper>
    )
  }

  if (isError || !request) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center p-12 text-rose-500 font-medium">
          <p>Failed to find refund details.</p>
          <button onClick={() => navigate('/financial-operations/refunds')} className="text-xs underline mt-2 text-slate-650">Back to list</button>
        </div>
      </PageWrapper>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!notes.trim()) {
      setError('Justification notes / explanation notes are required.')
      return
    }

    if (decision === 'approve') {
      if (approvedAmount <= 0) {
        setError('Approved amount must be greater than zero.')
        return
      }
      if (approvedAmount > request.requestedAmount) {
        setError('Approved amount cannot exceed requested amount limit.')
        return
      }

      approve(
        {
          id: request.id,
          approvedAmount,
          notes,
          reviewerName: 'Finance Analyst B'
        },
        {
          onSuccess: () => navigate(`/financial-operations/refunds/${request.id}`)
        }
      )
    } else {
      reject(
        {
          id: request.id,
          reason: notes,
          reviewerName: 'Finance Analyst B'
        },
        {
          onSuccess: () => navigate(`/financial-operations/refunds/${request.id}`)
        }
      )
    }
  }

  const isEscalated = decision === 'approve' && approvedAmount > 500

  return (
    <PageWrapper>
      <PageHeader
        title={`Review Refund Request: #${request.refundId}`}
        description="Verify financial calculations, validate transaction references, and submit approvals."
        onBack={() => navigate(`/financial-operations/refunds/${request.id}`)}
      />

      <form onSubmit={handleSubmit} className="space-y-6 text-left max-w-3xl mt-4">
        <Card className="premium-card">
          <CardContent className="p-6 space-y-4 text-xs">
            
            <div className="border-b pb-3 mb-2">
              <h3 className="font-bold text-slate-800 text-sm">Operator Assessment Form</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Submit decision details. Finance review required for values &gt; ₹500.</p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {/* Request Summary Read-only */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border rounded-xl space-y-1.5 font-sans leading-relaxed text-slate-650">
              <p><strong className="text-slate-800">Rider / Passenger:</strong> {request.riderName}</p>
              <p><strong className="text-slate-800">Requested Amount:</strong> ₹{request.requestedAmount.toFixed(2)}</p>
              <p><strong className="text-slate-800">Justification:</strong> "{request.reason}"</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase">Review Action Decision</label>
                <select
                  value={decision}
                  onChange={(e) => setDecision(e.target.value as 'approve' | 'reject')}
                  className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none h-[34px]"
                >
                  <option value="approve">Approve Refund Request</option>
                  <option value="reject">Reject Refund Request</option>
                </select>
              </div>

              {decision === 'approve' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Approved Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    max={request.requestedAmount}
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none h-[34px]"
                  />
                </div>
              )}
            </div>

            {isEscalated && (
              <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-100 dark:bg-purple-950/20 dark:border-purple-900 text-[10px] text-purple-700 leading-normal flex gap-2 font-medium">
                <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">FINANCE ESCALATION TRIGGERED</strong>
                  <p className="mt-0.5">
                    Because the approved amount exceeds ₹500.00, this approval will require final authorization signature from a Finance Admin Manager.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase">
                {decision === 'approve' ? 'Approval notes / justication detail' : 'Rejection Reason Explanation'}
              </label>
              <textarea
                required
                rows={3}
                placeholder="Spoke to ride telemetry support, verified distance surcharge mistake. Refunding extra ₹70.00..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/financial-operations/refunds/${request.id}`)}
                className="h-9 px-4 text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isApproving || isRejecting}
                className={`h-9 px-4 text-xs font-semibold text-white ${
                  decision === 'approve' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                <Save className="h-4 w-4 mr-1.5" />
                <span>Confirm {decision === 'approve' ? 'Approval' : 'Rejection'}</span>
              </Button>
            </div>

          </CardContent>
        </Card>
      </form>
    </PageWrapper>
  )
}

export default RefundReviewPage
