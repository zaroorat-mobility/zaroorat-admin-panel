import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type {
  MonitoringAlert,
  MonitoringHealth,
  MonitoringPerformance,
  StoredErrorEvent,
} from '../types'

export const getMonitoringHealth = async (): Promise<MonitoringHealth> => {
  const response = await api.get<MonitoringHealth>(API_ENDPOINTS.monitoring.health)
  return response.data
}

export const getMonitoringPerformance = async (): Promise<MonitoringPerformance> => {
  const response = await api.get<MonitoringPerformance>(API_ENDPOINTS.monitoring.performance)
  return response.data
}

export const getMonitoringErrors = async (limit = 50): Promise<StoredErrorEvent[]> => {
  const response = await api.get<{ data: StoredErrorEvent[] }>(API_ENDPOINTS.monitoring.errors, {
    params: { limit },
  })
  return response.data.data
}

export const getMonitoringAlerts = async (): Promise<MonitoringAlert[]> => {
  const response = await api.get<{ data: MonitoringAlert[] }>(API_ENDPOINTS.monitoring.alerts)
  return response.data.data
}

export const ackMonitoringAlert = async (id: string): Promise<void> => {
  await api.post(API_ENDPOINTS.monitoring.ackAlert(id))
}
