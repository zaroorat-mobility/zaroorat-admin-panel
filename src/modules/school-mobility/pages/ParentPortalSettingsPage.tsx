import React, { useState } from 'react'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { Shield, Save, ShieldCheck, Bell } from 'lucide-react'

export const ParentPortalSettingsPage: React.FC = () => {
  const [notifyPickup, setNotifyPickup] = useState(true)
  const [notifyDrop, setNotifyDrop] = useState(true)
  const [notifyDelay, setNotifyDelay] = useState(true)
  const [requireOtp, setRequireOtp] = useState(true)
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Parent Portal Settings"
        description="Manage portal authentication, real-time OTP checks, drop alerts, and push notifications."
      />

      <div className="max-w-2xl text-left space-y-6">
        <form onSubmit={handleSave}>
          <Card className="premium-card">
            <CardContent className="p-6 space-y-5 text-xs">
              <div className="border-b pb-3 mb-2 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Security & Verification</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Configure authentication safeguards for child safety check-ins.</p>
                </div>
                <Shield className="h-5 w-5 text-primary" />
              </div>

              <div className="flex items-center justify-between p-3 border border-border rounded-xl bg-slate-50 dark:bg-slate-950">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-slate-800 dark:text-white">Require Boarding OTP Verification</span>
                  <p className="text-[9px] text-slate-500">Cab driver must verify secure OTP from parent prior to child boarding.</p>
                </div>
                <input
                  type="checkbox"
                  checked={requireOtp}
                  onChange={(e) => setRequireOtp(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4.5 w-4.5"
                />
              </div>

              <div className="border-b pb-2 mb-2 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-850 text-[11px] uppercase tracking-wider text-slate-400">Push Notifications & SMS alerts</h3>
                  <p className="text-[9px] text-muted-foreground">Select pickup milestones dispatched automatically to parents.</p>
                </div>
                <Bell className="h-4 w-4 text-slate-400" />
              </div>

              <div className="space-y-3 font-medium">
                <label className="flex items-center justify-between cursor-pointer select-none">
                  <span className="text-slate-650">Alert: Boarding completed (Pickup)</span>
                  <input
                    type="checkbox"
                    checked={notifyPickup}
                    onChange={(e) => setNotifyPickup(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer select-none">
                  <span className="text-slate-650">Alert: Child reached safely (Drop-off)</span>
                  <input
                    type="checkbox"
                    checked={notifyDrop}
                    onChange={(e) => setNotifyDrop(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer select-none">
                  <span className="text-slate-650">Alert: Cab delayed &gt; 5 Mins</span>
                  <input
                    type="checkbox"
                    checked={notifyDelay}
                    onChange={(e) => setNotifyDelay(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                </label>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-border">
                {isSaved ? (
                  <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
                    <ShieldCheck className="h-4 w-4" /> Parent portal config saved!
                  </span>
                ) : (
                  <span />
                )}
                <Button type="submit" className="gap-2 bg-primary text-white hover:bg-primary/95 text-xs font-semibold h-9 rounded-lg">
                  <Save className="h-4 w-4" /> Save Parent Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </PageWrapper>
  )
}

export default ParentPortalSettingsPage
