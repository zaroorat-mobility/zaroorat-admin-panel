import type { QueryParams, PaginatedResponse } from '@/shared/types'
import type {
  DriverApplicationDetails,
  DriverApplicationEntity,
  DriverEntity,
  DriverDetails,
  VehicleEntity,
  VehicleInfo,
} from '../types'
import * as driversApi from '../api'

const normalizePhone = (raw: string): string => {
  const trimmed = raw.trim()
  if (trimmed.startsWith('+')) return trimmed
  if (/^\d{10}$/.test(trimmed)) return `+91${trimmed}`
  return `+${trimmed}`
}

const toCreatePayload = (data: Record<string, unknown>) => {
  const payload = { ...data }
  if (typeof payload.mobileNumber === 'string') {
    payload.mobileNumber = normalizePhone(payload.mobileNumber)
  }
  if (typeof payload.emergencyContactNumber === 'string' && payload.emergencyContactNumber) {
    payload.emergencyContactNumber = normalizePhone(payload.emergencyContactNumber)
  }
  // Backend does not need confirm field.
  delete payload.confirmBankAccountNumber
  return payload
}

// ─── Applications ──────────────────────────────────────────────────────────

const getApplications = async (
  params?: QueryParams,
): Promise<PaginatedResponse<DriverApplicationEntity>> => {
  return driversApi.getApplications(params)
}

const getApplicationById = async (id: string): Promise<DriverApplicationDetails> => {
  return driversApi.getApplicationById(id)
}

const createApplication = async (data: unknown): Promise<DriverApplicationDetails> => {
  return driversApi.createApplication(toCreatePayload(data as Record<string, unknown>))
}

const updateApplication = async (
  _id: string,
  _data: unknown,
): Promise<DriverApplicationDetails> => {
  throw new Error('Editing applications is not available from the API yet')
}

const deleteApplication = async (_id: string): Promise<void> => {
  throw new Error('Deleting applications is not available from the API yet')
}

const approveApplication = async (
  id: string,
  notes?: string,
  _billingMode?: 'free' | 'commission' | 'subscription',
): Promise<DriverApplicationDetails> => {
  return driversApi.approveApplication(id, notes)
}

const rejectApplication = async (id: string, notes?: string): Promise<DriverApplicationDetails> => {
  return driversApi.rejectApplication(id, notes)
}

const requestResubmission = async (
  id: string,
  notes?: string,
): Promise<DriverApplicationDetails> => {
  return driversApi.requestApplicationResubmission(id, notes)
}

const verifyApplicationDocument = async (
  applicationId: string,
  documentId: string,
  status: 'approved' | 'rejected' | 'pending' | 'reupload_requested',
  comment?: string,
): Promise<DriverApplicationDetails> => {
  return driversApi.verifyApplicationDocument(applicationId, documentId, status, comment)
}

// ─── Drivers ───────────────────────────────────────────────────────────────

const getDrivers = async (params?: QueryParams): Promise<PaginatedResponse<DriverEntity>> => {
  return driversApi.getDrivers(params)
}

const getDriverById = async (id: string): Promise<DriverDetails> => {
  const driver = await driversApi.getDriverById(id)
  return {
    ...driver,
    documents: driver.documents ?? [],
    auditLogs: driver.auditLogs ?? [],
    timeline: driver.timeline ?? [],
    ledger: driver.ledger ?? [],
    bgCheckStatus: driver.bgCheckStatus ?? 'not_started',
  }
}

const updateDriverStatus = async (
  id: string,
  status: 'suspended' | 'blocked' | 'active',
  notes?: string,
): Promise<DriverDetails> => {
  if (status === 'active') return driversApi.activateDriver(id, notes)
  if (status === 'blocked') return driversApi.blockDriver(id, notes)
  return driversApi.suspendDriver(id, notes)
}

const updateDriverBillingMode = async (
  _id: string,
  _billingMode: 'free' | 'commission' | 'subscription',
  _subscriptionType?: 'monthly' | 'weekly' | 'daily',
  _notes?: string,
): Promise<DriverDetails> => {
  throw new Error('Billing plan updates are not available from the API yet')
}

const addDriverTimelineNote = async (_id: string, _notes: string): Promise<DriverDetails> => {
  throw new Error('Timeline notes are not available from the API yet')
}

// ─── Vehicles ──────────────────────────────────────────────────────────────

const getVehicles = async (params?: QueryParams): Promise<PaginatedResponse<VehicleEntity>> => {
  return driversApi.getVehicles(params)
}

const getVehicleById = async (
  id: string,
): Promise<VehicleEntity & { vehicle: VehicleInfo; driver: DriverEntity }> => {
  const detail = await driversApi.getVehicleById(id)
  return {
    ...detail,
    vehicle: detail.vehicle as VehicleInfo,
  }
}

const flagVehicleForRenewal = async (id: string, notes?: string) => {
  return driversApi.flagVehicleForRenewal(id, notes)
}

export const DriverManagementService = {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
  approveApplication,
  rejectApplication,
  requestResubmission,
  verifyApplicationDocument,
  getDrivers,
  getDriverById,
  suspendDriver: (id: string, notes?: string) => updateDriverStatus(id, 'suspended', notes),
  blockDriver: (id: string, notes?: string) => updateDriverStatus(id, 'blocked', notes),
  activateDriver: (id: string, notes?: string) => updateDriverStatus(id, 'active', notes),
  updateDriverBillingMode,
  addDriverTimelineNote,
  getVehicles,
  getVehicleById,
  flagVehicleForRenewal,
}

export default DriverManagementService
