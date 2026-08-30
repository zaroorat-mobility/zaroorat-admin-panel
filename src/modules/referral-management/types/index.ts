export interface ReferralMilestone {
  id: string
  programId: string
  name: string
  requiredReferrals: number
  bonusAmount: number
  rewardType: string
  isActive: boolean
  createdAt: string
}

export interface ReferralProgram {
  id: string
  code: string
  name: string | null
  audience: 'RIDER' | 'DRIVER'
  referrerReward: number
  refereeReward: number
  rewardType: string
  rewardWallet: 'CUSTOMER' | 'DRIVER'
  qualifyingEvent: string
  qualifyingThreshold: number
  maxReferralsPerUser: number | null
  rewardExpiryDays: number | null
  validFrom: string
  validTo: string
  isActive: boolean
  status: 'active' | 'inactive'
  createdAt: string
  milestones: ReferralMilestone[]
  codesCount: number
  referralsCount: number
}

export type ReferralProgramInput = {
  code?: string
  name?: string | null
  audience?: 'RIDER' | 'DRIVER'
  referrerReward?: number
  refereeReward?: number
  rewardType?: string
  rewardWallet?: 'CUSTOMER' | 'DRIVER'
  qualifyingEvent?: string
  qualifyingThreshold?: number
  maxReferralsPerUser?: number | null
  rewardExpiryDays?: number | null
  validFrom: string
  validTo: string
  isActive?: boolean
}

export type MilestoneInput = {
  name: string
  requiredReferrals: number
  bonusAmount: number
  rewardType?: string
  isActive?: boolean
}

export interface ReferralCodeRow {
  id: string
  userId: string
  userEmail: string | null
  userPhone: string | null
  programId: string
  programCode: string
  code: string
  usesCount: number
  maxUses: number | null
  isActive: boolean
  status: 'active' | 'inactive'
  createdAt: string
}

export interface ReferralRewardRow {
  id: string
  beneficiary: string
  userId: string
  amount: number
  rewardType: string
  status: string
  creditedAt: string | null
  expiresAt: string | null
  createdAt: string
}

export interface ReferralHistoryRow {
  id: string
  programId: string
  programCode: string
  programAudience: 'RIDER' | 'DRIVER'
  referrerId: string
  referrerEmail: string | null
  referrerPhone: string | null
  refereeId: string | null
  refereeEmail: string | null
  refereePhone: string | null
  referralCode: string | null
  status: string
  qualifyingRides: number
  signedUpAt: string | null
  qualifiedAt: string | null
  rewardedAt: string | null
  expiresAt: string | null
  createdAt: string
  rewards: ReferralRewardRow[]
}
