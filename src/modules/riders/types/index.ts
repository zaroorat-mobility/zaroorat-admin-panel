import type { BaseEntity } from '@/shared/types'

export type RiderStatus = 'active' | 'suspended' | 'blocked'

export interface RiderEmergencyContact {
  id?: string
  name: string
  phone: string
  relationship?: string
  priority?: number
}

export interface RiderDevice {
  id: string
  deviceId?: string
  platform?: string
  trustState: string
  appVersion?: string
  osVersion?: string
  isRooted: boolean
  isJailbroken: boolean
  hasPushToken: boolean
  lastSeenAt?: string
  createdAt: string
}

export interface RiderSavedPlace {
  id: string
  label: string
  address?: string
  buildingName?: string
  landmark?: string
  floor?: string
  instructions?: string
  latitude?: number
  longitude?: number
  createdAt: string
}

export interface RiderSupportTicket {
  id: string
  ticketNumber: string
  subject: string
  category?: string
  status: string
  priority: string
  channel: string
  createdAt: string
  resolvedAt?: string
}

export interface RiderReview {
  id: string
  rideCode: string
  rating: number
  ratedBy: 'DRIVER' | 'CUSTOMER'
  driverName?: string
  driverPhone?: string
  tags: string[]
  comment?: string
  createdAt: string
}

export interface RiderRideStats {
  totalRides: number
  completedRides: number
  cancelledByCustomer: number
  cancelledByDriver: number
  totalSpent: number
  cancelRate: number
  noShowCount: number
}

export interface RiderRatingBreakdown {
  avgRating: number
  totalRatings: number
  star5: number
  star4: number
  star3: number
  star2: number
  star1: number
}

export interface RiderRideHistoryItem {
  id: string
  rideId?: string
  date: string
  pickupAddress: string
  dropAddress: string
  fare: number
  paymentMethod: string
  status: string
  driverName?: string
  driverPhone?: string
  vehicleType?: string
  vehiclePlate?: string
  cancellationReason?: string
  cancelledBy?: string
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
  isPhoneVerified?: boolean
  isEmailVerified?: boolean
  hasRidePin?: boolean
  ridePinVersion?: number
  ridePinUpdatedAt?: string
  languageCode?: string
  referralCode?: string
  referralsCount?: number
  deletionRequest?: {
    status: string
    requestedAt: string
    scheduledFor: string
  }
  stats?: RiderRideStats
  ratingBreakdown?: RiderRatingBreakdown
  devices?: RiderDevice[]
  savedPlaces?: RiderSavedPlace[]
  emergencyContactsList?: RiderEmergencyContact[]
  supportTickets?: RiderSupportTicket[]
  reviews?: RiderReview[]
  cancelRate: number
  noShowCount: number
  safetyIncidentsCount?: number
  ledger: {
    id: string
    date: string
    type: 'TOPUP' | 'PAYMENT' | 'REFUND' | 'CASHBACK'
    amount: number
    balanceAfter: number
    rideId?: string
  }[]
  rideHistory: RiderRideHistoryItem[]
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
