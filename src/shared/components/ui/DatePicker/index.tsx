import { useState, useRef, useEffect, forwardRef, useMemo } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/utils'

export interface DatePickerProps {
  label?: string
  value?: string
  onChange: (value: string) => void
  error?: string
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
}

type ViewMode = 'days' | 'months' | 'years'

export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(({
  label,
  value = '',
  onChange,
  placeholder = 'Select date...',
  disabled = false,
  error,
  className = '',
  id,
}, ref) => {
  const [isOpen, setIsOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('days')
  const containerRef = useRef<HTMLDivElement>(null)

  // Calendar navigation state (default to selected date or current date)
  const initialDate = value ? new Date(value) : new Date()
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth()) // 0-indexed
  const [decadeStartYear, setDecadeStartYear] = useState(Math.floor(initialDate.getFullYear() / 15) * 15)

  // Close calendar on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setViewMode('days')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Sync state if selected date changes
  useEffect(() => {
    if (value) {
      const d = new Date(value)
      if (!isNaN(d.getTime())) {
        setCurrentYear(d.getFullYear())
        setCurrentMonth(d.getMonth())
        setDecadeStartYear(Math.floor(d.getFullYear() / 15) * 15)
      }
    }
  }, [value])

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]

  const fullMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Calculate days in the current month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  // Calculate first day of the month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  // Grid Navigation controls based on current ViewMode
  const handlePrev = () => {
    if (viewMode === 'days') {
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear(prev => prev - 1)
      } else {
        setCurrentMonth(prev => prev - 1)
      }
    } else if (viewMode === 'years') {
      setDecadeStartYear(prev => prev - 15)
    }
  }

  const handleNext = () => {
    if (viewMode === 'days') {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear(prev => prev + 1)
      } else {
        setCurrentMonth(prev => prev + 1)
      }
    } else if (viewMode === 'years') {
      setDecadeStartYear(prev => prev + 15)
    }
  }

  const handleSelectYear = (year: number) => {
    setCurrentYear(year)
    setViewMode('months')
  }

  const handleSelectMonth = (monthIndex: number) => {
    setCurrentMonth(monthIndex)
    setViewMode('days')
  }

  const handleSelectDay = (day: number) => {
    const monthStr = String(currentMonth + 1).padStart(2, '0')
    const dayStr = String(day).padStart(2, '0')
    const formatted = `${currentYear}-${monthStr}-${dayStr}`
    onChange(formatted)
    setIsOpen(false)
  }

  // Years array generation for grid view (15 years block)
  const yearsGrid = useMemo(() => {
    const list = []
    for (let i = 0; i < 15; i++) {
      list.push(decadeStartYear + i)
    }
    return list
  }, [decadeStartYear])

  // Days array generation
  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth)

  const blanks = Array(firstDayIndex).fill(null)
  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Formatted date string for input display
  const displayValue = useMemo(() => {
    if (!value) return ''
    const d = new Date(value)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }, [value])

  const dateId = id || `date-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className={cn("w-full space-y-1.5 text-left relative", className)} ref={containerRef}>
      {label && (
        <label
          htmlFor={dateId}
          className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <div className="relative" ref={ref} id={dateId}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(prev => !prev)}
          className={cn(
            "flex h-9 w-full rounded-lg border border-input bg-white px-3 py-1 text-sm text-foreground shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50 items-center justify-between dark:bg-slate-900",
            error ? 'border-destructive focus:border-destructive focus:ring-destructive/10' : '',
            isOpen ? 'border-primary ring-2 ring-primary/10' : ''
          )}
        >
          {displayValue ? (
            <span className="truncate text-slate-800 dark:text-slate-200 font-medium">{displayValue}</span>
          ) : (
            <span className="text-muted-foreground/60">{placeholder}</span>
          )}
          <CalendarIcon className="h-4 w-4 text-slate-400 pointer-events-none" />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-72 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl animate-fadeIn p-4">
            {/* Header controls with interactive switcher */}
            <div className="flex items-center justify-between mb-3.5 gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={viewMode === 'months'}
                className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4 text-slate-500" />
              </button>

              <button
                type="button"
                onClick={() => setViewMode(prev => prev === 'days' ? 'years' : 'days')}
                className="text-xs font-bold text-slate-700 dark:text-slate-350 hover:text-primary transition-colors px-2 py-0.5 rounded hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                {viewMode === 'days' && `${fullMonths[currentMonth]} ${currentYear}`}
                {viewMode === 'months' && `${currentYear} (Select Month)`}
                {viewMode === 'years' && `${decadeStartYear} - ${decadeStartYear + 14}`}
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={viewMode === 'months'}
                className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            {/* View Mode 1: Days View */}
            {viewMode === 'days' && (
              <>
                {/* Week Headers */}
                <div className="grid grid-cols-7 gap-y-1 text-center mb-1">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((wd, i) => (
                    <span key={i} className="text-[10px] uppercase font-bold text-slate-400">{wd}</span>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-y-1 text-center">
                  {blanks.map((_, idx) => (
                    <div key={`blank-${idx}`} className="h-8" />
                  ))}
                  {dayNumbers.map((day) => {
                    const isSelected = value && (() => {
                      const d = new Date(value)
                      return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear
                    })()

                    return (
                      <button
                        key={`day-${day}`}
                        type="button"
                        onClick={() => handleSelectDay(day)}
                        className={cn(
                          "h-8 w-8 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center justify-center mx-auto transition-colors",
                          isSelected ? "bg-primary text-white hover:bg-primary/95" : "text-slate-700 dark:text-slate-350"
                        )}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {/* View Mode 2: Months Grid */}
            {viewMode === 'months' && (
              <div className="grid grid-cols-3 gap-2 text-center py-2">
                {months.map((m, index) => {
                  const isSelected = currentMonth === index
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSelectMonth(index)}
                      className={cn(
                        "py-2.5 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 transition-all",
                        isSelected ? "bg-primary text-white hover:bg-primary/95" : "text-slate-700 dark:text-slate-350"
                      )}
                    >
                      {m}
                    </button>
                  )
                })}
              </div>
            )}

            {/* View Mode 3: Years Grid */}
            {viewMode === 'years' && (
              <div className="grid grid-cols-3 gap-2 text-center py-2">
                {yearsGrid.map((y) => {
                  const isSelected = currentYear === y
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => handleSelectYear(y)}
                      className={cn(
                        "py-2.5 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 transition-all",
                        isSelected ? "bg-primary text-white hover:bg-primary/95" : "text-slate-700 dark:text-slate-350"
                      )}
                    >
                      {y}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs font-medium text-destructive mt-1">{error}</p>
      )}
    </div>
  )
})

DatePicker.displayName = 'DatePicker'
export default DatePicker
