import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Modal } from '@/shared/components/ui/Modal'
import { Button } from '@/shared/components/ui/Button'
import { VEHICLE_PRESET_ICONS } from '@/assets/images/vehicles'
import { api, API_ENDPOINTS } from '@/infrastructure/api'
import { uploadFile } from '@/shared/services/file-upload.service'
import { useToast } from '@/shared/context/toast'
import { APP_CONFIG } from '@/app/config'
import { cn } from '@/shared/utils'
import {
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
type ImageSourceMode = 'preset' | 'upload' | 'url'

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
  icon: 'cab-mini',
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
  const [imageMode, setImageMode] = useState<ImageSourceMode>('preset')
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      if (vehicleType.imageFileId) {
        setImageMode('upload')
      } else if (
        vehicleType.imageUrl &&
        !vehicleType.imageUrl.includes('/files/') &&
        vehicleType.imageUrl.startsWith('http')
      ) {
        setImageMode('url')
      } else {
        setImageMode('preset')
      }

      const isOther = resolvedRideType === 'other'
      const isAuto = resolvedModel === 'auto'
      const isBike = resolvedModel === 'bike'

      setFormData({
        ...INITIAL_FORM,
        ...vehicleType,
        name: vehicleType.name || (isBike ? 'Bike' : isAuto ? 'Auto' : 'Cab Mini'),
        category: isOther ? (isBike ? 'bike' : 'auto') : 'car',
        hasAc: resolvedRideType === 'ac',
        badge: resolvedRideType === 'ac' ? 'AC' : resolvedRideType === 'non_ac' ? 'NON AC' : '',
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
      setImageMode('preset')
      setFormData({
        ...INITIAL_FORM,
        name: 'Cab Mini',
        icon: 'cab-mini',
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

    const badgeText = isAc ? 'AC' : isNonAc ? 'NON AC' : ''
    const defaultName = modelConfig.defaultName
    const defaultSeats = modelConfig.seats
    const defaultLuggage = isBike ? 0 : isAuto ? 1 : model === 'cab-xl' ? 4 : 2

    setFormData((prev) => ({
      ...prev,
      name: defaultName,
      category: isOther ? (isBike ? 'bike' : 'auto') : 'car',
      hasAc: isAc,
      badge: badgeText,
      icon: modelConfig.icon,
      passengerCapacity: defaultSeats,
      luggageCapacity: defaultLuggage,
    }))
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
      if (result.readUrl) {
        handleChange('imageUrl', result.readUrl)
      }
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

      const cleanBadge =
        rideType === 'ac' ? 'AC' : rideType === 'non_ac' ? 'NON AC' : null

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
    if (formData.icon && VEHICLE_PRESET_ICONS[formData.icon]) {
      return VEHICLE_PRESET_ICONS[formData.icon]
    }
    return VEHICLE_PRESET_ICONS['cab-mini']
  }, [formData.imageUrl, formData.icon])

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
      title={isEditing ? `Edit Service: ${formData.name || formData.code}` : 'Add New Fleet Service'}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
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
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ───── EXACT FIGMA 2x4 LIVE PREVIEW CARD (PURE NAVY TEXT AS DESIGNED) ───── */}
        <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Customer App Card Preview</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {rideType === 'ac'
                ? 'AC Ride (Air Conditioned)'
                : rideType === 'non_ac'
                ? 'Non-AC Ride (Economical)'
                : `Other: ${selectedModel === 'bike' ? 'Bike' : 'Auto Rickshaw'}`}
              {' • '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {formData.passengerCapacity} {formData.passengerCapacity === 1 ? 'seat' : 'seats'}
              </span>
            </p>
          </div>

          {/* Exact Figma Spec Card: 78x68, rounded-xl, #F4F6FB bg, #DDE3EA border */}
          <div className="flex flex-col items-center w-[82px] shrink-0">
            <div className="relative w-[78px] h-[68px] rounded-xl border border-[#DDE3EA] dark:border-slate-700 bg-[#F4F6FB] dark:bg-slate-800 overflow-hidden flex items-center justify-center shadow-xs">
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
                  onError={(e) => {
                    const target = e.currentTarget
                    target.src =
                      VEHICLE_PRESET_ICONS[formData.icon] || VEHICLE_PRESET_ICONS['cab-mini']
                  }}
                />
              ) : (
                <span className="text-[10px] text-slate-400">No Image</span>
              )}
            </div>

            <span className="mt-1 text-[10.5px] font-semibold text-[#1E2756] dark:text-slate-100 text-center truncate w-full">
              {formData.name || 'Service Name'}
            </span>
          </div>
        </div>

        {/* ───── 1. RIDE CATEGORY TABS (AC RIDE / NON-AC RIDE / OTHER) ───── */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Ride Category *
          </label>
          <div className="grid grid-cols-3 gap-2">
            {/* AC Ride */}
            <button
              type="button"
              onClick={() => handleSelectRideType('ac')}
              className={cn(
                'p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1',
                rideType === 'ac'
                  ? 'border-[#1F2B6D] bg-[#1F2B6D]/5 text-[#1F2B6D] dark:border-blue-400 dark:bg-blue-950/40 dark:text-blue-300 font-bold shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              )}
            >
              <div className="flex items-center gap-1 text-xs">
                <Snowflake className="w-3.5 h-3.5 text-blue-500" />
                <span>AC Ride</span>
              </div>
              <span className="text-[10px] text-slate-400">Air Conditioned Cab</span>
            </button>

            {/* Non-AC Ride */}
            <button
              type="button"
              onClick={() => handleSelectRideType('non_ac')}
              className={cn(
                'p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1',
                rideType === 'non_ac'
                  ? 'border-[#1F2B6D] bg-[#1F2B6D]/5 text-[#1F2B6D] dark:border-blue-400 dark:bg-blue-950/40 dark:text-blue-300 font-bold shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              )}
            >
              <div className="flex items-center gap-1 text-xs">
                <Wind className="w-3.5 h-3.5 text-slate-500" />
                <span>Non-AC Ride</span>
              </div>
              <span className="text-[10px] text-slate-400">Economical Cab</span>
            </button>

            {/* Other (Auto / Bike) */}
            <button
              type="button"
              onClick={() => handleSelectRideType('other')}
              className={cn(
                'p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1',
                rideType === 'other'
                  ? 'border-[#1F2B6D] bg-[#1F2B6D]/5 text-[#1F2B6D] dark:border-blue-400 dark:bg-blue-950/40 dark:text-blue-300 font-bold shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              )}
            >
              <div className="flex items-center gap-1 text-xs font-semibold">
                <span>Other Ride</span>
              </div>
              <span className="text-[10px] text-slate-400">Auto & Bike</span>
            </button>
          </div>

          {/* ───── VEHICLE MODEL SUB-SELECTOR (FOR ALL CATEGORIES) ───── */}
          <div className="mt-2.5 p-2 bg-slate-100/70 dark:bg-slate-800/60 rounded-xl">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                Select Vehicle Model:
              </span>
              <span className="text-[10px] text-slate-400">
                Auto-configures name, seats & icon
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {currentVehicleModels.map((item) => {
                const isSelected = selectedModel === item.key
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleSelectVehicleModel(item.key)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5',
                      isSelected
                        ? 'bg-white dark:bg-slate-900 text-[#1F2B6D] dark:text-blue-300 shadow-xs border border-slate-200/80 dark:border-slate-700'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/40'
                    )}
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({item.seats} {item.seats === 1 ? 'Seat' : 'Seats'})
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ───── 2. SERVICE DETAILS (DISPLAY NAME & SEAT CAPACITY) ───── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Display Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Display Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g. Cab Mini, Auto, Bike"
              className="w-full px-3.5 py-2 text-sm font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D]"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Shown to riders in the booking list
            </span>
          </div>

          {/* Seat Capacity */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Seat Capacity *
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  handleChange(
                    'passengerCapacity',
                    Math.max(1, (formData.passengerCapacity || 1) - 1)
                  )
                }
                disabled={formData.passengerCapacity <= 1}
                className="w-9 h-9 rounded-xl border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-30 disabled:pointer-events-none"
                title="Decrease seats"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <div className="relative flex-1">
                <Users className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="number"
                  min={1}
                  max={20}
                  required
                  value={formData.passengerCapacity}
                  onChange={(e) =>
                    handleChange(
                      'passengerCapacity',
                      Math.max(1, Math.min(20, parseInt(e.target.value) || 1))
                    )
                  }
                  className="w-full pl-8 pr-2 py-1.5 text-sm font-bold text-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D]"
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  handleChange(
                    'passengerCapacity',
                    Math.min(20, (formData.passengerCapacity || 1) + 1)
                  )
                }
                disabled={formData.passengerCapacity >= 20}
                className="w-9 h-9 rounded-xl border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-30 disabled:pointer-events-none"
                title="Increase seats"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick seat selector chips */}
            <div className="flex items-center gap-1 mt-1.5">
              {[1, 3, 4, 6].map((seats) => (
                <button
                  key={seats}
                  type="button"
                  onClick={() => handleChange('passengerCapacity', seats)}
                  className={cn(
                    'px-2 py-0.5 rounded-md text-[10.5px] font-semibold transition',
                    formData.passengerCapacity === seats
                      ? 'bg-[#1F2B6D] text-white dark:bg-blue-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  )}
                >
                  {seats} {seats === 1 ? 'seat' : 'seats'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ───── 3. VEHICLE IMAGE: PRESETS | UPLOAD FILE | IMAGE URL ───── */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Vehicle Image
            </label>

            {/* Mode Switcher Tabs */}
            <div className="flex bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setImageMode('preset')}
                className={cn(
                  'px-2.5 py-1 rounded-md transition',
                  imageMode === 'preset'
                    ? 'bg-white dark:bg-slate-900 text-[#1F2B6D] dark:text-blue-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                )}
              >
                Preset Icons
              </button>
              <button
                type="button"
                onClick={() => setImageMode('upload')}
                className={cn(
                  'px-2.5 py-1 rounded-md transition flex items-center gap-1',
                  imageMode === 'upload'
                    ? 'bg-white dark:bg-slate-900 text-[#1F2B6D] dark:text-blue-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                )}
              >
                <Upload className="w-3 h-3" />
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setImageMode('url')}
                className={cn(
                  'px-2.5 py-1 rounded-md transition flex items-center gap-1',
                  imageMode === 'url'
                    ? 'bg-white dark:bg-slate-900 text-[#1F2B6D] dark:text-blue-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                )}
              >
                <Link2 className="w-3 h-3" />
                Direct URL
              </button>
            </div>
          </div>

          {/* TAB 1: PRESET ICONS */}
          {imageMode === 'preset' && (
            <div className="grid grid-cols-6 gap-2 pt-1">
              {[
                { key: 'auto', label: 'Auto' },
                { key: 'bike', label: 'Bike' },
                { key: 'cab-mini', label: 'Mini' },
                { key: 'cab-economy', label: 'Economy' },
                { key: 'cab-premium', label: 'Premium' },
                { key: 'cab-xl', label: 'XL' },
              ].map(({ key, label }) => {
                const isSelected =
                  formData.icon === key && !formData.imageFileId && !formData.imageUrl
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      handleChange('icon', key)
                      handleChange('imageUrl', '')
                      handleChange('imageFileId', '')
                    }}
                    className={cn(
                      'flex flex-col items-center p-1.5 rounded-xl border text-center transition',
                      isSelected
                        ? 'border-[#1F2B6D] bg-white dark:bg-slate-800 text-[#1F2B6D] dark:text-white font-bold shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    )}
                  >
                    <img
                      src={VEHICLE_PRESET_ICONS[key]}
                      alt={label}
                      className="w-9 h-8 object-contain mb-1"
                    />
                    <span className="text-[10px]">{label}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* TAB 2: UPLOAD FILE */}
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
                <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                      <img
                        src={previewIconSrc}
                        alt="Uploaded preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                        Custom Image Attached
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                        <Check className="w-3 h-3" /> Ready for mobile apps
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition"
                    >
                      {uploading ? 'Uploading...' : 'Replace'}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-5 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#1F2B6D] dark:hover:border-blue-400 rounded-xl cursor-pointer transition text-center"
                >
                  {uploading ? (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin text-[#1F2B6D]" />
                      <span>Uploading to secure storage...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Click to upload vehicle image
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        PNG, JPG, or WebP (transparent background recommended)
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DIRECT IMAGE URL */}
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
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D]"
              />
              <span className="text-[10px] text-slate-400 block">
                Paste any cloud image URL. Card preview updates immediately above.
              </span>
            </div>
          )}
        </div>

        {/* ───── 4. ACTIVE IN APPS SWITCH ───── */}
        <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800">
          <div>
            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Active in Apps
            </h5>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
              Visible to riders and drivers for booking
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>
      </form>
    </Modal>
  )
}

export default VehicleTypeModal
