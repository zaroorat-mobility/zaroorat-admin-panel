import React from 'react'

export interface ReviewSummaryCardProps {
  icon: React.ReactNode
  iconBgColor?: string
  iconColor?: string
  title: string
  value: string | number
  valueColor?: string
  subtitle?: string
  badge?: React.ReactNode
  className?: string
  onClick?: () => void
  iconRounded?: 'full' | 'xl' | 'lg'
}

export const ReviewSummaryCard: React.FC<ReviewSummaryCardProps> = ({
  icon,
  iconBgColor = 'bg-[#1F2B6D]',
  iconColor = 'text-white',
  title,
  value,
  valueColor = 'text-[#1F2B6D] dark:text-white',
  subtitle,
  badge,
  className = '',
  onClick,
  iconRounded = 'full',
}) => {
  const roundedClass = iconRounded === 'xl' ? 'rounded-xl' : iconRounded === 'lg' ? 'rounded-lg' : 'rounded-full'

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3 transition-all duration-200 hover:shadow-md ${
        onClick ? 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700' : ''
      } ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-[42px] h-[42px] ${roundedClass} flex items-center justify-center shrink-0 shadow-2xs ${iconBgColor} ${iconColor}`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-slate-500 font-medium mb-0.5 truncate">{title}</p>
          <p className={`text-[15px] font-bold leading-tight truncate ${valueColor}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {badge && <div className="shrink-0">{badge}</div>}
    </div>
  )
}
