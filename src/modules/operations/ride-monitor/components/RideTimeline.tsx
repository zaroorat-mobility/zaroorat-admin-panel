import React from 'react'
import type { RideTimelineEvent } from '../types'
import { Clock, CheckCircle2, User, HelpCircle, MapPin, DollarSign, XCircle } from 'lucide-react'

interface RideTimelineProps {
  timeline: RideTimelineEvent[]
}

export const RideTimeline: React.FC<RideTimelineProps> = ({ timeline }) => {
  const getIcon = (stage: string) => {
    switch (stage) {
      case 'REQUESTED':
        return <HelpCircle className="h-4 w-4 text-blue-500" />
      case 'DRIVER_ASSIGNED':
        return <User className="h-4 w-4 text-indigo-500" />
      case 'DRIVER_ARRIVED':
        return <MapPin className="h-4 w-4 text-purple-500" />
      case 'OTP_VERIFIED':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case 'PAYMENT_PENDING':
        return <DollarSign className="h-4 w-4 text-amber-500" />
      case 'COMPLETED':
        return <CheckCircle2 className="h-4 w-4 text-slate-500" />
      case 'CANCELLED_BY_RIDER':
      case 'CANCELLED_BY_DRIVER':
      case 'NO_DRIVER_FOUND':
        return <XCircle className="h-4 w-4 text-rose-500" />
      default:
        return <Clock className="h-4 w-4 text-slate-400" />
    }
  }

  // Sort timeline chronologically
  const sorted = [...timeline].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  return (
    <div className="relative border-l border-slate-200 dark:border-slate-800 ml-3 pl-6 space-y-6 text-left text-xs py-2">
      {sorted.map((event, idx) => (
        <div key={idx} className="relative">
          {/* Timeline marker */}
          <span className="absolute -left-[34px] top-0.5 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full p-1.5">
            {getIcon(event.stage)}
          </span>
          
          <div className="space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <strong className="text-slate-850 dark:text-white uppercase tracking-wider text-[10px]">
                {event.stage.replace(/_/g, ' ')}
              </strong>
              <span className="font-mono text-[9px] text-slate-400">
                {new Date(event.timestamp).toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-slate-500 font-medium leading-relaxed">{event.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default RideTimeline
