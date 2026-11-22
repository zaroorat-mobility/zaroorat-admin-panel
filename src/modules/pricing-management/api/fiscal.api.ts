import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type { PaginatedResponse } from '@/shared/types'

export type FiscalDocumentType =
  | 'PASSENGER_TAX_INVOICE'
  | 'COMMISSION_TAX_INVOICE'
  | 'WALLET_RECHARGE_RECEIPT'
  | 'DRIVER_SETTLEMENT_STATEMENT'
  | 'CREDIT_NOTE'
  | 'SUBSCRIPTION_INVOICE'

export interface FiscalLineItemDto {
  label: string
  amount: number
  note?: string
}

export interface FiscalDocumentDto {
  id: string
  documentNumber: string
  seriesId: string
  sequenceNumber: number
  documentType: FiscalDocumentType
  status: 'ISSUED' | 'VOIDED'
  rideId: string | null
  rideCode: string | null
  recipientUserId: string | null
  recipientType: 'RIDER' | 'DRIVER'
  recipientName: string
  legalEntityId: string
  gstRegistrationId: string
  supplierLegalName: string
  supplierGstin: string
  supplierStateCode: string
  placeOfSupplyStateCode: string
  isInterState: boolean
  sacCode: string | null
  currency: string
  taxableValue: number
  nonTaxableValue: number
  cgstRatePct: number
  sgstRatePct: number
  igstRatePct: number
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
  totalTaxAmount: number
  totalAmount: number
  lineItems: FiscalLineItemDto[]
  snapshotRefs: Record<string, unknown>
  templateId: string | null
  contentSha256: string
  issuedAt: string
  voidedAt: string | null
  voidReason: string | null
}

export interface DocumentSeriesDto {
  id: string
  gstRegistrationId: string
  gstin: string
  stateCode: string
  stateName: string
  legalEntityName: string
  documentType: FiscalDocumentType
  financialYear: string
  prefix: string
  lastSequence: number
  isActive: boolean
  createdAt: string
}

export interface ComplianceTemplateDto {
  id: string
  familyId: string
  version: number
  documentType: FiscalDocumentType
  name: string
  fileName: string
  mimeType: string
  content: string
  versionNote: string | null
  effectiveFrom: string
  previewApproved: boolean
  previewApprovedBy: string | null
  previewApprovedAt: string | null
  isActive: boolean
  createdBy: string
  createdAt: string
}

export interface ListFiscalDocumentsParams {
  page?: number
  limit?: number
  documentType?: FiscalDocumentType
  recipientType?: 'all' | 'RIDER' | 'DRIVER'
  status?: 'all' | 'ISSUED' | 'VOIDED'
  from?: string
  to?: string
  search?: string
}

export const getFiscalDocuments = async (
  params?: ListFiscalDocumentsParams,
): Promise<PaginatedResponse<FiscalDocumentDto>> => {
  const res = await api.get<PaginatedResponse<FiscalDocumentDto>>(
    API_ENDPOINTS.pricingGovernance.fiscalDocuments,
    { params },
  )
  return res.data
}

export const createFiscalDownloadUrl = async (
  id: string,
): Promise<{ downloadPath: string; expiresAt: string; documentNumber: string }> => {
  const res = await api.post<{
    data: { downloadPath: string; expiresAt: string; documentNumber: string }
  }>(API_ENDPOINTS.pricingGovernance.fiscalDocumentDownloadUrl(id))
  return res.data.data
}

export const downloadFiscalPdfBlob = async (id: string): Promise<Blob> => {
  const res = await api.get<Blob>(API_ENDPOINTS.pricingGovernance.fiscalDocumentPdf(id), {
    responseType: 'blob',
  })
  return res.data
}

export const previewSampleFiscalPdfBlob = async (payload: {
  documentType?: FiscalDocumentType
  gstRegistrationId?: string
  placeOfSupplyStateCode?: string
}): Promise<Blob> => {
  const res = await api.post<Blob>(
    API_ENDPOINTS.pricingGovernance.fiscalDocumentPreviewSamplePdf,
    payload,
    { responseType: 'blob' },
  )
  return res.data
}

export const exportFiscalDocumentsCsvBlob = async (
  params?: Omit<ListFiscalDocumentsParams, 'page' | 'limit'>,
): Promise<Blob> => {
  const res = await api.get<Blob>(API_ENDPOINTS.pricingGovernance.fiscalDocumentsExportCsv, {
    params,
    responseType: 'blob',
  })
  return res.data
}

export const voidFiscalDocument = async (
  id: string,
  reason: string,
): Promise<FiscalDocumentDto> => {
  const res = await api.post<{ data: FiscalDocumentDto }>(
    API_ENDPOINTS.pricingGovernance.fiscalDocumentVoid(id),
    { reason },
  )
  return res.data.data
}

export const getDocumentSeries = async (): Promise<DocumentSeriesDto[]> => {
  const res = await api.get<{ data: DocumentSeriesDto[] }>(
    API_ENDPOINTS.pricingGovernance.documentSeries,
  )
  return res.data.data
}

export const createDocumentSeries = async (payload: {
  gstRegistrationId: string
  documentType: FiscalDocumentType
  financialYear: string
  prefix: string
}): Promise<DocumentSeriesDto> => {
  const res = await api.post<{ data: DocumentSeriesDto }>(
    API_ENDPOINTS.pricingGovernance.documentSeries,
    payload,
  )
  return res.data.data
}

export const getComplianceTemplates = async (
  documentType?: FiscalDocumentType,
): Promise<ComplianceTemplateDto[]> => {
  const res = await api.get<{ data: ComplianceTemplateDto[] }>(
    API_ENDPOINTS.pricingGovernance.complianceTemplates,
    { params: documentType ? { documentType } : undefined },
  )
  return res.data.data
}

export const createComplianceTemplate = async (payload: {
  documentType: FiscalDocumentType
  name: string
  fileName: string
  mimeType?: 'text/html' | 'text/plain'
  content: string
  versionNote?: string | null
  effectiveFrom?: string
  familyId?: string
}): Promise<ComplianceTemplateDto> => {
  const res = await api.post<{ data: ComplianceTemplateDto }>(
    API_ENDPOINTS.pricingGovernance.complianceTemplates,
    payload,
  )
  return res.data.data
}

export const approveComplianceTemplatePreview = async (
  id: string,
): Promise<ComplianceTemplateDto> => {
  const res = await api.post<{ data: ComplianceTemplateDto }>(
    API_ENDPOINTS.pricingGovernance.approveComplianceTemplatePreview(id),
  )
  return res.data.data
}

export const activateComplianceTemplate = async (
  id: string,
): Promise<ComplianceTemplateDto> => {
  const res = await api.post<{ data: ComplianceTemplateDto }>(
    API_ENDPOINTS.pricingGovernance.activateComplianceTemplate(id),
  )
  return res.data.data
}
