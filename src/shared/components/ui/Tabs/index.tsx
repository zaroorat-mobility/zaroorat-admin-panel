import React, { createContext, useContext, useState } from 'react'
import { cn } from '@/shared/utils'

interface TabsContextType {
  value?: string
  onValueChange?: (value: string) => void
}

const TabsContext = createContext<TabsContextType>({})

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

export const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  value: externalValue,
  onValueChange,
  className = '',
  children,
  ...props
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue || '')
  const activeValue = externalValue !== undefined ? externalValue : internalValue

  const handleValueChange = (val: string) => {
    if (externalValue === undefined) {
      setInternalValue(val)
    }
    onValueChange?.(val)
  }

  return (
    <TabsContext.Provider value={{ value: activeValue, onValueChange: handleValueChange }}>
      <div className={cn("flex flex-col gap-4", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const TabsList: React.FC<TabsListProps> = ({ className = '', children, ...props }) => {
  return (
    <div
      className={cn(
        "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 inline-flex h-9 w-fit items-center justify-center rounded-xl p-[3px] flex gap-1",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
  children: React.ReactNode
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ className = '', value, children, ...props }) => {
  const context = useContext(TabsContext)
  const isActive = context.value === value

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => context.onValueChange?.(value)}
      className={cn(
        "inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-lg border border-transparent px-3 py-1 text-sm font-medium whitespace-nowrap transition-all cursor-pointer select-none",
        isActive
          ? "bg-primary text-white shadow-sm hover:bg-primary hover:text-white"
          : "bg-transparent text-muted-foreground hover:bg-primary/[0.08] hover:text-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  children: React.ReactNode
}

export const TabsContent: React.FC<TabsContentProps> = ({ className = '', value, children, ...props }) => {
  const context = useContext(TabsContext)
  const isActive = context.value === value

  if (!isActive) return null

  return (
    <div
      role="tabpanel"
      className={cn("flex-1 outline-none animate-fadeIn", className)}
      {...props}
    >
      {children}
    </div>
  )
}
export default Tabs
