import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { type BreadcrumbItem } from '@/app/layouts/Breadcrumbs'

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
    <div className="flex items-center justify-between mb-6 gap-4">
      {/* Title & subtitle descriptor with brand colored left accent border */}
      <div className="flex items-center gap-3 text-left pl-3.5 border-l-4 border-[#2B317A] flex-1 min-w-0">
        {(backTo !== undefined || onBack !== undefined) && (
          <button
            onClick={handleBack}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 hover:text-slate-700 mr-1 flex-shrink-0 cursor-pointer"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight text-foreground leading-snug">{title}</h2>
          {description && (
            <p className="text-[13px] text-[#64748B] mt-1.5 font-medium leading-relaxed">{description}</p>
          )}
        </div>
      </div>

      {/* Right Side Buttons */}
      {actions && (
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}
export default PageHeader
