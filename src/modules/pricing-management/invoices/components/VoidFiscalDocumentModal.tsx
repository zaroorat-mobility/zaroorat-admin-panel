import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, X, XCircle } from 'lucide-react'
import type { FiscalDocumentDto } from '../../api/fiscal.api'
import { DOCUMENT_TYPE_LABELS } from './FiscalDocumentDetailsModal'

interface VoidFiscalDocumentModalProps {
  target: FiscalDocumentDto | null
  isPending: boolean
  onClose: () => void
  onConfirm: (id: string, reason: string) => Promise<void>
}

export const VoidFiscalDocumentModal: React.FC<VoidFiscalDocumentModalProps> = ({
  target,
  isPending,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (!target) {
      setReason('')
      return
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [target, onClose])

  if (!target) return null

  const trimmed = reason.trim()
  const isValid = trimmed.length >= 5

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    await onConfirm(target.id, trimmed)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[120] m-0 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <form
        onSubmit={(e) => void handleSubmit(e)}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left"
      >
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-rose-50/60 dark:bg-rose-950/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-rose-700 dark:text-rose-400 leading-tight">
                Void Fiscal Document
              </h3>
              <p className="text-[11px] font-mono text-rose-600/80 dark:text-rose-300/80">
                {target.documentNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Type:</span>
              <strong className="text-slate-900 dark:text-white">
                {DOCUMENT_TYPE_LABELS[target.documentType]}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Recipient:</span>
              <strong className="text-slate-900 dark:text-white">{target.recipientName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Grand Total:</span>
              <strong className="font-mono text-slate-900 dark:text-white">
                ₹{target.totalAmount.toFixed(2)}
              </strong>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Voiding is <strong>permanent and audited</strong>. Original gapless sequence numbers are
            preserved for GST compliance and are never reused.
          </p>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Compliance / Finance Reason <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[10.5px] font-mono ${
                  isValid ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                {trimmed.length}/5 min chars
              </span>
            </div>
            <textarea
              required
              minLength={5}
              maxLength={300}
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this fiscal document is being voided (min 5 characters)..."
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/80 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-[10px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValid || isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer disabled:opacity-50"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>{isPending ? 'Voiding…' : 'Confirm Void'}</span>
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}

export default VoidFiscalDocumentModal
