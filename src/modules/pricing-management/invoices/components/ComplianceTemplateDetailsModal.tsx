import React, { useMemo, useState } from 'react'
import {
  FileCode2,
  Eye,
  ShieldCheck,
  FileText,
  Calendar,
  Hash,
  CheckCircle2,
  ToggleRight,
} from 'lucide-react'
import type { ComplianceTemplateDto } from '../../api/fiscal.api'
import { DOCUMENT_TYPE_LABELS } from './FiscalDocumentDetailsModal'
import {
  PricingDetailsModal,
  DetailsKpiCard,
  DetailsSpecList,
  DetailsSpecRow,
} from '../../components/PricingDetailsModal'

interface ComplianceTemplateDetailsModalProps {
  template: ComplianceTemplateDto | null
  canWrite: boolean
  activating?: boolean
  onClose: () => void
  onActivate?: (template: ComplianceTemplateDto) => void
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

export const ComplianceTemplateDetailsModal: React.FC<ComplianceTemplateDetailsModalProps> = ({
  template,
  canWrite,
  activating = false,
  onClose,
  onActivate,
}) => {
  const [viewMode, setViewMode] = useState<'rendered' | 'source'>('rendered')

  const detectedPlaceholders = useMemo(() => {
    if (!template) return []
    const found = new Set<string>()
    for (const match of template.content.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)) {
      if (match[1]) found.add(match[1])
    }
    return [...found]
  }, [template])

  const previewHtmlDoc = useMemo(() => {
    if (!template) return ''
    const styledMarkup = template.content.replace(
      /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
      '<span style="display:inline-block;padding:1px 6px;border-radius:4px;background:#EEF2FF;color:#1F2B6D;font-family:monospace;font-size:11px;font-weight:700;">{{$1}}</span>',
    )
    return `<!doctype html><html><head><meta charset="utf-8" /><style>body{font-family:system-ui,-apple-system,sans-serif;padding:20px;color:#0f172a;font-size:13px;line-height:1.5;margin:0;}h1,h2,h3{color:#1F2B6D;margin-top:0;}table{width:100%;border-collapse:collapse;margin-top:12px;}th,td{border:1px solid #e2e8f0;padding:8px;text-align:left;font-size:12px;}th{background:#f8fafc;}</style></head><body>${styledMarkup}</body></html>`
  }, [template])

  if (!template) return null

  const statusBadge = template.isActive
    ? { label: 'Active', tone: 'emerald' as const }
    : { label: 'Inactive', tone: 'slate' as const }

  return (
    <PricingDetailsModal
      isOpen={Boolean(template)}
      onClose={onClose}
      badge={`v${template.version}`}
      title={template.name}
      subtitle={`${DOCUMENT_TYPE_LABELS[template.documentType]} · Versioned invoice template stored in PostgreSQL.`}
      statusBadges={[statusBadge]}
      footerActions={
        canWrite && !template.isActive && onActivate ? (
          <button
            type="button"
            disabled={activating}
            onClick={() => onActivate(template)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer disabled:opacity-60"
          >
            <ToggleRight className="w-4 h-4" />
            <span>{activating ? 'Activating…' : 'Activate Now'}</span>
          </button>
        ) : undefined
      }
    >
      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <DetailsKpiCard
          mono={false}
          icon={<FileText className="w-3.5 h-3.5" />}
          label="Document Type"
          value={DOCUMENT_TYPE_LABELS[template.documentType]}
          sublabel={template.fileName}
        />
        <DetailsKpiCard
          icon={<Hash className="w-3.5 h-3.5" />}
          label="Placeholders"
          value={detectedPlaceholders.length}
          sublabel="Validated server tokens"
        />
        <DetailsKpiCard
          highlighted
          mono={false}
          icon={<ShieldCheck className="w-3.5 h-3.5" />}
          label="Approval State"
          value={template.isActive ? 'Live Active' : template.previewApproved ? 'Approved' : 'Draft'}
          sublabel={`Version v${template.version}`}
        />
      </div>

      {/* Specifications */}
      <DetailsSpecList>
        <DetailsSpecRow
          icon={<FileText className="w-4 h-4" />}
          label="Source File"
          value={<span className="font-mono">{template.fileName}</span>}
        />
        <DetailsSpecRow
          icon={<ShieldCheck className="w-4 h-4" />}
          label="Version Note"
          value={template.versionNote || '—'}
        />
        <DetailsSpecRow
          icon={<Calendar className="w-4 h-4" />}
          label="Uploaded At"
          value={<span className="font-mono">{formatDateTime(template.createdAt)}</span>}
        />
        {template.previewApprovedAt && (
          <DetailsSpecRow
            icon={<CheckCircle2 className="w-4 h-4" />}
            label="Preview Approved At"
            value={<span className="font-mono">{formatDateTime(template.previewApprovedAt)}</span>}
          />
        )}
      </DetailsSpecList>

      {/* Visual Preview / HTML Source Tabs */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-bold text-[#1F2B6D] dark:text-white">
            Template Preview
          </span>
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('rendered')}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                viewMode === 'rendered'
                  ? 'bg-[#1F2B6D] text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <Eye className="w-3 h-3" />
              Rendered Layout
            </button>
            <button
              type="button"
              onClick={() => setViewMode('source')}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                viewMode === 'source'
                  ? 'bg-[#1F2B6D] text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <FileCode2 className="w-3 h-3" />
              HTML Source
            </button>
          </div>
        </div>

        {viewMode === 'rendered' ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white">
            <iframe
              title={`Preview ${template.name}`}
              srcDoc={previewHtmlDoc}
              sandbox=""
              className="w-full h-64 border-0 bg-white"
            />
          </div>
        ) : (
          <pre className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] font-mono overflow-x-auto max-h-64 whitespace-pre-wrap text-slate-800 dark:text-slate-200">
            {template.content}
          </pre>
        )}

        {detectedPlaceholders.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {detectedPlaceholders.map((p) => (
              <span
                key={p}
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-[#1F2B6D] dark:text-blue-300 font-mono text-[10.5px] font-semibold"
              >
                {`{{${p}}}`}
              </span>
            ))}
          </div>
        )}
      </div>
    </PricingDetailsModal>
  )
}

export default ComplianceTemplateDetailsModal
