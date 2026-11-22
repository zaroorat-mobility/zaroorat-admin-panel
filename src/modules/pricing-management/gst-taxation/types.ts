export interface GstConfig {
  cgst: number
  sgst: number
  igst: number
  gstin: string
  sacCode?: string
  status?: 'active' | 'inactive'
}

export interface TaxCommissionItem {
  id: string
  version: string
  isCurrent?: boolean
  commissionRate: number
  gstRate: number
  totalDeduction: number
  applicableVehicles: string[]
  applicableVehicleIds?: string[]
  applicableCities: string[]
  applicableZones: string[]
  effectiveFrom: string
  effectiveTo: string | null
  applicationRule: string
  includeBookingFee?: boolean
  roundOffRupee?: boolean
  status: 'active' | 'expired' | 'inactive'
  createdAt: string
}
