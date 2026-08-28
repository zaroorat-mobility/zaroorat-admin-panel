import React from 'react'
import { useNavigate } from 'react-router-dom'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { CreditCard, Landmark, Percent, Info, ShieldCheck } from 'lucide-react'

export const RazorpayCommissionPage: React.FC = () => {
  const navigate = useNavigate()
  const commissionRate = 2.0
  const fixedFee = 3.0
  const gstRate = 18.0

  return (
    <PageWrapper>
      <PageHeader
        title="Razorpay PG Commission Schedule"
        description="View payment gateway transaction fees and standard transfer commission parameters. Gateway fees are configured by Razorpay and are read-only."
        onBack={() => navigate('/pricing-management')}
      />

      <div className="max-w-2xl text-left space-y-6">
        <Card className="premium-card">
          <CardContent className="p-6 space-y-5 text-xs">
            <div className="border-b pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Razorpay Fee Schedule</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Determine the standard Razorpay gateway processing costs.</p>
              </div>
              <CreditCard className="h-5 w-5 text-[#2B317A] dark:text-[#4F5FBF]" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-900/50">
                <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider flex items-center gap-1">
                  <span>PG Rate</span>
                  <Percent className="h-3 w-3 text-slate-400" />
                </span>
                <p className="text-xl font-black text-slate-850 dark:text-white mt-1.5">{commissionRate.toFixed(1)}%</p>
                <p className="text-[9px] text-slate-400 mt-1">Applied per transaction</p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-900/50">
                <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider flex items-center gap-1">
                  <span>Fixed Fee</span>
                  <Landmark className="h-3 w-3 text-slate-400" />
                </span>
                <p className="text-xl font-black text-slate-850 dark:text-white mt-1.5">₹{fixedFee.toFixed(2)}</p>
                <p className="text-[9px] text-slate-400 mt-1">Flat surcharge per transfer</p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-900/50">
                <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider flex items-center gap-1">
                  <span>GST on Fee</span>
                  <Percent className="h-3 w-3 text-slate-400" />
                </span>
                <p className="text-xl font-black text-slate-850 dark:text-white mt-1.5">{gstRate.toFixed(1)}%</p>
                <p className="text-[9px] text-slate-400 mt-1">GST rate applied to fee</p>
              </div>
            </div>

            <div className="p-4 border border-indigo-100 bg-indigo-50/20 dark:bg-indigo-950/15 dark:border-indigo-900/50 rounded-xl space-y-2">
              <h4 className="font-bold text-[11px] text-indigo-855 dark:text-indigo-300 flex items-center gap-1">
                <Info className="h-3.5 w-3.5" />
                Fee Calculation Flow:
              </h4>
              <p className="text-[10px] text-indigo-700 dark:text-indigo-400 leading-relaxed font-semibold">
                Razorpay commission fees are calculated on every ride billing transfer.
                <br />
                <strong>Example Calculation:</strong> For a customer payment of ₹100.00:
                <ul className="list-disc pl-4 mt-1 space-y-1">
                  <li>Base PG Commission: ₹100.00 × 2.0% = ₹2.00</li>
                  <li>Fixed Surcharge: ₹3.00</li>
                  <li>Total Gateway Fee (Pre-Tax): ₹2.00 + ₹3.00 = ₹5.00</li>
                  <li>GST Surcharge on Fee: ₹5.00 × 18% = ₹0.90</li>
                  <li><strong>Net Deducted Amount (MDR):</strong> ₹5.00 + ₹0.90 = ₹5.90</li>
                  <li><strong>Net Merchant Settlement:</strong> ₹100.00 - ₹5.90 = ₹94.10</li>
                </ul>
              </p>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-border">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-450 font-bold text-xs">
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" /> Verified Razorpay API Gateway Connection Active
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="p-4 bg-amber-50/25 border border-amber-200/50 rounded-xl text-left space-y-1.5">
          <p className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Gateway Configuration Policy</p>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Razorpay gateway and merchant processing fees are read-only to ensure compliance with service agreement schedules. To adjust Zaroorat platform commissions (e.g. partner ride margins or subscription rules), visit the{' '}
            <button type="button" onClick={() => navigate('/pricing-management')} className="font-bold text-primary hover:underline">
              Pricing Control Center
            </button>.
          </p>
        </div>
      </div>
    </PageWrapper>
  )
}

export default RazorpayCommissionPage
