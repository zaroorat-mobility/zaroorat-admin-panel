import React from 'react'

export interface ChartBar {
  label: string
  value: number
}

export interface ChartPlaceholderProps {
  title: string
  height?: string
  bars?: ChartBar[]
}

/**
 * Enterprise Chart Placeholder Component
 */
export const ChartPlaceholder: React.FC<ChartPlaceholderProps> = ({ title, height = 'h-64', bars }) => {
  const maxValue = bars?.length ? Math.max(...bars.map((bar) => bar.value), 1) : 100

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 dark:border-dark-800 dark:bg-dark-900 shadow-sm">
      <h4 className="text-sm font-semibold text-slate-800 dark:text-dark-200 mb-4">{title}</h4>
      <div className={`flex items-end justify-between gap-2 bg-slate-50 dark:bg-dark-950 p-6 rounded-lg ${height}`}>
        {bars?.length ? (
          bars.map((bar) => (
            <div key={bar.label} className="flex flex-1 flex-col items-center gap-2 h-full justify-end">
              <div
                className="w-full bg-brand-500/20 hover:bg-brand-500 rounded-t transition-all duration-300"
                style={{ height: `${Math.max(8, (bar.value / maxValue) * 100)}%` }}
                title={`${bar.label}: ${bar.value.toLocaleString()}`}
              />
              <span className="text-[10px] text-muted-foreground font-medium">{bar.label}</span>
            </div>
          ))
        ) : (
          <>
            <div className="w-full bg-brand-500/20 hover:bg-brand-500 rounded-t h-[30%] transition-all duration-300" />
            <div className="w-full bg-brand-500/20 hover:bg-brand-500 rounded-t h-[45%] transition-all duration-300" />
            <div className="w-full bg-brand-500/20 hover:bg-brand-500 rounded-t h-[25%] transition-all duration-300" />
            <div className="w-full bg-brand-500/20 hover:bg-brand-500 rounded-t h-[60%] transition-all duration-300" />
            <div className="w-full bg-brand-500/20 hover:bg-brand-500 rounded-t h-[80%] transition-all duration-300" />
            <div className="w-full bg-brand-500/20 hover:bg-brand-500 rounded-t h-[55%] transition-all duration-300" />
            <div className="w-full bg-brand-500/20 hover:bg-brand-500 rounded-t h-[90%] transition-all duration-300" />
          </>
        )}
      </div>
    </div>
  )
}
export default ChartPlaceholder
