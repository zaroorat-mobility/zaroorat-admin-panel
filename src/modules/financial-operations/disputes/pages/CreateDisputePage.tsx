import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCreateDispute } from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { Save, AlertCircle, RefreshCw } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { OperationsService } from '@/modules/operations/services'
import type { DisputeType } from '../types'

export const CreateDisputePage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  
  const queryParams = new URLSearchParams(location.search)
  const defaultRideId = queryParams.get('rideId') || ''
  
  const { mutate: createTicket, isPending } = useCreateDispute()

  // Form states
  const [rideId, setRideId] = useState(defaultRideId)
  const [type, setType] = useState<DisputeType>('FARE_DIFFERENCE')
  const [amount, setAmount] = useState<number>(0)
  const [requestedAmount, setRequestedAmount] = useState<number>(0)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  // Query linked ride details dynamically
  const { data: ride, isLoading: isLoadingRide, isError: isRideError } = useQuery({
    queryKey: ['financial', 'dispute-ride-validation', rideId],
    queryFn: () => OperationsService.getRideById(rideId),
    enabled: rideId.trim().length >= 8,
    retry: false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!rideId.trim()) {
      setError('Ride ID is required.')
      return
    }
    if (!ride) {
      setError('Please provide a valid, existing Ride ID before logging the dispute.')
      return
    }
    if (amount <= 0) {
      setError('Disputed amount must be greater than zero.')
      return
    }
    if (!reason.trim()) {
      setError('Dispute description reason is required.')
      return
    }

    createTicket(
      {
        rideId: ride.id,
        type,
        status: 'open',
        riderId: ride.riderId,
        riderName: ride.riderName,
        driverId: ride.driverId || 'unassigned',
        driverName: ride.driverName || 'Unassigned Driver',
        amount,
        requestedAmount: requestedAmount > 0 ? requestedAmount : amount,
        reason,
      },
      {
        onSuccess: () => {
          navigate('/financial-operations/disputes')
        }
      }
    )
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Log Payment Dispute"
        description="Initiate financial adjustments, fare review audits, and customer wallet chargebacks."
        onBack={() => navigate('/financial-operations/disputes')}
      />

      <form onSubmit={handleSubmit} className="space-y-6 text-left max-w-3xl mt-4">
        <Card className="premium-card">
          <CardContent className="p-6 space-y-4 text-xs">
            
            <div className="border-b pb-3 mb-2">
              <h3 className="font-bold text-slate-800 text-sm">Dispute Specifications</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Specify the ride, dispute category, and requested financial amounts.</p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {/* Ride ID validation check */}
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
                    ✓ Valid Ride: {ride.riderName} (Rider) ➔ {ride.driverName || 'Unassigned'} (Driver)
                  </p>
                )}
                {isRideError && rideId.trim().length >= 8 && (
                  <p className="text-[10px] text-rose-600 font-bold">
                    ⚠ Failed to find ride. Please check Ride ID reference.
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase">Dispute Category</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as DisputeType)}
                  className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                >
                  <option value="FARE_DIFFERENCE">Fare Difference (Estimate vs. Final)</option>
                  <option value="UNCOLLECTED_CASH">Driver Claims Unpaid Cash</option>
                  <option value="DOUBLE_CHARGE">Rider Double Charged</option>
                  <option value="REFUND_REQUEST">Cancellation Refund Request</option>
                  <option value="SURGE_DISPUTE">Surge Charges Dispute</option>
                  <option value="CANCELLATION_FEE_DISPUTE">Incorrect Cancellation Fee</option>
                  <option value="WAITING_CHARGE_DISPUTE">Incorrect Waiting Charges</option>
                  <option value="OTHER">Other Dispute Reason</option>
                </select>
              </div>
            </div>

            {/* Ride Details Summary Read-Only */}
            {ride && (
              <div className="p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl grid grid-cols-2 gap-4 font-mono text-[10px] text-slate-550 leading-relaxed">
                <div>
                  <p><strong className="text-slate-700">Pickup Location:</strong> {ride.pickupLocation}</p>
                  <p><strong className="text-slate-700">Drop Location:</strong> {ride.dropLocation}</p>
                </div>
                <div>
                  <p><strong className="text-slate-700">Charged Fare Amount:</strong> ₹{ride.finalFare.toFixed(2)}</p>
                  <p><strong className="text-slate-700">Payment Status:</strong> {ride.paymentStatus.toUpperCase()} ({ride.paymentMethod.toUpperCase()})</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase">Disputed Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="e.g. 70.00"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase">Rider Requested Refund / Write-off (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 70.00"
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase">Detailed Dispute Reason</label>
              <textarea
                required
                rows={4}
                placeholder="Spoke to customer Aditya, stuck in traffic near Terminal 3, requests estimate match..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/financial-operations/disputes')}
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
                <span>{isPending ? 'Logging Ticket...' : 'File Financial Ticket'}</span>
              </Button>
            </div>

          </CardContent>
        </Card>
      </form>
    </PageWrapper>
  )
}

export default CreateDisputePage
