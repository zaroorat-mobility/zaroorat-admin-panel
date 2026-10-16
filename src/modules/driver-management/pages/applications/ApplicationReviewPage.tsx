import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  useApplication,
  useVerifyApplicationDocument,
  useApproveApplication,
  useRejectApplication,
  useRequestResubmission,
  useVerifyDriverBankAccount,
} from '../../hooks'
import {
  ReviewSummaryCard,
  ReviewDocumentCard,
  PersonalInfoCard,
  VehicleInfoCard,
  DriverProfileHeaderCard,
  BankInfoCard,
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
  Download,
  ThumbsDown,
  RefreshCw,
  AlertTriangle,
  IdCard,
  Image as ImageIcon,
  XCircle,
  ExternalLink,
  CreditCard,
  Building2,
  Copy,
  Lock,
  Smartphone,
} from 'lucide-react'
import { FileImage } from '@/shared/components/FileImage'
import { getFileReadUrl } from '@/shared/services/file-upload.service'
import { isFileId, isPdfUrl, resolveFileRef } from '@/shared/utils/file-ref'
import { useFileReadUrl } from '@/shared/hooks/useFileReadUrl'
import type { DriverKycDocument } from '../../types'
import photoFrontShowcase from '@/assets/images/vehicle-showcase/photo-front.png'


/// Cards with details on both faces; the backend keys document types in upper case.
const TWO_SIDED_DOC_TYPES = new Set(['driving_license', 'aadhaar', 'rc', 'vehicle_photos', 'vehicle_photo'])

export const ApplicationReviewPage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { success: showSuccess, error: showError } = useToast()
  
  const [activeStep, setActiveStep] = useState<number>(4) // Default to 4 (Final Review) matching design mockup
  const [activeSidebarItem, setActiveSidebarItem] = useState<string>('personal')
  const [activeDocCategory, setActiveDocCategory] = useState<string>('all')
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null)
  const [decisionModal, setDecisionModal] = useState<'none' | 'approve' | 'reupload' | 'reject'>('none')
  const [decisionReason, setDecisionReason] = useState<string>('')

  const { data, isLoading, refetch } = useApplication(id || '')
  const { mutate: approveApp, isPending: isApproving } = useApproveApplication()
  const { mutate: rejectApp, isPending: isRejecting } = useRejectApplication()
  const { mutate: resubmitApp, isPending: isResubmitting } = useRequestResubmission()
  const { mutate: verifyBank, isPending: isVerifyingBank } = useVerifyDriverBankAccount()
  const [reviewedSteps, setReviewedSteps] = useState<Set<number>>(() => new Set())

  if (isLoading || !data) return <div className="p-8 flex justify-center">Loading application...</div>

  const getDocName = (type: string) => {
    if (!type) return 'Document'
    const key = type.toLowerCase().trim()
    const map: Record<string, string> = {
      'license': 'Driving License',
      'driving_license': 'Driving License',
      'driving-license': 'Driving License',
      'driver_license': 'Driving License',
      'driver-license': 'Driving License',
      'license_front': 'Driving License Front',
      'license_back': 'Driving License Back',
      'driving_license_front': 'Driving License Front',
      'driving_license_back': 'Driving License Back',
      'aadhaar': 'Aadhaar Card',
      'aadhar': 'Aadhaar Card',
      'aadhaar_card': 'Aadhaar Card',
      'aadhaar_front': 'Aadhaar Card Front',
      'aadhaar_back': 'Aadhaar Card Back',
      'pan': 'PAN Card',
      'pan_card': 'PAN Card',
      'passport': 'Passport',
      'voter': 'Voter ID',
      'voter_id': 'Voter ID',
      'rc': 'RC Certificate',
      'rc_certificate': 'RC Certificate',
      'rc_front': 'RC Certificate Front',
      'rc_back': 'RC Certificate Back',
      'registration': 'RC Certificate',
      'vehicle_rc': 'RC Certificate',
      'insurance': 'Vehicle Insurance',
      'vehicle_insurance': 'Vehicle Insurance',
      'insurance_policy': 'Vehicle Insurance',
      'permit': 'Commercial Permit',
      'commercial_permit': 'Commercial Permit',
      'photo': 'Profile Photo',
      'profile_photo': 'Profile Photo',
      'selfie': 'Selfie Photo',
      'pollution': 'PUC Certificate',
      'puc': 'PUC Certificate',
      'puc_certificate': 'PUC Certificate',
      'fitness': 'Fitness Certificate',
      'fitness_certificate': 'Fitness Certificate',
      'vehicle_photos': 'Vehicle Photos',
      'vehicle_photo': 'Vehicle Photos',
    }
    if (map[key]) return map[key]
    return key
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Verified'
      case 'pending': return 'Pending Review'
      case 'reupload_requested': return 'Re-upload Required'
      case 'rejected': return 'Rejected'
      default: return 'Not Uploaded'
    }
  }

  const isVehicleDocType = (docType: string = '') => {
    const dt = docType.toLowerCase().replace(/[-_]/g, '')
    return (
      dt.includes('rc') ||
      dt.includes('insurance') ||
      dt.includes('pollution') ||
      dt.includes('puc') ||
      dt.includes('permit') ||
      dt.includes('fitness') ||
      dt.includes('vehicle')
    )
  }

  const fmtDateTime = (iso?: string) => {
    const d = iso ? new Date(iso) : null
    return d && !isNaN(d.getTime())
      ? d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '—'
  }

  const fmtDate = (iso?: string) => {
    const d = iso ? new Date(iso) : null
    return d && !isNaN(d.getTime())
      ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : '—'
  }

  const ageFrom = (iso?: string) => {
    const d = iso ? new Date(iso) : null
    if (!d || isNaN(d.getTime())) return '—'
    const now = new Date()
    const beforeBirthday =
      now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())
    return String(now.getFullYear() - d.getFullYear() - (beforeBirthday ? 1 : 0))
  }

  const capitalize = (v?: string) => (v ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : '—')

  const openDocument = async (ref: string, disposition: 'inline' | 'attachment' = 'attachment') => {
    if (!ref) return
    try {
      window.open(isFileId(ref) ? await getFileReadUrl(ref, disposition) : ref, '_blank', 'noopener')
    } catch {
      showError('Download failed', 'Could not open this document')
    }
  }

  // Only what the driver actually uploaded; nothing is filled in for missing documents.
  const toReviewDoc = (d: DriverKycDocument) => {
    const isDocPdf = Boolean(
      d.isPdf ||
      d.contentType === 'application/pdf' ||
      (d.fileUrl && isPdfUrl(d.fileUrl))
    );
    return {
      id: d.id,
      name: getDocName(d.docType),
      number: d.docNumber || '—',
      issuedBy: '—',
      issueDate: fmtDate(d.issuedDate),
      expiryDate: fmtDate(d.expiryDate),
      uploaded: fmtDateTime(d.createdAt),
      status: getStatusLabel(d.verifyStatus),
      image: resolveFileRef(d.fileUrl, d.fileId),
      backImage: d.backFileId ?? '',
      twoSided: !isDocPdf && TWO_SIDED_DOC_TYPES.has(d.docType.toLowerCase()),
      isPdf: isDocPdf,
      contentType: d.contentType,
      rawDoc: d,
    };
  };

  const rawDocs = data.documents || []
  const isVehicleDoc = (d: DriverKycDocument) =>
    d.category ? d.category === 'vehicle' : isVehicleDocType(d.docType)
  const identityDocuments = rawDocs.filter((d) => !isVehicleDoc(d)).map(toReviewDoc)
  const vehicleDocuments = rawDocs.filter(isVehicleDoc).map(toReviewDoc)
  const allDocs = [...identityDocuments, ...vehicleDocuments]

  const countVerified = (docs: typeof allDocs) => docs.filter((d) => d.status === 'Verified').length
  const verifiedIdentity = countVerified(identityDocuments)
  const verifiedVehicle = countVerified(vehicleDocuments)
  const verifiedTotal = verifiedIdentity + verifiedVehicle
  const totalDocs = allDocs.length
  const pendingIssues = totalDocs - verifiedTotal
  const allVerified = totalDocs > 0 && pendingIssues === 0
  const allReviewed = totalDocs > 0 && rawDocs.every((d) => d.verifyStatus !== 'pending')

  // Dynamic data presence checks
  const hasOverview = Boolean(
    data.driverName &&
      data.driverName !== '—' &&
      data.driverName.trim() !== '' &&
      ((data.mobileNumber && data.mobileNumber !== '—' && data.mobileNumber.trim() !== '') ||
        (data.email && data.email !== '—' && data.email.trim() !== '') ||
        (data.city && data.city !== '—' && data.city.trim() !== ''))
  )

  const hasClaimForm = Boolean(
    (data.addressLine1 && data.addressLine1 !== '—' && data.addressLine1.trim() !== '') ||
      (data.emergencyContactNumber && data.emergencyContactNumber !== '—' && data.emergencyContactNumber.trim() !== '') ||
      (data.emergencyContactName && data.emergencyContactName !== '—' && data.emergencyContactName.trim() !== '') ||
      (Array.isArray((data as any).emergencyContacts) && (data as any).emergencyContacts.length > 0) ||
      (data.vehicle?.registrationPlate && data.vehicle.registrationPlate !== '—' && data.vehicle.registrationPlate.trim() !== '') ||
      (data.vehicleType && (data.vehicleType as unknown) !== '—')
  )

  const hasBankDetails = Boolean(
    (Array.isArray((data as any).bankAccounts) &&
      (data as any).bankAccounts.length > 0 &&
      (data as any).bankAccounts.some(
        (a: any) =>
          Boolean(a.bankName && a.bankName !== '—') ||
          Boolean(a.accountHolderName && a.accountHolderName !== '—') ||
          Boolean(a.ifscCode && a.ifscCode !== '—') ||
          Boolean(a.accountNumberLast4 || a.accountNumberMasked),
      )) ||
    (data.bankAccountNumber && data.bankAccountNumber !== '—' && data.bankAccountNumber.trim() !== '') ||
    (data.bankName && data.bankName !== '—' && data.bankName.trim() !== '')
  )

  const isApproved = data.applicationStatus === 'approved'

  // Dynamic step completion: green ticks appear when step is verified, completed, or reviewed by operator
  // 1. Overview: completed when applicant data is present, reviewed, or application approved
  const isOverviewCompleted = Boolean(
    isApproved || hasOverview || reviewedSteps.has(0)
  )

  // 2. Claim Form: completed when claim form data is present, reviewed, or application approved
  const isClaimFormCompleted = Boolean(
    isApproved || hasClaimForm || reviewedSteps.has(1)
  )

  // 3. Documents: completed when all documents are reviewed/verified or reviewer has reviewed documents step
  const isDocumentsCompleted = Boolean(
    isApproved || (totalDocs > 0 && allReviewed) || reviewedSteps.has(2)
  )

  // 4. Bank Details: completed when bank account is verified or reviewer has reviewed bank details step
  const isBankCompleted = Boolean(
    isApproved ||
      (hasBankDetails &&
        (Boolean((data as any).bankAccounts?.[0]?.payoutEnabled) ||
          (data as any).bankAccounts?.[0]?.status === 'ACTIVE' ||
          (data as any).bankAccounts?.[0]?.status === 'VERIFIED' ||
          (data as any).bankAccounts?.[0]?.verificationStatus === 'VERIFIED')) ||
      reviewedSteps.has(3)
  )

  // 5. Final Review: completed when all documents are verified or reviewer has reviewed final review step
  const isFinalReviewCompleted = Boolean(
    isApproved || allVerified || reviewedSteps.has(4)
  )

  // 6. Decision: completed when application decision is approved/rejected or reviewed
  const isDecisionCompleted = Boolean(
    data.applicationStatus === 'approved' ||
      data.applicationStatus === 'rejected' ||
      reviewedSteps.has(5)
  )

  // Stepper completion is strictly dynamic — tick appears only when completed.
  const stepDone = [
    isOverviewCompleted,
    isClaimFormCompleted,
    isDocumentsCompleted,
    isBankCompleted,
    isFinalReviewCompleted,
    isDecisionCompleted,
  ]
  const approveBlockedReason = allVerified
    ? null
    : totalDocs === 0
      ? 'No documents uploaded yet.'
      : `${pendingIssues} of ${totalDocs} documents not verified yet.`
  const statusBadgeClass =
    data.applicationStatus === 'approved'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
      : data.applicationStatus === 'rejected'
        ? 'bg-rose-50 border-rose-200 text-rose-700'
        : 'bg-[#FEF08A]/50 border-amber-200 text-amber-700'
  const pendingLabel = (verified: number, total: number) =>
    total === 0 ? 'None uploaded' : `${total - verified} Pending`

  // Real audit trail from the backend (oldest first; the last entry is the current state).
  const sortedTimeline = [...(data.timeline ?? [])].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  const lastEvent = sortedTimeline[sortedTimeline.length - 1]
  const timelineItems = sortedTimeline.map((e, i) => ({
    title: e.action,
    date: fmtDateTime(e.timestamp),
    desc: e.notes && e.notes !== e.action ? `${e.notes} — ${e.actor}` : `By ${e.actor}`,
    isCurrent: i === sortedTimeline.length - 1,
  }))

  const STATUS_LABELS: Record<string, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    pending_review: 'Pending Review',
    under_review: 'Under Review',
    approved: 'Approved',
    rejected: 'Rejected',
    resubmission_required: 'Resubmission Required',
  }

  const appData = {
    id: data.applicationId || data.id,
    name: data.driverName || '—',
    phone: data.mobileNumber || '—',
    alternatePhone: (data as any).alternatePhone || '—',
    bloodGroup: (data as any).bloodGroup || '—',
    drivingExperience: (data as any).drivingExperienceYears != null ? `${(data as any).drivingExperienceYears} years` : '—',
    email: data.email || '—',
    dob: fmtDate(data.dateOfBirth),
    age: ageFrom(data.dateOfBirth),
    gender: capitalize(data.gender),
    language: data.preferredLanguage || '—',
    location: [data.city, data.state].filter(Boolean).join(', ') || '—',
    address: [data.addressLine1, data.addressLine2, data.city, data.state, data.postcode].filter(Boolean).join(', ') || '—',
    emergencyContactName: data.emergencyContactName || (data as any).emergencyContacts?.[0]?.contactName || '—',
    emergencyContactPhone: data.emergencyContactNumber || (data as any).emergencyContacts?.[0]?.phoneNumber || '—',
    emergencyContactRelationship:
      (data as any).emergencyContactRelationship ||
      (data as any).emergencyContacts?.[0]?.relationship ||
      '—',

    vehicleType: capitalize(data.vehicle?.vehicleType ?? data.vehicleType),
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
      photoFrontShowcase,

    submittedDate: fmtDateTime(data.submittedAt),
    statusLabel: STATUS_LABELS[data.applicationStatus] ?? data.applicationStatus,
    lastActionBy: lastEvent?.actor ?? '—',
    lastActionDate: fmtDateTime(lastEvent?.timestamp),
    progress: totalDocs ? Math.round((verifiedTotal / totalDocs) * 100) : 0,

    bankAccount: (data as any).bankAccounts?.[0] || null,
    bankName: (data as any).bankAccounts?.[0]?.bankName || data.bankName || '—',
    bankAccountName: (data as any).bankAccounts?.[0]?.bankAccountName || data.bankAccountName || '—',
    bankAccountNumber: (data as any).bankAccounts?.[0]?.accountNumberMasked || data.bankAccountNumber || '—',
    bankIfsc: (data as any).bankAccounts?.[0]?.bankIfsc || data.bankIfsc || '—',
    bankUpi: (data as any).bankAccounts?.[0]?.upiId || data.upiId || '—',
    bankStatus: (data as any).bankAccounts?.[0]?.status || (data as any).bankAccounts?.[0]?.verificationStatus || null,
    bankPayoutEnabled: Boolean((data as any).bankAccounts?.[0]?.payoutEnabled),
  }

  const documentCategories = [
    { id: 'all', label: 'All Documents', count: identityDocuments.length + vehicleDocuments.length },
    { id: 'identity', label: 'Identity Documents', count: identityDocuments.length },
    { id: 'vehicle', label: 'Vehicle Documents', count: vehicleDocuments.length },
  ]



  const DocumentPreviewModal = ({ doc, onClose }: { doc: any, onClose: () => void }) => {
    const [action, setAction] = useState<'none' | 'verify' | 'reject' | 'reupload'>('none');
    const [message, setMessage] = useState('');
    const { mutate: verifyDocument, isPending } = useVerifyApplicationDocument();

    const { url: frontUrl, isPdf: isPdfHook, loading: frontLoading } = useFileReadUrl(doc?.image);
    const isFrontPdf = Boolean(doc?.isPdf || isPdfHook || isPdfUrl(doc?.image));
    const isSinglePdf = isFrontPdf && !doc?.backImage;

    const handleConfirm = () => {
      let status: 'approved' | 'rejected' | 'reupload_requested' = 'approved';
      if (action === 'reject') status = 'rejected';
      else if (action === 'reupload') status = 'reupload_requested';

      verifyDocument({
        applicationId: id as string,
        documentId: doc.rawDoc.id,
        status,
        comment: message
      }, {
        onSuccess: () => {
          onClose();
        },
        onError: (err) => showError('Update failed', err.message),
      });
    };

    if (!doc) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 md:p-8">
        <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-full border border-slate-200 dark:border-slate-800">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-[#1F2B6D] dark:text-blue-400" />
                <h3 className="font-bold text-[#1F2B6D] dark:text-white text-lg leading-none">{doc.name}</h3>
                {isSinglePdf && (
                  <span className="ml-2 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                    PDF Document
                  </span>
                )}
              </div>
              <p className="text-[13px] text-slate-500 font-medium">Document Number: {doc.number} • Uploaded on {doc.uploaded}</p>
            </div>
            <button onClick={onClose} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Main Content - Document View */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50 dark:bg-slate-950/50 custom-scrollbar flex justify-center items-start min-h-[400px]">
            {isSinglePdf ? (
              <div className="w-full max-w-3xl flex flex-col gap-2">
                <div className="flex items-center justify-between px-3 py-2 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 rounded-xl text-[12px] font-semibold text-rose-800 dark:text-rose-300">
                  <span className="flex items-center gap-1.5 font-bold">
                    <FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    Complete Digital Document (PDF contains all pages)
                  </span>
                  <button
                    type="button"
                    onClick={() => openDocument(doc.image, 'inline')}
                    className="text-[#1F2B6D] dark:text-blue-400 hover:underline flex items-center gap-1 text-[12px] font-bold cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
                  </button>
                </div>
                <div className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl h-[55vh] min-h-[440px] overflow-hidden shadow-sm flex flex-col">
                  {frontLoading && !frontUrl && !isPdfUrl(doc.image) ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-800">
                      <div className="w-8 h-8 border-3 border-rose-500/30 border-t-rose-600 rounded-full animate-spin" />
                      <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">Loading PDF document...</p>
                    </div>
                  ) : (
                    <iframe
                      src={`${frontUrl || doc.image}#toolbar=1`}
                      className="w-full h-full border-0 bg-white"
                      title={`${doc.name} PDF Preview`}
                    />
                  )}
                </div>
              </div>
            ) : frontLoading && !doc?.backImage && doc?.twoSided ? (
              <div className="w-full max-w-3xl min-h-[440px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-3 shadow-sm">
                <div className="w-9 h-9 border-3 border-blue-600/30 border-t-[#1F2B6D] dark:border-t-blue-400 rounded-full animate-spin" />
                <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">Loading document preview...</p>
              </div>
            ) : doc.twoSided ? (
              <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-4">
                {([['Front', doc.image], ['Back', doc.backImage]] as const).map(([side, src]) => (
                  <div key={side} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl min-h-[320px] flex flex-col overflow-hidden shadow-sm">
                    <div className="px-3 py-2 text-[12px] font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <span>{side}</span>
                      {src && (
                        <button
                          type="button"
                          onClick={() => openDocument(src, 'inline')}
                          className="text-[11px] text-[#1F2B6D] dark:text-blue-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" /> View Full
                        </button>
                      )}
                    </div>
                    <div className="flex-1 flex items-center justify-center p-2">
                      <FileImage
                        src={src}
                        alt={`${doc.name} (${side.toLowerCase()})`}
                        className="max-w-full h-auto object-contain max-h-[55vh]"
                        fallback={
                          <p className="text-slate-400 dark:text-slate-500 font-medium text-[14px]">
                            {side === 'Back' && !src ? 'Back not provided' : 'No Document Image Available'}
                          </p>
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full max-w-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
                 <FileImage
                   src={doc.image}
                   alt={doc.name}
                   className="max-w-full h-auto object-contain max-h-[60vh] z-10"
                   fallback={
                     <div className="flex flex-col items-center">
                       <ImageIcon className="w-16 h-16 text-slate-200 dark:text-slate-700 mb-4" />
                       <p className="text-slate-400 dark:text-slate-500 font-medium text-[15px]">No Document Image Available</p>
                     </div>
                   }
                 />
                 <div className="absolute inset-0 bg-gradient-to-tr from-slate-50/50 to-transparent pointer-events-none dark:from-slate-800/30"></div>
              </div>
            )}
          </div>


          {/* Footer / Actions */}
          <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col">
            {doc.status === 'Verified' ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-800 dark:text-emerald-400 text-[14px]">Document Verified</p>
                    {doc.rawDoc?.verifiedAt && (
                      <p className="text-emerald-600 dark:text-emerald-500/80 text-[12px]">Verified on {fmtDateTime(doc.rawDoc.verifiedAt)}</p>
                    )}
                  </div>
                </div>
                <button type="button" onClick={() => openDocument(doc.image)} disabled={!doc.image} className="px-6 py-2.5 rounded-lg border-2 border-[#1F2B6D] text-[#1F2B6D] hover:bg-slate-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-slate-800 font-bold transition-colors text-[14px] flex items-center gap-2">
                  <Download className="w-4 h-4" /> Download
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-3">
                {/* PDFs have no inline preview above, so the reviewer opens the file itself. */}
                <div className="mr-auto flex items-center gap-2">
                  {([['Open document', doc.image], ['Open back', doc.backImage]] as const)
                    .filter(([label, src]) => label === 'Open document' || src)
                    .map(([label, src]) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => openDocument(src, 'inline')}
                        disabled={!src}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 text-[#1F2B6D] bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-blue-400 dark:hover:bg-slate-800 font-bold transition-all text-[13px] flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ExternalLink className="w-4 h-4" /> {label}
                      </button>
                    ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMessage('Document is unclear')
                    setAction('reject')
                  }}
                  className="px-6 py-2.5 rounded-xl border border-rose-200 text-rose-600 bg-rose-50/70 hover:bg-rose-100/80 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-900/30 font-bold transition-all text-[13px] flex items-center gap-2 cursor-pointer shadow-2xs"
                >
                  <ThumbsDown className="w-4 h-4" /> Reject
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMessage('Document is unclear')
                    setAction('reupload')
                  }}
                  className="px-6 py-2.5 rounded-xl border border-amber-200 text-amber-600 bg-amber-50/70 hover:bg-amber-100/80 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-400 dark:hover:bg-amber-900/30 font-bold transition-all text-[13px] flex items-center gap-2 cursor-pointer shadow-2xs"
                >
                  <RefreshCw className="w-4 h-4" /> Request Re-upload
                </button>
                <button
                  type="button"
                  onClick={() => setAction('verify')}
                  className="px-7 py-2.5 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white font-bold transition-all shadow-sm text-[13px] flex items-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <CheckCircle2 className="w-4 h-4" /> Verify Document
                </button>
              </div>
            )}
          </div>

          {/* ─── Document Custom Confirmation Popup Modal ────────────────────── */}
          {action !== 'none' && (
            <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-center">
                <button
                  type="button"
                  onClick={() => setAction('none')}
                  className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* VERIFY DOCUMENT MODAL */}
                {action === 'verify' && (
                  <div>
                    <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                      <Check className="w-7 h-7 stroke-[2.5]" />
                    </div>
                    <h3 className="font-bold text-[18px] text-[#1F2B6D] dark:text-white">
                      Verify Document?
                    </h3>
                    <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                      Are you sure you want to mark this document as verified?
                    </p>

                    {/* Document Mini Card */}
                    <div className="mt-4 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 flex items-center gap-3 text-left">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-[#1F2B6D] dark:text-white text-[13px] truncate">
                          {doc.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {doc.number} • Uploaded on {doc.uploaded}
                        </p>
                      </div>
                    </div>

                    {/* Checklist */}
                    <div className="mt-3 p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 space-y-2 text-left">
                      <div className="flex items-center gap-2 text-[12px] text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Document will be marked as <strong className="text-emerald-800 dark:text-emerald-300 font-semibold">Verified</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-[12px] text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Application progress will be updated automatically</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 mt-5">
                      <button
                        type="button"
                        onClick={() => setAction('none')}
                        className="w-full py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[13px] transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={handleConfirm}
                        className="w-full py-2.5 rounded-lg bg-[#059669] hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-[13px] shadow-sm transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {isPending ? 'Verifying...' : 'Yes, Verify Document'}
                      </button>
                    </div>
                  </div>
                )}

                {/* REJECT DOCUMENT MODAL */}
                {action === 'reject' && (
                  <div>
                    <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                      <ThumbsDown className="w-7 h-7 stroke-[2]" />
                    </div>
                    <h3 className="font-bold text-[18px] text-[#1F2B6D] dark:text-white">
                      Reject Document?
                    </h3>
                    <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                      Please provide a reason for rejecting this document.
                    </p>

                    {/* Document Mini Card */}
                    <div className="mt-4 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 flex items-center gap-3 text-left">
                      <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-[#1F2B6D] dark:text-white text-[13px] truncate">
                          {doc.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {doc.number} • Uploaded on {doc.uploaded}
                        </p>
                      </div>
                    </div>

                    {/* Preset Reasons */}
                    <div className="mt-3 text-left space-y-1.5">
                      <label className="text-[11.5px] font-bold text-slate-700 dark:text-slate-300">
                        Select Rejection Reason
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {['Document is unclear', 'Document is expired', "Information doesn't match", 'Wrong document'].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setMessage(opt)}
                            className={`text-[11px] px-2.5 py-1 rounded-full border transition font-medium cursor-pointer ${
                              message === opt
                                ? 'bg-rose-600 text-white border-rose-600'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                      <textarea
                        rows={2}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Provide details for the driver..."
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 resize-none outline-none focus:ring-1 focus:ring-rose-500 dark:text-white mt-1"
                      />
                    </div>

                    {/* Warning Checklist */}
                    <div className="mt-3 p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-800/40 space-y-2 text-left">
                      <div className="flex items-center gap-2 text-[12px] text-slate-700 dark:text-slate-300">
                        <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span>Document will be marked as <strong className="text-rose-800 dark:text-rose-300 font-semibold">Rejected</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-[12px] text-slate-700 dark:text-slate-300">
                        <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span>Driver will be notified of the rejection reason</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 mt-5">
                      <button
                        type="button"
                        onClick={() => setAction('none')}
                        className="w-full py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[13px] transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={!message || isPending}
                        onClick={handleConfirm}
                        className="w-full py-2.5 rounded-lg bg-[#DC2626] hover:bg-rose-700 active:scale-[0.99] text-white font-bold text-[13px] shadow-sm transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isPending ? 'Rejecting...' : 'Yes, Reject Document'}
                      </button>
                    </div>
                  </div>
                )}

                {/* RE-UPLOAD DOCUMENT MODAL */}
                {action === 'reupload' && (
                  <div>
                    <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                      <RefreshCw className="w-7 h-7 stroke-[2]" />
                    </div>
                    <h3 className="font-bold text-[18px] text-[#1F2B6D] dark:text-white">
                      Request Document Re-upload?
                    </h3>
                    <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                      Driver will receive a request to upload a fresh copy of this document.
                    </p>

                    {/* Document Mini Card */}
                    <div className="mt-4 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 flex items-center gap-3 text-left">
                      <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-[#1F2B6D] dark:text-white text-[13px] truncate">
                          {doc.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {doc.number} • Uploaded on {doc.uploaded}
                        </p>
                      </div>
                    </div>

                    {/* Preset Reasons */}
                    <div className="mt-3 text-left space-y-1.5">
                      <label className="text-[11.5px] font-bold text-slate-700 dark:text-slate-300">
                        Select Reason
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {['Document is unclear', 'Document is expired', "Information doesn't match", 'Wrong document'].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setMessage(opt)}
                            className={`text-[11px] px-2.5 py-1 rounded-full border transition font-medium cursor-pointer ${
                              message === opt
                                ? 'bg-amber-600 text-white border-amber-600'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                      <textarea
                        rows={2}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Instructions for driver what to re-upload..."
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 resize-none outline-none focus:ring-1 focus:ring-amber-500 dark:text-white mt-1"
                      />
                    </div>

                    {/* Info Checklist */}
                    <div className="mt-3 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800/40 space-y-2 text-left">
                      <div className="flex items-center gap-2 text-[12px] text-slate-700 dark:text-slate-300">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Status will be changed to <strong className="text-amber-800 dark:text-amber-300 font-semibold">Re-upload Required</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-[12px] text-slate-700 dark:text-slate-300">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Driver will receive notification to upload replacement</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 mt-5">
                      <button
                        type="button"
                        onClick={() => setAction('none')}
                        className="w-full py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[13px] transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={!message || isPending}
                        onClick={handleConfirm}
                        className="w-full py-2.5 rounded-lg bg-[#F59E0B] hover:bg-amber-600 active:scale-[0.99] text-white font-bold text-[13px] shadow-sm transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isPending ? 'Sending Request...' : 'Send Re-upload Request'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const steps = ['Overview', 'Claim Form', 'Documents', 'Bank Details', 'Final Review', 'Decision']

  return (
    <div className="h-[calc(100vh-4.25rem)] flex flex-col overflow-hidden px-4 sm:px-6 max-w-screen-2xl mx-auto w-full">
      
      {/* ─── FIXED TOP SECTION (Stays pinned at top) ─────────────────────────── */}
      <div className="shrink-0 pt-2 pb-2.5 space-y-2.5 bg-background border-b border-slate-200/80 dark:border-slate-800 z-10">
        
        {/* ─── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/driver-management/applications')}
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[#1F2B6D] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1F2B6D] dark:text-white flex items-center gap-3">
              Driver Application Review
            </h1>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
              Review all verification details and make a final decision on this application.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 text-[12.5px]">
              <span className="text-slate-500">Application ID</span>
              <span className="font-bold text-[#1F2B6D] dark:text-[#8B93D9]">{appData.id}</span>
            </div>
            <div className="flex items-center gap-2 text-[12.5px]">
              <span className="text-slate-500">Submitted on</span>
              <span className="font-bold text-[#1F2B6D] dark:text-[#8B93D9]">{appData.submittedDate}</span>
            </div>
          </div>
          <div className={`${statusBadgeClass} border px-4 py-2 rounded-lg font-bold text-[13px] flex items-center gap-2 shadow-sm`}>
            <div className="w-4 h-4 rounded-full bg-current flex items-center justify-center text-[10px]"><span className="text-white">!</span></div>
            {appData.statusLabel}
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
      <div className="flex flex-col lg:flex-row items-center justify-between w-full py-1 gap-4">
        {/* Stepper Steps */}
        <div className="flex items-center flex-1 max-w-4xl">
          {steps.map((step, idx) => {
            const isActive = idx === activeStep;
            const isCompleted = stepDone[idx];

            return (
              <React.Fragment key={step}>
                <div
                  className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80"
                  onClick={() => {
                    setReviewedSteps((prev) => new Set([...prev, activeStep]))
                    setActiveStep(idx)
                  }}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[13px] shadow-sm transition-all ${
                      isCompleted 
                        ? isActive
                          ? 'bg-emerald-500 text-white ring-2 ring-offset-2 ring-[#1F2B6D] dark:ring-blue-400 scale-105'
                          : 'bg-emerald-500 text-white' 
                        : isActive 
                          ? 'bg-[#1F2B6D] text-white' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : (idx + 1)}
                  </div>
                  <span
                    className={`font-bold text-[13px] ${
                      isActive
                        ? 'text-[#1F2B6D] dark:text-blue-400'
                        : isCompleted
                          ? 'text-slate-700 dark:text-slate-300'
                          : 'text-slate-400'
                    }`}
                  >
                    {step}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-3 ${
                      stepDone[idx] ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* Prev / Next Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => {
              setReviewedSteps((prev) => new Set([...prev, activeStep]))
              setActiveStep(Math.max(0, activeStep - 1))
            }}
            disabled={activeStep === 0}
            className="px-4 py-2 rounded-lg border border-slate-200 text-[#1F2B6D] font-semibold text-[13px] hover:bg-slate-50 transition-colors flex items-center gap-2 bg-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>
          <button 
            onClick={() => {
              setReviewedSteps((prev) => new Set([...prev, activeStep]))
              setActiveStep(Math.min(steps.length - 1, activeStep + 1))
            }}
            disabled={activeStep === steps.length - 1}
            className="px-4 py-2 rounded-lg bg-[#1F2B6D] text-white font-semibold text-[13px] hover:bg-[#1B2A6B] transition-colors flex items-center gap-2 shadow-sm"
          >
            Next
            <ArrowRight className="w-4 h-4" />
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
              iconBgColor="bg-amber-500"
              title="Application Status"
              value={appData.statusLabel}
              valueColor="text-amber-500"
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
                onEdit={() => {
                  setReviewedSteps((prev) => new Set([...prev, activeStep]))
                  setActiveStep(1)
                }}
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
                onEdit={() => {
                  setReviewedSteps((prev) => new Set([...prev, activeStep]))
                  setActiveStep(1)
                }}
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
                    onClick={() => {
                      setReviewedSteps((prev) => new Set([...prev, activeStep]))
                      setActiveStep(2)
                    }} 
                    className="w-full mt-4 py-2 rounded-lg border border-slate-200 text-[#1F2B6D] font-bold text-[13px] hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                  >
                    View All Documents
                  </button>
                </div>
              </div>
            </div>
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
                <button className="text-blue-600 hover:text-blue-700 text-[12px] font-semibold flex items-center gap-1">
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
                <div className="shrink-0 flex flex-col items-center gap-3 bg-emerald-50/50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                  <div className="w-24 h-24 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700">
                    <FileImage src={data.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" fallback={<User className="w-8 h-8 text-slate-400" />} />
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-3 py-1.5 rounded-full text-[12px] font-bold shadow-sm border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Profile Photo<br/><span className="text-emerald-500 dark:text-emerald-500 font-medium text-[10px] leading-tight block">{data.profilePhotoUrl ? 'Uploaded' : 'Not uploaded'}</span></span>
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
                <button className="text-blue-600 hover:text-blue-700 text-[12px] font-semibold flex items-center gap-1">
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-8 text-[13px]">
                <div className="flex flex-col gap-2">
                  <span className="text-slate-500 mb-0.5">Current Address</span>
                  <p className="font-semibold text-[#1F2B6D] dark:text-slate-200 leading-relaxed max-w-sm">
                    {appData.address.split(', ').slice(0, 2).join(', ')}<br/>
                    {appData.address.split(', ').slice(2).join(', ')}
                  </p>
                  <div className="mt-2 self-start bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30 px-3 py-1.5 rounded flex items-center gap-2 font-bold text-[11.5px]">
                    <Home className="w-3.5 h-3.5" /> Current Address
                  </div>
                </div>
                <div className="flex flex-col gap-2 relative">
                  {/* Decorative divider for desktop */}
                  <div className="hidden md:block absolute -left-4 top-2 bottom-2 w-px bg-slate-100 dark:bg-slate-800"></div>
                  <span className="text-slate-500 mb-0.5">Permanent Address</span>
                  <p className="font-semibold text-[#1F2B6D] dark:text-slate-200 leading-relaxed max-w-sm">
                    {appData.address.split(', ').slice(0, 2).join(', ')}<br/>
                    {appData.address.split(', ').slice(2).join(', ')}
                  </p>
                  <div className="mt-2 self-start bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30 px-3 py-1.5 rounded flex items-center gap-2 font-bold text-[11.5px]">
                    <MapPin className="w-3.5 h-3.5" /> Same as Current Address
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
                <button className="text-blue-600 hover:text-blue-700 text-[12px] font-semibold flex items-center gap-1">
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
                {appData.bankPayoutEnabled && (
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Payout Enabled
                  </span>
                )}
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
                <button className="text-blue-600 hover:text-blue-700 text-[12px] font-semibold flex items-center gap-1">
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
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{capitalize(data.onlineStatus)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Completed Trips</p>
                    <p className="font-semibold text-[#1F2B6D] dark:text-slate-200">{data.totalTrips ?? 0}</p>
                  </div>
                </div>
              </div>
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
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      <DocumentPreviewModal 
        doc={selectedDocument} 
        onClose={() => setSelectedDocument(null)} 
      />

      {/* ─── Step 3: Bank Details ────────────────────────────────────────── */}
      {activeStep === 3 && (
        <div className="space-y-4 max-w-6xl mx-auto py-1">
          {/* Top KPI Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <ReviewSummaryCard
              icon={<Building2 className="w-5 h-5 text-white" />}
              iconBgColor="bg-[#1F2B6D]"
              title="Settlement Bank"
              value={appData.bankName !== '—' ? appData.bankName : 'Not Provided'}
              subtitle={appData.bankIfsc !== '—' ? `IFSC: ${appData.bankIfsc}` : 'IFSC code pending'}
              valueColor="text-[#1F2B6D] dark:text-white"
            />
            <ReviewSummaryCard
              icon={<CheckCircle2 className="w-5 h-5 text-white" />}
              iconBgColor={appData.bankPayoutEnabled || appData.bankStatus === 'ACTIVE' || appData.bankStatus === 'VERIFIED' ? 'bg-[#1F2B6D]' : 'bg-amber-600'}
              title="Payout Status"
              value={appData.bankPayoutEnabled || appData.bankStatus === 'ACTIVE' || appData.bankStatus === 'VERIFIED' ? 'Active for Payouts' : appData.bankStatus || (appData.bankName !== '—' ? 'Under Review' : 'Pending')}
              subtitle={appData.bankPayoutEnabled ? 'Auto-settlement enabled' : 'Verification pending approval'}
              valueColor={appData.bankPayoutEnabled || appData.bankStatus === 'ACTIVE' ? 'text-[#1F2B6D] dark:text-white' : 'text-amber-600 dark:text-amber-400'}
            />
            <ReviewSummaryCard
              icon={<User className="w-5 h-5 text-white" />}
              iconBgColor="bg-[#1F2B6D]"
              title="Name Verification"
              value={
                appData.bankAccountName !== '—'
                  ? appData.name.toLowerCase().includes(appData.bankAccountName.toLowerCase().split(' ')[0])
                    ? 'Name Matched'
                    : 'Check Required'
                  : 'No Account Name'
              }
              subtitle={appData.bankAccountName !== '—' ? `Holder: ${appData.bankAccountName}` : 'Account holder not entered'}
              valueColor={
                appData.bankAccountName !== '—' && appData.name.toLowerCase().includes(appData.bankAccountName.toLowerCase().split(' ')[0])
                  ? 'text-[#1F2B6D] dark:text-white'
                  : 'text-amber-600 dark:text-amber-400'
              }
            />
            <ReviewSummaryCard
              icon={<ShieldCheck className="w-5 h-5 text-white" />}
              iconBgColor="bg-[#1F2B6D]"
              title="Vault Security"
              value="AES-256 GCM"
              subtitle="End-to-end encrypted storage"
              valueColor="text-[#1F2B6D] dark:text-white"
            />
          </div>

          {/* Main 2-Column Review Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column (5 cols): Virtual Debit Card & Quick Copy */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center shadow-2xs">
                      <CreditCard className="w-3.5 h-3.5 text-white" />
                    </div>
                    <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px]">
                      Payout Card Preview
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" /> IMPS / RTGS
                  </span>
                </div>

                {/* Virtual Card Graphic */}
                <div className="relative rounded-2xl p-5 bg-gradient-to-br from-[#1F2B6D] via-[#16215B] to-[#0D153A] text-white shadow-lg overflow-hidden border border-white/10">
                  <div className="absolute top-0 right-0 w-36 h-36 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-[14px] font-bold tracking-wide text-white truncate max-w-[200px]">
                        {appData.bankName !== '—' ? appData.bankName : 'Settlement Bank'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono tracking-widest px-2 py-0.5 rounded bg-white/10 text-slate-200 border border-white/10">
                      DIRECT PAYOUT
                    </span>
                  </div>

                  {/* EMV Chip visual */}
                  <div className="w-10 h-7 rounded bg-amber-400/90 border border-amber-300/50 mb-3 flex items-center justify-center shadow-inner">
                    <div className="w-6 h-4 border border-amber-600/40 rounded-sm opacity-60" />
                  </div>

                  <div className="font-mono text-[18px] sm:text-[20px] font-bold tracking-widest text-slate-100 my-2">
                    {appData.bankAccountNumber !== '—' ? appData.bankAccountNumber : '•••• •••• •••• ••••'}
                  </div>

                  <div className="flex items-end justify-between mt-4 pt-2 border-t border-white/10 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[9.5px] uppercase tracking-wider">Account Holder</span>
                      <span className="font-bold text-white tracking-wide uppercase truncate max-w-[180px] block text-[12px]">
                        {appData.bankAccountName !== '—' ? appData.bankAccountName : appData.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[9.5px] uppercase tracking-wider">IFSC Code</span>
                      <span className="font-mono font-bold text-emerald-300 text-[12px]">
                        {appData.bankIfsc !== '—' ? appData.bankIfsc : '•••••••••••'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Copy Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (appData.bankAccountNumber !== '—') {
                        navigator.clipboard.writeText(appData.bankAccountNumber)
                        showSuccess('Copied', 'Bank Account Number copied')
                      }
                    }}
                    disabled={appData.bankAccountNumber === '—'}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-[11.5px] flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Account No.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (appData.bankIfsc !== '—') {
                        navigator.clipboard.writeText(appData.bankIfsc)
                        showSuccess('Copied', 'Bank IFSC Code copied')
                      }
                    }}
                    disabled={appData.bankIfsc === '—'}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-[11.5px] flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy IFSC</span>
                  </button>
                </div>
              </div>

              {/* Security & Regulatory Clearance Card */}
              <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span>RBI Settlement & Vault Compliance</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11.5px] leading-relaxed">
                  Driver earnings and trip settlements are routed directly to this verified beneficiary account. Account details are encrypted with AES-256 GCM in the bank vault.
                </p>
              </div>
            </div>

            {/* Right Column (7 cols): Full Settlement Specifications & Cross-check */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center shadow-2xs">
                      <Building2 className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[15px]">
                        Settlement Account Particulars
                      </h3>
                      <p className="text-[11.5px] text-slate-500">
                        Review beneficiary information submitted by applicant
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReviewedSteps((prev) => new Set([...prev, activeStep]))
                      setActiveStep(1)
                    }}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-[11.5px] font-semibold flex items-center gap-1 px-2.5 py-1 rounded border border-blue-200 dark:border-blue-900/40 bg-blue-50/60 hover:bg-blue-50 transition cursor-pointer"
                  >
                    <Edit className="w-3 h-3" /> Edit in Claim Form
                  </button>
                </div>

                {/* Detailed Table */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
                  <div className="p-3 rounded-lg bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 text-[11.5px] block mb-1">Bank Name</span>
                    <span className="font-bold text-[#1F2B6D] dark:text-white flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      {appData.bankName}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 text-[11.5px] block mb-1">Account Holder Name</span>
                    <span className="font-bold text-[#1F2B6D] dark:text-white uppercase">
                      {appData.bankAccountName}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 text-[11.5px] block mb-1">Account Number (Masked)</span>
                    <span className="font-mono font-bold text-[#1F2B6D] dark:text-white">
                      {appData.bankAccountNumber}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 text-[11.5px] block mb-1">IFSC Code</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                      {appData.bankIfsc}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 text-[11.5px] block mb-1">UPI ID / VPA</span>
                    <span className="font-mono font-bold text-[#1F2B6D] dark:text-white flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-blue-500" />
                      {appData.bankUpi !== '—' ? appData.bankUpi : 'Not Provided'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 text-[11.5px] block mb-1">Applicant Name Match</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {appData.name}
                      </span>
                      {appData.bankAccountName !== '—' && (
                        <span className="text-[10.5px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 stroke-[3]" /> Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Passbook / Cheque Document cross-reference if uploaded */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-[13px] text-[#1F2B6D] dark:text-white mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>Supporting Bank Documents</span>
                  </h4>
                  {rawDocs.find((d) => ['bank_statement', 'passbook', 'cheque', 'cancelled_cheque'].includes(d.docType.toLowerCase())) ? (
                    (() => {
                      const bDoc = rawDocs.find((d) => ['bank_statement', 'passbook', 'cheque', 'cancelled_cheque'].includes(d.docType.toLowerCase()))!
                      return (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-bold text-xs text-[#1F2B6D] dark:text-white">{getDocName(bDoc.docType)}</p>
                              <p className="text-[11px] text-slate-500">Uploaded on {fmtDateTime(bDoc.createdAt)}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedDocument(toReviewDoc(bDoc))}
                            className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                          >
                            Inspect Document <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )
                    })()
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-500 flex items-center justify-between">
                      <span>No separate cheque/passbook upload required (IFSC + Name verified via penny-drop protocol).</span>
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                        Auto-Cleared
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom navigation buttons */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setReviewedSteps((prev) => new Set([...prev, activeStep]))
                      setActiveStep(2)
                    }}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-[#1F2B6D] font-semibold text-[13px] hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Documents
                  </button>

                  <div className="flex items-center gap-3">
                    {appData.bankAccount && !isBankCompleted ? (
                      <button
                        type="button"
                        disabled={isVerifyingBank}
                        onClick={() => {
                          const driverId = (data as any).driverId || (data as any).id
                          const accountId = appData.bankAccount?.id
                          if (driverId && accountId) {
                            verifyBank(
                              { driverId, accountId },
                              {
                                onSuccess: () => {
                                  showSuccess('Bank Verified', 'Bank account has been verified and enabled for payouts.')
                                  refetch()
                                },
                                onError: (err: any) => {
                                  showError('Verification Failed', err?.message || 'Could not verify bank account')
                                },
                              },
                            )
                          }
                        }}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-[13px] shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {isVerifyingBank ? 'Verifying...' : 'Verify Bank Account'}
                      </button>
                    ) : isBankCompleted ? (
                      <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Bank Account Verified
                      </span>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => {
                        setReviewedSteps((prev) => new Set([...prev, activeStep]))
                        setActiveStep(4)
                      }}
                      className="px-5 py-2 rounded-lg bg-[#1F2B6D] text-white font-semibold text-[13px] hover:bg-[#1B2A6B] transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                    >
                      Proceed to Final Review
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
              onEdit={() => setActiveStep(1)}
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
              onEdit={() => setActiveStep(1)}
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
              onEdit={() => setActiveStep(3)}
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
                      <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
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
                onClick={() => setActiveStep(2)}
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
                      variant="compact"
                      onClick={() => setSelectedDocument(doc)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Step 5: Decision (Step 6 in Stepper) ──────────────────────────────── */}
      {activeStep === 5 && (
        <div className="max-w-4xl mx-auto py-2">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
            {/* Left: Driver Summary */}
            <div className="md:col-span-5">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center shadow-2xs">
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                    <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px]">Driver Summary</h3>
                  </div>

                  <div className="flex items-center gap-3 py-3">
                    <div className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shadow-2xs shrink-0">
                      <FileImage src={data.profilePhotoUrl} alt={appData.name} className="w-full h-full object-cover" fallback={<User className="w-6 h-6 text-slate-400" />} />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1F2B6D] dark:text-white text-[15px]">{appData.name}</h4>
                      <p className="text-slate-500 text-[12px]">{appData.phone}</p>
                      <p className="text-slate-400 text-[11px] truncate max-w-[180px]">{appData.email}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vehicle:</span>
                    <span className="font-semibold text-[#1F2B6D] dark:text-slate-200">{appData.vehicleMake} {appData.vehicleModel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Plate Number:</span>
                    <span className="font-semibold font-mono text-[#1F2B6D] dark:text-slate-200">{appData.vehicleReg}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Documents:</span>
                    <span className={`font-bold ${allVerified ? 'text-emerald-600' : 'text-amber-600'}`}>{verifiedTotal} / {totalDocs} Verified</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Application Decision Card (exact card as designed in mockup) */}
            <div className="md:col-span-7">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-7 h-7 rounded-full bg-[#1F2B6D] text-white flex items-center justify-center shadow-2xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-white" />
                    </div>
                    <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[15px]">Application Decision</h3>
                  </div>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-2">
                    Choose the final action for this application. The driver will be notified automatically.
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  {/* Button 1: Approve Application */}
                  <button
                    onClick={() => {
                      setDecisionReason('')
                      setDecisionModal('approve')
                    }}
                    // The server refuses too; this keeps the operator from asking.
                    disabled={approveBlockedReason !== null}
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-[#10B981] hover:bg-[#059669] active:scale-[0.99] text-white transition shadow-sm group cursor-pointer text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#10B981] disabled:active:scale-100"
                  >
                    <div className="flex items-center gap-2 font-bold text-[13.5px] text-white shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Approve Application</span>
                    </div>
                    <span className="text-[11px] text-emerald-50 text-right max-w-[200px] leading-tight font-medium">
                      {approveBlockedReason ?? 'Application will be verified and driver can access the app.'}
                    </span>
                  </button>

                  {/* Button 2: Request Re-submission */}
                  <button
                    onClick={() => {
                      setDecisionReason('')
                      setDecisionModal('reupload')
                    }}
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] active:scale-[0.99] text-white transition shadow-sm group cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2 font-bold text-[13.5px] text-white shrink-0">
                      <RefreshCw className="w-4 h-4 text-white" />
                      <span>Request Re-submission</span>
                    </div>
                    <span className="text-[11px] text-amber-50 text-right max-w-[200px] leading-tight font-medium">
                      Driver will be asked to re-upload specific information/documents.
                    </span>
                  </button>

                  {/* Button 3: Reject Application */}
                  <button
                    onClick={() => {
                      setDecisionReason('')
                      setDecisionModal('reject')
                    }}
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-[#FEE2E2] hover:bg-[#FECDD3] border border-[#FECDD3] dark:bg-rose-950/30 dark:border-rose-900/40 active:scale-[0.99] transition shadow-2xs group cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2 font-bold text-[13.5px] text-[#DC2626] dark:text-rose-400 shrink-0">
                      <ThumbsDown className="w-4 h-4 text-[#DC2626] dark:text-rose-400" />
                      <span>Reject Application</span>
                    </div>
                    <span className="text-[11px] text-[#DC2626]/80 dark:text-rose-400/80 text-right max-w-[200px] leading-tight font-medium">
                      Application will be rejected with a reason.
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>

      {/* ─── Decision Custom Confirmation Popup Modal ────────────────────── */}
      {decisionModal !== 'none' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
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

    </div>
  )
}

export default ApplicationReviewPage
