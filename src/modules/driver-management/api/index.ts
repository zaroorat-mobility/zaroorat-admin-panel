import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type { QueryParams, PaginatedResponse } from '@/shared/types'
import type {
  DriverEntity,
  DriverDetails,
  DriverApplicationEntity,
  DriverApplicationDetails,
  VehicleEntity,
} from '../types'

export const getDrivers = async (
  params?: QueryParams,
): Promise<PaginatedResponse<DriverEntity>> => {
  const response = await api.get<PaginatedResponse<DriverEntity>>(API_ENDPOINTS.drivers.list, {
    params,
  })
  return response.data
}

export const getDriverById = async (id: string): Promise<DriverDetails> => {
  const response = await api.get<{ data: DriverDetails }>(API_ENDPOINTS.drivers.detail(id))
  return response.data.data
}

export const suspendDriver = async (id: string, notes?: string): Promise<DriverDetails> => {
  const response = await api.post<{ data: DriverDetails }>(API_ENDPOINTS.drivers.suspend(id), {
    ...(notes ? { notes } : {}),
  })
  return response.data.data
}

export const blockDriver = async (id: string, notes?: string): Promise<DriverDetails> => {
  const response = await api.post<{ data: DriverDetails }>(API_ENDPOINTS.drivers.block(id), {
    ...(notes ? { notes } : {}),
  })
  return response.data.data
}

export const activateDriver = async (id: string, notes?: string): Promise<DriverDetails> => {
  const response = await api.post<{ data: DriverDetails }>(API_ENDPOINTS.drivers.activate(id), {
    ...(notes ? { notes } : {}),
  })
  return response.data.data
}

export const getApplications = async (
  params?: QueryParams,
): Promise<PaginatedResponse<DriverApplicationEntity>> => {
  const response = await api.get<PaginatedResponse<DriverApplicationEntity>>(
    API_ENDPOINTS.applications.list,
    { params },
  )
  return response.data
}

export const getApplicationById = async (id: string): Promise<DriverApplicationDetails> => {
  const response = await api.get<{ data: DriverApplicationDetails }>(
    API_ENDPOINTS.applications.detail(id),
  )
  return response.data.data
}

export const createApplication = async (
  data: Record<string, unknown>,
): Promise<DriverApplicationDetails> => {
  const response = await api.post<{ data: DriverApplicationDetails }>(
    API_ENDPOINTS.applications.create,
    data,
  )
  return response.data.data
}

export const approveApplication = async (
  id: string,
  notes?: string,
): Promise<DriverApplicationDetails> => {
  const response = await api.post<{ data: DriverApplicationDetails }>(
    API_ENDPOINTS.applications.approve(id),
    { ...(notes ? { notes } : {}) },
  )
  return response.data.data
}

export const rejectApplication = async (
  id: string,
  notes?: string,
): Promise<DriverApplicationDetails> => {
  const response = await api.post<{ data: DriverApplicationDetails }>(
    API_ENDPOINTS.applications.reject(id),
    { ...(notes ? { notes } : {}) },
  )
  return response.data.data
}

export const requestApplicationResubmission = async (
  id: string,
  notes?: string,
): Promise<DriverApplicationDetails> => {
  const response = await api.post<{ data: DriverApplicationDetails }>(
    API_ENDPOINTS.applications.requestResubmission(id),
    { ...(notes ? { notes } : {}) },
  )
  return response.data.data
}

export const verifyApplicationDocument = async (
  applicationId: string,
  documentId: string,
  status: 'approved' | 'rejected' | 'pending' | 'reupload_requested',
  comment?: string,
): Promise<DriverApplicationDetails> => {
  if (status === 'pending') {
    return getApplicationById(applicationId)
  }
  const apiStatus = status === 'approved' ? 'VERIFIED' : 'REJECTED'
  const response = await api.post<{ data: DriverApplicationDetails }>(
    API_ENDPOINTS.applications.documentReview(applicationId, documentId),
    {
      status: apiStatus,
      ...(comment || apiStatus === 'REJECTED'
        ? { rejectionReason: comment || 'Document rejected' }
        : {}),
    },
  )
  return response.data.data
}

export const getVehicles = async (
  params?: QueryParams,
): Promise<PaginatedResponse<VehicleEntity>> => {
  const response = await api.get<PaginatedResponse<VehicleEntity>>(API_ENDPOINTS.vehicles.list, {
    params,
  })
  return response.data
}

export const getVehicleById = async (
  id: string,
): Promise<VehicleEntity & { vehicle: NonNullable<DriverDetails['vehicle']>; driver: DriverEntity }> => {
  const response = await api.get<{
    data: VehicleEntity & {
      vehicle: NonNullable<DriverDetails['vehicle']>
      driver: DriverEntity
    }
  }>(API_ENDPOINTS.vehicles.detail(id))
  return response.data.data
}

export const flagVehicleForRenewal = async (
  id: string,
  notes?: string,
): Promise<VehicleEntity & { vehicle: NonNullable<DriverDetails['vehicle']>; driver: DriverEntity }> => {
  const response = await api.post<{
    data: VehicleEntity & {
      vehicle: NonNullable<DriverDetails['vehicle']>
      driver: DriverEntity
    }
  }>(API_ENDPOINTS.vehicles.flagRenewal(id), {
    ...(notes ? { notes } : {}),
  })
  return response.data.data
}
