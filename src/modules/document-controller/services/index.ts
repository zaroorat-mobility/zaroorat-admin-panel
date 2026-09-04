import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type { QueryParams, PaginatedResponse } from '@/shared/types'

export type ComplianceState = 'compliant' | 'expiring_soon' | 'non_compliant' | 'incomplete'
export type DriverVerifStatus = 'all_verified' | 'pending' | 'has_rejected'

export interface DriverDocumentDto {
  id: string
  driverId: string
  driverName: string
  docType: 'licence' | 'rc' | 'insurance' | 'permit' | 'kyc' | 'puc' | 'police_verification' | 'id_proof'
  fileName: string
  uploadDate: string
  issueDate: string
  expiryDate: string
  status: 'valid' | 'expiring_soon' | 'expired'
  expiryThresholdDays: number
  verificationStatus: 'verified' | 'pending' | 'rejected'
}

export interface DriverDocSummary {
  driverId: string
  driverName: string
  driverCode?: string
  mobile: string
  onboardedOn: string
  totalDocs: number
  uploadedDocs: number
  complianceState: ComplianceState
  nearestExpiry: string
  verificationStatus: DriverVerifStatus
  documents: DriverDocumentDto[]
}

export interface DocumentSettings {
  alertThresholdDays: number
  notifyEmail: boolean
  notifyPush: boolean
}

export const DocumentComplianceService = {
  list: async (params?: QueryParams): Promise<PaginatedResponse<DriverDocSummary>> => {
    const response = await api.get<PaginatedResponse<DriverDocSummary>>(
      API_ENDPOINTS.documents.compliance,
      { params },
    )
    return response.data
  },

  getByDriver: async (driverId: string): Promise<DriverDocSummary> => {
    const response = await api.get<{ data: DriverDocSummary }>(
      API_ENDPOINTS.documents.complianceDetail(driverId),
    )
    return response.data.data
  },

  getSettings: async (): Promise<DocumentSettings> => {
    const response = await api.get<{ data: DocumentSettings }>(API_ENDPOINTS.documents.settings)
    return response.data.data
  },

  updateSettings: async (body: DocumentSettings): Promise<DocumentSettings> => {
    const response = await api.put<{ data: DocumentSettings }>(
      API_ENDPOINTS.documents.settings,
      body,
    )
    return response.data.data
  },

  reviewDocument: async (
    documentId: string,
    status: 'VERIFIED' | 'REJECTED' | 'PENDING',
    rejectionReason?: string,
  ): Promise<unknown> => {
    const response = await api.post<{ data: unknown }>(API_ENDPOINTS.documents.review(documentId), {
      status,
      ...(rejectionReason ? { rejectionReason } : {}),
    })
    return response.data.data
  },
}

export default DocumentComplianceService
