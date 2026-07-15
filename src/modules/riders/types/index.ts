import type { BaseEntity } from '@/shared/types'

export interface RiderEntity extends BaseEntity {
  name: string
  email: string
  phone: string
  rating: number
  totalRides: number
  status: 'active' | 'inactive'
}

export interface RiderDetails extends RiderEntity {
  joinedDate: string
  walletBalance: number
  emergencyContact?: string
}
