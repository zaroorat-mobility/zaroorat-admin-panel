import React, { useState, useEffect } from 'react'
import { ViewDrawer } from '@/shared/components/ViewDrawer'
import { Button } from '@/shared/components/ui/Button'
import { FileUploadField } from '@/shared/components/FileUploadField'
import { VEHICLE_PRESET_ICONS } from '@/assets/images/vehicles'
import { api, API_ENDPOINTS } from '@/infrastructure/api'
import { Check, Loader2, Sparkles, AlertCircle, Plus } from 'lucide-react'

export interface VehicleTypeFormData {
  id?: string
  code: string
  name: string
  category: string
  hasAc: boolean
  badge: string
  description: string
  imageUrl: string
  imageFileId: string
  icon: string
  passengerCapacity: number
  luggageCapacity: number
  displayOrder: number
  isActive: boolean
}

interface VehicleTypeDrawerProps {
  isOpen: boolean
  onClose: () => void
  vehicleType?: VehicleTypeFormData | null
  onSuccess: () => void
}

const INITIAL_FORM: VehicleTypeFormData = {
  code: '',
  name: '',
  category: 'car',
  hasAc: false,
  badge: '',
  description: '',
  imageUrl: '',
  imageFileId: '',
  icon: 'cab-mini',
  passengerCapacity: 4,
  luggageCapacity: 2,
  displayOrder: 10,
  isActive: true,
}

export const VehicleTypeDrawer: React.FC<VehicleTypeDrawerProps> = ({
  isOpen,
  onClose,
  vehicleType,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<VehicleTypeFormData>(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = Boolean(vehicleType?.id)

  useEffect(() => {
    if (vehicleType) {
      setFormData({
        ...INITIAL_FORM,
        ...vehicleType,
        badge: vehicleType.badge || '',
        description: vehicleType.description || '',
        imageUrl: vehicleType.imageUrl || '',
        imageFileId: vehicleType.imageFileId || '',
        icon: vehicleType.icon || 'cab-mini',
      })
    } else {
      setFormData(INITIAL_FORM)
    }
    setError(null)
  }, [vehicleType, isOpen])

  const handleChange = <K extends keyof VehicleTypeFormData>(
    field: K,
    value: VehicleTypeFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAcToggle = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      hasAc: checked,
      badge: checked ? 'AC' : prev.badge === 'AC' ? 'NON AC' : prev.badge,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.code.trim()) {
      setError('Please provide a unique service code (e.g. CAB_MINI_AC)')
      return
    }
    if (!formData.name.trim()) {
      setError('Please provide a display name (e.g. Cab Mini)')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        category: formData.category,
        hasAc: formData.hasAc,
        badge: formData.badge.trim() || null,
        description: formData.description.trim() || null,
        imageUrl: formData.imageUrl.trim() || null,
        imageFileId: formData.imageFileId.trim() || null,
        icon: formData.icon || null,
        passengerCapacity: Number(formData.passengerCapacity) || 4,
        luggageCapacity: Number(formData.luggageCapacity) || 2,
        displayOrder: Number(formData.displayOrder) || 0,
        isActive: formData.isActive,
      }

      if (isEditing && vehicleType?.id) {
        await api.put(API_ENDPOINTS.vehicleTypes.update(vehicleType.id), payload)
      } else {
        await api.post(API_ENDPOINTS.vehicleTypes.create, payload)
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to save vehicle type. Please check required fields.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Determine preview image
  const previewIconSrc =
    formData.imageUrl ||
    (formData.icon ? VEHICLE_PRESET_ICONS[formData.icon] : null) ||
    VEHICLE_PRESET_ICONS['cab-mini']

  return (
    <ViewDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Service: ${formData.name || formData.code}` : 'Add New Fleet Service'}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={submitting}
          >
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
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ───── LIVE CUSTOMER APP PREVIEW CARD ───── */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Customer App Card Preview
            </h4>
          </div>

          <div className="flex items-center justify-center p-6 bg-white dark:bg-slate-950 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
            <div className="flex flex-col items-center w-[84px]">
              <div className="relative w-[78px] h-[68px] rounded-xl border border-[#DDE3EA] dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden flex items-center justify-center shadow-xs">
                {formData.badge ? (
                  <span className="absolute top-1.5 right-1.5 text-[9px] font-bold text-[#1F2B6D] dark:text-blue-400 uppercase tracking-tight z-10">
                    {formData.badge}
                  </span>
                ) : formData.hasAc ? (
                  <span className="absolute top-1.5 right-1.5 text-[9px] font-bold text-[#1F2B6D] dark:text-blue-400 uppercase tracking-tight z-10">
                    AC
                  </span>
                ) : null}

                {previewIconSrc ? (
                  <img
                    src={previewIconSrc}
                    alt={formData.name || 'Vehicle'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-slate-400">No Image</span>
                )}
              </div>
              <span className="mt-1.5 text-[11px] font-semibold text-slate-800 dark:text-slate-100 text-center truncate w-full">
                {formData.name || 'Service Name'}
              </span>
            </div>
          </div>
        </div>

        {/* ───── BASIC INFO ───── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Service Code *
            </label>
            <input
              type="text"
              required
              disabled={isEditing}
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
              placeholder="e.g. CAB_MINI_NON_AC"
              className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] disabled:opacity-60"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Unique uppercase identifier
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Display Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g. Cab Mini"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D]"
            />
          </div>
        </div>

        {/* ───── CATEGORY & AC SETTINGS ───── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D]"
            >
              <option value="car">Cab / Car</option>
              <option value="auto">Auto</option>
              <option value="bike">Bike</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Air Conditioning (AC)
            </label>
            <div className="flex items-center h-10 gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasAc}
                  onChange={(e) => handleAcToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1F2B6D]"></div>
                <span className="ml-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {formData.hasAc ? 'AC Equipped' : 'Non-AC'}
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Badge Label
            </label>
            <input
              type="text"
              value={formData.badge}
              onChange={(e) => handleChange('badge', e.target.value)}
              placeholder="e.g. AC, NON AC, POPULAR"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D]"
            />
          </div>
        </div>

        {/* ───── CAPACITIES & DISPLAY ORDER ───── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Passenger Capacity
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={formData.passengerCapacity}
              onChange={(e) => handleChange('passengerCapacity', Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Luggage Bags
            </label>
            <input
              type="number"
              min={0}
              max={20}
              value={formData.luggageCapacity}
              onChange={(e) => handleChange('luggageCapacity', Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Display Order
            </label>
            <input
              type="number"
              min={0}
              value={formData.displayOrder}
              onChange={(e) => handleChange('displayOrder', Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D]"
            />
          </div>
        </div>

        {/* ───── VEHICLE IMAGE CONFIGURATION ───── */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Vehicle Image Upload & Preset
          </label>

          <FileUploadField
            label="Upload Vehicle Image (PNG / JPEG / WebP)"
            purpose="VEHICLE_IMAGE"
            value={formData.imageFileId}
            onChange={(fileId) => {
              handleChange('imageFileId', fileId)
              if (fileId) handleChange('imageUrl', `/api/v1/files/${fileId}/url`)
            }}
            variant="document"
            helperText="Uploaded to secure storage and served directly to customer & driver apps"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Or Direct Image URL
            </label>
            <input
              type="text"
              value={formData.imageUrl}
              onChange={(e) => handleChange('imageUrl', e.target.value)}
              placeholder="https://.../car-image.png"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D]"
            />
          </div>

          {/* Preset Icon Selector Fallback */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
              Or Choose Preset Built-in Icon
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { key: 'auto', label: 'Auto' },
                { key: 'bike', label: 'Bike' },
                { key: 'cab-mini', label: 'Mini' },
                { key: 'cab-economy', label: 'Economy' },
                { key: 'cab-premium', label: 'Premium' },
                { key: 'cab-xl', label: 'XL' },
              ].map(({ key, label }) => {
                const isSelected = formData.icon === key && !formData.imageFileId && !formData.imageUrl
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      handleChange('icon', key)
                      handleChange('imageFileId', '')
                      handleChange('imageUrl', '')
                    }}
                    className={`flex flex-col items-center p-2 rounded-xl border text-center transition ${
                      isSelected
                        ? 'border-[#1F2B6D] bg-slate-50 dark:bg-slate-800 text-[#1F2B6D] dark:text-white font-bold'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <img
                      src={VEHICLE_PRESET_ICONS[key]}
                      alt={label}
                      className="w-10 h-9 object-cover rounded mb-1"
                    />
                    <span className="text-[10px] font-semibold">{label}</span>
                    {isSelected && (
                      <Check className="w-3 h-3 text-[#1F2B6D] dark:text-white mt-0.5" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ───── DESCRIPTION ───── */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Description / Marketing Note
          </label>
          <textarea
            rows={2}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="e.g. Economical non-AC cabs for pocket-friendly daily travel"
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D]"
          />
        </div>

        {/* ───── ACTIVE TOGGLE ───── */}
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800">
          <div>
            <h5 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Active in Mobile Apps
            </h5>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              When disabled, customers and drivers will not see this option in booking screens.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>
      </form>
    </ViewDrawer>
  )
}

