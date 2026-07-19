import React from 'react'
import type { SettlementTimelineEvent } from '../types'
import { CheckCircle, Clock, AlertCircle, XCircle, PlayCircle, FileText } from 'lucide-react'

interface Props { events: SettlementTimelineEvent[] }

const iconFor = (action: string) => {
  if (action.includes('Generated') || action.includes('Created')) return <FileText className="h-4 w-4 text-blue-500" />
  if (action.includes('Approved')) return <CheckCircle className="h-4 w-4 text-emerald-500" />
  if (action.includes('Processing')) return <PlayCircle className="h-4 w-4 text-indigo-500" />
  if (action.includes('Completed')) return <CheckCircle className="h-4 w-4 text-emerald-600" />
  if (action.includes('Failed')) return <XCircle className="h-4 w-4 text-rose-500" />
  return <Clock className="h-4 w-4 text-slate-400" />
}

export const SettlementTimeline: React.FC<Props> = ({ events }) => {
  if (!events?.length) return (
    <div className="flex items-center gap-2 text-slate-400 text-xs py-8 justify-center">
      <AlertCircle className="h-4 w-4" />
      No timeline events yet.
    </div>
  )

  return (
    <div className="relative pl-6 space-y-0">
      {events.map((ev, i) => (
        <div key={i} className="relative pb-6 last:pb-0">
          {/* vertical line */}
          {i < events.length - 1 && (
            <span className="absolute left-[-15px] top-5 bottom-0 w-px bg-border" />
          )}
          <div className="absolute left-[-20px] top-0.5">
            {iconFor(ev.action)}
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3 border border-border">
            <p className="font-black text-slate-800 dark:text-white text-xs">{ev.action}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              By <span className="font-bold text-slate-700 dark:text-slate-300">{ev.actor}</span>
              {' · '}
              {new Date(ev.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
            {ev.notes && <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed border-t border-border pt-1.5">{ev.notes}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}

export default SettlementTimeline
