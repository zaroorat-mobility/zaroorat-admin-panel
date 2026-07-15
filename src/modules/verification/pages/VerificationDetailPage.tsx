import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useVerification, useApproveVerification, useRejectVerification } from '../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/Card'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { Button } from '@/shared/components/ui/Button'
import { Check, X, ShieldAlert, FileText, RefreshCcw, Eye } from 'lucide-react'

export const VerificationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [notes, setNotes] = useState('')
  const [activeDocTab, setActiveDocTab] = useState<'license' | 'rc' | 'aadhaar' | 'pan'>('license')

  const { data: verification, isLoading } = useVerification(id || '')
  const { mutate: approve, isPending: isApproving } = useApproveVerification()
  const { mutate: reject, isPending: isRejecting } = useRejectVerification()

  const demoDetails = {
    id: id || 'v2',
    driverId: 'd2',
    driverName: 'Sunil Verma',
    vehicleType: 'Bajaj RE Auto',
    vehicleNumber: 'KA-03-TR-9876',
    documentType: 'rc' as const,
    status: 'pending' as const,
    submittedAt: '2026-07-14T15:24:00Z',
    documentUrl: '#',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150', // Mock driver photo
    auditLogs: [
      { action: 'KYC Document Set Submitted', operator: 'Sunil Verma (Driver)', timestamp: '2026-07-14T15:24:00Z' },
    ],
  }

  const active = verification ?? demoDetails

  const handleApprove = () => {
    approve({ id: active.id, notes }, {
      onSuccess: () => navigate('/verification'),
    })
  }

  const handleReject = () => {
    reject({ id: active.id, notes }, {
      onSuccess: () => navigate('/verification'),
    })
  }

  const handleRequestReupload = () => {
    // Mock re-upload trigger template
    alert(`Re-upload request initiated for ${activeDocTab} document. Notes: ${notes}`)
  }

  return (
    <PageWrapper>
      <PageHeader
        title={`KYC Audit: ${active.driverName}`}
        description="Verify driver identification papers, state registrations and compliance parameters."
        onBack={() => navigate('/verification')}
      />

      {isLoading && !verification ? (
        <p className="text-slate-500">Loading audit records...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT SIDE: DOCUMENT VIEWERS AND PREVIEWS */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Driver Photo & Vehicle Meta */}
            <Card>
              <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
                <div className="h-24 w-24 rounded-xl bg-slate-100 overflow-hidden border border-brand-border flex-shrink-0">
                  <div className="h-full w-full bg-slate-200 flex items-center justify-center font-bold text-slate-400">
                    Photo
                  </div>
                </div>
                <div className="space-y-1.5 text-center sm:text-left">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">Applicant Driver</span>
                  <h3 className="text-lg font-bold text-text-primary">{active.driverName}</h3>
                  <p className="text-xs text-text-secondary">
                    Category: <span className="font-semibold text-text-primary">{active.vehicleType}</span> ({active.vehicleNumber})
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Document Tabs Viewer */}
            <Card>
              <CardHeader className="flex-col sm:flex-row gap-4">
                <div>
                  <CardTitle>Verification Checklist Documents</CardTitle>
                  <CardDescription>Select document tab to inspect files side-by-side.</CardDescription>
                </div>
                {/* Custom Tab selectors */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  {(['license', 'rc', 'aadhaar', 'pan'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveDocTab(tab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                        activeDocTab === tab
                          ? 'bg-white text-primary shadow-soft dark:bg-slate-900'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="aspect-video w-full rounded-xl border border-border bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-4 dark:bg-slate-950">
                  <FileText className="h-10 w-10 text-primary animate-pulse" />
                  <div className="space-y-1">
                    <h5 className="font-bold text-text-primary capitalize">{activeDocTab} Document</h5>
                    <p className="text-[11px] text-text-secondary uppercase">File Reference: {activeDocTab}_scanned_copy.pdf</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2 h-9 rounded-lg text-xs">
                      <Eye className="h-4 w-4" />
                      <span>View Fullscreen</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT SIDE: NOTES AND AUDIT ACTIONS PANEL */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Audit Panel</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div>
                  <span className="text-xs font-semibold text-text-secondary uppercase">Submission Status</span>
                  <div className="mt-2">
                    <StatusBadge status={active.status} />
                  </div>
                </div>

                {active.status === 'pending' && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-text-secondary uppercase">Audit Decision Notes</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add reason for approval, rejection or reupload request..."
                        className="w-full h-28 rounded-xl border border-border bg-white p-3 text-xs text-text-primary placeholder:text-slate-400 focus:border-primary focus:outline-none dark:bg-slate-900"
                      />
                    </div>
                    
                    {/* Decision Actions list matching requirements */}
                    <div className="space-y-2.5">
                      <Button className="w-full gap-2 rounded-xl justify-center h-10" onClick={handleApprove} loading={isApproving}>
                        <Check className="h-4 w-4" />
                        <span>Approve Applicant</span>
                      </Button>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="danger" className="gap-2 rounded-xl justify-center h-10" onClick={handleReject} loading={isRejecting}>
                          <X className="h-4 w-4" />
                          <span>Reject</span>
                        </Button>
                        
                        <Button variant="outline" className="gap-2 rounded-xl justify-center h-10 text-xs text-primary" onClick={handleRequestReupload}>
                          <RefreshCcw className="h-3.5 w-3.5" />
                          <span>Re-upload</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      )}
    </PageWrapper>
  )
}
export default VerificationDetailPage
