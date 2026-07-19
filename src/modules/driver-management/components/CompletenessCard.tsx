import React from 'react'
import { Check } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'

interface ProgressSection {
  label: string
  progress: number
  complete: boolean
  description: string
}

interface CompletenessCardProps {
  percentage: number
  sections: ProgressSection[]
  onSubmit: () => void
  onSaveDraft: () => void
  isPending?: boolean
  submitLabel?: string
  isValid?: boolean
}

export const CompletenessCard: React.FC<CompletenessCardProps> = ({
  percentage,
  sections,
  onSubmit,
  onSaveDraft,
  isPending = false,
  submitLabel = 'Submit For Review',
  isValid = false,
}) => {
  return (
    <Card className="premium-card">
      <CardHeader className="p-5 pb-3">
        <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
          KYC Profile Progress
        </CardTitle>
        <CardDescription className="text-xs">
          Completeness checks per registration section.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-5 space-y-5 text-center">
        
        {/* Circular completeness progress chart */}
        <div className="relative h-24 w-24 mx-auto flex items-center justify-center">
          <svg className="absolute top-0 left-0 h-full w-full -rotate-90" viewBox="0 0 96 96">
            <circle
              cx="48"
              cy="48"
              r="40"
              className="stroke-slate-100 dark:stroke-slate-800 fill-none"
              strokeWidth="6"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              className="stroke-primary fill-none transition-all duration-500 ease-out"
              strokeWidth="6"
              strokeDasharray="251"
              strokeDashoffset={251 - (251 * percentage) / 100}
              strokeLinecap="round"
            />
          </svg>
          <div className="text-center space-y-0.5">
            <span className="text-xl font-black text-text-primary">{percentage}%</span>
            <p className="text-[8px] uppercase tracking-wider text-muted-foreground font-semibold">Overall</p>
          </div>
        </div>

        {/* Progress breakdown checklist grouped by tabs */}
        <div className="space-y-3 pt-3 border-t border-border text-left">
          <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Required Tab Sections</span>
          <div className="space-y-3">
            {sections.map((section, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-350">{section.label}</span>
                  {section.complete ? (
                    <Check className="h-4 w-4 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 rounded-full p-0.5" />
                  ) : (
                    <span className="text-[10px] text-muted-foreground font-medium">{section.progress}%</span>
                  )}
                </div>
                {/* Custom progress mini line */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${section.progress}%` }}
                  />
                </div>
                <p className="text-[9px] text-muted-foreground">{section.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Save Draft Trigger Button */}
        <div className="pt-3 border-t border-border flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onSaveDraft}
            disabled={isPending}
            className="w-full h-8 text-[11px] font-semibold border-border hover:bg-slate-50 dark:hover:bg-slate-800 gap-1.5 rounded-lg"
          >
            Save Draft
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onSubmit}
            loading={isPending}
            disabled={isPending || !isValid}
            className="w-full h-9 text-[11px] font-bold shadow-sm gap-1.5 rounded-lg"
          >
            {submitLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
