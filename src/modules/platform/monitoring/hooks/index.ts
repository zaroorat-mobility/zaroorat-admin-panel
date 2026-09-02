import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ackMonitoringAlert,
  getMonitoringAlerts,
  getMonitoringErrors,
  getMonitoringHealth,
  getMonitoringPerformance,
} from '../api'

const keys = {
  health: ['monitoring', 'health'] as const,
  performance: ['monitoring', 'performance'] as const,
  errors: (limit?: number) => ['monitoring', 'errors', limit ?? 50] as const,
  alerts: ['monitoring', 'alerts'] as const,
}

export const useMonitoringHealth = (options?: { refetchInterval?: number | false }) =>
  useQuery({
    queryKey: keys.health,
    queryFn: getMonitoringHealth,
    refetchInterval: options?.refetchInterval ?? 30000,
  })

export const useMonitoringPerformance = (options?: { refetchInterval?: number | false }) =>
  useQuery({
    queryKey: keys.performance,
    queryFn: getMonitoringPerformance,
    refetchInterval: options?.refetchInterval ?? 30000,
  })

export const useMonitoringErrors = (limit = 50) =>
  useQuery({
    queryKey: keys.errors(limit),
    queryFn: () => getMonitoringErrors(limit),
  })

export const useMonitoringAlerts = (options?: { refetchInterval?: number | false }) =>
  useQuery({
    queryKey: keys.alerts,
    queryFn: getMonitoringAlerts,
    refetchInterval: options?.refetchInterval ?? 30000,
  })

export const useAckMonitoringAlert = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ackMonitoringAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.alerts })
    },
  })
}
