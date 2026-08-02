import React, { useState } from 'react'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { DataTable } from '@/shared/components/DataTable'
import { FileText, Eye, Check, X, ShieldAlert, Calendar, Settings, CheckCircle2 } from 'lucide-react'

interface DriverDocument {
  id: string
  driverId: string
  driverName: string
  docType: 'licence' | 'rc' | 'insurance' | 'permit' | 'kyc' | 'puc'
  fileName: string
  uploadDate: string
  issueDate: string
  expiryDate: string
  status: 'valid' | 'expiring_soon' | 'expired'
  expiryThresholdDays: number
  verificationStatus: 'verified' | 'pending' | 'rejected'
}

export const DocumentControllerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'documents' | 'settings'>('documents')
  const [alertThreshold, setAlertThreshold] = useState<number>(30)
  const [notifyByEmail, setNotifyByEmail] = useState(true)
  const [notifyByPush, setNotifyByPush] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<DriverDocument | null>(null)
  
  // Document state
  const [documents, setDocuments] = useState<DriverDocument[]>([
    { id: 'DOC-101', driverId: 'DRV-102', driverName: 'Rajesh Kumar', docType: 'licence', fileName: 'driving_license_rajesh.pdf', uploadDate: '2025-07-24', issueDate: '2020-08-11', expiryDate: '2026-08-10', status: 'expiring_soon', expiryThresholdDays: 30, verificationStatus: 'verified' },
    { id: 'DOC-102', driverId: 'DRV-205', driverName: 'Sunil Verma', docType: 'rc', fileName: 'registration_certificate_sunil.pdf', uploadDate: '2026-05-12', issueDate: '2021-05-12', expiryDate: '2031-05-11', status: 'valid', expiryThresholdDays: 30, verificationStatus: 'pending' },
    { id: 'DOC-103', driverId: 'DRV-110', driverName: 'Devendra Pal', docType: 'puc', fileName: 'puc_certificate_devendra.pdf', uploadDate: '2026-02-01', issueDate: '2026-02-01', expiryDate: '2026-08-02', status: 'expired', expiryThresholdDays: 7, verificationStatus: 'rejected' },
    { id: 'DOC-104', driverId: 'DRV-118', driverName: 'Amit Verma', docType: 'insurance', fileName: 'vehicle_insurance_amit.pdf', uploadDate: '2025-08-20', issueDate: '2025-08-20', expiryDate: '2026-08-19', status: 'valid', expiryThresholdDays: 15, verificationStatus: 'verified' },
    { id: 'DOC-105', driverId: 'DRV-304', driverName: 'Vikram Pal', docType: 'permit', fileName: 'national_permit_vikram.pdf', uploadDate: '2026-01-10', issueDate: '2022-01-10', expiryDate: '2027-01-09', status: 'valid', expiryThresholdDays: 30, verificationStatus: 'verified' }
  ])

  const handleVerify = (id: string, decision: 'verified' | 'rejected') => {
    setDocuments(prev =>
      prev.map(doc => {
        if (doc.id === id) {
          return {
            ...doc,
            verificationStatus: decision
          }
        }
        return doc
      })
    )
    setSelectedDoc(null)
  }

  const columns = [
    {
      key: 'id',
      label: 'Doc ID',
      render: (val: string) => <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{val}</span>
    },
    {
      key: 'driverName',
      label: 'Driver details',
      render: (val: string, row: DriverDocument) => (
        <div>
          <p className="font-bold text-slate-800 dark:text-white">{val}</p>
          <p className="text-[10px] text-muted-foreground font-mono">{row.driverId}</p>
        </div>
      )
    },
    {
      key: 'docType',
      label: 'Document Type',
      render: (val: string) => (
        <span className="uppercase font-mono font-black text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-655 px-1.5 py-0.5 rounded">
          {val}
        </span>
      )
    },
    {
      key: 'fileName',
      label: 'File / Uploaded',
      render: (val: string, row: DriverDocument) => (
        <div>
          <p className="text-primary hover:underline cursor-pointer font-bold truncate max-w-[140px]">{val}</p>
          <p className="text-[9px] text-slate-400 font-mono mt-0.5">Uploaded: {row.uploadDate}</p>
        </div>
      )
    },
    {
      key: 'expiryDate',
      label: 'Issue / Expiry Details',
      render: (val: string, row: DriverDocument) => {
        let style = 'text-slate-500'
        if (row.status === 'expiring_soon') style = 'text-amber-600 font-bold'
        if (row.status === 'expired') style = 'text-rose-600 font-black'
        return (
          <div className="text-[10px] font-mono space-y-0.5">
            <p className="flex items-center gap-1"><Calendar className="h-3 w-3 text-slate-400" /> Issued: {row.issueDate}</p>
            <p className="flex items-center gap-1"><Calendar className="h-3 w-3 text-slate-400" /> Expiry: {val}</p>
            <p className={`flex items-center gap-1 capitalize text-[9px] ${style}`}>
              <ShieldAlert className="h-3 w-3" /> {row.status.replace('_', ' ')}
            </p>
          </div>
        )
      }
    },
    {
      key: 'expiryThresholdDays',
      label: 'Alert Threshold',
      render: (val: number) => <span className="font-semibold text-slate-600 dark:text-slate-400">{val} Days Expiry</span>
    },
    {
      key: 'verificationStatus',
      label: 'Verification Status',
      render: (val: string) => {
        let style = 'bg-slate-50 text-slate-500 border-slate-100'
        if (val === 'verified') style = 'bg-emerald-50 text-emerald-700 border-emerald-100'
        if (val === 'rejected') style = 'bg-rose-50 text-rose-700 border-rose-100'
        return (
          <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] border font-black uppercase tracking-wider ${style}`}>
            {val}
          </span>
        )
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center' as const,
      render: (_, row: DriverDocument) => (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 rounded-lg border-border"
            title="View Document"
            onClick={() => setSelectedDoc(row)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {row.verificationStatus === 'pending' && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-transparent"
                title="Approve Document"
                onClick={() => handleVerify(row.id, 'verified')}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border-transparent"
                title="Reject Document"
                onClick={() => handleVerify(row.id, 'rejected')}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      )
    }
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Driver Document Controller"
        description="Verify driver-partner verification documents, license compliance files, and set automatic expiration notification alerts."
      />

      <div className="space-y-6 text-left">
        {/* Tab Selection */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
              activeTab === 'documents'
                ? 'border-[#2B317A] text-[#2B317A] dark:border-[#4F5FBF] dark:text-[#4F5FBF]'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Driver Documents
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
              activeTab === 'settings'
                ? 'border-[#2B317A] text-[#2B317A] dark:border-[#4F5FBF] dark:text-[#4F5FBF]'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Alert Threshold Config
          </button>
        </div>

        {activeTab === 'documents' ? (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">KYC Verification Files</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Review uploaded compliance items for driver authentication.</p>
            </div>

            <DataTable
              columns={columns}
              data={documents}
              selectable={false}
              resultLabel="documents"
            />
          </div>
        ) : (
          <div className="max-w-md animate-fade-in">
            <Card className="premium-card">
              <CardContent className="p-6 space-y-5 text-xs">
                <div className="border-b pb-3 mb-2 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Expiration Threshold Settings</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Determine when drivers are automatically notified before document expiry.</p>
                  </div>
                  <Settings className="h-5 w-5 text-primary" />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Standard Expiry Warning Period</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[30, 15, 7].map(days => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setAlertThreshold(days)}
                        className={`p-3 border rounded-xl font-bold flex flex-col items-center justify-center cursor-pointer transition-all ${
                          alertThreshold === days
                            ? 'bg-[#2B317A] text-white border-transparent'
                            : 'border-border text-slate-655 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-lg">{days}</span>
                        <span className="text-[8px] uppercase tracking-wider font-semibold">Days Alert</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 border-t border-border pt-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Automatic Notification Channels</label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyByEmail}
                        onChange={e => setNotifyByEmail(e.target.checked)}
                        className="w-4 h-4 accent-primary"
                      />
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Email Notification Warn-off</span>
                        <span className="block text-[9px] text-slate-400 mt-0.5">Email alerts sent daily once within the expiration window.</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyByPush}
                        onChange={e => setNotifyByPush(e.target.checked)}
                        className="w-4 h-4 accent-primary"
                      />
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">In-App Push Warning</span>
                        <span className="block text-[9px] text-slate-400 mt-0.5">Display push banners to partners when launching driver client app.</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-emerald-650 font-bold text-[9px] border-t border-border pt-4">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Changes apply to all future uploaded driver credentials automatically.
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Document Review modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-border rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-scale-up text-left text-xs">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Review Document Credentials</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {selectedDoc.id} · Driver: {selectedDoc.driverName}</p>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="text-slate-400 hover:text-slate-655">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Mock PDF document display box */}
              <div className="w-full h-48 border border-border bg-slate-100 dark:bg-slate-950 rounded-lg flex flex-col items-center justify-center text-slate-450 gap-2 border-dashed">
                <FileText className="h-10 w-10 text-primary" />
                <span className="font-bold text-[10px]">{selectedDoc.fileName}</span>
                <span className="text-[8px] italic font-semibold uppercase tracking-widest text-slate-400">PDF Reader simulation view</span>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-b border-border py-3 leading-relaxed">
                <div>
                  <span className="font-bold uppercase tracking-wider text-slate-400 text-[8px] block">Document Detail Type</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{selectedDoc.docType}</p>
                </div>
                <div>
                  <span className="font-bold uppercase tracking-wider text-slate-400 text-[8px] block">Issue Date</span>
                  <p className="font-mono font-semibold text-slate-800 dark:text-slate-200">{selectedDoc.issueDate}</p>
                </div>
                <div>
                  <span className="font-bold uppercase tracking-wider text-slate-400 text-[8px] block">Expiration Date</span>
                  <p className="font-mono font-semibold text-slate-800 dark:text-slate-200">{selectedDoc.expiryDate}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDoc(null)}
                  className="h-9 border-border"
                >
                  Close
                </Button>
                {selectedDoc.verificationStatus === 'pending' && (
                  <>
                    <Button
                      onClick={() => handleVerify(selectedDoc.id, 'rejected')}
                      className="bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold h-9 rounded-lg px-4"
                    >
                      Reject File
                    </Button>
                    <Button
                      onClick={() => handleVerify(selectedDoc.id, 'verified')}
                      className="bg-emerald-600 text-white hover:bg-emerald-750 text-xs font-semibold h-9 rounded-lg px-4"
                    >
                      Approve File
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
