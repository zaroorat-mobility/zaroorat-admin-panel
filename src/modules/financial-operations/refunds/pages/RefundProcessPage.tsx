import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRefund, useMarkRefundProcessing, useMarkRefundCompleted } from '../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { CreditCard, CheckCircle2, ArrowRight } from 'lucide-react'

export const RefundProcessPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: request, isLoading, isError, refetch } = useRefund(id || '')
  const { mutate: markProcessing, isPending: isMarkingProcessing } = useMarkRefundProcessing()
  const { mutate: markCompleted, isPending: isMarkingCompleted } = useMarkRefundCompleted()

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center p-12 text-slate-500 font-medium">
          Loading payment board...
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

  const handleMarkProcessing = () => {
    markProcessing(
      { id: request.id, processorName: 'Finance Supervisor A' },
      {
        onSuccess: () => refetch()
      }
    )
  }

  const handleMarkCompleted = () => {
    markCompleted(
      { id: request.id, processorName: 'Finance Supervisor A' },
      {
        onSuccess: () => navigate(`/financial-operations/refunds/${request.id}`)
      }
    )
  }

  return (
    <PageWrapper>
      <PageHeader
        title={`Process Refund Settlement: #${request.refundId}`}
        description="Verify gateway payout settlement reference batch codes and update ledger registers."
        onBack={() => navigate(`/financial-operations/refunds/${request.id}`)}
      />

      <div className="space-y-6 text-left max-w-3xl mt-4">
        <Card className="premium-card">
          <CardContent className="p-6 space-y-5 text-xs font-medium">
            
            <div className="border-b pb-3 mb-2">
              <h3 className="font-bold text-slate-800 text-sm">Payout Settlement Workflow</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Transition the approved value through gateway processing steps.</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 border rounded-xl space-y-2 text-slate-650">
              <p><strong className="text-slate-800">Passenger / Rider:</strong> {request.riderName}</p>
              <p><strong className="text-slate-800">Approved Amount:</strong> <strong className="text-primary font-mono">₹{(request.approvedAmount || request.requestedAmount).toFixed(2)}</strong></p>
              <p><strong className="text-slate-800">Approved By:</strong> {request.reviewedBy || 'Admin Operator'}</p>
              {request.notes && <p><strong className="text-slate-800">Approval Notes:</strong> "{request.notes}"</p>}
            </div>

            {/* Workflow state progress indicators */}
            <div className="flex items-center gap-4 py-2 font-mono text-[10px] uppercase font-bold justify-center">
              <div className="flex flex-col items-center">
                <span className="p-1 rounded bg-purple-50 text-purple-700 border">APPROVED</span>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300" />
              <div className="flex flex-col items-center">
                <span className={`p-1 rounded border ${
                  request.status === 'processing' || request.status === 'completed'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'bg-slate-50 text-slate-400'
                }`}>PROCESSING</span>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300" />
              <div className="flex flex-col items-center">
                <span className={`p-1 rounded border ${
                  request.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 font-black'
                    : 'bg-slate-50 text-slate-400'
                }`}>COMPLETED</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/financial-operations/refunds/${request.id}`)}
                className="h-9 px-4 text-xs font-semibold"
              >
                Back to Details
              </Button>

              {request.status === 'approved' && (
                <Button
                  onClick={handleMarkProcessing}
                  disabled={isMarkingProcessing}
                  className="h-9 px-4 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>{isMarkingProcessing ? 'Updating...' : 'Mark as Processing'}</span>
                </Button>
              )}

              {['approved', 'processing'].includes(request.status) && (
                <Button
                  onClick={handleMarkCompleted}
                  disabled={isMarkingCompleted}
                  className="h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isMarkingCompleted ? 'Updating...' : 'Mark as Completed'}</span>
                </Button>
              )}
            </div>

          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  )
}

export default RefundProcessPage
