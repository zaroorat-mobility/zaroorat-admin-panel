import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { Percent, ShieldCheck, Landmark, Save } from 'lucide-react'
import { loadGstConfig, saveGstConfig, getIntraStateGstRate } from '../../config/pricing-config.storage'

export const GstTaxationPage: React.FC = () => {
  const navigate = useNavigate()
  const stored = loadGstConfig()
  const [cgst, setCgst] = useState<number>(stored.cgst)
  const [sgst, setSgst] = useState<number>(stored.sgst)
  const [igst, setIgst] = useState<number>(stored.igst)
  const [gstin, setGstin] = useState<string>(stored.gstin)
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    saveGstConfig({ cgst, sgst, igst, gstin })
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  return (
    <PageWrapper>
      <PageHeader
        title="GST & Taxation Config"
        description="Manage government tax ratios, SGST/CGST rates, and corporate GSTIN registrations."
        onBack={() => navigate('/pricing-management')}
      />

      <div className="max-w-2xl text-left space-y-6">
        <form onSubmit={handleSave}>
          <Card className="premium-card">
            <CardContent className="p-6 space-y-4 text-xs">
              <div className="border-b pb-3 mb-2 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Tax Parameters</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Determine CGST, SGST and corporate registration variables.</p>
                </div>
                <Landmark className="h-5 w-5 text-primary" />
              </div>

              <div className="p-3 rounded-lg border border-border bg-slate-50/50 dark:bg-slate-900/30 text-[10px] text-slate-500">
                Combined intra-state GST rate: <strong className="text-slate-800 dark:text-slate-200">{getIntraStateGstRate().toFixed(1)}%</strong>.
                Per-fare-rule overrides can be set via <button type="button" onClick={() => navigate('/pricing-management/fare-rules')} className="text-primary font-bold hover:underline">Fare Rules</button> (tax % field).
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Corporate GSTIN</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px] font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1">
                    <span>CGST (%)</span>
                    <Percent className="h-3 w-3 text-slate-400" />
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={cgst}
                    onChange={(e) => setCgst(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1">
                    <span>SGST (%)</span>
                    <Percent className="h-3 w-3 text-slate-400" />
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={sgst}
                    onChange={(e) => setSgst(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider flex items-center gap-1">
                    <span>IGST (%)</span>
                    <Percent className="h-3 w-3 text-slate-400" />
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={igst}
                    onChange={(e) => setIgst(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-border">
                {isSaved ? (
                  <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
                    <ShieldCheck className="h-4 w-4" /> Config saved successfully!
                  </span>
                ) : (
                  <span />
                )}
                <Button type="submit" className="gap-2 bg-primary text-white hover:bg-primary/95 text-xs font-semibold h-9 rounded-lg">
                  <Save className="h-4 w-4" /> Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </PageWrapper>
  )
}

export default GstTaxationPage
