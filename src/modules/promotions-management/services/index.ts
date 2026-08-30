import type { QueryParams, PaginatedResponse } from '@/shared/types'
import type {
  AudienceSegment,
  BannerInput,
  Campaign,
  CampaignInput,
  Coupon,
  CouponBatch,
  CouponBatchInput,
  PromoBanner,
  Promotion,
  PromotionInput,
  ReportOverview,
  SegmentInput,
} from '../types'
import * as promoApi from '../api'

export const PromotionsManagementService = {
  getPromotions: (params?: QueryParams): Promise<PaginatedResponse<Promotion>> =>
    promoApi.getPromotions(params),
  getPromotionById: (id: string) => promoApi.getPromotionById(id),
  createPromotion: (data: PromotionInput) => promoApi.createPromotion(data),
  updatePromotion: (id: string, data: Partial<PromotionInput>) =>
    promoApi.updatePromotion(id, data),
  activatePromotion: (id: string) => promoApi.activatePromotion(id),
  deactivatePromotion: (id: string) => promoApi.deactivatePromotion(id),

  getCampaigns: (params?: QueryParams): Promise<PaginatedResponse<Campaign>> =>
    promoApi.getCampaigns(params),
  getCampaignById: (id: string) => promoApi.getCampaignById(id),
  createCampaign: (data: CampaignInput) => promoApi.createCampaign(data),
  updateCampaign: (id: string, data: Partial<CampaignInput>) => promoApi.updateCampaign(id, data),
  setCampaignTargets: (
    id: string,
    targets: Array<{ segmentId: string; promotionId?: string | null }>,
  ) => promoApi.setCampaignTargets(id, targets),

  getSegments: (params?: QueryParams): Promise<PaginatedResponse<AudienceSegment>> =>
    promoApi.getSegments(params),
  createSegment: (data: SegmentInput) => promoApi.createSegment(data),
  updateSegment: (id: string, data: Partial<SegmentInput>) => promoApi.updateSegment(id, data),
  deleteSegment: (id: string) => promoApi.deleteSegment(id),

  getCouponBatches: (params?: QueryParams): Promise<PaginatedResponse<CouponBatch>> =>
    promoApi.getCouponBatches(params),
  createCouponBatch: (data: CouponBatchInput) => promoApi.createCouponBatch(data),
  activateCouponBatch: (id: string) => promoApi.activateCouponBatch(id),
  deactivateCouponBatch: (id: string) => promoApi.deactivateCouponBatch(id),
  getCoupons: (params?: QueryParams): Promise<PaginatedResponse<Coupon>> =>
    promoApi.getCoupons(params),

  getBanners: (params?: QueryParams): Promise<PaginatedResponse<PromoBanner>> =>
    promoApi.getBanners(params),
  createBanner: (data: BannerInput) => promoApi.createBanner(data),
  updateBanner: (id: string, data: Partial<BannerInput>) => promoApi.updateBanner(id, data),
  activateBanner: (id: string) => promoApi.activateBanner(id),
  deactivateBanner: (id: string) => promoApi.deactivateBanner(id),
  deleteBanner: (id: string) => promoApi.deleteBanner(id),

  getCities: () => promoApi.getCities(),
  getReportOverview: (): Promise<ReportOverview> => promoApi.getReportOverview(),
}
