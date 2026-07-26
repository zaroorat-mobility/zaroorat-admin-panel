import React, { useState } from 'react'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { DataTable } from '@/shared/components/DataTable'
import { Download, Eye, Calendar, User, Search } from 'lucide-react'

interface Invoice {
  id: string
  bookingId: string
  recipientName: string
  recipientType: 'rider' | 'driver'
  date: string
  amount: number
  status: 'generated' | 'pending'
}

export const InvoiceGenerationPage: React.FC = () => {
  const [filterType, setFilterType] = useState<'all' | 'rider' | 'driver'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const invoices: Invoice[] = [
    { id: 'INV-2026-001', bookingId: 'R-9812', recipientName: 'Shreya Iyer', recipientType: 'rider', date: '2026-07-24', amount: 350.00, status: 'generated' },
    { id: 'INV-2026-002', bookingId: 'R-9812', recipientName: 'Rajesh Kumar', recipientType: 'driver', date: '2026-07-24', amount: 24.50, status: 'generated' },
    { id: 'INV-2026-003', bookingId: 'R-9811', recipientName: 'Alok Singh', recipientType: 'rider', date: '2026-07-24', amount: 120.00, status: 'generated' },
    { id: 'INV-2026-004', bookingId: 'R-9810', recipientName: 'Devendra Pal', recipientType: 'rider', date: '2026-07-23', amount: 210.00, status: 'pending' },
    { id: 'INV-2026-005', bookingId: 'R-9808', recipientName: 'Rohan Shah', recipientType: 'rider', date: '2026-07-22', amount: 410.00, status: 'generated' },
    { id: 'INV-2026-006', bookingId: 'R-9808', recipientName: 'Vikram Pal', recipientType: 'driver', date: '2026-07-22', amount: 28.70, status: 'generated' }
  ]

  const filteredInvoices = invoices.filter(inv => {
    const matchesType = filterType === 'all' || inv.recipientType === filterType
    const matchesSearch = inv.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) || inv.bookingId.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  const columns = [
    {
      key: 'id',
      label: 'Invoice ID',
      render: (val: string) => <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{val}</span>
    },
    {
      key: 'bookingId',
      label: 'Booking ID',
      render: (val: string) => <span className="font-mono text-primary font-semibold">{val}</span>
    },
    {
      key: 'recipientName',
      label: 'Recipient',
      render: (val: string, row: Invoice) => (
        <div className="text-left text-xs font-semibold text-slate-800 dark:text-white flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-slate-400" />
          <div>
            <span>{val}</span>
            <span className="block text-[8px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">{row.recipientType}</span>
          </div>
        </div>
      )
    },
    {
      key: 'date',
      label: 'Date Generated',
      render: (val: string) => (
        <span className="font-mono text-slate-500 text-[10px] flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {val}
        </span>
      )
    },
    {
      key: 'amount',
      label: 'Total Fare / Comm (₹)',
      align: 'right' as const,
      render: (val: number) => <span className="font-mono font-bold text-slate-800 dark:text-slate-100">₹{val.toFixed(2)}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (val: string) => (
        <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] border font-black uppercase tracking-wider ${
          val === 'generated' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
        }`}>
          {val}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center' as const,
      render: (_, row: Invoice) => (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 rounded-lg border-border"
            title="Preview Invoice"
            onClick={() => alert(`Previewing invoice ${row.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 rounded-lg bg-primary hover:bg-primary/95 text-white border-transparent"
            title="Download PDF"
            onClick={() => alert(`Downloading PDF for ${row.id}`)}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Invoice Generation Console"
        description="Generate, review, and download digital VAT/GST-compliant billing invoices for passengers and driver-partners."
      />

      <div className="space-y-6 text-left">
        {/* Filters Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-3">
          <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-border">
            {(['all', 'rider', 'driver'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-md capitalize transition-all cursor-pointer ${
                  filterType === type 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                {type === 'all' ? 'All Invoices' : `${type} Invoices`}
              </button>
            ))}
          </div>
          <div className="relative w-64">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search recipient or booking ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
            />
          </div>
        </div>

        {/* Invoice Data Grid */}
        <DataTable
          columns={columns}
          data={filteredInvoices}
          selectable={false}
          resultLabel="invoices"
        />
      </div>
    </PageWrapper>
  )
}

export default InvoiceGenerationPage
