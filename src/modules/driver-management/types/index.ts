import type { BaseEntity } from '@/shared/types'

// ─── Application Domain ────────────────────────────────────────────────────

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'pending_review'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'resubmission_required'

export type ApplicationSource =
  | 'driver_app'
  | 'admin_manual'
  // Future sources: 'partner_referral' | 'bulk_import' | 'vendor_migration'

// ─── Driver Domain ─────────────────────────────────────────────────────────

export type DriverStatus =
  | 'active'
  | 'offline'
  | 'online'
  | 'on_trip'
  | 'suspended'
  | 'blocked'

// ─── Document Domain ───────────────────────────────────────────────────────

export type DocVerifyStatus = 'pending' | 'approved' | 'rejected' | 'reupload_requested'

export type DocType =
  | 'license'
  | 'license_front'
  | 'license_back'
  | 'aadhaar'
  | 'aadhaar_front'
  | 'aadhaar_back'
  | 'rc'
  | 'insurance'
  | 'permit'
  | 'photo'
  | 'pan'
  | 'selfie'
  | 'pollution'
  | 'fitness'

export interface DriverKycDocument {
  id: string
  driverId: string
  docType: DocType
  docNumber?: string
  fileUrl: string
  issuedDate?: string
  expiryDate?: string
  verifyStatus: DocVerifyStatus
  comment?: string
  verifiedBy?: string
  verifiedAt?: string
  createdAt?: string
  updatedAt?: string
}

// ─── Vehicle Domain ────────────────────────────────────────────────────────

export type VehicleType = 'cab' | 'auto' | 'bike' | 'carpool'

export interface VehicleInfo {
  id: string
  driverId: string
  vehicleType: VehicleType
  vehicleCategory?: string
  brand?: string
  model?: string
  makeModel?: string
  registrationPlate: string
  registrationNumber?: string
  color?: string
  seatsCapacity: number
  seatCapacity?: number
  manufacturingYear?: number
  rcNumber?: string
  rcUrl?: string
  insuranceNo?: string
  insuranceExpiry?: string
  insuranceUrl?: string
  permitNo?: string
  permitExpiry?: string
  permitUrl?: string
  pollutionNo?: string
  pollutionExpiry?: string
  pollutionUrl?: string
  fitnessNo?: string
  fitnessExpiry?: string
  fitnessUrl?: string
}

// ─── Timeline Event ────────────────────────────────────────────────────────

export interface ApplicationTimelineEvent {
  id: string
  action: string
  actor: string
  timestamp: string
  notes?: string
  isSystem?: boolean
}

// ─── Driver Application (core entity) ─────────────────────────────────────

export interface DriverApplicationEntity extends BaseEntity {
  applicationId: string
  driverId: string
  driverName: string
  mobileNumber: string
  vehicleType: VehicleType
  applicationStatus: ApplicationStatus
  source: ApplicationSource
  submittedAt: string
}

export interface DriverApplicationDetails extends DriverApplicationEntity {
  // Personal
  email?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  dateOfBirth?: string
  licenseNo?: string
  profilePhotoUrl?: string

  // Operational flags
  onlineStatus: 'offline' | 'online' | 'on_trip' | 'on_break'
  bgCheckStatus: 'not_started' | 'in_progress' | 'clear' | 'flagged'
  billingMode?: 'free' | 'commission' | 'subscription'
  ratingAvg: number
  totalTrips: number
  isAvailable: boolean
  isBlocked: boolean

  // Extended personal
  emergencyContactName?: string
  emergencyContactNumber?: string
  preferredLanguage?: string
  referralCode?: string

  // Identity & Bank
  panNumber?: string
  aadhaarNumber?: string
  bankAccountName?: string
  bankAccountNumber?: string
  bankIfsc?: string
  bankName?: string
  upiId?: string

  // Address
  country?: string
  state?: string
  city?: string
  postcode?: string
  addressLine1?: string
  addressLine2?: string
  landmark?: string

  // Relations
  vehicle?: VehicleInfo
  documents: DriverKycDocument[]
  auditLogs: {
    action: string
    operator: string
    timestamp: string
    notes?: string
  }[]
  timeline?: ApplicationTimelineEvent[]
}

// ─── Driver (approved, post-KYC) ──────────────────────────────────────────

export interface DriverEntity extends BaseEntity {
  applicationId: string
  driverName: string
  mobileNumber: string
  email?: string
  vehicleType: VehicleType
  registrationPlate?: string
  driverStatus: DriverStatus
  ratingAvg: number
  totalTrips: number
  walletBalance: number
  profilePhotoUrl?: string
  joinedAt: string
  lastActiveAt?: string
  isOnline: boolean
}

export interface DriverDetails extends DriverEntity {
  gender?: string
  dateOfBirth?: string
  emergencyContactName?: string
  emergencyContactNumber?: string
  preferredLanguage?: string
  bgCheckStatus: 'not_started' | 'in_progress' | 'clear' | 'flagged'
  country?: string
  state?: string
  city?: string
  postcode?: string
  addressLine1?: string
  addressLine2?: string
  panNumber?: string
  aadhaarNumber?: string
  bankAccountName?: string
  bankAccountNumber?: string
  bankIfsc?: string
  bankName?: string
  upiId?: string
  vehicle?: VehicleInfo
  documents: DriverKycDocument[]
  billingMode?: 'free' | 'commission' | 'subscription'
  subscriptionType?: 'monthly' | 'weekly' | 'daily'
  earningsToday?: number
  earningsWeek?: number
  earningsMonth?: number
  outstandingDues?: number
  ratingsBreakdown?: {
    [star: number]: number
  }
  categoryScores?: {
    behaviour: number
    driving: number
    punctuality: number
    cleanliness: number
  }
  recentReviews?: {
    id: string
    date: string
    riderName: string
    score: number
    comment: string
  }[]
  ledger?: {
    id: string
    date: string
    type: 'EARNING' | 'COMMISSION_DUE' | 'PAYOUT' | 'BONUS'
    amount: number
    balanceAfter: number
    rideId?: string
  }[]
  timeline?: ApplicationTimelineEvent[]
  auditLogs: {
    action: string
    operator: string
    timestamp: string
    notes?: string
  }[]
}

// ─── Vehicle (fleet management) ────────────────────────────────────────────

export interface VehicleEntity extends BaseEntity {
  driverId: string
  driverName: string
  registrationPlate: string
  vehicleType: VehicleType
  vehicleCategory?: string
  brand?: string
  model?: string
  color?: string
  manufacturingYear?: number
  insuranceExpiry?: string
  permitExpiry?: string
  fitnessExpiry?: string
  pollutionExpiry?: string
  isActive: boolean
}

// ─── Backward compatibility aliases (for verification module bridge) ────────

/** @deprecated Use DriverApplicationEntity instead */
export type VerificationEntity = DriverApplicationEntity & {
  status: ApplicationStatus
}

/** @deprecated Use DriverApplicationDetails instead */
export type VerificationDetails = DriverApplicationDetails & {
  status: ApplicationStatus
  approvalStatus: ApplicationStatus
}
