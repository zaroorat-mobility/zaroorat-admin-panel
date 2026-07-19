import React from 'react'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Landmark, ArrowUpRight } from 'lucide-react'

export const SettlementsPage: React.FC = () => {
  return (
    <PageWrapper>
      <PageHeader
        title="Settlements Ledger"
        description="Verify driver payout batches, banking settlements, and account reconciliation logs."
      />
      <div className="mt-8 flex justify-center text-left max-w-xl mx-auto">
        <Card className="premium-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded bg-primary/10 text-primary">
              <Landmark className="h-6 w-6" />
            </span>
            <div>
              <h3 className="font-black text-slate-800 dark:text-white text-base">Settlements Module</h3>
              <p className="text-xs text-slate-450 mt-0.5">Automated banking transfers and payouts tracking.</p>
            </div>
          </div>
          <CardContent className="p-0 text-xs text-slate-500 leading-relaxed space-y-2">
            <p>
              This section is scheduled for **Phase 2** of the Financial Operations rollout. It will manage:
            </p>
            <ul className="list-disc list-inside pl-2 space-y-1 font-semibold text-slate-700">
              <li>Automatic bank payouts matching driver wallet earnings.</li>
              <li>Manual settlement batch overrides.</li>
              <li>Reconciliation ledger audits against razorpay/stripe logs.</li>
            </ul>
            <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 pt-2">
              <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
              <span>Coming Soon • Scheduled Rollout</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  )
}

export default SettlementsPage
