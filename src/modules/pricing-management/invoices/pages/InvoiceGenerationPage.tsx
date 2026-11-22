import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import DatePicker from '@/shared/components/ui/DatePicker'
import { ActionDropdown, type DropdownAction } from '@/modules/driver-management/components/ActionDropdown'
import { useToast } from '@/shared/context/toast'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  Coins,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Hash,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ToggleRight,
  Upload,
  XCircle,
} from 'lucide-react'
import {
  useActivateComplianceTemplate,
  useComplianceTemplates,
  useCreateComplianceTemplate,
  useCreateDocumentSeries,
  useDocumentSeries,
  useFiscalDocuments,
  useLegalEntities,
  usePricingSummary,
  useVoidFiscalDocument,
} from '../../hooks'
import { PricingManagementService } from '../../services'
import type {
  ComplianceTemplateDto,
  DocumentSeriesDto,
  FiscalDocumentDto,
  FiscalDocumentType,
} from '../../api/fiscal.api'
import { PricingSuccessModal } from '../../components/PricingSuccessModal'
import {
  PricingDetailsModal,
  DetailsKpiCard,
  DetailsSpecList,
  DetailsSpecRow,
} from '../../components/PricingDetailsModal'
import {
  FiscalDocumentDetailsModal,
  DOCUMENT_TYPE_LABELS,
} from '../components/FiscalDocumentDetailsModal'
import { ComplianceTemplateDetailsModal } from '../components/ComplianceTemplateDetailsModal'
import {
  CreateDocumentSeriesModal,
  type GstRegistrationOption,
} from '../components/CreateDocumentSeriesModal'
import { UploadComplianceTemplateModal } from '../components/UploadComplianceTemplateModal'
import { VoidFiscalDocumentModal } from '../components/VoidFiscalDocumentModal'
import { DefaultInvoicePreviewModal } from '../components/DefaultInvoicePreviewModal'

type ActiveTab = 'documents' | 'series' | 'templates'

function currentIndianFinancialYear(now = new Date()): string {
  const year = now.getFullYear()
  const startYear = now.getMonth() >= 3 ? year : year - 1
  const endShort = String((startYear + 1) % 100).padStart(2, '0')
  return `${startYear}-${endShort}`
}

function getApiErrorMessage(err: unknown, fallback: string): string {
  const maybe = err as {
    response?: { data?: { error?: { message?: string }; message?: string } }
    message?: string
  }
  return (
    maybe?.response?.data?.error?.message ||
    maybe?.response?.data?.message ||
    maybe?.message ||
    fallback
  )
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function formatNextInvoiceNumber(prefix: string, lastSequence: number): string {
  return `${prefix}${String(lastSequence + 1).padStart(6, '0')}`
}

export const InvoiceGenerationPage: React.FC = () => {
  const navigate = useNavigate()
  const { success: showSuccess, error: showError } = useToast()
  const user = useAuthStore((state) => state.user)
  const canWrite = hasPermission(user, 'pricing:write')

  // Active tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('documents')

  // Tab 1 filters
  const [searchQuery, setSearchQuery] = useState('')
  const [recipientFilter, setRecipientFilter] = useState<'all' | 'RIDER' | 'DRIVER'>('all')
  const [docTypeFilter, setDocTypeFilter] = useState<'' | FiscalDocumentType>('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ISSUED' | 'VOIDED'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Tab 2 & 3 filters
  const [seriesSearch, setSeriesSearch] = useState('')
  const [templateSearch, setTemplateSearch] = useState('')
  const [templateTypeFilter, setTemplateTypeFilter] = useState<'' | FiscalDocumentType>('')

  // Selection sets required by shared DataTable
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set())
  const [selectedSeriesIds, setSelectedSeriesIds] = useState<Set<string>>(new Set())
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set())

  // Busy states
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [exportingCsv, setExportingCsv] = useState(false)

  // Executive Modals
  const [inspectDoc, setInspectDoc] = useState<FiscalDocumentDto | null>(null)
  const [inspectSeries, setInspectSeries] = useState<DocumentSeriesDto | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<ComplianceTemplateDto | null>(null)
  const [voidTarget, setVoidTarget] = useState<FiscalDocumentDto | null>(null)
  const [createSeriesOpen, setCreateSeriesOpen] = useState(false)
  const [uploadTemplateOpen, setUploadTemplateOpen] = useState(false)
  const [defaultPreviewOpen, setDefaultPreviewOpen] = useState(false)
  const [successModal, setSuccessModal] = useState<{
    title: string
    message: string
    primaryText: string
  } | null>(null)

  const isoFrom = dateFrom ? `${dateFrom}T00:00:00.000Z` : undefined
  const isoTo = dateTo ? `${dateTo}T23:59:59.999Z` : undefined

  // Queries
  const docsQ = useFiscalDocuments({
    page: 1,
    limit: 100,
    recipientType: recipientFilter,
    documentType: docTypeFilter || undefined,
    status: statusFilter,
    from: isoFrom,
    to: isoTo,
    search: searchQuery.trim() || undefined,
  })
  const seriesQ = useDocumentSeries()
  const templatesQ = useComplianceTemplates()
  const legalEntitiesQ = useLegalEntities()
  const summaryQ = usePricingSummary()

  // Mutations
  const voidMutation = useVoidFiscalDocument()
  const createSeriesMutation = useCreateDocumentSeries()
  const createTemplateMutation = useCreateComplianceTemplate()
  const activateTemplateMutation = useActivateComplianceTemplate()

  const documents = docsQ.data?.data ?? []
  const seriesList = seriesQ.data ?? []
  const templateList = templatesQ.data ?? []
  const issuanceEnabled = summaryQ.data?.flags.fiscalDocumentsIssue ?? false

  const allGstRegistrations = useMemo<GstRegistrationOption[]>(() => {
    const entities = legalEntitiesQ.data ?? []
    return entities.flatMap((le) =>
      le.gstRegistrations
        .filter((reg) => reg.isActive)
        .map((reg) => ({
          id: reg.id,
          gstin: reg.gstin,
          stateCode: reg.stateCode,
          stateName: reg.stateName,
          legalEntityName: le.legalEntityName,
          label: `${reg.gstin} · ${reg.stateName} (${reg.stateCode}) — ${le.legalEntityName}`,
        })),
    )
  }, [legalEntitiesQ.data])

  // KPI Metrics (100% live from PostgreSQL)
  const totalDocsCount = docsQ.data?.meta?.totalCount ?? documents.length
  const issuedDocsCount = useMemo(
    () => documents.filter((d) => d.status === 'ISSUED').length,
    [documents],
  )
  const voidedDocsCount = useMemo(
    () => documents.filter((d) => d.status === 'VOIDED').length,
    [documents],
  )
  const totalInvoicedAmount = useMemo(
    () =>
      documents
        .filter((d) => d.status === 'ISSUED')
        .reduce((sum, d) => sum + d.totalAmount, 0),
    [documents],
  )
  const totalGstCollected = useMemo(
    () =>
      documents
        .filter((d) => d.status === 'ISSUED')
        .reduce((sum, d) => sum + d.totalTaxAmount, 0),
    [documents],
  )
  const activeSeriesCount = useMemo(
    () => seriesList.filter((s) => s.isActive).length,
    [seriesList],
  )
  const activeTemplatesCount = useMemo(
    () => templateList.filter((t) => t.isActive).length,
    [templateList],
  )

  const filteredSeries = useMemo(() => {
    if (!seriesSearch.trim()) return seriesList
    const q = seriesSearch.toLowerCase()
    return seriesList.filter(
      (s) =>
        s.prefix.toLowerCase().includes(q) ||
        s.gstin.toLowerCase().includes(q) ||
        s.stateName.toLowerCase().includes(q) ||
        s.legalEntityName.toLowerCase().includes(q) ||
        DOCUMENT_TYPE_LABELS[s.documentType].toLowerCase().includes(q),
    )
  }, [seriesList, seriesSearch])

  const filteredTemplates = useMemo(() => {
    return templateList.filter((t) => {
      if (templateTypeFilter && t.documentType !== templateTypeFilter) return false
      if (!templateSearch.trim()) return true
      const q = templateSearch.toLowerCase()
      return (
        t.name.toLowerCase().includes(q) ||
        t.fileName.toLowerCase().includes(q) ||
        DOCUMENT_TYPE_LABELS[t.documentType].toLowerCase().includes(q)
      )
    })
  }, [templateList, templateSearch, templateTypeFilter])

  const hasDocFilters = Boolean(
    searchQuery || recipientFilter !== 'all' || docTypeFilter || statusFilter !== 'all' || dateFrom || dateTo,
  )

  const handleResetDocFilters = () => {
    setSearchQuery('')
    setRecipientFilter('all')
    setDocTypeFilter('')
    setStatusFilter('all')
    setDateFrom('')
    setDateTo('')
  }

  const handleRefreshAll = () => {
    void docsQ.refetch()
    void seriesQ.refetch()
    void templatesQ.refetch()
    void summaryQ.refetch()
  }

  const handleDownloadPdf = async (doc: FiscalDocumentDto) => {
    setDownloadingId(doc.id)
    try {
      const blob = await PricingManagementService.downloadFiscalPdfBlob(doc.id)
      triggerBlobDownload(blob, `${doc.documentNumber}.pdf`)
      showSuccess('PDF Ready', `Downloaded official PDF for ${doc.documentNumber}.`)
    } catch (err) {
      showError('PDF Download Failed', getApiErrorMessage(err, 'Failed to download PDF'))
    } finally {
      setDownloadingId(null)
    }
  }

  const handleExportCsv = async () => {
    setExportingCsv(true)
    try {
      const blob = await PricingManagementService.exportFiscalDocumentsCsvBlob({
        recipientType: recipientFilter,
        documentType: docTypeFilter || undefined,
        status: statusFilter,
        from: isoFrom,
        to: isoTo,
        search: searchQuery.trim() || undefined,
      })
      const stamp = new Date().toISOString().slice(0, 10)
      triggerBlobDownload(blob, `zaroorat-fiscal-documents-${stamp}.csv`)
      showSuccess('Audited CSV Exported', 'Export recorded in server admin audit log.')
    } catch (err) {
      showError('CSV Export Failed', getApiErrorMessage(err, 'CSV export failed'))
    } finally {
      setExportingCsv(false)
    }
  }

  const handleConfirmVoid = async (id: string, reason: string) => {
    const docNum = voidTarget?.documentNumber ?? id
    try {
      await voidMutation.mutateAsync({ id, reason })
      showSuccess(
        'Fiscal Document Voided',
        `${docNum} permanently voided. Original sequence number remains immutable.`,
      )
      setVoidTarget(null)
    } catch (err) {
      showError('Void Failed', getApiErrorMessage(err, 'Failed to void document'))
    }
  }

  const handleCreateSeries = async (payload: {
    gstRegistrationId: string
    documentType: FiscalDocumentType
    financialYear: string
    prefix: string
  }) => {
    try {
      await createSeriesMutation.mutateAsync(payload)
      setCreateSeriesOpen(false)
      setActiveTab('series')
      setSuccessModal({
        title: 'Document Series Created',
        message: `Gapless numbering series "${payload.prefix}" (${payload.financialYear}) has been saved to PostgreSQL.`,
        primaryText: 'View Document Series',
      })
    } catch (err) {
      showError('Could Not Create Series', getApiErrorMessage(err, 'Failed to create document series'))
    }
  }

  const handleCreateTemplate = async (payload: {
    documentType: FiscalDocumentType
    name: string
    fileName: string
    mimeType: 'text/html'
    content: string
    versionNote: string | null
    activateImmediately: boolean
  }) => {
    try {
      const { activateImmediately, ...createPayload } = payload
      const created = await createTemplateMutation.mutateAsync(createPayload)
      if (activateImmediately && created?.id) {
        await activateTemplateMutation.mutateAsync(created.id)
      }
      setUploadTemplateOpen(false)
      setActiveTab('templates')
      setSuccessModal({
        title: activateImmediately ? 'Invoice Template Activated' : 'Invoice Template Saved',
        message: activateImmediately
          ? `Template "${payload.name}" has been saved and set active for ${DOCUMENT_TYPE_LABELS[payload.documentType]}.`
          : `Template "${payload.name}" has been saved to PostgreSQL. You can activate it anytime.`,
        primaryText: 'View Compliance Templates',
      })
    } catch (err) {
      showError('Template Validation Failed', getApiErrorMessage(err, 'Failed to save template'))
    }
  }

  const handleActivateTemplate = async (tpl: ComplianceTemplateDto) => {
    try {
      const updated = await activateTemplateMutation.mutateAsync(tpl.id)
      showSuccess(
        'Template Activated',
        `"${tpl.name}" is now active for ${DOCUMENT_TYPE_LABELS[tpl.documentType]}.`,
      )
      if (previewTemplate?.id === tpl.id) setPreviewTemplate(updated)
    } catch (err) {
      showError('Activation Failed', getApiErrorMessage(err, 'Could not activate template'))
    }
  }

  // ─── Column Definitions (Shared DataTable) ──────────────────────────────────

  const documentColumns: DataTableColumn<FiscalDocumentDto>[] = useMemo(
    () => [
      {
        key: 'documentNumber',
        label: 'Document #',
        sortable: true,
        align: 'left',
        render: (_: unknown, row: FiscalDocumentDto) => (
          <div>
            <span className="font-mono font-bold text-[#1F2B6D] dark:text-white text-xs whitespace-nowrap">
              {row.documentNumber}
            </span>
            <p className="text-[10.5px] text-slate-400 font-mono">
              {new Date(row.issuedAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        ),
      },
      {
        key: 'documentType',
        label: 'Type / Ride',
        sortable: true,
        align: 'left',
        render: (_: unknown, row: FiscalDocumentDto) => (
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs whitespace-nowrap">
              {DOCUMENT_TYPE_LABELS[row.documentType]}
            </span>
            <p className="text-[10.5px] font-mono text-slate-400">{row.rideCode ?? '—'}</p>
          </div>
        ),
      },
      {
        key: 'recipientName',
        label: 'Recipient',
        sortable: true,
        align: 'left',
        render: (_: unknown, row: FiscalDocumentDto) => (
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
              {row.recipientName}
            </span>
            <p className="text-[10px] uppercase font-bold text-slate-400">{row.recipientType}</p>
          </div>
        ),
      },
      {
        key: 'supplierGstin',
        label: 'GSTIN / Jurisdiction',
        align: 'left',
        render: (_: unknown, row: FiscalDocumentDto) => (
          <div>
            <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              {row.supplierGstin}
            </span>
            <p className="text-[10.5px] text-slate-400">
              {row.supplierStateCode} → {row.placeOfSupplyStateCode} (
              {row.isInterState ? 'IGST' : 'CGST+SGST'})
            </p>
          </div>
        ),
      },
      {
        key: 'taxableValue',
        label: 'Taxable',
        sortable: true,
        align: 'right',
        render: (_: unknown, row: FiscalDocumentDto) => (
          <span className="font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
            ₹{row.taxableValue.toFixed(2)}
          </span>
        ),
      },
      {
        key: 'totalTaxAmount',
        label: 'GST',
        sortable: true,
        align: 'right',
        render: (_: unknown, row: FiscalDocumentDto) => (
          <div className="text-right">
            <span className="font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
              ₹{row.totalTaxAmount.toFixed(2)}
            </span>
            <p className="text-[10px] font-mono text-slate-400">
              {row.isInterState
                ? `IGST ${row.igstRatePct}%`
                : `C ${row.cgstRatePct}% + S ${row.sgstRatePct}%`}
            </p>
          </div>
        ),
      },
      {
        key: 'totalAmount',
        label: 'Total',
        sortable: true,
        align: 'right',
        render: (_: unknown, row: FiscalDocumentDto) => (
          <span className="font-mono font-bold text-slate-900 dark:text-white text-xs sm:text-[13px] whitespace-nowrap">
            ₹{row.totalAmount.toFixed(2)}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        align: 'center',
        render: (_: unknown, row: FiscalDocumentDto) =>
          row.status === 'ISSUED' ? (
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-[#E8FAF0] text-[#10B981] dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50">
              Issued
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#EF4444] dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/50">
              Voided
            </span>
          ),
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'center',
        render: (_: unknown, row: FiscalDocumentDto) => {
          const dropActions: DropdownAction[] = [
            {
              label: 'View Details',
              icon: <Eye className="w-4 h-4" />,
              onClick: () => setInspectDoc(row),
            },
            {
              label: 'Download Official PDF',
              icon: <Download className="w-4 h-4" />,
              onClick: () => void handleDownloadPdf(row),
            },
          ]

          if (canWrite && row.status === 'ISSUED') {
            dropActions.push({
              label: 'Void Document',
              icon: <XCircle className="w-4 h-4 text-rose-500" />,
              onClick: () => setVoidTarget(row),
              variant: 'danger',
            })
          }

          return (
            <div
              className="flex items-center justify-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                disabled={downloadingId === row.id}
                onClick={() => void handleDownloadPdf(row)}
                title="Download Official PDF"
                className="p-1.5 text-slate-500 hover:text-[#1F2B6D] dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <ActionDropdown actions={dropActions} />
            </div>
          )
        },
      },
    ],
    [canWrite, downloadingId],
  )

  const seriesColumns: DataTableColumn<DocumentSeriesDto>[] = useMemo(
    () => [
      {
        key: 'prefix',
        label: 'Series Prefix',
        sortable: true,
        align: 'left',
        render: (_: unknown, row: DocumentSeriesDto) => (
          <div>
            <span className="font-mono font-bold text-[#1F2B6D] dark:text-white text-xs sm:text-[13px]">
              {row.prefix}
            </span>
            <p className="text-[10.5px] text-slate-400 font-mono">
              Next: {formatNextInvoiceNumber(row.prefix, row.lastSequence)}
            </p>
          </div>
        ),
      },
      {
        key: 'documentType',
        label: 'Document Type',
        sortable: true,
        align: 'left',
        render: (_: unknown, row: DocumentSeriesDto) => (
          <span className="font-semibold text-slate-700 dark:text-slate-200 text-xs">
            {DOCUMENT_TYPE_LABELS[row.documentType]}
          </span>
        ),
      },
      {
        key: 'financialYear',
        label: 'Financial Year',
        sortable: true,
        align: 'center',
        render: (_: unknown, row: DocumentSeriesDto) => (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
            FY {row.financialYear}
          </span>
        ),
      },
      {
        key: 'gstin',
        label: 'State GSTIN / Legal Entity',
        sortable: true,
        align: 'left',
        render: (_: unknown, row: DocumentSeriesDto) => (
          <div>
            <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
              {row.gstin}
            </span>
            <p className="text-[10.5px] text-slate-400">
              {row.stateName} ({row.stateCode}) · {row.legalEntityName}
            </p>
          </div>
        ),
      },
      {
        key: 'lastSequence',
        label: 'Issued Count',
        sortable: true,
        align: 'right',
        render: (_: unknown, row: DocumentSeriesDto) => (
          <span className="font-mono font-bold text-slate-900 dark:text-white text-xs sm:text-[13px]">
            {row.lastSequence}
          </span>
        ),
      },
      {
        key: 'isActive',
        label: 'Status',
        sortable: true,
        align: 'center',
        render: (_: unknown, row: DocumentSeriesDto) =>
          row.isActive ? (
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-[#E8FAF0] text-[#10B981] border border-emerald-200/60">
              Active
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
              Inactive
            </span>
          ),
      },
      {
        key: 'actions',
        label: 'Details',
        align: 'center',
        render: (_: unknown, row: DocumentSeriesDto) => (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setInspectSeries(row)
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-[#1F2B6D] hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View</span>
          </button>
        ),
      },
    ],
    [],
  )

  const templateColumns: DataTableColumn<ComplianceTemplateDto>[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Template Name',
        sortable: true,
        align: 'left',
        render: (_: unknown, row: ComplianceTemplateDto) => (
          <div>
            <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-[13px]">
              {row.name}
            </span>
            {row.versionNote && (
              <p className="text-[10.5px] text-slate-400 truncate max-w-[260px]">
                {row.versionNote}
              </p>
            )}
          </div>
        ),
      },
      {
        key: 'version',
        label: 'Version',
        sortable: true,
        align: 'center',
        render: (_: unknown, row: ComplianceTemplateDto) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            v{row.version}
          </span>
        ),
      },
      {
        key: 'documentType',
        label: 'Document Type',
        sortable: true,
        align: 'left',
        render: (_: unknown, row: ComplianceTemplateDto) => (
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {DOCUMENT_TYPE_LABELS[row.documentType]}
          </span>
        ),
      },
      {
        key: 'fileName',
        label: 'File Name',
        align: 'left',
        render: (_: unknown, row: ComplianceTemplateDto) => (
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
            {row.fileName}
          </span>
        ),
      },
      {
        key: 'isActive',
        label: 'Status',
        sortable: true,
        align: 'center',
        render: (_: unknown, row: ComplianceTemplateDto) =>
          row.isActive ? (
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-[#E8FAF0] text-[#10B981] border border-emerald-200/60">
              Active
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60">
              Inactive
            </span>
          ),
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'center',
        render: (_: unknown, row: ComplianceTemplateDto) => {
          const dropActions: DropdownAction[] = [
            {
              label: 'Preview & Inspect',
              icon: <Eye className="w-4 h-4" />,
              onClick: () => setPreviewTemplate(row),
            },
          ]

          if (canWrite && !row.isActive) {
            dropActions.push({
              label: 'Activate Now',
              icon: <ToggleRight className="w-4 h-4 text-emerald-600" />,
              onClick: () => void handleActivateTemplate(row),
            })
          }

          return (
            <div
              className="flex items-center justify-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setPreviewTemplate(row)}
                title="Preview Template"
                className="p-1.5 text-slate-500 hover:text-[#1F2B6D] dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <ActionDropdown actions={dropActions} />
            </div>
          )
        },
      },
    ],
    [canWrite],
  )

  return (
    <PageWrapper className="space-y-4 pt-1 pb-6 px-3 sm:px-5 w-full max-w-full overflow-x-hidden">
      {/* ─── 1. Executive Header (Matching Fare / Surge / Cancellation / GST) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/pricing-management')}
            title="Back to Pricing Control Center"
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#1F2B6D] dark:text-white" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F2B6D] dark:text-white">
              Invoices &amp; Fiscal Documents
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Immutable server-issued tax invoices, gapless state GSTIN numbering series, and versioned compliance templates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleRefreshAll}
            title="Refresh data"
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition shadow-2xs cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                docsQ.isFetching || seriesQ.isFetching || templatesQ.isFetching
                  ? 'animate-spin text-[#1F2B6D]'
                  : ''
              }`}
            />
          </button>

          <button
            type="button"
            onClick={() => setDefaultPreviewOpen(true)}
            className="px-3.5 py-2 rounded-[10px] border border-[#1F2B6D]/25 dark:border-blue-500/40 bg-blue-50/70 dark:bg-blue-950/30 shadow-2xs text-xs font-semibold text-[#1F2B6D] dark:text-blue-300 flex items-center gap-1.5 hover:bg-blue-100/70 dark:hover:bg-blue-950/50 transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview Default Invoice</span>
          </button>

          <button
            type="button"
            onClick={() => void handleExportCsv()}
            disabled={exportingCsv}
            className="px-3.5 py-2 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-60"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>{exportingCsv ? 'Exporting…' : 'Audited CSV'}</span>
          </button>

          {canWrite && (
            <button
              type="button"
              onClick={() =>
                activeTab === 'templates'
                  ? setUploadTemplateOpen(true)
                  : setCreateSeriesOpen(true)
              }
              className="bg-[#1F2B6D] hover:bg-[#182258] active:scale-[0.98] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              {activeTab === 'templates' ? (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload Template</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Series</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ─── 2. Top 4 Executive KPI Cards (Matching Pricing Control Center) ──── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Issued Fiscal Documents */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none font-mono">
                {totalDocsCount}
              </p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                Fiscal Documents
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            {issuedDocsCount} issued · {voidedDocsCount} voided
          </p>
        </div>

        {/* Card 2: Total Invoiced Volume */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none font-mono truncate">
                ₹{totalInvoicedAmount.toFixed(2)}
              </p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                Issued Value
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 font-mono">
            Includes ₹{totalGstCollected.toFixed(2)} total GST
          </p>
        </div>

        {/* Card 3: Active Series & Templates */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none font-mono">
                {activeSeriesCount}
              </p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                Active Document Series
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            {activeTemplatesCount} active compliance template{activeTemplatesCount === 1 ? '' : 's'}
          </p>
        </div>

        {/* Card 4: Fiscal Issuance Engine Flag */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-[42px] h-[42px] rounded-full flex items-center justify-center text-white shadow-sm flex-shrink-0 ${
                issuanceEnabled ? 'bg-emerald-600' : 'bg-amber-500'
              }`}
            >
              {issuanceEnabled ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <p
                className={`text-xl font-extrabold tracking-tight leading-none ${
                  issuanceEnabled
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {issuanceEnabled ? 'Enforced' : 'Flag OFF'}
              </p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                Fiscal Issuance Flag
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            {issuanceEnabled
              ? 'Auto-issued on ride completion'
              : 'Default OFF — series & templates ready in DB'}
          </p>
        </div>
      </div>

      {/* Live Governance Notice when fiscalDocumentsIssue is OFF */}
      {!issuanceEnabled && (
        <div className="bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/90 dark:border-amber-900/50 rounded-xl px-4 py-3 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Fiscal document issuance is currently OFF by default.</strong> You can
            configure gapless State GSTIN document series, preview the built-in default production
            invoice PDF, and manage templates now — invoices will issue automatically on completed
            rides once <code className="font-mono font-bold">documents.issue</code> is enabled.
          </p>
        </div>
      )}

      {/* ─── 3. Executive Segmented Tabs ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            {
              id: 'documents',
              label: `Issued Documents (${totalDocsCount})`,
              icon: FileText,
            },
            {
              id: 'series',
              label: `Document Series (${seriesList.length})`,
              icon: Hash,
            },
            {
              id: 'templates',
              label: `Compliance Templates (${templateList.length})`,
              icon: ShieldCheck,
            },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition cursor-pointer ${
                active
                  ? 'bg-[#1F2B6D] text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ─── TAB 1: ISSUED FISCAL DOCUMENTS ─────────────────────────────────── */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          {/* Filter Card (Matching Fare Rules Filter Bar) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
              <div className="lg:col-span-3 space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                  Search
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Document #, recipient, GSTIN..."
                    className="w-full h-10 pl-8 pr-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D]"
                  />
                </div>
              </div>

              <div className="lg:col-span-2 space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                  Recipient
                </label>
                <select
                  value={recipientFilter}
                  onChange={(e) =>
                    setRecipientFilter(e.target.value as 'all' | 'RIDER' | 'DRIVER')
                  }
                  className="w-full h-10 px-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D]"
                >
                  <option value="all">All Recipients</option>
                  <option value="RIDER">Riders</option>
                  <option value="DRIVER">Drivers</option>
                </select>
              </div>

              <div className="lg:col-span-2 space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                  Document Type
                </label>
                <select
                  value={docTypeFilter}
                  onChange={(e) => setDocTypeFilter(e.target.value as '' | FiscalDocumentType)}
                  className="w-full h-10 px-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D]"
                >
                  <option value="">All Types</option>
                  {(Object.keys(DOCUMENT_TYPE_LABELS) as FiscalDocumentType[]).map((k) => (
                    <option key={k} value={k}>
                      {DOCUMENT_TYPE_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-1 space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'ISSUED' | 'VOIDED')}
                  className="w-full h-10 px-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D]"
                >
                  <option value="all">All</option>
                  <option value="ISSUED">Issued</option>
                  <option value="VOIDED">Voided</option>
                </select>
              </div>

              <div className="lg:col-span-2 space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                  From Date
                </label>
                <DatePicker
                  value={dateFrom}
                  onChange={setDateFrom}
                  placeholder="Start date"
                  iconPosition="left"
                />
              </div>

              <div className="lg:col-span-2 flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                    To Date
                  </label>
                  <DatePicker
                    value={dateTo}
                    onChange={setDateTo}
                    placeholder="End date"
                    iconPosition="left"
                  />
                </div>
                {hasDocFilters && (
                  <button
                    type="button"
                    onClick={handleResetDocFilters}
                    className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#1F2B6D] hover:bg-slate-50 transition cursor-pointer shrink-0"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Full-Width DataTable Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col w-full min-w-0">
            <div className="p-4 sm:px-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <FileText className="w-[18px] h-[18px] text-[#1F2B6D] dark:text-blue-400" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight truncate">
                    ISSUED FISCAL DOCUMENTS ({documents.length})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    Click any row to inspect immutable line items, GST breakdown, and SHA-256 audit hash.
                  </p>
                </div>
              </div>
            </div>

            <DataTable
              data={documents}
              columns={documentColumns}
              compact={true}
              isLoading={docsQ.isLoading}
              selectable={false}
              selectedIds={selectedDocIds}
              onSelectionChange={setSelectedDocIds}
              hideToolbar={true}
              className="border-0 shadow-none rounded-none bg-transparent"
              onRowClick={(row) => setInspectDoc(row)}
              resultLabel="fiscal documents"
              pageSizeOptions={[5, 10, 25, 50]}
            />
          </div>
        </div>
      )}

      {/* ─── TAB 2: GAPLESS DOCUMENT SERIES ─────────────────────────────────── */}
      {activeTab === 'series' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col w-full min-w-0">
          <div className="p-4 sm:px-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <Hash className="w-[18px] h-[18px] text-[#1F2B6D] dark:text-blue-400" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight truncate">
                  GAPLESS DOCUMENT SERIES ({filteredSeries.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  Row-locked sequential numbering per State GSTIN, Document Type, and Financial Year.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={seriesSearch}
                  onChange={(e) => setSeriesSearch(e.target.value)}
                  placeholder="Search prefix, GSTIN, state..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D]"
                />
              </div>
            </div>
          </div>

          <DataTable
            data={filteredSeries}
            columns={seriesColumns}
            compact={true}
            isLoading={seriesQ.isLoading}
            selectable={false}
            selectedIds={selectedSeriesIds}
            onSelectionChange={setSelectedSeriesIds}
            hideToolbar={true}
            className="border-0 shadow-none rounded-none bg-transparent"
            onRowClick={(row) => setInspectSeries(row)}
            resultLabel="document series"
            pageSizeOptions={[5, 10, 25, 50]}
          />
        </div>
      )}

      {/* ─── TAB 3: COMPLIANCE TEMPLATES ────────────────────────────────────── */}
      {activeTab === 'templates' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col w-full min-w-0">
          <div className="p-4 sm:px-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-[18px] h-[18px] text-[#1F2B6D] dark:text-blue-400" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight truncate">
                  COMPLIANCE TEMPLATES ({filteredTemplates.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  Versioned HTML invoice layouts validated against supported server placeholders.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <select
                value={templateTypeFilter}
                onChange={(e) =>
                  setTemplateTypeFilter(e.target.value as '' | FiscalDocumentType)
                }
                className="h-9 px-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <option value="">All Document Types</option>
                {(Object.keys(DOCUMENT_TYPE_LABELS) as FiscalDocumentType[]).map((k) => (
                  <option key={k} value={k}>
                    {DOCUMENT_TYPE_LABELS[k]}
                  </option>
                ))}
              </select>

              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  placeholder="Search template name..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D]"
                />
              </div>
            </div>
          </div>

          <DataTable
            data={filteredTemplates}
            columns={templateColumns}
            compact={true}
            isLoading={templatesQ.isLoading}
            selectable={false}
            selectedIds={selectedTemplateIds}
            onSelectionChange={setSelectedTemplateIds}
            hideToolbar={true}
            className="border-0 shadow-none rounded-none bg-transparent"
            onRowClick={(row) => setPreviewTemplate(row)}
            resultLabel="compliance templates"
            pageSizeOptions={[5, 10, 25, 50]}
          />
        </div>
      )}

      {/* ─── Executive Modals ────────────────────────────────────────────────── */}
      <FiscalDocumentDetailsModal
        doc={inspectDoc}
        canWrite={canWrite}
        downloading={Boolean(inspectDoc && downloadingId === inspectDoc.id)}
        onClose={() => setInspectDoc(null)}
        onDownloadPdf={(doc) => void handleDownloadPdf(doc)}
        onVoid={(doc) => setVoidTarget(doc)}
      />

      {/* Document Series Details Popup (Shared PricingDetailsModal) */}
      <PricingDetailsModal
        isOpen={Boolean(inspectSeries)}
        onClose={() => setInspectSeries(null)}
        badge={<Hash className="w-4 h-4" />}
        title={inspectSeries?.prefix ?? 'Document Series'}
        subtitle={
          inspectSeries
            ? `${DOCUMENT_TYPE_LABELS[inspectSeries.documentType]} · Row-locked gapless sequence in PostgreSQL.`
            : undefined
        }
        statusBadges={
          inspectSeries
            ? [
                {
                  label: inspectSeries.isActive ? 'Active' : 'Inactive',
                  tone: inspectSeries.isActive ? 'emerald' : 'slate',
                },
                { label: `FY ${inspectSeries.financialYear}`, tone: 'blue' },
              ]
            : []
        }
      >
        {inspectSeries && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <DetailsKpiCard
                icon={<Hash className="w-3.5 h-3.5" />}
                label="Last Sequence"
                value={inspectSeries.lastSequence}
                sublabel="Documents issued so far"
              />
              <DetailsKpiCard
                icon={<Calendar className="w-3.5 h-3.5" />}
                label="Financial Year"
                value={inspectSeries.financialYear}
                sublabel="Indian FY (Apr–Mar)"
              />
              <DetailsKpiCard
                highlighted
                icon={<FileText className="w-3.5 h-3.5" />}
                label="Next Document #"
                value={formatNextInvoiceNumber(inspectSeries.prefix, inspectSeries.lastSequence)}
                sublabel="Assigned atomically"
              />
            </div>

            <DetailsSpecList>
              <DetailsSpecRow
                icon={<FileText className="w-4 h-4" />}
                label="Document Type"
                value={DOCUMENT_TYPE_LABELS[inspectSeries.documentType]}
              />
              <DetailsSpecRow
                icon={<Building2 className="w-4 h-4" />}
                label="Legal Entity"
                value={inspectSeries.legalEntityName}
              />
              <DetailsSpecRow
                icon={<ShieldCheck className="w-4 h-4" />}
                label="State GSTIN"
                value={<span className="font-mono">{inspectSeries.gstin}</span>}
              />
              <DetailsSpecRow
                icon={<MapPin className="w-4 h-4" />}
                label="State Jurisdiction"
                value={`${inspectSeries.stateName} (${inspectSeries.stateCode})`}
              />
              <DetailsSpecRow
                icon={<Calendar className="w-4 h-4" />}
                label="Created At"
                value={
                  <span className="font-mono">
                    {new Date(inspectSeries.createdAt).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                }
              />
            </DetailsSpecList>
          </>
        )}
      </PricingDetailsModal>

      <ComplianceTemplateDetailsModal
        template={previewTemplate}
        canWrite={canWrite}
        activating={activateTemplateMutation.isPending}
        onClose={() => setPreviewTemplate(null)}
        onActivate={(tpl) => void handleActivateTemplate(tpl)}
      />

      <CreateDocumentSeriesModal
        isOpen={createSeriesOpen}
        gstRegistrations={allGstRegistrations}
        defaultFinancialYear={currentIndianFinancialYear()}
        isPending={createSeriesMutation.isPending}
        onClose={() => setCreateSeriesOpen(false)}
        onNavigateToGst={() => navigate('/pricing-management/gst')}
        onSubmit={handleCreateSeries}
      />

      <UploadComplianceTemplateModal
        isOpen={uploadTemplateOpen}
        isPending={createTemplateMutation.isPending || activateTemplateMutation.isPending}
        onClose={() => setUploadTemplateOpen(false)}
        onSubmit={handleCreateTemplate}
      />

      <DefaultInvoicePreviewModal
        isOpen={defaultPreviewOpen}
        gstRegistrations={allGstRegistrations}
        onClose={() => setDefaultPreviewOpen(false)}
      />

      <VoidFiscalDocumentModal
        target={voidTarget}
        isPending={voidMutation.isPending}
        onClose={() => setVoidTarget(null)}
        onConfirm={handleConfirmVoid}
      />

      <PricingSuccessModal
        isOpen={Boolean(successModal)}
        onClose={() => setSuccessModal(null)}
        onPrimaryAction={() => setSuccessModal(null)}
        title={successModal?.title ?? 'Saved'}
        message={successModal?.message ?? ''}
        primaryButtonText={successModal?.primaryText ?? 'Done'}
      />
    </PageWrapper>
  )
}

export default InvoiceGenerationPage
