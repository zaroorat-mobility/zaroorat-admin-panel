import * as api from '../api'
import type { QueryParams } from '@/shared/types'

export const VerificationService = {
  async fetchVerifications(params?: QueryParams) {
    return api.getVerifications(params)
  },

  async fetchVerificationById(id: string) {
    return api.getVerificationById(id)
  },

  async approveVerification(id: string, notes?: string) {
    return api.approveVerification(id, notes)
  },

  async rejectVerification(id: string, notes?: string) {
    return api.rejectVerification(id, notes)
  },
}
export default VerificationService
