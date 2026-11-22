import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'

export interface PricingSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  onPrimaryAction?: () => void
  onSecondaryAction?: () => void
  /** Legacy aliases kept for TaxationSuccessModal backward compatibility */
  onGoToOverview?: () => void
  onViewConfiguration?: () => void
  title?: string
  message?: string
  primaryButtonText?: string
  secondaryButtonText?: string
}

export const PricingSuccessModal: React.FC<PricingSuccessModalProps> = ({
  isOpen,
  onClose,
  onPrimaryAction,
  onSecondaryAction,
  onGoToOverview,
  onViewConfiguration,
  title = 'Configuration Saved',
  message = 'Your pricing rule has been saved and activated successfully.',
  primaryButtonText = 'Go to Overview',
  secondaryButtonText,
}) => {
  const handlePrimary = onPrimaryAction ?? onGoToOverview ?? onClose
  const handleSecondary = onSecondaryAction ?? onViewConfiguration

  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[120] m-0 p-4 bg-black/60 backdrop-blur-xs flex items-center justify-center overflow-y-auto">
      {/* Backdrop click dismiss */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Main Dialog Card */}
      <div className="relative z-10 w-full max-w-[380px] sm:max-w-[400px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Concentric Rippling Green Checkmark Illustration */}
        <div className="relative flex items-center justify-center my-1 select-none">
          <svg
            className="w-28 h-28 sm:w-32 sm:h-32"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="60" cy="60" r="54" fill="#10B981" fillOpacity="0.14" />
            <circle cx="60" cy="60" r="42" fill="#10B981" fillOpacity="0.26" />
            <circle cx="60" cy="60" r="32" fill="#10B981" fillOpacity="0.38" />
            <circle cx="60" cy="60" r="23" fill="#16A34A" />
            <path
              d="M48 60.5L56 68.5L72 52.5"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-3 leading-snug">
          {title}
        </h2>

        {/* Subtitle / Description */}
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-[280px] sm:max-w-xs leading-relaxed">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="w-full space-y-2.5 mt-7">
          <button
            type="button"
            onClick={handlePrimary}
            className="w-full py-3 px-5 rounded-xl bg-[#1F2B6D] hover:bg-[#182258] active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            {primaryButtonText}
          </button>

          {secondaryButtonText && handleSecondary && (
            <button
              type="button"
              onClick={handleSecondary}
              className="w-full py-3 px-5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm transition-all cursor-pointer"
            >
              {secondaryButtonText}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default PricingSuccessModal
