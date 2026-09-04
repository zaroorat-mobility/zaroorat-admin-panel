import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryParams } from '@/shared/types'
import {
  DocumentComplianceService,
  type DocumentSettings,
} from '../services'

const QK = {
  compliance: (params?: QueryParams) => ['documents', 'compliance', params || {}] as const,
  complianceDetail: (driverId: string) => ['documents', 'compliance', driverId] as const,
  settings: () => ['documents', 'settings'] as const,
}

export const useDocumentCompliance = (params?: QueryParams) =>
  useQuery({
    queryKey: QK.compliance(params),
    queryFn: () => DocumentComplianceService.list(params),
  })

export const useDocumentComplianceDetail = (driverId: string) =>
  useQuery({
    queryKey: QK.complianceDetail(driverId),
    queryFn: () => DocumentComplianceService.getByDriver(driverId),
    enabled: !!driverId,
  })

export const useDocumentSettings = () =>
  useQuery({
    queryKey: QK.settings(),
    queryFn: () => DocumentComplianceService.getSettings(),
  })

export const useUpdateDocumentSettings = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: DocumentSettings) => DocumentComplianceService.updateSettings(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export const useReviewDocument = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      documentId,
      status,
      rejectionReason,
    }: {
      documentId: string
      status: 'VERIFIED' | 'REJECTED' | 'PENDING'
      rejectionReason?: string
    }) => DocumentComplianceService.reviewDocument(documentId, status, rejectionReason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}
