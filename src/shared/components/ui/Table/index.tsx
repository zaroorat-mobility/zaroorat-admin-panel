import React from 'react'

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  containerClassName?: string
}

export const Table: React.FC<TableProps> = ({
  className = '',
  containerClassName = '',
  ...props
}) => (
  <div className={`w-full ${containerClassName || 'overflow-x-auto'}`}>
    <table className={`w-full border-collapse text-left text-sm align-middle ${className}`} {...props} />
  </div>
)

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className = '',
  ...props
}) => (
  <thead className={`bg-slate-50/75 border-b border-border dark:bg-slate-900/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground ${className}`} {...props} />
)

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className = '',
  ...props
}) => <tbody className={`divide-y divide-border bg-white dark:bg-slate-900 ${className}`} {...props} />

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  className = '',
  ...props
}) => (
  <tr
    className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors ${className}`}
    {...props}
  />
)

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  className = '',
  ...props
}) => {
  const hasPadding = className.includes('p-') || className.includes('px-') || className.includes('py-') || className.includes('!p')
  return (
    <th className={`${hasPadding ? '' : 'px-6 py-3.5 '}font-bold text-foreground ${className}`} {...props} />
  )
}

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  className = '',
  ...props
}) => {
  const hasPadding = className.includes('p-') || className.includes('px-') || className.includes('py-') || className.includes('!p')
  return (
    <td className={`${hasPadding ? '' : 'px-6 py-4 '}whitespace-nowrap text-foreground ${className}`} {...props} />
  )
}
