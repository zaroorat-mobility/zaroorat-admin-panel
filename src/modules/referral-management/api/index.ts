import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type { QueryParams, PaginatedResponse } from '@/shared/types'
import type {
  MilestoneInput,
  ReferralCodeRow,
  ReferralHistoryRow,
  ReferralProgram,
  ReferralProgramInput,
  ReferralMilestone,
} from '../types'

export const getPrograms = async (
  params?: QueryParams,
): Promise<PaginatedResponse<ReferralProgram>> => {
  const response = await api.get<PaginatedResponse<ReferralProgram>>(
    API_ENDPOINTS.referralPrograms.list,
    { params },
  )
  return response.data
}

export const getProgramById = async (id: string): Promise<ReferralProgram> => {
  const response = await api.get<{ data: ReferralProgram }>(
    API_ENDPOINTS.referralPrograms.detail(id),
  )
  return response.data.data
}

export const createProgram = async (data: ReferralProgramInput): Promise<ReferralProgram> => {
  const response = await api.post<{ data: ReferralProgram }>(
    API_ENDPOINTS.referralPrograms.create,
    data,
  )
  return response.data.data
}

export const updateProgram = async (
  id: string,
  data: Partial<ReferralProgramInput>,
): Promise<ReferralProgram> => {
  const response = await api.patch<{ data: ReferralProgram }>(
    API_ENDPOINTS.referralPrograms.update(id),
    data,
  )
  return response.data.data
}

export const activateProgram = async (id: string): Promise<ReferralProgram> => {
  const response = await api.post<{ data: ReferralProgram }>(
    API_ENDPOINTS.referralPrograms.activate(id),
  )
  return response.data.data
}

export const deactivateProgram = async (id: string): Promise<ReferralProgram> => {
  const response = await api.post<{ data: ReferralProgram }>(
    API_ENDPOINTS.referralPrograms.deactivate(id),
  )
  return response.data.data
}

export const addMilestone = async (
  programId: string,
  data: MilestoneInput,
): Promise<ReferralMilestone> => {
  const response = await api.post<{ data: ReferralMilestone }>(
    API_ENDPOINTS.referralPrograms.milestones(programId),
    data,
  )
  return response.data.data
}

export const updateMilestone = async (
  id: string,
  data: Partial<MilestoneInput>,
): Promise<ReferralMilestone> => {
  const response = await api.patch<{ data: ReferralMilestone }>(
    API_ENDPOINTS.referralMilestones.update(id),
    data,
  )
  return response.data.data
}

export const deactivateMilestone = async (id: string): Promise<ReferralMilestone> => {
  const response = await api.post<{ data: ReferralMilestone }>(
    API_ENDPOINTS.referralMilestones.deactivate(id),
  )
  return response.data.data
}

export const activateMilestone = async (id: string): Promise<ReferralMilestone> => {
  const response = await api.post<{ data: ReferralMilestone }>(
    API_ENDPOINTS.referralMilestones.activate(id),
  )
  return response.data.data
}

export const getCodes = async (
  params?: QueryParams,
): Promise<PaginatedResponse<ReferralCodeRow>> => {
  const response = await api.get<PaginatedResponse<ReferralCodeRow>>(
    API_ENDPOINTS.referralCodes.list,
    { params },
  )
  return response.data
}

export const activateCode = async (id: string): Promise<ReferralCodeRow> => {
  const response = await api.post<{ data: ReferralCodeRow }>(
    API_ENDPOINTS.referralCodes.activate(id),
  )
  return response.data.data
}

export const deactivateCode = async (id: string): Promise<ReferralCodeRow> => {
  const response = await api.post<{ data: ReferralCodeRow }>(
    API_ENDPOINTS.referralCodes.deactivate(id),
  )
  return response.data.data
}

export const getReferrals = async (
  params?: QueryParams,
): Promise<PaginatedResponse<ReferralHistoryRow>> => {
  const response = await api.get<PaginatedResponse<ReferralHistoryRow>>(
    API_ENDPOINTS.referrals.list,
    { params },
  )
  return response.data
}

export const getReferralById = async (id: string): Promise<ReferralHistoryRow> => {
  const response = await api.get<{ data: ReferralHistoryRow }>(API_ENDPOINTS.referrals.detail(id))
  return response.data.data
}
