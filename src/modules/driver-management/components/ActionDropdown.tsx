import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
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

const MENU_WIDTH = 176
const MENU_GAP = 4

export const ActionDropdown: React.FC<ActionDropdownProps> = ({ actions }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number; openUp: boolean } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const updatePosition = () => {
    const trigger = triggerRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const estimatedHeight = Math.min(actions.length * 36 + 12, 280)
    const spaceBelow = window.innerHeight - rect.bottom
    const openUp = spaceBelow < estimatedHeight + MENU_GAP && rect.top > spaceBelow

    let left = rect.right - MENU_WIDTH
    left = Math.max(8, Math.min(left, window.innerWidth - MENU_WIDTH - 8))

    setCoords({
      top: openUp ? rect.top - MENU_GAP : rect.bottom + MENU_GAP,
      left,
      openUp,
    })
  }

  useLayoutEffect(() => {
    if (!isOpen) {
      setCoords(null)
      return
    }
    updatePosition()
  }, [isOpen, actions.length])

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setIsOpen(false)
    }

    const handleReposition = () => updatePosition()

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('resize', handleReposition)
    window.addEventListener('scroll', handleReposition, true)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', handleReposition)
      window.removeEventListener('scroll', handleReposition, true)
    }
  }, [isOpen, actions.length])

  return (
    <div className="relative flex items-center justify-center">
      <button
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen((open) => !open)
        }}
        type="button"
        className="flex items-center justify-center h-8 w-8 text-slate-450 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 transition-colors focus:outline-none cursor-pointer"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <MoreVertical className="h-4.5 w-4.5" />
      </button>

      {isOpen &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              width: MENU_WIDTH,
              transform: coords.openUp ? 'translateY(-100%)' : undefined,
              zIndex: 9999,
            }}
            className="rounded-xl border border-border bg-surface shadow-lg py-1.5 animate-in fade-in duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            {actions.map((action, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation()
                  setIsOpen(false)
                  action.onClick()
                }}
                type="button"
                role="menuitem"
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer',
                  action.variant === 'danger'
                    ? 'text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300'
                    : 'text-slate-700 dark:text-slate-350 hover:text-slate-900',
                )}
              >
                {action.icon && (
                  <span className="h-4 w-4 flex items-center justify-center flex-shrink-0">{action.icon}</span>
                )}
                <span>{action.label}</span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  )
}
