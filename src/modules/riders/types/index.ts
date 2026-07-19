import type { BaseEntity } from '@/shared/types'

export type RiderStatus = 'active' | 'suspended' | 'blocked'

export interface RiderEmergencyContact {
  name: string
  phone: string
}

export interface RiderEntity extends BaseEntity {
  riderId: string
  fullName: string
  mobileNumber: string
  email?: string
  gender?: string
  dateOfBirth?: string
  riderStatus: RiderStatus
  ratingAvg: number
  totalRides: number
  walletBalance: number
  joinedAt: string
  lastActiveAt?: string
  emergencyContacts: RiderEmergencyContact[]
}

export interface RiderDetails extends RiderEntity {
  country?: string
  state?: string
  city?: string
  postcode?: string
  addressLine1?: string
  addressLine2?: string
  preferredPaymentMethod?: 'cash' | 'upi' | 'card' | 'wallet'
  cancelRate: number
  noShowCount: number
  ledger: {
    id: string
    date: string
    type: 'TOPUP' | 'PAYMENT' | 'REFUND' | 'CASHBACK'
    amount: number
    balanceAfter: number
    rideId?: string
  }[]
  rideHistory: {
    id: string
    date: string
    pickupAddress: string
    dropAddress: string
    fare: number
    paymentMethod: string
    status: string
  }[]
  timeline: {
    id: string
    action: string
    actor: string
    timestamp: string
    notes?: string
    isSystem?: boolean
  }[]
  auditLogs: {
    action: string
    operator: string
    timestamp: string
    notes?: string
  }[]
}
