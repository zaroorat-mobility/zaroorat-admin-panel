import React, { useState, useMemo, useEffect } from 'react'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { DataTable } from '@/shared/components/DataTable'
import {
  FileText, Eye, Check, X, ShieldAlert, Calendar, Settings,
  CheckCircle2, Plus, ArrowLeft, Upload, AlertCircle
} from 'lucide-react'
import {
  useDocumentCompliance,
  useDocumentSettings,
  useUpdateDocumentSettings,
  useReviewDocument,
} from '../hooks'
import type { DriverDocumentDto, DriverDocSummary, ComplianceState, DriverVerifStatus } from '../services'

// ─── Types ────────────────────────────────────────────────────────────────────

type DriverDocument = DriverDocumentDto


// ─── Phone normalisation helper (CR-02) ──────────────────────────────────────

const normalisePhone = (raw: string): string => {
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
  return digits
}

// ─── Doc slots config ─────────────────────────────────────────────────────────

const DOC_SLOTS = [
  { key: 'licence',            label: 'Driving Licence',             mandatory: true,  schoolOnly: false },
  { key: 'rc',                 label: 'RC (Registration Certificate)', mandatory: true, schoolOnly: false },
  { key: 'puc',                label: 'PUC Certificate',              mandatory: true,  schoolOnly: false },
  { key: 'insurance',          label: 'Vehicle Insurance',            mandatory: true,  schoolOnly: false },
  { key: 'permit',             label: 'Permit / Fitness Certificate', mandatory: true,  schoolOnly: false },
  { key: 'police_verification',label: 'Police Verification',          mandatory: false, schoolOnly: true  },
  { key: 'id_proof',           label: 'ID Proof (Aadhaar / PAN)',     mandatory: true,  schoolOnly: false },
]

type SlotState = { file: File | null; issueDate: string; expiryDate: string; threshold: number }

// ─── Badges ───────────────────────────────────────────────────────────────────

const ComplianceBadge = ({ state }: { state: ComplianceState }) => {
  const map: Record<ComplianceState, string> = {
    compliant:     'bg-emerald-50 text-emerald-700 border-emerald-100',
    expiring_soon: 'bg-amber-50 text-amber-700 border-amber-100',
    non_compliant: 'bg-rose-50 text-rose-700 border-rose-100',
    incomplete:    'bg-slate-100 text-slate-600 border-slate-200',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-[9px] border font-black uppercase tracking-wider ${map[state]}`}>
      {state.replace(/_/g, ' ')}
    </span>
  )
}

const VerifBadge = ({ status }: { status: DriverVerifStatus }) => {
  const map: Record<DriverVerifStatus, string> = {
    all_verified: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    pending:      'bg-slate-50 text-slate-500 border-slate-100',
    has_rejected: 'bg-rose-50 text-rose-700 border-rose-100',
  }
  const labels: Record<DriverVerifStatus, string> = {
    all_verified: 'All Verified',
    pending:      'Pending',
    has_rejected: 'Has Rejected',
  }
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] border font-black uppercase tracking-wider ${map[status]}`}>
      {labels[status]}
    </span>
  )
}

const DocVerifBadge = ({ val }: { val: string }) => {
  let style = 'bg-slate-50 text-slate-500 border-slate-100'
  if (val === 'verified') style = 'bg-emerald-50 text-emerald-700 border-emerald-100'
  if (val === 'rejected') style = 'bg-rose-50 text-rose-700 border-rose-100'
  return <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] border font-black uppercase tracking-wider ${style}`}>{val}</span>
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const DocumentControllerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'documents' | 'settings'>('documents')
  const [alertThreshold, setAlertThreshold] = useState<number>(30)
  const [notifyByEmail, setNotifyByEmail] = useState(true)
  const [notifyByPush, setNotifyByPush]   = useState(true)

  // Level navigation
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null)
  const [savedSearch, setSavedSearch] = useState('')

  // Level 1 search
  const [level1Search, setLevel1Search] = useState('')

  // Document review modal
  const [selectedDoc, setSelectedDoc] = useState<DriverDocument | null>(null)

  // Add Driver modal (UI retained; creation still goes through applications flow)
  const [showAddDriver, setShowAddDriver] = useState(false)
  const [addStep, setAddStep] = useState<1 | 2>(1)

  const [newDriver, setNewDriver] = useState({
    fullName: '', mobile: '', alternateNumber: '', email: '',
    address: '', city: '', vehicleReg: '', vehicleMake: '',
    vehicleModel: '', vehicleYear: '',
    mode: ['ride'] as string[],
    monetisation: 'commission' as 'commission' | 'monthly' | 'weekly' | 'daily',
  })

  const [docSlots, setDocSlots] = useState<Record<string, SlotState>>(
    Object.fromEntries(DOC_SLOTS.map(s => [s.key, { file: null, issueDate: '', expiryDate: '', threshold: 30 }]))
  )

  const { data: compliancePage, isLoading: isLoadingCompliance } = useDocumentCompliance({
    search: level1Search || undefined,
    limit: 100,
    alertThresholdDays: alertThreshold,
  })
  const { data: settings } = useDocumentSettings()
  const { mutate: saveSettings, isPending: isSavingSettings } = useUpdateDocumentSettings()
  const { mutate: reviewDocument } = useReviewDocument()

  useEffect(() => {
    if (!settings) return
    setAlertThreshold(settings.alertThresholdDays)
    setNotifyByEmail(settings.notifyEmail)
    setNotifyByPush(settings.notifyPush)
  }, [settings])

  const allSummaries: DriverDocSummary[] = compliancePage?.data ?? []

  const filteredSummaries = useMemo(() => {
    if (!level1Search.trim()) return allSummaries
    const normQ = normalisePhone(level1Search)
    const lowerQ = level1Search.toLowerCase()
    return allSummaries.filter(d =>
      d.driverName.toLowerCase().includes(lowerQ) ||
      d.driverId.toLowerCase().includes(lowerQ) ||
      (d.driverCode ?? '').toLowerCase().includes(lowerQ) ||
      normalisePhone(d.mobile).includes(normQ)
    )
  }, [allSummaries, level1Search])

  const selectedSummary = useMemo(() =>
    allSummaries.find(d => d.driverId === selectedDriverId) ?? null,
    [allSummaries, selectedDriverId]
  )

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleVerify = (id: string, decision: 'verified' | 'rejected') => {
    reviewDocument({
      documentId: id,
      status: decision === 'verified' ? 'VERIFIED' : 'REJECTED',
      ...(decision === 'rejected' ? { rejectionReason: 'Rejected from document controller' } : {}),
    })
    setSelectedDoc(null)
  }

  const handleDrillDown = (driverId: string) => {
    setSavedSearch(level1Search)
    setSelectedDriverId(driverId)
  }

  const handleBack = () => {
    setSelectedDriverId(null)
    setLevel1Search(savedSearch)
  }

  const handleExportCSV = () => {
    const rows = filteredSummaries.map(d => [
      d.driverCode ?? d.driverId, d.driverName, d.mobile, d.onboardedOn,
      `${d.uploadedDocs}/${d.totalDocs}`, d.complianceState, d.nearestExpiry, d.verificationStatus,
    ])
    const header = 'Driver ID,Driver Name,Mobile,Onboarded On,Documents,Compliance State,Nearest Expiry,Verification Status'
    const csv = [header, ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })),
      download: `driver_compliance_${new Date().toISOString().split('T')[0]}.csv`,
    })
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }

  const resetAddForm = () => {
    setNewDriver({ fullName: '', mobile: '', alternateNumber: '', email: '', address: '', city: '', vehicleReg: '', vehicleMake: '', vehicleModel: '', vehicleYear: '', mode: ['ride'], monetisation: 'commission' })
    setDocSlots(Object.fromEntries(DOC_SLOTS.map(s => [s.key, { file: null, issueDate: '', expiryDate: '', threshold: 30 }])))
    setAddStep(1)
  }

  const handleSaveDriver = () => {
    // Driver onboarding with documents is handled via Applications; keep UX feedback here.
    setShowAddDriver(false)
    resetAddForm()
    window.alert('Use Driver Applications to onboard a new driver with documents. Compliance list refreshes from live driver records.')
  }

  const handleSaveSettings = () => {
    saveSettings({
      alertThresholdDays: alertThreshold,
      notifyEmail: notifyByEmail,
      notifyPush: notifyByPush,
    })
  }

  // ─── Computed ────────────────────────────────────────────────────────────────

  const hasSchoolMode = newDriver.mode.includes('school') || newDriver.mode.includes('both')
  const visibleSlots = DOC_SLOTS.filter(s => !s.schoolOnly || hasSchoolMode)
  const isDuplicateMobile = false

  const step1Valid = newDriver.fullName.trim() !== '' && !isDuplicateMobile

  // ─── Level 1 columns ─────────────────────────────────────────────────────────

  const level1Cols = [
    {
      key: 'driverCode',
      label: 'Driver ID',
      render: (_: string, row: DriverDocSummary) => (
        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
          {row.driverCode ?? row.driverId.slice(0, 8)}
        </span>
      ),
    },
    {
      key: 'driverName',
      label: 'Driver Details',
      render: (val: string, row: DriverDocSummary) => (
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
            {val.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-white text-xs">{val}</p>
            <p className="text-[10px] text-muted-foreground font-mono">{row.mobile}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'onboardedOn',
      label: 'Onboarded On',
      render: (val: string) => (
        <span className="font-mono text-slate-500 text-[10px] flex items-center gap-1">
          <Calendar className="h-3 w-3" />{val}
        </span>
      ),
    },
    {
      key: 'uploadedDocs',
      label: 'Documents',
      align: 'center' as const,
      render: (val: number, row: DriverDocSummary) => (
        <span className={`font-bold text-sm font-mono ${val < row.totalDocs ? 'text-amber-600' : 'text-emerald-600'}`}>
          {val}<span className="text-slate-400 font-normal text-xs"> / {row.totalDocs}</span>
        </span>
      ),
    },
    {
      key: 'complianceState',
      label: 'Compliance State',
      render: (val: ComplianceState) => <ComplianceBadge state={val} />,
    },
    {
      key: 'nearestExpiry',
      label: 'Nearest Expiry',
      render: (val: string, row: DriverDocSummary) => {
        const color = row.complianceState === 'non_compliant' ? 'text-rose-600 font-black'
                    : row.complianceState === 'expiring_soon' ? 'text-amber-600 font-bold'
                    : 'text-slate-500'
        return <span className={`font-mono text-[10px] ${color}`}>{val}</span>
      },
    },
    {
      key: 'verificationStatus',
      label: 'Verification Status',
      render: (val: DriverVerifStatus) => <VerifBadge status={val} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center' as const,
      render: (_: any, row: DriverDocSummary) => (
        <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg border-border" title="View Driver Documents" onClick={() => handleDrillDown(row.driverId)}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  // ─── Level 2 columns (per-document) ──────────────────────────────────────────

  const level2Cols = [
    {
      key: 'id',
      label: 'Doc ID',
      render: (val: string) => <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{val}</span>,
    },
    {
      key: 'docType',
      label: 'Document Type',
      render: (val: string) => (
        <span className="uppercase font-mono font-black text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-655 px-1.5 py-0.5 rounded">
          {val.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'fileName',
      label: 'File / Uploaded',
      render: (val: string, row: DriverDocument) => (
        <div>
          <p className="text-primary hover:underline cursor-pointer font-bold truncate max-w-[140px]">{val}</p>
          <p className="text-[9px] text-slate-400 font-mono mt-0.5">Uploaded: {row.uploadDate}</p>
        </div>
      ),
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
            <p className={`flex items-center gap-1 capitalize text-[9px] ${style}`}><ShieldAlert className="h-3 w-3" /> {row.status.replace(/_/g, ' ')}</p>
          </div>
        )
      },
    },
    {
      key: 'expiryThresholdDays',
      label: 'Alert Threshold',
      render: (val: number) => <span className="font-semibold text-slate-600 dark:text-slate-400">{val} Days Expiry</span>,
    },
    {
      key: 'verificationStatus',
      label: 'Verification Status',
      render: (val: string) => <DocVerifBadge val={val} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center' as const,
      render: (_: any, row: DriverDocument) => (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg border-border" title="View Document" onClick={() => setSelectedDoc(row)}>
            <Eye className="h-4 w-4" />
          </Button>
          {row.verificationStatus === 'pending' && (
            <>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-transparent" title="Approve" onClick={() => handleVerify(row.id, 'verified')}>
                <Check className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border-transparent" title="Reject" onClick={() => handleVerify(row.id, 'rejected')}>
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ]

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <PageWrapper>
      <PageHeader
        title={selectedDriverId ? `Documents — ${selectedSummary?.driverName ?? selectedDriverId}` : 'Driver Document Controller'}
        description={
          selectedDriverId
            ? `Reviewing ${selectedSummary?.uploadedDocs ?? 0} of ${selectedSummary?.totalDocs ?? 0} expected documents.`
            : 'Verify driver-partner compliance documents, manage expiration alerts, and add new drivers with their document set.'
        }
        actions={
          !selectedDriverId ? (
            <Button onClick={() => { setShowAddDriver(true); setAddStep(1) }} className="gap-1.5 bg-[#1F2B6D] text-white hover:bg-[#1F2B6D]/90 text-xs font-semibold h-9 rounded-lg">
              <Plus className="h-4 w-4" /> Add Driver
            </Button>
          ) : undefined
        }
      />

      <div className="space-y-6 text-left">

        {/* Tab bar — only at Level 1 */}
        {!selectedDriverId && (
          <div className="flex border-b border-border">
            {(['documents', 'settings'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
                  activeTab === tab
                    ? 'border-[#2B317A] text-[#2B317A] dark:border-[#4F5FBF] dark:text-[#4F5FBF]'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'documents' ? 'Driver Documents' : 'Alert Threshold Config'}
              </button>
            ))}
          </div>
        )}

        {/* ══════════ LEVEL 2 ══════════ */}
        {selectedDriverId ? (
          <div className="space-y-4 animate-fade-in">
            <button onClick={handleBack} className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline cursor-pointer">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Document List
            </button>

            {selectedSummary && (
              <Card className="premium-card">
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-6 text-xs">
                    {[
                      { label: 'Driver ID',    value: selectedSummary.driverId,    mono: true  },
                      { label: 'Name',          value: selectedSummary.driverName,  mono: false },
                      { label: 'Mobile',        value: selectedSummary.mobile,      mono: true  },
                      { label: 'Onboarded On',  value: selectedSummary.onboardedOn, mono: true  },
                    ].map(({ label, value, mono }) => (
                      <div key={label}>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">{label}</span>
                        <p className={`font-bold text-slate-800 dark:text-slate-200 ${mono ? 'font-mono' : ''}`}>{value}</p>
                      </div>
                    ))}
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Compliance</span>
                      <ComplianceBadge state={selectedSummary.complianceState} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <DataTable columns={level2Cols} data={selectedSummary?.documents ?? []} selectable={false} resultLabel="documents" />
          </div>

        ) : activeTab === 'documents' ? (

          /* ══════════ LEVEL 1 ══════════ */
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Driver Compliance Overview</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">One row per onboarded driver — click the eye icon to review documents.</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={level1Search}
                  onChange={e => setLevel1Search(e.target.value)}
                  placeholder="Search by driver name, ID or phone number..."
                  className="pl-3 pr-4 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px] w-72"
                />
                <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1 text-xs h-[34px] border-border">
                  <FileText className="h-3.5 w-3.5" /> Export CSV
                </Button>
              </div>
            </div>
            <DataTable
              columns={level1Cols}
              data={filteredSummaries}
              selectable={false}
              resultLabel="drivers"
              isLoading={isLoadingCompliance}
            />
          </div>

        ) : (

          /* ══════════ SETTINGS TAB ══════════ */
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
                      <button key={days} type="button" onClick={() => setAlertThreshold(days)}
                        className={`p-3 border rounded-xl font-bold flex flex-col items-center justify-center cursor-pointer transition-all ${alertThreshold === days ? 'bg-[#2B317A] text-white border-transparent' : 'border-border text-slate-655 hover:bg-slate-50'}`}>
                        <span className="text-lg">{days}</span>
                        <span className="text-[8px] uppercase tracking-wider font-semibold">Days Alert</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 border-t border-border pt-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Automatic Notification Channels</label>
                  <div className="space-y-3">
                    {[
                      { checked: notifyByEmail, onChange: setNotifyByEmail, label: 'Email Notification Warn-off', sub: 'Email alerts sent daily once within the expiration window.' },
                      { checked: notifyByPush,  onChange: setNotifyByPush,  label: 'In-App Push Warning',         sub: 'Display push banners to partners when launching driver client app.' },
                    ].map(({ checked, onChange, label, sub }) => (
                      <label key={label} className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="w-4 h-4 accent-primary" />
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{label}</span>
                          <span className="block text-[9px] text-slate-400 mt-0.5">{sub}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-emerald-650 font-bold text-[9px] border-t border-border pt-4">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Changes apply to all future uploaded driver credentials automatically.
                </div>

                <Button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                  className="w-full h-9 rounded-lg bg-[#1F2B6D] text-white text-xs font-semibold"
                >
                  {isSavingSettings ? 'Saving…' : 'Save Settings'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* ══════════ Document Review Modal ══════════ */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-border rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-scale-up text-left text-xs">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Review Document Credentials</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {selectedDoc.id} · Driver: {selectedDoc.driverName}</p>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="text-slate-400 hover:text-slate-655"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="w-full h-48 border border-border bg-slate-100 dark:bg-slate-950 rounded-lg flex flex-col items-center justify-center text-slate-450 gap-2 border-dashed">
                <FileText className="h-10 w-10 text-primary" />
                <span className="font-bold text-[10px]">{selectedDoc.fileName}</span>
                <span className="text-[8px] italic font-semibold uppercase tracking-widest text-slate-400">PDF Reader simulation view</span>
              </div>
              <div className="grid grid-cols-3 gap-4 border-t border-b border-border py-3 leading-relaxed">
                <div><span className="font-bold uppercase tracking-wider text-slate-400 text-[8px] block">Type</span><p className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{selectedDoc.docType.replace(/_/g, ' ')}</p></div>
                <div><span className="font-bold uppercase tracking-wider text-slate-400 text-[8px] block">Issue Date</span><p className="font-mono font-semibold text-slate-800 dark:text-slate-200">{selectedDoc.issueDate}</p></div>
                <div><span className="font-bold uppercase tracking-wider text-slate-400 text-[8px] block">Expiry Date</span><p className="font-mono font-semibold text-slate-800 dark:text-slate-200">{selectedDoc.expiryDate}</p></div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedDoc(null)} className="h-9 border-border">Close</Button>
                {selectedDoc.verificationStatus === 'pending' && (
                  <>
                    <Button onClick={() => handleVerify(selectedDoc.id, 'rejected')} className="bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold h-9 rounded-lg px-4">Reject File</Button>
                    <Button onClick={() => handleVerify(selectedDoc.id, 'verified')} className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold h-9 rounded-lg px-4">Approve File</Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ Add Driver — Two-Step Modal ══════════ */}
      {showAddDriver && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-border rounded-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl text-left animate-scale-up">

            {/* Modal header */}
            <div className="flex justify-between items-center border-b border-border px-6 py-4 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Add Driver with Documents</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Step {addStep} of 2 — {addStep === 1 ? 'Driver & Vehicle Info' : 'Document Upload'}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-1.5 w-10 rounded-full transition-colors ${addStep >= 1 ? 'bg-[#1F2B6D]' : 'bg-slate-200'}`} />
                <div className={`h-1.5 w-10 rounded-full transition-colors ${addStep >= 2 ? 'bg-[#1F2B6D]' : 'bg-slate-200'}`} />
                <button onClick={() => { setShowAddDriver(false); resetAddForm() }} className="text-slate-400 hover:text-slate-600 ml-1"><X className="h-5 w-5" /></button>
              </div>
            </div>

            <div className="p-6 text-xs">

              {/* ── STEP 1 ── */}
              {addStep === 1 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Full Name *',            key: 'fullName',       type: 'text',  placeholder: 'e.g. Rajesh Kumar'   },
                      { label: 'Alternate Number',       key: 'alternateNumber',type: 'tel',   placeholder: 'Optional'             },
                      { label: 'Email',                  key: 'email',          type: 'email', placeholder: 'Optional'             },
                      { label: 'Address *',              key: 'address',        type: 'text',  placeholder: 'Street, locality'     },
                      { label: 'City *',                 key: 'city',           type: 'text',  placeholder: 'e.g. Bengaluru'       },
                      { label: 'Vehicle Registration *', key: 'vehicleReg',     type: 'text',  placeholder: 'e.g. KA-01-AB-1234',  },
                      { label: 'Vehicle Make *',         key: 'vehicleMake',    type: 'text',  placeholder: 'e.g. Maruti Suzuki'   },
                      { label: 'Vehicle Model *',        key: 'vehicleModel',   type: 'text',  placeholder: 'e.g. Swift Dzire'     },
                      { label: 'Manufacturing Year *',   key: 'vehicleYear',    type: 'number',placeholder: 'e.g. 2021'            },
                    ].map(({ label, key, type, placeholder }) => (
                      <div key={key} className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
                        <input type={type} placeholder={placeholder} value={(newDriver as any)[key]}
                          onChange={e => setNewDriver({ ...newDriver, [key]: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>
                    ))}

                    {/* Mobile — with duplicate check */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile Number *</label>
                      <input type="tel" placeholder="10-digit number" value={newDriver.mobile}
                        onChange={e => setNewDriver({ ...newDriver, mobile: e.target.value })}
                        className={`w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:outline-none ${isDuplicateMobile ? 'border-rose-400 focus:ring-rose-400' : 'border-border focus:ring-primary'}`}
                      />
                      {isDuplicateMobile && (
                        <p className="text-[9px] text-rose-600 flex items-center gap-1 mt-0.5"><AlertCircle className="h-3 w-3" /> Already registered.</p>
                      )}
                    </div>
                  </div>

                  {/* Mode */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Service Mode *</label>
                    <div className="flex gap-4">
                      {['ride', 'school', 'both'].map(m => (
                        <label key={m} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" className="w-4 h-4 accent-primary"
                            checked={newDriver.mode.includes(m)}
                            onChange={e => setNewDriver({ ...newDriver, mode: e.target.checked ? [...newDriver.mode, m] : newDriver.mode.filter(x => x !== m) })}
                          />
                          <span className="font-semibold capitalize text-slate-700 dark:text-slate-300">{m}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Monetisation */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monetisation Election *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'commission', label: '7% Commission',   sub: 'Per-ride platform fee' },
                        { value: 'monthly',    label: '₹1,999 / Month',  sub: 'Subscription — monthly' },
                        { value: 'weekly',     label: '₹599 / Week',     sub: 'Subscription — weekly' },
                        { value: 'daily',      label: '₹89 / Day',       sub: 'Subscription — daily' },
                      ].map(opt => (
                        <label key={opt.value}
                          className={`flex items-start gap-2.5 cursor-pointer p-3 rounded-xl border transition-all ${newDriver.monetisation === opt.value ? 'border-[#1F2B6D] bg-[#1F2B6D]/5' : 'border-border hover:bg-slate-50'}`}>
                          <input type="radio" name="monetisation" value={opt.value} className="mt-0.5 accent-primary"
                            checked={newDriver.monetisation === opt.value}
                            onChange={() => setNewDriver({ ...newDriver, monetisation: opt.value as any })}
                          />
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{opt.label}</p>
                            <p className="text-[9px] text-slate-400">{opt.sub}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 border-t border-border pt-4">
                    <Button variant="outline" size="sm" onClick={() => { setShowAddDriver(false); resetAddForm() }} className="h-9 border-border">Cancel</Button>
                    <Button disabled={!step1Valid} onClick={() => setAddStep(2)} className="bg-[#1F2B6D] text-white hover:bg-[#1F2B6D]/90 text-xs font-semibold h-9 rounded-lg px-5">
                      Next: Upload Documents →
                    </Button>
                  </div>
                </div>
              )}

              {/* ── STEP 2 ── */}
              {addStep === 2 && (
                <div className="space-y-4">
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Upload PDF, JPG or PNG (max 5 MB each). Saving with an incomplete set is allowed — the driver will be marked as <strong>Incomplete</strong>.
                    All documents enter as <strong>Pending</strong> and require admin verification.
                    {hasSchoolMode && <span className="ml-1 text-indigo-600 font-semibold">Police Verification is mandatory for School mode.</span>}
                  </p>

                  <div className="space-y-3">
                    {visibleSlots.map(slot => {
                      const sd = docSlots[slot.key]
                      const isRequired = slot.mandatory || (slot.schoolOnly && hasSchoolMode)
                      return (
                        <div key={slot.key} className="border border-border rounded-xl p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {slot.label}{isRequired && <span className="text-rose-500 ml-0.5">*</span>}
                            </span>
                            {slot.schoolOnly && <span className="text-[8px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5 py-0.5 rounded font-bold uppercase">School Mode</span>}
                          </div>

                          <label className={`flex items-center gap-3 border-2 border-dashed rounded-lg p-3 cursor-pointer transition-colors ${sd.file ? 'border-emerald-300 bg-emerald-50/30' : 'border-border hover:border-primary/40 hover:bg-primary/5'}`}>
                            <Upload className={`h-4 w-4 flex-shrink-0 ${sd.file ? 'text-emerald-600' : 'text-slate-400'}`} />
                            <span className={`text-xs ${sd.file ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                              {sd.file ? sd.file.name : 'Click to upload PDF / JPG / PNG (max 5 MB)'}
                            </span>
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0] ?? null
                                if (file && file.size > 5 * 1024 * 1024) { alert(`${file.name} exceeds 5 MB`); return }
                                setDocSlots(prev => ({ ...prev, [slot.key]: { ...prev[slot.key], file } }))
                              }}
                            />
                          </label>

                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { lbl: 'Issue Date',   field: 'issueDate',  type: 'date' },
                              { lbl: 'Expiry Date',  field: 'expiryDate', type: 'date' },
                              { lbl: 'Alert (Days)', field: 'threshold',  type: 'number' },
                            ].map(({ lbl, field, type }) => (
                              <div key={field} className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{lbl}</label>
                                <input type={type} min={type === 'number' ? 1 : undefined}
                                  value={(sd as any)[field]}
                                  onChange={e => setDocSlots(prev => ({
                                    ...prev,
                                    [slot.key]: { ...prev[slot.key], [field]: type === 'number' ? parseInt(e.target.value) || 30 : e.target.value },
                                  }))}
                                  className="w-full px-2 py-1.5 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex justify-between gap-2 border-t border-border pt-4">
                    <Button variant="outline" size="sm" onClick={() => setAddStep(1)} className="h-9 border-border">← Back</Button>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setShowAddDriver(false); resetAddForm() }} className="h-9 border-border">Cancel</Button>
                      <Button disabled={!newDriver.fullName.trim()} onClick={handleSaveDriver} className="bg-[#1F2B6D] text-white hover:bg-[#1F2B6D]/90 text-xs font-semibold h-9 rounded-lg px-5">
                        Save Driver
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}

export default DocumentControllerPage
