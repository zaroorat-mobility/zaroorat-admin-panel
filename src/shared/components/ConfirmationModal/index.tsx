import React, { useEffect } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'

interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  description: React.ReactNode
  itemName?: string
  loading?: boolean
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'warning' | 'info'
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  description,
  itemName,
  loading = false,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
}) => {
  const isDanger = variant === 'danger'
  const isWarning = variant === 'warning'

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onCancel()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onCancel, loading])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (!loading) onCancel()
        }}
      />

      {/* Modal Card Content */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 transition-all transform flex flex-col z-10 text-left animate-fadeIn">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
              isDanger
                ? 'bg-red-100 text-red-600 dark:bg-red-950/20 dark:text-red-400'
                : isWarning
                ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                : 'bg-blue-100 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400'
            }`}
          >
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              {title}
            </h3>
            <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {description}
              {itemName && (
                <span className="block mt-1 font-semibold text-slate-900 dark:text-slate-100">
                  "{itemName}"
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="mt-2 sm:mt-0 inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`inline-flex h-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : isWarning
                ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
                : 'bg-primary hover:bg-primary-hover focus:ring-primary'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>

        {/* Top-right close button */}
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-500 transition-all focus:outline-none"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
export default ConfirmationModal
