import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useFareRule } from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { Card, CardHeader, CardContent } from '@/shared/components/ui/Card'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { Button } from '@/shared/components/ui/Button'
import { Edit2, ArrowLeft, Shield, Clock, Car, Bike, Info } from 'lucide-react'
import { FareRulePreviewCard } from '../components/FareRulePreviewCard'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'

export const FareRuleDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const canWrite = hasPermission(user, 'pricing:write')

  const { data: rule, isLoading, isError } = useFareRule(id || '')

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center p-12 text-slate-500 font-medium">
          Loading rule details...
        </div>
      </PageWrapper>
    )
  }

  if (isError || !rule) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center p-12 text-rose-500 font-medium">
          <p>Failed to find fare rule.</p>
          <button
            onClick={() => navigate('/pricing-management/fare-rules')}
            className="text-xs underline mt-2 text-slate-650"
          >
            Back to list
          </button>
        </div>
      </PageWrapper>
    )
  }

  const isBike = rule.vehicleType?.toUpperCase().includes('BIKE')

  return (
    <PageWrapper className="space-y-4 pt-1 pb-6 px-3 sm:px-5 w-full max-w-full overflow-x-hidden">
      {/* Header matching Geographic & Pricing Control Center design */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/pricing-management/fare-rules')}
            className="p-1 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Back to Fare Rules"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-200" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Fare Rule: {rule.ruleName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Detailed review of base tariffs, distance/duration charges, waiting penalties, and monetization policies.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/pricing-management/fare-rules')}
            className="gap-2 text-xs font-semibold h-9 rounded-xl border-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to list</span>
          </Button>
          {canWrite && (
            <Button
              onClick={() => navigate(`/pricing-management/fare-rules/${rule.id}/edit`)}
              className="gap-2 text-xs font-semibold h-9 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white"
            >
              <Edit2 className="h-4 w-4" />
              <span>Edit Configuration</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mt-4 text-left">
        {/* Left Side: Rule Details Grid */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="premium-card text-left shadow-sm border border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded bg-primary/10 text-primary">
                    {isBike ? <Bike className="h-4 w-4" /> : <Car className="h-4 w-4" />}
                  </span>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                      {rule.ruleName}
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Version v{rule.version} — Effective from{' '}
                      {new Date(rule.effectiveFrom).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>
                <StatusBadge status={rule.status} />
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6 text-xs text-slate-700 dark:text-slate-300">
              {/* Grid sections */}
              <div className="grid grid-cols-2 gap-6">
                {/* Scope */}
                <div className="space-y-4 col-span-2">
                  <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
                    <Car className="h-3.5 w-3.5 text-primary" />
                    <span>Rule Scope & Master Mapping</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-400">City</p>
                      <strong className="text-slate-800 dark:text-white">{rule.cityCode}</strong>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Service Type</p>
                      <strong className="text-slate-800 dark:text-white uppercase">
                        {rule.serviceType ?? 'Instant (Default)'}
                      </strong>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Geographic Zone</p>
                      <strong className="text-slate-800 dark:text-white">
                        {rule.serviceZoneName ?? 'Entire City (Citywide)'}
                      </strong>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Vehicle Variant</p>
                      <strong className="text-slate-800 dark:text-white font-mono">
                        {rule.vehicleType}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Pricing values */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
                    <Shield className="h-3.5 w-3.5 text-primary" />
                    <span>Pricing Formula Parameters</span>
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Base Boarding Fare:</span>
                      <strong className="text-slate-800 dark:text-white font-mono">
                        ₹{rule.baseFare.toFixed(2)}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Minimum Trip Floor:</span>
                      <strong className="text-slate-800 dark:text-white font-mono">
                        ₹{rule.minimumFare.toFixed(2)}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Distance Charge:</span>
                      <strong className="text-slate-800 dark:text-white font-mono">
                        ₹{rule.perKmRate.toFixed(2)} / km
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Duration Charge:</span>
                      <strong className="text-slate-800 dark:text-white font-mono">
                        ₹{rule.perMinuteRate.toFixed(2)} / min
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Waiting Charge details */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    <span>Waiting (In-Trip) Penalties</span>
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Free Wait Period:</span>
                      <strong className="text-slate-800 dark:text-white font-mono">
                        {rule.freeWaitingMinutes} Minutes
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Extra Wait Rate:</span>
                      <strong className="text-slate-800 dark:text-white font-mono">
                        ₹{rule.waitingChargePerMinute.toFixed(2)} / min
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fees & Commission Breakdown */}
              <div className="space-y-3 border-t pt-4">
                <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Platform Monetization & Taxes</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-border">
                  <div>
                    <p className="text-[10px] text-slate-400">Booking Fee</p>
                    <strong className="text-slate-850 dark:text-white text-xs font-mono">
                      ₹{(rule.bookingFee ?? 0).toFixed(2)}
                    </strong>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Platform Fee</p>
                    <strong className="text-slate-850 dark:text-white text-xs font-mono">
                      {rule.platformFeePct > 0
                        ? `${rule.platformFeePct}%`
                        : rule.platformFeeFlat === 0
                        ? '₹0.00'
                        : rule.platformFeeFlat != null
                        ? `₹${rule.platformFeeFlat.toFixed(2)}`
                        : '₹15.00 (Default)'}
                    </strong>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">GST Tax Rate</p>
                    <strong className="text-slate-850 dark:text-white text-xs font-mono">
                      {rule.taxRatePct != null ? `${rule.taxRatePct}%` : '5% (Default)'}
                    </strong>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Driver Commission</p>
                    <strong className="text-slate-850 dark:text-white text-xs font-mono">
                      {rule.commissionRatePct != null
                        ? `${rule.commissionRatePct}%`
                        : '20% (Default)'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Monetization Model Clarification Banner */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Monetization Model Notice
                  </span>
                  <p className="leading-relaxed">
                    Customer settles the metered journey directly with the captain upon reaching destination. Commission is debited from the captain's prepaid Driver Commission Wallet for commission-model drivers. Subscription captains are charged ₹0 per ride.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Interactive Preview simulator widget */}
        <div className="space-y-6">
          <FareRulePreviewCard
            baseFare={rule.baseFare}
            minimumFare={rule.minimumFare}
            perKmRate={rule.perKmRate}
            perMinuteRate={rule.perMinuteRate}
            freeWaitingMinutes={rule.freeWaitingMinutes}
            waitingChargePerMinute={rule.waitingChargePerMinute}
            bookingFee={rule.bookingFee ?? 0}
            platformFeePct={rule.platformFeePct ?? 0}
            platformFeeFlat={rule.platformFeeFlat ?? null}
            taxRatePct={rule.taxRatePct}
            commissionRatePct={rule.commissionRatePct}
          />
        </div>
      </div>
    </PageWrapper>
  )
}

export default FareRuleDetailsPage
