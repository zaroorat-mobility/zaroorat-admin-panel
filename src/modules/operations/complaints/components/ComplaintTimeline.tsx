import React from 'react'
import type { ComplaintTimelineEvent } from '../types'
import { Clock, User, CheckCircle2, AlertCircle } from 'lucide-react'

interface ComplaintTimelineProps {
  timeline: ComplaintTimelineEvent[]
}

export const ComplaintTimeline: React.FC<ComplaintTimelineProps> = ({ timeline }) => {
  const getIcon = (action: string) => {
    if (action.includes('Created')) return <AlertCircle className="h-4 w-4 text-blue-500" />
    if (action.includes('Assigned')) return <User className="h-4 w-4 text-indigo-500" />
    if (action.includes('Resolved')) return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    return <Clock className="h-4 w-4 text-slate-400" />
  }

  // Sort chronologically
  const sorted = [...timeline].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  return (
    <div className="relative border-l border-slate-200 dark:border-slate-800 ml-3 pl-6 space-y-6 text-left text-xs py-2">
      {sorted.map((event, idx) => (
        <div key={idx} className="relative">
          {/* timeline marker */}
          <span className="absolute -left-[34px] top-0.5 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full p-1.5">
            {getIcon(event.action)}
          </span>

          <div className="space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <strong className="text-slate-850 dark:text-white uppercase tracking-wider text-[10px]">
                {event.action}
              </strong>
              <span className="font-mono text-[9px] text-slate-400">
                {new Date(event.timestamp).toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">Actor: {event.actor}</p>
            {event.notes && <p className="text-slate-500 font-medium leading-relaxed italic">"{event.notes}"</p>}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ComplaintTimeline
