import React from 'react'
import { cn } from '@/shared/utils'

interface TokenGroupSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export const TokenGroupSection: React.FC<TokenGroupSectionProps> = ({
  title,
  description,
  children,
  className,
}) => (
  <section
    className={cn(
      'rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900',
      className,
    )}
  >
    <div className="mb-3 border-b border-slate-100 pb-2 dark:border-slate-800">
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
      {description ? (
        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{description}</p>
      ) : null}
    </div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
  </section>
)
