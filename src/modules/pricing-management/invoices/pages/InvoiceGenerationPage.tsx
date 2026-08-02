import React, { useState } from 'react'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { DataTable } from '@/shared/components/DataTable'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Download, Eye, Calendar, User, Search, Plus, Trash2, CheckCircle2, X, FileText, Printer } from 'lucide-react'

interface Invoice {
  id: string
  bookingId: string
  recipientName: string
  recipientType: 'rider' | 'driver'
  date: string
  amount: number
  status: 'generated' | 'pending'
  hsnCode: string
  fromRoute: string
  toRoute: string
}

interface InvoiceTemplate {
  id: string
  name: string
  headerLogoText: string
  address: string
  gstin: string
  footerTerms: string
  cgstRate: number
  sgstRate: number
  igstRate: number
  appliesTo: 'ride' | 'school' | 'services'
  isDefault: boolean
}

export const InvoiceGenerationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'templates'>('invoices')
  const [filterType, setFilterType] = useState<'all' | 'rider' | 'driver'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modals state
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null)
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false)

  // Invoice Templates state
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([
    {
      id: 'TMP-001',
      name: 'Standard Ride Invoice Template',
      headerLogoText: 'ZAROORAT MOBILITY PVT LTD',
      address: '102, 1st Floor, Start-up Hangar, MG Road, Bengaluru - 560001',
      gstin: '29AAAAA1111A1Z1',
      footerTerms: 'This is a computer generated invoice. No signature is required. Tax is calculated under reverse charge guidelines if applicable.',
      cgstRate: 2.5,
      sgstRate: 2.5,
      igstRate: 0.0,
      appliesTo: 'ride',
      isDefault: true
    },
    {
      id: 'TMP-002',
      name: 'School Mode Reusable Receipt',
      headerLogoText: 'ZAROORAT SCHOOL MOBILITY SERVICES',
      address: '44, Outer Ring Road, HSR Layout, Bengaluru - 560102',
      gstin: '29BBBBB2222B2Z2',
      footerTerms: 'Applicable for school transportation billing cycles. Standard CGST and SGST rates apply as per service notifications.',
      cgstRate: 2.5,
      sgstRate: 2.5,
      igstRate: 0.0,
      appliesTo: 'school',
      isDefault: false
    }
  ])

  // New template form state
  const [newTemplate, setNewTemplate] = useState<Omit<InvoiceTemplate, 'id'>>({
    name: '',
    headerLogoText: 'ZAROORAT MOBILITY',
    address: 'Bengaluru, India',
    gstin: '29XXXXX9999X9Z9',
    footerTerms: 'Thank you for choosing Zaroorat.',
    cgstRate: 2.5,
    sgstRate: 2.5,
    igstRate: 0.0,
    appliesTo: 'ride',
    isDefault: false
  })

  const invoices: Invoice[] = [
    { id: 'INV-2026-001', bookingId: 'R-9812', recipientName: 'Shreya Iyer', recipientType: 'rider', date: '2026-07-24', amount: 350.00, status: 'generated', hsnCode: '9964', fromRoute: 'Indiranagar', toRoute: 'MG Road' },
    { id: 'INV-2026-002', bookingId: 'R-9812', recipientName: 'Rajesh Kumar', recipientType: 'driver', date: '2026-07-24', amount: 24.50, status: 'generated', hsnCode: '9964', fromRoute: 'Indiranagar', toRoute: 'MG Road' },
    { id: 'INV-2026-003', bookingId: 'R-9811', recipientName: 'Alok Singh', recipientType: 'rider', date: '2026-07-24', amount: 120.00, status: 'generated', hsnCode: '9964', fromRoute: 'Koramangala', toRoute: 'HSR Layout' },
    { id: 'INV-2026-004', bookingId: 'R-9810', recipientName: 'Devendra Pal', recipientType: 'rider', date: '2026-07-23', amount: 210.00, status: 'pending', hsnCode: '9964', fromRoute: 'Whitefield', toRoute: 'Electronic City' },
    { id: 'INV-2026-005', bookingId: 'R-9808', recipientName: 'Rohan Shah', recipientType: 'rider', date: '2026-07-22', amount: 410.00, status: 'generated', hsnCode: '9964', fromRoute: 'HSR Layout', toRoute: 'Indiranagar' },
    { id: 'INV-2026-006', bookingId: 'R-9808', recipientName: 'Vikram Pal', recipientType: 'driver', date: '2026-07-22', amount: 28.70, status: 'generated', hsnCode: '9964', fromRoute: 'HSR Layout', toRoute: 'Indiranagar' }
  ]

  const filteredInvoices = invoices.filter(inv => {
    const matchesType = filterType === 'all' || inv.recipientType === filterType
    const matchesSearch = inv.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) || inv.bookingId.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  const handleAddTemplate = (e: React.FormEvent) => {
    e.preventDefault()
    const id = `TMP-${Math.floor(100 + Math.random() * 900)}`
    
    // If isDefault is true, set others to false
    let updatedTemplates = [...templates]
    if (newTemplate.isDefault) {
      updatedTemplates = updatedTemplates.map(t => ({ ...t, isDefault: false }))
    }

    setTemplates([...updatedTemplates, { ...newTemplate, id }])
    setShowAddTemplateModal(false)
    // reset form
    setNewTemplate({
      name: '',
      headerLogoText: 'ZAROORAT MOBILITY',
      address: 'Bengaluru, India',
      gstin: '29XXXXX9999X9Z9',
      footerTerms: 'Thank you for choosing Zaroorat.',
      cgstRate: 2.5,
      sgstRate: 2.5,
      igstRate: 0.0,
      appliesTo: 'ride',
      isDefault: false
    })
  }

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id))
  }

  const handleSetDefaultTemplate = (id: string) => {
    setTemplates(templates.map(t => ({
      ...t,
      isDefault: t.id === id
    })))
  }

  // Math variables for invoice preview
  const getInvoiceData = (inv: Invoice) => {
    // Find matching template based on vertical, fallback to default
    const template = templates.find(t => t.appliesTo === (inv.recipientType === 'driver' ? 'services' : 'ride')) || templates.find(t => t.isDefault) || templates[0]
    
    const totalGstRate = template.cgstRate + template.sgstRate + template.igstRate
    const baseMultiplier = 1 + (totalGstRate / 100)
    const taxableValue = inv.amount / baseMultiplier
    const gstAmount = inv.amount - taxableValue
    
    const cgstAmount = taxableValue * (template.cgstRate / 100)
    const sgstAmount = taxableValue * (template.sgstRate / 100)
    const igstAmount = taxableValue * (template.igstRate / 100)

    return {
      template,
      taxableValue,
      gstAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalGstRate
    }
  }

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
            <span className="block text-[8px] uppercase tracking-wider font-bold text-slate-450 mt-0.5">{row.recipientType}</span>
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
      key: 'hsnCode',
      label: 'HSN/SAC',
      render: (val: string) => <span className="font-mono text-slate-500 text-[10px] font-bold">{val}</span>
    },
    {
      key: 'taxableValue',
      label: 'Taxable Value',
      align: 'right' as const,
      render: (_, row: Invoice) => {
        const { taxableValue } = getInvoiceData(row)
        return <span className="font-mono text-slate-700 dark:text-slate-300">₹{taxableValue.toFixed(2)}</span>
      }
    },
    {
      key: 'gstRate',
      label: 'GST Rate',
      align: 'center' as const,
      render: (_, row: Invoice) => {
        const { totalGstRate } = getInvoiceData(row)
        return <span className="font-mono font-bold text-slate-655">{totalGstRate.toFixed(1)}%</span>
      }
    },
    {
      key: 'gstAmount',
      label: 'GST Amt',
      align: 'right' as const,
      render: (_, row: Invoice) => {
        const { gstAmount } = getInvoiceData(row)
        return <span className="font-mono font-bold text-indigo-650 dark:text-indigo-400">₹{gstAmount.toFixed(2)}</span>
      }
    },
    {
      key: 'gstSplit',
      label: 'CGST/SGST/IGST Split',
      render: (_, row: Invoice) => {
        const { cgstAmount, sgstAmount, igstAmount, template } = getInvoiceData(row)
        return (
          <div className="text-[9px] font-mono text-slate-500 leading-normal">
            <p>C: ₹{cgstAmount.toFixed(2)} ({template.cgstRate}%) · S: ₹{sgstAmount.toFixed(2)} ({template.sgstRate}%)</p>
            {igstAmount > 0 && <p>I: ₹{igstAmount.toFixed(2)} ({template.igstRate}%)</p>}
          </div>
        )
      }
    },
    {
      key: 'amount',
      label: 'Total Gross (₹)',
      align: 'right' as const,
      render: (val: number) => <span className="font-mono font-black text-slate-900 dark:text-slate-100">₹{val.toFixed(2)}</span>
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
            onClick={() => setPreviewInvoice(row)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 rounded-lg bg-[#2B317A] hover:bg-[#2B317A]/95 text-white border-transparent"
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
        description="Generate, review, and download digital VAT/GST-compliant billing invoices, and manage reusable template designs."
      />

      <div className="space-y-6 text-left">
        {/* Tab Selection */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
              activeTab === 'invoices'
                ? 'border-[#2B317A] text-[#2B317A] dark:border-[#4F5FBF] dark:text-[#4F5FBF]'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Invoices List
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
              activeTab === 'templates'
                ? 'border-[#2B317A] text-[#2B317A] dark:border-[#4F5FBF] dark:text-[#4F5FBF]'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Invoice Templates
          </button>
        </div>

        {activeTab === 'invoices' ? (
          <div className="space-y-6 animate-fade-in">
            {/* Filters Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-3">
              <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-border">
                {(['all', 'rider', 'driver'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-md capitalize transition-all cursor-pointer ${
                      filterType === type 
                        ? 'bg-[#2B317A] text-white shadow-sm' 
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
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Saved Layout Templates</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Custom layout blocks loaded for auto-generation of ride billing receipts.</p>
              </div>
              <Button
                onClick={() => setShowAddTemplateModal(true)}
                className="gap-1.5 bg-[#2B317A] text-white hover:bg-[#2B317A]/95 text-xs font-semibold h-9 rounded-lg"
              >
                <Plus className="h-4 w-4" /> Add Invoice Template
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {templates.map((tpl) => (
                <Card key={tpl.id} className={`premium-card border-2 ${tpl.isDefault ? 'border-[#2B317A] dark:border-[#4F5FBF]' : 'border-border'}`}>
                  <CardContent className="p-5 space-y-4 text-xs">
                    <div className="flex justify-between items-start border-b border-border pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{tpl.name}</h4>
                          <span className="text-[8px] font-mono uppercase bg-slate-100 dark:bg-slate-800 px-1 rounded text-slate-500">
                            {tpl.appliesTo}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-400 font-mono mt-0.5">Template ID: {tpl.id}</p>
                      </div>
                      <div className="flex gap-2">
                        {!tpl.isDefault && (
                          <button
                            onClick={() => handleSetDefaultTemplate(tpl.id)}
                            className="text-[10px] text-primary hover:underline font-semibold"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteTemplate(tpl.id)}
                          className="text-rose-600 hover:text-rose-800"
                          title="Delete Template"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-[10px] leading-relaxed">
                      <div>
                        <span className="font-bold uppercase tracking-wider text-slate-400 block text-[8px]">Header Brand</span>
                        <p className="font-bold text-slate-700 dark:text-slate-350">{tpl.headerLogoText}</p>
                        <p className="text-slate-500">{tpl.address}</p>
                        <p className="font-mono text-slate-500">GSTIN: {tpl.gstin}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 border-t border-b border-border py-2 text-center">
                        <div>
                          <span className="text-slate-400 text-[8px] block">CGST Rate</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200">{tpl.cgstRate.toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[8px] block">SGST Rate</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200">{tpl.sgstRate.toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[8px] block">IGST Rate</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200">{tpl.igstRate.toFixed(1)}%</span>
                        </div>
                      </div>

                      <div>
                        <span className="font-bold uppercase tracking-wider text-slate-400 block text-[8px]">Footer Terms</span>
                        <p className="text-slate-500 italic">{tpl.footerTerms}</p>
                      </div>
                    </div>

                    {tpl.isDefault && (
                      <div className="flex items-center gap-1 text-emerald-600 font-bold text-[9px] pt-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-550" /> Default active layout
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Invoice Preview Modal (High-Fidelity PDF style) */}
      {previewInvoice && (() => {
        const {
          template,
          taxableValue,
          gstAmount,
          cgstAmount,
          sgstAmount,
          igstAmount,
          totalGstRate
        } = getInvoiceData(previewInvoice)

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-scale-up text-left">
              {/* Modal Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2 text-slate-800 dark:text-white">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-bold text-sm">Invoice Preview: {previewInvoice.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-xs h-8 border-border"
                    onClick={() => window.print()}
                  >
                    <Printer className="h-3.5 w-3.5" /> Print
                  </Button>
                  <button onClick={() => setPreviewInvoice(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Printable Invoice Page */}
              <div className="p-8 space-y-6 text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 font-sans print:p-0">
                {/* Brand Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-100 dark:border-slate-850 pb-4">
                  <div className="space-y-1">
                    <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                      {template.headerLogoText}
                    </h2>
                    <p className="text-[10px] text-slate-500 max-w-sm">{template.address}</p>
                    <p className="font-mono text-[10px] text-slate-550"><strong>GSTIN:</strong> {template.gstin}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <h1 className="text-lg font-black tracking-wider uppercase text-slate-450">INVOICE</h1>
                    <p className="font-mono"><strong>Invoice No:</strong> {previewInvoice.id}</p>
                    <p className="font-mono"><strong>Date:</strong> {previewInvoice.date}</p>
                    <p className="font-mono text-primary font-bold"><strong>Booking ID:</strong> {previewInvoice.bookingId}</p>
                  </div>
                </div>

                {/* Bill To Info */}
                <div className="grid grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-border">
                  <div>
                    <h3 className="font-bold uppercase tracking-wider text-slate-400 text-[9px] mb-1">Billing Details</h3>
                    <p className="font-bold text-slate-900 dark:text-white">{previewInvoice.recipientName}</p>
                    <p className="capitalize text-slate-500">{previewInvoice.recipientType} Profile Account</p>
                  </div>
                  <div>
                    <h3 className="font-bold uppercase tracking-wider text-slate-400 text-[9px] mb-1">Place of Supply</h3>
                    <p className="font-bold text-slate-800 dark:text-slate-200">Karnataka (State Code 29)</p>
                    <p className="text-slate-500">Intra-State Transaction</p>
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="overflow-x-auto border border-border rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b border-border text-[10px] uppercase font-bold text-slate-450">
                        <th className="px-4 py-3">Description of Services</th>
                        <th className="px-4 py-3 text-center">HSN/SAC</th>
                        <th className="px-4 py-3 text-right">Taxable Value</th>
                        <th className="px-4 py-3 text-center">GST Rate</th>
                        <th className="px-4 py-3 text-right">CGST</th>
                        <th className="px-4 py-3 text-right">SGST</th>
                        <th className="px-4 py-3 text-right">IGST</th>
                        <th className="px-4 py-3 text-right">Total GST</th>
                        <th className="px-4 py-3 text-right">Gross Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr className="hover:bg-slate-50/20">
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-800 dark:text-slate-100">Passenger Transport Services</p>
                          <p className="text-[9px] text-slate-400 italic">Ride booking: {previewInvoice.fromRoute} to {previewInvoice.toRoute}</p>
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono">{previewInvoice.hsnCode}</td>
                        <td className="px-4 py-3.5 text-right font-mono">₹{taxableValue.toFixed(2)}</td>
                        <td className="px-4 py-3.5 text-center font-mono">{totalGstRate.toFixed(1)}%</td>
                        <td className="px-4 py-3.5 text-right font-mono">
                          <p>₹{cgstAmount.toFixed(2)}</p>
                          <span className="text-[8px] text-slate-400">({template.cgstRate}%)</span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono">
                          <p>₹{sgstAmount.toFixed(2)}</p>
                          <span className="text-[8px] text-slate-400">({template.sgstRate}%)</span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono">
                          <p>₹{igstAmount.toFixed(2)}</p>
                          <span className="text-[8px] text-slate-400">({template.igstRate}%)</span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-800 dark:text-white">₹{gstAmount.toFixed(2)}</td>
                        <td className="px-4 py-3.5 text-right font-mono font-black text-slate-900 dark:text-white">₹{previewInvoice.amount.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Subtotals & Taxes breakdown */}
                <div className="flex justify-end">
                  <div className="w-80 space-y-2 border border-border p-4 rounded-xl bg-slate-50/20">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-450">Taxable Value:</span>
                      <span className="font-mono">₹{taxableValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-550">
                      <span>Total CGST:</span>
                      <span className="font-mono">₹{cgstAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-550">
                      <span>Total SGST:</span>
                      <span className="font-mono">₹{sgstAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-550 border-b border-dashed pb-2">
                      <span>Total IGST:</span>
                      <span className="font-mono">₹{igstAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-black text-slate-900 dark:text-white text-sm pt-1">
                      <span>Total Fare (incl tax):</span>
                      <span className="font-mono">₹{previewInvoice.amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer and disclaimer */}
                <div className="border-t border-border pt-4 text-[9px] text-slate-400 text-center leading-relaxed">
                  {template.footerTerms}
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Add Invoice Template Modal */}
      {showAddTemplateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-border rounded-xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-scale-up text-left">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Add Invoice Template</h3>
              <button onClick={() => setShowAddTemplateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddTemplate} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Template Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ride Mode Standard Layout"
                  value={newTemplate.name}
                  onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Header Brand / Logo Text</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ZAROORAT MOBILITY"
                  value={newTemplate.headerLogoText}
                  onChange={e => setNewTemplate({ ...newTemplate, headerLogoText: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Applies To</label>
                  <select
                    value={newTemplate.appliesTo}
                    onChange={e => setNewTemplate({ ...newTemplate, appliesTo: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                  >
                    <option value="ride">Ride Mode</option>
                    <option value="school">School Mode</option>
                    <option value="services">Services Mode</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Corporate GSTIN</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 29AAAAA1111A1Z1"
                    value={newTemplate.gstin}
                    onChange={e => setNewTemplate({ ...newTemplate, gstin: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Office Address</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Street details, building, City, Pin code"
                  value={newTemplate.address}
                  onChange={e => setNewTemplate({ ...newTemplate, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CGST Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newTemplate.cgstRate}
                    onChange={e => setNewTemplate({ ...newTemplate, cgstRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SGST Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newTemplate.sgstRate}
                    onChange={e => setNewTemplate({ ...newTemplate, sgstRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">IGST Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newTemplate.igstRate}
                    onChange={e => setNewTemplate({ ...newTemplate, igstRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Footer Terms & Notes</label>
                <textarea
                  rows={2}
                  placeholder="Terms, signatures details, etc."
                  value={newTemplate.footerTerms}
                  onChange={e => setNewTemplate({ ...newTemplate, footerTerms: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newTemplate.isDefault}
                  onChange={e => setNewTemplate({ ...newTemplate, isDefault: e.target.checked })}
                  className="w-4 h-4 accent-primary"
                />
                <span className="font-semibold text-slate-655">Mark as default active template</span>
              </label>

              <div className="flex justify-end gap-2 border-t border-border pt-3.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddTemplateModal(false)}
                  className="h-9 border-border"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#2B317A] text-white hover:bg-[#2B317A]/95 text-xs font-semibold h-9 rounded-lg px-4"
                >
                  Save Template
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}

export default InvoiceGenerationPage
