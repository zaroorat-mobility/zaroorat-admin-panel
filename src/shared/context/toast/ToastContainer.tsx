import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useToast } from './ToastContext'
import type { Toast, ToastVariant } from './types'

// ─── Icons ────────────────────────────────────────────────────────────────────

const SuccessIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="11" fill="currentColor" fillOpacity="0.15" />
    <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7.5 12.5l3 3 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const ErrorIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="11" fill="currentColor" fillOpacity="0.15" />
    <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1.5" />
    <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const WarningIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const InfoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="11" fill="currentColor" fillOpacity="0.15" />
    <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1.5" />
    <line x1="12" y1="8" x2="12" y2="8.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="12" y1="12" x2="12" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

// ─── Variant config ───────────────────────────────────────────────────────────

const VARIANT_CONFIG: Record<
  ToastVariant,
  { icon: React.ReactNode; accent: string; progress: string; label: string }
> = {
  success: {
    icon: <SuccessIcon />,
    accent: 'text-emerald-500',
    progress: 'bg-emerald-500',
    label: 'Success',
  },
  error: {
    icon: <ErrorIcon />,
    accent: 'text-red-500',
    progress: 'bg-red-500',
    label: 'Error',
  },
  warning: {
    icon: <WarningIcon />,
    accent: 'text-amber-500',
    progress: 'bg-amber-500',
    label: 'Warning',
  },
  info: {
    icon: <InfoIcon />,
    accent: 'text-[#2B317A]',
    progress: 'bg-[#2B317A]',
    label: 'Info',
  },
}

// ─── Single Toast Item ────────────────────────────────────────────────────────

interface ToastItemProps {
  toast: Toast
  onDismiss: (id: string) => void
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const config = VARIANT_CONFIG[toast.variant]
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [progress, setProgress] = useState(100)
  const startTimeRef = useRef<number>(Date.now())
  const rafRef = useRef<number>(0)

  // Mount animation
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(t)
  }, [])

  // Progress bar animation
  useEffect(() => {
    const duration = toast.duration ?? 4000
    if (duration <= 0) return

    startTimeRef.current = Date.now()

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current
      const remaining = Math.max(0, 1 - elapsed / duration)
      setProgress(remaining * 100)
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [toast.duration])

  const handleDismiss = () => {
    setExiting(true)
    setTimeout(() => onDismiss(toast.id), 300)
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        transform: visible && !exiting ? 'translateX(0) scale(1)' : 'translateX(24px) scale(0.96)',
        opacity: visible && !exiting ? 1 : 0,
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease',
        willChange: 'transform, opacity',
      }}
      className="relative flex items-start gap-3 w-[360px] max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-card p-4 overflow-hidden"
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full ${config.progress}`} />

      {/* Icon */}
      <span className={`flex-shrink-0 mt-0.5 ${config.accent}`}>{config.icon}</span>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-1">
        <p className="text-[13px] font-semibold text-foreground leading-snug">{toast.title}</p>
        {toast.description && (
          <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">{toast.description}</p>
        )}
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={handleDismiss}
        className="flex-shrink-0 mt-0.5 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        aria-label="Dismiss notification"
      >
        <CloseIcon />
      </button>

      {/* Progress bar */}
      {(toast.duration ?? 4000) > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-border overflow-hidden">
          <div
            className={`h-full ${config.progress} opacity-60 transition-none`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

// ─── Toast Container (portal) ─────────────────────────────────────────────────

export const ToastContainer: React.FC = () => {
  const { toasts, dismiss } = useToast()

  return createPortal(
    <div
      className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={dismiss} />
        </div>
      ))}
    </div>,
    document.body,
  )
}

export default ToastContainer
