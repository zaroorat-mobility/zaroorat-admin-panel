import { isPdfUrl, resolveFileRef } from '@/shared/utils/file-ref'
import type { DriverApplicationDetails, DriverKycDocument } from '../types'

/** Cards with details on both faces; the backend keys document types in upper case. */
export const TWO_SIDED_DOC_TYPES = new Set([
  'driving_license',
  'aadhaar',
  'rc',
  'vehicle_photos',
  'vehicle_photo',
])

export const APPLICATION_REVIEW_STEPS = [
  'Overview',
  'Claim Form',
  'Documents',
  'Bank Details',
  'Final Review',
  'Decision',
] as const

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  pending_review: 'Pending Review',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  resubmission_required: 'Resubmission Required',
}

export interface ReviewDocumentItem {
  id: string
  name: string
  number: string
  issueDate: string
  expiryDate: string
  isExpired: boolean
  uploaded: string
  status: string
  image: string
  backImage: string
  twoSided: boolean
  isPdf: boolean
  contentType?: string
  rawDoc: DriverKycDocument
}

const DOC_DISPLAY_NAME_MAP: Record<string, string> = {
  license: 'Driving License',
  driving_license: 'Driving License',
  'driving-license': 'Driving License',
  driver_license: 'Driving License',
  'driver-license': 'Driving License',
  license_front: 'Driving License Front',
  license_back: 'Driving License Back',
  driving_license_front: 'Driving License Front',
  driving_license_back: 'Driving License Back',
  aadhaar: 'Aadhaar Card',
  aadhar: 'Aadhaar Card',
  aadhaar_card: 'Aadhaar Card',
  aadhaar_front: 'Aadhaar Card Front',
  aadhaar_back: 'Aadhaar Card Back',
  pan: 'PAN Card',
  pan_card: 'PAN Card',
  passport: 'Passport',
  voter: 'Voter ID',
  voter_id: 'Voter ID',
  rc: 'RC Certificate',
  rc_certificate: 'RC Certificate',
  rc_front: 'RC Certificate Front',
  rc_back: 'RC Certificate Back',
  registration: 'RC Certificate',
  vehicle_rc: 'RC Certificate',
  insurance: 'Vehicle Insurance',
  vehicle_insurance: 'Vehicle Insurance',
  insurance_policy: 'Vehicle Insurance',
  permit: 'Commercial Permit',
  commercial_permit: 'Commercial Permit',
  photo: 'Profile Photo',
  profile_photo: 'Profile Photo',
  selfie: 'Selfie Photo',
  pollution: 'PUC Certificate',
  puc: 'PUC Certificate',
  puc_certificate: 'PUC Certificate',
  fitness: 'Fitness Certificate',
  fitness_certificate: 'Fitness Certificate',
  vehicle_photos: 'Vehicle Photos',
  vehicle_photo: 'Vehicle Photos',
  bank_statement: 'Bank Statement',
  passbook: 'Bank Passbook',
  cheque: 'Cancelled Cheque',
  cancelled_cheque: 'Cancelled Cheque',
}

export function getDocDisplayName(type: string): string {
  if (!type) return 'Document'
  const key = type.toLowerCase().trim()
  if (DOC_DISPLAY_NAME_MAP[key]) return DOC_DISPLAY_NAME_MAP[key]
  return key.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function getDocStatusLabel(status: string): string {
  switch (status) {
    case 'approved':
      return 'Verified'
    case 'pending':
      return 'Pending Review'
    case 'reupload_requested':
      return 'Re-upload Required'
    case 'rejected':
      return 'Rejected'
    default:
      return 'Not Uploaded'
  }
}

export function isVehicleDocType(docType = ''): boolean {
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

export function fmtReviewDateTime(iso?: string): string {
  const d = iso ? new Date(iso) : null
  return d && !isNaN(d.getTime())
    ? d.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'
}

export function fmtReviewDate(iso?: string): string {
  const d = iso ? new Date(iso) : null
  return d && !isNaN(d.getTime())
    ? d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—'
}

export function computeAgeFromDob(iso?: string): string {
  const d = iso ? new Date(iso) : null
  if (!d || isNaN(d.getTime())) return '—'
  const now = new Date()
  const beforeBirthday =
    now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())
  return String(now.getFullYear() - d.getFullYear() - (beforeBirthday ? 1 : 0))
}

export function capitalizeLabel(v?: string): string {
  return v ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : '—'
}

export function isDocumentExpired(iso?: string): boolean {
  if (!iso) return false
  const expiry = new Date(iso)
  if (isNaN(expiry.getTime())) return false
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  return expiry.getTime() < startOfToday.getTime()
}

export function mapKycDocumentToReviewDoc(d: DriverKycDocument): ReviewDocumentItem {
  const isDocPdf = Boolean(
    d.isPdf || d.contentType === 'application/pdf' || (d.fileUrl && isPdfUrl(d.fileUrl)),
  )
  return {
    id: d.id,
    name: getDocDisplayName(d.docType),
    number: d.docNumber || '—',
    issueDate: fmtReviewDate(d.issuedDate),
    expiryDate: fmtReviewDate(d.expiryDate),
    isExpired: isDocumentExpired(d.expiryDate),
    uploaded: fmtReviewDateTime(d.createdAt),
    status: getDocStatusLabel(d.verifyStatus),
    image: resolveFileRef(d.fileUrl, d.fileId),
    backImage: d.backFileId ?? '',
    twoSided: !isDocPdf && TWO_SIDED_DOC_TYPES.has(d.docType.toLowerCase()),
    isPdf: isDocPdf,
    contentType: d.contentType,
    rawDoc: d,
  }
}

export type BankNameMatchLevel = 'exact' | 'partial' | 'mismatch' | 'missing'

export interface BankNameMatchResult {
  level: BankNameMatchLevel
  label: string
}

function normalizeNameTokens(raw: string): string[] {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 0)
}

/**
 * Compares the driver's profile name against the submitted bank account holder name
 * using normalized token matching — never hardcoding "Verified".
 */
export function evaluateBankNameMatch(
  applicantName: string,
  accountHolderName: string,
): BankNameMatchResult {
  if (!accountHolderName || accountHolderName === '—' || !accountHolderName.trim()) {
    return { level: 'missing', label: 'No Account Name' }
  }
  if (!applicantName || applicantName === '—' || !applicantName.trim()) {
    return { level: 'mismatch', label: 'Check Required' }
  }

  const applicantTokens = normalizeNameTokens(applicantName)
  const holderTokens = normalizeNameTokens(accountHolderName)
  if (applicantTokens.length === 0 || holderTokens.length === 0) {
    return { level: 'mismatch', label: 'Check Required' }
  }

  const applicantSet = new Set(applicantTokens)
  const holderSet = new Set(holderTokens)

  if (
    applicantSet.size === holderSet.size &&
    [...applicantSet].every((token) => holderSet.has(token))
  ) {
    return { level: 'exact', label: 'Exact Match' }
  }

  const matchingTokens = holderTokens.filter(
    (token) =>
      applicantSet.has(token) ||
      applicantTokens.some(
        (at) => (token.length === 1 && at.startsWith(token)) || (at.length === 1 && token.startsWith(at)),
      ),
  )

  if (matchingTokens.length > 0 && matchingTokens.length >= Math.min(applicantTokens.length, holderTokens.length)) {
    return { level: 'partial', label: 'Partial Match' }
  }

  return { level: 'mismatch', label: 'Mismatch — Check Required' }
}

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim() !== '' && value.trim() !== '—'
}

export interface ReviewStepStates {
  hasOverview: boolean
  hasClaimForm: boolean
  hasBankDetails: boolean
  isBankVerified: boolean
  stepDone: [boolean, boolean, boolean, boolean, boolean, boolean]
}

/**
 * Dynamic completion state for all 6 Driver Application Review steps.
 * - In progress: A step shows the green checkmark [✓] when the reviewer advances past it (idx < activeStep).
 * - Navigating back: If the reviewer goes back, ticks on the current and forward steps are removed.
 * - Approved: Once the application is approved in DB, all steps display the green checkmark [✓].
 */
export function computeReviewStepStates(
  data: DriverApplicationDetails,
  _allDocumentsVerified = false,
  activeStep = 0,
): ReviewStepStates {
  const record = data as Omit<DriverApplicationDetails, 'bankAccounts'> & {
    emergencyContacts?: Array<{ contactName?: string; phoneNumber?: string }>
    bankAccounts?: Array<{
      bankName?: string
      bankAccountName?: string
      accountHolderName?: string
      bankIfsc?: string
      ifscCode?: string
      accountNumberLast4?: string
      accountNumberMasked?: string | null
      payoutEnabled?: boolean
      status?: string
      verificationStatus?: string
    }>
  }

  const hasOverview = Boolean(
    hasText(data.driverName) &&
      (hasText(data.mobileNumber) || hasText(data.email) || hasText(data.city)),
  )

  const hasClaimForm = Boolean(
    hasText(data.addressLine1) ||
      hasText(data.emergencyContactNumber) ||
      hasText(data.emergencyContactName) ||
      (Array.isArray(record.emergencyContacts) && record.emergencyContacts.length > 0) ||
      hasText(data.vehicle?.registrationPlate) ||
      hasText(data.vehicleType),
  )

  const primaryBank = Array.isArray(record.bankAccounts) ? record.bankAccounts[0] : undefined
  const hasBankDetails = Boolean(
    (Array.isArray(record.bankAccounts) &&
      record.bankAccounts.some(
        (a) =>
          hasText(a.bankName) ||
          hasText(a.bankAccountName) ||
          hasText(a.accountHolderName) ||
          hasText(a.bankIfsc) ||
          hasText(a.ifscCode) ||
          hasText(a.accountNumberLast4) ||
          hasText(a.accountNumberMasked),
      )) ||
      hasText(data.bankAccountNumber) ||
      hasText(data.bankName),
  )

  const isApproved = data.applicationStatus === 'approved'
  const isRejected = data.applicationStatus === 'rejected'

  const bankStatus = (primaryBank?.status || primaryBank?.verificationStatus || '').toUpperCase()
  const isBankVerified = Boolean(
    hasBankDetails &&
      (Boolean(primaryBank?.payoutEnabled) ||
        bankStatus === 'ACTIVE' ||
        bankStatus === 'VERIFIED' ||
        bankStatus === 'PAYOUT_ENABLED'),
  )

  // 1. Overview: completed with [✓] when reviewer advances past Overview (or app approved)
  const isOverviewCompleted = Boolean(isApproved || activeStep > 0)
  // 2. Claim Form: completed with [✓] when reviewer advances past Claim Form (or app approved)
  const isClaimFormCompleted = Boolean(isApproved || activeStep > 1)
  // 3. Documents: completed with [✓] when reviewer advances past Documents (or app approved)
  const isDocumentsCompleted = Boolean(isApproved || activeStep > 2)
  // 4. Bank Details: completed with [✓] when reviewer advances past Bank Details (or app approved)
  const isBankCompleted = Boolean(isApproved || activeStep > 3)
  // 5. Final Review: completed with [✓] when reviewer advances to Decision (or app approved)
  const isFinalReviewCompleted = Boolean(isApproved || activeStep > 4)
  // 6. Decision: completed with [✓] when decision is approved or rejected
  const isDecisionCompleted = Boolean(isApproved || isRejected)

  return {
    hasOverview,
    hasClaimForm,
    hasBankDetails,
    isBankVerified,
    stepDone: [
      isOverviewCompleted,
      isClaimFormCompleted,
      isDocumentsCompleted,
      isBankCompleted,
      isFinalReviewCompleted,
      isDecisionCompleted,
    ],
  }
}

const INDIAN_IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/

export interface BankDetailsValidationResult {
  isValid: boolean
  isIfscValid: boolean
  issues: string[]
}

export function formatBankStatusLabel(status?: string | null, payoutEnabled?: boolean): string {
  if (payoutEnabled) return 'Active for Payouts'
  const normalized = (status ?? '').trim().toUpperCase()
  switch (normalized) {
    case 'PAYOUT_ENABLED':
    case 'ACTIVE':
      return 'Active for Payouts'
    case 'VERIFIED':
      return 'Verified'
    case 'ENTERED':
    case 'PROVISIONED':
    case 'PENDING':
      return 'Pending Verification'
    case 'REJECTED':
      return 'Rejected'
    case 'DEACTIVATED':
      return 'Deactivated'
    default:
      return 'Not Provided'
  }
}

export function formatMaskedAccountNumber(raw?: string | null): string {
  if (!raw || raw === '—') return '—'
  const trimmed = raw.trim()
  const digits = trimmed.replace(/[^0-9]/g, '')
  if (digits.length >= 4 && /[*•]/.test(trimmed)) {
    return `•••• •••• •••• ${digits.slice(-4)}`
  }
  return trimmed
}

export function validateBankAccountDetails(params: {
  bankName: string
  accountHolderName: string
  accountNumber: string
  ifscCode: string
}): BankDetailsValidationResult {
  const issues: string[] = []
  const bankName = params.bankName.trim()
  const holder = params.accountHolderName.trim()
  const ifsc = params.ifscCode.trim().toUpperCase()
  const acct = params.accountNumber.trim()

  if (!bankName || bankName === '—' || bankName.toLowerCase() === 'bank') {
    issues.push('Bank name is missing or placeholder ("Bank").')
  }
  if (!holder || holder === '—' || holder.toLowerCase() === 'account holder') {
    issues.push('Account holder name is missing or placeholder.')
  }
  const isIfscValid = Boolean(
    ifsc && ifsc !== '—' && INDIAN_IFSC_REGEX.test(ifsc) && ifsc !== 'IFSC0000000',
  )
  if (!isIfscValid) {
    issues.push(
      ifsc === 'IFSC0000000'
        ? 'IFSC code is a placeholder ("IFSC0000000"). Enter a real 11-character Indian IFSC.'
        : 'IFSC code is missing or invalid (must be 11 characters, e.g. HDFC0001234).',
    )
  }
  if (!acct || acct === '—' || /^\*+0000$/.test(acct) || /^•+\s*0000$/.test(acct)) {
    issues.push('Account number appears to be missing or a placeholder (ending in 0000).')
  }

  return {
    isValid: issues.length === 0,
    isIfscValid,
    issues,
  }
}
