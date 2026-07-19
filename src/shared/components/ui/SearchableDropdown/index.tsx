import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Search, ChevronDown, X, Check } from 'lucide-react'
import { cn } from '@/shared/utils'

export interface SearchableDropdownItem {
  id: string | number
  name: string
}

export interface SearchableDropdownProps {
  label?: string
  items: SearchableDropdownItem[]
  selectedId?: string | number
  selectedLabel?: string
  onSelect: (value: string | number) => void
  placeholder?: string
  disabled?: boolean
  error?: string
  className?: string
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  label,
  items,
  selectedId,
  selectedLabel,
  onSelect,
  placeholder = 'Select item...',
  disabled = false,
  error,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredItems = useMemo(() => {
    if (!search) return items
    return items.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [items, search])

  const displayText = useMemo(() => {
    if (selectedLabel) return selectedLabel
    const found = items.find((item) => item.id === selectedId)
    return found ? found.name : ''
  }, [items, selectedId, selectedLabel])

  const handleSelectItem = (item: SearchableDropdownItem) => {
    onSelect(item.id)
    setIsOpen(false)
    setSearch('')
  }

  return (
    <div className={cn("w-full space-y-1.5 text-left relative", className)} ref={dropdownRef}>
      {label && (
        <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      )}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className={cn(
            "flex h-9 w-full rounded-lg border border-input bg-white px-3 py-1 text-sm text-foreground shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50 items-center justify-between dark:bg-slate-900",
            error ? 'border-destructive focus:border-destructive focus:ring-destructive/10' : '',
            isOpen ? 'border-primary ring-2 ring-primary/10' : ''
          )}
        >
          {displayText ? (
            <span className="truncate text-slate-800 dark:text-slate-200 font-medium">{displayText}</span>
          ) : (
            <span className="text-muted-foreground/60">{placeholder}</span>
          )}
          <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", isOpen ? "rotate-180" : "")} />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-60 overflow-hidden flex flex-col animate-fadeIn">
            {/* Search Input Box */}
            <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-sm bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 py-1"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Options List */}
            <ul className="overflow-y-auto max-h-48 py-1">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <li
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className={cn(
                      "px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors flex items-center justify-between text-slate-700 dark:text-slate-350",
                      selectedId === item.id ? "bg-primary/5 text-primary font-bold dark:bg-primary/10" : ""
                    )}
                  >
                    <span>{item.name}</span>
                    {selectedId === item.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </li>
                ))
              ) : (
                <li className="px-3 py-4 text-xs text-center text-muted-foreground">
                  No options found
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs font-medium text-destructive mt-1">{error}</p>
      )}
    </div>
  )
}

export default SearchableDropdown
