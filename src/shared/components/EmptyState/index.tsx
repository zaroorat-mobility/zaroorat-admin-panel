import React from 'react'
import { Inbox } from 'lucide-react'
import { Button } from '../ui/Button'

export interface EmptyStateProps {
  title?: string
  message: string
  actionLabel?: string
  onAction?: () => void
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Found',
  message,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 dark:border-dark-800 rounded-xl min-h-[320px] bg-slate-50/50 dark:bg-dark-900/10">
      <div className="rounded-full bg-slate-100 p-3 dark:bg-dark-850 text-slate-400 dark:text-dark-500 mb-4">
        <Inbox className="h-8 w-8" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 dark:text-dark-200">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-dark-400 max-w-sm mt-1 mb-6 leading-relaxed">
        {message}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
export default EmptyState
