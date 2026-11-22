import React, { useEffect, useState } from 'react'
import { FileText, Download, Loader2, AlertTriangle, RefreshCw } from 'lucide-react'
import type { FiscalDocumentType } from '../../api/fiscal.api'
import { PricingManagementService } from '../../services'
import { PricingDetailsModal } from '../../components/PricingDetailsModal'
import { DOCUMENT_TYPE_LABELS } from './FiscalDocumentDetailsModal'
import type { GstRegistrationOption } from './CreateDocumentSeriesModal'

interface DefaultInvoicePreviewModalProps {
  isOpen: boolean
  gstRegistrations: GstRegistrationOption[]
  onClose: () => void
}

export const DefaultInvoicePreviewModal: React.FC<DefaultInvoicePreviewModalProps> = ({
  isOpen,
  gstRegistrations,
  onClose,
}) => {
  const [documentType, setDocumentType] = useState<FiscalDocumentType>('PASSENGER_TAX_INVOICE')
  const [gstRegistrationId, setGstRegistrationId] = useState<string>('')
  const [supplyMode, setSupplyMode] = useState<'intra' | 'inter'>('intra')
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [reloadTick, setReloadTick] = useState(0)

  const selectedReg =
    gstRegistrations.find((r) => r.id === gstRegistrationId) ?? gstRegistrations[0] ?? null

  useEffect(() => {
    if (!isOpen) return
    let active = true
    let objectUrl: string | null = null

    setLoading(true)
    setErrorMsg(null)

    const supplierState = selectedReg?.stateCode ?? '01'
    const placeOfSupplyStateCode =
      supplyMode === 'inter' ? (supplierState === '07' ? '27' : '07') : supplierState

    PricingManagementService.previewSampleFiscalPdfBlob({
      documentType,
      ...(selectedReg?.id ? { gstRegistrationId: selectedReg.id } : {}),
      placeOfSupplyStateCode,
    })
      .then((blob) => {
        if (!active) return
        objectUrl = URL.createObjectURL(blob)
        setPdfBlob(blob)
        setPdfUrl(objectUrl)
      })
      .catch((err: unknown) => {
        if (!active) return
        const maybe = err as { message?: string }
        setErrorMsg(
          maybe?.message || 'Unable to generate sample PDF preview. Make sure zaroorat-back is restarted.',
        )
        setPdfBlob(null)
        setPdfUrl(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [isOpen, documentType, selectedReg?.id, selectedReg?.stateCode, supplyMode, reloadTick])

  const handleDownload = () => {
    if (!pdfBlob) return
    const url = URL.createObjectURL(pdfBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zaroorat-default-${documentType.toLowerCase()}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <PricingDetailsModal
      isOpen={isOpen}
      onClose={onClose}
      badge={<FileText className="w-4 h-4" />}
      title="Default Production Invoice Preview"
      subtitle="Live A4 PDF rendered by zaroorat-back using your active Legal Entity, State GSTIN, SAC & live GST settings. No sequence consumed."
      statusBadges={[
        { label: 'Zaroorat Theme PDF', tone: 'blue' },
        documentType === 'WALLET_RECHARGE_RECEIPT'
          ? { label: 'Prepaid Deposit (0% GST)', tone: 'emerald' }
          : {
              label: supplyMode === 'inter' ? 'Inter-State (IGST)' : 'Intra-State (CGST+SGST)',
              tone: 'emerald',
            },
      ]}
      footerActions={
        <>
          <button
            type="button"
            disabled={!pdfBlob || loading}
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-[#1F2B6D] dark:text-blue-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Sample PDF</span>
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => setReloadTick((t) => t + 1)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Regenerate</span>
          </button>
        </>
      }
    >
      {/* Controls Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
            Document Type
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as FiscalDocumentType)}
            className="w-full h-9 px-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
          >
            {(Object.keys(DOCUMENT_TYPE_LABELS) as FiscalDocumentType[]).map((k) => (
              <option key={k} value={k}>
                {DOCUMENT_TYPE_LABELS[k]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
            State GSTIN
          </label>
          <select
            value={gstRegistrationId || selectedReg?.id || ''}
            onChange={(e) => setGstRegistrationId(e.target.value)}
            className="w-full h-9 px-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
          >
            {gstRegistrations.length === 0 ? (
              <option value="">Default (Unconfigured GSTIN)</option>
            ) : (
              gstRegistrations.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.gstin} ({r.stateCode})
                </option>
              ))
            )}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
            Supply Jurisdiction
          </label>
          <select
            value={supplyMode}
            onChange={(e) => setSupplyMode(e.target.value as 'intra' | 'inter')}
            className="w-full h-9 px-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
          >
            <option value="intra">Intra-State (CGST + SGST)</option>
            <option value="inter">Inter-State (IGST)</option>
          </select>
        </div>
      </div>

      {/* Inline Live PDF Viewport */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 overflow-hidden min-h-[420px] flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 p-10 text-xs text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-[#1F2B6D]" />
            <span>Rendering live default production PDF from PostgreSQL settings…</span>
          </div>
        ) : errorMsg ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 p-8 text-center">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-md">
              {errorMsg}
            </p>
          </div>
        ) : pdfUrl ? (
          <iframe
            title="Default Production Invoice PDF Preview"
            src={pdfUrl}
            className="w-full h-[460px] border-0 bg-white"
          />
        ) : null}
      </div>
    </PricingDetailsModal>
  )
}

export default DefaultInvoicePreviewModal
