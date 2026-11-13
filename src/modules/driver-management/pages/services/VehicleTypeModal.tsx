import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Modal } from '@/shared/components/ui/Modal'
import { Button } from '@/shared/components/ui/Button'
import { api, API_ENDPOINTS } from '@/infrastructure/api'
import { uploadFile } from '@/shared/services/file-upload.service'
import { useToast } from '@/shared/context/toast'
import { APP_CONFIG } from '@/app/config'
import { cn } from '@/shared/utils'
import {
  Car,
  Bike,
  Snowflake,
  Wind,
  Plus,
  Minus,
  Upload,
  Link2,
  Check,
  AlertCircle,
  Loader2,
  Trash2,
  Sparkles,
  Users,
  Navigation,
  Tag,
  Layers,
  Compass,
  ChevronDown,
} from 'lucide-react'

export interface VehicleTypeFormData {
  id?: string
  code: string
  name: string
  category: string
  hasAc: boolean
  badge: string
  description?: string
  imageUrl?: string
  imageFileId?: string
  icon: string
  passengerCapacity: number
  luggageCapacity?: number
  displayOrder: number
  isActive: boolean
}

interface VehicleTypeModalProps {
  isOpen: boolean
  onClose: () => void
  vehicleType?: VehicleTypeFormData | null
  servicesCount?: number
  existingCodes?: string[]
  onSuccess: () => void
}

type RideTypeTab = 'ac' | 'non_ac' | 'other'
type VehicleModelChoice = 'cab-mini' | 'cab-economy' | 'cab-premium' | 'cab-xl' | 'auto' | 'bike'
type ImageSourceMode = 'upload' | 'url'

interface VehicleModelConfig {
  key: VehicleModelChoice
  label: string
  defaultName: string
  seats: number
  category: string
  icon: string
}

const AC_MODELS: VehicleModelConfig[] = [
  { key: 'cab-mini', label: 'Cab Mini', defaultName: 'Cab Mini', seats: 4, category: 'car', icon: 'cab-mini' },
  { key: 'cab-economy', label: 'Cab Economy', defaultName: 'Cab Economy', seats: 4, category: 'car', icon: 'cab-economy' },
  { key: 'cab-premium', label: 'Cab Premium', defaultName: 'Cab Premium', seats: 4, category: 'car', icon: 'cab-premium' },
  { key: 'cab-xl', label: 'Cab XL', defaultName: 'Cab XL', seats: 6, category: 'car', icon: 'cab-xl' },
]

const NON_AC_MODELS: VehicleModelConfig[] = [
  { key: 'cab-mini', label: 'Cab Mini', defaultName: 'Cab Mini', seats: 4, category: 'car', icon: 'cab-mini' },
  { key: 'cab-economy', label: 'Cab Economy', defaultName: 'Cab Economy', seats: 4, category: 'car', icon: 'cab-economy' },
]

const OTHER_MODELS: VehicleModelConfig[] = [
  { key: 'auto', label: 'Auto Rickshaw', defaultName: 'Auto', seats: 3, category: 'auto', icon: 'auto' },
  { key: 'bike', label: 'Motorcycle / Bike', defaultName: 'Bike', seats: 1, category: 'bike', icon: 'bike' },
]

const INITIAL_FORM: VehicleTypeFormData = {
  code: '',
  name: 'Cab Mini',
  category: 'car',
  hasAc: true,
  badge: 'AC',
  description: '',
  imageUrl: '',
  imageFileId: '',
  icon: '',
  passengerCapacity: 4,
  luggageCapacity: 2,
  displayOrder: 1,
  isActive: true,
}

export const VehicleTypeModal: React.FC<VehicleTypeModalProps> = ({
  isOpen,
  onClose,
  vehicleType,
  servicesCount = 8,
  existingCodes = [],
  onSuccess,
}) => {
  const toast = useToast()
  const [formData, setFormData] = useState<VehicleTypeFormData>(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rideType, setRideType] = useState<RideTypeTab>('ac')
  const [selectedModel, setSelectedModel] = useState<VehicleModelChoice>('cab-mini')
  const [imageMode, setImageMode] = useState<ImageSourceMode>('upload')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mapIconMode, setMapIconMode] = useState<ImageSourceMode>('upload')
  const [uploadingMapIcon, setUploadingMapIcon] = useState(false)
  const mapFileInputRef = useRef<HTMLInputElement>(null)

  const isEditing = Boolean(vehicleType?.id)

  useEffect(() => {
    if (vehicleType) {
      const code = (vehicleType.code || '').toUpperCase()
      const cat = (vehicleType.category || '').toLowerCase()
      const icon = (vehicleType.icon || '').toLowerCase()
      const name = (vehicleType.name || '').toLowerCase()

      let resolvedRideType: RideTypeTab = 'ac'
      let resolvedModel: VehicleModelChoice = 'cab-mini'

      if (code.includes('BIKE') || cat === 'bike' || icon === 'bike' || name.includes('bike')) {
        resolvedRideType = 'other'
        resolvedModel = 'bike'
      } else if (code.includes('AUTO') || cat === 'auto' || icon === 'auto' || name.includes('auto')) {
        resolvedRideType = 'other'
        resolvedModel = 'auto'
      } else if (!vehicleType.hasAc || vehicleType.badge === 'NON AC' || code.includes('NON_AC')) {
        resolvedRideType = 'non_ac'
        resolvedModel =
          code.includes('ECONOMY') || icon.includes('economy') || name.includes('economy')
            ? 'cab-economy'
            : 'cab-mini'
      } else {
        resolvedRideType = 'ac'
        if (code.includes('XL') || icon.includes('xl') || name.includes('xl')) {
          resolvedModel = 'cab-xl'
        } else if (code.includes('PREMIUM') || icon.includes('premium') || name.includes('premium')) {
          resolvedModel = 'cab-premium'
        } else if (code.includes('ECONOMY') || icon.includes('economy') || name.includes('economy')) {
          resolvedModel = 'cab-economy'
        } else {
          resolvedModel = 'cab-mini'
        }
      }

      setRideType(resolvedRideType)
      setSelectedModel(resolvedModel)

      // Set image mode
      if (
        vehicleType.imageUrl &&
        !vehicleType.imageUrl.includes('/files/') &&
        vehicleType.imageUrl.startsWith('http')
      ) {
        setImageMode('url')
      } else {
        setImageMode('upload')
      }

      const isOther = resolvedRideType === 'other'
      const isBike = resolvedModel === 'bike'
      const isAuto = resolvedModel === 'auto'

      const existingBadge =
        vehicleType.badge !== undefined && vehicleType.badge !== null
          ? vehicleType.badge
          : resolvedRideType === 'ac'
          ? 'AC'
          : resolvedRideType === 'non_ac'
          ? 'NON AC'
          : ''

      setFormData({
        ...INITIAL_FORM,
        ...vehicleType,
        name: vehicleType.name || (isBike ? 'Bike' : isAuto ? 'Auto' : 'Cab Mini'),
        category: isOther ? (isBike ? 'bike' : 'auto') : 'car',
        hasAc: resolvedRideType === 'ac',
        badge: existingBadge,
        imageUrl: vehicleType.imageUrl || '',
        imageFileId: vehicleType.imageFileId || '',
        icon: vehicleType.icon || resolvedModel,
        passengerCapacity:
          vehicleType.passengerCapacity ??
          (isOther ? (isBike ? 1 : 3) : resolvedModel === 'cab-xl' ? 6 : 4),
        luggageCapacity:
          vehicleType.luggageCapacity ??
          (isOther ? (isBike ? 0 : 1) : resolvedModel === 'cab-xl' ? 4 : 2),
      })
    } else {
      setRideType('ac')
      setSelectedModel('cab-mini')
      setImageMode('upload')
      setFormData({
        ...INITIAL_FORM,
        name: 'Cab Mini',
        icon: '',
        badge: 'AC',
        hasAc: true,
        category: 'car',
        passengerCapacity: 4,
        luggageCapacity: 2,
        displayOrder: servicesCount + 1,
      })
    }
    setError(null)
  }, [vehicleType, isOpen, servicesCount])

  const handleChange = <K extends keyof VehicleTypeFormData>(
    field: K,
    value: VehicleTypeFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // ───── 1. HANDLE RIDE CATEGORY CHANGE (AC / NON-AC / OTHER) ─────
  const handleSelectRideType = (type: RideTypeTab) => {
    setRideType(type)
    let nextModel: VehicleModelChoice = 'cab-mini'
    if (type === 'other') {
      nextModel = 'auto'
    }

    applyVehicleModel(type, nextModel)
  }

  // ───── 2. HANDLE VEHICLE MODEL SELECTION ─────
  const handleSelectVehicleModel = (model: VehicleModelChoice) => {
    applyVehicleModel(rideType, model)
  }

  const applyVehicleModel = (categoryTab: RideTypeTab, model: VehicleModelChoice) => {
    setSelectedModel(model)

    let modelConfig: VehicleModelConfig | undefined
    if (categoryTab === 'ac') {
      modelConfig = AC_MODELS.find((m) => m.key === model) || AC_MODELS[0]
    } else if (categoryTab === 'non_ac') {
      modelConfig = NON_AC_MODELS.find((m) => m.key === model) || NON_AC_MODELS[0]
    } else {
      modelConfig = OTHER_MODELS.find((m) => m.key === model) || OTHER_MODELS[0]
    }

    const isAc = categoryTab === 'ac'
    const isNonAc = categoryTab === 'non_ac'
    const isOther = categoryTab === 'other'
    const isBike = model === 'bike'
    const isAuto = model === 'auto'

    const defaultBadgeText = isAc ? 'AC' : isNonAc ? 'NON AC' : ''
    const defaultName = modelConfig.defaultName
    const defaultSeats = modelConfig.seats
    const defaultLuggage = isBike ? 0 : isAuto ? 1 : model === 'cab-xl' ? 4 : 2

    setFormData((prev) => {
      // If previous badge was one of standard AC/NON AC or empty, auto-update it with category default
      // Otherwise preserve any custom badge admin typed (e.g. POPULAR, FASTEST, EV)
      const shouldUpdateBadge =
        !prev.badge || prev.badge === 'AC' || prev.badge === 'NON AC'

      return {
        ...prev,
        name: defaultName,
        category: isOther ? (isBike ? 'bike' : 'auto') : 'car',
        hasAc: isAc,
        badge: shouldUpdateBadge ? defaultBadgeText : prev.badge,
        icon:
          prev.icon && (prev.icon.startsWith('/') || prev.icon.startsWith('http'))
            ? prev.icon
            : modelConfig.icon,
        passengerCapacity: defaultSeats,
        luggageCapacity: defaultLuggage,
      }
    })
  }

  // ───── 3. FILE UPLOAD HANDLER ─────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setUploading(true)
    setError(null)
    try {
      const result = await uploadFile(file, 'VEHICLE_IMAGE')
      handleChange('imageFileId', result.fileId)
      // Direct S3 URL so mobile apps download directly without depending on dev server origin
      handleChange('imageUrl', result.readUrl || `/api/v1/vehicle-types/images/${result.fileId}`)
      toast.success('Image Uploaded', 'Vehicle image uploaded and ready.')
    } catch (err: any) {
      const msg = err?.message || 'Failed to upload image.'
      setError(msg)
      toast.error('Upload Failed', msg)
    } finally {
      setUploading(false)
    }
  }

  const handleClearImage = () => {
    handleChange('imageFileId', '')
    handleChange('imageUrl', '')
  }

  // ───── 3b. MAP TOP-VIEW ICON UPLOAD HANDLER ─────
  const handleMapIconFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setUploadingMapIcon(true)
    setError(null)
    try {
      const result = await uploadFile(file, 'VEHICLE_IMAGE')
      if (result.fileId) {
        // Always store permanent backend proxy path (avoids S3 presigned URL expiration)
        handleChange('icon', `/api/v1/vehicle-types/images/${result.fileId}`)
      }
      toast.success('Map Icon Uploaded', 'Top-view marker icon ready for live maps.')
    } catch (err: any) {
      const msg = err?.message || 'Failed to upload map icon.'
      setError(msg)
      toast.error('Upload Failed', msg)
    } finally {
      setUploadingMapIcon(false)
    }
  }

  const handleClearMapIcon = () => {
    handleChange('icon', '')
  }

  // ───── 4. SUBMIT HANDLER ─────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim()) {
      setError('Please provide a service display name (e.g. Cab Mini, Auto, Bike)')
      return
    }

    const seats = Number(formData.passengerCapacity) || 1
    if (seats < 1 || seats > 20) {
      setError('Seat capacity must be between 1 and 20 passengers.')
      return
    }

    setSubmitting(true)
    try {
      // Auto-generate uppercase service code if new
      let resolvedCode = formData.code.trim().toUpperCase()
      if (!resolvedCode) {
        let base = formData.name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_')
        if (!base) {
          base = rideType === 'other' ? selectedModel.toUpperCase() : 'SERVICE'
        }

        if (rideType === 'ac' && !base.endsWith('_AC')) {
          resolvedCode = `${base}_AC`
        } else if (rideType === 'non_ac' && !base.endsWith('_NON_AC')) {
          resolvedCode = `${base}_NON_AC`
        } else {
          resolvedCode = base
        }

        // Guarantee uniqueness against existing codes
        if (existingCodes.includes(resolvedCode)) {
          let counter = 2
          while (existingCodes.includes(`${resolvedCode}_${counter}`)) {
            counter++
          }
          resolvedCode = `${resolvedCode}_${counter}`
        }
      }

      // Explicit badge from form input (trimmed, or null if empty)
      const cleanBadge = formData.badge?.trim() ? formData.badge.trim() : null

      const isBike = rideType === 'other' ? selectedModel === 'bike' : formData.category === 'bike'
      const isAuto = rideType === 'other' ? selectedModel === 'auto' : formData.category === 'auto'

      const basePayload = {
        name: formData.name.trim(),
        category: isBike ? 'bike' : isAuto ? 'auto' : 'car',
        hasAc: rideType === 'ac',
        badge: cleanBadge,
        description: formData.description?.trim() || null,
        imageUrl: formData.imageUrl?.trim() || null,
        imageFileId: formData.imageFileId?.trim() || null,
        icon: formData.icon || selectedModel || (rideType === 'other' ? 'auto' : 'cab-mini'),
        passengerCapacity: seats,
        luggageCapacity: isBike ? 0 : isAuto ? 1 : seats >= 6 ? 4 : 2,
        displayOrder: Number(formData.displayOrder) || servicesCount + 1,
        isActive: formData.isActive,
      }

      if (isEditing && vehicleType?.id) {
        await api.put(API_ENDPOINTS.vehicleTypes.update(vehicleType.id), basePayload)
        toast.success('Service Updated', `"${formData.name}" changes saved successfully.`)
      } else {
        await api.post(API_ENDPOINTS.vehicleTypes.create, {
          ...basePayload,
          code: resolvedCode,
        })
        toast.success('Service Created', `"${formData.name}" created successfully.`)
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.details?.[0]?.message ||
        err?.message ||
        'Failed to save service.'
      setError(errorMsg)
      toast.error('Save Error', errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  // ───── 5. RESOLVE PREVIEW IMAGE ─────
  const previewIconSrc = useMemo(() => {
    if (formData.imageUrl) {
      if (formData.imageUrl.startsWith('http') || formData.imageUrl.startsWith('data:')) {
        return formData.imageUrl
      }
      const apiHost = APP_CONFIG.api.baseUrl.replace(/\/api\/v1\/?$/, '')
      return `${apiHost}${formData.imageUrl.startsWith('/') ? '' : '/'}${formData.imageUrl}`
    }
    return null
  }, [formData.imageUrl])

  // Check if formData.icon is a custom uploaded image or URL (not just a preset keyword like 'auto')
  const isCustomMapIcon = useMemo(() => {
    if (!formData.icon) return false
    const val = formData.icon.trim()
    return (
      val.startsWith('http://') ||
      val.startsWith('https://') ||
      val.startsWith('/') ||
      val.startsWith('data:') ||
      /^[0-9a-fA-F-]{36}$/.test(val)
    )
  }, [formData.icon])

  // Resolve preview for Map Top-View Icon
  const previewMapIconSrc = useMemo(() => {
    if (!isCustomMapIcon) return null
    const val = formData.icon.trim()
    if (val.startsWith('http') || val.startsWith('data:')) {
      return val
    }
    const clean = /^[0-9a-fA-F-]{36}$/.test(val)
      ? `/api/v1/vehicle-types/images/${val}`
      : val.startsWith('/') ? val : `/${val}`
    const apiHost = APP_CONFIG.api.baseUrl.replace(/\/api\/v1\/?$/, '')
    return `${apiHost}${clean}`
  }, [formData.icon, isCustomMapIcon])

  // Get active vehicle models list based on current ride tab
  const currentVehicleModels = useMemo(() => {
    if (rideType === 'ac') return AC_MODELS
    if (rideType === 'non_ac') return NON_AC_MODELS
    return OTHER_MODELS
  }, [rideType])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Fleet Service: ${formData.name || formData.code}` : 'Add New Fleet Service'}
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {formData.badge?.trim() ? (
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Tag className="w-3.5 h-3.5 text-[#1F2B6D] dark:text-blue-400" />
                Badge active:{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {formData.badge.trim()}
                </strong>
              </span>
            ) : (
              <span>No badge (standard plain card)</span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <Button variant="outline" size="md" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSubmit}
              loading={submitting}
              icon={isEditing ? undefined : <Plus className="w-4 h-4" />}
            >
              {isEditing ? 'Save Changes' : 'Create Service'}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5 py-2">
        {error && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* ───── EXACT FIGMA 2x4 LIVE PREVIEW CARD (PURE NAVY TEXT AS DESIGNED) ───── */}
        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-900/80 dark:via-blue-950/20 dark:to-slate-900/80 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Customer App Card Preview</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100/80 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold">
                Live 74×61 Figma Replica
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {rideType === 'ac'
                ? 'AC Ride (Air Conditioned)'
                : rideType === 'non_ac'
                ? 'Non-AC Ride (Economical)'
                : `Other: ${selectedModel === 'bike' ? 'Motorcycle / Bike' : 'Auto Rickshaw'}`}
              {' • '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {formData.passengerCapacity} {formData.passengerCapacity === 1 ? 'seat' : 'seats'}
              </span>
              {formData.badge?.trim() ? (
                <>
                  {' • '}
                  <span className="font-bold text-[#1F2B6D] dark:text-blue-300">
                    Badge: {formData.badge.trim()}
                  </span>
                </>
              ) : null}
            </p>
            <p className="text-[10.5px] text-slate-400 dark:text-slate-500">
              Updates in real-time as you edit the service name, badge, and images below.
            </p>
          </div>

          {/* Exact Figma Spec Card: 74x61 Mask group, rounded-xl, #F4F6FB bg, #D4DAE9 border */}
          <div className="flex flex-col items-center w-[78px] shrink-0">
            <div className="relative w-[74px] h-[61px] rounded-xl border border-[#D4DAE9] dark:border-slate-700 bg-[#F4F6FB] dark:bg-slate-800 overflow-hidden flex items-center justify-center shadow-xs">
              {/* Plain Navy Text Badge (#233464, exactly as in Figma design) */}
              {formData.badge?.trim() ? (
                <span className="absolute top-1.5 right-2 font-semibold text-[8.5px] text-[#233464] dark:text-[#93C5FD] tracking-tight select-none z-10 leading-none">
                  {formData.badge.trim()}
                </span>
              ) : null}

              {previewIconSrc ? (
                <img
                  src={previewIconSrc}
                  alt={formData.name || 'Vehicle'}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  {formData.category === 'bike' ? (
                    <Bike className="w-6 h-6 stroke-[1.5]" />
                  ) : (
                    <Car className="w-6 h-6 stroke-[1.5]" />
                  )}
                  <span className="text-[8.5px] mt-0.5">No Image</span>
                </div>
              )}
            </div>

            <span className="mt-1.5 text-[11px] font-medium leading-none tracking-normal text-[#1E2756] dark:text-slate-100 text-center truncate w-full">
              {formData.name || 'Service Name'}
            </span>
          </div>
        </div>

        {/* ───── 1. RIDE CATEGORY TABS & VEHICLE MODEL PRESET DROPDOWN ───── */}
        <div className="p-5 bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#1F2B6D] dark:text-blue-400" />
              1. Ride Category & Vehicle Type *
            </label>
            <span className="text-[10.5px] text-slate-400 font-medium">
              Select category to prefill recommended specs
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* AC Ride */}
            <button
              type="button"
              onClick={() => handleSelectRideType('ac')}
              className={cn(
                'p-3.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5',
                rideType === 'ac'
                  ? 'border-[#1F2B6D] bg-[#1F2B6D]/5 text-[#1F2B6D] dark:border-blue-400 dark:bg-blue-950/40 dark:text-blue-300 font-bold shadow-xs ring-1 ring-[#1F2B6D]/20'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              )}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <Snowflake className="w-4 h-4 text-blue-500" />
                <span>AC Ride</span>
              </div>
              <span className="text-[10.5px] text-slate-400">Air Conditioned Cab</span>
            </button>

            {/* Non-AC Ride */}
            <button
              type="button"
              onClick={() => handleSelectRideType('non_ac')}
              className={cn(
                'p-3.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5',
                rideType === 'non_ac'
                  ? 'border-[#1F2B6D] bg-[#1F2B6D]/5 text-[#1F2B6D] dark:border-blue-400 dark:bg-blue-950/40 dark:text-blue-300 font-bold shadow-xs ring-1 ring-[#1F2B6D]/20'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              )}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <Wind className="w-4 h-4 text-slate-500" />
                <span>Non-AC Ride</span>
              </div>
              <span className="text-[10.5px] text-slate-400">Economical Cab</span>
            </button>

            {/* Other (Auto / Bike) */}
            <button
              type="button"
              onClick={() => handleSelectRideType('other')}
              className={cn(
                'p-3.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5',
                rideType === 'other'
                  ? 'border-[#1F2B6D] bg-[#1F2B6D]/5 text-[#1F2B6D] dark:border-blue-400 dark:bg-blue-950/40 dark:text-blue-300 font-bold shadow-xs ring-1 ring-[#1F2B6D]/20'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              )}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <Bike className="w-4 h-4 text-emerald-600" />
                <span>Other Ride</span>
              </div>
              <span className="text-[10.5px] text-slate-400">Auto & Bike</span>
            </button>
          </div>

          {/* ───── MODEL TEMPLATE DROPDOWN (CLEAN 1-ROW REPLACEMENT FOR WRAPPED BUTTONS) ───── */}
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between px-0.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-[#1F2B6D] dark:text-blue-400" />
                Select Model Preset Template:
              </label>
              <span className="text-[10.5px] text-slate-400 font-medium">
                Auto-configures name, seats, and badge
              </span>
            </div>

            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => handleSelectVehicleModel(e.target.value as VehicleModelChoice)}
                className="w-full h-11 pl-3.5 pr-10 text-sm font-semibold text-slate-800 dark:text-slate-100 bg-slate-50/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl appearance-none cursor-pointer focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] transition"
              >
                {currentVehicleModels.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label} — {item.seats} {item.seats === 1 ? 'seat' : 'seats'} ({rideType === 'ac' ? 'Air Conditioned' : rideType === 'non_ac' ? 'Economical' : item.category === 'bike' ? 'Two-Wheeler' : 'Auto Rickshaw'})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* ───── 2. SERVICE DETAILS & BADGE CONFIGURATION (SPACIOUS EXECUTIVE 2x2) ───── */}
        <div className="p-5 bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#1F2B6D] dark:text-blue-400" />
              2. Service Details & Card Badge *
            </label>
            <span className="text-[10.5px] text-slate-400 font-medium">
              Visible on home screen cards & booking options
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Display Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Display Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g. Auto, Cab Mini, Bike"
                className="w-full h-11 px-3.5 text-sm font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] transition"
              />
              <span className="text-[10.5px] text-slate-400 mt-1 block">
                Shown to riders under the card and in the booking selector
              </span>
            </div>

            {/* 2. Service Code */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Service Code
                </label>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                  Auto-generated if blank
                </span>
              </div>
              <input
                type="text"
                value={formData.code}
                onChange={(e) =>
                  handleChange('code', e.target.value.toUpperCase().replace(/\s+/g, '_'))
                }
                placeholder="e.g. CAB_MINI_AC"
                className="w-full h-11 px-3.5 text-xs font-mono uppercase tracking-wider text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] transition"
              />
              <span className="text-[10.5px] text-slate-400 mt-1 block">
                Unique system identifier used for pricing, dispatch & analytics
              </span>
            </div>

            {/* 3. Card Badge Dropdown (Full Width, zero clipping) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Card Badge (Top-Right)
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  {formData.badge?.trim() ? `Active: "${formData.badge.trim()}"` : 'Optional'}
                </span>
              </div>

              <div className="relative">
                <select
                  value={
                    ['', 'NON AC', 'AC', 'POPULAR', 'FASTEST', 'EV', 'ECO'].includes(
                      (formData.badge || '').trim().toUpperCase()
                    )
                      ? (formData.badge || '').trim().toUpperCase()
                      : 'CUSTOM'
                  }
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === 'CUSTOM') {
                      if (
                        !formData.badge ||
                        ['', 'NON AC', 'AC', 'POPULAR', 'FASTEST', 'EV', 'ECO'].includes(
                          formData.badge.trim().toUpperCase()
                        )
                      ) {
                        handleChange('badge', 'SPECIAL')
                      }
                    } else {
                      handleChange('badge', val)
                    }
                  }}
                  className="w-full h-11 pl-3.5 pr-10 text-sm font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl appearance-none cursor-pointer focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] transition"
                >
                  <option value="">None (Plain Card — No Badge)</option>
                  <option value="NON AC">NON AC (Economical Fare)</option>
                  <option value="AC">AC (Air Conditioned)</option>
                  <option value="POPULAR">POPULAR (Trending Choice)</option>
                  <option value="FASTEST">FASTEST (Quick Dispatch)</option>
                  <option value="EV">EV (Electric Vehicle)</option>
                  <option value="ECO">ECO (Budget Friendly)</option>
                  <option value="CUSTOM">Custom Badge...</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>

              {/* Dedicated Custom Badge Field (Revealed when Custom selected) */}
              {(!['', 'NON AC', 'AC', 'POPULAR', 'FASTEST', 'EV', 'ECO'].includes(
                (formData.badge || '').trim().toUpperCase()
              ) || formData.badge === 'CUSTOM') && (
                <div className="relative mt-2">
                  <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.badge === 'CUSTOM' ? '' : formData.badge}
                    onChange={(e) => handleChange('badge', e.target.value.toUpperCase())}
                    placeholder="Type custom badge (e.g. PREMIUM, AIRPORT, VIP)"
                    maxLength={20}
                    className="w-full h-10 pl-9 pr-14 text-xs font-bold tracking-wide uppercase bg-white dark:bg-slate-900 border border-blue-400 dark:border-blue-600 rounded-xl focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D]"
                  />
                  {formData.badge && (
                    <button
                      type="button"
                      onClick={() => handleChange('badge', '')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}

              <span className="text-[10.5px] text-slate-400 mt-1 block">
                Select preset badge or choose Custom to type your own text
              </span>
            </div>

            {/* 4. Seat Capacity Dropdown (Full Width, zero clipping) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Seat Capacity *
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  {formData.passengerCapacity} {formData.passengerCapacity === 1 ? 'passenger' : 'passengers'}
                </span>
              </div>

              <div className="relative">
                <select
                  value={
                    [1, 2, 3, 4, 5, 6, 7].includes(formData.passengerCapacity)
                      ? formData.passengerCapacity
                      : 'custom'
                  }
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === 'custom') {
                      if ([1, 2, 3, 4, 5, 6, 7].includes(formData.passengerCapacity)) {
                        handleChange('passengerCapacity', 8)
                      }
                    } else {
                      handleChange('passengerCapacity', Number(val))
                    }
                  }}
                  className="w-full h-11 pl-3.5 pr-10 text-sm font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl appearance-none cursor-pointer focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] transition"
                >
                  <option value={1}>1 Passenger Seat (Bike / Two-Wheeler)</option>
                  <option value={2}>2 Passenger Seats (Mini Coupe)</option>
                  <option value={3}>3 Passenger Seats (Auto Rickshaw)</option>
                  <option value={4}>4 Passenger Seats (Standard Cab / Sedan)</option>
                  <option value={5}>5 Passenger Seats (Compact SUV)</option>
                  <option value={6}>6 Passenger Seats (Cab XL / 6-Seater SUV)</option>
                  <option value={7}>7 Passenger Seats (Large MUV / Innova / Ertiga)</option>
                  <option value="custom">Custom Seat Capacity...</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>

              {/* Dedicated Custom Stepper (Revealed when Custom / >7 seats) */}
              {(![1, 2, 3, 4, 5, 6, 7].includes(formData.passengerCapacity) ||
                formData.passengerCapacity > 7) && (
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleChange(
                        'passengerCapacity',
                        Math.max(1, (formData.passengerCapacity || 1) - 1)
                      )
                    }
                    disabled={formData.passengerCapacity <= 1}
                    className="w-10 h-10 rounded-xl border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-30 disabled:pointer-events-none shrink-0"
                    title="Decrease seats"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="relative flex-1">
                    <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="number"
                      min={1}
                      max={50}
                      required
                      value={formData.passengerCapacity}
                      onChange={(e) =>
                        handleChange(
                          'passengerCapacity',
                          Math.max(1, Math.min(50, parseInt(e.target.value) || 1))
                        )
                      }
                      className="w-full h-10 pl-9 pr-3 text-sm font-bold text-center bg-white dark:bg-slate-900 border border-blue-400 dark:border-blue-600 rounded-xl focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleChange(
                        'passengerCapacity',
                        Math.min(50, (formData.passengerCapacity || 1) + 1)
                      )
                    }
                    disabled={formData.passengerCapacity >= 50}
                    className="w-10 h-10 rounded-xl border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-30 disabled:pointer-events-none shrink-0"
                    title="Increase seats"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}

              <span className="text-[10.5px] text-slate-400 mt-1 block">
                Select standard vehicle seating or customize passenger count
              </span>
            </div>
          </div>
        </div>

        {/* ───── 3. VEHICLE CARD IMAGE (FIGMA 74x61 CONTAINER) ───── */}
        <div className="p-5 bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-[#1F2B6D] dark:text-blue-400" />
              3. Customer App Card Image
            </label>

            {/* Mode Switcher Tabs */}
            <div className="flex bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setImageMode('upload')}
                className={cn(
                  'px-3 py-1 rounded-md transition flex items-center gap-1.5',
                  imageMode === 'upload'
                    ? 'bg-white dark:bg-slate-900 text-[#1F2B6D] dark:text-blue-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                )}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setImageMode('url')}
                className={cn(
                  'px-3 py-1 rounded-md transition flex items-center gap-1.5',
                  imageMode === 'url'
                    ? 'bg-white dark:bg-slate-900 text-[#1F2B6D] dark:text-blue-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                )}
              >
                <Link2 className="w-3.5 h-3.5" />
                Direct URL
              </button>
            </div>
          </div>

          {/* TAB 1: UPLOAD FILE */}
          {imageMode === 'upload' && (
            <div className="pt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />

              {formData.imageFileId || formData.imageUrl ? (
                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-10 rounded-lg border border-[#D4DAE9] dark:border-slate-700 bg-[#F4F6FB] dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                      <img
                        src={previewIconSrc}
                        alt="Uploaded preview"
                        className="w-full h-full object-contain p-0.5"
                      />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Custom Image Attached
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                        <Check className="w-3 h-3" /> Ready for customer app display
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition"
                    >
                      {uploading ? 'Uploading...' : 'Replace'}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#1F2B6D] dark:hover:border-blue-400 rounded-xl cursor-pointer transition text-center"
                >
                  {uploading ? (
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#1F2B6D]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading to secure storage...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-slate-400 mb-1.5" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        Click to upload vehicle image
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1">
                        PNG, JPG, or WebP (transparent background recommended for clean card integration)
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DIRECT IMAGE URL */}
          {imageMode === 'url' && (
            <div className="pt-1 space-y-1.5">
              <input
                type="text"
                value={formData.imageUrl}
                onChange={(e) => {
                  const url = e.target.value
                  handleChange('imageUrl', url)
                  if (url && !url.includes('/files/')) {
                    handleChange('imageFileId', '')
                  }
                }}
                placeholder="https://images.your-cdn.com/vehicles/cab-mini.png"
                className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D]"
              />
              <span className="text-[10px] text-slate-400 block">
                Paste any cloud image URL. Card preview updates immediately above.
              </span>
            </div>
          )}
        </div>

        {/* ───── 4. MAP TOP-VIEW MARKER ICON (FOR LIVE TRACKING & NEARBY MAPS) ───── */}
        <div className="p-5 bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#1F2B6D] dark:text-blue-400" />
                  4. Live Map Top-View Marker Icon
                </label>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 font-semibold">
                  Optional
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                2D top-down view facing North (0°) with transparent background for live driver map tracking
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setMapIconMode('upload')}
                className={cn(
                  'px-3 py-1 rounded-md transition flex items-center gap-1.5',
                  mapIconMode === 'upload'
                    ? 'bg-white dark:bg-slate-900 text-[#1F2B6D] dark:text-blue-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                )}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload
              </button>
              <button
                type="button"
                onClick={() => setMapIconMode('url')}
                className={cn(
                  'px-3 py-1 rounded-md transition flex items-center gap-1.5',
                  mapIconMode === 'url'
                    ? 'bg-white dark:bg-slate-900 text-[#1F2B6D] dark:text-blue-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                )}
              >
                <Link2 className="w-3.5 h-3.5" />
                URL
              </button>
            </div>
          </div>

          {mapIconMode === 'upload' ? (
            <div className="pt-1">
              <input
                ref={mapFileInputRef}
                type="file"
                accept="image/png,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleMapIconFileChange}
              />

              {isCustomMapIcon ? (
                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-full border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/40 flex items-center justify-center p-1.5 shadow-2xs">
                      <img
                        src={previewMapIconSrc || ''}
                        alt="Map icon"
                        className="w-full h-full object-contain"
                      />
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#1F2B6D] text-white text-[8px] font-bold flex items-center justify-center shadow-xs" title="Facing North (0°)">
                        ▲
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Custom Map Marker Active
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                        <Check className="w-3 h-3" /> Rotates with live driver heading on Google Maps
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => mapFileInputRef.current?.click()}
                      disabled={uploadingMapIcon}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition"
                    >
                      {uploadingMapIcon ? 'Uploading...' : 'Replace'}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearMapIcon}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                      title="Clear custom map icon (uses built-in vector fallback)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => mapFileInputRef.current?.click()}
                  className={cn(
                    'flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-xl cursor-pointer transition text-center bg-white dark:bg-slate-900',
                    uploadingMapIcon
                      ? 'border-blue-300 bg-blue-50/50 dark:bg-blue-950/20'
                      : 'border-slate-300 dark:border-slate-700 hover:border-[#1F2B6D] dark:hover:border-blue-400'
                  )}
                >
                  {uploadingMapIcon ? (
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#1F2B6D] dark:text-blue-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading Map Icon...
                    </div>
                  ) : (
                    <>
                      <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 mb-1.5">
                        <Navigation className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Click to upload 2D Top-Down Map Marker
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1">
                        PNG, WebP or SVG with transparent background (128×128 recommended)
                      </span>
                      <span className="text-[9.5px] text-blue-600 dark:text-blue-400 mt-1.5 font-medium">
                        Leave empty to use built-in native {formData.category === 'bike' ? 'Bike' : formData.category === 'auto' ? 'Auto' : 'Cab'} vector glyph
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="pt-1 space-y-1.5">
              <input
                type="url"
                value={formData.icon || ''}
                onChange={(e) => handleChange('icon', e.target.value)}
                placeholder="https://your-domain.com/icons/auto-top-view.png"
                className="w-full px-3.5 py-2.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D]"
              />
              <span className="text-[10px] text-slate-400 block">
                Direct public URL to a top-down vehicle image with transparent background.
              </span>
            </div>
          )}
        </div>

        {/* ───── 5. ACTIVE IN APPS SWITCH ───── */}
        <div className="flex items-center justify-between p-5 bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div>
            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Active in Apps
            </h5>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
              When turned on, riders can see this service on the home screen and request bookings.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 shadow-2xs"></div>
          </label>
        </div>
      </form>
    </Modal>
  )
}

export default VehicleTypeModal