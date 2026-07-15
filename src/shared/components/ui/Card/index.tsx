import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  isHoverable?: boolean
}

export const Card: React.FC<CardProps> = ({
  className = '',
  children,
  isHoverable = false,
  ...props
}) => {
  return (
    <div
      className={`premium-card border border-brand-border bg-brand-surface overflow-hidden ${
        isHoverable
          ? 'hover:shadow-card hover:-translate-y-[1px]'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={`px-6 py-5 border-b border-brand-border flex items-center justify-between gap-4 ${className}`} {...props}>
    {children}
  </div>
)

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <h3 className={`text-base font-bold leading-none text-text-primary ${className}`} {...props}>
    {children}
  </h3>
)

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <p className={`text-xs font-medium text-text-secondary mt-1.5 ${className}`} {...props}>
    {children}
  </p>
)

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
)

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={`px-6 py-4 border-t border-brand-border bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-3 ${className}`} {...props}>
    {children}
  </div>
)
