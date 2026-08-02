import React, { useState, useEffect } from 'react'
import { 
  Car, CheckCircle2, XCircle, UserPlus, MapPin 
} from 'lucide-react'
import { useDashboardData } from '../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { ChartPlaceholder } from '@/shared/components/charts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/Table'
import { useNavigate } from 'react-router-dom'

interface TelemetryDriver {
  id: string
  name: string
  vehicleId: string
  vehicleName: string
  location: string
  status: 'online' | 'on_trip' | 'idle' | 'offline'
  mode: 'ride' | 'school'
  speed: number
  heading: string
  tripId: string
  lastPing: string
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  useDashboardData()

  // High-fidelity Live Telemetry Feed simulation state
  const [telemetryDrivers, setTelemetryDrivers] = useState<TelemetryDriver[]>([
    { id: 'DRV-102', name: 'Rajesh Kumar', vehicleId: 'KA-01-MJ-4320', vehicleName: 'Maruti Dzire', location: '12.9716° N, 77.5946° E', status: 'on_trip', mode: 'ride', speed: 42, heading: 'NE', tripId: 'T-9812', lastPing: 'Just now' },
    { id: 'DRV-205', name: 'Sunil Verma', vehicleId: 'KA-03-RE-8891', vehicleName: 'Bajaj RE Auto', location: '12.9304° N, 77.6784° E', status: 'online', mode: 'ride', speed: 28, heading: 'W', tripId: '—', lastPing: '2s ago' },
    { id: 'DRV-110', name: 'Devendra Pal', vehicleId: 'KA-05-HS-1120', vehicleName: 'Hero Splendor', location: '12.9562° N, 77.7019° E', status: 'idle', mode: 'school', speed: 0, heading: 'S', tripId: '—', lastPing: '5s ago' },
    { id: 'DRV-118', name: 'Amit Verma', vehicleId: 'KA-02-HY-7762', vehicleName: 'Hyundai Aura', location: '12.9801° N, 77.6012° E', status: 'on_trip', mode: 'school', speed: 50, heading: 'N', tripId: 'T-9809', lastPing: 'Just now' },
    { id: 'DRV-304', name: 'Vikram Pal', vehicleId: 'KA-04-DZ-5501', vehicleName: 'Maruti Dzire', location: '12.9221° N, 77.6200° E', status: 'offline', mode: 'ride', speed: 0, heading: '—', tripId: '—', lastPing: '12m ago' }
  ])

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetryDrivers(prev =>
        prev.map(drv => {
          if (drv.status === 'offline') return drv

          // Randomly change speed and heading slightly
          const speedChange = Math.floor((Math.random() - 0.5) * 10)
          const newSpeed = Math.max(0, Math.min(80, drv.speed + speedChange))
          const headings = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
          const newHeading = Math.random() > 0.7 ? headings[Math.floor(Math.random() * headings.length)] : drv.heading

          // Adjust coordinates slightly
          const coords = drv.location.split(', ')
          const lat = parseFloat(coords[0]) + (Math.random() - 0.5) * 0.002
          const lng = parseFloat(coords[1]) + (Math.random() - 0.5) * 0.002
          const newLocation = `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`

          // Update ping
          const pings = ['Just now', '1s ago', '2s ago', '3s ago']
          const newPing = pings[Math.floor(Math.random() * pings.length)]

          return {
            ...drv,
            location: newLocation,
            speed: newSpeed,
            heading: newHeading,
            lastPing: newPing
          }
        })
      )
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  const activities = [
    { type: 'registered', title: 'New Driver Registered', desc: 'Sunil Verma submitted profile details for Bajaj RE Auto.', time: '15 mins ago', icon: Car, color: 'text-blue-650 bg-blue-50' },
    { type: 'approved', title: 'KYC Approved', desc: 'Operator (Alok S) approved license documents for Rajesh Kumar.', time: '1 hour ago', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
    { type: 'rejected', title: 'Driver Rejected', desc: 'License document found expired for driver Amit Kumar.', time: '3 hours ago', icon: XCircle, color: 'text-rose-600 bg-rose-50' },
    { type: 'signup', title: 'New Rider Signup', desc: 'Customer Shreya Iyer registered email shreya.iyer@gmail.com.', time: '5 hours ago', icon: UserPlus, color: 'text-indigo-650 bg-indigo-50' },
  ]

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'on_trip':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/50'
      case 'online':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50'
      case 'idle':
        return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/50'
      default:
        return 'bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'
    }
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Operations Dashboard"
        description="Real-time performance analytics, live driver telemetries, and system dispatch monitoring feeds."
      />

      <div className="space-y-6 text-left">
        {/* ANALYTICS SECTION - FULL WIDTH RIDE BOOKING WEEKLY */}
        <div className="w-full">
          <ChartPlaceholder title="Ride Booking Trends (Weekly)" height="h-72" />
        </div>

        {/* TELEMETRY & TIMELINE SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Telemetry Feed (occupies 2/3 of grid) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Live Telemetry Feed</h3>
              </div>
              <span className="text-[10px] text-muted-foreground font-semibold">Active Vehicles: {telemetryDrivers.filter(d => d.status !== 'offline').length}</span>
            </div>

            <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Driver & Vehicle</TableHead>
                    <TableHead>Location Coordinates</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Mode</TableHead>
                    <TableHead className="text-right">Speed & Heading</TableHead>
                    <TableHead className="text-center">Active Trip</TableHead>
                    <TableHead className="text-right">Last Ping</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {telemetryDrivers.map((drv) => (
                    <TableRow key={drv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <TableCell className="py-3">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-100">{drv.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{drv.vehicleName} · {drv.vehicleId}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-slate-655 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          <span>{drv.location}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[9px] border font-bold uppercase tracking-wider ${getStatusStyle(drv.status)}`}>
                          {drv.status.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                          drv.mode === 'school' ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/20 dark:text-violet-400' : 'bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-400'
                        }`}>
                          {drv.mode}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {drv.status === 'offline' ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <div>
                            <span className="text-xs text-slate-800 dark:text-slate-200">{drv.speed} km/h</span>
                            <span className="text-[10px] text-muted-foreground font-mono ml-1">({drv.heading})</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {drv.tripId !== '—' ? (
                          <span 
                            onClick={() => navigate(`/operations/ride-monitor?query=${drv.tripId}`)}
                            className="text-xs font-mono font-bold text-primary hover:underline cursor-pointer"
                          >
                            {drv.tripId}
                          </span>
                        ) : (
                          <span className="text-slate-450">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-[10px] text-muted-foreground font-mono">
                        {drv.lastPing}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Recent Activity Timeline (occupies 1/3 of grid) */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider px-1">Recent Activity Timeline</h3>
            <Card>
              <CardContent className="p-6 space-y-6">
                {activities.map((act, index) => {
                  const Icon = act.icon
                  return (
                    <div key={index} className="flex gap-4 relative group last:pb-0 pb-1 text-left">
                      {index < activities.length - 1 && (
                        <div className="absolute left-[17px] top-9 bottom-[-17px] w-0.5 bg-brand-border group-hover:bg-slate-300 transition-colors" />
                      )}
                      <div className={`flex-shrink-0 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 ${act.color} shadow-soft`}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-text-primary">{act.title}</p>
                          <span className="text-[10px] text-text-secondary whitespace-nowrap">{act.time}</span>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed">{act.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}

export default DashboardPage
