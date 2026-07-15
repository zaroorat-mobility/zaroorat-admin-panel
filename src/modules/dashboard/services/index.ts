import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type { DashboardData } from '../types'

export const DashboardService = {
  /**
   * Fetch live statistics and earnings trend
   */
  async getDashboardData(): Promise<DashboardData> {
    const response = await api.get<DashboardData>(API_ENDPOINTS.dashboard.stats)
    return response.data
  },
}
export default DashboardService
