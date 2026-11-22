import React from 'react'
import {
  FileText,
  Coins,
  Receipt,
  Layers,
  User,
  Car,
  Building2,
  MapPin,
  Hash,
  Calendar,
  ShieldCheck,
  Download,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import type { FiscalDocumentDto, FiscalDocumentType } from '../../api/fiscal.api'
import {
  PricingDetailsModal,
  DetailsKpiCard,
  DetailsSpecList,
  DetailsSpecRow,
} from '../../components/PricingDetailsModal'

export const DOCUMENT_TYPE_LABELS: Record<FiscalDocumentType, string> = {
  PASSENGER_TAX_INVOICE: 'Passenger Tax Invoice',
  COMMISSION_TAX_INVOICE: 'Commission Tax Invoice',
  WALLET_RECHARGE_RECEIPT: 'Commission Wallet Recharge Receipt',
  DRIVER_SETTLEMENT_STATEMENT: 'Driver Settlement Statement',
  CREDIT_NOTE: 'Credit Note',
  SUBSCRIPTION_INVOICE: 'Subscription Invoice',
}

interface FiscalDocumentDetailsModalProps {
  doc: FiscalDocumentDto | null
  canWrite: boolean
  downloading?: boolean
  onClose: () => void
  onDownloadPdf: (doc: FiscalDocumentDto) => void
  onVoid?: (doc: FiscalDocumentDto) => void
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const FiscalDocumentDetailsModal: React.FC<FiscalDocumentDetailsModalProps> = ({
  doc,
  canWrite,
  downloading = false,
  onClose,
  onDownloadPdf,
  onVoid,
}) => {
  if (!doc) return null

  const taxLabel = doc.isInterState
    ? `IGST (${doc.igstRatePct}%)`
    : `CGST (${doc.cgstRatePct}%) + SGST (${doc.sgstRatePct}%)`

  return (
    <PricingDetailsModal
      isOpen={Boolean(doc)}
      onClose={onClose}
      badge={<FileText className="w-4 h-4" />}
      title={doc.documentNumber}
      subtitle={`${DOCUMENT_TYPE_LABELS[doc.documentType]} · Immutable server-issued fiscal record from locked ride snapshot.`}
      statusBadges={[
        {
          label: doc.status,
          tone: doc.status === 'ISSUED' ? 'emerald' : 'rose',
        },
        {
          label: doc.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST+SGST)',
          tone: 'blue',
        },
      ]}
      footerActions={
        <>
          <button
            type="button"
            disabled={downloading}
            onClick={() => onDownloadPdf(doc)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-[#1F2B6D] dark:text-blue-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading ? 'Preparing PDF…' : 'Download Official PDF'}</span>
          </button>
          {canWrite && doc.status === 'ISSUED' && onVoid && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onVoid(doc)
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Void Document</span>
            </button>
          )}
        </>
      }
    >
      {/* Void Banner if Voided */}
      {doc.status === 'VOIDED' && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Document Permanently Voided ({formatDateTime(doc.voidedAt)})</p>
            {doc.voidReason && <p className="text-[11.5px] opacity-90">Reason: {doc.voidReason}</p>}
          </div>
        </div>
      )}

      {/* Financial KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <DetailsKpiCard
          icon={<Coins className="w-3.5 h-3.5" />}
          label="Taxable Value"
          value={`₹${doc.taxableValue.toFixed(2)}`}
          sublabel={
            doc.nonTaxableValue > 0
              ? `+ ₹${doc.nonTaxableValue.toFixed(2)} non-taxable`
              : 'Net taxable base'
          }
        />
        <DetailsKpiCard
          icon={<Receipt className="w-3.5 h-3.5" />}
          label="Total GST"
          value={`₹${doc.totalTaxAmount.toFixed(2)}`}
          sublabel={taxLabel}
        />
        <DetailsKpiCard
          highlighted
          icon={<Layers className="w-3.5 h-3.5" />}
          label="Grand Total"
          value={`₹${doc.totalAmount.toFixed(2)}`}
          sublabel={`${doc.currency || 'INR'} · Seq #${doc.sequenceNumber}`}
        />
      </div>

      {/* Jurisdiction & Entity Details */}
      <DetailsSpecList>
        <DetailsSpecRow
          icon={<FileText className="w-4 h-4" />}
          label="Document Type"
          value={DOCUMENT_TYPE_LABELS[doc.documentType]}
        />
        <DetailsSpecRow
          icon={<User className="w-4 h-4" />}
          label="Recipient"
          value={
            <span className="inline-flex items-center gap-2">
              <span>{doc.recipientName}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10.5px] font-bold uppercase text-slate-600 dark:text-slate-300">
                {doc.recipientType}
              </span>
            </span>
          }
        />
        <DetailsSpecRow
          icon={<Car className="w-4 h-4" />}
          label="Linked Ride"
          value={<span className="font-mono">{doc.rideCode ?? '—'}</span>}
        />
        <DetailsSpecRow
          icon={<Building2 className="w-4 h-4" />}
          label="Supplier Legal Entity"
          value={
            <div className="space-y-0.5">
              <div>{doc.supplierLegalName}</div>
              <div className="font-mono text-[11px] font-semibold text-slate-500">
                GSTIN: {doc.supplierGstin}
              </div>
            </div>
          }
        />
        <DetailsSpecRow
          icon={<MapPin className="w-4 h-4" />}
          label="Supply Jurisdiction"
          value={
            <span className="font-mono">
              State {doc.supplierStateCode} → PoS {doc.placeOfSupplyStateCode}
            </span>
          }
        />
        <DetailsSpecRow
          icon={<ShieldCheck className="w-4 h-4" />}
          label="SAC Code"
          value={<span className="font-mono">{doc.sacCode ?? 'Not assigned'}</span>}
        />
        <DetailsSpecRow
          icon={<Calendar className="w-4 h-4" />}
          label="Issued Timestamp"
          value={<span className="font-mono">{formatDateTime(doc.issuedAt)}</span>}
        />
        <DetailsSpecRow
          icon={<Hash className="w-4 h-4" />}
          label="Integrity SHA-256"
          value={
            <span className="font-mono text-[11px] font-normal text-slate-500 break-all">
              {doc.contentSha256}
            </span>
          }
        />
      </DetailsSpecList>

      {/* Immutable Line Items Breakdown */}
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 p-4 space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-[#1F2B6D] dark:text-blue-300">
          <Receipt className="w-4 h-4" />
          <span>Immutable Line Items ({doc.lineItems.length})</span>
        </div>

        <div className="space-y-1.5 text-xs">
          {doc.lineItems.map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="flex justify-between gap-4 py-1.5 border-b border-slate-200/60 dark:border-slate-700/60"
            >
              <span className="text-slate-700 dark:text-slate-200">
                {item.label}
                {item.note && <span className="text-slate-400 ml-1.5">({item.note})</span>}
              </span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                ₹{item.amount.toFixed(2)}
              </span>
            </div>
          ))}
          <div className="flex justify-between pt-1 text-slate-600 dark:text-slate-300">
            <span>Taxable Subtotal</span>
            <span className="font-mono font-semibold">₹{doc.taxableValue.toFixed(2)}</span>
          </div>
          {doc.nonTaxableValue > 0 && (
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Non-Taxable Charges</span>
              <span className="font-mono font-semibold">₹{doc.nonTaxableValue.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600 dark:text-slate-300">
            <span>{taxLabel}</span>
            <span className="font-mono font-semibold">₹{doc.totalTaxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 font-bold text-[#1F2B6D] dark:text-blue-300 text-[13px]">
            <span>Grand Total</span>
            <span className="font-mono">₹{doc.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </PricingDetailsModal>
  )
}

export default FiscalDocumentDetailsModal
