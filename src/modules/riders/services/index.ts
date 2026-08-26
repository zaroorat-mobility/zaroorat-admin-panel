import * as api from '../api'
import type { QueryParams } from '@/shared/types'

export const RiderManagementService = {
  getRiders: (params?: QueryParams) => api.getRiders(params),
  getRiderById: (id: string) => api.getRiderById(id),
  suspendRider: (id: string, notes?: string) => api.suspendRider(id, notes),
  blockRider: (id: string, notes?: string) => api.blockRider(id, notes),
  activateRider: (id: string, notes?: string) => api.activateRider(id, notes),
}

export default RiderManagementService
