import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type { QueryParams } from '@/shared/types'

export type ComplianceState = 'compliant' | 'expiring_soon' | 'non_compliant' | 'incomplete'
export type DriverVerifStatus = 'all_verified' | 'pending' | 'has_rejected'

export interface DriverDocumentDto {
  id: string
  driverId: string
  driverName: string
  target?: 'driver' | 'vehicle'
  docType: 'licence' | 'rc' | 'insurance' | 'permit' | 'kyc' | 'puc' | 'police_verification' | 'id_proof'
  documentType?: string
  documentNumber?: string | null
  fileName: string
  fileUrl?: string | null
  fileId?: string | null
  uploadDate: string
  issueDate: string
  expiryDate: string
  daysUntilExpiry?: number | null
  status: 'valid' | 'expiring_soon' | 'expired'
  expiryThresholdDays: number
  verificationStatus: 'verified' | 'pending' | 'rejected'
  rejectionReason?: string | null
  verifiedAt?: string | null
  verifiedBy?: string | null
  vehiclePlate?: string | null
  vehicleMakeModel?: string | null
  vehicleType?: string | null
  vehicleCategoryLabel?: string | null
}

export interface DriverDocSummary {
  driverId: string
  driverName: string
  driverCode?: string
  mobile: string
  email?: string | null
  onboardedOn: string
  city?: string
  totalTrips?: number
  ratingAvg?: number
  drivingExpYears?: number
  walletBalance?: number
  totalDocs: number
  uploadedDocs: number
  complianceState: ComplianceState
  nearestExpiry: string
  verificationStatus: DriverVerifStatus
  vehiclePlate?: string | null
  vehicleMakeModel?: string | null
  vehicleType?: string | null
  vehicleCategoryLabel?: string | null
  seatsCapacity?: number | null
  fuelType?: string | null
  documents: DriverDocumentDto[]
}

export interface ComplianceMeta {
  currentPage: number
  totalPages: number
  pageSize: number
  totalCount: number
  counts?: {
    expired: number
    expiring7d: number
    expiring30d: number
    valid: number
    total: number
  }
}

export interface ComplianceResponse {
  data: DriverDocSummary[]
  meta: ComplianceMeta
}

export interface DocumentSettings {
  alertThresholdDays: number
  notifyEmail: boolean
  notifyPush: boolean
}

export const DocumentComplianceService = {
  list: async (params?: QueryParams): Promise<ComplianceResponse> => {
    const response = await api.get<ComplianceResponse>(
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
