import React from 'react'

export interface ChartPlaceholderProps {
  title: string
  height?: string
}

/**
 * Enterprise Chart Placeholder Component
 */
export const ChartPlaceholder: React.FC<ChartPlaceholderProps> = ({ title, height = 'h-64' }) => {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 dark:border-dark-800 dark:bg-dark-900 shadow-sm">
      <h4 className="text-sm font-semibold text-slate-800 dark:text-dark-200 mb-4">{title}</h4>
      <div className={`flex items-end justify-between gap-2 bg-slate-50 dark:bg-dark-950 p-6 rounded-lg ${height}`}>
        {/* Simple visual bar indicators representing statistics */}
        <div className="w-full bg-brand-500/20 hover:bg-brand-500 rounded-t h-[30%] transition-all duration-300" />
        <div className="w-full bg-brand-500/20 hover:bg-brand-500 rounded-t h-[45%] transition-all duration-300" />
        <div className="w-full bg-brand-500/20 hover:bg-brand-500 rounded-t h-[25%] transition-all duration-300" />
        <div className="w-full bg-brand-500/20 hover:bg-brand-500 rounded-t h-[60%] transition-all duration-300" />
        <div className="w-full bg-brand-500/20 hover:bg-brand-500 rounded-t h-[80%] transition-all duration-300" />
        <div className="w-full bg-brand-500/20 hover:bg-brand-500 rounded-t h-[55%] transition-all duration-300" />
        <div className="w-full bg-brand-500/20 hover:bg-brand-500 rounded-t h-[90%] transition-all duration-300" />
      </div>
    </div>
  )
}
export default ChartPlaceholder
