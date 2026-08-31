import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryParams } from '@/shared/types'
import { OperationsService } from '../services'
import type { SosResolutionType, ComplaintStatus, Complaint } from '../types'

// Central Query Keys
const OK = {
  rides: (params?: QueryParams) => ['operations', 'rides', params || {}] as const,
  ride: (id: string) => ['operations', 'ride', id] as const,
  rideNotes: (id: string) => ['operations', 'ride', id, 'notes'] as const,
  rideAudit: (id: string, params?: QueryParams) => ['operations', 'ride', id, 'audit', params || {}] as const,
  rideDriverLocation: (id: string) => ['operations', 'ride', id, 'driver-location'] as const,
  liveSummary: (params?: { longWaitThresholdMin?: number }) => ['operations', 'live', 'summary', params || {}] as const,
  activeRides: (params?: QueryParams) => ['operations', 'live', 'activeRides', params || {}] as const,
  liveMap: (params?: { city?: string; vehicleTypeId?: string }) => ['operations', 'live', 'map', params || {}] as const,
  liveDrivers: (params?: QueryParams) => ['operations', 'live', 'drivers', params || {}] as const,
  liveAlerts: (params?: { longWaitThresholdMin?: number }) => ['operations', 'live', 'alerts', params || {}] as const,
  dispatchRequests: (params?: QueryParams) => ['operations', 'dispatch', 'requests', params || {}] as const,
  dispatchRequest: (id: string) => ['operations', 'dispatch', 'request', id] as const,
  dispatchCandidates: (id: string) => ['operations', 'dispatch', 'candidates', id] as const,
  sosAlerts: (params?: QueryParams) => ['operations', 'sosAlerts', params || {}] as const,
  sosAlert: (id: string) => ['operations', 'sosAlert', id] as const,
  incidents: (params?: QueryParams) => ['operations', 'incidents', params || {}] as const,
  incident: (id: string) => ['operations', 'incident', id] as const,
  complaints: (params?: QueryParams) => ['operations', 'complaints', params || {}] as const,
  complaint: (id: string) => ['operations', 'complaint', id] as const
}

// ─────────────────────────────────────────────────────────────────────────────
// LIVE OPERATIONS HOOKS
// ─────────────────────────────────────────────────────────────────────────────

export const useLiveSummary = (params?: { longWaitThresholdMin?: number }, options?: { refetchInterval?: number | false }) => {
  return useQuery({
    queryKey: OK.liveSummary(params),
    queryFn: () => OperationsService.getLiveSummary(params),
    refetchInterval: options?.refetchInterval !== undefined ? options.refetchInterval : 15000,
  })
}

export const useActiveRides = (params?: QueryParams, options?: { refetchInterval?: number | false }) => {
  return useQuery({
    queryKey: OK.activeRides(params),
    queryFn: () => OperationsService.getActiveRides(params),
    refetchInterval: options?.refetchInterval !== undefined ? options.refetchInterval : 15000,
  })
}

export const useLiveMap = (params?: { city?: string; vehicleTypeId?: string }, options?: { refetchInterval?: number | false }) => {
  return useQuery({
    queryKey: OK.liveMap(params),
    queryFn: () => OperationsService.getLiveMap(params),
    refetchInterval: options?.refetchInterval !== undefined ? options.refetchInterval : 15000,
  })
}

export const useLiveDrivers = (params?: QueryParams, options?: { refetchInterval?: number | false }) => {
  return useQuery({
    queryKey: OK.liveDrivers(params),
    queryFn: () => OperationsService.getLiveDrivers(params),
    refetchInterval: options?.refetchInterval !== undefined ? options.refetchInterval : 15000,
  })
}

export const useLiveAlerts = (params?: { longWaitThresholdMin?: number }, options?: { refetchInterval?: number | false }) => {
  return useQuery({
    queryKey: OK.liveAlerts(params),
    queryFn: () => OperationsService.getLiveAlerts(params),
    refetchInterval: options?.refetchInterval !== undefined ? options.refetchInterval : 15000,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// DISPATCH & MATCHING HOOKS
// ─────────────────────────────────────────────────────────────────────────────

export const useDispatchRequests = (params?: QueryParams, options?: { refetchInterval?: number | false }) => {
  return useQuery({
    queryKey: OK.dispatchRequests(params),
    queryFn: () => OperationsService.getDispatchRequests(params),
    refetchInterval: options?.refetchInterval !== undefined ? options.refetchInterval : 15000,
  })
}

export const useDispatchRequest = (id: string) => {
  return useQuery({
    queryKey: OK.dispatchRequest(id),
    queryFn: () => OperationsService.getDispatchRequestById(id),
    enabled: !!id,
  })
}

export const useDispatchCandidates = (id: string) => {
  return useQuery({
    queryKey: OK.dispatchCandidates(id),
    queryFn: () => OperationsService.getDispatchCandidates(id),
    enabled: !!id,
  })
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
    enabled: !!id,
  })
}

export const useRideNotes = (id: string) => {
  return useQuery({
    queryKey: OK.rideNotes(id),
    queryFn: () => OperationsService.getRideNotes(id),
    enabled: !!id,
  })
}

export const useAddRideNote = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      OperationsService.addRideNote(id, note),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: OK.rideNotes(id) })
      queryClient.invalidateQueries({ queryKey: OK.ride(id) })
      queryClient.invalidateQueries({ queryKey: ['operations', 'ride', id, 'audit'] })
    },
  })
}

export const useCancelRide = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reasonCode, reasonText }: { id: string; reasonCode?: string; reasonText?: string }) =>
      OperationsService.cancelRide(id, { reasonCode, reasonText }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: OK.ride(id) })
      queryClient.invalidateQueries({ queryKey: OK.rides() })
      queryClient.invalidateQueries({ queryKey: ['operations', 'ride', id, 'audit'] })
    },
  })
}

export const useRideAuditLogs = (id: string, params?: QueryParams) => {
  return useQuery({
    queryKey: OK.rideAudit(id, params),
    queryFn: () => OperationsService.getRideAuditLogs(id, params),
    enabled: !!id,
  })
}

export const useRideDriverLocation = (
  id: string,
  options?: { refetchInterval?: number | false; enabled?: boolean },
) => {
  return useQuery({
    queryKey: OK.rideDriverLocation(id),
    queryFn: () => OperationsService.getRideDriverLocation(id),
    enabled: !!id && options?.enabled !== false,
    refetchInterval: options?.refetchInterval !== undefined ? options.refetchInterval : 10000,
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
// SAFETY CENTER & INCIDENT HOOKS
// ─────────────────────────────────────────────────────────────────────────────

export const useIncidents = (params?: QueryParams, options?: { refetchInterval?: number | false }) => {
  return useQuery({
    queryKey: OK.incidents(params),
    queryFn: () => OperationsService.getIncidents(params),
    refetchInterval: options?.refetchInterval !== undefined ? options.refetchInterval : 10000,
  })
}

export const useIncident = (id: string) => {
  return useQuery({
    queryKey: OK.incident(id),
    queryFn: () => OperationsService.getIncidentById(id),
    enabled: !!id,
  })
}

export const useAcknowledgeIncident = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      OperationsService.acknowledgeIncident(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations'] })
    },
  })
}

export const useResolveIncident = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      resolutionType,
      resolutionNotes,
      status,
    }: {
      id: string
      resolutionType: string
      resolutionNotes: string
      status?: string
    }) => OperationsService.resolveIncident(id, { resolutionType, resolutionNotes, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations'] })
    },
  })
}

export const useEscalateIncident = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, severity, notes }: { id: string; severity: string; notes: string }) =>
      OperationsService.escalateIncident(id, { severity, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations'] })
    },
  })
}

export const useAddIncidentNote = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      OperationsService.addIncidentNote(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations'] })
    },
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
