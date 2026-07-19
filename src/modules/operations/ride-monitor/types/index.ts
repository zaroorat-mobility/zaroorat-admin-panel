import type { BaseEntity } from '@/shared/types'
import type { VehicleType } from '@/modules/driver-management/types'

export type RideStatus =
  | 'REQUESTED'
  | 'SEARCHING'
  | 'DRIVER_ASSIGNED'
  | 'DRIVER_ARRIVED'
  | 'OTP_VERIFIED'
  | 'IN_PROGRESS'
  | 'PAYMENT_PENDING'
  | 'COMPLETED'
  | 'CANCELLED_BY_RIDER'
  | 'CANCELLED_BY_DRIVER'
  | 'NO_DRIVER_FOUND'
  | 'RIDER_NO_SHOW'

export type RidePaymentStatus = 'pending' | 'completed' | 'failed'
export type RidePaymentMethod = 'cash' | 'card' | 'wallet' | 'upi'

export interface RideTimelineEvent {
  stage: string
  timestamp: string
  description: string
}

export interface Ride extends BaseEntity {
  riderId: string
  riderName: string
  riderMobile: string
  driverId?: string
  driverName?: string
  driverMobile?: string
  vehiclePlate?: string
  vehicleType: VehicleType
  vehicleModel?: string
  status: RideStatus
  paymentStatus: RidePaymentStatus
  paymentMethod: RidePaymentMethod
  pickupLocation: string
  dropLocation: string
  distance: number
  duration: number
  baseFare: number
  distanceCharge: number
  timeCharge: number
  surgeCharge: number
  discount: number
  finalFare: number
  otp: string
  sosState: 'none' | 'raised' | 'acknowledged' | 'resolved'
  timeline: RideTimelineEvent[]
}
