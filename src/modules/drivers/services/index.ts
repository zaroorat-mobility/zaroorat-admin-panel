import * as api from '../api'
import type { QueryParams } from '@/shared/types'
import type { DriverEntity } from '../types'

export const DriverService = {
  async fetchDrivers(params?: QueryParams) {
    return api.getDrivers(params)
  },

  async fetchDriverById(id: string) {
    return api.getDriverById(id)
  },

  async updateDriver(id: string, data: Partial<DriverEntity>) {
    return api.updateDriver(id, data)
  },
}
export default DriverService
