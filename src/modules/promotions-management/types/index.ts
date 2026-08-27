export type DiscountType = 'PERCENT' | 'FIXED'

export interface Promotion {
  id: string
  code: string
  title: string | null
  description: string | null
  discountType: DiscountType
  discountValue: number
  maxDiscount: number | null
  minFare: number
  applicableCity: string | null
  applicableVehicleTypeId: string | null
  firstRideOnly: boolean
  usageLimitTotal: number | null
  usageLimitPerUser: number
  usedCount: number
  validFrom: string
  validTo: string
  isActive: boolean
  status: 'active' | 'inactive'
  createdAt: string
}

export type PromotionInput = {
  code?: string
  title?: string | null
  description?: string | null
  discountType: DiscountType | 'percent' | 'fixed'
  discountValue: number
  maxDiscount?: number | null
  minFare?: number
  applicableCity?: string | null
  applicableVehicleTypeId?: string | null
  firstRideOnly?: boolean
  usageLimitTotal?: number | null
  usageLimitPerUser?: number
  validFrom: string
  validTo: string
  isActive?: boolean
}

export interface CampaignTarget {
  id: string
  segmentId: string
  segmentCode: string
  segmentName: string
  promotionId: string | null
  promotionCode: string | null
}

export interface Campaign {
  id: string
  code: string
  name: string
  objective: string
  status: string
  budget: number | null
  spent: number
  startsAt: string | null
  endsAt: string | null
  createdAt: string
  updatedAt: string
  targets: CampaignTarget[]
}

export type CampaignInput = {
  code?: string
  name: string
  objective?: string
  status?: string
  budget?: number | null
  startsAt?: string | null
  endsAt?: string | null
}

export interface AudienceSegment {
  id: string
  code: string
  name: string
  description: string | null
  rules: {
    cityCodes?: string[]
    vehicleTypeIds?: string[]
    firstRideOnly?: boolean
    userIds?: string[]
  } | null
  estimatedSize: number | null
  isDynamic: boolean
  createdAt: string
  updatedAt: string
}

export type SegmentInput = {
  code?: string
  name: string
  description?: string | null
  rules?: AudienceSegment['rules']
  estimatedSize?: number | null
  isDynamic?: boolean
}

export interface CouponBatch {
  id: string
  campaignId: string | null
  promotionId: string
  promotionCode: string
  name: string | null
  prefix: string | null
  totalCount: number
  generatedCount: number
  perUserLimit: number
  expiresAt: string | null
  isActive: boolean
  status: 'active' | 'inactive'
  createdAt: string
}

export type CouponBatchInput = {
  promotionId: string
  campaignId?: string | null
  name?: string | null
  prefix?: string | null
  totalCount: number
  perUserLimit?: number
  expiresAt?: string | null
  isActive?: boolean
  generateNow?: boolean
}

export interface Coupon {
  id: string
  batchId: string
  code: string
  userId: string | null
  status: string
  redeemedRideId: string | null
  expiresAt: string | null
  createdAt: string
}

export interface PromoBanner {
  id: string
  campaignId: string | null
  title: string | null
  imageUrl: string
  placement: string
  actionUrl: string | null
  priority: number
  startsAt: string | null
  endsAt: string | null
  isActive: boolean
  status: 'active' | 'inactive'
  createdAt: string
}

export type BannerInput = {
  campaignId?: string | null
  title?: string | null
  imageUrl: string
  placement?: string
  actionUrl?: string | null
  priority?: number
  startsAt?: string | null
  endsAt?: string | null
  isActive?: boolean
}

export interface ReportOverview {
  totalUsage: number
  totalDiscountAmount: number
  revenueImpact: number
  uniqueUsers: number
  activePromotions: number
  promotions: Array<{
    id: string
    code: string
    title: string | null
    usedCount: number
    usageLimitTotal: number | null
    discountAmount: number
    uniqueUsers: number
  }>
}
