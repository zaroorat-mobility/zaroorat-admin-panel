import type { BaseEntity } from '@/shared/types'

export interface DriverEntity extends BaseEntity {
  name: string
  email: string
  phone: string
  vehicleType: 'Auto' | 'Bike' | 'Mini Cab' | 'Sedan Cab' | 'SUV Cab'
  vehicleNumber: string
  status: 'active' | 'inactive' | 'pending'
  rating: number
}

export interface DriverDetails extends DriverEntity {
  licenseNumber: string
  walletBalance: number
  aadhaarVerified: boolean
  panVerified: boolean
  documentsUrl: {
    license: string
    rc: string
  }
}
