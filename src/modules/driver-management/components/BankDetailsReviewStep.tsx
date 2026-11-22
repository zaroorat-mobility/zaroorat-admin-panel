import React, { useEffect, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Ban,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Edit,
  FileText,
  Lock,
  ShieldCheck,
  Smartphone,
  ThumbsDown,
  User,
  Wallet,
  X,
  XCircle,
} from 'lucide-react'
import { useToast } from '@/shared/context/toast'
import {
  useDisableDriverBankPayouts,
  useEnableDriverBankPayouts,
  useRejectDriverBankAccount,
  useVerifyDriverBankAccount,
} from '../hooks'
import type { DriverKycDocument } from '../types'
import {
  evaluateBankNameMatch,
  fmtReviewDateTime,
  formatBankStatusLabel,
  formatMaskedAccountNumber,
  getDocDisplayName,
  mapKycDocumentToReviewDoc,
  validateBankAccountDetails,
  type ReviewDocumentItem,
} from '../utils/application-review.utils'
import { ReviewSummaryCard } from './ReviewSummaryCard'

export interface BankDetailsReviewStepProps {
  driverId: string
  applicantName: string
  bankAccount: {
    id?: string
    bankName?: string
    bankAccountName?: string
    accountHolderName?: string
    bankIfsc?: string
    ifscCode?: string
    accountNumberMasked?: string | null
    upiId?: string
    status?: string
    verificationStatus?: string
    payoutEnabled?: boolean
  } | null
  bankName: string
  bankAccountName: string
  bankAccountNumber: string
  bankIfsc: string
  bankUpi: string
  bankStatus: string | null
  bankPayoutEnabled: boolean
  hasBankDetails: boolean
  isBankCompleted: boolean
  rawDocs: DriverKycDocument[]
  onEditBank: () => void
  onSelectDocument: (doc: ReviewDocumentItem) => void
  onRefresh: () => void
  onBack?: () => void
  onProceed?: () => void
}

const BANK_REJECT_REASONS = [
  'Invalid or placeholder IFSC code',
  'Account holder name does not match KYC',
  'Incorrect account number',
  'Bank statement / passbook mismatch',
] as const

export const BankDetailsReviewStep: React.FC<BankDetailsReviewStepProps> = ({
  driverId,
  applicantName,
  bankAccount,
  bankName,
  bankAccountName,
  bankAccountNumber,
  bankIfsc,
  bankUpi,
  bankStatus,
  bankPayoutEnabled,
  hasBankDetails,
  isBankCompleted,
  rawDocs,
  onEditBank,
  onSelectDocument,
  onRefresh,
  onBack,
  onProceed,
}) => {
  const { success: showSuccess, error: showError } = useToast()
  const { mutate: verifyBank, isPending: isVerifying } = useVerifyDriverBankAccount()
  const { mutate: rejectBank, isPending: isRejecting } = useRejectDriverBankAccount()
  const { mutate: enablePayouts, isPending: isEnablingPayouts } = useEnableDriverBankPayouts()
  const { mutate: disablePayouts, isPending: isDisablingPayouts } = useDisableDriverBankPayouts()

  const [reasonModal, setReasonModal] = useState<'none' | 'reject' | 'disable'>('none')
  const [confirmModal, setConfirmModal] = useState<'none' | 'verify' | 'enable_payouts'>('none')
  const [reasonText, setReasonText] = useState('')

  useEffect(() => {
    if (reasonModal === 'none' && confirmModal === 'none') return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setReasonModal('none')
        setConfirmModal('none')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [reasonModal, confirmModal])

  const normalizedStatus = (bankStatus ?? '').trim().toUpperCase()
  const isRejected = normalizedStatus === 'REJECTED'
  const isPayoutActive = bankPayoutEnabled || normalizedStatus === 'PAYOUT_ENABLED'
  const canVerify =
    Boolean(bankAccount?.id) &&
    !isBankCompleted &&
    !isRejected &&
    (normalizedStatus === '' || normalizedStatus === 'ENTERED' || normalizedStatus === 'PROVISIONED')
  const canReject =
    Boolean(bankAccount?.id) &&
    (normalizedStatus === '' ||
      normalizedStatus === 'ENTERED' ||
      normalizedStatus === 'PROVISIONED' ||
      normalizedStatus === 'VERIFIED')
  const canEnablePayouts = Boolean(bankAccount?.id) && normalizedStatus === 'VERIFIED' && !isPayoutActive
  const canDisablePayouts = Boolean(bankAccount?.id) && isPayoutActive

  const statusLabel = formatBankStatusLabel(bankStatus, bankPayoutEnabled)
  const formattedAccountNumber = formatMaskedAccountNumber(bankAccountNumber)
  const bankNameMatch = evaluateBankNameMatch(applicantName, bankAccountName)
  const validation = validateBankAccountDetails({
    bankName,
    accountHolderName: bankAccountName,
    accountNumber: bankAccountNumber,
    ifscCode: bankIfsc,
  })

  const supportingDoc = rawDocs.find((d) =>
    ['bank_statement', 'passbook', 'cheque', 'cancelled_cheque'].includes(d.docType.toLowerCase()),
  )

  const handleCopy = (value: string, label: string) => {
    if (!value || value === '—') return
    navigator.clipboard.writeText(value)
    showSuccess('Copied', `${label} copied to clipboard`)
  }

  const handleVerify = () => {
    if (!driverId || !bankAccount?.id) return
    verifyBank(
      { driverId, accountId: bankAccount.id },
      {
        onSuccess: () => {
          showSuccess('Bank Account Verified', 'Beneficiary bank details have been verified.')
          setConfirmModal('none')
          onRefresh()
        },
        onError: (err: unknown) => {
          showError(
            'Verification Failed',
            err instanceof Error ? err.message : 'Could not verify bank account',
          )
        },
      },
    )
  }

  const handleEnablePayouts = () => {
    if (!driverId || !bankAccount?.id) return
    enablePayouts(
      { driverId, accountId: bankAccount.id },
      {
        onSuccess: () => {
          showSuccess('Payouts Enabled', 'Driver settlements can now be routed to this bank account.')
          setConfirmModal('none')
          onRefresh()
        },
        onError: (err: unknown) => {
          showError(
            'Enable Payouts Failed',
            err instanceof Error ? err.message : 'Could not enable payouts',
          )
        },
      },
    )
  }

  const handleConfirmReasonAction = () => {
    if (!driverId || !bankAccount?.id || !reasonText.trim()) return
    const trimmed = reasonText.trim()
    if (reasonModal === 'reject') {
      rejectBank(
        { driverId, accountId: bankAccount.id, reason: trimmed },
        {
          onSuccess: () => {
            showSuccess('Bank Account Rejected', 'Bank details marked as rejected.')
            setReasonModal('none')
            setReasonText('')
            onRefresh()
          },
          onError: (err: unknown) => {
            showError(
              'Rejection Failed',
              err instanceof Error ? err.message : 'Could not reject bank account',
            )
          },
        },
      )
    } else if (reasonModal === 'disable') {
      disablePayouts(
        { driverId, accountId: bankAccount.id, reason: trimmed },
        {
          onSuccess: () => {
            showSuccess('Payouts Disabled', 'Automated payouts have been paused for this account.')
            setReasonModal('none')
            setReasonText('')
            onRefresh()
          },
          onError: (err: unknown) => {
            showError(
              'Action Failed',
              err instanceof Error ? err.message : 'Could not disable payouts',
            )
          },
        },
      )
    }
  }

  return (
    <div className="space-y-4 w-full">
      {/* ─── 1. Top 4 KPI Cards (Full Width, matching Overview & Final Review) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <ReviewSummaryCard
          icon={<Building2 className="w-5 h-5 text-white" />}
          iconBgColor={hasBankDetails && validation.isIfscValid ? 'bg-[#1F2B6D]' : 'bg-amber-500'}
          title="Settlement Bank"
          value={bankName !== '—' ? bankName : 'Not Provided'}
          subtitle={bankIfsc !== '—' ? `IFSC: ${bankIfsc}` : 'IFSC code pending'}
          valueColor={
            bankName === '—' || bankName.toLowerCase() === 'bank'
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-[#1F2B6D] dark:text-white'
          }
        />

        <ReviewSummaryCard
          icon={
            isPayoutActive || isBankCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-white" />
            ) : isRejected ? (
              <XCircle className="w-5 h-5 text-white" />
            ) : (
              <Clock className="w-5 h-5 text-white" />
            )
          }
          iconBgColor={
            isPayoutActive || isBankCompleted
              ? 'bg-emerald-600'
              : isRejected
                ? 'bg-rose-600'
                : 'bg-amber-500'
          }
          title="Verification & Payout"
          value={statusLabel}
          subtitle={
            isPayoutActive
              ? 'Auto-settlement active'
              : isBankCompleted
                ? 'Verified · ready to enable payouts'
                : isRejected
                  ? 'Requires corrected bank details'
                  : hasBankDetails
                    ? 'Awaiting admin verification'
                    : 'No bank account submitted'
          }
          valueColor={
            isPayoutActive || isBankCompleted
              ? 'text-emerald-600 dark:text-emerald-400'
              : isRejected
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-amber-600 dark:text-amber-400'
          }
        />

        <ReviewSummaryCard
          icon={<User className="w-5 h-5 text-white" />}
          iconBgColor={
            bankNameMatch.level === 'exact'
              ? 'bg-emerald-600'
              : bankNameMatch.level === 'partial'
                ? 'bg-amber-500'
                : bankNameMatch.level === 'mismatch'
                  ? 'bg-rose-600'
                  : 'bg-slate-400'
          }
          title="Name Verification"
          value={bankNameMatch.label}
          subtitle={
            bankAccountName !== '—' ? `Holder: ${bankAccountName}` : 'Account holder not entered'
          }
          valueColor={
            bankNameMatch.level === 'exact'
              ? 'text-emerald-600 dark:text-emerald-400'
              : bankNameMatch.level === 'mismatch'
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-amber-600 dark:text-amber-400'
          }
        />

        <ReviewSummaryCard
          icon={<ShieldCheck className="w-5 h-5 text-white" />}
          iconBgColor={hasBankDetails ? 'bg-[#1F2B6D]' : 'bg-slate-400'}
          title="Vault Security"
          value={hasBankDetails ? 'AES-256-GCM' : 'Not Configured'}
          subtitle={hasBankDetails ? 'Masked & encrypted storage' : 'Awaiting driver bank details'}
          valueColor={
            hasBankDetails ? 'text-[#1F2B6D] dark:text-white' : 'text-slate-500 dark:text-slate-400'
          }
        />
      </div>

      {/* ─── 2. Data Quality Warning Banner (when placeholder / invalid IFSC or bank data) ─── */}
      {hasBankDetails && !validation.isValid && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/90 dark:bg-amber-950/30 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-[13px] font-bold text-amber-900 dark:text-amber-200">
                Incomplete or Placeholder Bank Details Detected
              </h4>
              <ul className="mt-1 space-y-0.5 text-[12px] text-amber-800 dark:text-amber-300/90 list-disc pl-4">
                {validation.issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          </div>
          <button
            type="button"
            onClick={onEditBank}
            className="px-3.5 py-2 rounded-lg bg-[#1F2B6D] hover:bg-[#182258] text-white text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-center shadow-xs"
          >
            <Edit className="w-3.5 h-3.5" />
            Update Bank Details
          </button>
        </div>
      )}

      {/* ─── 3. Main 2-Column Executive Layout ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column (5 cols): Payout Card Preview & Compliance */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center shadow-2xs">
                  <CreditCard className="w-3.5 h-3.5 text-white" />
                </div>
                <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px]">
                  Payout Card Preview
                </h3>
              </div>
              <span
                className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                  isPayoutActive || isBankCompleted
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                    : isRejected
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                }`}
              >
                {isPayoutActive || isBankCompleted ? (
                  <Check className="w-3 h-3 stroke-[3]" />
                ) : isRejected ? (
                  <X className="w-3 h-3 stroke-[3]" />
                ) : (
                  <Clock className="w-3 h-3" />
                )}
                {statusLabel}
              </span>
            </div>

            {/* Virtual Payout Card */}
            <div className="relative rounded-2xl p-5 bg-gradient-to-br from-[#1F2B6D] via-[#16215B] to-[#0D153A] text-white shadow-md overflow-hidden border border-white/10">
              <div className="absolute -top-8 -right-8 w-40 h-40 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between gap-2 mb-5">
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                  <span className="text-[14px] font-bold tracking-wide text-white truncate">
                    {bankName !== '—' ? bankName : 'No Bank Linked'}
                  </span>
                </div>
                <span className="text-[9.5px] font-mono tracking-widest px-2 py-0.5 rounded bg-white/10 text-slate-200 border border-white/15 shrink-0">
                  IMPS · NEFT
                </span>
              </div>

              <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-300 to-amber-500 border border-amber-200/50 mb-4 flex items-center justify-center shadow-inner">
                <div className="w-6 h-4 border border-amber-700/35 rounded-xs" />
              </div>

              <div className="font-mono text-[18px] sm:text-[19px] font-bold tracking-[0.14em] text-slate-100 my-2">
                {formattedAccountNumber !== '—' ? formattedAccountNumber : '•••• •••• •••• ••••'}
              </div>

              <div className="flex items-end justify-between gap-3 mt-5 pt-3 border-t border-white/10 text-[11px]">
                <div className="min-w-0">
                  <span className="text-slate-400 block text-[9.5px] uppercase tracking-wider">
                    Account Holder
                  </span>
                  <span className="font-bold text-white tracking-wide uppercase truncate block text-[12px] mt-0.5">
                    {bankAccountName !== '—' ? bankAccountName : 'Not Provided'}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-slate-400 block text-[9.5px] uppercase tracking-wider">
                    IFSC Code
                  </span>
                  <span
                    className={`font-mono font-bold text-[12px] mt-0.5 block ${
                      validation.isIfscValid ? 'text-emerald-300' : 'text-amber-300'
                    }`}
                  >
                    {bankIfsc !== '—' ? bankIfsc : '•••••••••••'}
                  </span>
                </div>
              </div>
            </div>

            {/* Useful Card Actions */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleCopy(bankIfsc, 'Bank IFSC Code')}
                disabled={bankIfsc === '—'}
                className="py-2.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy IFSC</span>
              </button>
              <button
                type="button"
                onClick={onEditBank}
                className="py-2.5 px-3 rounded-lg border border-[#1F2B6D]/25 dark:border-blue-800 bg-[#1F2B6D]/5 dark:bg-blue-950/30 hover:bg-[#1F2B6D]/10 text-[#1F2B6D] dark:text-blue-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>{hasBankDetails ? 'Edit Bank Details' : 'Add Bank Details'}</span>
              </button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-slate-50/90 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1F2B6D] dark:text-slate-200">
              <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Settlement & Encryption Policy</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11.5px] leading-relaxed">
              Account numbers are encrypted at rest with AES-256-GCM and only displayed masked.
              Verify bank name, IFSC, and holder name before enabling driver payouts.
            </p>
          </div>
        </div>

        {/* Right Column (7 cols): Settlement Account Particulars & Verification Controls */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-5">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1F2B6D] text-white flex items-center justify-center shadow-2xs shrink-0">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[15px] leading-tight">
                    Settlement Account Particulars
                  </h3>
                  <p className="text-[11.5px] text-slate-500 mt-0.5">
                    Inspect submitted beneficiary particulars and manage payout eligibility
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onEditBank}
                className="text-[#1F2B6D] dark:text-blue-400 hover:bg-[#1F2B6D]/5 text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Details
              </button>
            </div>

            {/* Particulars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-[13px]">
              <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 text-[11px] font-medium block mb-1">Bank Name</span>
                <span className="font-bold text-[#1F2B6D] dark:text-white flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{bankName}</span>
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 text-[11px] font-medium block mb-1">
                  Account Holder Name
                </span>
                <span className="font-bold text-[#1F2B6D] dark:text-white uppercase truncate block">
                  {bankAccountName}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 text-[11px] font-medium block mb-1">
                  Account Number (Masked)
                </span>
                <span className="font-mono font-bold text-[#1F2B6D] dark:text-white">
                  {formattedAccountNumber}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 text-[11px] font-medium block mb-1">IFSC Code</span>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`font-mono font-bold uppercase ${
                      validation.isIfscValid
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {bankIfsc}
                  </span>
                  {bankIfsc !== '—' && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        validation.isIfscValid
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                          : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                      }`}
                    >
                      {validation.isIfscValid ? 'Valid Format' : 'Invalid / Placeholder'}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 text-[11px] font-medium block mb-1">
                  UPI ID / VPA
                </span>
                <span className="font-mono font-bold text-[#1F2B6D] dark:text-white flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="truncate">{bankUpi !== '—' ? bankUpi : 'Not Provided'}</span>
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 text-[11px] font-medium block mb-1">
                  Applicant Name Match
                </span>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                    {applicantName}
                  </span>
                  {bankNameMatch.level !== 'missing' && (
                    <span
                      className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                        bankNameMatch.level === 'exact'
                          ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                          : bankNameMatch.level === 'partial'
                            ? 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                            : 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      {bankNameMatch.level === 'exact' ? (
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      ) : (
                        <AlertTriangle className="w-2.5 h-2.5" />
                      )}
                      {bankNameMatch.label}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Supporting Bank Documents */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-[12.5px] text-[#1F2B6D] dark:text-white mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Supporting Bank Proof</span>
              </h4>
              {supportingDoc ? (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-[#1F2B6D] dark:text-blue-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-[#1F2B6D] dark:text-white truncate">
                        {getDocDisplayName(supportingDoc.docType)}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Uploaded on {fmtReviewDateTime(supportingDoc.createdAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectDocument(mapKycDocumentToReviewDoc(supportingDoc))}
                    className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    Inspect Document <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-500 flex items-center justify-between gap-3">
                  <span>
                    {!hasBankDetails
                      ? 'No bank account or supporting bank proof has been submitted yet.'
                      : isBankCompleted
                        ? 'No separate passbook or cancelled cheque uploaded. Settlement account is verified.'
                        : 'No separate passbook or cancelled cheque uploaded. Verify the bank name, IFSC, and holder details below.'}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
                      !hasBankDetails
                        ? 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        : isBankCompleted
                          ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                          : isRejected
                            ? 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
                            : 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {statusLabel}
                  </span>
                </div>
              )}
            </div>

            {/* Clean Single-Row Verification Action Bar (no duplicate Previous/Next buttons) */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                {!bankAccount?.id ? (
                  <span>Add real bank particulars to enable account verification.</span>
                ) : isPayoutActive ? (
                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Bank Account Verified & Active for Payouts
                  </span>
                ) : isBankCompleted ? (
                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Bank Account Verified
                  </span>
                ) : isRejected ? (
                  <span className="inline-flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
                    <XCircle className="w-4 h-4" />
                    Bank Account Rejected — edit details to re-submit
                  </span>
                ) : !validation.isValid ? (
                  <span className="text-amber-700 dark:text-amber-400 font-medium">
                    Fix placeholder/invalid bank details before verifying.
                  </span>
                ) : (
                  <span>Ready to verify beneficiary bank details.</span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5 ml-auto">
                {canReject && (
                  <button
                    type="button"
                    disabled={isRejecting}
                    onClick={() => {
                      setReasonText('')
                      setReasonModal('reject')
                    }}
                    className="px-4 py-2 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    Reject Bank Account
                  </button>
                )}

                {canVerify && (
                  <button
                    type="button"
                    disabled={isVerifying || !validation.isValid}
                    title={
                      !validation.isValid
                        ? 'Update placeholder or invalid bank details first'
                        : 'Mark this bank account as verified'
                    }
                    onClick={() => setConfirmModal('verify')}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isVerifying ? 'Verifying...' : 'Verify Bank Account'}
                  </button>
                )}

                {canEnablePayouts && (
                  <button
                    type="button"
                    disabled={isEnablingPayouts}
                    onClick={() => setConfirmModal('enable_payouts')}
                    className="px-4 py-2 rounded-lg bg-[#1F2B6D] hover:bg-[#182258] active:scale-[0.99] text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    {isEnablingPayouts ? 'Enabling...' : 'Enable Payouts'}
                  </button>
                )}

                {canDisablePayouts && (
                  <button
                    type="button"
                    disabled={isDisablingPayouts}
                    onClick={() => {
                      setReasonText('')
                      setReasonModal('disable')
                    }}
                    className="px-4 py-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    Disable Payouts
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step Navigation Footer */}
      {(onBack || onProceed) && (
        <div className="flex items-center justify-between pt-1">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[#1F2B6D] dark:text-slate-200 font-semibold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer bg-white dark:bg-slate-900 shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Documents
            </button>
          ) : <div />}

          {onProceed && (
            <button
              type="button"
              onClick={onProceed}
              className="px-5 py-2 rounded-lg bg-[#1F2B6D] hover:bg-[#182258] text-white font-bold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer shadow-sm ml-auto"
            >
              Proceed to Final Review
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* ─── Verify Bank / Enable Payouts Confirmation Modal ─────────────────── */}
      {confirmModal !== 'none' && (
        <div
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmModal('none')
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setConfirmModal('none')}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                  confirmModal === 'verify'
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                    : 'bg-[#1F2B6D]/10 text-[#1F2B6D] dark:bg-blue-950/50 dark:text-blue-400'
                }`}
              >
                {confirmModal === 'verify' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <Wallet className="w-6 h-6" />
                )}
              </div>
              <h3 className="font-bold text-lg text-[#1F2B6D] dark:text-white">
                {confirmModal === 'verify'
                  ? 'Verify Beneficiary Bank Account?'
                  : 'Enable Driver Payouts?'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {confirmModal === 'verify'
                  ? 'Confirm that the bank name, IFSC code, and account holder match the applicant.'
                  : 'Trip earnings and settlements will be eligible for payout to this verified account.'}
              </p>
            </div>

            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Bank Name</span>
                <span className="font-bold text-[#1F2B6D] dark:text-white text-right">
                  {bankName}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Account Holder</span>
                <span className="font-bold text-[#1F2B6D] dark:text-white uppercase text-right">
                  {bankAccountName}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Account Number</span>
                <span className="font-mono font-bold text-[#1F2B6D] dark:text-white">
                  {formattedAccountNumber}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">IFSC Code</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {bankIfsc}
                </span>
              </div>
              <div className="flex justify-between gap-2 pt-1 border-t border-slate-200/70 dark:border-slate-700">
                <span className="text-slate-500">Name Match</span>
                <span
                  className={`font-bold ${
                    bankNameMatch.level === 'exact'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : bankNameMatch.level === 'mismatch'
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {bankNameMatch.label}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                type="button"
                onClick={() => setConfirmModal('none')}
                className="w-full py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isVerifying || isEnablingPayouts}
                onClick={confirmModal === 'verify' ? handleVerify : handleEnablePayouts}
                className={`w-full py-2.5 rounded-lg text-white font-bold text-xs shadow-sm transition cursor-pointer disabled:opacity-50 ${
                  confirmModal === 'verify'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-[#1F2B6D] hover:bg-[#182258]'
                }`}
              >
                {confirmModal === 'verify'
                  ? isVerifying
                    ? 'Verifying...'
                    : 'Yes, Verify Account'
                  : isEnablingPayouts
                    ? 'Enabling...'
                    : 'Yes, Enable Payouts'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Reject / Disable Payouts Reason Modal ────────────────────────────── */}
      {reasonModal !== 'none' && (
        <div
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setReasonModal('none')
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setReasonModal('none')}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                  reasonModal === 'reject'
                    ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                    : 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
                }`}
              >
                {reasonModal === 'reject' ? (
                  <ThumbsDown className="w-6 h-6" />
                ) : (
                  <Ban className="w-6 h-6" />
                )}
              </div>
              <h3 className="font-bold text-lg text-[#1F2B6D] dark:text-white">
                {reasonModal === 'reject' ? 'Reject Bank Account?' : 'Disable Driver Payouts?'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {reasonModal === 'reject'
                  ? 'Provide a clear reason so the bank details can be corrected before payouts.'
                  : 'Automated payouts to this account will be paused until re-enabled.'}
              </p>
            </div>

            <div className="mt-4 space-y-2">
              {reasonModal === 'reject' && (
                <div className="flex flex-wrap gap-1.5">
                  {BANK_REJECT_REASONS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setReasonText(preset)}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition font-medium cursor-pointer ${
                        reasonText === preset
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              )}
              <textarea
                rows={3}
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder="Enter reason..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 resize-none outline-none focus:ring-1 focus:ring-[#1F2B6D] text-slate-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                type="button"
                onClick={() => setReasonModal('none')}
                className="w-full py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!reasonText.trim() || isRejecting || isDisablingPayouts}
                onClick={handleConfirmReasonAction}
                className={`w-full py-2.5 rounded-lg text-white font-bold text-xs shadow-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  reasonModal === 'reject'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {reasonModal === 'reject'
                  ? isRejecting
                    ? 'Rejecting...'
                    : 'Confirm Rejection'
                  : isDisablingPayouts
                    ? 'Disabling...'
                    : 'Disable Payouts'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
