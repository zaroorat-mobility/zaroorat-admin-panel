import React from 'react'

export interface PageLoaderProps {
  message?: string
}

/**
 * Centered spinner for page-level loadings
 */
export const PageLoader: React.FC<PageLoaderProps> = ({ message = 'Loading Zaroorat Mobility...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div className="relative h-12 w-12">
        <span className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-dark-800" />
        <span className="absolute inset-0 rounded-full border-4 border-brand-600 dark:border-brand-500 border-t-transparent animate-spin" />
      </div>
      {message && <p className="text-sm font-medium text-slate-500 dark:text-dark-400">{message}</p>}
    </div>
  )
}

/**
 * Skeleton block helper
 */
export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return (
    <div className={`animate-pulse rounded-md bg-slate-200 dark:bg-dark-800 ${className}`} />
  )
}
export default PageLoader
