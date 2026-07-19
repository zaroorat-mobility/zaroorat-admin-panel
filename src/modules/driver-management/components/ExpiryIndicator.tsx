import { cn } from '@/shared/utils'
import { AlertTriangle, CheckCircle, AlertOctagon } from 'lucide-react'

interface Props {
  expiryDate?: string
  className?: string
}

export const ExpiryIndicator: React.FC<Props> = ({ expiryDate, className }) => {
  if (!expiryDate) {
    return <span className="text-slate-400 text-xs">No date set</span>
  }

  const expDate = new Date(expiryDate)
  const today = new Date()
  const timeDiff = expDate.getTime() - today.getTime()
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))

  let status: 'green' | 'orange' | 'red' = 'green'
  let label = ''
  let Icon = CheckCircle

  if (daysDiff < 0) {
    status = 'red'
    label = 'Expired'
    Icon = AlertOctagon
  } else if (daysDiff <= 60) {
    status = 'orange'
    label = `Expires in ${daysDiff} days`
    Icon = AlertTriangle
  } else {
    status = 'green'
    label = expiryDate
    Icon = CheckCircle
  }

  const styles = {
    red: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900',
    orange: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold border',
        styles[status],
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      <span>{label}</span>
    </span>
  )
}
