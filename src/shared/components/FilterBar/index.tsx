import React from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '../ui/Button'

export interface FilterBarProps {
  children?: React.ReactNode
  onClearFilters?: () => void
  hasActiveFilters?: boolean
}

export const FilterBar: React.FC<FilterBarProps> = ({
  children,
  onClearFilters,
  hasActiveFilters = false,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 border border-brand-border bg-brand-surface rounded-xl mb-4 shadow-soft">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-text-secondary mr-2">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Filters</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">{children}</div>
      </div>
      {hasActiveFilters && onClearFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="text-xs text-text-secondary hover:text-text-primary rounded-lg h-8"
        >
          Clear Filters
        </Button>
      )}
    </div>
  )
}
export default FilterBar
