import React from 'react'
import { cn } from '@/shared/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  outline?: boolean
}

export const Badge: React.FC<BadgeProps> = ({
  className = '',
  variant = 'neutral',
  outline = false,
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold select-none tracking-wide'

  const variants = {
    primary: outline
      ? 'border border-primary text-primary bg-transparent'
      : 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground',
    secondary: outline
      ? 'border border-border text-foreground bg-transparent'
      : 'bg-secondary text-secondary-foreground border border-border/40',
    success: outline
      ? 'border border-green-500 text-green-600 bg-transparent'
      : 'bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400',
    warning: outline
      ? 'border border-amber-500 text-amber-600 bg-transparent'
      : 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    danger: outline
      ? 'border border-red-500 text-red-600 bg-transparent'
      : 'bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400',
    info: outline
      ? 'border border-blue-500 text-blue-600 bg-transparent'
      : 'bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    neutral: outline
      ? 'border border-border text-muted-foreground bg-transparent'
      : 'bg-muted text-muted-foreground',
  }

  return (
    <span className={cn(baseStyles, variants[variant], className)} {...props}>
      {children}
    </span>
  )
}
export default Badge
