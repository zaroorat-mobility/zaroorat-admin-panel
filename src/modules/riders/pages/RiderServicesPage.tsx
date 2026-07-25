import React, { useState } from 'react'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card } from '@/shared/components/ui/Card'
import { DataTable } from '@/shared/components/DataTable'
import { Button } from '@/shared/components/ui/Button'
import { ExternalLink, Home, Wrench, Calendar } from 'lucide-react'

interface ServiceBooking {
  id: string
  riderName: string
  serviceType: string
  providerName: string
  scheduledDate: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  amount: number
}

export const RiderServicesPage: React.FC = () => {
  const [selectedRider, setSelectedRider] = useState<string>('all')

  const bookings: ServiceBooking[] = [
    { id: 'SRV-8801', riderName: 'Shreya Iyer', serviceType: 'Home Cleaning (Deep)', providerName: 'CleanCorp Services', scheduledDate: '2026-07-26 10:00', status: 'scheduled', amount: 1599 },
    { id: 'SRV-8802', riderName: 'Alok Singh', serviceType: 'Electrical Repair', providerName: 'Apex Electrics', scheduledDate: '2026-07-25 14:30', status: 'scheduled', amount: 450 },
    { id: 'SRV-8803', riderName: 'Devendra Pal', serviceType: 'Plumbing Works', providerName: 'FlowFix Plumbers', scheduledDate: '2026-07-24 11:00', status: 'in_progress', amount: 799 },
    { id: 'SRV-8804', riderName: 'Meera Nair', serviceType: 'AC Maintenance', providerName: 'CoolBreeze Aircons', scheduledDate: '2026-07-22 09:00', status: 'completed', amount: 1200 },
    { id: 'SRV-8805', riderName: 'Rahul Sen', serviceType: 'Pest Control', providerName: 'PestGuard Specialists', scheduledDate: '2026-07-18 16:00', status: 'completed', amount: 2400 }
  ]

  const filteredBookings = selectedRider === 'all' 
    ? bookings 
    : bookings.filter(b => b.riderName.toLowerCase().includes(selectedRider.toLowerCase()))

  const columns = [
    {
      key: 'id',
      label: 'Job Booking ID',
      render: (val: string) => <span className="font-mono font-bold text-primary">{val}</span>
    },
    {
      key: 'riderName',
      label: 'Rider Name',
      render: (val: string) => <span className="font-semibold text-slate-800 dark:text-slate-200">{val}</span>
    },
    {
      key: 'serviceType',
      label: 'Service Type',
      render: (val: string) => (
        <span className="flex items-center gap-1 text-slate-700 dark:text-slate-350">
          <Wrench className="h-3.5 w-3.5 text-slate-400" />
          {val}
        </span>
      )
    },
    {
      key: 'providerName',
      label: 'Partner Provider',
      render: (val: string) => <span className="font-semibold text-slate-655">{val}</span>
    },
    {
      key: 'scheduledDate',
      label: 'Date & Time',
      render: (val: string) => (
        <span className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
          <Calendar className="h-3 w-3" />
          {val}
        </span>
      )
    },
    {
      key: 'amount',
      label: 'Amount Charged',
      align: 'right' as const,
      render: (val: number) => (
        <span className="font-bold text-slate-800 dark:text-white flex items-center justify-end">
          ₹{val.toFixed(2)}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Job Status',
      render: (val: string) => {
        const colors: Record<string, string> = {
          scheduled: 'bg-indigo-50 border-indigo-150 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400',
          in_progress: 'bg-amber-50 border-amber-150 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400',
          completed: 'bg-emerald-50 border-emerald-150 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450',
          cancelled: 'bg-slate-100 border-slate-200 text-slate-500'
        }
        return (
          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border tracking-wider ${colors[val] || 'bg-slate-50 text-slate-500'}`}>
            {val.replace('_', ' ')}
          </span>
        )
      }
    },
    {
      key: 'actions',
      label: 'SSO Link',
      align: 'center' as const,
      render: (_, row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(`https://services.zaroorat.in/bookings/${row.id}?sso_token=temp_sso_handshake`, '_blank')}
          className="gap-1 text-[10px] h-7 rounded border-border text-primary font-bold hover:bg-slate-50"
        >
          <ExternalLink className="h-3 w-3" />
          <span>Open Services</span>
        </Button>
      )
    }
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Rider Services Integration"
        description="Cross-link riders to the Zaroorat Services app and monitor active home-services bookings and job records."
      />

      <div className="space-y-6 text-left">
        {/* SSO Overview Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="premium-card p-5">
            <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Services Integration Status</span>
            <div className="flex items-center gap-2 mt-2">
              <Home className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm font-black text-slate-800 dark:text-white">Active (SSO Handshake Online)</p>
                <p className="text-[9px] text-muted-foreground">Unified customer profiles synced between mobility and services.</p>
              </div>
            </div>
          </Card>
          
          <Card className="premium-card p-5">
            <span className="text-[10px] uppercase font-bold text-slate-455 tracking-wider">Active Services Bookings</span>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">3 Bookings</p>
            <p className="text-[9px] text-emerald-600 font-semibold mt-1">1 job currently in progress</p>
          </Card>

          <Card className="premium-card p-5">
            <span className="text-[10px] uppercase font-bold text-slate-455 tracking-wider">Gross Services Value</span>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">₹7,048.00</p>
            <p className="text-[9px] text-muted-foreground mt-1">Accumulated across home-service accounts</p>
          </Card>
        </div>

        {/* Filter bar */}
        <div className="flex justify-between items-center border-b border-border pb-3">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-850 dark:text-slate-200">Home-Services Sync Registry</h3>
            <p className="text-[10px] text-muted-foreground">List of customer bookings synchronized from the Zaroorat Services platform.</p>
          </div>
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search by Rider name..."
              value={selectedRider === 'all' ? '' : selectedRider}
              onChange={(e) => setSelectedRider(e.target.value || 'all')}
              className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
            />
          </div>
        </div>

        {/* Sync Data Table */}
        <DataTable
          columns={columns}
          data={filteredBookings}
          selectable={false}
          resultLabel="synced bookings"
        />
      </div>
    </PageWrapper>
  )
}

export default RiderServicesPage
