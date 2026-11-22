import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  useApplication,
  useApproveApplication,
  useRejectApplication,
  useRequestResubmission,
  useUpdateDriver,
} from '../../hooks'
import {
  ReviewSummaryCard,
  ReviewDocumentCard,
  PersonalInfoCard,
  VehicleInfoCard,
  DriverProfileHeaderCard,
  BankInfoCard,
  EditDriverModal,
  DocumentPreviewModal,
  BankDetailsReviewStep,
} from '../../components'
import { useToast } from '@/shared/context/toast'
import {
  ArrowLeft,
  User,
  MapPin,
  ShieldAlert,
  FileText,
  FileCheck,
  ShieldCheck,
  Edit,
  Clock,
  Car,
  StickyNote,
  ArrowRight,
  CheckCircle2,
  Check,
  Phone,
  Home,
  ChevronRight,
  X,
  ThumbsDown,
  RefreshCw,
  AlertTriangle,
  IdCard,
  XCircle,
  CreditCard,
  Building2,
} from 'lucide-react'
import { FileImage } from '@/shared/components/FileImage'
import { getFileReadUrl } from '@/shared/services/file-upload.service'
import { isFileId, resolveFileRef } from '@/shared/utils/file-ref'
import type { DriverKycDocument } from '../../types'
import {
  APPLICATION_REVIEW_STEPS,
  APPLICATION_STATUS_LABELS,
  capitalizeLabel,
  computeAgeFromDob,
  computeReviewStepStates,
  fmtReviewDate,
  fmtReviewDateTime,
  formatBankStatusLabel,
  isVehicleDocType,
  mapKycDocumentToReviewDoc,
  type ReviewDocumentItem,
} from '../../utils/application-review.utils'

export const ApplicationReviewPage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { success: showSuccess, error: showError } = useToast()

  // Always start on Step 1 (Overview) so reviewers follow the real verification sequence 1 → 6.
  const [activeStep, setActiveStep] = useState<number>(0)
  const [activeSidebarItem, setActiveSidebarItem] = useState<string>('personal')
  const [activeDocCategory, setActiveDocCategory] = useState<string>('all')
  const [selectedDocument, setSelectedDocument] = useState<ReviewDocumentItem | null>(null)
  const [decisionTab, setDecisionTab] = useState<'approve' | 'reupload' | 'reject'>('approve')
  const [decisionModal, setDecisionModal] = useState<'none' | 'approve' | 'reupload' | 'reject'>('none')
  const [decisionReason, setDecisionReason] = useState<string>('')

  const handleStepChange = (targetStep: number) => {
    setActiveStep(targetStep)
  }

  const { data, isLoading, isError, error: loadError, refetch } = useApplication(id || '')
  const { mutate: approveApp, isPending: isApproving } = useApproveApplication()
  const { mutate: rejectApp, isPending: isRejecting } = useRejectApplication()
  const { mutate: resubmitApp, isPending: isResubmitting } = useRequestResubmission()

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editInitialTab, setEditInitialTab] = useState<'personal' | 'vehicle' | 'status'>('personal')
  const [isUpdatingDriver, setIsUpdatingDriver] = useState(false)
  const { mutateAsync: updateDriverMutation, isPending: isUpdatingMutation } = useUpdateDriver()

  useEffect(() => {
    if (decisionModal === 'none') return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDecisionModal('none')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [decisionModal])

  const handleOpenEdit = (tab: 'personal' | 'vehicle' | 'status' = 'personal') => {
    setEditInitialTab(tab)
    setIsEditModalOpen(true)
  }

  const handleEditSave = async (updatedData: any) => {
    const targetId = (data as any)?.id || id
    if (!targetId) return
    setIsUpdatingDriver(true)
    try {
      await updateDriverMutation({ id: targetId, data: updatedData })
      showSuccess(
        'Details Updated',
        `${updatedData.driverName || data?.driverName || 'Applicant'} details updated successfully.`,
      )
      setIsEditModalOpen(false)
      void refetch()
    } catch (err: unknown) {
      showError('Failed to update details', err instanceof Error ? err.message : 'Request failed')
    } finally {
      setIsUpdatingDriver(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-10 flex flex-col items-center justify-center gap-3 text-slate-500">
        <div className="w-8 h-8 rounded-full border-2 border-[#1F2B6D]/20 border-t-[#1F2B6D] animate-spin" />
        <p className="text-sm font-medium">Loading application...</p>
      </div>
    )
  }

  if (isError || !data) {
    const errStatus = (loadError as { status?: number } | null)?.status
    const errMessage =
      loadError instanceof Error ? loadError.message : 'Unable to load driver application details.'
    const isAlreadyVerified =
      errStatus === 409 || /already verified/i.test(errMessage)

    return (
      <div className="p-6 sm:p-10 max-w-xl mx-auto">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm text-center space-y-4">
          <div
            className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${
              isAlreadyVerified
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                : 'bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
            }`}
          >
            {isAlreadyVerified ? (
              <CheckCircle2 className="w-7 h-7" />
            ) : (
              <AlertTriangle className="w-7 h-7" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1F2B6D] dark:text-white">
              {isAlreadyVerified ? 'Driver Already Verified' : 'Could Not Load Application'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              {isAlreadyVerified
                ? 'This driver application has already been approved and moved to the active Drivers roster.'
                : errMessage}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/driver-management/applications')}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Back to Applications
            </button>
            {isAlreadyVerified && id ? (
              <button
                type="button"
                onClick={() => navigate(`/driver-management/drivers/${id}`)}
                className="px-4 py-2 rounded-lg bg-[#1F2B6D] hover:bg-[#182258] text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Open Verified Driver Profile
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void refetch()}
                className="px-4 py-2 rounded-lg bg-[#1F2B6D] hover:bg-[#182258] text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const openDocument = async (ref: string, disposition: 'inline' | 'attachment' = 'attachment') => {
    if (!ref) return
    try {
      window.open(isFileId(ref) ? await getFileReadUrl(ref, disposition) : ref, '_blank', 'noopener')
    } catch {
      showError('Download failed', 'Could not open this document')
    }
  }

  const rawDocs = data.documents || []
  const isVehicleDoc = (d: DriverKycDocument) =>
    d.category ? d.category === 'vehicle' : isVehicleDocType(d.docType)
  const identityDocuments = rawDocs.filter((d) => !isVehicleDoc(d)).map(mapKycDocumentToReviewDoc)
  const vehicleDocuments = rawDocs.filter(isVehicleDoc).map(mapKycDocumentToReviewDoc)
  const allDocs = [...identityDocuments, ...vehicleDocuments]

  const countVerified = (docs: ReviewDocumentItem[]) => docs.filter((d) => d.status === 'Verified').length
  const verifiedIdentity = countVerified(identityDocuments)
  const verifiedVehicle = countVerified(vehicleDocuments)
  const verifiedTotal = verifiedIdentity + verifiedVehicle
  const totalDocs = allDocs.length
  const pendingIssues = totalDocs - verifiedTotal
  const expiredDocsCount = allDocs.filter((d) => d.isExpired).length
  const allVerified = totalDocs > 0 && pendingIssues === 0

  const { hasBankDetails, isBankVerified: isBankCompleted, stepDone } = computeReviewStepStates(
    data,
    allVerified,
    activeStep,
  )

  const approveBlockedReason = !allVerified
    ? totalDocs === 0
      ? 'No documents uploaded yet.'
      : `${pendingIssues} of ${totalDocs} documents not verified yet.`
    : expiredDocsCount > 0
      ? `${expiredDocsCount} document${expiredDocsCount === 1 ? '' : 's'} expired — request re-upload first.`
      : null

  const statusBadgeClass =
    data.applicationStatus === 'approved'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
      : data.applicationStatus === 'rejected'
        ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
        : data.applicationStatus === 'resubmission_required'
          ? 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/40 dark:border-orange-800 dark:text-orange-300'
          : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'

  const statusCardAccent =
    data.applicationStatus === 'approved'
      ? { iconBg: 'bg-emerald-600', valueColor: 'text-emerald-600 dark:text-emerald-400' }
      : data.applicationStatus === 'rejected'
        ? { iconBg: 'bg-rose-600', valueColor: 'text-rose-600 dark:text-rose-400' }
        : data.applicationStatus === 'resubmission_required'
          ? { iconBg: 'bg-orange-500', valueColor: 'text-orange-600 dark:text-orange-400' }
          : { iconBg: 'bg-amber-500', valueColor: 'text-amber-600 dark:text-amber-400' }

  const pendingLabel = (verified: number, total: number) =>
    total === 0 ? 'None uploaded' : `${total - verified} Pending`

  // Real audit trail from the backend (oldest first; the last entry is the current state).
  const sortedTimeline = [...(data.timeline ?? [])].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  const lastEvent = sortedTimeline[sortedTimeline.length - 1]
  const timelineItems = sortedTimeline.map((e, i) => ({
    title: e.action,
    date: fmtReviewDateTime(e.timestamp),
    desc: e.notes && e.notes !== e.action ? `${e.notes} — ${e.actor}` : `By ${e.actor}`,
    isCurrent: i === sortedTimeline.length - 1,
  }))

  const primaryBank = (data as any).bankAccounts?.[0] || null
  const appData = {
    id: data.applicationId || data.id,
    name: data.driverName || '—',
    phone: data.mobileNumber || '—',
    alternatePhone: (data as any).alternatePhone || '—',
    bloodGroup: (data as any).bloodGroup || '—',
    drivingExperience:
      (data as any).drivingExperienceYears != null
        ? `${(data as any).drivingExperienceYears} years`
        : '—',
    email: data.email || '—',
    dob: fmtReviewDate(data.dateOfBirth),
    age: computeAgeFromDob(data.dateOfBirth),
    gender: capitalizeLabel(data.gender),
    language: data.preferredLanguage || '—',
    location: [data.city, data.state].filter(Boolean).join(', ') || '—',
    address:
      [data.addressLine1, data.addressLine2, data.city, data.state, data.postcode]
        .filter(Boolean)
        .join(', ') || '—',
    emergencyContactName:
      data.emergencyContactName || (data as any).emergencyContacts?.[0]?.contactName || '—',
    emergencyContactPhone:
      data.emergencyContactNumber || (data as any).emergencyContacts?.[0]?.phoneNumber || '—',
    emergencyContactRelationship:
      (data as any).emergencyContactRelationship ||
      (data as any).emergencyContacts?.[0]?.relationship ||
      '—',

    vehicleType: capitalizeLabel(data.vehicle?.vehicleType ?? data.vehicleType),
    vehicleMake: data.vehicle?.brand || '—',
    vehicleModel: data.vehicle?.model || '—',
    vehicleReg: data.vehicle?.registrationPlate || '—',
    vehicleColor: data.vehicle?.color || '—',
    vehicleYear: data.vehicle?.manufacturingYear ?? '—',
    vehicleSeats: data.vehicle?.seatsCapacity ?? '—',
    vehicleFuel: (data.vehicle as any)?.fuelType || '—',
    vehicleCategory: data.vehicle?.vehicleCategory || '—',
    vehiclePhoto:
      (data.vehicle as any)?.photoUrl ||
      (() => {
        const doc = (data.documents ?? []).find((d) => /vehicle_photo/i.test(d.docType))
        return doc ? resolveFileRef(doc.fileUrl, doc.fileId) : undefined
      })() ||
      undefined,

    submittedDate: fmtReviewDateTime(data.submittedAt),
    statusLabel: APPLICATION_STATUS_LABELS[data.applicationStatus] ?? data.applicationStatus,
    lastActionBy: lastEvent?.actor ?? '—',
    lastActionDate: fmtReviewDateTime(lastEvent?.timestamp),
    progress: totalDocs ? Math.round((verifiedTotal / totalDocs) * 100) : 0,

    bankAccount: primaryBank,
    bankName: primaryBank?.bankName || data.bankName || '—',
    bankAccountName:
      primaryBank?.bankAccountName || primaryBank?.accountHolderName || data.bankAccountName || '—',
    bankAccountNumber: primaryBank?.accountNumberMasked || data.bankAccountNumber || '—',
    bankIfsc: primaryBank?.bankIfsc || primaryBank?.ifscCode || data.bankIfsc || '—',
    bankUpi: primaryBank?.upiId || data.upiId || '—',
    bankStatus: primaryBank?.status || primaryBank?.verificationStatus || null,
    bankPayoutEnabled: Boolean(primaryBank?.payoutEnabled),
  }

  const hasAddress = appData.address !== '—'

  const documentCategories = [
    { id: 'all', label: 'All Documents', count: identityDocuments.length + vehicleDocuments.length },
    { id: 'identity', label: 'Identity Documents', count: identityDocuments.length },
    { id: 'vehicle', label: 'Vehicle Documents', count: vehicleDocuments.length },
  ]

  const steps = APPLICATION_REVIEW_STEPS

  return (
    <div className="h-[calc(100vh-4.25rem)] flex flex-col overflow-hidden px-4 sm:px-6 max-w-screen-2xl mx-auto w-full">
      
      {/* ─── FIXED TOP SECTION (Stays pinned at top) ─────────────────────────── */}
      <div className="shrink-0 pt-2 pb-2.5 space-y-2.5 bg-background border-b border-slate-200/80 dark:border-slate-800 z-10">
        
        {/* ─── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/driver-management/applications')}
            aria-label="Back to applications"
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[#1F2B6D] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F2B6D] dark:text-white truncate">
              Driver Application Review
            </h1>
            <p className="text-[12.5px] sm:text-[13px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              Review all verification details and make a final decision on this application.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <div className="text-right flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-2 text-[12px]">
              <span className="text-slate-500">Application ID</span>
              <span className="font-bold font-mono text-[#1F2B6D] dark:text-[#8B93D9]">{appData.id}</span>
            </div>
            <div className="flex items-center gap-2 text-[12px]">
              <span className="text-slate-500">Submitted on</span>
              <span className="font-bold text-[#1F2B6D] dark:text-[#8B93D9]">{appData.submittedDate}</span>
            </div>
          </div>
          <div className={`${statusBadgeClass} border px-3.5 py-2 rounded-lg font-bold text-[12.5px] flex items-center gap-2 shadow-sm`}>
            {data.applicationStatus === 'approved' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : data.applicationStatus === 'rejected' ? (
              <XCircle className="w-4 h-4 shrink-0" />
            ) : data.applicationStatus === 'resubmission_required' ? (
              <RefreshCw className="w-4 h-4 shrink-0" />
            ) : (
              <Clock className="w-4 h-4 shrink-0" />
            )}
            <span>{appData.statusLabel}</span>
          </div>
        </div>
      </div>

      {/* ─── Top Profile Card ─────────────────────────────────────────────────── */}
      <DriverProfileHeaderCard
        name={appData.name}
        phone={appData.phone}
        email={appData.email}
        gender={appData.gender}
        dob={appData.dob}
        age={appData.age}
        language={appData.language}
        location={appData.location}
        progress={appData.progress}
        progressLabel={`${verifiedTotal} / ${totalDocs} documents verified`}
        photoUrl={data.profilePhotoUrl}
        onCopyPhone={() => {
          navigator.clipboard.writeText(appData.phone)
          showSuccess('Copied', 'Phone number copied to clipboard')
        }}
      />

      {/* ─── Stepper Row with Prev/Next Buttons ───────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between w-full py-1 gap-x-4 gap-y-2">
        {/* Stepper Steps */}
        <div className="flex flex-wrap xl:flex-nowrap items-center flex-1 min-w-0 py-0.5">
          {steps.map((step, idx) => {
            const isActive = idx === activeStep
            const isCompleted = stepDone[idx]

            return (
              <React.Fragment key={step}>
                <button
                  type="button"
                  className={`flex items-center gap-1.5 shrink-0 rounded-full px-1.5 py-0.5 transition-all cursor-pointer focus:outline-none ${
                    isActive
                      ? isCompleted
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/30'
                        : 'bg-[#1F2B6D]/8 dark:bg-blue-950/40 border border-[#1F2B6D]/20 dark:border-blue-800/60 ring-2 ring-[#1F2B6D]/20'
                      : 'border border-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                  }`}
                  onClick={() => handleStepChange(idx)}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11.5px] transition-colors ${
                      isCompleted
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : isActive
                          ? 'bg-[#1F2B6D] text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                  </div>
                  <span
                    className={`font-bold text-[12px] whitespace-nowrap pr-1 ${
                      isActive
                        ? isCompleted
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-[#1F2B6D] dark:text-blue-300'
                        : isCompleted
                          ? 'text-slate-700 dark:text-slate-300'
                          : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {step}
                  </span>
                </button>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 min-w-[8px] max-w-[36px] h-0.5 mx-1 transition-colors ${
                      stepDone[idx] ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* Prev / Next Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleStepChange(Math.max(0, activeStep - 1))}
            disabled={activeStep === 0}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[#1F2B6D] dark:text-slate-200 font-semibold text-[12.5px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 bg-white dark:bg-slate-900 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Previous
          </button>
          <button
            type="button"
            onClick={() => handleStepChange(Math.min(steps.length - 1, activeStep + 1))}
            disabled={activeStep === steps.length - 1}
            className="px-3.5 py-1.5 rounded-lg bg-[#1F2B6D] text-white font-semibold text-[12.5px] hover:bg-[#182258] transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      </div>

      {/* ─── SCROLLABLE CONTENT BODY ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-3.5 pr-1 space-y-4 custom-scrollbar">

        {/* ─── Step Content ─────────────────────────────────────────────────────── */}
        {activeStep === 0 && (
        <div className="space-y-4">
          {/* 4 Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <ReviewSummaryCard
              icon={<ShieldAlert className="w-5 h-5 text-white" />}
              iconBgColor={statusCardAccent.iconBg}
              title="Application Status"
              value={appData.statusLabel}
              valueColor={statusCardAccent.valueColor}
              subtitle={`Submitted on ${appData.submittedDate}`}
            />
            <ReviewSummaryCard
              icon={<FileText className="w-5 h-5 text-white" />}
              iconBgColor="bg-[#1F2B6D]"
              title="Documents Submitted"
              value={String(totalDocs)}
              valueColor="text-[#1F2B6D] dark:text-white"
              subtitle={totalDocs ? 'Documents uploaded by the driver' : 'No documents uploaded yet'}
            />
            <ReviewSummaryCard
              icon={<ShieldCheck className="w-5 h-5 text-white" />}
              iconBgColor="bg-[#1F2B6D]"
              title="Verification Progress"
              value={`${appData.progress}%`}
              valueColor="text-[#1F2B6D] dark:text-white"
              subtitle={`${verifiedTotal} of ${totalDocs} documents verified`}
            />
            <ReviewSummaryCard
              icon={<User className="w-5 h-5 text-white" />}
              iconBgColor="bg-[#1F2B6D]"
              title="Last Action By"
              value={appData.lastActionBy}
              valueColor="text-[#1F2B6D] dark:text-white"
              subtitle={appData.lastActionDate}
            />
          </div>

          {/* Main Content Grid for Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {/* LEFT COLUMN */}
            <div className="space-y-4 flex flex-col">
              {/* Personal Information */}
              <PersonalInfoCard
                name={appData.name}
                phone={appData.phone}
                alternatePhone={appData.alternatePhone}
                email={appData.email}
                dob={appData.dob}
                age={appData.age}
                gender={appData.gender}
                bloodGroup={appData.bloodGroup}
                drivingExperience={appData.drivingExperience}
                language={appData.language}
                address={appData.address}
                photoUrl={data.profilePhotoUrl}
                onEdit={() => handleOpenEdit('personal')}
              />

              {/* Timeline */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col flex-1">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px]">Application Timeline</h3>
                  </div>
                </div>
                <div className="p-4 px-6 relative flex-1">
                  <div className="absolute left-[35px] top-6 bottom-6 w-px bg-slate-200 dark:bg-slate-700"></div>
                  <div className="space-y-6 relative">
                    {timelineItems.length === 0 && (
                      <p className="text-[12px] text-slate-400">No activity recorded yet</p>
                    )}
                    {timelineItems.map((item, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center relative z-10 shrink-0 mt-0.5 ${item.isCurrent ? 'bg-amber-100 border-amber-500' : 'bg-emerald-100 border-emerald-500'}`}>
                          {item.isCurrent ? <div className="w-1.5 h-1.5 rounded-full bg-amber-600"></div> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                        <div>
                          <p className="font-bold text-[13px] text-[#1F2B6D] dark:text-white">{item.title}</p>
                          <p className="text-[11.5px] text-slate-500 mt-0.5">{item.desc}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{item.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-4 flex flex-col">
              
              {/* Vehicle Information */}
              <VehicleInfoCard
                vehicleType={appData.vehicleType}
                brand={appData.vehicleMake}
                model={appData.vehicleModel}
                registrationPlate={appData.vehicleReg}
                color={appData.vehicleColor}
                manufacturingYear={appData.vehicleYear}
                fuelType={appData.vehicleFuel}
                seatsCapacity={appData.vehicleSeats}
                vehicleCategory={appData.vehicleCategory}
                photoUrl={appData.vehiclePhoto}
                onEdit={() => handleOpenEdit('vehicle')}
              />

              {/* Documents Overview */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col flex-1">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center">
                      <StickyNote className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px]">Required Documents</h3>
                  </div>
                  <span className="text-[12px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    {verifiedTotal}/{totalDocs} Verified
                  </span>
                </div>
                <div className="p-4 flex-1">
                  <div className="space-y-3">
                    {allDocs.length === 0 && (
                      <p className="text-[12px] text-slate-400">No documents uploaded yet</p>
                    )}
                    {allDocs.map((doc) => {
                      const verified = doc.status === 'Verified'
                      return (
                        <div key={doc.id} onClick={() => setSelectedDocument(doc)} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100/50 transition-colors cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${verified ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                              {verified ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="text-[13px] font-bold text-[#1F2B6D]">{doc.name}</p>
                              <p className="text-[10px] text-slate-500 font-medium">{doc.status}</p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400" />
                        </div>
                      )
                    })}
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => handleStepChange(2)}
                    className="w-full mt-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[#1F2B6D] dark:text-blue-400 font-bold text-[13px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
                  >
                    View All Documents
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Step Navigation Bar */}
          <div className="flex items-center justify-end pt-3">
            <button
              type="button"
              onClick={() => handleStepChange(1)}
              className="px-5 py-2.5 rounded-lg bg-[#1F2B6D] hover:bg-[#182258] text-white font-bold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              Proceed to Claim Form
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {activeStep === 1 && (
        <div className="flex flex-col md:flex-row gap-5 items-start mt-4">
          
          {/* Claim Form Sidebar */}
          <div className="w-full md:w-[260px] shrink-0 flex flex-col gap-2">
            {[
              { id: 'personal', label: 'Personal Information', sub: 'Basic details submitted by driver', icon: User },
              { id: 'address', label: 'Address Information', sub: 'Current and permanent address', icon: MapPin },
              { id: 'emergency', label: 'Emergency Contact', sub: 'Emergency contact details', icon: Phone },
              { id: 'bank', label: 'Bank & Payout Details', sub: 'Settlement account, IFSC & UPI', icon: CreditCard },
              { id: 'additional', label: 'Additional Information', sub: 'Other information from the form', icon: FileText },
            ].map((item) => {
              const isActive = activeSidebarItem === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSidebarItem(item.id)
                    const element = document.getElementById(`section-${item.id}`)
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-colors relative overflow-hidden ${
                    isActive 
                      ? 'bg-[#EFF3FE] border-[#C3D2FB] border-l-4 border-l-[#1F2B6D] dark:bg-[#1F2B6D]/20 dark:border-[#1F2B6D]/50' 
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 border-l-4 border-l-transparent'
                  }`}
                  style={{ boxShadow: isActive ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : '' }}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-[#DCE4FC] dark:bg-[#1F2B6D] text-[#1F2B6D] dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-[#1F2B6D] dark:text-slate-300'}`}>
                      <item.icon className="w-[18px] h-[18px]" />
                    </div>
                    <div>
                      <div className={`text-[13px] font-bold tracking-tight ${isActive ? 'text-[#1F2B6D] dark:text-white' : 'text-[#1F2B6D] dark:text-slate-300'}`}>{item.label}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-tight">{item.sub}</div>
                    </div>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-[#1F2B6D] dark:text-blue-400 shrink-0 ml-1" />}
                </button>
              )
            })}
          </div>

          {/* Claim Form Main Area - Stacked Cards */}
          <div className="flex-1 w-full space-y-4">
            
            {/* Personal Information Card */}
            <div id="section-personal" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col scroll-mt-24">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px]">Personal Information</h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenEdit('personal')}
                  className="text-blue-600 hover:text-blue-700 text-[12px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
              </div>
              <div className="p-4 flex flex-col sm:flex-row justify-between gap-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-[13px] flex-1">
                  <div>
                    <p className="text-slate-500 mb-0.5">Full Name</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{appData.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Phone Number</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{appData.phone}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Email Address</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{appData.email}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Date of Birth</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{appData.dob} <span className="text-slate-500 font-normal">({appData.age} years)</span></p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Gender</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{appData.gender}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Preferred Language</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{appData.language}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Alternate Number</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200 font-mono">{appData.alternatePhone}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Blood Group</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{appData.bloodGroup}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Driving Experience</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{appData.drivingExperience}</p>
                  </div>
                </div>
                
                {/* Profile Photo Area */}
                <div
                  className={`shrink-0 flex flex-col items-center gap-3 p-4 rounded-xl border ${
                    data.profilePhotoUrl
                      ? 'bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="w-24 h-24 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center bg-white dark:bg-slate-900">
                    <FileImage src={data.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" fallback={<User className="w-8 h-8 text-slate-400" />} />
                  </div>
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold shadow-sm border ${
                      data.profilePhotoUrl
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 border-emerald-200 dark:border-emerald-800'
                        : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {data.profilePhotoUrl ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    )}
                    <span>
                      Profile Photo
                      <br />
                      <span className="font-medium text-[10px] leading-tight block opacity-85">
                        {data.profilePhotoUrl ? 'Uploaded' : 'Not uploaded'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information Card */}
            <div id="section-address" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col scroll-mt-24">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px]">Address Information</h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenEdit('personal')}
                  className="text-blue-600 hover:text-blue-700 text-[12px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-8 text-[13px]">
                <div className="flex flex-col gap-2">
                  <span className="text-slate-500 mb-0.5">Current Address</span>
                  {hasAddress ? (
                    <>
                      <p className="font-semibold text-[#1F2B6D] dark:text-slate-200 leading-relaxed max-w-sm">
                        {appData.address.split(', ').slice(0, 2).join(', ')}
                        <br />
                        {appData.address.split(', ').slice(2).join(', ')}
                      </p>
                      <div className="mt-2 self-start bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30 px-3 py-1.5 rounded flex items-center gap-2 font-bold text-[11.5px]">
                        <Home className="w-3.5 h-3.5" /> Primary Registered Address
                      </div>
                    </>
                  ) : (
                    <p className="font-medium text-slate-400">Not provided</p>
                  )}
                </div>
                <div className="flex flex-col gap-2 relative">
                  <div className="hidden md:block absolute -left-4 top-2 bottom-2 w-px bg-slate-100 dark:bg-slate-800" />
                  <span className="text-slate-500 mb-0.5">City / State / Postcode</span>
                  <div className="space-y-1 text-[13px]">
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">
                      {appData.location !== '—' ? appData.location : 'Not provided'}
                    </p>
                    {data.postcode ? (
                      <p className="text-xs font-mono text-slate-500">PIN: {data.postcode}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact Card */}
            <div id="section-emergency" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col scroll-mt-24">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px]">Emergency Contact</h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenEdit('personal')}
                  className="text-blue-600 hover:text-blue-700 text-[12px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-6 text-[13px]">
                  <div>
                    <p className="text-slate-500 mb-0.5">Contact Name</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{appData.emergencyContactName}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Relationship</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{appData.emergencyContactRelationship}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Phone Number</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200 font-mono">{appData.emergencyContactPhone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank & Payout Details Card */}
            <div id="section-bank" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col scroll-mt-24">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center">
                    <CreditCard className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px]">Bank & Payout Details</h3>
                    <p className="text-[11px] text-slate-500">Direct settlement bank account & UPI information</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit('status')}
                    className="text-blue-600 hover:text-blue-700 text-[12px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  {appData.bankPayoutEnabled && (
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Payout Enabled
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-6 text-[13px]">
                  <div>
                    <p className="text-slate-500 mb-0.5">Bank Name</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {appData.bankName}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Account Holder Name</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200 uppercase">{appData.bankAccountName}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Account Number</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200 font-mono">{appData.bankAccountNumber}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">IFSC Code</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200 font-mono uppercase">{appData.bankIfsc}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-[13px] pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-slate-500 mb-0.5">UPI ID</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200 font-mono">
                      {appData.bankUpi !== '—' ? appData.bankUpi : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Account Verification Status</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        appData.bankPayoutEnabled || appData.bankStatus === 'ACTIVE' || appData.bankStatus === 'VERIFIED'
                          ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                          : 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                      }`}>
                        <ShieldCheck className="w-3 h-3" />
                        {appData.bankStatus || (appData.bankName !== '—' ? 'Submitted (AES-256)' : 'Pending')}
                      </span>
                      <span className="text-[11px] text-slate-400">Encrypted in vault</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information Card */}
            <div id="section-additional" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col scroll-mt-24">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px]">Additional Information</h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenEdit('status')}
                  className="text-blue-600 hover:text-blue-700 text-[12px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-[13px]">
                  <div>
                    <p className="text-slate-500 mb-0.5">Application Source</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{data.source === 'admin_manual' ? 'Admin (manual)' : 'Driver app'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Account Status</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{data.isBlocked ? 'Blocked' : data.isAvailable ? 'Active' : 'Suspended'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Online Status</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{capitalizeLabel(data.onlineStatus)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Completed Trips</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{data.totalTrips ?? 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Step Navigation Bar */}
            <div className="flex items-center justify-between pt-3 w-full">
              <button
                type="button"
                onClick={() => handleStepChange(0)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[#1F2B6D] dark:text-slate-200 font-semibold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer bg-white dark:bg-slate-900 shadow-2xs"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Overview
              </button>
              <button
                type="button"
                onClick={() => handleStepChange(2)}
                className="px-5 py-2.5 rounded-lg bg-[#1F2B6D] hover:bg-[#182258] text-white font-bold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                Proceed to Documents
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeStep === 2 && (
        <div className="flex flex-col md:flex-row gap-5 items-start mt-4">
          {/* Sidebar for Document Categories */}
          <div className="w-full md:w-[260px] shrink-0 flex flex-col gap-2 sticky top-4">
            {/* Top box: Documents Verification */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm mb-2">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px]">Documents Verification</h3>
              </div>
              <p className="text-[12px] text-slate-500 leading-relaxed">
                Review each document and verify its validity.
              </p>
            </div>

            {documentCategories.map((cat) => {
              const isActive = activeDocCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveDocCategory(cat.id);
                    setSelectedDocument(null);
                  }}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-colors relative overflow-hidden ${
                    isActive 
                      ? 'bg-[#EFF3FE] border-[#C3D2FB] border-l-4 border-l-[#1F2B6D] dark:bg-[#1F2B6D]/20 dark:border-[#1F2B6D]/50' 
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'text-[#1F2B6D] dark:text-blue-400' : 'text-[#1F2B6D] dark:text-slate-300'}`}>
                      {cat.id === 'all' && <FileText className="w-[18px] h-[18px]" />}
                      {cat.id === 'identity' && <User className="w-[18px] h-[18px]" />}
                      {cat.id === 'vehicle' && <Car className="w-[18px] h-[18px]" />}
                    </div>
                    <div className={`text-[13px] font-bold ${isActive ? 'text-[#1F2B6D] dark:text-white' : 'text-[#1F2B6D] dark:text-slate-300'}`}>
                      {cat.label}
                    </div>
                  </div>
                  <div className={`text-[12px] font-bold px-2.5 py-0.5 rounded-full ${
                    isActive ? 'bg-[#1F2B6D] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {cat.count}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Main Documents Grid */}
          <div className="flex-1 w-full flex flex-col gap-4">
            {/* Dynamic sections based on activeDocCategory */}
            {(activeDocCategory === 'all' || activeDocCategory === 'identity') && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center">
                       <User className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px]">Identity Documents ({verifiedIdentity} / {identityDocuments.length})</h3>
                  </div>
                  {identityDocuments.length > 0 && verifiedIdentity === identityDocuments.length ? (
                    <div className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> All Verified
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[12px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                      <Clock className="w-3.5 h-3.5" /> {pendingLabel(verifiedIdentity, identityDocuments.length)}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {identityDocuments.length === 0 && (
                    <p className="text-[12px] text-slate-400 col-span-full">No identity documents uploaded</p>
                  )}
                  {identityDocuments.map((doc) => (
                    <ReviewDocumentCard
                      key={doc.id}
                      id={doc.id}
                      name={doc.name}
                      number={doc.number}
                      status={doc.status}
                      image={doc.image}
                      expiryDate={doc.expiryDate}
                      isExpired={doc.isExpired}
                      uploaded={doc.uploaded}
                      variant="standard"
                      onClick={() => setSelectedDocument(doc)}
                    />
                  ))}
                </div>
              </div>
            )}

            {(activeDocCategory === 'all' || activeDocCategory === 'vehicle') && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center">
                       <Car className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px]">Vehicle Documents ({verifiedVehicle} / {vehicleDocuments.length})</h3>
                  </div>
                  {vehicleDocuments.length > 0 && verifiedVehicle === vehicleDocuments.length ? (
                    <div className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> All Verified
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[12px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                      <Clock className="w-3.5 h-3.5" /> {pendingLabel(verifiedVehicle, vehicleDocuments.length)}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {vehicleDocuments.length === 0 && (
                    <p className="text-[12px] text-slate-400 col-span-full">No vehicle documents uploaded</p>
                  )}
                  {vehicleDocuments.map((doc) => (
                    <ReviewDocumentCard
                      key={doc.id}
                      id={doc.id}
                      name={doc.name}
                      number={doc.number}
                      status={doc.status}
                      image={doc.image}
                      expiryDate={doc.expiryDate}
                      isExpired={doc.isExpired}
                      uploaded={doc.uploaded}
                      variant="standard"
                      onClick={() => setSelectedDocument(doc)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Summary Message */}
            {allVerified ? (
              <div className="mt-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                <div className="mt-0.5"><CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-500" /></div>
                <div>
                  <h4 className="font-bold text-emerald-800 dark:text-emerald-400 text-[14px]">All uploaded documents verified</h4>
                  <p className="text-emerald-600 dark:text-emerald-500/80 text-[13px] mt-0.5">{verifiedTotal} of {totalDocs} documents have been verified.</p>
                </div>
              </div>
            ) : (
              <div className="mt-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                <div className="mt-0.5"><AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500" /></div>
                <div>
                  <h4 className="font-bold text-amber-800 dark:text-amber-400 text-[14px]">{totalDocs === 0 ? 'No documents uploaded yet' : 'Verification incomplete'}</h4>
                  <p className="text-amber-700 dark:text-amber-500/80 text-[13px] mt-0.5">{verifiedTotal} of {totalDocs} documents verified.</p>
                </div>
              </div>
            )}

            {/* Bottom Step Navigation Bar */}
            <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleStepChange(1)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[#1F2B6D] dark:text-slate-200 font-semibold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer bg-white dark:bg-slate-900 shadow-2xs"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Claim Form
              </button>
              <button
                type="button"
                onClick={() => handleStepChange(3)}
                className="px-5 py-2.5 rounded-lg bg-[#1F2B6D] hover:bg-[#182258] text-white font-bold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                Proceed to Bank Details
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        doc={selectedDocument}
        applicationId={id || ''}
        onClose={() => setSelectedDocument(null)}
        onOpenDocument={openDocument}
      />

      {/* ─── Step 3: Bank Details ────────────────────────────────────────── */}
      {activeStep === 3 && (
        <BankDetailsReviewStep
          driverId={(data as any).driverId || (data as any).id || id || ''}
          applicantName={appData.name}
          bankAccount={appData.bankAccount}
          bankName={appData.bankName}
          bankAccountName={appData.bankAccountName}
          bankAccountNumber={appData.bankAccountNumber}
          bankIfsc={appData.bankIfsc}
          bankUpi={appData.bankUpi}
          bankStatus={appData.bankStatus}
          bankPayoutEnabled={appData.bankPayoutEnabled}
          hasBankDetails={hasBankDetails}
          isBankCompleted={isBankCompleted}
          rawDocs={rawDocs}
          onEditBank={() => handleOpenEdit('status')}
          onSelectDocument={setSelectedDocument}
          onRefresh={() => {
            void refetch()
          }}
          onBack={() => handleStepChange(2)}
          onProceed={() => handleStepChange(4)}
        />
      )}

      {/* ─── Step 4: Final Review ────────────────────────────────────────────── */}
      {activeStep === 4 && (
        <div className="space-y-4 mt-2">
          {/* 1. Verification Summary Card (Full Width) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-start sm:items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center shadow-2xs shrink-0">
                  <FileCheck className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px]">
                    Verification Summary
                  </h3>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {allVerified
                      ? 'All uploaded documents are verified. Review the details below and take the final action.'
                      : totalDocs === 0
                        ? 'The driver has not uploaded any documents yet.'
                        : `${pendingIssues} of ${totalDocs} documents still need review.`}
                  </p>
                </div>
              </div>
              <div className={`self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-bold border shrink-0 ${allVerified ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0] dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40' : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40'}`}>
                {allVerified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                {allVerified ? 'Ready for Decision' : 'Review Pending'}
              </div>
            </div>

            {/* 4 Summary Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <ReviewSummaryCard
                icon={<FileText className="w-5 h-5 text-white" />}
                iconBgColor="bg-[#1F2B6D]"
                title="Application"
                value={appData.statusLabel}
                valueColor="text-[#1F2B6D] dark:text-white"
                subtitle={`Submitted ${appData.submittedDate}`}
              />
              <ReviewSummaryCard
                icon={<IdCard className="w-5 h-5 text-white" />}
                iconBgColor="bg-[#1F2B6D]"
                title="Identity Documents"
                value={`${verifiedIdentity} / ${identityDocuments.length} Verified`}
                valueColor="text-[#1F2B6D] dark:text-white"
                subtitle={identityDocuments.map((d) => d.name).join(', ') || 'None uploaded'}
              />
              <ReviewSummaryCard
                icon={<Car className="w-5 h-5 text-white" />}
                iconBgColor="bg-[#1F2B6D]"
                title="Vehicle Documents"
                value={`${verifiedVehicle} / ${vehicleDocuments.length} Verified`}
                valueColor="text-[#1F2B6D] dark:text-white"
                subtitle={vehicleDocuments.map((d) => d.name).join(', ') || 'None uploaded'}
              />
              <ReviewSummaryCard
                icon={<AlertTriangle className="w-5 h-5 text-white" />}
                iconBgColor={pendingIssues ? 'bg-amber-500' : 'bg-[#1F2B6D]'}
                title="Pending Issues"
                value={pendingIssues ? String(pendingIssues) : 'None'}
                valueColor={pendingIssues ? 'text-amber-600 dark:text-amber-400' : 'text-[#1F2B6D] dark:text-white'}
                subtitle={pendingIssues ? 'Documents awaiting verification' : 'All uploaded documents verified'}
              />
            </div>
          </div>

          {/* 2. Middle Section: 4 Balanced Detail Cards Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
            {/* Personal Information */}
            <PersonalInfoCard
              name={appData.name}
              phone={appData.phone}
              alternatePhone={appData.alternatePhone}
              email={appData.email}
              dob={appData.dob}
              age={appData.age}
              gender={appData.gender}
              bloodGroup={appData.bloodGroup}
              drivingExperience={appData.drivingExperience}
              language={appData.language}
              address={appData.address}
              photoUrl={data.profilePhotoUrl}
              onEdit={() => handleOpenEdit('personal')}
            />

            {/* Vehicle Information */}
            <VehicleInfoCard
              vehicleType={appData.vehicleType}
              brand={appData.vehicleMake}
              model={appData.vehicleModel}
              registrationPlate={appData.vehicleReg}
              color={appData.vehicleColor}
              manufacturingYear={appData.vehicleYear}
              fuelType={appData.vehicleFuel}
              seatsCapacity={appData.vehicleSeats}
              vehicleCategory={appData.vehicleCategory}
              photoUrl={appData.vehiclePhoto}
              onEdit={() => handleOpenEdit('vehicle')}
            />

            {/* Bank & Payout Details */}
            <BankInfoCard
              bankName={appData.bankName}
              accountHolderName={appData.bankAccountName}
              accountNumber={appData.bankAccountNumber}
              ifscCode={appData.bankIfsc}
              upiId={appData.bankUpi}
              status={appData.bankStatus}
              payoutEnabled={appData.bankPayoutEnabled}
              onEdit={() => handleOpenEdit('status')}
            />

            {/* Application Timeline Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm flex flex-col justify-between h-full overflow-hidden">
              <div>
                <div className="flex items-center justify-between gap-2.5 mb-3.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center shadow-2xs shrink-0">
                      <Clock className="w-3.5 h-3.5 text-white" />
                    </div>
                    <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px] truncate">
                      Application Timeline
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40 shrink-0">
                    {timelineItems.length} Events
                  </span>
                </div>

                <div className="space-y-0.5">
                  {timelineItems.map((item, idx) => {
                    const isLast = idx === timelineItems.length - 1
                    return (
                      <div key={idx} className="flex gap-3 relative group">
                        {/* Track Column: Dot + Auto-connecting Line */}
                        <div className="flex flex-col items-center shrink-0 w-3.5 self-stretch">
                          <div
                            className={`w-3 h-3 rounded-full shrink-0 z-10 transition-all mt-0.5 ${
                              item.isCurrent
                                ? 'bg-blue-600 ring-4 ring-blue-100 dark:ring-blue-900/40'
                                : 'bg-emerald-500 ring-4 ring-emerald-50 dark:ring-emerald-950/40'
                            }`}
                          />
                          {!isLast && (
                            <div className="w-0.5 flex-1 bg-emerald-300 dark:bg-emerald-700/60 my-1 min-h-[22px]" />
                          )}
                        </div>

                        {/* Content */}
                        <div className={`flex-1 min-w-0 ${!isLast ? 'pb-3.5' : 'pb-1'}`}>
                          <div className="flex items-baseline justify-between gap-2">
                            <h4
                              className={`text-[12.5px] font-bold truncate ${
                                item.isCurrent
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-[#1F2B6D] dark:text-slate-200'
                              }`}
                            >
                              {item.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">
                              {item.date}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 shadow-2xs ${
                          allVerified
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {allVerified ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <span className="text-[11.5px] font-bold text-[#1F2B6D] dark:text-white truncate">
                        {allVerified ? 'Ready for Decision' : 'Review Pending'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#1F2B6D] dark:text-slate-300 shrink-0 shadow-2xs">
                      {appData.id}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 pl-8 truncate">
                    Last action by <span className="font-medium text-slate-700 dark:text-slate-300">{appData.lastActionBy}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── BOTTOM FULL-WIDTH: Documents (7 / 7 Verified) Card ───────────── */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center shadow-2xs">
                  <FileText className="w-3.5 h-3.5 text-white" />
                </div>
                <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px]">
                  Documents ({verifiedTotal} / {totalDocs} Verified)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => handleStepChange(2)}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-[12px] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
              >
                View All Documents <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Row 1: Identity Documents */}
              <div className="flex flex-col lg:flex-row lg:items-stretch gap-3.5">
                {/* Left Category Column */}
                <div className="w-full lg:w-[145px] shrink-0 flex lg:flex-col items-center justify-center gap-2 p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-center lg:self-stretch">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs border border-blue-100 dark:border-blue-800/40">
                    <User className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="font-bold text-[#1F2B6D] dark:text-slate-200 text-[12.5px] block leading-tight">
                      Identity Documents
                    </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 text-[11px] block mt-1">
                      ({verifiedIdentity} / {identityDocuments.length})
                    </span>
                  </div>
                </div>

                {/* Identity Document Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3 flex-1">
                  {identityDocuments.map((doc) => (
                    <ReviewDocumentCard
                      key={doc.id}
                      id={doc.id}
                      name={doc.name}
                      number={doc.number}
                      status={doc.status}
                      image={doc.image}
                      isExpired={doc.isExpired}
                      variant="compact"
                      onClick={() => setSelectedDocument(doc)}
                    />
                  ))}
                </div>
              </div>

              {/* Row 2: Vehicle Documents */}
              <div className="flex flex-col lg:flex-row lg:items-stretch gap-3.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                {/* Left Category Column */}
                <div className="w-full lg:w-[145px] shrink-0 flex lg:flex-col items-center justify-center gap-2 p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-center lg:self-stretch">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs border border-blue-100 dark:border-blue-800/40">
                    <Car className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="font-bold text-[#1F2B6D] dark:text-slate-200 text-[12.5px] block leading-tight">
                      Vehicle Documents
                    </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 text-[11px] block mt-1">
                      ({verifiedVehicle} / {vehicleDocuments.length})
                    </span>
                  </div>
                </div>

                {/* Vehicle Document Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3 flex-1">
                  {vehicleDocuments.map((doc) => (
                    <ReviewDocumentCard
                      key={doc.id}
                      id={doc.id}
                      name={doc.name}
                      number={doc.number}
                      status={doc.status}
                      image={doc.image}
                      isExpired={doc.isExpired}
                      variant="compact"
                      onClick={() => setSelectedDocument(doc)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Step Navigation Bar */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => handleStepChange(3)}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[#1F2B6D] dark:text-slate-200 font-semibold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer bg-white dark:bg-slate-900 shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Bank Details
            </button>
            <button
              type="button"
              onClick={() => handleStepChange(5)}
              className="px-5 py-2.5 rounded-lg bg-[#1F2B6D] hover:bg-[#182258] text-white font-bold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              Proceed to Decision
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 5: Decision (Step 6 in Stepper) ──────────────────────────────── */}
      {activeStep === 5 && (
        <div className="w-full py-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Left: Driver Summary & Verification Readiness Checklist */}
            <div className="lg:col-span-5">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center shadow-2xs">
                        <User className="w-3.5 h-3.5 text-white" />
                      </div>
                      <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px]">
                        Applicant Summary
                      </h3>
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadgeClass}`}>
                      {appData.statusLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5 py-4">
                    <div className="w-13 h-13 rounded-full bg-slate-100 overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0 flex items-center justify-center">
                      <FileImage
                        src={data.profilePhotoUrl}
                        alt={appData.name}
                        className="w-full h-full object-cover"
                        fallback={<User className="w-6 h-6 text-slate-400" />}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-bold text-[#1F2B6D] dark:text-white text-[15px] truncate">
                          {appData.name}
                        </h4>
                        <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {appData.id}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[12px] font-mono mt-0.5">{appData.phone}</p>
                      <p className="text-slate-400 text-[11px] truncate">{appData.email}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-[12.5px]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Verification Readiness Gate
                  </p>

                  <div className="space-y-2.5">
                    {/* Item 1: Documents */}
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        {allVerified ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        )}
                        <span className="font-medium text-slate-700 dark:text-slate-300">KYC Documents</span>
                      </div>
                      <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        allVerified
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40'
                      }`}>
                        {verifiedTotal} / {totalDocs} Verified
                      </span>
                    </div>

                    {/* Item 2: Expiry */}
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        {expiredDocsCount > 0 ? (
                          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                        <span className="font-medium text-slate-700 dark:text-slate-300">Document Expiry</span>
                      </div>
                      <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        expiredDocsCount > 0
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                      }`}>
                        {expiredDocsCount > 0 ? `${expiredDocsCount} Expired` : 'All In Date'}
                      </span>
                    </div>

                    {/* Item 3: Bank Account */}
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        {isBankCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        )}
                        <span className="font-medium text-slate-700 dark:text-slate-300">Settlement Account</span>
                      </div>
                      <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        isBankCompleted
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                          : appData.bankStatus?.toUpperCase() === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40'
                      }`}>
                        {formatBankStatusLabel(appData.bankStatus, appData.bankPayoutEnabled)}
                      </span>
                    </div>

                    {/* Item 4: Vehicle Plate */}
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-[#1F2B6D] dark:text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {appData.vehicleMake} {appData.vehicleModel}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#1F2B6D] dark:text-slate-200">
                        {appData.vehicleReg}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Application Decision Hub (Executive Segmented Console) */}
            <div className="lg:col-span-7">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col justify-between h-full space-y-5">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#1F2B6D] text-white flex items-center justify-center shadow-2xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-white" />
                      </div>
                      <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[15px]">
                        Executive Application Decision
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">Final Sign-Off</span>
                  </div>

                  {/* ─── 3-Segment Executive Tab Selector ──────────────────────── */}
                  <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100/90 dark:bg-slate-800/70 rounded-xl mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setDecisionTab('approve')
                        setDecisionReason('')
                      }}
                      className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        decisionTab === 'approve'
                          ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm border border-emerald-200/80 dark:border-emerald-800/50'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="truncate">Approve</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDecisionTab('reupload')
                        setDecisionReason('')
                      }}
                      className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        decisionTab === 'reupload'
                          ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-sm border border-amber-200/80 dark:border-amber-800/50'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="truncate">Re-submission</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDecisionTab('reject')
                        setDecisionReason('')
                      }}
                      className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        decisionTab === 'reject'
                          ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 shadow-sm border border-rose-200/80 dark:border-rose-800/50'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span className="truncate">Reject</span>
                    </button>
                  </div>

                  {/* ─── TAB 1: APPROVE APPLICATION ────────────────────────────── */}
                  {decisionTab === 'approve' && (
                    <div className="space-y-4 mt-4">
                      {approveBlockedReason ? (
                        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/90 dark:bg-amber-950/30 flex items-start justify-between gap-3 shadow-2xs">
                          <div className="flex items-start gap-2.5">
                            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-bold text-amber-900 dark:text-amber-300">
                                Approval Blocked
                              </p>
                              <p className="text-[12px] text-amber-700 dark:text-amber-400/90 mt-0.5 leading-snug">
                                {approveBlockedReason}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleStepChange(2)}
                            className="px-2.5 py-1 rounded-md text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 hover:bg-amber-50 shadow-2xs shrink-0 cursor-pointer flex items-center gap-1"
                          >
                            Review Docs <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/90 dark:bg-emerald-950/30 flex items-start gap-2.5 shadow-2xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                              Ready for Approval
                            </p>
                            <p className="text-[12px] text-emerald-700 dark:text-emerald-400/90 mt-0.5 leading-snug">
                              All {totalDocs} documents are verified and within validity dates. Approving will activate the driver partner account and send an SMS notification.
                            </p>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="text-[11.5px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Approval & Onboarding Note <span className="font-normal text-slate-400">(optional)</span>
                        </label>
                        <textarea
                          rows={3}
                          value={decisionReason}
                          onChange={(e) => setDecisionReason(e.target.value)}
                          placeholder="Add any internal onboarding notes for platform audit records..."
                          className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 resize-none outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* ─── TAB 2: REQUEST RE-SUBMISSION ───────────────────────────── */}
                  {decisionTab === 'reupload' && (
                    <div className="space-y-4 mt-4">
                      <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/90 dark:bg-amber-950/30 flex items-start gap-2.5 shadow-2xs">
                        <RefreshCw className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-amber-900 dark:text-amber-300">
                            Request Corrections / Document Re-upload
                          </p>
                          <p className="text-[12px] text-amber-700 dark:text-amber-400/90 mt-0.5 leading-snug">
                            The driver application will be returned to the driver with your instructions. The driver will be notified via SMS and push notification.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11.5px] font-bold text-slate-700 dark:text-slate-300 block">
                          Quick Correction Reason Presets
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            'Please upload a clear, legible Driving License photo',
                            'Vehicle RC plate does not match registration number',
                            'Document is expired; please provide current valid certificate',
                            'Bank passbook or cancelled cheque with clear IFSC required',
                            'Aadhaar card edges cut off; please upload full document',
                          ].map((chip) => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => setDecisionReason(chip)}
                              className={`text-[11px] px-2.5 py-1 rounded-full border transition font-medium cursor-pointer ${
                                decisionReason === chip
                                  ? 'bg-amber-500 text-white border-amber-500 font-semibold'
                                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[11.5px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Instructions for Applicant <span className="text-amber-600 font-bold">*</span>
                        </label>
                        <textarea
                          rows={3}
                          value={decisionReason}
                          onChange={(e) => setDecisionReason(e.target.value)}
                          placeholder="Provide clear instructions for the driver on what needs to be fixed..."
                          className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 resize-none outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* ─── TAB 3: REJECT APPLICATION ─────────────────────────────── */}
                  {decisionTab === 'reject' && (
                    <div className="space-y-4 mt-4">
                      <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50/90 dark:bg-rose-950/30 flex items-start gap-2.5 shadow-2xs">
                        <ThumbsDown className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-rose-900 dark:text-rose-300">
                            Permanent Application Rejection
                          </p>
                          <p className="text-[12px] text-rose-700 dark:text-rose-400/90 mt-0.5 leading-snug">
                            Rejecting marks this application as rejected. The rejection reason is permanently stored in the audit trail and sent to the applicant.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11.5px] font-bold text-slate-700 dark:text-slate-300 block">
                          Common Rejection Reasons
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            'Invalid or fraudulent document',
                            'Expired commercial license',
                            'Vehicle age limit exceeded',
                            'Failed background verification',
                            'Multiple compliance discrepancies',
                          ].map((chip) => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => setDecisionReason(chip)}
                              className={`text-[11px] px-2.5 py-1 rounded-full border transition font-medium cursor-pointer ${
                                decisionReason === chip
                                  ? 'bg-rose-600 text-white border-rose-600 font-semibold'
                                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[11.5px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Rejection Justification <span className="text-rose-600 font-bold">*</span>
                        </label>
                        <textarea
                          rows={3}
                          value={decisionReason}
                          onChange={(e) => setDecisionReason(e.target.value)}
                          placeholder="Provide regulatory justification for rejecting this application..."
                          className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 resize-none outline-none focus:ring-1 focus:ring-rose-500 text-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* ─── Bottom Executive Action Bar ─────────────────────────────── */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-[11.5px] text-slate-500 dark:text-slate-400">
                    {decisionTab === 'approve' ? (
                      approveBlockedReason ? (
                        <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Resolve pending documents before approving
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Ready to activate driver partner
                        </span>
                      )
                    ) : decisionTab === 'reupload' ? (
                      <span>Applicant will receive instructions via SMS/push</span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400">Application will be marked Rejected</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    {decisionTab === 'approve' && (
                      <button
                        type="button"
                        onClick={() => setDecisionModal('approve')}
                        disabled={approveBlockedReason !== null}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#10B981] hover:bg-[#059669] active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve Application
                      </button>
                    )}

                    {decisionTab === 'reupload' && (
                      <button
                        type="button"
                        onClick={() => setDecisionModal('reupload')}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Request Re-submission
                      </button>
                    )}

                    {decisionTab === 'reject' && (
                      <button
                        type="button"
                        disabled={data.applicationStatus === 'rejected'}
                        onClick={() => setDecisionModal('reject')}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        Reject Application
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Step Navigation Bar */}
          <div className="flex items-center justify-start pt-2">
            <button
              type="button"
              onClick={() => handleStepChange(4)}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[#1F2B6D] dark:text-slate-200 font-semibold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer bg-white dark:bg-slate-900 shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Final Review
            </button>
          </div>
        </div>
      )}

      </div>

      {/* ─── Decision Custom Confirmation Popup Modal ────────────────────── */}
      {decisionModal !== 'none' && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDecisionModal('none')
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-center font-sans">
            <button
              type="button"
              onClick={() => setDecisionModal('none')}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* REJECT DECISION MODAL */}
            {decisionModal === 'reject' && (
              <div>
                <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                  <ThumbsDown className="w-7 h-7 stroke-[2]" />
                </div>
                <h3 className="font-bold text-[18px] text-[#1F2B6D] dark:text-white">
                  Reject Driver Application?
                </h3>
                <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Please provide a reason for rejecting this driver application.
                </p>

                {/* Driver Application Mini Card */}
                <div className="mt-4 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 flex items-center gap-3 text-left">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-200 border border-slate-200 shrink-0 shadow-2xs">
                    <FileImage
                      src={data.profilePhotoUrl}
                      alt={appData.name}
                      className="w-full h-full object-cover"
                      fallback={<User className="w-5 h-5 text-slate-400" />}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-[#1F2B6D] dark:text-white text-[13px] truncate">
                        {appData.name}
                      </h4>
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {appData.id}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">
                      {appData.phone} • {appData.vehicleReg}
                    </p>
                  </div>
                </div>

                {/* Preset Reasons */}
                <div className="mt-3 text-left space-y-1.5">
                  <label className="text-[11.5px] font-bold text-slate-700 dark:text-slate-300">
                    Select Rejection Reason
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Invalid or fraudulent document',
                      'Expired commercial license',
                      'Vehicle age limit exceeded',
                      'Failed background check',
                      'Incomplete profile details',
                    ].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setDecisionReason(opt)}
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition font-medium cursor-pointer ${
                          decisionReason === opt
                            ? 'bg-rose-600 text-white border-rose-600 font-semibold'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={2}
                    value={decisionReason}
                    onChange={(e) => setDecisionReason(e.target.value)}
                    placeholder="Detailed reason to share with driver..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 resize-none outline-none focus:ring-1 focus:ring-rose-500 text-slate-800 dark:text-white mt-1"
                  />
                </div>

                {/* Warning Checklist */}
                <div className="mt-3 p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-800/40 space-y-2 text-left">
                  <div className="flex items-center gap-2 text-[12px] text-slate-700 dark:text-slate-300">
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>Application will be marked as <strong className="text-rose-800 dark:text-rose-300 font-semibold">Rejected</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-slate-700 dark:text-slate-300">
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>Driver will receive an SMS and see the reason in the driver app</span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-slate-700 dark:text-slate-300">
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>Driver account will remain blocked from receiving rides</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 mt-5">
                  <button
                    type="button"
                    onClick={() => setDecisionModal('none')}
                    className="w-full py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[13px] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!decisionReason?.trim() || isRejecting}
                    onClick={() => {
                      rejectApp(
                        { id: id!, notes: decisionReason || 'Application rejected' },
                        {
                          onSuccess: () => {
                            showSuccess('Application Rejected', 'Driver application has been rejected.')
                            setDecisionModal('none')
                            refetch()
                          },
                          onError: (err: any) => {
                            showError('Rejection Failed', err?.message || 'Could not reject application')
                          },
                        },
                      )
                    }}
                    className="w-full py-2.5 rounded-lg bg-[#DC2626] hover:bg-rose-700 active:scale-[0.99] text-white font-bold text-[13px] shadow-sm transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRejecting ? 'Rejecting...' : 'Yes, Reject Application'}
                  </button>
                </div>
              </div>
            )}

            {/* APPROVE DECISION MODAL */}
            {decisionModal === 'approve' && (
              <div>
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                  <Check className="w-7 h-7 stroke-[2.5]" />
                </div>
                <h3 className="font-bold text-[18px] text-[#1F2B6D] dark:text-white">
                  Approve Driver Application?
                </h3>
                <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Are you sure you want to approve this driver application?
                </p>

                {/* Driver Application Mini Card */}
                <div className="mt-4 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 flex items-center gap-3 text-left">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-200 border border-slate-200 shrink-0 shadow-2xs">
                    <FileImage
                      src={data.profilePhotoUrl}
                      alt={appData.name}
                      className="w-full h-full object-cover"
                      fallback={<User className="w-5 h-5 text-slate-400" />}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-[#1F2B6D] dark:text-white text-[13px] truncate">
                        {appData.name}
                      </h4>
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {appData.id}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">
                      {appData.phone} • {appData.vehicleReg}
                    </p>
                  </div>
                </div>

                {/* Checklist — what approval actually does. The payment model is no part of it:
                    the driver picks it in the driver app after approval. */}
                <div className="mt-3 p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 space-y-2 text-left">
                  <div className="flex items-center gap-2 text-[12px] text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Driver and linked vehicle will be marked <strong className="text-emerald-800 dark:text-emerald-300 font-semibold">Verified</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Driver will receive an activation SMS</span>
                  </div>
                </div>

                {/* Optional Internal Approval Note */}
                <div className="mt-3 text-left">
                  <label className="text-[11.5px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Approval Note <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={decisionReason}
                    onChange={(e) => setDecisionReason(e.target.value)}
                    placeholder="Optional internal audit note..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 resize-none outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white"
                  />
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 mt-5">
                  <button
                    type="button"
                    onClick={() => setDecisionModal('none')}
                    className="w-full py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[13px] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isApproving}
                    onClick={() => {
                      approveApp(
                        { id: id!, notes: decisionReason || 'Application approved' },
                        {
                          // An approved driver is no longer an open application (the API
                          // answers 409), so go back to the queue rather than reload it.
                          onSuccess: () => {
                            showSuccess('Application Approved', 'Driver account has been verified and activated.')
                            setDecisionModal('none')
                            navigate('/driver-management/applications')
                          },
                          onError: (err: any) => {
                            showError('Approval Failed', err?.message || 'Could not approve application')
                          },
                        },
                      )
                    }}
                    className="w-full py-2.5 rounded-lg bg-[#059669] hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-[13px] shadow-sm transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isApproving ? 'Approving...' : 'Yes, Approve Application'}
                  </button>
                </div>
              </div>
            )}

            {/* RE-UPLOAD / RESUBMISSION DECISION MODAL */}
            {decisionModal === 'reupload' && (
              <div>
                <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                  <RefreshCw className="w-7 h-7 stroke-[2]" />
                </div>
                <h3 className="font-bold text-[18px] text-[#1F2B6D] dark:text-white">
                  Request Re-submission?
                </h3>
                <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Driver will be asked to re-upload required documents or correct details.
                </p>

                {/* Driver Application Mini Card */}
                <div className="mt-4 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 flex items-center gap-3 text-left">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-200 border border-slate-200 shrink-0 shadow-2xs">
                    <FileImage
                      src={data.profilePhotoUrl}
                      alt={appData.name}
                      className="w-full h-full object-cover"
                      fallback={<User className="w-5 h-5 text-slate-400" />}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-[#1F2B6D] dark:text-white text-[13px] truncate">
                        {appData.name}
                      </h4>
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {appData.id}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">
                      {appData.phone} • {appData.vehicleReg}
                    </p>
                  </div>
                </div>

                {/* Preset Reasons */}
                <div className="mt-3 text-left space-y-1.5">
                  <label className="text-[11.5px] font-bold text-slate-700 dark:text-slate-300">
                    Select Re-submission Reason
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Unclear document photos',
                      'Document is expired',
                      'Vehicle details mismatch',
                      'Selfie unclear / blurred',
                      'Missing insurance certificate',
                    ].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setDecisionReason(opt)}
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition font-medium cursor-pointer ${
                          decisionReason === opt
                            ? 'bg-amber-600 text-white border-amber-600 font-semibold'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={2}
                    value={decisionReason}
                    onChange={(e) => setDecisionReason(e.target.value)}
                    placeholder="Specific instructions for the driver..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 resize-none outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-white mt-1"
                  />
                </div>

                {/* Notice Checklist */}
                <div className="mt-3 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800/40 space-y-2 text-left">
                  <div className="flex items-center gap-2 text-[12px] text-slate-700 dark:text-slate-300">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Application will be set to <strong className="text-amber-800 dark:text-amber-300 font-semibold">Requires Re-submission</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-slate-700 dark:text-slate-300">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Driver will receive an SMS and push notification with upload link</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 mt-5">
                  <button
                    type="button"
                    onClick={() => setDecisionModal('none')}
                    className="w-full py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[13px] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!decisionReason?.trim() || isResubmitting}
                    onClick={() => {
                      resubmitApp(
                        { id: id!, notes: decisionReason || 'Please re-upload required documents' },
                        {
                          onSuccess: () => {
                            showSuccess('Re-submission Requested', 'Driver has been notified to re-submit.')
                            setDecisionModal('none')
                            refetch()
                          },
                          onError: (err: any) => {
                            showError('Request Failed', err?.message || 'Could not request re-submission')
                          },
                        },
                      )
                    }}
                    className="w-full py-2.5 rounded-lg bg-[#F59E0B] hover:bg-amber-600 active:scale-[0.99] text-white font-bold text-[13px] shadow-sm transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isResubmitting ? 'Sending...' : 'Send Re-submission Request'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Custom Edit Driver Modal ────────────────────────────────────────── */}
      <EditDriverModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        driver={data as any}
        initialTab={editInitialTab}
        onSave={handleEditSave}
        loading={isUpdatingDriver || isUpdatingMutation}
      />

    </div>
  )
}

export default ApplicationReviewPage
