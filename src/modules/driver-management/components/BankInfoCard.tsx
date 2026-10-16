import React from 'react'
import { Building2, CreditCard, ShieldCheck, Edit } from 'lucide-react'

export interface BankInfoCardProps {
  bankName?: string
  accountHolderName?: string
  accountNumber?: string
  ifscCode?: string
  upiId?: string
  status?: string | null
  payoutEnabled?: boolean
  onEdit?: () => void
  editLabel?: string
  className?: string
  compact?: boolean
}

export const BankInfoCard: React.FC<BankInfoCardProps> = ({
  bankName = '—',
  accountHolderName = '—',
  accountNumber = '—',
  ifscCode = '—',
  upiId = '—',
  status,
  payoutEnabled = false,
  onEdit,
  editLabel = 'Edit',
  className = '',
  compact = false,
}) => {
  const hasData =
    (bankName && bankName !== '—') ||
    (accountHolderName && accountHolderName !== '—') ||
    (accountNumber && accountNumber !== '—') ||
    (ifscCode && ifscCode !== '—') ||
    (upiId && upiId !== '—')

  // Format account number nicely (e.g. •••• •••• •••• 1234)
  const formattedAccountNumber = React.useMemo(() => {
    if (!accountNumber || accountNumber === '—') return '—'
    const clean = accountNumber.replace(/\s+/g, '')
    if (clean.length > 4 && !clean.includes('•')) {
      const last4 = clean.slice(-4)
      return `•••• •••• •••• ${last4}`
    }
    return clean
  }, [accountNumber])

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm flex flex-col justify-between h-full overflow-hidden ${className}`}
    >
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center shadow-2xs shrink-0">
              <CreditCard className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px] truncate">
              Bank & Payout Details
            </h3>
          </div>
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="px-3 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-md font-semibold text-slate-700 dark:text-slate-300 hover:border-[#1F2B6D] hover:text-[#1F2B6D] dark:hover:border-[#8B93D9] dark:hover:text-[#8B93D9] hover:bg-[#1F2B6D]/5 transition shadow-2xs cursor-pointer shrink-0 flex items-center gap-1"
            >
              <Edit className="w-3 h-3" /> {editLabel}
            </button>
          )}
        </div>

        {!hasData ? (
          <div className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs">
            <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="font-medium">No bank account details provided</p>
            <p className="text-[11px] mt-0.5">Driver has not linked a payout settlement account yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Compact Virtual Card Preview */}
            {!compact && (
              <div className="relative rounded-xl p-3 bg-gradient-to-br from-[#1F2B6D] to-[#121B47] text-white shadow-sm overflow-hidden mb-3">
                <div className="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-[12px] font-bold tracking-wide text-white truncate max-w-[150px]">
                      {bankName}
                    </span>
                  </div>
                  <span className="text-[9.5px] font-mono tracking-widest px-1.5 py-0.5 rounded bg-white/10 text-slate-200 border border-white/10 shrink-0">
                    PAYOUT
                  </span>
                </div>
                <div className="font-mono text-[13.5px] font-bold tracking-widest text-slate-100 my-1">
                  {formattedAccountNumber}
                </div>
                <div className="flex items-end justify-between mt-1.5 pt-1 border-t border-white/10 text-[10px]">
                  <div className="min-w-0 max-w-[60%]">
                    <span className="text-slate-400 block text-[8.5px] uppercase tracking-wider">Account Holder</span>
                    <span className="font-bold text-white tracking-wide uppercase truncate block">
                      {accountHolderName}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-slate-400 block text-[8.5px] uppercase tracking-wider">IFSC</span>
                    <span className="font-mono font-bold text-emerald-300">
                      {ifscCode}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Key-Value Details List */}
            <div className="space-y-1.5 text-[12px]">
              <div className="flex items-baseline justify-between gap-2 py-0.5 border-b border-slate-100/70 dark:border-slate-800/50">
                <span className="text-slate-500 dark:text-slate-400 shrink-0">Bank Name</span>
                <span className="font-semibold text-[#1F2B6D] dark:text-slate-200 text-right truncate max-w-[65%]">
                  {bankName}
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-2 py-0.5 border-b border-slate-100/70 dark:border-slate-800/50">
                <span className="text-slate-500 dark:text-slate-400 shrink-0">Account Holder</span>
                <span className="font-semibold text-[#1F2B6D] dark:text-slate-200 uppercase text-right truncate max-w-[65%]">
                  {accountHolderName}
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-2 py-0.5 border-b border-slate-100/70 dark:border-slate-800/50">
                <span className="text-slate-500 dark:text-slate-400 shrink-0">Account Number</span>
                <span className="font-mono font-semibold text-[#1F2B6D] dark:text-slate-200 text-right">
                  {formattedAccountNumber}
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-2 py-0.5 border-b border-slate-100/70 dark:border-slate-800/50">
                <span className="text-slate-500 dark:text-slate-400 shrink-0">IFSC Code</span>
                <span className="font-mono font-bold text-[#1F2B6D] dark:text-slate-200 uppercase text-right">
                  {ifscCode}
                </span>
              </div>

              {upiId && upiId !== '—' && (
                <div className="flex items-baseline justify-between gap-2 py-0.5 border-b border-slate-100/70 dark:border-slate-800/50">
                  <span className="text-slate-500 dark:text-slate-400 shrink-0">UPI Address</span>
                  <span className="font-mono font-semibold text-[#1F2B6D] dark:text-slate-200 text-right truncate max-w-[65%]">
                    {upiId}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Security Badge */}
      {hasData && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">256-bit Encrypted Settlement</span>
          </div>
          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40 shrink-0">
            {payoutEnabled ? 'PAYOUT READY' : (status ?? 'ENTERED')}
          </span>
        </div>
      )}
    </div>
  )
}
