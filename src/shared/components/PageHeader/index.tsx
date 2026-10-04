import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { type BreadcrumbItem } from '@/app/layouts/Breadcrumbs'
import { cn } from '@/shared/utils'

export interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  backTo?: string
  onBack?: () => void
  breadcrumbs?: BreadcrumbItem[]
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  backTo,
  onBack,
}) => {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) onBack()
    else if (backTo) navigate(backTo)
    else navigate(-1)
  }

  return (
    <div className="mb-6 pl-3.5 border-l-4 border-[#1F2B6D] text-left">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          {(backTo !== undefined || onBack !== undefined) && (
            <button
              onClick={handleBack}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 hover:text-slate-700 flex-shrink-0 cursor-pointer"
              title="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <h2 className="text-[20px] font-bold tracking-tight text-foreground leading-snug">{title}</h2>
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>

      {description && (
        <p className={cn(
          "text-[13px] text-[#64748B] mt-1 font-medium leading-relaxed",
          (backTo !== undefined || onBack !== undefined) ? "pl-7" : ""
        )}>
          {description}
        </p>
      )}
    </div>
  )
}
export default PageHeader
