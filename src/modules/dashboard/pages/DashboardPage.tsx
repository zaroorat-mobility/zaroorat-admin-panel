import React from 'react'
import { Users, Car, ShieldAlert, ShieldCheck, ArrowUpRight, ArrowDownRight, MoreHorizontal, CheckCircle2, XCircle, UserPlus } from 'lucide-react'
import { useDashboardData } from '../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { ChartPlaceholder } from '@/shared/components/charts'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { Button } from '@/shared/components/ui/Button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/Table'
import { useNavigate } from 'react-router-dom'

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { isLoading } = useDashboardData()

  // Top KPI section mapping to UI requirements
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
      path: '/drivers',
    },
    {
      title: 'Pending KYC',
      value: '18',
      growth: '-4.2%',
      isPositive: true, // Decreasing pending KYC queue is a positive trend
      icon: ShieldAlert,
      color: 'text-[#F59E0B] bg-[#F59E0B]/[0.08] border-[#F59E0B]/10 dark:text-[#F59E0B] dark:bg-[#F59E0B]/[0.15]',
      path: '/verification',
    },
    {
      title: 'Verified Drivers',
      value: '4,150',
      growth: '+9.3%',
      isPositive: true,
      icon: ShieldCheck,
      color: 'text-[#3B82F6] bg-[#3B82F6]/[0.08] border-[#3B82F6]/10 dark:text-[#3B82F6] dark:bg-[#3B82F6]/[0.15]',
      path: '/drivers',
    },
  ]

  const recentDrivers = [
    { id: '1', name: 'Rajesh Kumar', phone: '9876543210', vehicle: 'Maruti Dzire (Sedan)', status: 'approved', date: '2026-07-14' },
    { id: '2', name: 'Sunil Verma', phone: '9876543211', vehicle: 'Bajaj RE (Auto)', status: 'pending', date: '2026-07-14' },
    { id: '3', name: 'Devendra Pal', phone: '9876543212', vehicle: 'Hero Splendor (Bike)', status: 'pending', date: '2026-07-13' },
    { id: '4', name: 'Amit Kumar', phone: '9876543213', vehicle: 'Hyundai Aura (Sedan)', status: 'rejected', date: '2026-07-12' },
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
                <div className="mt-4 space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">{kpi.title}</p>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-2xl font-extrabold text-text-primary">
                      {isLoading ? '...' : kpi.value}
                    </h3>
                    {/* Mini trend indicator element */}
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

      {/* ANALYTICS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartPlaceholder title="Ride Booking Trends (Weekly)" height="h-72" />
        </div>
        <div>
          <ChartPlaceholder title="Driver Verification Status Distribution" height="h-72" />
        </div>
      </div>

      {/* OPERATIONS AND ACTIVITY SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operations: Recent Registrations Table */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Recent Driver Registrations</h3>
            <Button variant="ghost" size="sm" className="text-xs font-semibold text-primary" onClick={() => navigate('/drivers')}>
              View All
            </Button>
          </div>
          
          <div className="rounded-xl border border-border bg-brand-surface overflow-hidden shadow-soft">
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
                  <TableRow key={driver.id} className="cursor-pointer" onClick={() => navigate(`/drivers/${driver.id}`)}>
                    <TableCell className="font-semibold">{driver.name}</TableCell>
                    <TableCell>{driver.phone}</TableCell>
                    <TableCell>{driver.vehicle}</TableCell>
                    <TableCell>
                      <StatusBadge status={driver.status} />
                    </TableCell>
                    <TableCell>{driver.date}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-text-secondary" onClick={() => navigate(`/drivers/${driver.id}`)}>
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
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider px-1">Recent Activity Timeline</h3>
          <Card>
            <CardContent className="p-6 space-y-6">
              {activities.map((act, index) => {
                const Icon = act.icon
                return (
                  <div key={index} className="flex gap-4 relative group last:pb-0 pb-1">
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
