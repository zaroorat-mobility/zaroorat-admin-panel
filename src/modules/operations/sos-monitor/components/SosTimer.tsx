import React, { useEffect, useState } from 'react'

interface SosTimerProps {
  timeRaised: string
  status: 'open' | 'acknowledged' | 'escalated' | 'resolved'
}

export const SosTimer: React.FC<SosTimerProps> = ({ timeRaised, status }) => {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    // If resolved or acknowledged, display fixed elapsed time
    if (status === 'resolved' || status === 'acknowledged') {
      return
    }

    const calculateElapsed = () => {
      const diff = Date.now() - new Date(timeRaised).getTime()
      setElapsed(Math.max(0, Math.floor(diff / 1000)))
    }

    calculateElapsed()
    const timer = setInterval(calculateElapsed, 1000)

    return () => clearInterval(timer)
  }, [timeRaised, status])

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const remain = secs % 60
    return `${mins.toString().padStart(2, '0')}:${remain.toString().padStart(2, '0')}`
  }

  // Determine warning styles
  const isOverTime = elapsed > 60 && (status === 'open' || status === 'escalated')

  return (
    <span className={`font-mono text-xs font-black px-2 py-0.5 rounded ${
      status === 'resolved'
        ? 'text-slate-400 bg-slate-50 border border-slate-100 dark:bg-slate-900'
        : isOverTime
        ? 'text-rose-600 bg-rose-50 border border-rose-100 animate-pulse dark:bg-rose-950/20 dark:border-rose-900'
        : 'text-amber-600 bg-amber-50 border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900'
    }`}>
      {formatTime(elapsed)}
    </span>
  )
}

export default SosTimer
