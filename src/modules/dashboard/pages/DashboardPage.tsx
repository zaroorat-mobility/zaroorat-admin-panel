import React, { useState, useEffect } from 'react'
import { 
  Users, Car, ShieldAlert, ShieldCheck, ArrowUpRight, ArrowDownRight, 
  MoreHorizontal, CheckCircle2, XCircle, UserPlus, Clock, Play, 
  TrendingUp, Activity, GraduationCap, MapPin 
} from 'lucide-react'
import { useDashboardData } from '../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { ChartPlaceholder } from '@/shared/components/charts'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { Button } from '@/shared/components/ui/Button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/Table'
import { useNavigate } from 'react-router-dom'

interface LiveFeedRide {
  id: string
  rider: string
  driver: string
  zone: string
  status: string
  amount: number
  time: string
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { isLoading } = useDashboardData()
  const [earningsPeriod, setEarningsPeriod] = useState<'today' | 'week' | 'month'>('today')

  // Live ride feed simulator state
  const [liveFeed, setLiveFeed] = useState<LiveFeedRide[]>([
    { id: 'R-9812', rider: 'Shreya Iyer', driver: 'Rajesh Kumar', zone: 'Indiranagar', status: 'IN_PROGRESS', amount: 350.0, time: 'Just now' },
    { id: 'R-9811', rider: 'Alok Singh', driver: 'Sunil Verma', zone: 'Koramangala', status: 'SEARCHING', amount: 120.0, time: '1 min ago' },
    { id: 'R-9810', rider: 'Devendra Pal', driver: 'Unassigned', zone: 'Whitefield', status: 'REQUESTED', amount: 210.0, time: '2 mins ago' },
    { id: 'R-9809', rider: 'Amit Verma', driver: 'Harish Sen', zone: 'MG Road', status: 'ARRIVED', amount: 180.0, time: '4 mins ago' },
    { id: 'R-9808', rider: 'Rohan Shah', driver: 'Vikram Pal', zone: 'HSR Layout', status: 'COMPLETED', amount: 410.0, time: '8 mins ago' }
  ])

  useEffect(() => {
    const interval = setInterval(() => {
      const riders = ['Meera Nair', 'Kabir Das', 'Preeti Rao', 'Rahul Sen', 'Sneha Paul']
      const drivers = ['Gaurav Pal', 'Vijay Singh', 'Satish Yadav', 'Mohit Das', 'Anil K.']
      const zones = ['Indiranagar', 'Koramangala', 'Whitefield', 'Electronic City', 'Jayanagar']
      const statuses = ['REQUESTED', 'SEARCHING', 'IN_PROGRESS', 'COMPLETED']
      
      const newRide: LiveFeedRide = {
        id: `R-${Math.floor(1000 + Math.random() * 9000)}`,
        rider: riders[Math.floor(Math.random() * riders.length)],
        driver: Math.random() > 0.3 ? drivers[Math.floor(Math.random() * drivers.length)] : 'Unassigned',
        zone: zones[Math.floor(Math.random() * zones.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        amount: Math.floor(80 + Math.random() * 400),
        time: 'Just now'
      }

      setLiveFeed(prev => {
        const updated = prev.map(item => {
          if (item.time === 'Just now') return { ...item, time: '1 min ago' }
          if (item.time.includes('min ago')) {
            const mins = parseInt(item.time) + 1
            return { ...item, time: `${mins} mins ago` }
          }
          return item
        })
        return [newRide, ...updated.slice(0, 4)]
      })
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  // KPI mapping
  const kpiItems = [
    {
      title: 'Total Riders',
      value: '24,580',
      growth: '+12.4%',
      isPositive: true,
      icon: Users,
      color: 'text-[#2B317A] bg-[#2B317A]/[0.08] border-[#2B317A]/10 dark:text-[#4F5FBF] dark:bg-[#4F5FBF]/[0.15]',
      path: '/riders',
    },
    {
      title: 'Total Drivers',
      value: '4,820',
      growth: '+8.1%',
      isPositive: true,
      icon: Car,
      color: 'text-[#22C55E] bg-[#22C55E]/[0.08] border-[#22C55E]/10 dark:text-[#22C55E] dark:bg-[#22C55E]/[0.15]',
      path: '/driver-management/drivers',
    },
    {
      title: 'Pending KYC',
      value: '18',
      growth: '-4.2%',
      isPositive: true,
      icon: ShieldAlert,
      color: 'text-[#F59E0B] bg-[#F59E0B]/[0.08] border-[#F59E0B]/10 dark:text-[#F59E0B] dark:bg-[#F59E0B]/[0.15]',
      path: '/driver-management/applications',
    },
    {
      title: 'Verified Drivers',
      value: '4,150',
      growth: '+9.3%',
      isPositive: true,
      icon: ShieldCheck,
      color: 'text-[#3B82F6] bg-[#3B82F6]/[0.08] border-[#3B82F6]/10 dark:text-[#3B82F6] dark:bg-[#3B82F6]/[0.15]',
      path: '/driver-management/drivers',
    },
  ]

  // School KPIs
  const schoolKpiItems = [
    { title: 'Active Schools', value: '12', icon: GraduationCap, color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/20' },
    { title: 'Live Routes', value: '34', icon: MapPin, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/20' },
    { title: 'Students Enrolled', value: '450', icon: Users, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' },
    { title: 'Buses On Route', value: '28', icon: Car, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/20' }
  ]

  const recentDrivers = [
    { id: '1', name: 'Rajesh Kumar', phone: '9876543210', vehicle: 'Maruti Dzire (Cab)', status: 'approved', date: '2026-07-24' },
    { id: '2', name: 'Sunil Verma', phone: '9876543211', vehicle: 'Bajaj RE (Auto)', status: 'pending', date: '2026-07-24' },
    { id: '3', name: 'Devendra Pal', phone: '9876543212', vehicle: 'Hero Splendor (Bike)', status: 'pending', date: '2026-07-23' },
    { id: '4', name: 'Amit Kumar', phone: '9876543213', vehicle: 'Hyundai Aura (Cab)', status: 'rejected', date: '2026-07-22' },
  ]

  const activities = [
    { type: 'registered', title: 'New Driver Registered', desc: 'Sunil Verma submitted profile details for Bajaj RE Auto.', time: '15 mins ago', icon: Car, color: 'text-blue-650 bg-blue-50' },
    { type: 'approved', title: 'KYC Approved', desc: 'Operator (Alok S) approved license documents for Rajesh Kumar.', time: '1 hour ago', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
    { type: 'rejected', title: 'Driver Rejected', desc: 'License document found expired for driver Amit Kumar.', time: '3 hours ago', icon: XCircle, color: 'text-rose-600 bg-rose-50' },
    { type: 'signup', title: 'New Rider Signup', desc: 'Customer Shreya Iyer registered email shreya.iyer@gmail.com.', time: '5 hours ago', icon: UserPlus, color: 'text-indigo-650 bg-indigo-50' },
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Operations Dashboard"
        description="Real-time performance analytics, driver KYC queues, and booking parameters."
      />

      {/* RIDE OVERVIEW (TODAY) PANEL */}
      <div className="bg-surface rounded-xl border border-border p-5 text-left shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Ride Overview (Today)</h3>
            <p className="text-[10px] text-muted-foreground">What is happening right now across the mobility network.</p>
          </div>
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            onClick={() => navigate('/operations/ride-monitor?tab=live')}
            className="flex items-center justify-between p-4 bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-xl cursor-pointer transition-all hover:scale-[1.01]"
          >
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-450 tracking-wider">Ongoing Rides</span>
              <p className="text-2xl font-black text-emerald-800 dark:text-emerald-300">42</p>
            </div>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
              <Play className="h-5 w-5 animate-pulse" />
            </div>
          </div>

          <div 
            onClick={() => navigate('/operations/ride-monitor?tab=live')}
            className="flex items-center justify-between p-4 bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-950/10 dark:hover:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl cursor-pointer transition-all hover:scale-[1.01]"
          >
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-450 tracking-wider">Scheduled Rides</span>
              <p className="text-2xl font-black text-indigo-800 dark:text-indigo-300">18</p>
            </div>
            <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded-lg">
              <Clock className="h-5 w-5" />
            </div>
          </div>

          <div 
            onClick={() => navigate('/operations/ride-monitor?tab=completed')}
            className="flex items-center justify-between p-4 bg-sky-50/50 hover:bg-sky-50 dark:bg-sky-950/10 dark:hover:bg-sky-950/20 border border-sky-100 dark:border-sky-900/50 rounded-xl cursor-pointer transition-all hover:scale-[1.01]"
          >
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-sky-700 dark:text-sky-450 tracking-wider">Completed Rides</span>
              <p className="text-2xl font-black text-sky-800 dark:text-sky-300">156</p>
            </div>
            <div className="p-2 bg-sky-500/10 text-sky-600 rounded-lg">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* TOP KPI SECTION */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpiItems.map((kpi, index) => {
          const Icon = kpi.icon
          return (
            <Card
              key={index}
              isHoverable
              className="cursor-pointer transition-transform hover:scale-[1.01]"
              onClick={() => navigate(kpi.path)}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className={`p-2.5 rounded-xl border ${kpi.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 border border-slate-200/40">
                    <span>{kpi.growth}</span>
                    {kpi.isPositive ? (
                      <ArrowUpRight className="h-3.5 w-3.5 text-emerald-550" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5 text-rose-550" />
                    )}
                  </div>
                </div>
                <div className="mt-4 space-y-1 text-left">
                  <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">{kpi.title}</p>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-2xl font-extrabold text-text-primary">
                      {isLoading ? '...' : kpi.value}
                    </h3>
                    <div className="flex gap-0.5 items-end h-6">
                      <div className="w-[3px] bg-slate-200 dark:bg-slate-800 h-[30%] rounded-full" />
                      <div className="w-[3px] bg-slate-200 dark:bg-slate-800 h-[50%] rounded-full" />
                      <div className="w-[3px] bg-slate-200 dark:bg-slate-800 h-[40%] rounded-full" />
                      <div className="w-[3px] bg-primary h-[80%] rounded-full" />
                      <div className="w-[3px] bg-primary h-[95%] rounded-full" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* NEW: EARNINGS & LIVE DRIVER STATUS BLOCK */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        {/* Earnings Summary Card */}
        <div className="lg:col-span-2 bg-surface rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Earnings Summary</h3>
              <p className="text-[10px] text-muted-foreground">Historical billing receipts generated across platforms.</p>
            </div>
            <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-border">
              {(['today', 'week', 'month'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setEarningsPeriod(p)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md capitalize transition-all cursor-pointer ${
                    earningsPeriod === p 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gross Value Collections</span>
              <h2 className="text-3xl font-black text-slate-850 dark:text-white mt-1">
                {earningsPeriod === 'today' ? '₹14,850.00' : earningsPeriod === 'week' ? '₹98,420.00' : '₹412,500.00'}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 border border-emerald-100 text-xs font-bold">
              <TrendingUp className="h-4.5 w-4.5" />
              <span>+6.2% vs last cycle</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-xs font-semibold">
            <div>
              <p className="text-slate-450 text-[10px] uppercase">Direct Card/UPI</p>
              <p className="text-slate-800 dark:text-white mt-0.5 font-bold">72% collections</p>
            </div>
            <div>
              <p className="text-slate-450 text-[10px] uppercase">Cash Settlements</p>
              <p className="text-slate-800 dark:text-white mt-0.5 font-bold">20% collections</p>
            </div>
            <div>
              <p className="text-slate-450 text-[10px] uppercase">Wallet Topups</p>
              <p className="text-slate-800 dark:text-white mt-0.5 font-bold">8% collections</p>
            </div>
          </div>
        </div>

        {/* Live Driver Status Strip */}
        <div className="bg-surface rounded-xl border border-border p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Live Driver Activity</h3>
            <p className="text-[10px] text-muted-foreground">Headcount telemetry refreshed every 30s.</p>
          </div>

          <div className="space-y-3 mt-2">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900 border border-border rounded-lg">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-655">Available (Online)</span>
              </div>
              <span className="text-sm font-black text-slate-800 dark:text-white">142</span>
            </div>
            
            <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900 border border-border rounded-lg">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-xs font-bold text-slate-655">On Active Trip (Busy)</span>
              </div>
              <span className="text-sm font-black text-slate-800 dark:text-white">88</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900 border border-border rounded-lg">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="text-xs font-bold text-slate-655">Offline</span>
              </div>
              <span className="text-sm font-black text-slate-800 dark:text-white">54</span>
            </div>
          </div>
        </div>
      </div>

      {/* ANALYTICS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartPlaceholder title="Ride Booking Trends (Weekly)" height="h-72" />
        </div>
        <div>
          <ChartPlaceholder title="Driver Verification Status Distribution" height="h-72" />
        </div>
      </div>

      {/* NEW: SCHOOL MOBILITY PANEL & LIVE RIDE MONITORING FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        {/* School Mode KPI Grid */}
        <div className="lg:col-span-2 bg-surface rounded-xl border border-border p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">School Mobility Statistics</h3>
            <p className="text-[10px] text-muted-foreground">Key performance metrics for the school mode vertical.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {schoolKpiItems.map((skpi, idx) => {
              const Icon = skpi.icon
              return (
                <div key={idx} className="p-4 border border-border rounded-xl bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900/50 hover:scale-[1.01] transition-transform">
                  <div className={`p-2 w-9 rounded-lg mb-3 ${skpi.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">{skpi.title}</span>
                  <p className="text-xl font-black text-slate-850 dark:text-white mt-0.5">{skpi.value}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Live Ride Monitoring Feed Box */}
        <div className="bg-surface rounded-xl border border-border p-5 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Live Telemetry Feed</h3>
              <p className="text-[10px] text-muted-foreground">Streaming ride dispatch status logs.</p>
            </div>
            <Activity className="h-4.5 w-4.5 text-primary animate-pulse" />
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[220px] flex-1">
            {liveFeed.map((ride, idx) => (
              <div 
                key={idx} 
                onClick={() => navigate(`/operations/ride-monitor/${ride.id}`)}
                className="p-3 border border-border hover:border-primary/20 bg-slate-50 dark:bg-slate-900/40 rounded-lg space-y-1.5 cursor-pointer text-xs transition-all hover:translate-x-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-extrabold text-primary">{ride.id}</span>
                  <span className="text-[8px] text-muted-foreground font-mono">{ride.time}</span>
                </div>
                <div className="grid grid-cols-2 text-[10px] text-slate-655">
                  <div>Rider: <span className="font-bold text-slate-850 dark:text-white">{ride.rider}</span></div>
                  <div>Driver: <span className="font-bold text-slate-850 dark:text-slate-350">{ride.driver}</span></div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-dashed border-border text-[9px]">
                  <span>Zone: <span className="font-bold">{ride.zone}</span></span>
                  <span className="px-1.5 py-0.5 font-bold uppercase rounded bg-slate-200 dark:bg-slate-800">{ride.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* OPERATIONS AND ACTIVITY SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operations: Recent Driver Registrations Table */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider text-left">Recent Driver Registrations</h3>
            <Button variant="ghost" size="sm" className="text-xs font-semibold text-primary" onClick={() => navigate('/driver-management/drivers')}>
              View All
            </Button>
          </div>
          
          <div className="rounded-xl border border-border bg-brand-surface overflow-hidden shadow-soft text-left">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentDrivers.map((driver) => (
                  <TableRow key={driver.id} className="cursor-pointer animate-fade-in" onClick={() => navigate(`/driver-management/drivers/${driver.id}`)}>
                    <TableCell className="font-semibold">{driver.name}</TableCell>
                    <TableCell>{driver.phone}</TableCell>
                    <TableCell>{driver.vehicle}</TableCell>
                    <TableCell>
                      <StatusBadge status={driver.status} />
                    </TableCell>
                    <TableCell>{driver.date}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-text-secondary" onClick={() => navigate(`/driver-management/drivers/${driver.id}`)}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Activity Section: Recent Activity Timeline */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider px-1 text-left">Recent Activity Timeline</h3>
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
    </PageWrapper>
  )
}

export default DashboardPage
