import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react'
import {
  usePricingReconciliation,
  useRecoverSettlementFailure,
  useSettlementFailures,
  useSweepStaleReservations,
  useWaiveSettlementFailure,
} from '../hooks'
import type { SettlementFailureDto } from '../api/governance.api'
import { SettlementFailureDetailsModal } from './components/SettlementFailureDetailsModal'
import { useToast } from '@/shared/context/toast'

export const SettlementFailuresPage: React.FC = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [statusFilter, setStatusFilter] = useState<'OPEN' | 'RECOVERED' | 'WAIVED'>('OPEN')
  const [waiveId, setWaiveId] = useState<string | null>(null)
  const [waiveReason, setWaiveReason] = useState('')
  const [detailFailure, setDetailFailure] = useState<SettlementFailureDto | null>(null)

  const { data: failuresPage, isLoading, refetch } = useSettlementFailures({ status: statusFilter })
  const { data: reconciliation, refetch: refetchRecon } = usePricingReconciliation()
  const recoverMutation = useRecoverSettlementFailure()
  const waiveMutation = useWaiveSettlementFailure()
  const sweepMutation = useSweepStaleReservations()

  const failures = failuresPage?.data ?? []

  return (
    <PageWrapper className="space-y-4 pt-1 pb-6 px-3 sm:px-5 w-full max-w-full overflow-x-hidden text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/pricing-management')}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#1F2B6D] dark:text-white" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F2B6D] dark:text-white">
              Settlement Failures &amp; Daily Reconciliation
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Atomic ACID recovery for failed commission / GST recovery debits and live 6-invariant ledger verification.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              sweepMutation.mutate(undefined, {
                onSuccess: (res) =>
                  toast.success(
                    'Reservation Sweep Complete',
                    `Released ${res.releasedCancelledCount} cancelled reservations; ${res.alertedCompletedRideIds.length} completed alerts.`,
                  ),
              })
            }
            disabled={sweepMutation.isPending}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            Sweep Stale Reservations
          </button>
          <button
            type="button"
            onClick={() => {
              void refetch()
              void refetchRecon()
            }}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live 6-Invariant Reconciliation Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm text-[#1F2B6D] dark:text-white flex items-center gap-1.5">
            {reconciliation?.allPassed ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            )}
            Daily Reconciliation Invariants (All 6)
          </h2>
          <span
            className={`px-2 py-0.5 rounded font-bold text-[11px] ${
              reconciliation?.allPassed
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
            }`}
          >
            {reconciliation ? (reconciliation.allPassed ? 'ALL 6 GREEN' : 'DRIFT DETECTED') : 'LOADING'}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {(reconciliation?.invariants ?? []).map((inv) => (
            <div
              key={inv.id}
              className={`p-3 rounded-lg border ${
                inv.passed
                  ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                  : 'border-rose-300 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/20'
              }`}
            >
              <div className="font-semibold text-slate-900 dark:text-white">
                #{inv.id} · {inv.name}
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                Status: <strong>{inv.passed ? 'PASS' : 'FAIL'}</strong> · Drift: ₹{inv.driftAmount.toFixed(2)} · Violations: {inv.violationCount}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settlement Failures Worklist */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-bold text-sm text-[#1F2B6D] dark:text-white">
            Collection Failures Worklist ({failures.length})
          </h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
          >
            <option value="OPEN">OPEN</option>
            <option value="RECOVERED">RECOVERED</option>
            <option value="WAIVED">WAIVED</option>
          </select>
        </div>

        {isLoading ? (
          <p className="text-slate-500">Loading failures...</p>
        ) : failures.length === 0 ? (
          <p className="text-slate-500">No {statusFilter} settlement collection failures.</p>
        ) : (
          <div className="space-y-2.5">
            {failures.map((f) => (
              <div
                key={f.id}
                onClick={() => setDetailFailure(f)}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {f.kind} · ₹{f.amount.toFixed(2)}{' '}
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px]">
                      {f.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Ride: {f.rideId} · Driver: {f.driverId} · Balance at attempt: ₹{f.balanceAtAttempt.toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setDetailFailure(f)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Details
                  </button>
                  {f.status === 'OPEN' && (
                    <>
                      <button
                        type="button"
                        disabled={recoverMutation.isPending}
                        onClick={() =>
                          recoverMutation.mutate(f.id, {
                            onSuccess: () => toast.success('Recovered', 'Wallet debited & ledger cleared atomically.'),
                            onError: (err) => {
                              const e = err as { message?: string; response?: { data?: { error?: { message?: string } } } }
                              toast.error('Recovery Failed', e?.response?.data?.error?.message || e?.message || 'Error')
                            },
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Recover
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setWaiveId(f.id)
                          setWaiveReason('')
                        }}
                        className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 font-semibold cursor-pointer"
                      >
                        Waive
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {waiveId && (
          <div className="p-3 rounded-lg border border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
            <div className="font-semibold">Provide Audit Reason to Waive Failure</div>
            <input
              type="text"
              value={waiveReason}
              onChange={(e) => setWaiveReason(e.target.value)}
              placeholder="Mandatory finance waiver justification"
              className="w-full px-3 py-1.5 rounded border border-slate-300 bg-white dark:bg-slate-800"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={waiveReason.trim().length < 3 || waiveMutation.isPending}
                onClick={() =>
                  waiveMutation.mutate(
                    { id: waiveId, reason: waiveReason.trim() },
                    {
                      onSuccess: () => {
                        toast.success('Failure Waived', 'Audit record written.')
                        setWaiveId(null)
                      },
                    },
                  )
                }
                className="px-3 py-1.5 rounded bg-rose-600 text-white font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Waiver
              </button>
              <button
                type="button"
                onClick={() => setWaiveId(null)}
                className="px-3 py-1.5 rounded border border-slate-300 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <SettlementFailureDetailsModal
        failure={detailFailure}
        recoverPending={recoverMutation.isPending}
        onClose={() => setDetailFailure(null)}
        onRecover={(f) =>
          recoverMutation.mutate(f.id, {
            onSuccess: () => toast.success('Recovered', 'Wallet debited & ledger cleared atomically.'),
            onError: (err) => {
              const e = err as { message?: string; response?: { data?: { error?: { message?: string } } } }
              toast.error('Recovery Failed', e?.response?.data?.error?.message || e?.message || 'Error')
            },
          })
        }
        onWaive={(f) => {
          setWaiveId(f.id)
          setWaiveReason('')
        }}
      />
    </PageWrapper>
  )
}

export default SettlementFailuresPage
