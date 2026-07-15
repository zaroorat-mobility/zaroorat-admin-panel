export type ToastVariant = 'success' | 'error' | 'warning' | 'info'
export type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center'

export interface Toast {
  id: string
  variant: ToastVariant
  title: string
  description?: string
  duration?: number        // ms, 0 = persistent
  onClose?: () => void
}

export interface ToastContextValue {
  toasts: Toast[]
  toast: (options: Omit<Toast, 'id'>) => string
  success: (title: string, description?: string) => string
  error: (title: string, description?: string) => string
  warning: (title: string, description?: string) => string
  info: (title: string, description?: string) => string
  dismiss: (id: string) => void
  dismissAll: () => void
}
