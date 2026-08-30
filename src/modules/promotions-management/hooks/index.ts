import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryParams } from '@/shared/types'
import type {
  BannerInput,
  CampaignInput,
  CouponBatchInput,
  PromotionInput,
  SegmentInput,
} from '../types'
import { PromotionsManagementService } from '../services'

const QK = {
  promotions: (params?: QueryParams) => ['promotions-management', 'promotions', params],
  promotion: (id: string) => ['promotions-management', 'promotion', id],
  campaigns: (params?: QueryParams) => ['promotions-management', 'campaigns', params],
  segments: (params?: QueryParams) => ['promotions-management', 'segments', params],
  batches: (params?: QueryParams) => ['promotions-management', 'batches', params],
  coupons: (params?: QueryParams) => ['promotions-management', 'coupons', params],
  banners: (params?: QueryParams) => ['promotions-management', 'banners', params],
  reports: () => ['promotions-management', 'reports'],
}

export const usePromotions = (params?: QueryParams) =>
  useQuery({
    queryKey: QK.promotions(params),
    queryFn: () => PromotionsManagementService.getPromotions(params),
  })

export const usePromotion = (id: string) =>
  useQuery({
    queryKey: QK.promotion(id),
    queryFn: () => PromotionsManagementService.getPromotionById(id),
    enabled: !!id,
  })

export const useCreatePromotion = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: PromotionInput) => PromotionsManagementService.createPromotion(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions-management', 'promotions'] }),
  })
}

export const useUpdatePromotion = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<PromotionInput> }) =>
      PromotionsManagementService.updatePromotion(id, updates),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['promotions-management', 'promotions'] })
      qc.invalidateQueries({ queryKey: QK.promotion(id) })
    },
  })
}

export const useActivatePromotion = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => PromotionsManagementService.activatePromotion(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions-management', 'promotions'] }),
  })
}

export const useDeactivatePromotion = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => PromotionsManagementService.deactivatePromotion(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions-management', 'promotions'] }),
  })
}

export const useCampaigns = (params?: QueryParams) =>
  useQuery({
    queryKey: QK.campaigns(params),
    queryFn: () => PromotionsManagementService.getCampaigns(params),
  })

export const useCreateCampaign = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CampaignInput) => PromotionsManagementService.createCampaign(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions-management', 'campaigns'] }),
  })
}

export const useUpdateCampaign = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CampaignInput> }) =>
      PromotionsManagementService.updateCampaign(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions-management', 'campaigns'] }),
  })
}

export const useSetCampaignTargets = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      targets,
    }: {
      id: string
      targets: Array<{ segmentId: string; promotionId?: string | null }>
    }) => PromotionsManagementService.setCampaignTargets(id, targets),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions-management', 'campaigns'] }),
  })
}

export const useSegments = (params?: QueryParams) =>
  useQuery({
    queryKey: QK.segments(params),
    queryFn: () => PromotionsManagementService.getSegments(params),
  })

export const useCreateSegment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SegmentInput) => PromotionsManagementService.createSegment(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions-management', 'segments'] }),
  })
}

export const useUpdateSegment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<SegmentInput> }) =>
      PromotionsManagementService.updateSegment(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions-management', 'segments'] }),
  })
}

export const useDeleteSegment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => PromotionsManagementService.deleteSegment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions-management', 'segments'] }),
  })
}

export const useCouponBatches = (params?: QueryParams) =>
  useQuery({
    queryKey: QK.batches(params),
    queryFn: () => PromotionsManagementService.getCouponBatches(params),
  })

export const useCreateCouponBatch = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CouponBatchInput) => PromotionsManagementService.createCouponBatch(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions-management', 'batches'] }),
  })
}

export const useActivateCouponBatch = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => PromotionsManagementService.activateCouponBatch(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions-management', 'batches'] }),
  })
}

export const useDeactivateCouponBatch = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => PromotionsManagementService.deactivateCouponBatch(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions-management', 'batches'] }),
  })
}

export const useCoupons = (params?: QueryParams) =>
  useQuery({
    queryKey: QK.coupons(params),
    queryFn: () => PromotionsManagementService.getCoupons(params),
    enabled: Boolean(params?.batchId),
  })

export const useBanners = (params?: QueryParams) =>
  useQuery({
    queryKey: QK.banners(params),
    queryFn: () => PromotionsManagementService.getBanners(params),
  })

export const useCreateBanner = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: BannerInput) => PromotionsManagementService.createBanner(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions-management', 'banners'] }),
  })
}

export const useUpdateBanner = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<BannerInput> }) =>
      PromotionsManagementService.updateBanner(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions-management', 'banners'] }),
  })
}

export const useActivateBanner = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => PromotionsManagementService.activateBanner(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions-management', 'banners'] }),
  })
}

export const useDeactivateBanner = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => PromotionsManagementService.deactivateBanner(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions-management', 'banners'] }),
  })
}

export const useDeleteBanner = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => PromotionsManagementService.deleteBanner(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions-management', 'banners'] }),
  })
}

export const useCities = () =>
  useQuery({
    queryKey: ['promotions-management', 'cities'],
    queryFn: () => PromotionsManagementService.getCities(),
  })

export const usePromoReportOverview = () =>
  useQuery({
    queryKey: QK.reports(),
    queryFn: () => PromotionsManagementService.getReportOverview(),
  })
