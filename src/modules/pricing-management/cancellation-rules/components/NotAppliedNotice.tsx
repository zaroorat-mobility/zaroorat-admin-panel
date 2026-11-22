import { Info } from 'lucide-react'
import { usePricingSummary } from '../../hooks'

/**
 * Live rollout banner: reads `cancellation.policy_enforcement` directly from
 * `GET /admin/pricing/summary`. Policies are versioned in PostgreSQL and
 * evaluated by the backend policy engine once the flag is enabled; assessed
 * fees are recorded as `ASSESSED` without auto-debit until Finance approval (D-07).
 */
export const NotAppliedNotice = () => {
  const { data: summary } = usePricingSummary()
  const enforced = summary?.flags.cancellationPolicyEnforcement ?? false

  return (
    <div
      role="note"
      className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs ${
        enforced
          ? 'bg-emerald-50 border-emerald-300 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-100 dark:border-emerald-800'
          : 'bg-amber-50 border-amber-300 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100 dark:border-amber-800'
      }`}
    >
      <Info className="h-4 w-4 mt-0.5 shrink-0" />
      <p>
        <strong>
          {enforced
            ? 'Policy engine active (`cancellation.policy_enforcement` ON).'
            : 'Feature-flagged rollout (`cancellation.policy_enforcement` OFF — default).'}
        </strong>{' '}
        {enforced
          ? 'Active versioned policies in PostgreSQL are being evaluated on live cancellations. Assessed fees are recorded on the cancellation snapshot without auto-debit until Finance settlement approval (D-07).'
          : 'Policies saved here are versioned in PostgreSQL and enforced on rides once the feature flag is turned ON. Fees are recorded as ASSESSED on the cancellation snapshot and are not auto-collected until Finance approves cancellation settlement economics (D-07).'}
      </p>
    </div>
  )
}
