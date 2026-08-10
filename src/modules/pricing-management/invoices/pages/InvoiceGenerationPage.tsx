import React, { useState } from 'react'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { DataTable } from '@/shared/components/DataTable'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Download, Eye, Calendar, User, Search, Plus, Trash2, CheckCircle2, X, FileText, Printer, Upload, AlertTriangle, Clock, History, Lock, RotateCcw } from 'lucide-react'

// ─── CR-03: Uploaded Compliance Template types ─────────────────────────────────

type UploadedTemplateType = 'rider_invoice' | 'driver_settlement' | 'subscription_invoice' | 'services_invoice' | 'credit_note'

interface UploadedTemplate {
  id: string
  name: string
  type: UploadedTemplateType
  fileName: string
  fileExt: 'html' | 'docx' | 'pdf'
  effectiveFrom: string
  versionNote: string
  uploadedAt: string
  isActive: boolean
  placeholderErrors: string[]  // unrecognised {{...}} tokens found at upload
  previewApproved: boolean     // must be true before activation
  content: string              // raw text for placeholder scanning / preview
}

const SUPPORTED_PLACEHOLDERS = new Set([
  'invoice_number', 'invoice_date',
  'customer_name', 'customer_contact',
  'driver_name', 'driver_id',
  'trip_id', 'booking_id',
  'fare_breakdown', 'total_amount', 'amount_in_words',
  'commission_amount',
  'subscription_plan', 'subscription_amount',
  'tax_breakdown',
  'company_gstin', 'company_address',
])

const SAMPLE_DATA: Record<string, string> = {
  invoice_number: 'INV-2026-001', invoice_date: '2026-07-24',
  customer_name: 'Shreya Iyer', customer_contact: '9876543210',
  driver_name: 'Rajesh Kumar', driver_id: 'DRV-102',
  trip_id: 'TRIP-9812', booking_id: 'R-9812',
  fare_breakdown: '₹332.86 (base) + ₹17.14 (GST)', total_amount: '₹350.00', amount_in_words: 'Three Hundred Fifty Rupees Only',
  commission_amount: '₹24.50',
  subscription_plan: 'Monthly Plan', subscription_amount: '₹1,999',
  tax_breakdown: 'CGST: ₹8.57 | SGST: ₹8.57 | IGST: ₹0.00',
  company_gstin: '29AAAAA1111A1Z1', company_address: '102, MG Road, Bengaluru - 560001',
}

const TEMPLATE_TYPE_LABELS: Record<UploadedTemplateType, string> = {
  rider_invoice: 'Rider Invoice',
  driver_settlement: 'Driver Settlement',
  subscription_invoice: 'Subscription Invoice',
  services_invoice: 'Services Invoice',
  credit_note: 'Credit Note',
}

const validatePlaceholders = (content: string): string[] => {
  const found = [...content.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1])
  return found.filter(p => !SUPPORTED_PLACEHOLDERS.has(p))
}

const substitutePreview = (content: string): string =>
  content.replace(/\{\{(\w+)\}\}/g, (_, key) => SAMPLE_DATA[key] ?? `{{${key}}}`)

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

  // ── CR-03: Upload Template state ──────────────────────────────────────────
  const [uploadedTemplates, setUploadedTemplates] = useState<UploadedTemplate[]>([])
  const [showUploadTemplateModal, setShowUploadTemplateModal] = useState(false)
  const [previewUploadedTemplate, setPreviewUploadedTemplate] = useState<UploadedTemplate | null>(null)
  const [versionHistoryType, setVersionHistoryType] = useState<UploadedTemplateType | null>(null)
  const [uploadForm, setUploadForm] = useState({
    name: '', type: 'rider_invoice' as UploadedTemplateType,
    effectiveFrom: '', versionNote: '', file: null as File | null, content: '',
  })

  const handleUploadTemplate = () => {
    const errors = validatePlaceholders(uploadForm.content)
    const fileExt = (uploadForm.file?.name.split('.').pop()?.toLowerCase() ?? 'html') as UploadedTemplate['fileExt']
    const newTpl: UploadedTemplate = {
      id: `UTPL-${Date.now()}`,
      name: uploadForm.name,
      type: uploadForm.type,
      fileName: uploadForm.file?.name ?? 'template.html',
      fileExt,
      effectiveFrom: uploadForm.effectiveFrom,
      versionNote: uploadForm.versionNote,
      uploadedAt: new Date().toISOString().split('T')[0],
      isActive: false,
      placeholderErrors: errors,
      previewApproved: false,
      content: uploadForm.content,
    }
    setUploadedTemplates(prev => [...prev, newTpl])
    setShowUploadTemplateModal(false)
    setUploadForm({ name: '', type: 'rider_invoice', effectiveFrom: '', versionNote: '', file: null, content: '' })
  }

  const handleActivateTemplate = (id: string, type: UploadedTemplateType) => {
    setUploadedTemplates(prev =>
      prev.map(t => ({
        ...t,
        isActive: t.id === id ? true : t.type === type ? false : t.isActive,
      }))
    )
  }

  const handleRevertTemplate = (id: string, type: UploadedTemplateType) => {
    handleActivateTemplate(id, type)
    setVersionHistoryType(null)
  }

  const handleApprovePreview = (id: string) => {
    setUploadedTemplates(prev => prev.map(t => t.id === id ? { ...t, previewApproved: true } : t))
    setPreviewUploadedTemplate(null)
  }

  const versionHistoryList = uploadedTemplates.filter(t => t.type === versionHistoryType)

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
        actions={
          activeTab === 'templates' ? (
            <Button
              onClick={() => setShowUploadTemplateModal(true)}
              className="gap-1.5 bg-[#1F2B6D] text-white hover:bg-[#1F2B6D]/90 text-xs font-semibold h-9 rounded-lg"
            >
              <Upload className="h-4 w-4" /> Upload Template
            </Button>
          ) : undefined
        }
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

            {/* ── Uploaded Compliance Templates (CR-03) ── */}
            <div className="space-y-4 border-t border-border pt-6 mt-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Uploaded Compliance Templates</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Uploaded HTML/DOCX templates with placeholder validation, preview gate, and one-active-per-type enforcement.</p>
                </div>
              </div>

              {uploadedTemplates.length === 0 ? (
                <div className="border border-dashed border-border rounded-xl p-8 text-center space-y-2">
                  <Upload className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-muted-foreground font-semibold">No compliance templates uploaded yet.</p>
                  <p className="text-[10px] text-slate-400">Use the &ldquo;Upload Template&rdquo; button above to add your first template.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {uploadedTemplates.map(tpl => {
                    const canActivate = tpl.placeholderErrors.length === 0 && tpl.previewApproved && tpl.fileExt !== 'pdf'
                    return (
                      <Card key={tpl.id} className={`premium-card border-2 ${tpl.isActive ? 'border-emerald-400' : 'border-border'}`}>
                        <CardContent className="p-4 space-y-3 text-xs">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-slate-800 dark:text-slate-100">{tpl.name}</h4>
                                <span className="text-[8px] uppercase bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold text-slate-500">
                                  {TEMPLATE_TYPE_LABELS[tpl.type]}
                                </span>
                                {tpl.isActive && <span className="text-[8px] uppercase bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded font-bold">Active</span>}
                                {tpl.fileExt === 'pdf' && <span className="text-[8px] uppercase bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded font-bold">Reference Only</span>}
                              </div>
                              <p className="text-[9px] text-slate-400 font-mono mt-0.5">{tpl.fileName} · Uploaded: {tpl.uploadedAt}</p>
                            </div>
                            <button
                              onClick={() => setVersionHistoryType(tpl.type)}
                              className="text-primary hover:underline text-[9px] font-bold flex items-center gap-1 flex-shrink-0"
                              title="Version History"
                            >
                              <History className="h-3 w-3" /> History
                            </button>
                          </div>

                          <div className="text-[10px] space-y-1">
                            <p><span className="text-slate-400 font-bold">Effective From:</span> {tpl.effectiveFrom || '—'}</p>
                            <p><span className="text-slate-400 font-bold">Version Note:</span> {tpl.versionNote || '—'}</p>
                          </div>

                          {/* Placeholder errors */}
                          {tpl.placeholderErrors.length > 0 && (
                            <div className="bg-rose-50 border border-rose-100 rounded-lg p-2.5 space-y-1">
                              <p className="text-[9px] font-black text-rose-700 flex items-center gap-1 uppercase tracking-wider">
                                <AlertTriangle className="h-3 w-3" /> Unrecognised Placeholders — Activation Blocked
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {tpl.placeholderErrors.map(e => (
                                  <span key={e} className="font-mono text-[8px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">{'{{' + e + '}}'}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Controls */}
                          <div className="flex items-center gap-2 pt-1 border-t border-border flex-wrap">
                            {tpl.placeholderErrors.length === 0 && !tpl.previewApproved && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[9px] font-bold border-border gap-1"
                                onClick={() => setPreviewUploadedTemplate(tpl)}
                              >
                                <Eye className="h-3 w-3" /> Preview & Approve
                              </Button>
                            )}
                            {tpl.previewApproved && !tpl.isActive && (
                              <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Preview Approved
                              </span>
                            )}
                            <Button
                              size="sm"
                              disabled={!canActivate || tpl.isActive}
                              onClick={() => handleActivateTemplate(tpl.id, tpl.type)}
                              className={`h-7 text-[9px] font-bold gap-1 ${
                                tpl.isActive
                                  ? 'bg-emerald-600 text-white'
                                  : canActivate
                                  ? 'bg-[#1F2B6D] text-white hover:bg-[#1F2B6D]/90'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                              title={!canActivate ? 'Resolve placeholder errors and approve preview first. Activation restricted to Superadmin / Finance.' : ''}
                            >
                              {tpl.isActive ? <><CheckCircle2 className="h-3 w-3" /> Active</> : <><Lock className="h-3 w-3" /> Activate</>}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
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

      {/* ══ Upload Template Modal (CR-03) ══ */}
      {showUploadTemplateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-border rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-scale-up text-left text-xs">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Upload Compliance Template</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Accepts HTML and DOCX (max 5 MB). PDF for reference only — cannot be activated.</p>
              </div>
              <button onClick={() => setShowUploadTemplateModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Template Name *</label>
                  <input type="text" required placeholder="e.g. GST Amendment v2" value={uploadForm.name}
                    onChange={e => setUploadForm({ ...uploadForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Template Type *</label>
                  <select value={uploadForm.type} onChange={e => setUploadForm({ ...uploadForm, type: e.target.value as UploadedTemplateType })}
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]">
                    {(Object.entries(TEMPLATE_TYPE_LABELS) as [UploadedTemplateType, string][]).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Effective From *</label>
                  <input type="date" value={uploadForm.effectiveFrom}
                    onChange={e => setUploadForm({ ...uploadForm, effectiveFrom: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Version Note</label>
                <textarea rows={2} placeholder="What changed in this version?" value={uploadForm.versionNote}
                  onChange={e => setUploadForm({ ...uploadForm, versionNote: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              {/* File Upload */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">File Upload * (.html · .docx · .pdf, max 5 MB)</label>
                <label className={`flex items-center gap-3 border-2 border-dashed rounded-lg p-3 cursor-pointer transition-colors ${
                  uploadForm.file ? 'border-emerald-300 bg-emerald-50/30' : 'border-border hover:border-primary/40 hover:bg-primary/5'
                }`}>
                  <Upload className={`h-4 w-4 flex-shrink-0 ${uploadForm.file ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className={uploadForm.file ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                    {uploadForm.file ? uploadForm.file.name : 'Click to choose file'}
                  </span>
                  <input type="file" accept=".html,.docx,.pdf" className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0] ?? null
                      if (file && file.size > 5 * 1024 * 1024) { alert('File exceeds 5 MB'); return }
                      // Simulate reading text content for placeholder scanning
                      const simContent = uploadForm.content || '{{invoice_number}} {{invoice_date}} {{customer_name}} {{total_amount}} {{company_gstin}} {{company_address}} {{tax_breakdown}}'
                      setUploadForm(prev => ({ ...prev, file, content: simContent }))
                    }}
                  />
                </label>
              </div>

              {/* Content / Placeholder text area (simulates file read for DOCX) */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Template Content / Paste HTML for Placeholder Validation</label>
                <textarea rows={4} placeholder="Paste template HTML or text here to validate {{placeholders}} before uploading..." value={uploadForm.content}
                  onChange={e => setUploadForm({ ...uploadForm, content: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none font-mono"
                />
                {uploadForm.content && (() => {
                  const errs = validatePlaceholders(uploadForm.content)
                  return errs.length > 0 ? (
                    <div className="bg-rose-50 border border-rose-100 rounded-lg p-2 mt-1">
                      <p className="text-[9px] font-black text-rose-700 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Unrecognised placeholders — activation will be blocked:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {errs.map(e => <span key={e} className="font-mono text-[8px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">{'{{' + e + '}}'}</span>)}
                      </div>
                    </div>
                  ) : uploadForm.content.includes('{{') ? (
                    <p className="text-[9px] text-emerald-600 font-bold flex items-center gap-1 mt-1"><CheckCircle2 className="h-3 w-3" /> All placeholders recognised.</p>
                  ) : null
                })()}
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-3">
                <Button variant="outline" size="sm" onClick={() => setShowUploadTemplateModal(false)} className="h-9 border-border">Cancel</Button>
                <Button
                  disabled={!uploadForm.name || !uploadForm.effectiveFrom}
                  onClick={handleUploadTemplate}
                  className="bg-[#1F2B6D] text-white hover:bg-[#1F2B6D]/90 text-xs font-semibold h-9 rounded-lg px-4"
                >
                  Upload & Validate
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ Template Preview Modal (CR-03) ══ */}
      {previewUploadedTemplate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-border rounded-xl w-full max-w-2xl max-h-[88vh] overflow-y-auto shadow-2xl animate-scale-up text-left">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Template Preview — Sample Data</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{previewUploadedTemplate.name} · {TEMPLATE_TYPE_LABELS[previewUploadedTemplate.type]}</p>
              </div>
              <button onClick={() => setPreviewUploadedTemplate(null)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-[10px] text-amber-700 font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 flex-shrink-0" />
                Previewing with sample data. Approve preview to enable activation for this template.
              </div>
              <div className="border border-border rounded-xl p-5 bg-slate-50 dark:bg-slate-950 font-mono text-[10px] whitespace-pre-wrap leading-relaxed min-h-[200px]">
                {previewUploadedTemplate.content
                  ? substitutePreview(previewUploadedTemplate.content)
                  : 'No template content to preview.'}
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-[9px] text-slate-500 mb-3">By approving, you confirm this template renders correctly and can be activated for production use.</p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPreviewUploadedTemplate(null)} className="h-9 border-border">Close</Button>
                  <Button
                    onClick={() => handleApprovePreview(previewUploadedTemplate.id)}
                    className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold h-9 rounded-lg px-4"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Approve Preview
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ Version History Modal (CR-03) ══ */}
      {versionHistoryType && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-border rounded-xl w-full max-w-lg shadow-2xl animate-scale-up text-left">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                  <History className="h-4 w-4" /> Version History
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{TEMPLATE_TYPE_LABELS[versionHistoryType]}</p>
              </div>
              <button onClick={() => setVersionHistoryType(null)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3 text-xs">
              {versionHistoryList.length === 0 ? (
                <p className="text-center text-slate-400 py-8">No uploaded templates of this type yet.</p>
              ) : (
                [...versionHistoryList].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom)).map(tpl => (
                  <div key={tpl.id} className={`border rounded-xl p-3 space-y-1 ${tpl.isActive ? 'border-emerald-300 bg-emerald-50/30' : 'border-border'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{tpl.name}</p>
                        <p className="text-[9px] font-mono text-slate-400">{tpl.fileName} · Effective: {tpl.effectiveFrom}</p>
                        {tpl.versionNote && <p className="text-[9px] text-slate-500 italic mt-0.5">{tpl.versionNote}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {tpl.isActive
                          ? <span className="text-[8px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded font-bold uppercase">Active</span>
                          : tpl.previewApproved && tpl.placeholderErrors.length === 0 && tpl.fileExt !== 'pdf' && (
                              <button
                                onClick={() => handleRevertTemplate(tpl.id, tpl.type)}
                                className="flex items-center gap-1 text-[9px] text-primary font-bold hover:underline"
                              >
                                <RotateCcw className="h-3 w-3" /> Revert
                              </button>
                            )
                        }
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </PageWrapper>
  )
}

export default InvoiceGenerationPage
