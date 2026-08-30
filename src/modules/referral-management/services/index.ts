import type { QueryParams, PaginatedResponse } from '@/shared/types'
import type {
  MilestoneInput,
  ReferralCodeRow,
  ReferralHistoryRow,
  ReferralMilestone,
  ReferralProgram,
  ReferralProgramInput,
} from '../types'
import * as referralApi from '../api'

export const ReferralManagementService = {
  getPrograms: (params?: QueryParams): Promise<PaginatedResponse<ReferralProgram>> =>
    referralApi.getPrograms(params),
  getProgramById: (id: string) => referralApi.getProgramById(id),
  createProgram: (data: ReferralProgramInput) => referralApi.createProgram(data),
  updateProgram: (id: string, data: Partial<ReferralProgramInput>) =>
    referralApi.updateProgram(id, data),
  activateProgram: (id: string) => referralApi.activateProgram(id),
  deactivateProgram: (id: string) => referralApi.deactivateProgram(id),
  addMilestone: (programId: string, data: MilestoneInput) =>
    referralApi.addMilestone(programId, data),
  updateMilestone: (id: string, data: Partial<MilestoneInput>) =>
    referralApi.updateMilestone(id, data),
  activateMilestone: (id: string) => referralApi.activateMilestone(id),
  deactivateMilestone: (id: string) => referralApi.deactivateMilestone(id),

  getCodes: (params?: QueryParams): Promise<PaginatedResponse<ReferralCodeRow>> =>
    referralApi.getCodes(params),
  activateCode: (id: string) => referralApi.activateCode(id),
  deactivateCode: (id: string) => referralApi.deactivateCode(id),

  getReferrals: (params?: QueryParams): Promise<PaginatedResponse<ReferralHistoryRow>> =>
    referralApi.getReferrals(params),
  getReferralById: (id: string) => referralApi.getReferralById(id),
}

export type { ReferralMilestone }
