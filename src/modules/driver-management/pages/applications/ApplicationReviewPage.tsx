import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  useApplication,
  useApproveApplication,
  useRejectApplication,
  useRequestResubmission,
  useVerifyApplicationDocument,
} from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { ImagePreviewModal } from '../../components/ImagePreviewModal'
import { FileImage } from '@/shared/components/FileImage'
import { getFileReadUrl } from '@/shared/services/file-upload.service'
import { isFileId, resolveFileRef } from '@/shared/utils/file-ref'
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
  Clock,
  ArrowLeft,
} from 'lucide-react'
import { cn } from '@/shared/utils'
import { useToast } from '@/shared/context/toast'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'

type DetailTab = 'overview' | 'documents' | 'vehicle' | 'bank' | 'timeline' | 'audit'

export const ApplicationReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<DetailTab>('overview')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState('')
  const [docComment, setDocComment] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedAuditDocId, setSelectedAuditDocId] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'commission' | 'subscription'>('free')
  const { success: showSuccess, error: showError } = useToast()
  const user = useAuthStore((state) => state.user)
  const canVerify = hasPermission(user, 'drivers:verify')

  const { data: application, isLoading, refetch } = useApplication(id || '')
  const { mutate: approve, isPending: isApproving } = useApproveApplication()
  const { mutate: reject, isPending: isRejecting } = useRejectApplication()
  const { mutate: requestResubmit, isPending: isResubmitting } = useRequestResubmission()
  const { mutate: verifyDoc, isPending: isDocVerifying } = useVerifyApplicationDocument()

  // Initialize selected document for documents tab feedback
  useEffect(() => {
    if (application && application.documents.length > 0 && !selectedAuditDocId) {
      setSelectedAuditDocId(application.documents[0].id)
    }
  }, [application, selectedAuditDocId])

  // Sync document comment feedback when selected document changes
  useEffect(() => {
    if (application && selectedAuditDocId) {
      const doc = application.documents.find((d) => d.id === selectedAuditDocId)
      setDocComment(doc?.comment || '')
    }
  }, [selectedAuditDocId, application])

  if (isLoading) {
    return (
      <PageWrapper className="pt-1 pb-6 px-3 sm:px-5">
        <div className="flex items-center justify-center p-16 text-[#1F2B6D] dark:text-[#8B93D9] font-medium animate-pulse text-sm">
          Loading Driver Application details...
        </div>
      </PageWrapper>
    )
  }

  if (!application) {
    return (
      <PageWrapper className="pt-1 pb-6 px-3 sm:px-5">
        <div className="flex flex-col items-center justify-center p-16 space-y-4">
          <FolderOpen className="h-12 w-12 text-slate-400" />
          <h3 className="text-base font-bold text-[#1F2B6D] dark:text-white">Application Profile Not Found</h3>
          <button
            type="button"
            onClick={() => navigate('/driver-management/applications')}
            className="bg-[#1F2B6D] hover:bg-[#182258] active:scale-[0.98] text-white px-4 py-2 rounded-[10px] text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            Back to Applications
          </button>
        </div>
      </PageWrapper>
    )
  }

  const handleUpdateDocStatus = (
    status: 'approved' | 'rejected' | 'pending' | 'reupload_requested',
    documentId: string,
  ) => {
    if (!canVerify) {
      showError('Permission required', 'drivers:verify is needed to review documents')
      return
    }
    verifyDoc(
      {
        applicationId: application.id,
        documentId,
        status,
        comment: status !== 'approved' ? docComment : undefined,
      },
      {
        onSuccess: () => {
          showSuccess('Document updated', `Document marked as ${status.replace('_', ' ')}.`)
          void refetch()
        },
        onError: (err: unknown) => {
          showError('Document review failed', err instanceof Error ? err.message : 'Request failed')
        },
      },
    )
  }

  const handleApproveOverall = () => {
    if (!canVerify) {
      showError('Permission required', 'drivers:verify is needed to approve applications')
      return
    }
    approve(
      { id: application.id, notes, billingMode: selectedPlan },
      {
        onSuccess: () => {
          showSuccess('Driver approved', 'Application verified and driver activated.')
          navigate('/driver-management/applications')
        },
        onError: (err: unknown) => {
          showError('Approval failed', err instanceof Error ? err.message : 'Request failed')
        },
      },
    )
  }

  const handleRejectOverall = () => {
    if (!canVerify) {
      showError('Permission required', 'drivers:verify is needed to reject applications')
      return
    }
    reject(
      { id: application.id, notes },
      {
        onSuccess: () => {
          showSuccess('Application rejected', 'Driver verification was rejected.')
          navigate('/driver-management/applications')
        },
        onError: (err: unknown) => {
          showError('Rejection failed', err instanceof Error ? err.message : 'Request failed')
        },
      },
    )
  }

  const handleResubmitOverall = () => {
    if (!canVerify) {
      showError('Permission required', 'drivers:verify is needed to request resubmission')
      return
    }
    requestResubmit(
      { id: application.id, notes },
      {
        onSuccess: () => {
          showSuccess('Resubmission requested', 'Driver must re-submit verification materials.')
          navigate('/driver-management/applications')
        },
        onError: (err: unknown) => {
          showError('Request failed', err instanceof Error ? err.message : 'Request failed')
        },
      },
    )
  }

  const rejectedDocs = application.documents.filter(
    (d) => d.verifyStatus === 'rejected' || d.verifyStatus === 'reupload_requested',
  )
  const pendingDocs = application.documents.filter((d) => d.verifyStatus === 'pending')

  const openPreview = async (ref: string, title: string) => {
    if (!ref) return
    try {
      const url = isFileId(ref) ? await getFileReadUrl(ref) : ref
      setPreviewImage(url)
      setPreviewTitle(title)
    } catch {
      showError('Preview unavailable', 'Could not load the document image.')
    }
  }

  return (
    <PageWrapper className="space-y-4 pt-1 pb-6 px-3 sm:px-5">
      {/* ─── 1. Header with Geographic Dashboard Styling ───────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/driver-management/applications')}
            title="Back to Applications"
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition shadow-2xs cursor-pointer flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F2B6D] dark:text-white">
              KYC Compliance Review: {application.driverName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verify driver onboarding documents, details, and authorize fleet enrollment.
            </p>
          </div>
        </div>
      </div>

      {/* ─── 2. Application Summary Header Band ────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-sm flex flex-wrap items-center justify-between gap-4 mb-2 text-left">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Application Details</span>
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-sm font-bold text-[#1F2B6D] dark:text-[#8B93D9] font-mono">
              {application.applicationId}
            </h3>
            <span className="text-slate-300 dark:text-slate-700 select-none">|</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Submitted:{' '}
              <strong className="text-slate-700 dark:text-slate-300">
                {new Date(application.submittedAt).toLocaleDateString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </strong>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ApplicationSourceBadge source={application.source} />
          <StatusBadge status={application.applicationStatus} />
        </div>
      </div>

      {/* ─── 3. Pill Tab Bar Navigation ────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 mb-6">
        {[
          { id: 'overview', label: 'Overview', icon: User },
          { id: 'documents', label: `Documents Checklist (${application.documents?.length || 0})`, icon: FileText },
          { id: 'vehicle', label: 'Vehicle Details', icon: Car },
          { id: 'bank', label: 'Bank Details', icon: CreditCard },
          { id: 'timeline', label: `Timeline (${application.timeline?.length || 0})`, icon: Clock },
          { id: 'audit', label: `Audit Trail (${application.auditLogs?.length || 0})`, icon: History },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DetailTab)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-all whitespace-nowrap cursor-pointer',
                isActive
                  ? 'bg-[#1F2B6D] text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 font-semibold',
              )}
            >
              <Icon className="w-4 h-4" />
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
            <div className="space-y-6 text-left">
              {/* Profile Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6">
                <div className="h-20 w-20 rounded-2xl bg-[#1F2B6D] text-white overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0 flex items-center justify-center font-extrabold text-2xl shadow-md">
                  <FileImage
                    src={application.profilePhotoUrl}
                    alt="Driver Profile"
                    className="h-full w-full object-cover"
                    fallback={<span className="text-white">{application.driverName?.charAt(0).toUpperCase() || 'D'}</span>}
                  />
                </div>
                <div className="space-y-2 flex-grow">
                  <h3 className="text-xl font-bold text-[#1F2B6D] dark:text-white">{application.driverName}</h3>
                  <div className="flex items-center gap-4 flex-wrap text-xs text-slate-600 dark:text-slate-300">
                    <p>
                      Mobile: <strong className="font-mono text-slate-800 dark:text-white font-bold">{application.mobileNumber}</strong>
                    </p>
                    {application.email && (
                      <p>
                        Email: <strong className="text-slate-800 dark:text-white font-semibold">{application.email}</strong>
                      </p>
                    )}
                    <p>
                      Gender / DOB: <strong className="text-slate-800 dark:text-white">{application.gender || '—'} / {application.dateOfBirth || '—'}</strong>
                    </p>
                  </div>
                  {application.country && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                      <span>
                        {application.addressLine1}, {application.addressLine2 ? `${application.addressLine2}, ` : ''}
                        {application.city}, {application.state} - {application.postcode} ({application.country})
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* Status and ratings grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {[
                  { label: 'Background Check', value: application.bgCheckStatus.replace('_', ' ').toUpperCase(), desc: 'Third party verification' },
                  { label: 'Online Status', value: application.onlineStatus.toUpperCase(), desc: 'Registration state' },
                  { label: 'Trips Completed', value: application.totalTrips, desc: 'Prior platform history' },
                  { label: 'Rating Avg', value: `${application.ratingAvg} ★`, desc: 'Average rating' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-4 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                    <p className="text-lg font-extrabold text-[#1F2B6D] dark:text-white">{stat.value}</p>
                    <p className="text-[10px] text-slate-400">{stat.desc}</p>
                  </div>
                ))}
              </div>

              {/* Emergency & Preferred language card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                    Additional Application Metadata
                  </h3>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <p><span className="text-slate-500 font-medium">Preferred Language:</span> <strong className="text-slate-800 dark:text-white">{application.preferredLanguage || '—'}</strong></p>
                  <p><span className="text-slate-500 font-medium">Referral Code:</span> <strong className="text-slate-800 dark:text-white">{application.referralCode || '—'}</strong></p>
                  <p><span className="text-slate-500 font-medium">Emergency Contact Name:</span> <strong className="text-slate-800 dark:text-white">{application.emergencyContactName || '—'}</strong></p>
                  <p><span className="text-slate-500 font-medium">Emergency Contact Phone:</span> <strong className="font-mono text-slate-800 dark:text-white">{application.emergencyContactNumber || '—'}</strong></p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DOCUMENTS CHECKLIST */}
          {activeTab === 'documents' && (
            <div className="space-y-5 text-left">
              {!canVerify && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex gap-2.5 items-start dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-400">
                  <ShieldAlert className="h-5 w-5 text-amber-500 flex-shrink-0" />
                  <div className="space-y-0.5">
                    <span className="font-bold">View only</span>
                    <p className="opacity-90">
                      Document approve/reject requires <code className="font-mono">drivers:verify</code>.
                    </p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {application.documents.map((doc) => {
                  let statusColor = 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-200'
                  if (doc.verifyStatus === 'approved') statusColor = 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200'
                  if (doc.verifyStatus === 'rejected') statusColor = 'text-rose-700 bg-rose-50 dark:bg-rose-950/20 border-rose-200'
                  if (doc.verifyStatus === 'reupload_requested') statusColor = 'text-amber-700 bg-amber-50 dark:bg-amber-950/20 border-amber-200'

                  return (
                    <div
                      key={doc.id}
                      className={cn(
                        'bg-white dark:bg-slate-900 rounded-xl border p-4 space-y-3 relative shadow-sm transition-all',
                        selectedAuditDocId === doc.id
                          ? 'border-[#1F2B6D] ring-2 ring-[#1F2B6D]/20 dark:border-[#8B93D9]'
                          : 'border-slate-200/90 dark:border-slate-800',
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            {doc.category === 'vehicle' ? 'Vehicle Document' : 'Driver Identity'}
                          </span>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white capitalize">
                            {doc.docType.replace('_', ' ')}
                          </h4>
                          {doc.docNumber && <p className="text-[10px] text-slate-400 font-mono mt-0.5">Doc ID: {doc.docNumber}</p>}
                        </div>

                        <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border', statusColor)}>
                          {doc.verifyStatus.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Small thumbnail preview */}
                      <div className="h-32 w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden relative group">
                        <FileImage
                          src={resolveFileRef(doc.fileUrl, doc.fileId)}
                          alt={doc.docType}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openPreview(resolveFileRef(doc.fileUrl, doc.fileId), doc.docType.replace('_', ' '))}
                            className="bg-[#1F2B6D] hover:bg-[#182258] text-white p-2 rounded-lg shadow-sm cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Doc feedback comment */}
                      {doc.comment && (
                        <p className="text-[10px] bg-rose-50 dark:bg-rose-950/20 text-rose-600 p-2 rounded-lg border border-rose-100 dark:border-rose-900">
                          <strong>Feedback:</strong> {doc.comment}
                        </p>
                      )}

                      {/* Audit action items */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setSelectedAuditDocId(doc.id)}
                          className="text-[11px] font-bold text-[#1F2B6D] dark:text-[#8B93D9] hover:underline cursor-pointer"
                        >
                          Feedback Panel
                        </button>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateDocStatus('approved', doc.id)}
                            disabled={!canVerify || isDocVerifying}
                            className="p-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            title={canVerify ? 'Approve' : 'Requires drivers:verify'}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateDocStatus('rejected', doc.id)}
                            disabled={!canVerify || isDocVerifying}
                            className="p-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            title={canVerify ? 'Reject' : 'Requires drivers:verify'}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* TAB 3: VEHICLE DETAILS */}
          {activeTab === 'vehicle' && (
            <div className="space-y-5 text-left">
              {application.vehicle ? (
                <>
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
                      <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                        Vehicle Specifications
                      </h3>
                    </div>
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <p><span className="text-slate-500 font-medium">Vehicle Class Type:</span> <strong className="uppercase font-bold text-slate-800 dark:text-white">{application.vehicle.vehicleType}</strong></p>
                      <p><span className="text-slate-500 font-medium">Category Class:</span> <strong className="text-slate-800 dark:text-white">{application.vehicle.vehicleCategory || '—'}</strong></p>
                      <p><span className="text-slate-500 font-medium">Brand & Make:</span> <strong className="text-slate-800 dark:text-white">{application.vehicle.brand || '—'}</strong></p>
                      <p><span className="text-slate-500 font-medium">Model Variant:</span> <strong className="text-slate-800 dark:text-white">{application.vehicle.model || '—'}</strong></p>
                      <p><span className="text-slate-500 font-medium">Plate Number:</span> <strong className="uppercase font-mono text-[#1F2B6D] dark:text-[#8B93D9]">{application.vehicle.registrationPlate}</strong></p>
                      <p><span className="text-slate-500 font-medium">Color:</span> <strong className="text-slate-800 dark:text-white">{application.vehicle.color || '—'}</strong></p>
                      <p><span className="text-slate-500 font-medium">Seats Capacity:</span> <strong className="text-slate-800 dark:text-white">{application.vehicle.seatsCapacity} Seats</strong></p>
                      <p><span className="text-slate-500 font-medium">Manufacturing Year:</span> <strong className="text-slate-800 dark:text-white">{application.vehicle.manufacturingYear || '—'}</strong></p>
                    </div>
                  </div>

                  {/* Expiry alerts */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
                      <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                        Asset Expiry & Alert Indicators
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Visual state of transport licenses, permits, and fitness policies</p>
                    </div>
                    <div className="p-5 space-y-3">
                      {[
                        { label: 'Insurance Policy Cover', docNo: application.vehicle.insuranceNo, exp: application.vehicle.insuranceExpiry },
                        { label: 'Commercial Road Permit', docNo: application.vehicle.permitNo, exp: application.vehicle.permitExpiry },
                        { label: 'Pollution Certificate (PUC)', docNo: application.vehicle.pollutionNo, exp: application.vehicle.pollutionExpiry },
                        ...(application.vehicle.fitnessNo ? [{ label: 'Fitness Certificate', docNo: application.vehicle.fitnessNo, exp: application.vehicle.fitnessExpiry }] : []),
                      ].map((item, index) => (
                        <div key={index} className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-white">{item.label}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Policy / Reg No: {item.docNo || '—'}</p>
                          </div>
                          <ExpiryIndicator expiryDate={item.exp} />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-400 font-medium text-xs">No vehicle asset registered.</div>
              )}
            </div>
          )}

          {/* TAB 4: BANK DETAILS */}
          {activeTab === 'bank' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden text-left">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                  Settlement Bank Accounts
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Payout settlements and routing credentials</p>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <p><span className="text-slate-500 font-medium">Account Holder Name:</span> <strong className="text-slate-800 dark:text-white">{application.bankAccountName || '—'}</strong></p>
                <p><span className="text-slate-500 font-medium">Bank Institution:</span> <strong className="text-slate-800 dark:text-white">{application.bankName || '—'}</strong></p>
                <p>
                  <span className="text-slate-500 font-medium">Account Number:</span>
                  <strong className="tracking-wider ml-1 font-mono text-slate-800 dark:text-white">
                    {application.bankAccountNumber
                      ? `XXXXXX${application.bankAccountNumber.slice(-4)}`
                      : '—'}
                  </strong>
                </p>
                <p><span className="text-slate-500 font-medium">IFSC Routing Code:</span> <strong className="uppercase font-mono text-slate-800 dark:text-white">{application.bankIfsc || '—'}</strong></p>
                <p><span className="text-slate-500 font-medium">UPI Address ID:</span> <strong className="font-mono text-slate-800 dark:text-white">{application.upiId || '—'}</strong></p>
              </div>
            </div>
          )}

          {/* TAB 5: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden text-left">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                  Application Funnel Lifecycle Timeline
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Operations tracking showing progression and stage triggers</p>
              </div>
              <div className="p-6">
                {application.timeline && application.timeline.length > 0 ? (
                  <div className="relative border-l-2 border-[#1F2B6D] pl-6 space-y-6">
                    {application.timeline.map((event) => (
                      <div key={event.id} className="relative group text-xs text-slate-600 dark:text-slate-400">
                        <span className="absolute -left-[31px] top-0.5 h-3.5 w-3.5 rounded-full bg-[#1F2B6D] border-2 border-white dark:border-slate-900 shadow-sm" />
                        <div className="flex flex-col gap-0.5">
                          <p className="font-bold text-slate-800 dark:text-white text-sm">{event.action}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <span>Actor: <strong className="text-slate-600 dark:text-slate-300">{event.actor}</strong></span>
                            <span>•</span>
                            <span>{new Date(event.timestamp).toLocaleString('en-IN')}</span>
                          </div>
                          {event.notes && (
                            <p className="mt-1 bg-slate-50 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-slate-600 dark:text-slate-300">
                              {event.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 font-medium text-xs">No timeline events recorded.</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden text-left">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                  Compliance Audits History Log
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Actions taken by admins and backend operators</p>
              </div>
              <div className="p-6">
                <div className="relative border-l-2 border-[#1F2B6D] pl-4 space-y-4">
                  {application.auditLogs.map((log, index) => (
                    <div key={index} className="space-y-1 relative">
                      <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-[#1F2B6D] border-2 border-white dark:border-slate-900" />
                      <p className="text-xs font-bold text-slate-800 dark:text-white">{log.action}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{log.operator}</span>
                        <span>•</span>
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </p>
                      {log.notes && (
                        <p className="text-[10px] bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                          {log.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ACTION PANELS & DECISIONS */}
        <div className="space-y-6 text-left">
          {/* Document feedback audit panel */}
          {activeTab === 'documents' && selectedAuditDocId && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="capitalize text-xs font-bold uppercase tracking-wider text-[#1F2B6D] dark:text-white">
                  {(application.documents.find((d) => d.id === selectedAuditDocId)?.docType || 'document').replace('_', ' ')} Review Panel
                </h3>
              </div>
              <div className="p-5 space-y-4 text-xs">
                {!canVerify && (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex gap-2.5 items-start dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-400">
                    <ShieldAlert className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p>
                      <span className="font-bold">Read-only.</span> Document verification requires{' '}
                      <code className="font-mono">drivers:verify</code>.
                    </p>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Document Review State</label>
                  <div>
                    <StatusBadge status={application.documents.find((d) => d.id === selectedAuditDocId)?.verifyStatus || 'pending'} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Document Comments / Feedback</label>
                  <textarea
                    value={docComment}
                    onChange={(e) => setDocComment(e.target.value)}
                    placeholder="Enter reason if rejecting or requesting reupload..."
                    disabled={!canVerify}
                    className="w-full h-20 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-800 dark:text-white focus:border-[#1F2B6D] focus:outline-none focus:ring-1 focus:ring-[#1F2B6D] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    className="w-full gap-2 rounded-xl justify-center h-9 text-xs font-bold bg-[#1F2B6D] hover:bg-[#182258] active:scale-[0.98] text-white flex items-center transition shadow-sm cursor-pointer disabled:opacity-50"
                    onClick={() => handleUpdateDocStatus('approved', selectedAuditDocId)}
                    disabled={!canVerify || isDocVerifying}
                  >
                    <Check className="h-4 w-4" />
                    <span>Approve Document</span>
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="gap-2 rounded-xl justify-center h-9 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white flex items-center transition shadow-sm cursor-pointer disabled:opacity-50"
                      onClick={() => handleUpdateDocStatus('rejected', selectedAuditDocId)}
                      disabled={!canVerify || isDocVerifying}
                    >
                      <X className="h-4 w-4" />
                      <span>Reject</span>
                    </button>
                    <button
                      type="button"
                      className="gap-2 rounded-xl justify-center h-9 text-[10px] font-semibold text-[#1F2B6D] dark:text-[#8B93D9] bg-[#1F2B6D]/[0.06] hover:bg-[#1F2B6D]/[0.12] dark:bg-slate-800 border border-[#1F2B6D]/20 dark:border-slate-700 flex items-center transition cursor-pointer disabled:opacity-50"
                      onClick={() => {
                        handleUpdateDocStatus('reupload_requested', selectedAuditDocId)
                      }}
                      disabled={!canVerify || isDocVerifying}
                    >
                      <RefreshCcw className="h-3.5 w-3.5" />
                      <span>Request Reupload</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Overall Review Decision Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-[#1F2B6D]/30 dark:border-slate-700 shadow-sm overflow-hidden text-left">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-[#1F2B6D]/[0.05] dark:bg-slate-800/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2B6D] dark:text-[#8B93D9] font-mono">
                Overall Review Decision
              </h3>
            </div>
            <div className="p-5 space-y-4 text-xs">
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
                    <p className="opacity-90">All KYC document attachments verified. Application ready for activation.</p>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Initial Monetization Plan</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['free', 'commission', 'subscription'] as const).map((plan) => (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => setSelectedPlan(plan)}
                      className={cn(
                        'p-2 text-xs font-bold rounded-lg border transition-colors capitalize cursor-pointer',
                        selectedPlan === plan
                          ? 'bg-[#1F2B6D] border-[#1F2B6D] text-white'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300',
                      )}
                    >
                      {plan === 'free' ? 'Free Month' : plan === 'commission' ? '7% Comm.' : 'Sub.'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Compliance Remarks</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Compliance review comments logged to history timelines..."
                  className="w-full h-20 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-800 dark:text-white focus:border-[#1F2B6D] focus:outline-none focus:ring-1 focus:ring-[#1F2B6D]"
                />
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  className="w-full gap-2 rounded-xl justify-center h-10 font-bold bg-[#1F2B6D] hover:bg-[#182258] active:scale-[0.98] text-white flex items-center transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleApproveOverall}
                  disabled={!canVerify || isApproving || rejectedDocs.length > 0 || pendingDocs.length > 0}
                >
                  <Check className="h-4 w-4" />
                  <span>Approve & Activate Driver</span>
                </button>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    className="gap-2 rounded-xl justify-center h-10 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white flex items-center transition shadow-sm cursor-pointer disabled:opacity-50"
                    onClick={handleRejectOverall}
                    disabled={!canVerify || isRejecting}
                  >
                    <X className="h-4 w-4" />
                    <span>Reject</span>
                  </button>
                  <button
                    type="button"
                    className="gap-2 rounded-xl justify-center h-10 text-[10px] font-semibold text-[#1F2B6D] dark:text-[#8B93D9] bg-[#1F2B6D]/[0.06] hover:bg-[#1F2B6D]/[0.12] dark:bg-slate-800 border border-[#1F2B6D]/20 dark:border-slate-700 flex items-center transition cursor-pointer disabled:opacity-50"
                    onClick={handleResubmitOverall}
                    disabled={!canVerify || isResubmitting}
                  >
                    <RefreshCcw className="h-3.5 w-3.5" />
                    <span>Request Resubmit</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
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
