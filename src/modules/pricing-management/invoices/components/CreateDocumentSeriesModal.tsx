import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Hash, Building2, FileText, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react'
import type { FiscalDocumentType } from '../../api/fiscal.api'
import { DOCUMENT_TYPE_LABELS } from './FiscalDocumentDetailsModal'

export interface GstRegistrationOption {
  id: string
  gstin: string
  stateCode: string
  stateName: string
  legalEntityName: string
  label: string
}

interface CreateDocumentSeriesModalProps {
  isOpen: boolean
  gstRegistrations: GstRegistrationOption[]
  defaultFinancialYear: string
  isPending: boolean
  onClose: () => void
  onNavigateToGst: () => void
  onSubmit: (payload: {
    gstRegistrationId: string
    documentType: FiscalDocumentType
    financialYear: string
    prefix: string
  }) => Promise<void>
}

const DOC_TYPE_SHORT: Record<FiscalDocumentType, string> = {
  PASSENGER_TAX_INVOICE: 'INV',
  COMMISSION_TAX_INVOICE: 'COM',
  WALLET_RECHARGE_RECEIPT: 'WRC',
  DRIVER_SETTLEMENT_STATEMENT: 'SET',
  CREDIT_NOTE: 'CN',
  SUBSCRIPTION_INVOICE: 'SUB',
}

export const CreateDocumentSeriesModal: React.FC<CreateDocumentSeriesModalProps> = ({
  isOpen,
  gstRegistrations,
  defaultFinancialYear,
  isPending,
  onClose,
  onNavigateToGst,
  onSubmit,
}) => {
  const [gstRegistrationId, setGstRegistrationId] = useState('')
  const [documentType, setDocumentType] = useState<FiscalDocumentType>('PASSENGER_TAX_INVOICE')
  const [financialYear, setFinancialYear] = useState(defaultFinancialYear)
  const [prefix, setPrefix] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setError(null)
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const selectedReg = gstRegistrations.find((r) => r.id === gstRegistrationId) ?? null
  const normalizedPrefix = prefix.trim().toUpperCase()
  const fyCompact = financialYear.replace(/^20/, '').replace('-', '') || '2627'
  const suggestedPrefix = `ZRT-${selectedReg?.stateCode || '01'}-${DOC_TYPE_SHORT[documentType] || 'INV'}-${fyCompact}-`
  const sampleNumber = `${normalizedPrefix || suggestedPrefix}000001`

  const handleAutoSuggest = () => {
    setPrefix(suggestedPrefix)
    setError(null)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!gstRegistrationId) {
      setError('Select an active State GST registration.')
      return
    }
    if (!/^\d{4}-\d{2}$/.test(financialYear.trim())) {
      setError('Financial Year must follow YYYY-YY format (e.g., 2026-27).')
      return
    }
    if (!/^[A-Z0-9/_-]{2,24}$/.test(normalizedPrefix)) {
      setError('Prefix must be 2–24 characters using A–Z, 0–9, /, _, or -.')
      return
    }

    await onSubmit({
      gstRegistrationId,
      documentType,
      financialYear: financialYear.trim(),
      prefix: normalizedPrefix,
    })
    setPrefix('')
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] m-0 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/60 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#1F2B6D] dark:text-white leading-tight">
                Create Gapless Document Series
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Row-locked sequential numbering per State GSTIN, Document Type &amp; Financial Year.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={(e) => void handleFormSubmit(e)} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {gstRegistrations.length === 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">No Active State GSTIN Found</p>
                    <p className="text-[11px] opacity-90 mt-0.5">
                      Register your Legal Entity &amp; State GSTIN in Tax &amp; Commission before creating an invoice series.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onNavigateToGst()
                  }}
                  className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1F2B6D] text-white text-xs font-semibold cursor-pointer"
                >
                  <span>Add GSTIN</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                State GST Registration <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={gstRegistrationId}
                onChange={(e) => setGstRegistrationId(e.target.value)}
                className="w-full h-10 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D]"
              >
                <option value="">Select active State GSTIN…</option>
                {gstRegistrations.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Document Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as FiscalDocumentType)}
                className="w-full h-10 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D]"
              >
                {(Object.keys(DOCUMENT_TYPE_LABELS) as FiscalDocumentType[]).map((k) => (
                  <option key={k} value={k}>
                    {DOCUMENT_TYPE_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Indian Financial Year <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  pattern="^\d{4}-\d{2}$"
                  placeholder="2026-27"
                  value={financialYear}
                  onChange={(e) => setFinancialYear(e.target.value)}
                  className="w-full h-10 px-3 py-2 text-xs sm:text-sm font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Series Prefix <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoSuggest}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    Auto-Suggest
                  </button>
                </div>
                <input
                  required
                  type="text"
                  placeholder="e.g., ZRT-01-INV-2627-"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                  className="w-full h-10 px-3 py-2 text-xs sm:text-sm font-mono font-bold uppercase rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D]"
                />
              </div>
            </div>

            {/* Live Invoice Number Preview */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-[#1F2B6D]/15 dark:border-blue-500/30 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold text-[#1F2B6D] dark:text-blue-300">
                  First Generated Document Number Preview
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Numbers increment monotonically and are never reused.
                </p>
              </div>
              <span className="font-mono text-xs sm:text-sm font-extrabold text-[#1F2B6D] dark:text-blue-200 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-blue-200/70 dark:border-blue-800">
                {sampleNumber}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[10px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || gstRegistrations.length === 0}
              className="px-5 py-2 rounded-[10px] bg-[#1F2B6D] hover:bg-[#182258] text-white text-xs font-semibold shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              {isPending ? 'Creating Series…' : 'Create Document Series'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}

export default CreateDocumentSeriesModal
