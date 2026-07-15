import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react'
import type { Toast, ToastContextValue } from './types'

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  /** Remove a single toast and clear its auto-dismiss timer */
  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  /** Clear all toasts */
  const dismissAll = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer))
    timersRef.current.clear()
    setToasts([])
  }, [])

  /** Core add-toast function */
  const toast = useCallback(
    (options: Omit<Toast, 'id'>): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const duration = options.duration ?? 4000

      setToasts((prev) => [...prev, { ...options, id, duration }])

      if (duration > 0) {
        const timer = setTimeout(() => {
          options.onClose?.()
          dismiss(id)
        }, duration)
        timersRef.current.set(id, timer)
      }
      return id
    },
    [dismiss],
  )

  // ── Convenience helpers ───────────────────────────────────────────────────

  const success = useCallback(
    (title: string, description?: string) =>
      toast({ variant: 'success', title, description }),
    [toast],
  )

  const error = useCallback(
    (title: string, description?: string) =>
      toast({ variant: 'error', title, description }),
    [toast],
  )

  const warning = useCallback(
    (title: string, description?: string) =>
      toast({ variant: 'warning', title, description }),
    [toast],
  )

  const info = useCallback(
    (title: string, description?: string) =>
      toast({ variant: 'info', title, description }),
    [toast],
  )

  return (
    <ToastContext.Provider
      value={{ toasts, toast, success, error, warning, info, dismiss, dismissAll }}
    >
      {children}
    </ToastContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

export default ToastProvider
