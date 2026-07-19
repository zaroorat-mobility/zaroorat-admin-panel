import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  useApplication,
  useApproveApplication,
  useRejectApplication,
  useRequestResubmission,
  useVerifyApplicationDocument
} from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/Card'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { Button } from '@/shared/components/ui/Button'
import { ImagePreviewModal } from '../../components/ImagePreviewModal'
import { ApplicationSourceBadge } from '../../components/ApplicationSourceBadge'
import { ExpiryIndicator } from '../../components/ExpiryIndicator'
import {
  Check,
  X,
  ShieldAlert,
  RefreshCcw,
  Eye,
  CreditCard,
  User,
  AlertTriangle,
  FolderOpen,
  Calendar,
  MapPin,
  Car,
  History,
  FileText,
  Clock
} from 'lucide-react'
import { cn } from '@/shared/utils'

type DetailTab = 'overview' | 'documents' | 'vehicle' | 'bank' | 'timeline' | 'audit'

export const ApplicationReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<DetailTab>('overview')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState('')
  const [docComment, setDocComment] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedAuditDocType, setSelectedAuditDocType] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'commission' | 'subscription'>('free')

  const { data: application, isLoading, refetch } = useApplication(id || '')
  const { mutate: approve, isPending: isApproving } = useApproveApplication()
  const { mutate: reject, isPending: isRejecting } = useRejectApplication()
  const { mutate: requestResubmit, isPending: isResubmitting } = useRequestResubmission()
  const { mutate: verifyDoc, isPending: isDocVerifying } = useVerifyApplicationDocument()

  // Initialize selected document for documents tab feedback
  useEffect(() => {
    if (application && application.documents.length > 0 && !selectedAuditDocType) {
      setSelectedAuditDocType(application.documents[0].docType)
    }
  }, [application, selectedAuditDocType])

  // Sync document comment feedback when selected document changes
  useEffect(() => {
    if (application && selectedAuditDocType) {
      const doc = application.documents.find(d => d.docType === selectedAuditDocType)
      setDocComment(doc?.comment || '')
    }
  }, [selectedAuditDocType, application])

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center p-12 text-slate-500 font-medium animate-pulse">
          Loading Driver Application details...
        </div>
      </PageWrapper>
    )
  }

  if (!application) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <FolderOpen className="h-12 w-12 text-slate-400" />
          <h3 className="text-base font-bold text-text-primary">Application Profile Not Found</h3>
          <Button onClick={() => navigate('/driver-management/applications')}>Back to List</Button>
        </div>
      </PageWrapper>
    )
  }

  const handleUpdateDocStatus = (status: 'approved' | 'rejected' | 'pending' | 'reupload_requested', type: string) => {
    verifyDoc({
      applicationId: application.id,
      docType: type,
      status,
      comment: status !== 'approved' ? docComment : undefined
    }, {
      onSuccess: () => {
        refetch()
      }
    })
  }

  const handleApproveOverall = () => {
    approve({ id: application.id, notes, billingMode: selectedPlan }, {
      onSuccess: () => navigate('/driver-management/applications'),
    })
  }

  const handleRejectOverall = () => {
    reject({ id: application.id, notes }, {
      onSuccess: () => navigate('/driver-management/applications'),
    })
  }

  const handleResubmitOverall = () => {
    requestResubmit({ id: application.id, notes }, {
      onSuccess: () => navigate('/driver-management/applications'),
    })
  }

  const rejectedDocs = application.documents.filter(d => d.verifyStatus === 'rejected' || d.verifyStatus === 'reupload_requested')
  const pendingDocs = application.documents.filter(d => d.verifyStatus === 'pending')

  const openPreview = (url: string, title: string) => {
    setPreviewImage(url)
    setPreviewTitle(title)
  }

  return (
    <PageWrapper>
      <PageHeader
        title={`KYC Compliance Review: ${application.driverName}`}
        description="Verify driver onboarding documents, details, and authorize fleet enrollment."
        onBack={() => navigate('/driver-management/applications')}
      />

      {/* Application Summary Header Band */}
      <div className="premium-card bg-surface border border-border p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 mb-6 text-left">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Application Details</span>
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-black text-slate-700 dark:text-slate-350 font-mono">{application.applicationId}</h3>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-xs text-muted-foreground">
              Submitted: <strong>{new Date(application.submittedAt).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}</strong>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ApplicationSourceBadge source={application.source} />
          <StatusBadge status={application.applicationStatus} />
        </div>
      </div>

      {/* Main Tab bar navigation */}
      <div className="flex border-b border-border mb-6 overflow-x-auto text-left gap-2 print:hidden mt-2">
        {[
          { id: 'overview', label: 'Overview', icon: User },
          { id: 'documents', label: 'Documents Checklist', icon: FileText },
          { id: 'vehicle', label: 'Vehicle Details', icon: Car },
          { id: 'bank', label: 'Bank Details', icon: CreditCard },
          { id: 'timeline', label: 'Timeline', icon: Clock },
          { id: 'audit', label: 'Audit Trail', icon: History },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DetailTab)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 -mb-px outline-none",
                isActive
                  ? "border-primary text-primary font-black"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT TWO COLUMNS: DYNAMIC TABS WORKSPACE */}
        <div className="lg:col-span-2 space-y-6">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <Card className="premium-card text-left">
                <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
                  <div className="h-24 w-24 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-border flex-shrink-0 flex items-center justify-center">
                    {application.profilePhotoUrl ? (
                      <img src={application.profilePhotoUrl} alt="Driver Profile" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-8 w-8 text-slate-300" />
                    )}
                  </div>
                  <div className="space-y-1 flex-grow">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-800 dark:text-slate-150">{application.driverName}</h3>
                    </div>
                    <p className="text-xs text-slate-500">
                      Mobile: <strong className="text-slate-800 dark:text-slate-200">{application.mobileNumber}</strong>
                      {application.email && <> | Email: <strong className="text-slate-800 dark:text-slate-200">{application.email}</strong></>}
                    </p>
                    <p className="text-xs text-slate-500">
                      Gender / DOB: <strong>{application.gender || '—'} / {application.dateOfBirth || '—'}</strong>
                    </p>
                    {application.country && (
                      <p className="text-xs text-slate-500 flex items-start gap-1 mt-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <span>
                          {application.addressLine1}, {application.addressLine2 ? `${application.addressLine2}, ` : ''}
                          {application.city}, {application.state} - {application.postcode} ({application.country})
                        </span>
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Status and ratings grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Background Check', value: application.bgCheckStatus.replace('_', ' ').toUpperCase(), desc: 'Third party verification' },
                  { label: 'Online Status', value: application.onlineStatus.toUpperCase(), desc: 'Registration state' },
                  { label: 'Trips Completed', value: application.totalTrips, desc: 'Prior platform history' },
                  { label: 'Rating Avg', value: `${application.ratingAvg} ★`, desc: 'Average passenger rating' },
                ].map((stat, i) => (
                  <Card key={i} className="premium-card text-left p-4 space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                    <p className="text-lg font-black text-slate-800 dark:text-slate-100">{stat.value}</p>
                    <p className="text-[9px] text-slate-400">{stat.desc}</p>
                  </Card>
                ))}
              </div>

              {/* Emergency & Preferred language card */}
              <Card className="premium-card text-left">
                <CardHeader>
                  <CardTitle className="text-sm">Additional Application Metadata</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <p><span className="text-muted-foreground font-medium">Preferred Language:</span> <strong>{application.preferredLanguage || '—'}</strong></p>
                  <p><span className="text-muted-foreground font-medium">Referral Code:</span> <strong>{application.referralCode || '—'}</strong></p>
                  <p><span className="text-muted-foreground font-medium">Emergency Contact Name:</span> <strong>{application.emergencyContactName || '—'}</strong></p>
                  <p><span className="text-muted-foreground font-medium">Emergency Contact Phone:</span> <strong>{application.emergencyContactNumber || '—'}</strong></p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 2: DOCUMENTS CHECKLIST */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {application.documents.map((doc) => {
                  let statusColor = 'text-slate-500 bg-slate-100 dark:bg-slate-850 border-slate-200'
                  if (doc.verifyStatus === 'approved') statusColor = 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200'
                  if (doc.verifyStatus === 'rejected') statusColor = 'text-rose-700 bg-rose-50 dark:bg-rose-950/20 border-rose-200'
                  if (doc.verifyStatus === 'reupload_requested') statusColor = 'text-amber-700 bg-amber-50 dark:bg-amber-950/20 border-amber-200'

                  return (
                    <Card key={doc.id} className={cn("premium-card text-left p-4 space-y-3.5 relative border", selectedAuditDocType === doc.docType ? "border-primary ring-1 ring-primary/20" : "")}>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">Document Category</span>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-150 capitalize">{doc.docType.replace('_', ' ')}</h4>
                          {doc.docNumber && <p className="text-[10px] text-slate-400 mt-0.5">Doc ID: {doc.docNumber}</p>}
                        </div>
                        <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border", statusColor)}>
                          {doc.verifyStatus.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Small thumbnail preview */}
                      <div className="h-28 w-full bg-slate-100 dark:bg-slate-900 border border-border rounded-lg overflow-hidden relative group">
                        <img src={doc.fileUrl} alt={doc.docType} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => openPreview(doc.fileUrl, doc.docType.replace('_', ' '))}
                            className="h-8 w-8 p-0 rounded-lg"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Doc feedback comment */}
                      {doc.comment && (
                        <p className="text-[9px] bg-rose-50 dark:bg-rose-950/20 text-rose-600 p-2 rounded border border-rose-100 dark:border-rose-900">
                          <strong>Feedback Remark:</strong> {doc.comment}
                        </p>
                      )}

                      {/* Audit action items */}
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <button
                          type="button"
                          onClick={() => setSelectedAuditDocType(doc.docType)}
                          className="text-[10px] font-bold text-primary hover:underline"
                        >
                          Feedback Panel
                        </button>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateDocStatus('approved', doc.docType)}
                            className="p-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100"
                            title="Approve"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateDocStatus('rejected', doc.docType)}
                            className="p-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100"
                            title="Reject"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* TAB 3: VEHICLE DETAILS */}
          {activeTab === 'vehicle' && (
            <div className="space-y-6">
              {application.vehicle ? (
                <>
                  <Card className="premium-card text-left">
                    <CardHeader>
                      <CardTitle>Vehicle Specifications</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <p><span className="text-muted-foreground font-medium">Vehicle Class Type:</span> <strong className="uppercase">{application.vehicle.vehicleType}</strong></p>
                      <p><span className="text-muted-foreground font-medium">Category Class:</span> <strong>{application.vehicle.vehicleCategory || '—'}</strong></p>
                      <p><span className="text-muted-foreground font-medium">Brand & Make:</span> <strong>{application.vehicle.brand || '—'}</strong></p>
                      <p><span className="text-muted-foreground font-medium">Model Variant:</span> <strong>{application.vehicle.model || '—'}</strong></p>
                      <p><span className="text-muted-foreground font-medium">Plate Number:</span> <strong className="uppercase">{application.vehicle.registrationPlate}</strong></p>
                      <p><span className="text-muted-foreground font-medium">Color:</span> <strong>{application.vehicle.color || '—'}</strong></p>
                      <p><span className="text-muted-foreground font-medium">Seats Capacity:</span> <strong>{application.vehicle.seatsCapacity} Seats</strong></p>
                      <p><span className="text-muted-foreground font-medium">Manufacturing Year:</span> <strong>{application.vehicle.manufacturingYear || '—'}</strong></p>
                    </CardContent>
                  </Card>

                  {/* Expiry alerts & Vehicle documents checklist */}
                  <Card className="premium-card text-left">
                    <CardHeader>
                      <CardTitle>Asset Expiry & Alert Indicators</CardTitle>
                      <CardDescription>Visual state of transport licenses, permits, and fitness policies.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { label: 'Insurance Policy Cover', docNo: application.vehicle.insuranceNo, exp: application.vehicle.insuranceExpiry },
                        { label: 'Commercial Road Permit', docNo: application.vehicle.permitNo, exp: application.vehicle.permitExpiry },
                        { label: 'Pollution Certificate (PUC)', docNo: application.vehicle.pollutionNo, exp: application.vehicle.pollutionExpiry },
                        ...(application.vehicle.fitnessNo ? [{ label: 'Fitness Certificate', docNo: application.vehicle.fitnessNo, exp: application.vehicle.fitnessExpiry }] : []),
                      ].map((item, index) => (
                        <div key={index} className="p-3.5 border border-border rounded-xl flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.label}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Policy / Reg No: {item.docNo || '—'}</p>
                          </div>
                          <ExpiryIndicator expiryDate={item.exp} />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="text-center py-12 text-slate-400 font-medium">No vehicle asset registered.</div>
              )}
            </div>
          )}

          {/* TAB 4: BANK DETAILS */}
          {activeTab === 'bank' && (
            <Card className="premium-card text-left">
              <CardHeader>
                <CardTitle>Settlement Bank Accounts</CardTitle>
                <CardDescription>Payout settlements and routing credentials.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                  <p><span className="text-muted-foreground font-medium">Account Holder Name:</span> <strong>{application.bankAccountName || '—'}</strong></p>
                  <p><span className="text-muted-foreground font-medium">Bank Institution:</span> <strong>{application.bankName || '—'}</strong></p>
                  <p>
                    <span className="text-muted-foreground font-medium">Account Number:</span>
                    <strong className="tracking-wider ml-1">
                      {application.bankAccountNumber
                        ? `XXXXXX${application.bankAccountNumber.slice(-4)}`
                        : '—'}
                    </strong>
                  </p>
                  <p><span className="text-muted-foreground font-medium">IFSC Routing Code:</span> <strong className="uppercase">{application.bankIfsc || '—'}</strong></p>
                  <p><span className="text-muted-foreground font-medium">UPI Address ID:</span> <strong>{application.upiId || '—'}</strong></p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 5: TIMELINE */}
          {activeTab === 'timeline' && (
            <Card className="premium-card text-left">
              <CardHeader>
                <CardTitle>Application Funnel Lifecycle Timeline</CardTitle>
                <CardDescription>Operations tracking showing documents upload, review progression and stage triggers.</CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                {application.timeline && application.timeline.length > 0 ? (
                  <div className="relative border-l-2 border-slate-200 pl-6 space-y-6 dark:border-slate-800">
                    {application.timeline.map((event) => (
                      <div key={event.id} className="relative group text-xs text-slate-600 dark:text-slate-400">
                        {/* Event icon dot */}
                        <span className="absolute -left-[31px] top-0.5 h-3.5 w-3.5 rounded-full bg-white dark:bg-slate-900 border-2 border-primary flex items-center justify-center shadow-sm" />
                        
                        <div className="flex flex-col gap-0.5">
                          <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{event.action}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <span>Actor: <strong className="text-slate-500">{event.actor}</strong></span>
                            <span>•</span>
                            <span>{new Date(event.timestamp).toLocaleString('en-IN')}</span>
                          </div>
                          {event.notes && (
                            <p className="mt-1 bg-slate-50 border border-border p-2 rounded-lg text-slate-500 dark:bg-slate-950/40">
                              {event.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 font-medium">No timeline events recorded.</div>
                )}
              </CardContent>
            </Card>
          )}

          {/* TAB 6: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <Card className="premium-card text-left">
              <CardHeader>
                <CardTitle>Compliance Audits History Log</CardTitle>
                <CardDescription>Vertically logged chronological actions taken by admins and backend operators.</CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-4">
                <div className="relative border-l border-slate-200 pl-4 space-y-4 dark:border-slate-800">
                  {application.auditLogs.map((log, index) => (
                    <div key={index} className="space-y-1 relative">
                      <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary border-2 border-white dark:border-slate-900" />
                      <p className="text-xs font-bold text-text-primary">{log.action}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{log.operator}</span>
                        <span>•</span>
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </p>
                      {log.notes && (
                        <p className="text-[10px] bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-border text-slate-600 mt-1 dark:text-slate-400">
                          {log.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        {/* RIGHT COLUMN: ACTION PANELS & DECISIONS */}
        <div className="space-y-6">
          
          {/* Document feedback audit panel */}
          {activeTab === 'documents' && selectedAuditDocType && (
            <Card className="premium-card text-left">
              <CardHeader>
                <CardTitle className="capitalize text-xs font-bold uppercase tracking-wider">{selectedAuditDocType.replace('_', ' ')} Review Panel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Document Review State</label>
                  <div>
                    <StatusBadge status={application.documents.find(d => d.docType === selectedAuditDocType)?.verifyStatus || 'pending'} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Document Comments / Feedback</label>
                  <textarea
                    value={docComment}
                    onChange={(e) => setDocComment(e.target.value)}
                    placeholder="Enter reason if rejecting or requesting reupload..."
                    className="w-full h-20 rounded-lg border border-input bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 dark:bg-slate-900"
                  />
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    className="w-full gap-2 rounded-xl justify-center h-9 text-xs"
                    variant="primary"
                    onClick={() => handleUpdateDocStatus('approved', selectedAuditDocType)}
                    loading={isDocVerifying}
                  >
                    <Check className="h-4 w-4" />
                    <span>Approve Document</span>
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="danger"
                      className="gap-2 rounded-xl justify-center h-9 text-xs"
                      onClick={() => handleUpdateDocStatus('rejected', selectedAuditDocType)}
                      loading={isDocVerifying}
                    >
                      <X className="h-4 w-4" />
                      <span>Reject</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2 rounded-xl justify-center h-9 text-[10px] text-primary"
                      onClick={() => {
                        handleUpdateDocStatus('reupload_requested', selectedAuditDocType)
                      }}
                      loading={isDocVerifying}
                    >
                      <RefreshCcw className="h-3.5 w-3.5" />
                      <span>Request Reupload</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Overall Review Decision Panel */}
          <Card className="premium-card border-2 border-primary/20 text-left">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-sm font-black uppercase tracking-wider text-primary font-mono">Overall Review Decision</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              {rejectedDocs.length > 0 ? (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex gap-2.5 items-start dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400">
                  <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0" />
                  <div className="space-y-0.5">
                    <span className="font-bold">Corrections Pending</span>
                    <p className="opacity-90">{rejectedDocs.length} document assets flagged. Re-upload or rejection recommended.</p>
                  </div>
                </div>
              ) : pendingDocs.length > 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex gap-2.5 items-start dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-400">
                  <ShieldAlert className="h-5 w-5 text-amber-500 flex-shrink-0" />
                  <div className="space-y-0.5">
                    <span className="font-bold">Auditing In-Progress</span>
                    <p className="opacity-90">{pendingDocs.length} document checklists require auditing reviews.</p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex gap-2.5 items-start dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400">
                  <Check className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <div className="space-y-0.5">
                    <span className="font-bold">All Checklists Verified</span>
                    <p className="opacity-90">All 11 KYC document attachments verified. Application ready for activation.</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Initial Monetization Plan</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['free', 'commission', 'subscription'] as const).map((plan) => (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => setSelectedPlan(plan)}
                      className={cn(
                        "p-2 text-xs font-bold rounded-lg border transition-colors capitalize",
                        selectedPlan === plan
                          ? "bg-primary border-primary text-white border-transparent"
                          : "bg-surface border-border hover:bg-slate-50 text-slate-700 dark:text-slate-350 dark:hover:bg-slate-800"
                      )}
                    >
                      {plan === 'free' ? 'Free Month' : plan === 'commission' ? '7% Comm.' : 'Sub.'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Overall Compliance Decision Remarks</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Compliance review comments logged to history timelines..."
                  className="w-full h-20 rounded-lg border border-input bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 dark:bg-slate-900"
                />
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  className="w-full gap-2 rounded-xl justify-center h-10 font-bold"
                  variant="primary"
                  onClick={handleApproveOverall}
                  loading={isApproving}
                  disabled={rejectedDocs.length > 0 || pendingDocs.length > 0}
                >
                  <Check className="h-4 w-4" />
                  <span>Approve & Activate Driver</span>
                </Button>
                <div className="grid grid-cols-2 gap-2.5">
                  <Button
                    variant="danger"
                    className="gap-2 rounded-xl justify-center h-10 text-xs font-semibold"
                    onClick={handleRejectOverall}
                    loading={isRejecting}
                  >
                    <X className="h-4 w-4" />
                    <span>Reject</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 rounded-xl justify-center h-10 text-[10px] font-semibold text-primary"
                    onClick={handleResubmitOverall}
                    loading={isResubmitting}
                  >
                    <RefreshCcw className="h-3.5 w-3.5" />
                    <span>Request Resubmit</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      <ImagePreviewModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage || ''}
        title={previewTitle}
      />
    </PageWrapper>
  )
}

export default ApplicationReviewPage
