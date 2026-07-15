import * as api from '../api'
import type { QueryParams } from '@/shared/types'
import type { RiderEntity } from '../types'

export const RiderService = {
  async fetchRiders(params?: QueryParams) {
    return api.getRiders(params)
  },

  async fetchRiderById(id: string) {
    return api.getRiderById(id)
  },

  async updateRider(id: string, data: Partial<RiderEntity>) {
    return api.updateRider(id, data)
  },
}
export default RiderService
