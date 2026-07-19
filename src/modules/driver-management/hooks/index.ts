import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import DriverManagementService from '../services'
import type { QueryParams } from '@/shared/types'

const QK = {
  applications: (params?: QueryParams) => ['driver-management', 'applications', 'list', params],
  application: (id: string) => ['driver-management', 'applications', 'detail', id],
  drivers: (params?: QueryParams) => ['driver-management', 'drivers', 'list', params],
  driver: (id: string) => ['driver-management', 'drivers', 'detail', id],
  vehicles: (params?: QueryParams) => ['driver-management', 'vehicles', 'list', params],
  vehicle: (id: string) => ['driver-management', 'vehicles', 'detail', id],
}

// ─── Applications Hooks ────────────────────────────────────────────────────

export const useApplications = (params?: QueryParams) => {
  return useQuery({
    queryKey: QK.applications(params),
    queryFn: () => DriverManagementService.getApplications(params),
  })
}

export const useApplication = (id: string) => {
  return useQuery({
    queryKey: QK.application(id),
    queryFn: () => DriverManagementService.getApplicationById(id),
    enabled: !!id,
  })
}

export const useCreateApplication = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => DriverManagementService.createApplication(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['driver-management', 'applications'] })
      qc.invalidateQueries({ queryKey: ['driver-management', 'drivers'] })
    },
  })
}

export const useUpdateApplication = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      DriverManagementService.updateApplication(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['driver-management', 'applications'] })
      qc.invalidateQueries({ queryKey: QK.application(id) })
    },
  })
}

export const useDeleteApplication = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => DriverManagementService.deleteApplication(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['driver-management', 'applications'] })
    },
  })
}

export const useApproveApplication = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes, billingMode }: { id: string; notes?: string; billingMode?: 'free' | 'commission' | 'subscription' }) =>
      DriverManagementService.approveApplication(id, notes, billingMode),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['driver-management', 'applications'] })
      qc.invalidateQueries({ queryKey: QK.application(id) })
      qc.invalidateQueries({ queryKey: ['driver-management', 'drivers'] })
    },
  })
}

export const useRejectApplication = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      DriverManagementService.rejectApplication(id, notes),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['driver-management', 'applications'] })
      qc.invalidateQueries({ queryKey: QK.application(id) })
    },
  })
}

export const useRequestResubmission = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      DriverManagementService.requestResubmission(id, notes),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['driver-management', 'applications'] })
      qc.invalidateQueries({ queryKey: QK.application(id) })
    },
  })
}

export const useVerifyApplicationDocument = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      applicationId,
      docType,
      status,
      comment,
    }: {
      applicationId: string
      docType: string
      status: 'approved' | 'rejected' | 'pending' | 'reupload_requested'
      comment?: string
    }) => DriverManagementService.verifyApplicationDocument(applicationId, docType, status, comment),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: QK.application(data.id) })
    },
  })
}

// ─── Drivers Hooks ─────────────────────────────────────────────────────────

export const useDrivers = (params?: QueryParams) => {
  return useQuery({
    queryKey: QK.drivers(params),
    queryFn: () => DriverManagementService.getDrivers(params),
  })
}

export const useDriver = (id: string) => {
  return useQuery({
    queryKey: QK.driver(id),
    queryFn: () => DriverManagementService.getDriverById(id),
    enabled: !!id,
  })
}

export const useSuspendDriver = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      DriverManagementService.suspendDriver(id, notes),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['driver-management', 'drivers'] })
      qc.invalidateQueries({ queryKey: QK.driver(id) })
    },
  })
}

export const useBlockDriver = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      DriverManagementService.blockDriver(id, notes),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['driver-management', 'drivers'] })
      qc.invalidateQueries({ queryKey: QK.driver(id) })
    },
  })
}

export const useActivateDriver = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      DriverManagementService.activateDriver(id, notes),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['driver-management', 'drivers'] })
      qc.invalidateQueries({ queryKey: QK.driver(id) })
    },
  })
}

export const useUpdateDriverBillingMode = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      billingMode,
      subscriptionType,
      notes,
    }: {
      id: string
      billingMode: 'free' | 'commission' | 'subscription'
      subscriptionType?: 'monthly' | 'weekly' | 'daily'
      notes?: string
    }) => DriverManagementService.updateDriverBillingMode(id, billingMode, subscriptionType, notes),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['driver-management', 'drivers'] })
      qc.invalidateQueries({ queryKey: QK.driver(id) })
    },
  })
}

export const useAddDriverTimelineNote = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      DriverManagementService.addDriverTimelineNote(id, notes),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: QK.driver(id) })
    },
  })
}

// ─── Vehicles Hooks ────────────────────────────────────────────────────────

export const useVehicles = (params?: QueryParams) => {
  return useQuery({
    queryKey: QK.vehicles(params),
    queryFn: () => DriverManagementService.getVehicles(params),
  })
}

export const useVehicle = (id: string) => {
  return useQuery({
    queryKey: QK.vehicle(id),
    queryFn: () => DriverManagementService.getVehicleById(id),
    enabled: !!id,
  })
}
