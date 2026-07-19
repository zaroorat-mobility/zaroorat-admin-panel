import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCreateRefund } from '../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { Save, AlertCircle, RefreshCw } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { OperationsService } from '@/modules/operations/services'
import type { RefundType, RefundSource } from '../types'

export const CreateRefundPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  
  const queryParams = new URLSearchParams(location.search)
  const defaultRideId = queryParams.get('rideId') || ''
  const defaultDisputeId = queryParams.get('disputeId') || ''
  const defaultSource = (queryParams.get('source') as RefundSource) || 'manual'
  const defaultAmount = parseFloat(queryParams.get('amount') || '0')
  const defaultReason = queryParams.get('reason') || ''

  const { mutate: createTicket, isPending } = useCreateRefund()

  // Form states
  const [rideId, setRideId] = useState(defaultRideId)
  const [disputeId, setDisputeId] = useState(defaultDisputeId)
  const [refundSource, setRefundSource] = useState<RefundSource>(defaultSource)
  const [refundType, setRefundType] = useState<RefundType>('FARE_OVERCHARGED')
  const [amount, setAmount] = useState<number>(defaultAmount)
  const [reason, setReason] = useState(defaultReason)
  const [error, setError] = useState('')

  // Query linked ride details dynamically
  const { data: ride, isLoading: isLoadingRide, isError: isRideError } = useQuery({
    queryKey: ['financial', 'refund-ride-validation', rideId],
    queryFn: () => OperationsService.getRideById(rideId),
    enabled: rideId.trim().length >= 8,
    retry: false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!rideId.trim()) {
      setError('Associated Ride ID is required.')
      return
    }
    if (!ride) {
      setError('Please provide a valid, existing Ride ID.')
      return
    }
    if (amount <= 0) {
      setError('Refund requested amount must be greater than zero.')
      return
    }
    if (!reason.trim()) {
      setError('Refund reason details is required.')
      return
    }

    createTicket(
      {
        rideId: ride.id,
        disputeId: disputeId.trim() || undefined,
        riderId: ride.riderId,
        riderName: ride.riderName,
        refundType,
        requestedAmount: amount,
        reason,
        refundSource,
      },
      {
        onSuccess: () => {
          navigate('/financial-operations/refunds')
        }
      }
    )
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Create Refund Request"
        description="Initiate gateway credit adjustments, wallet deposit compensations, and cancel waivers."
        onBack={() => navigate('/financial-operations/refunds')}
      />

      <form onSubmit={handleSubmit} className="space-y-6 text-left max-w-3xl mt-4">
        <Card className="premium-card">
          <CardContent className="p-6 space-y-4 text-xs">
            
            <div className="border-b pb-3 mb-2">
              <h3 className="font-bold text-slate-800 text-sm">Refund Details</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Define category, source origin, amount, and justification notes.</p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {/* Ride ID and Dispute ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase">Associated Ride ID (Type fully e.g. ride-101)</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. ride-101"
                    value={rideId}
                    onChange={(e) => setRideId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                  />
                  {isLoadingRide && (
                    <RefreshCw className="h-4 w-4 text-slate-400 absolute right-3 top-2 animate-spin" />
                  )}
                </div>
                {ride && (
                  <p className="text-[10px] text-emerald-600 font-bold">
                    ✓ Valid Ride: {ride.riderName} (Rider) ➔ {ride.driverName || 'Unassigned'}
                  </p>
                )}
                {isRideError && rideId.trim().length >= 8 && (
                  <p className="text-[10px] text-rose-600 font-bold">
                    ⚠ Failed to locate ride record. Check Ride ID.
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase">Linked Dispute ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. dis-401"
                  value={disputeId}
                  onChange={(e) => setDisputeId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                />
              </div>
            </div>

            {/* Ride Info Read-only */}
            {ride && (
              <div className="p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl grid grid-cols-2 gap-4 font-mono text-[10px] text-slate-550 leading-relaxed">
                <div>
                  <p><strong className="text-slate-700">Pickup:</strong> {ride.pickupLocation}</p>
                  <p><strong className="text-slate-700">Drop:</strong> {ride.dropLocation}</p>
                </div>
                <div>
                  <p><strong className="text-slate-700">Charged Fare Amount:</strong> ₹{ride.finalFare.toFixed(2)}</p>
                  <p><strong className="text-slate-700">Payment status:</strong> {ride.paymentStatus.toUpperCase()} ({ride.paymentMethod.toUpperCase()})</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase">Refund Source</label>
                <select
                  value={refundSource}
                  onChange={(e) => setRefundSource(e.target.value as RefundSource)}
                  className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                >
                  <option value="manual">Manual Request</option>
                  <option value="dispute">From Dispute Link</option>
                  <option value="complaint">Escalated Complaint</option>
                  <option value="ride">Ride Details Waiver</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase">Refund Type Category</label>
                <select
                  value={refundType}
                  onChange={(e) => setRefundType(e.target.value as RefundType)}
                  className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                >
                  <option value="FARE_OVERCHARGED">Fare Overcharged (Calculation error)</option>
                  <option value="RIDE_CANCELLED">Ride Cancelled (Waiver fee)</option>
                  <option value="DOUBLE_PAYMENT">Double Payment charged</option>
                  <option value="PAYMENT_FAILURE">UPI Payment failure delay</option>
                  <option value="DRIVER_NO_SHOW">Driver No Show compensation</option>
                  <option value="SERVICE_ISSUE">Ride Safety / Service complaint</option>
                  <option value="GOODWILL_COMPENSATION">Goodwill credit gift</option>
                  <option value="DISPUTE_RESOLUTION">Dispute Resolution adjustment</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase">Requested Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="e.g. 100.00"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase">Dispute justification reason description</label>
              <textarea
                required
                rows={4}
                placeholder="Rider double paidBKC auto trip, UPI reference attached. Verified second ledger transaction success..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/financial-operations/refunds')}
                className="h-9 px-4 text-xs font-semibold border-border"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending || isLoadingRide}
                className="h-9 px-4 text-xs font-semibold bg-primary hover:bg-primary/95 text-white"
              >
                <Save className="h-4 w-4 mr-1.5" />
                <span>{isPending ? 'Submitting...' : 'File Refund Request'}</span>
              </Button>
            </div>

          </CardContent>
        </Card>
      </form>
    </PageWrapper>
  )
}

export default CreateRefundPage
