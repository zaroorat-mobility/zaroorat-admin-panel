import { Info } from 'lucide-react'

/**
 * No ride reads these rules yet (ride cancellation uses the env RIDE_DEFAULT_CANCELLATION_FEE,
 * not even the System Settings field of the same name), so the screens must not let an admin
 * believe a saved rule is in force.
 * Remove this when rides start using cancellation policies.
 */
export const NotAppliedNotice = () => (
  <div
    role="note"
    className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-300 text-xs text-amber-950 dark:bg-amber-950/30 dark:text-amber-100 dark:border-amber-800"
  >
    <Info className="h-4 w-4 mt-0.5 shrink-0" />
    <p>
      <strong>Not applied to rides yet.</strong> Rides do not read these rules. Today a rider who
      cancels after the driver has arrived is given one flat fee set on the server by the
      engineering team (₹50 unless changed), whatever is set here. That fee is recorded on the
      ride but not collected.
    </p>
  </div>
)
