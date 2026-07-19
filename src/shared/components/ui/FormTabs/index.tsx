import React from 'react'

export interface FormTabItem {
  id: string
  label: string
}

export interface FormTabsProps {
  activeTab: string
  onChange: (tabId: any) => void
  tabs: FormTabItem[]
}

export const FormTabs: React.FC<FormTabsProps> = ({ activeTab, onChange, tabs }) => {
  return (
    <div className="flex border-b border-border space-x-6 pb-2.5 flex-wrap gap-y-2 mb-4 print:hidden text-left">
      {tabs.map((tab, idx) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 pb-2 text-xs font-bold capitalize border-b-2 transition-all ${
            activeTab === tab.id
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-[10px] ${
            activeTab === tab.id ? 'bg-primary text-white' : 'bg-slate-100 text-muted-foreground'
          }`}>
            {idx + 1}
          </span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  )
}

export default FormTabs
