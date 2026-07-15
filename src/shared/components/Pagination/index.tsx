import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../ui/Button'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  pageSize?: number
  totalCount?: number
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  totalCount,
}) => {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between border-t border-slate-200 dark:border-dark-800 px-4 py-4 sm:px-6 mt-4">
      <div className="flex flex-1 justify-between sm:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          {totalCount && pageSize ? (
            <p className="text-sm text-slate-700 dark:text-dark-300">
              Showing{' '}
              <span className="font-semibold text-slate-900 dark:text-dark-100">
                {(currentPage - 1) * pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-900 dark:text-dark-100">
                {Math.min(currentPage * pageSize, totalCount)}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-slate-900 dark:text-dark-100">{totalCount}</span>{' '}
              results
            </p>
          ) : (
            <p className="text-sm text-slate-700 dark:text-dark-300">
              Page <span className="font-semibold text-slate-900 dark:text-dark-100">{currentPage}</span> of{' '}
              <span className="font-semibold text-slate-900 dark:text-dark-100">{totalPages}</span>
            </p>
          )}
        </div>
        <div>
          <nav className="inline-flex -space-x-px rounded-md shadow-sm gap-1" aria-label="Pagination">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
              .map((page, idx, arr) => {
                const prev = arr[idx - 1]
                const showEllipsis = prev && page - prev > 1
                
                return (
                  <React.Fragment key={page}>
                    {showEllipsis && (
                      <span className="inline-flex items-center px-3 py-1 text-slate-400 dark:text-dark-500">...</span>
                    )}
                    <Button
                      variant={currentPage === page ? 'primary' : 'outline'}
                      className="h-8 w-8 text-xs font-semibold p-0"
                      onClick={() => onPageChange(page)}
                    >
                      {page}
                    </Button>
                  </React.Fragment>
                )
              })}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </div>
    </div>
  )
}
export default Pagination
