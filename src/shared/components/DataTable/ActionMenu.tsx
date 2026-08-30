import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { MoreVertical, Eye, Pencil, Trash2 } from 'lucide-react'

interface ActionMenuProps {
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  alignY?: 'up' | 'down'
}

const MENU_WIDTH = 144
const MENU_GAP = 4

export const ActionMenu: React.FC<ActionMenuProps> = ({ onView, onEdit, onDelete, alignY }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number; openUp: boolean } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const itemCount = [onView, onEdit, onDelete].filter(Boolean).length

  const updatePosition = () => {
    const trigger = triggerRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const estimatedHeight = Math.min(itemCount * 32 + 8, 200)
    const spaceBelow = window.innerHeight - rect.bottom
    const openUp =
      alignY === 'up' ||
      (alignY !== 'down' && spaceBelow < estimatedHeight + MENU_GAP && rect.top > spaceBelow)

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
  }, [isOpen, itemCount, alignY])

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
  }, [isOpen, itemCount, alignY])

  return (
    <div className="relative inline-block text-left">
      <button
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen((open) => !open)
        }}
        type="button"
        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 hover:text-slate-700 cursor-pointer"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <MoreVertical className="w-4 h-4" />
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
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg py-1 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            {onView && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onView()
                  setIsOpen(false)
                }}
                className="w-full px-3 py-1.5 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors border-none bg-transparent cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                View Details
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onEdit()
                  setIsOpen(false)
                }}
                className="w-full px-3 py-1.5 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors border-none bg-transparent cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onDelete()
                  setIsOpen(false)
                }}
                className="w-full px-3 py-1.5 text-left text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2 transition-colors border-none bg-transparent cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}
          </div>,
          document.body,
        )}
    </div>
  )
}

export default ActionMenu
