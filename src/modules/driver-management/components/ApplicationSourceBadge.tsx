import { cn } from '@/shared/utils'
import type { ApplicationSource } from '../types'

interface Props {
  source: ApplicationSource
  className?: string
}

const sourceConfig: Record<ApplicationSource, { label: string; className: string }> = {
  driver_app: {
    label: 'Driver App',
    className: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900',
  },
  admin_manual: {
    label: 'Admin Manual',
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900',
  },
}

export const ApplicationSourceBadge: React.FC<Props> = ({ source, className }) => {
  const config = sourceConfig[source] ?? { label: source, className: 'bg-slate-100 text-slate-600 border-slate-200' }
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
