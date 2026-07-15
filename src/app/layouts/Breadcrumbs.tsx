import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronRight, Home, ArrowLeft } from 'lucide-react'
import { cn } from '@/shared/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
  onClick?: () => void
}

export interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  actions?: React.ReactNode
  backTo?: string
  onBack?: () => void
  minimal?: boolean
}

export const Breadcrumbs: React.FC<BreadcrumbProps> = ({
  items: customItems,
  actions,
  backTo,
  onBack,
  minimal = false,
}) => {
  const navigate = useNavigate()
  const location = useLocation()

  // Generate automatic items if custom items are not provided
  const pathnames = location.pathname.split('/').filter((x) => x)
  const defaultItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/dashboard' },
    ...pathnames.map((value, index) => {
      const href = `/${pathnames.slice(0, index + 1).join('/')}`
      const label = value.length > 15 
        ? 'Details' 
        : value.charAt(0).toUpperCase() + value.slice(1)
      return { label, href }
    })
  ]

  const items = customItems || (pathnames.length > 0 ? defaultItems : [])

  const handleClick = (item: BreadcrumbItem, isLast: boolean) => {
    if (isLast) return
    if (item.onClick) {
      item.onClick()
    } else if (item.href) {
      navigate(item.href)
    }
  }

  const handleBack = () => {
    if (onBack) onBack()
    else if (backTo) navigate(backTo)
    else navigate(-1)
  }

  if (items.length === 0) return null

  // Minimal version for layout header placement
  if (minimal) {
    return (
      <nav className="flex items-center gap-1.5 select-none" aria-label="Breadcrumb">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <span key={index} className="flex items-center gap-1.5">
              {index === 0 && (
                <Home className="w-3.5 h-3.5 text-slate-400 mr-0.5 flex-shrink-0" />
              )}
              {index > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 flex-shrink-0" />
              )}
              <button
                type="button"
                onClick={() => handleClick(item, isLast)}
                disabled={isLast}
                className={cn(
                  "text-xs font-semibold select-none bg-transparent border-none p-0 transition-colors duration-150",
                  isLast
                    ? "text-[#2B317A] cursor-default font-bold dark:text-primary-foreground"
                    : "text-slate-400 hover:text-[#2B317A] cursor-pointer"
                )}
              >
                {item.label}
              </button>
            </span>
          )
        })}
      </nav>
    )
  }

  return (
    <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-slate-100 dark:border-slate-800">
      {/* Left — back button (optional) + breadcrumb trail */}
      <div className="flex items-center gap-3">
        {(backTo !== undefined || onBack !== undefined) && (
          <button
            onClick={handleBack}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 hover:text-slate-700"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <nav className="flex items-center gap-1" aria-label="Breadcrumb">
          {items.map((item, index) => {
            const isLast = index === items.length - 1
            return (
              <span key={index} className="flex items-center gap-1">
                {index === 0 && (
                  <Home className="w-3.5 h-3.5 text-slate-400 mr-0.5 flex-shrink-0" />
                )}
                {index > 0 && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 flex-shrink-0" />
                )}
                <button
                  type="button"
                  onClick={() => handleClick(item, isLast)}
                  disabled={isLast}
                  className={cn(
                    "text-xs font-semibold select-none bg-transparent border-none p-0 transition-colors duration-150",
                    isLast
                      ? "text-primary cursor-default font-bold dark:text-primary-foreground"
                      : "text-slate-400 hover:text-primary cursor-pointer"
                  )}
                >
                  {item.label}
                </button>
              </span>
            )
          })}
        </nav>
      </div>

      {/* Right — page actions */}
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}
export default Breadcrumbs
