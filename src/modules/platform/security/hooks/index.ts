import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryParams } from '@/shared/types'
import {
  forceLogoutAll,
  getLoginHistory,
  getSecurityEvents,
  getSecurityPolicy,
  getSecuritySessions,
  revokeSecuritySession,
  updateSecurityPolicy,
} from '../api'
import type { SecurityPolicy } from '../types'

const keys = {
  sessions: (params?: QueryParams) => ['security', 'sessions', params ?? {}] as const,
  loginHistory: (params?: QueryParams) => ['security', 'login-history', params ?? {}] as const,
  events: (params?: QueryParams) => ['security', 'events', params ?? {}] as const,
  policy: ['security', 'policy'] as const,
}

export const useSecuritySessions = (params?: QueryParams) =>
  useQuery({
    queryKey: keys.sessions(params),
    queryFn: () => getSecuritySessions(params),
  })

export const useRevokeSession = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: revokeSecuritySession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security', 'sessions'] })
    },
  })
}

export const useForceLogoutAll = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId?: string) => forceLogoutAll(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security', 'sessions'] })
      queryClient.invalidateQueries({ queryKey: ['security', 'login-history'] })
    },
  })
}

export const useLoginHistory = (params?: QueryParams) =>
  useQuery({
    queryKey: keys.loginHistory(params),
    queryFn: () => getLoginHistory(params),
  })

export const useSecurityEvents = (params?: QueryParams) =>
  useQuery({
    queryKey: keys.events(params),
    queryFn: () => getSecurityEvents(params),
  })

export const useSecurityPolicy = () =>
  useQuery({
    queryKey: keys.policy,
    queryFn: getSecurityPolicy,
  })

export const useUpdateSecurityPolicy = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<SecurityPolicy>) => updateSecurityPolicy(patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.policy })
    },
  })
}
