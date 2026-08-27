import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryParams } from '@/shared/types'
import type { MilestoneInput, ReferralProgramInput } from '../types'
import { ReferralManagementService } from '../services'

const QK = {
  programs: (params?: QueryParams) => ['referral-management', 'programs', params],
  program: (id: string) => ['referral-management', 'program', id],
  codes: (params?: QueryParams) => ['referral-management', 'codes', params],
  referrals: (params?: QueryParams) => ['referral-management', 'referrals', params],
}

export const useReferralPrograms = (params?: QueryParams) =>
  useQuery({
    queryKey: QK.programs(params),
    queryFn: () => ReferralManagementService.getPrograms(params),
  })

export const useReferralProgram = (id: string) =>
  useQuery({
    queryKey: QK.program(id),
    queryFn: () => ReferralManagementService.getProgramById(id),
    enabled: !!id,
  })

export const useCreateReferralProgram = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ReferralProgramInput) => ReferralManagementService.createProgram(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['referral-management', 'programs'] }),
  })
}

export const useUpdateReferralProgram = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ReferralProgramInput> }) =>
      ReferralManagementService.updateProgram(id, updates),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['referral-management', 'programs'] })
      qc.invalidateQueries({ queryKey: QK.program(id) })
    },
  })
}

export const useActivateReferralProgram = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ReferralManagementService.activateProgram(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['referral-management', 'programs'] }),
  })
}

export const useDeactivateReferralProgram = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ReferralManagementService.deactivateProgram(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['referral-management', 'programs'] }),
  })
}

export const useAddMilestone = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ programId, data }: { programId: string; data: MilestoneInput }) =>
      ReferralManagementService.addMilestone(programId, data),
    onSuccess: (_, { programId }) => {
      qc.invalidateQueries({ queryKey: ['referral-management', 'programs'] })
      qc.invalidateQueries({ queryKey: QK.program(programId) })
    },
  })
}

export const useActivateMilestone = (programId?: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ReferralManagementService.activateMilestone(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['referral-management', 'programs'] })
      if (programId) qc.invalidateQueries({ queryKey: QK.program(programId) })
      else qc.invalidateQueries({ queryKey: ['referral-management', 'program'] })
    },
  })
}

export const useDeactivateMilestone = (programId?: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ReferralManagementService.deactivateMilestone(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['referral-management', 'programs'] })
      if (programId) qc.invalidateQueries({ queryKey: QK.program(programId) })
      else qc.invalidateQueries({ queryKey: ['referral-management', 'program'] })
    },
  })
}

export const useReferralCodes = (params?: QueryParams) =>
  useQuery({
    queryKey: QK.codes(params),
    queryFn: () => ReferralManagementService.getCodes(params),
  })

export const useActivateReferralCode = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ReferralManagementService.activateCode(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['referral-management', 'codes'] }),
  })
}

export const useDeactivateReferralCode = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ReferralManagementService.deactivateCode(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['referral-management', 'codes'] }),
  })
}

export const useReferralHistory = (params?: QueryParams) =>
  useQuery({
    queryKey: QK.referrals(params),
    queryFn: () => ReferralManagementService.getReferrals(params),
  })
