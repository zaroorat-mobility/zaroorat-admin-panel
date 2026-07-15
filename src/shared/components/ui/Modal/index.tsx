import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '../Button'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}) => {
  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-5xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content container */}
      <div
        className={`relative w-full rounded-xl bg-white shadow-2xl dark:bg-dark-900 border border-slate-200 dark:border-dark-800 transition-all transform flex flex-col max-h-[90vh] ${sizes[size]}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-dark-800">
          {title ? (
            <h3 className="text-lg font-semibold text-slate-900 dark:text-dark-50">{title}</h3>
          ) : (
            <div />
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 text-sm text-slate-600 dark:text-dark-300">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-dark-800 bg-slate-50 dark:bg-dark-950 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
export default Modal
