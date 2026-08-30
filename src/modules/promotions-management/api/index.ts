import { api, API_ENDPOINTS } from '@/infrastructure/api'
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

export const getPromotions = async (
  params?: QueryParams,
): Promise<PaginatedResponse<Promotion>> => {
  const response = await api.get<PaginatedResponse<Promotion>>(API_ENDPOINTS.promotions.list, {
    params,
  })
  return response.data
}

export const getPromotionById = async (id: string): Promise<Promotion> => {
  const response = await api.get<{ data: Promotion }>(API_ENDPOINTS.promotions.detail(id))
  return response.data.data
}

export const createPromotion = async (data: PromotionInput): Promise<Promotion> => {
  const response = await api.post<{ data: Promotion }>(API_ENDPOINTS.promotions.create, data)
  return response.data.data
}

export const updatePromotion = async (
  id: string,
  data: Partial<PromotionInput>,
): Promise<Promotion> => {
  const response = await api.patch<{ data: Promotion }>(API_ENDPOINTS.promotions.update(id), data)
  return response.data.data
}

export const activatePromotion = async (id: string): Promise<Promotion> => {
  const response = await api.post<{ data: Promotion }>(API_ENDPOINTS.promotions.activate(id))
  return response.data.data
}

export const deactivatePromotion = async (id: string): Promise<Promotion> => {
  const response = await api.post<{ data: Promotion }>(API_ENDPOINTS.promotions.deactivate(id))
  return response.data.data
}

export const getCampaigns = async (
  params?: QueryParams,
): Promise<PaginatedResponse<Campaign>> => {
  const response = await api.get<PaginatedResponse<Campaign>>(API_ENDPOINTS.campaigns.list, {
    params,
  })
  return response.data
}

export const getCampaignById = async (id: string): Promise<Campaign> => {
  const response = await api.get<{ data: Campaign }>(API_ENDPOINTS.campaigns.detail(id))
  return response.data.data
}

export const createCampaign = async (data: CampaignInput): Promise<Campaign> => {
  const response = await api.post<{ data: Campaign }>(API_ENDPOINTS.campaigns.create, data)
  return response.data.data
}

export const updateCampaign = async (
  id: string,
  data: Partial<CampaignInput>,
): Promise<Campaign> => {
  const response = await api.patch<{ data: Campaign }>(API_ENDPOINTS.campaigns.update(id), data)
  return response.data.data
}

export const setCampaignTargets = async (
  id: string,
  targets: Array<{ segmentId: string; promotionId?: string | null }>,
): Promise<Campaign> => {
  const response = await api.put<{ data: Campaign }>(API_ENDPOINTS.campaigns.targets(id), {
    targets,
  })
  return response.data.data
}

export const getSegments = async (
  params?: QueryParams,
): Promise<PaginatedResponse<AudienceSegment>> => {
  const response = await api.get<PaginatedResponse<AudienceSegment>>(API_ENDPOINTS.segments.list, {
    params,
  })
  return response.data
}

export const createSegment = async (data: SegmentInput): Promise<AudienceSegment> => {
  const response = await api.post<{ data: AudienceSegment }>(API_ENDPOINTS.segments.create, data)
  return response.data.data
}

export const updateSegment = async (
  id: string,
  data: Partial<SegmentInput>,
): Promise<AudienceSegment> => {
  const response = await api.patch<{ data: AudienceSegment }>(
    API_ENDPOINTS.segments.update(id),
    data,
  )
  return response.data.data
}

export const deleteSegment = async (id: string): Promise<void> => {
  await api.delete(API_ENDPOINTS.segments.delete(id))
}

export const getCouponBatches = async (
  params?: QueryParams,
): Promise<PaginatedResponse<CouponBatch>> => {
  const response = await api.get<PaginatedResponse<CouponBatch>>(
    API_ENDPOINTS.couponBatches.list,
    { params },
  )
  return response.data
}

export const createCouponBatch = async (data: CouponBatchInput): Promise<CouponBatch> => {
  const response = await api.post<{ data: CouponBatch }>(API_ENDPOINTS.couponBatches.create, data)
  return response.data.data
}

export const activateCouponBatch = async (id: string): Promise<CouponBatch> => {
  const response = await api.post<{ data: CouponBatch }>(API_ENDPOINTS.couponBatches.activate(id))
  return response.data.data
}

export const deactivateCouponBatch = async (id: string): Promise<CouponBatch> => {
  const response = await api.post<{ data: CouponBatch }>(
    API_ENDPOINTS.couponBatches.deactivate(id),
  )
  return response.data.data
}

export const getCoupons = async (
  params?: QueryParams,
): Promise<PaginatedResponse<Coupon>> => {
  const response = await api.get<PaginatedResponse<Coupon>>(API_ENDPOINTS.coupons.list, { params })
  return response.data
}

export const getBanners = async (
  params?: QueryParams,
): Promise<PaginatedResponse<PromoBanner>> => {
  const response = await api.get<PaginatedResponse<PromoBanner>>(API_ENDPOINTS.promoBanners.list, {
    params,
  })
  return response.data
}

export const createBanner = async (data: BannerInput): Promise<PromoBanner> => {
  const response = await api.post<{ data: PromoBanner }>(API_ENDPOINTS.promoBanners.create, data)
  return response.data.data
}

export const updateBanner = async (
  id: string,
  data: Partial<BannerInput>,
): Promise<PromoBanner> => {
  const response = await api.patch<{ data: PromoBanner }>(
    API_ENDPOINTS.promoBanners.update(id),
    data,
  )
  return response.data.data
}

export const activateBanner = async (id: string): Promise<PromoBanner> => {
  const response = await api.post<{ data: PromoBanner }>(API_ENDPOINTS.promoBanners.activate(id))
  return response.data.data
}

export const deactivateBanner = async (id: string): Promise<PromoBanner> => {
  const response = await api.post<{ data: PromoBanner }>(API_ENDPOINTS.promoBanners.deactivate(id))
  return response.data.data
}

export const deleteBanner = async (id: string): Promise<void> => {
  await api.delete(API_ENDPOINTS.promoBanners.delete(id))
}

export interface CityOption {
  id: string
  code: string
  name: string
  state: string | null
  isActive: boolean
}

export const getCities = async (): Promise<CityOption[]> => {
  const response = await api.get<{ data: CityOption[] }>(API_ENDPOINTS.cities.list)
  return response.data.data
}

export const getReportOverview = async (): Promise<ReportOverview> => {
  const response = await api.get<{ data: ReportOverview }>(API_ENDPOINTS.promotions.reportOverview)
  return response.data.data
}
