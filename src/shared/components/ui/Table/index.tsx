import React from 'react'

export const Table: React.FC<React.HTMLAttributes<HTMLTableElement>> = ({
  className = '',
  ...props
}) => (
  <div className="w-full overflow-x-auto">
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
}) => (
  <th className={`px-6 py-3.5 font-bold text-foreground ${className}`} {...props} />
)

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  className = '',
  ...props
}) => <td className={`px-6 py-4 whitespace-nowrap text-foreground ${className}`} {...props} />
