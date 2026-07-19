import React, { useState, useRef, useEffect } from 'react'
import { MoreVertical } from 'lucide-react'
import { cn } from '@/shared/utils'

export interface DropdownAction {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'danger'
}

interface ActionDropdownProps {
  actions: DropdownAction[]
}

export const ActionDropdown: React.FC<ActionDropdownProps> = ({ actions }) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative flex items-center justify-center" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        type="button"
        className="flex items-center justify-center h-8 w-8 text-slate-450 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 transition-colors focus:outline-none cursor-pointer"
      >
        <MoreVertical className="h-4.5 w-4.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-border bg-surface shadow-lg z-55 py-1.5 animate-in fade-in slide-in-from-top-1 duration-100">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(false)
                action.onClick()
              }}
              type="button"
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left",
                action.variant === 'danger'
                  ? "text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                  : "text-slate-700 dark:text-slate-350 hover:text-slate-900"
              )}
            >
              {action.icon && <span className="h-4 w-4 flex items-center justify-center flex-shrink-0">{action.icon}</span>}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
