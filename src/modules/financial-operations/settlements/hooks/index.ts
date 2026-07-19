import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryParams } from '@/shared/types'
import { SettlementService } from '../services'
import type { SettlementStatus, DriverSettlement } from '../types'

const QK = {
  settlements: (p?: QueryParams) => ['financial', 'settlements', p || {}] as const,
  settlement: (id: string) => ['financial', 'settlement', id] as const,
  driverLedger: (driverId: string) => ['financial', 'driver-ledger', driverId] as const,
  searchDrivers: (query: string) => ['financial', 'search-drivers', query] as const,
  driverBreakdown: (driverId: string, start: string, end: string) => ['financial', 'driver-breakdown', driverId, start, end] as const
}

export const useSettlements = (params?: QueryParams) =>
  useQuery({
    queryKey: QK.settlements(params),
    queryFn: () => SettlementService.getSettlements(params)
  })

export const useSettlement = (id: string) =>
  useQuery({
    queryKey: QK.settlement(id),
    queryFn: () => SettlementService.getSettlementById(id),
    enabled: !!id
  })

export const useDriverLedger = (driverId: string) =>
  useQuery({
    queryKey: QK.driverLedger(driverId),
    queryFn: () => SettlementService.getDriverLedger(driverId),
    enabled: !!driverId
  })

export const useSearchDrivers = (query: string) =>
  useQuery({
    queryKey: QK.searchDrivers(query),
    queryFn: () => SettlementService.searchDrivers(query),
    enabled: query.length >= 1
  })

export const useDriverBreakdown = (driverId: string, periodStart: string, periodEnd: string) =>
  useQuery({
    queryKey: QK.driverBreakdown(driverId, periodStart, periodEnd),
    queryFn: () => SettlementService.getDriverBreakdown(driverId, periodStart, periodEnd),
    enabled: !!driverId && !!periodStart && !!periodEnd
  })

export const useGenerateSettlement = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ periodStart, periodEnd, generatedBy, drivers }: {
      periodStart: string
      periodEnd: string
      generatedBy: string
      drivers: DriverSettlement[]
    }) => SettlementService.generateSettlementBatch(periodStart, periodEnd, generatedBy, drivers),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['financial'] })
  })
}

export const useUpdateSettlementStatus = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, actor }: { id: string; status: SettlementStatus; actor: string }) =>
      SettlementService.updateSettlementStatus(id, status, actor),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['financial'] })
  })
}

