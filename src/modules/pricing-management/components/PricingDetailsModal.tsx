import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export interface PricingDetailsBadge {
  label: string
  tone?: 'emerald' | 'rose' | 'amber' | 'blue' | 'slate'
}

interface PricingDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  /** Left navy badge text or icon (e.g. "v2", "1.5x", or an icon node) */
  badge: React.ReactNode
  title: string
  subtitle?: string
  statusBadges?: PricingDetailsBadge[]
  footerActions?: React.ReactNode
  children: React.ReactNode
}

const BADGE_TONE_CLASSES: Record<NonNullable<PricingDetailsBadge['tone']>, string> = {
  emerald: 'bg-[#E8FAF0] text-[#10B981] dark:bg-emerald-950/30 dark:text-emerald-400',
  rose: 'bg-[#FEE2E2] text-[#EF4444] dark:bg-rose-950/30 dark:text-rose-400',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
  blue: 'bg-blue-50 text-[#1F2B6D] dark:bg-blue-950/40 dark:text-blue-300',
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
}

export const PricingDetailsModal: React.FC<PricingDetailsModalProps> = ({
  isOpen,
  onClose,
  badge,
  title,
  subtitle,
  statusBadges = [],
  footerActions,
  children,
}) => {
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] m-0 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 sm:px-7 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/60 dark:bg-slate-900/80">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="min-w-10 h-10 px-2.5 rounded-xl bg-[#1F2B6D] flex items-center justify-center text-white text-xs font-extrabold tracking-wide shadow-sm flex-shrink-0">
              {badge}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-[#1F2B6D] dark:text-white leading-tight truncate">
                  {title}
                </h3>
                {statusBadges.map((b, idx) => (
                  <span
                    key={`${b.label}-${idx}`}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                      BADGE_TONE_CLASSES[b.tone ?? 'slate']
                    }`}
                  >
                    {b.label}
                  </span>
                ))}
              </div>
              {subtitle && (
                <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details modal"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition cursor-pointer flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 sm:p-7 space-y-6 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        <div className="px-6 sm:px-7 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/80 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 flex-wrap">{footerActions}</div>
          <button
            type="button"
            onClick={onClose}
            className="bg-[#1F2B6D] hover:bg-[#182258] active:scale-[0.98] text-white px-5 py-2 rounded-[10px] text-xs font-semibold shadow-sm transition cursor-pointer ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

interface DetailsKpiCardProps {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  sublabel?: string
  highlighted?: boolean
  mono?: boolean
  compact?: boolean
}

export const DetailsKpiCard: React.FC<DetailsKpiCardProps> = ({
  icon,
  label,
  value,
  sublabel,
  highlighted = false,
  mono = true,
  compact = false,
}) => (
  <div
    className={`rounded-xl border ${compact ? 'p-3.5' : 'p-4'} ${
      highlighted
        ? 'border-[#1F2B6D]/20 dark:border-blue-500/30 bg-blue-50/70 dark:bg-blue-950/30'
        : 'border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40'
    }`}
  >
    <div
      className={`flex items-center gap-1.5 ${compact ? 'text-[11.5px]' : 'text-xs'} font-semibold ${
        highlighted ? 'text-[#1F2B6D] dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'
      }`}
    >
      <span className={highlighted ? '' : 'text-[#1F2B6D] dark:text-blue-400'}>{icon}</span>
      <span className="truncate">{label}</span>
    </div>
    <p
      className={`${compact ? 'text-xl' : 'text-2xl'} font-extrabold ${mono ? 'font-mono' : ''} ${
        highlighted ? 'text-[#1F2B6D] dark:text-blue-300' : 'text-slate-900 dark:text-white'
      } mt-2 leading-none truncate`}
    >
      {value}
    </p>
    {sublabel && (
      <p
        className={`text-[11px] mt-1.5 truncate ${
          highlighted ? 'text-[#1F2B6D]/70 dark:text-blue-300/70' : 'text-slate-400'
        }`}
      >
        {sublabel}
      </p>
    )}
  </div>
)

export const DetailsSpecList: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
    {children}
  </div>
)

interface DetailsSpecRowProps {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}

export const DetailsSpecRow: React.FC<DetailsSpecRowProps> = ({ icon, label, value }) => (
  <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
    <div className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-slate-500 dark:text-slate-400">
      <span className="text-slate-400 flex-shrink-0">{icon}</span>
      <span>{label}</span>
    </div>
    <div className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white sm:text-right break-words">
      {value}
    </div>
  </div>
)

export default PricingDetailsModal
