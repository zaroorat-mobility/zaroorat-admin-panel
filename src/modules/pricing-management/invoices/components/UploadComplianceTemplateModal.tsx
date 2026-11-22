import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Upload, Sparkles, AlertTriangle, CheckCircle2, FileCode2, Eye } from 'lucide-react'
import type { FiscalDocumentType } from '../../api/fiscal.api'
import { DOCUMENT_TYPE_LABELS } from './FiscalDocumentDetailsModal'

/** Exact match to backend SUPPORTED_COMPLIANCE_PLACEHOLDERS in fiscal-document.service.ts */
export const SUPPORTED_TEMPLATE_PLACEHOLDERS = [
  'company_legal_name',
  'company_gstin',
  'company_address',
  'invoice_number',
  'invoice_date',
  'sac_code',
  'supplier_state_code',
  'place_of_supply_state_code',
  'customer_name',
  'customer_contact',
  'driver_name',
  'driver_id',
  'trip_id',
  'booking_id',
  'fare_breakdown',
  'tax_breakdown',
  'total_amount',
  'amount_in_words',
  'commission_amount',
  'gst_recovery_amount',
  'subscription_plan',
  'subscription_amount',
] as const

const SUPPORTED_SET = new Set<string>(SUPPORTED_TEMPLATE_PLACEHOLDERS)

export const PRODUCTION_STARTER_TEMPLATES: Record<FiscalDocumentType, string> = {
  PASSENGER_TAX_INVOICE: `<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 700px; margin: 0 auto; color: #0f172a;">
  <div style="background: #1F2B6D; color: #ffffff; padding: 20px 24px; border-radius: 10px 10px 0 0;">
    <h2 style="margin: 0; font-size: 18px; color: #ffffff;">{{company_legal_name}}</h2>
    <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.9;">TAX INVOICE — PASSENGER RIDE · SAC {{sac_code}}</p>
  </div>
  <div style="border: 1px solid #e2e8f0; border-top: 0; padding: 20px 24px; border-radius: 0 0 10px 10px;">
    <p style="margin: 0 0 12px; font-size: 12px; color: #475569;">
      <strong>Invoice #:</strong> {{invoice_number}} &nbsp;|&nbsp;
      <strong>Date:</strong> {{invoice_date}} &nbsp;|&nbsp;
      <strong>Trip ID:</strong> {{trip_id}}
    </p>
    <p style="margin: 0 0 12px; font-size: 12px;">
      <strong>Supplier GSTIN:</strong> {{company_gstin}} (State {{supplier_state_code}} → PoS {{place_of_supply_state_code}})<br/>
      <span>{{company_address}}</span>
    </p>
    <p style="margin: 0 0 16px; font-size: 12px;">
      <strong>Billed To:</strong> {{customer_name}} ({{customer_contact}}) &nbsp;|&nbsp;
      <strong>Driver:</strong> {{driver_name}}
    </p>
    <div style="margin-bottom: 12px;">{{fare_breakdown}}</div>
    <div style="margin-bottom: 12px;">{{tax_breakdown}}</div>
    <div style="border-top: 2px solid #1F2B6D; padding-top: 10px; display: flex; justify-content: space-between; font-weight: 700; font-size: 15px;">
      <span>Grand Total</span>
      <span>{{total_amount}}</span>
    </div>
    <p style="margin: 8px 0 0; font-size: 11px; color: #64748b;"><em>Amount in words: {{amount_in_words}}</em></p>
  </div>
</div>`,
  COMMISSION_TAX_INVOICE: `<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 700px; margin: 0 auto; color: #0f172a;">
  <div style="background: #1F2B6D; color: #ffffff; padding: 20px 24px; border-radius: 10px 10px 0 0; border-top: 4px solid #10B981;">
    <h2 style="margin: 0; font-size: 18px; color: #ffffff;">ZAROORAT · {{company_legal_name}}</h2>
    <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.9;">TAX INVOICE — PLATFORM COMMISSION · SAC {{sac_code}}</p>
  </div>
  <div style="border: 1px solid #e2e8f0; border-top: 0; padding: 20px 24px; border-radius: 0 0 10px 10px;">
    <p style="margin: 0 0 12px; font-size: 12px; color: #475569;">
      <strong>Invoice #:</strong> {{invoice_number}} &nbsp;|&nbsp;
      <strong>Date:</strong> {{invoice_date}} &nbsp;|&nbsp;
      <strong>Booking:</strong> {{booking_id}}
    </p>
    <p style="margin: 0 0 12px; font-size: 12px;">
      <strong>Supplier GSTIN:</strong> {{company_gstin}} (State {{supplier_state_code}} → PoS {{place_of_supply_state_code}})<br/>
      <span>{{company_address}}</span>
    </p>
    <p style="margin: 0 0 16px; font-size: 12px;">
      <strong>Driver Partner:</strong> {{driver_name}} (ID: {{driver_id}})
    </p>
    <p style="margin: 0 0 10px; font-size: 13px;"><strong>Platform Commission:</strong> {{commission_amount}}</p>
    <div style="margin-bottom: 12px;">{{tax_breakdown}}</div>
    <div style="border-top: 2px solid #1F2B6D; padding-top: 10px; display: flex; justify-content: space-between; font-weight: 700; font-size: 15px;">
      <span>Total Invoice Amount</span>
      <span>{{total_amount}}</span>
    </div>
    <p style="margin: 8px 0 0; font-size: 11px; color: #64748b;"><em>{{amount_in_words}}</em></p>
  </div>
</div>`,
  WALLET_RECHARGE_RECEIPT: `<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 700px; margin: 0 auto; color: #0f172a;">
  <div style="background: #1F2B6D; color: #ffffff; padding: 20px 24px; border-radius: 10px 10px 0 0; border-top: 4px solid #10B981;">
    <h2 style="margin: 0; font-size: 18px; color: #ffffff;">ZAROORAT · {{company_legal_name}}</h2>
    <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.9;">COMMISSION WALLET RECHARGE RECEIPT · PREPAID DEPOSIT (0% GST AT TOP-UP)</p>
  </div>
  <div style="border: 1px solid #e2e8f0; border-top: 0; padding: 20px 24px; border-radius: 0 0 10px 10px;">
    <p style="margin: 0 0 12px; font-size: 12px; color: #475569;">
      <strong>Receipt #:</strong> {{invoice_number}} &nbsp;|&nbsp;
      <strong>Date:</strong> {{invoice_date}}
    </p>
    <p style="margin: 0 0 12px; font-size: 12px;">
      <strong>Supplier GSTIN:</strong> {{company_gstin}} (State {{supplier_state_code}})<br/>
      <span>{{company_address}}</span>
    </p>
    <p style="margin: 0 0 16px; font-size: 12px;">
      <strong>Driver Partner:</strong> {{driver_name}} (ID: {{driver_id}})
    </p>
    <div style="margin-bottom: 12px;">{{fare_breakdown}}</div>
    <div style="border-top: 2px solid #1F2B6D; padding-top: 10px; display: flex; justify-content: space-between; font-weight: 700; font-size: 15px;">
      <span>Amount Credited to Commission Wallet</span>
      <span>{{total_amount}}</span>
    </div>
    <p style="margin: 8px 0 0; font-size: 11px; color: #64748b;"><em>{{amount_in_words}} · Prepaid refundable deposit; GST &amp; platform commission are assessed per completed ride.</em></p>
  </div>
</div>`,
  DRIVER_SETTLEMENT_STATEMENT: `<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 700px; margin: 0 auto; color: #0f172a;">
  <div style="background: #1F2B6D; color: #ffffff; padding: 20px 24px; border-radius: 10px 10px 0 0;">
    <h2 style="margin: 0; font-size: 18px; color: #ffffff;">{{company_legal_name}}</h2>
    <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.9;">DRIVER RIDE SETTLEMENT STATEMENT</p>
  </div>
  <div style="border: 1px solid #e2e8f0; border-top: 0; padding: 20px 24px; border-radius: 0 0 10px 10px;">
    <p style="margin: 0 0 12px; font-size: 12px; color: #475569;">
      <strong>Statement #:</strong> {{invoice_number}} &nbsp;|&nbsp;
      <strong>Date:</strong> {{invoice_date}} &nbsp;|&nbsp;
      <strong>Trip:</strong> {{trip_id}}
    </p>
    <p style="margin: 0 0 12px; font-size: 12px;">
      <strong>Driver Partner:</strong> {{driver_name}} (ID: {{driver_id}})
    </p>
    <div style="margin-bottom: 12px;">{{fare_breakdown}}</div>
    <p style="margin: 0 0 6px; font-size: 12px;"><strong>Platform Commission Deducted:</strong> {{commission_amount}}</p>
    <p style="margin: 0 0 12px; font-size: 12px;"><strong>Ride GST Recovery:</strong> {{gst_recovery_amount}}</p>
    <div style="border-top: 2px solid #1F2B6D; padding-top: 10px; display: flex; justify-content: space-between; font-weight: 700; font-size: 15px;">
      <span>Net Driver Settlement</span>
      <span>{{total_amount}}</span>
    </div>
  </div>
</div>`,
  CREDIT_NOTE: `<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 700px; margin: 0 auto; color: #0f172a;">
  <div style="background: #1F2B6D; color: #ffffff; padding: 20px 24px; border-radius: 10px 10px 0 0;">
    <h2 style="margin: 0; font-size: 18px; color: #ffffff;">{{company_legal_name}}</h2>
    <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.9;">GST CREDIT NOTE · SAC {{sac_code}}</p>
  </div>
  <div style="border: 1px solid #e2e8f0; border-top: 0; padding: 20px 24px; border-radius: 0 0 10px 10px;">
    <p style="margin: 0 0 12px; font-size: 12px;">
      <strong>Credit Note #:</strong> {{invoice_number}} &nbsp;|&nbsp;
      <strong>Date:</strong> {{invoice_date}} &nbsp;|&nbsp;
      <strong>Trip:</strong> {{trip_id}}
    </p>
    <p style="margin: 0 0 12px; font-size: 12px;">
      <strong>Supplier GSTIN:</strong> {{company_gstin}} &nbsp;|&nbsp;
      <strong>Customer:</strong> {{customer_name}}
    </p>
    <div style="margin-bottom: 12px;">{{fare_breakdown}}</div>
    <div style="margin-bottom: 12px;">{{tax_breakdown}}</div>
    <div style="border-top: 2px solid #1F2B6D; padding-top: 10px; display: flex; justify-content: space-between; font-weight: 700; font-size: 15px;">
      <span>Total Credit Value</span>
      <span>{{total_amount}}</span>
    </div>
  </div>
</div>`,
  SUBSCRIPTION_INVOICE: `<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 700px; margin: 0 auto; color: #0f172a;">
  <div style="background: #1F2B6D; color: #ffffff; padding: 20px 24px; border-radius: 10px 10px 0 0;">
    <h2 style="margin: 0; font-size: 18px; color: #ffffff;">{{company_legal_name}}</h2>
    <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.9;">SUBSCRIPTION TAX INVOICE · SAC {{sac_code}}</p>
  </div>
  <div style="border: 1px solid #e2e8f0; border-top: 0; padding: 20px 24px; border-radius: 0 0 10px 10px;">
    <p style="margin: 0 0 12px; font-size: 12px;">
      <strong>Invoice #:</strong> {{invoice_number}} &nbsp;|&nbsp;
      <strong>Date:</strong> {{invoice_date}}
    </p>
    <p style="margin: 0 0 12px; font-size: 12px;">
      <strong>Driver Partner:</strong> {{driver_name}} (ID: {{driver_id}})<br/>
      <strong>Plan:</strong> {{subscription_plan}} ({{subscription_amount}})
    </p>
    <div style="margin-bottom: 12px;">{{tax_breakdown}}</div>
    <div style="border-top: 2px solid #1F2B6D; padding-top: 10px; display: flex; justify-content: space-between; font-weight: 700; font-size: 15px;">
      <span>Total Subscription Payable</span>
      <span>{{total_amount}}</span>
    </div>
  </div>
</div>`,
}

interface UploadComplianceTemplateModalProps {
  isOpen: boolean
  isPending: boolean
  onClose: () => void
  onSubmit: (payload: {
    documentType: FiscalDocumentType
    name: string
    fileName: string
    mimeType: 'text/html'
    content: string
    versionNote: string | null
    activateImmediately: boolean
  }) => Promise<void>
}

export const UploadComplianceTemplateModal: React.FC<UploadComplianceTemplateModalProps> = ({
  isOpen,
  isPending,
  onClose,
  onSubmit,
}) => {
  const [documentType, setDocumentType] = useState<FiscalDocumentType>('PASSENGER_TAX_INVOICE')
  const [name, setName] = useState('')
  const [fileName, setFileName] = useState('passenger-tax-invoice.html')
  const [versionNote, setVersionNote] = useState('')
  const [content, setContent] = useState(PRODUCTION_STARTER_TEMPLATES.PASSENGER_TAX_INVOICE)
  const [isCustomContent, setIsCustomContent] = useState(false)
  const [editorTab, setEditorTab] = useState<'markup' | 'preview'>('markup')
  const [activateImmediately, setActivateImmediately] = useState(true)

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  const unknownPlaceholders = useMemo(() => {
    const unknown = new Set<string>()
    for (const match of content.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)) {
      const key = match[1]
      if (key && !SUPPORTED_SET.has(key)) unknown.add(key)
    }
    return [...unknown]
  }, [content])

  const previewHtmlDoc = useMemo(() => {
    const styled = content.replace(
      /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
      '<span style="display:inline-block;padding:1px 6px;border-radius:4px;background:#EEF2FF;color:#1F2B6D;font-family:monospace;font-size:11px;font-weight:700;">{{$1}}</span>',
    )
    return `<!doctype html><html><head><meta charset="utf-8" /><style>body{padding:16px;margin:0;background:#ffffff;}</style></head><body>${styled}</body></html>`
  }, [content])

  if (!isOpen) return null

  const handleDocumentTypeChange = (nextType: FiscalDocumentType) => {
    setDocumentType(nextType)
    if (!isCustomContent) {
      setContent(PRODUCTION_STARTER_TEMPLATES[nextType])
      setFileName(`${nextType.toLowerCase().replace(/_/g, '-')}.html`)
    }
  }

  const handleFilePick = (file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      setFileName(file.name)
      setContent(text)
      setIsCustomContent(true)
    }
    reader.readAsText(file)
  }

  const insertPlaceholder = (token: string) => {
    setContent((prev) => `${prev}${prev.endsWith(' ') || prev.endsWith('\n') ? '' : ' '}{{${token}}}`)
    setIsCustomContent(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (unknownPlaceholders.length > 0) return
    await onSubmit({
      documentType,
      name: name.trim(),
      fileName: fileName.trim() || 'template.html',
      mimeType: 'text/html',
      content,
      versionNote: versionNote.trim() || null,
      activateImmediately,
    })
    setName('')
    setVersionNote('')
    setIsCustomContent(false)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] m-0 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/60 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#1F2B6D] dark:text-white leading-tight">
                Upload Invoice Template
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Start from our production starter HTML or upload your own layout with live preview.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={(e) => void handleFormSubmit(e)} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Document Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={documentType}
                  onChange={(e) => handleDocumentTypeChange(e.target.value as FiscalDocumentType)}
                  className="w-full h-10 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D]"
                >
                  {(Object.keys(DOCUMENT_TYPE_LABELS) as FiscalDocumentType[]).map((k) => (
                    <option key={k} value={k}>
                      {DOCUMENT_TYPE_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Template Name <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder={`e.g., Zaroorat ${DOCUMENT_TYPE_LABELS[documentType]} v1`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Import HTML File <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="file"
                  accept=".html,.htm,.txt"
                  onChange={(e) => handleFilePick(e.target.files?.[0] ?? null)}
                  className="w-full text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-[#1F2B6D] hover:file:bg-slate-200 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Version Note <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Standard GST layout FY 2026-27"
                  value={versionNote}
                  onChange={(e) => setVersionNote(e.target.value)}
                  className="w-full h-10 px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D]"
                />
              </div>
            </div>

            {/* Clickable Supported Placeholders */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileCode2 className="w-3.5 h-3.5 text-[#1F2B6D] dark:text-blue-400" />
                  Supported Placeholders (click to insert)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setContent(PRODUCTION_STARTER_TEMPLATES[documentType])
                    setIsCustomContent(false)
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  Load Production Starter
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 max-h-24 overflow-y-auto">
                {SUPPORTED_TEMPLATE_PLACEHOLDERS.map((token) => (
                  <button
                    key={token}
                    type="button"
                    onClick={() => insertPlaceholder(token)}
                    className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-[#1F2B6D] hover:text-[#1F2B6D] text-[10.5px] font-mono font-semibold text-slate-600 dark:text-slate-300 transition cursor-pointer"
                  >
                    {`{{${token}}}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Markup Editor / Visual Preview Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditorTab('markup')}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                      editorTab === 'markup'
                        ? 'bg-[#1F2B6D] text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <FileCode2 className="w-3 h-3" />
                    HTML Markup
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorTab('preview')}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                      editorTab === 'preview'
                        ? 'bg-[#1F2B6D] text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    Live Preview
                  </button>
                </div>

                {unknownPlaceholders.length === 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    All placeholders valid
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Unsupported: {unknownPlaceholders.map((p) => `{{${p}}}`).join(', ')}
                  </span>
                )}
              </div>

              {editorTab === 'markup' ? (
                <textarea
                  required
                  rows={8}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value)
                    setIsCustomContent(true)
                  }}
                  className="w-full text-[11.5px] font-mono px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D]"
                />
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white">
                  <iframe
                    title="Template Live Preview"
                    srcDoc={previewHtmlDoc}
                    sandbox=""
                    className="w-full h-64 border-0 bg-white"
                  />
                </div>
              )}
            </div>

            {/* Direct Activation Toggle (Zero CA Approval Hoop) */}
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer">
              <input
                type="checkbox"
                checked={activateImmediately}
                onChange={(e) => setActivateImmediately(e.target.checked)}
                className="w-4 h-4 rounded accent-[#1F2B6D] cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                  Activate immediately for {DOCUMENT_TYPE_LABELS[documentType]}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Sets this template live right after saving (no extra approval step required).
                </span>
              </div>
            </label>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[10px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || unknownPlaceholders.length > 0}
              className="px-5 py-2 rounded-[10px] bg-[#1F2B6D] hover:bg-[#182258] text-white text-xs font-semibold shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              {isPending
                ? 'Saving…'
                : activateImmediately
                  ? 'Save & Activate Template'
                  : 'Save Template Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}

export default UploadComplianceTemplateModal
