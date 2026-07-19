import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryParams } from '@/shared/types'
import { OperationsService } from '../services'
import type { SosResolutionType, ComplaintStatus, Complaint } from '../types'

// Central Query Keys
const OK = {
  rides: (params?: QueryParams) => ['operations', 'rides', params || {}] as const,
  ride: (id: string) => ['operations', 'ride', id] as const,
  sosAlerts: (params?: QueryParams) => ['operations', 'sosAlerts', params || {}] as const,
  sosAlert: (id: string) => ['operations', 'sosAlert', id] as const,
  complaints: (params?: QueryParams) => ['operations', 'complaints', params || {}] as const,
  complaint: (id: string) => ['operations', 'complaint', id] as const
}

// ─────────────────────────────────────────────────────────────────────────────
// RIDE MONITOR HOOKS
// ─────────────────────────────────────────────────────────────────────────────

export const useRides = (params?: QueryParams) => {
  return useQuery({
    queryKey: OK.rides(params),
    queryFn: () => OperationsService.getRides(params)
  })
}

export const useRide = (id: string) => {
  return useQuery({
    queryKey: OK.ride(id),
    queryFn: () => OperationsService.getRideById(id),
    enabled: !!id
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// SOS MONITOR HOOKS
// ─────────────────────────────────────────────────────────────────────────────

export const useSOSAlerts = (params?: QueryParams) => {
  return useQuery({
    queryKey: OK.sosAlerts(params),
    queryFn: () => OperationsService.getSOSAlerts(params),
    refetchInterval: 10000 // Poll every 10 seconds to auto-refresh escalation timer badges!
  })
}

export const useSOSAlert = (id: string) => {
  return useQuery({
    queryKey: OK.sosAlert(id),
    queryFn: () => OperationsService.getSOSAlertById(id),
    enabled: !!id
  })
}

export const useAcknowledgeSOS = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      OperationsService.acknowledgeSOS(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations'] })
    }
  })
}

export const useResolveSOS = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, resolutionType, notes }: { id: string; resolutionType: SosResolutionType; notes: string }) =>
      OperationsService.resolveSOS(id, resolutionType, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations'] })
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPLAINTS QUEUE HOOKS
// ─────────────────────────────────────────────────────────────────────────────

export const useComplaints = (params?: QueryParams) => {
  return useQuery({
    queryKey: OK.complaints(params),
    queryFn: () => OperationsService.getComplaints(params)
  })
}

export const useComplaint = (id: string) => {
  return useQuery({
    queryKey: OK.complaint(id),
    queryFn: () => OperationsService.getComplaintById(id),
    enabled: !!id
  })
}

export const useCreateComplaint = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'timeline'>) =>
      OperationsService.createComplaint(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations'] })
    }
  })
}

export const useAssignComplaint = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, agentName }: { id: string; agentName: string }) =>
      OperationsService.assignComplaint(id, agentName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations'] })
    }
  })
}

export const useUpdateComplaintStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: ComplaintStatus; notes?: string }) =>
      OperationsService.updateComplaintStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations'] })
    }
  })
}

export const useResolveComplaint = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, resolutionNotes }: { id: string; resolutionNotes: string }) =>
      OperationsService.resolveComplaint(id, resolutionNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations'] })
    }
  })
}

export const useCloseComplaint = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      OperationsService.closeComplaint(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations'] })
    }
  })
}
