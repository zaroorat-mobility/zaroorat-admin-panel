import React, { useState } from 'react'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { CreditCard, Save, Percent, ShieldCheck } from 'lucide-react'

export const RazorpayCommissionPage: React.FC = () => {
  const [commissionRate, setCommissionRate] = useState<number>(2.0)
  const [fixedFee, setFixedFee] = useState<number>(3.0)
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Razorpay PG Commission"
        description="Configure payment gateway transaction fees and standard transfer commission parameters."
      />

      <div className="max-w-2xl text-left space-y-6">
        <form onSubmit={handleSave}>
          <Card className="premium-card">
            <CardContent className="p-6 space-y-4 text-xs">
              <div className="border-b pb-3 mb-2 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Commission Settings</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Determine the standard Razorpay gateway processing costs.</p>
                </div>
                <CreditCard className="h-5 w-5 text-primary" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1">
                    <span>PG Commission Rate (%)</span>
                    <Percent className="h-3 w-3 text-slate-405" />
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Fixed Surcharge (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={fixedFee}
                    onChange={(e) => setFixedFee(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                  />
                </div>
              </div>

              <div className="p-3 border border-indigo-100 bg-indigo-50/20 dark:bg-indigo-950/15 rounded-xl text-[10px] text-indigo-700 leading-relaxed font-semibold">
                Note: Razorpay commission fees are calculated on every ride billing transfer. Example: For a ₹100 transaction, gateway charge is ₹2.00 commission + ₹3.00 flat = ₹5.00 total + 18% GST (₹0.90) = ₹5.90.
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-border">
                {isSaved ? (
                  <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
                    <ShieldCheck className="h-4 w-4" /> Commission config saved!
                  </span>
                ) : (
                  <span />
                )}
                <Button type="submit" className="gap-2 bg-primary text-white hover:bg-primary/95 text-xs font-semibold h-9 rounded-lg">
                  <Save className="h-4 w-4" /> Update Commission Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </PageWrapper>
  )
}

export default RazorpayCommissionPage
