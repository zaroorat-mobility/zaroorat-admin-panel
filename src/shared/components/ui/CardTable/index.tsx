import React from 'react'

export interface CardTableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  containerClassName?: string
}

export const CardTable: React.FC<CardTableProps> = ({
  children,
  className = '',
  containerClassName = '',
  ...props
}) => (
  <div className={`overflow-x-auto px-1 ${containerClassName}`}>
    <table className={`w-full text-left text-[12.5px] align-middle ${className}`} {...props}>
      {children}
    </table>
  </div>
)

export interface CardTheadProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const CardThead: React.FC<CardTheadProps> = ({
  children,
  className = '',
  ...props
}) => (
  <thead
    className={`text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 ${className}`}
    {...props}
  >
    {children}
  </thead>
)

export interface CardThProps extends React.ThHTMLAttributes<HTMLTableCellElement> {}

export const CardTh: React.FC<CardThProps> = ({
  children,
  className = '',
  ...props
}) => {
  const hasPx = className.includes('px-') || className.includes('p-')
  const hasPb = className.includes('pb-') || className.includes('py-') || className.includes('p-')
  return (
    <th
      className={`${hasPb ? '' : 'pb-3.5 '}${hasPx ? '' : 'px-4 '}font-semibold text-slate-500 dark:text-slate-400 text-[12px] whitespace-nowrap ${className}`}
      {...props}
    >
      {children}
    </th>
  )
}

export interface CardTbodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const CardTbody: React.FC<CardTbodyProps> = ({
  children,
  className = '',
  ...props
}) => (
  <tbody className={`divide-y divide-slate-100 dark:divide-slate-800 ${className}`} {...props}>
    {children}
  </tbody>
)

export interface CardTrProps extends React.HTMLAttributes<HTMLTableRowElement> {
  onClick?: () => void
}

export const CardTr: React.FC<CardTrProps> = ({
  children,
  onClick,
  className = '',
  ...props
}) => (
  <tr
    onClick={onClick}
    className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors ${
      onClick ? 'cursor-pointer' : ''
    } ${className}`}
    {...props}
  >
    {children}
  </tr>
)

export interface CardTdProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  onClick?: (e: React.MouseEvent) => void
}

export const CardTd: React.FC<CardTdProps> = ({
  children,
  className = '',
  onClick,
  ...props
}) => {
  const hasPx = className.includes('px-') || className.includes('p-')
  const hasPy = className.includes('py-') || className.includes('p-')
  return (
    <td
      className={`${hasPy ? '' : 'py-3.5 '}${hasPx ? '' : 'px-4 '}text-slate-700 dark:text-slate-300 ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </td>
  )
}

export interface CardTableCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  icon?: React.ReactNode
  action?: React.ReactNode
  headerClassName?: string
}

export const CardTableCard: React.FC<CardTableCardProps> = ({
  children,
  title,
  subtitle,
  icon,
  action,
  className = '',
  headerClassName = '',
  ...props
}) => (
  <div
    className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col ${className}`}
    {...props}
  >
    {(title || action || icon) && (
      <div
        className={`px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 z-10 ${headerClassName}`}
      >
        <div className="flex items-center gap-2.5">
          {icon}
          <div>
            {typeof title === 'string' ? (
              <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                {title}
              </h3>
            ) : (
              title
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
    )}
    {children}
  </div>
)

export interface CardTableButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost'
  size?: 'sm' | 'md'
}

export const CardTableButton: React.FC<CardTableButtonProps> = ({
  variant = 'outline',
  size = 'sm',
  className = '',
  children,
  ...props
}) => {
  const base =
    'rounded-md font-bold transition-colors shadow-2xs inline-flex items-center justify-center gap-1.5 cursor-pointer'
  const sizes = size === 'sm' ? 'px-4 py-1.5 text-[11.5px]' : 'px-4 py-2 text-xs'
  const variants = {
    primary: 'bg-[#1F2B6D] hover:bg-[#182258] text-white active:scale-[0.98]',
    outline:
      'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1F2B6D] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-[0.98]',
    ghost:
      'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800',
  }
  return (
    <button className={`${base} ${sizes} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
