import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryParams } from '@/shared/types'
import type { FareRule, SurgeRule, CancellationRule } from '../types'
import { PricingManagementService } from '../services'

const QK = {
  fareRules: (params?: QueryParams) => ['pricing-management', 'fare-rules', params],
  fareRule: (id: string) => ['pricing-management', 'fare-rule', id],
  fareRuleVersions: (id: string) => ['pricing-management', 'fare-rule-versions', id],
  surgeRules: (params?: QueryParams) => ['pricing-management', 'surge-rules', params],
  surgeRule: (id: string) => ['pricing-management', 'surge-rule', id],
  surgeRuleVersions: (id: string) => ['pricing-management', 'surge-rule-versions', id],
  cancellationRules: (params?: QueryParams) => ['pricing-management', 'cancellation-rules', params],
  cancellationRule: (id: string) => ['pricing-management', 'cancellation-rule', id],
  cancellationRuleVersions: (id: string) => ['pricing-management', 'cancellation-rule-versions', id],
  history: (params?: QueryParams) => ['pricing-management', 'history', params],
  surgeZones: (cityCode?: string) => ['pricing-management', 'surge-zones', cityCode],
  pricingSummary: () => ['pricing-management', 'summary'],
  commissionConfigs: () => ['pricing-management', 'commission-configs'],
  taxConfigs: (kind?: string) => ['pricing-management', 'tax-configs', kind],
  gstRecoveryConfigs: () => ['pricing-management', 'gst-recovery-configs'],
  legalEntities: () => ['pricing-management', 'legal-entities'],
  citySupplyRegistrations: () => ['pricing-management', 'city-supply-registrations'],
  settlementFailures: (params?: unknown) => ['pricing-management', 'settlement-failures', params],
  pricingReconciliation: () => ['pricing-management', 'reconciliation'],
  fiscalDocuments: (params?: unknown) => ['pricing-management', 'fiscal-documents', params],
  documentSeries: () => ['pricing-management', 'document-series'],
  complianceTemplates: (docType?: string) => ['pricing-management', 'compliance-templates', docType],
}

// ─────────────────────────────────────────────────────────────────────────────
// FARE RULES HOOKS
// ─────────────────────────────────────────────────────────────────────────────

export const useFareRules = (params?: QueryParams) => {
  return useQuery({
    queryKey: QK.fareRules(params),
    queryFn: () => PricingManagementService.getFareRules(params)
  })
}

export const useFareRule = (id: string) => {
  return useQuery({
    queryKey: QK.fareRule(id),
    queryFn: () => PricingManagementService.getFareRuleById(id),
    enabled: !!id
  })
}

export const useFareRuleVersions = (id: string) => {
  return useQuery({
    queryKey: QK.fareRuleVersions(id),
    queryFn: () => PricingManagementService.getFareRuleVersions(id),
    enabled: !!id
  })
}

export const useCreateFareRule = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<FareRule, 'id' | 'createdAt' | 'updatedAt' | 'version'>) =>
      PricingManagementService.createFareRule(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing-management', 'fare-rules'] })
      qc.invalidateQueries({ queryKey: ['pricing-management', 'history'] })
    }
  })
}

export const useUpdateFareRule = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<FareRule> }) =>
      PricingManagementService.updateFareRule(id, updates),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['pricing-management', 'fare-rules'] })
      qc.invalidateQueries({ queryKey: QK.fareRule(id) })
      qc.invalidateQueries({ queryKey: ['pricing-management', 'history'] })
    }
  })
}

export const useDeleteFareRule = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => PricingManagementService.deleteFareRule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing-management', 'fare-rules'] })
      qc.invalidateQueries({ queryKey: ['pricing-management', 'history'] })
    }
  })
}

export const useActivateFareRule = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => PricingManagementService.activateFareRule(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['pricing-management', 'fare-rules'] })
      qc.invalidateQueries({ queryKey: QK.fareRule(id) })
      qc.invalidateQueries({ queryKey: ['pricing-management', 'history'] })
    }
  })
}

export const useDeactivateFareRule = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => PricingManagementService.deactivateFareRule(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['pricing-management', 'fare-rules'] })
      qc.invalidateQueries({ queryKey: QK.fareRule(id) })
      qc.invalidateQueries({ queryKey: ['pricing-management', 'history'] })
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// SURGE RULES HOOKS
// ─────────────────────────────────────────────────────────────────────────────

export const useSurgeRules = (params?: QueryParams) => {
  return useQuery({
    queryKey: QK.surgeRules(params),
    queryFn: () => PricingManagementService.getSurgeRules(params)
  })
}

export const useSurgeRule = (id: string) => {
  return useQuery({
    queryKey: QK.surgeRule(id),
    queryFn: () => PricingManagementService.getSurgeRuleById(id),
    enabled: !!id
  })
}

export const useSurgeRuleVersions = (id: string) => {
  return useQuery({
    queryKey: QK.surgeRuleVersions(id),
    queryFn: () => PricingManagementService.getSurgeRuleVersions(id),
    enabled: !!id
  })
}

export const useUpdateCitySurgeCap = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ cityCode, maxSurgeMultiplier }: { cityCode: string; maxSurgeMultiplier: number }) =>
      PricingManagementService.updateCitySurgeCap(cityCode, maxSurgeMultiplier),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing-management', 'surge-rules'] })
    }
  })
}

export const useCreateSurgeRule = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<SurgeRule, 'id' | 'createdAt' | 'updatedAt'>) =>
      PricingManagementService.createSurgeRule(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing-management', 'surge-rules'] })
      qc.invalidateQueries({ queryKey: ['pricing-management', 'history'] })
    }
  })
}

export const useUpdateSurgeRule = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<SurgeRule> }) =>
      PricingManagementService.updateSurgeRule(id, updates),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['pricing-management', 'surge-rules'] })
      qc.invalidateQueries({ queryKey: QK.surgeRule(id) })
      qc.invalidateQueries({ queryKey: ['pricing-management', 'history'] })
    }
  })
}

export const useDeleteSurgeRule = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => PricingManagementService.deleteSurgeRule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing-management', 'surge-rules'] })
      qc.invalidateQueries({ queryKey: ['pricing-management', 'history'] })
    }
  })
}

export const useActivateSurgeRule = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => PricingManagementService.activateSurgeRule(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['pricing-management', 'surge-rules'] })
      qc.invalidateQueries({ queryKey: QK.surgeRule(id) })
      qc.invalidateQueries({ queryKey: ['pricing-management', 'history'] })
    }
  })
}

export const useDeactivateSurgeRule = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => PricingManagementService.deactivateSurgeRule(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['pricing-management', 'surge-rules'] })
      qc.invalidateQueries({ queryKey: QK.surgeRule(id) })
      qc.invalidateQueries({ queryKey: ['pricing-management', 'history'] })
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// CANCELLATION RULES HOOKS
// ─────────────────────────────────────────────────────────────────────────────

export const useCancellationRules = (params?: QueryParams) => {
  return useQuery({
    queryKey: QK.cancellationRules(params),
    queryFn: () => PricingManagementService.getCancellationRules(params)
  })
}

export const useCancellationRule = (id: string) => {
  return useQuery({
    queryKey: QK.cancellationRule(id),
    queryFn: () => PricingManagementService.getCancellationRuleById(id),
    enabled: !!id
  })
}

export const useCancellationRuleVersions = (id: string) => {
  return useQuery({
    queryKey: QK.cancellationRuleVersions(id),
    queryFn: () => PricingManagementService.getCancellationRuleVersions(id),
    enabled: !!id
  })
}

export const useEvaluateCancellationPolicy = () => {
  return useMutation({
    mutationFn: (input: Parameters<typeof PricingManagementService.evaluateCancellationPolicy>[0]) =>
      PricingManagementService.evaluateCancellationPolicy(input),
  })
}

export const useCreateCancellationRule = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<CancellationRule, 'id' | 'createdAt' | 'updatedAt' | 'version'>) =>
      PricingManagementService.createCancellationRule(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing-management', 'cancellation-rules'] })
      qc.invalidateQueries({ queryKey: ['pricing-management', 'history'] })
    }
  })
}

export const useUpdateCancellationRule = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CancellationRule> }) =>
      PricingManagementService.updateCancellationRule(id, updates),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['pricing-management', 'cancellation-rules'] })
      qc.invalidateQueries({ queryKey: QK.cancellationRule(id) })
      qc.invalidateQueries({ queryKey: ['pricing-management', 'history'] })
    }
  })
}

export const useDeleteCancellationRule = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => PricingManagementService.deleteCancellationRule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing-management', 'cancellation-rules'] })
      qc.invalidateQueries({ queryKey: ['pricing-management', 'history'] })
    }
  })
}

export const useActivateCancellationRule = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => PricingManagementService.activateCancellationRule(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['pricing-management', 'cancellation-rules'] })
      qc.invalidateQueries({ queryKey: QK.cancellationRule(id) })
      qc.invalidateQueries({ queryKey: ['pricing-management', 'history'] })
    }
  })
}

export const useDeactivateCancellationRule = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => PricingManagementService.deactivateCancellationRule(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['pricing-management', 'cancellation-rules'] })
      qc.invalidateQueries({ queryKey: QK.cancellationRule(id) })
      qc.invalidateQueries({ queryKey: ['pricing-management', 'history'] })
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// PRICING HISTORY LOG HOOKS
// ─────────────────────────────────────────────────────────────────────────────

export const usePricingHistory = (params?: QueryParams) => {
  return useQuery({
    queryKey: QK.history(params),
    queryFn: () => PricingManagementService.getPricingHistory(params)
  })
}

export const useSurgeZones = (cityCode?: string) => {
  return useQuery({
    queryKey: QK.surgeZones(cityCode),
    queryFn: () => PricingManagementService.getSurgeZones(cityCode),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 5 GOVERNANCE, LEGAL JURISDICTION & SETTLEMENT FAILURES HOOKS
// ─────────────────────────────────────────────────────────────────────────────

export const usePricingSummary = () =>
  useQuery({
    queryKey: QK.pricingSummary(),
    queryFn: () => PricingManagementService.getPricingSummary(),
  })

export const useCommissionConfigs = () =>
  useQuery({
    queryKey: QK.commissionConfigs(),
    queryFn: () => PricingManagementService.getCommissionConfigs(),
  })

export const useCreateCommissionConfig = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: PricingManagementService.createCommissionConfig,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.commissionConfigs() })
      qc.invalidateQueries({ queryKey: QK.pricingSummary() })
    },
  })
}

export const useApproveCommissionConfig = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => PricingManagementService.approveCommissionConfig(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.commissionConfigs() })
      qc.invalidateQueries({ queryKey: QK.pricingSummary() })
    },
  })
}

export const useActivateCommissionConfig = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => PricingManagementService.activateCommissionConfig(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.commissionConfigs() })
      qc.invalidateQueries({ queryKey: QK.gstRecoveryConfigs() })
      qc.invalidateQueries({ queryKey: ['pricing-management', 'tax-configs'] })
      qc.invalidateQueries({ queryKey: QK.pricingSummary() })
    },
  })
}

export const useDeactivateCommissionScope = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, scopeId }: { id: string; scopeId: string }) =>
      PricingManagementService.deactivateCommissionScope(id, scopeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.commissionConfigs() })
      qc.invalidateQueries({ queryKey: QK.pricingSummary() })
    },
  })
}

export const useDeleteCommissionConfig = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => PricingManagementService.deleteCommissionConfig(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.commissionConfigs() })
      qc.invalidateQueries({ queryKey: QK.pricingSummary() })
    },
  })
}

export const useTaxConfigs = (kind?: 'PASSENGER_RIDE_GST' | 'COMMISSION_GST') =>
  useQuery({
    queryKey: QK.taxConfigs(kind),
    queryFn: () => PricingManagementService.getTaxConfigs(kind),
  })

export const useCreateTaxConfig = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: PricingManagementService.createTaxConfig,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing-management', 'tax-configs'] })
      qc.invalidateQueries({ queryKey: QK.pricingSummary() })
    },
  })
}

export const useApproveTaxConfig = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => PricingManagementService.approveTaxConfig(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing-management', 'tax-configs'] })
      qc.invalidateQueries({ queryKey: QK.pricingSummary() })
    },
  })
}

export const useGstRecoveryConfigs = () =>
  useQuery({
    queryKey: QK.gstRecoveryConfigs(),
    queryFn: () => PricingManagementService.getGstRecoveryConfigs(),
  })

export const useCreateGstRecoveryConfig = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: PricingManagementService.createGstRecoveryConfig,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.gstRecoveryConfigs() })
      qc.invalidateQueries({ queryKey: QK.pricingSummary() })
    },
  })
}

export const useApproveGstRecoveryConfig = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => PricingManagementService.approveGstRecoveryConfig(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.gstRecoveryConfigs() })
      qc.invalidateQueries({ queryKey: QK.pricingSummary() })
    },
  })
}

export const useLegalEntities = () =>
  useQuery({
    queryKey: QK.legalEntities(),
    queryFn: () => PricingManagementService.getLegalEntities(),
  })

export const useCreateLegalEntity = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: PricingManagementService.createLegalEntity,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.legalEntities() }),
  })
}

export const useCreateGstRegistration = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      legalEntityId,
      payload,
    }: {
      legalEntityId: string
      payload: Parameters<typeof PricingManagementService.createGstRegistration>[1]
    }) => PricingManagementService.createGstRegistration(legalEntityId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.legalEntities() }),
  })
}

export const useCitySupplyRegistrations = () =>
  useQuery({
    queryKey: QK.citySupplyRegistrations(),
    queryFn: () => PricingManagementService.getCitySupplyRegistrations(),
  })

export const useCreateCitySupplyRegistration = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: PricingManagementService.createCitySupplyRegistration,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.citySupplyRegistrations() }),
  })
}

export const useSettlementFailures = (params?: {
  status?: 'OPEN' | 'RECOVERED' | 'WAIVED'
  kind?: 'COMMISSION' | 'GST_RECOVERY'
}) =>
  useQuery({
    queryKey: QK.settlementFailures(params),
    queryFn: () => PricingManagementService.getSettlementFailures(params),
  })

export const useRecoverSettlementFailure = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => PricingManagementService.recoverSettlementFailure(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing-management', 'settlement-failures'] })
      qc.invalidateQueries({ queryKey: QK.pricingReconciliation() })
      qc.invalidateQueries({ queryKey: QK.pricingSummary() })
    },
  })
}

export const useWaiveSettlementFailure = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      PricingManagementService.waiveSettlementFailure(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing-management', 'settlement-failures'] })
      qc.invalidateQueries({ queryKey: QK.pricingReconciliation() })
      qc.invalidateQueries({ queryKey: QK.pricingSummary() })
    },
  })
}

export const usePricingReconciliation = () =>
  useQuery({
    queryKey: QK.pricingReconciliation(),
    queryFn: () => PricingManagementService.getPricingReconciliation(),
  })

export const useSweepStaleReservations = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => PricingManagementService.sweepStaleReservations(),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.pricingReconciliation() }),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 6 (M-09): FISCAL DOCUMENTS, GAPLESS SERIES & COMPLIANCE TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────

export const useFiscalDocuments = (
  params?: Parameters<typeof PricingManagementService.getFiscalDocuments>[0],
) =>
  useQuery({
    queryKey: QK.fiscalDocuments(params),
    queryFn: () => PricingManagementService.getFiscalDocuments(params),
  })

export const useVoidFiscalDocument = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      PricingManagementService.voidFiscalDocument(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing-management', 'fiscal-documents'] })
      qc.invalidateQueries({ queryKey: ['pricing-management', 'history'] })
    },
  })
}

export const useDocumentSeries = () =>
  useQuery({
    queryKey: QK.documentSeries(),
    queryFn: () => PricingManagementService.getDocumentSeries(),
  })

export const useCreateDocumentSeries = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: PricingManagementService.createDocumentSeries,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.documentSeries() })
      qc.invalidateQueries({ queryKey: ['pricing-management', 'history'] })
    },
  })
}

export const useComplianceTemplates = (
  documentType?: Parameters<typeof PricingManagementService.getComplianceTemplates>[0],
) =>
  useQuery({
    queryKey: QK.complianceTemplates(documentType),
    queryFn: () => PricingManagementService.getComplianceTemplates(documentType),
  })

export const useCreateComplianceTemplate = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: PricingManagementService.createComplianceTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing-management', 'compliance-templates'] })
      qc.invalidateQueries({ queryKey: ['pricing-management', 'history'] })
    },
  })
}

export const useApproveComplianceTemplatePreview = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => PricingManagementService.approveComplianceTemplatePreview(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing-management', 'compliance-templates'] })
      qc.invalidateQueries({ queryKey: ['pricing-management', 'history'] })
    },
  })
}

export const useActivateComplianceTemplate = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => PricingManagementService.activateComplianceTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing-management', 'compliance-templates'] })
      qc.invalidateQueries({ queryKey: ['pricing-management', 'history'] })
    },
  })
}
