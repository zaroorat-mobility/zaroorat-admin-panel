import { useState, useRef, useEffect, forwardRef } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/shared/utils'

export interface CustomSelectOption {
  label: string
  value: string
}

export interface CustomSelectProps {
  label?: string
  options: CustomSelectOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: string
  className?: string
  id?: string
}

export const CustomSelect = forwardRef<HTMLDivElement, CustomSelectProps>(({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  disabled = false,
  error,
  className = '',
  id,
}, ref) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(opt => opt.value === value)

  const handleSelect = (option: CustomSelectOption) => {
    onChange(option.value)
    setIsOpen(false)
  }

  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className={cn("w-full space-y-1.5 text-left relative", className)} ref={dropdownRef}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <div className="relative" ref={ref} id={selectId}>
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
          {selectedOption ? (
            <span className="truncate text-slate-800 dark:text-slate-200 font-medium">{selectedOption.label}</span>
          ) : (
            <span className="text-muted-foreground/60">{placeholder}</span>
          )}
          <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", isOpen ? "rotate-180" : "")} />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-fadeIn py-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors flex items-center justify-between text-slate-700 dark:text-slate-350",
                  value === option.value ? "bg-primary/5 text-primary font-bold dark:bg-primary/10" : ""
                )}
              >
                <span>{option.label}</span>
                {value === option.value && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs font-medium text-destructive mt-1">{error}</p>
      )}
    </div>
  )
})

CustomSelect.displayName = 'CustomSelect'
export default CustomSelect
