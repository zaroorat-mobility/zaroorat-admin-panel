import React, { useState, useRef, useEffect } from 'react'
import { MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/shared/utils'

interface ActionMenuProps {
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  alignY?: 'up' | 'down'
}

export const ActionMenu: React.FC<ActionMenuProps> = ({ onView, onEdit, onDelete, alignY = 'down' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 hover:text-slate-700 cursor-pointer"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen && (
        <div 
          className={cn(
            "absolute right-0 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg py-1 z-50 animate-fadeIn",
            alignY === 'up' ? "bottom-full mb-1" : "top-full mt-1"
          )}
        >
          {onView && (
            <button
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
        </div>
      )}
    </div>
  )
}
export default ActionMenu
