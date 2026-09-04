import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type { QueryParams, PaginatedResponse } from '@/shared/types'
import type {
  SettlementBatch,
  DriverSettlement,
  DriverLedgerEntry,
  SettlementStatus,
} from '../types'

const getSettlements = async (
  params?: QueryParams,
): Promise<PaginatedResponse<SettlementBatch>> => {
  const response = await api.get<PaginatedResponse<SettlementBatch>>(
    API_ENDPOINTS.finance.settlements,
    { params },
  )
  return response.data
}

const getSettlementById = async (id: string): Promise<SettlementBatch> => {
  const response = await api.get<{ data: SettlementBatch }>(API_ENDPOINTS.finance.settlement(id))
  return response.data.data
}

const searchDrivers = async (
  query: string,
): Promise<{ driverId: string; driverName: string }[]> => {
  const response = await api.get<{ data: { driverId: string; driverName: string }[] }>(
    API_ENDPOINTS.finance.driverSearch,
    { params: { q: query } },
  )
  return response.data.data
}

const getDriverBreakdown = async (
  driverId: string,
  periodStart: string,
  periodEnd: string,
): Promise<DriverSettlement> => {
  const response = await api.get<{ data: DriverSettlement }>(
    API_ENDPOINTS.finance.driverBreakdown(driverId),
    { params: { periodStart, periodEnd } },
  )
  return response.data.data
}

const generateSettlementBatch = async (
  periodStart: string,
  periodEnd: string,
  _generatedBy?: string,
  _drivers?: DriverSettlement[],
): Promise<SettlementBatch> => {
  const response = await api.post<{ data: SettlementBatch }>(
    API_ENDPOINTS.finance.settlementGenerate,
    { periodStart, periodEnd },
  )
  return response.data.data
}

const updateSettlementStatus = async (
  id: string,
  status: SettlementStatus,
  _actor?: string,
): Promise<SettlementBatch> => {
  const response = await api.patch<{ data: SettlementBatch }>(
    API_ENDPOINTS.finance.settlementStatus(id),
    { status },
  )
  return response.data.data
}

const getDriverLedger = async (driverId: string): Promise<DriverLedgerEntry[]> => {
  const response = await api.get<{ data: DriverLedgerEntry[] }>(
    API_ENDPOINTS.finance.driverLedger(driverId),
  )
  return response.data.data
}

export const SettlementService = {
  getSettlements,
  getSettlementById,
  generateSettlementBatch,
  updateSettlementStatus,
  getDriverLedger,
  searchDrivers,
  getDriverBreakdown,
}

export default SettlementService
