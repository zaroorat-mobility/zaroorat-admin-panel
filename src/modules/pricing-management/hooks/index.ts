import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryParams } from '@/shared/types'
import type { FareRule, SurgeRule, CancellationRule } from '../types'
import { PricingManagementService } from '../services'

const QK = {
  fareRules: (params?: QueryParams) => ['pricing-management', 'fare-rules', params],
  fareRule: (id: string) => ['pricing-management', 'fare-rule', id],
  surgeRules: (params?: QueryParams) => ['pricing-management', 'surge-rules', params],
  surgeRule: (id: string) => ['pricing-management', 'surge-rule', id],
  cancellationRules: (params?: QueryParams) => ['pricing-management', 'cancellation-rules', params],
  cancellationRule: (id: string) => ['pricing-management', 'cancellation-rule', id],
  history: (params?: QueryParams) => ['pricing-management', 'history', params],
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

export const useCreateSurgeRule = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<SurgeRule, 'id' | 'createdAt' | 'updatedAt' | 'version'>) =>
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
