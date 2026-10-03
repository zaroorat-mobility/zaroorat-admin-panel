import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { X, Check, Loader2 } from 'lucide-react'
import { Step1ZoneInformation } from './Step1ZoneInformation'
import { Step3VehicleCategories } from './Step3VehicleCategories'
import { Step4DefineZoneMap } from './Step4DefineZoneMap'
import { Step5ReviewCreate } from './Step5ReviewCreate'
import {
  useCities,
  useCityZonesWithBoundaries,
  useCreateServiceZone,
  useServiceZone,
  useUpdateServiceZone,
} from '../../hooks'
import { useCityMapContext } from '../../hooks/useCityMapContext'
import { useToast } from '@/shared/context/toast/ToastContext'
import { generateCirclePolygon, type LatLngPoint } from '../CreateCityModal/geoUtils'
import type { ServiceZoneDetail, ServiceZoneType } from '../../types'

interface CreateServiceZoneModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (zone: ServiceZoneDetail) => void
  initialCityCode?: string
  initialZoneType?: ServiceZoneType
  zoneId?: string
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const CITY_COORDINATE_FALLBACKS: Record<string, LatLngPoint> = {
  ATQ: { lat: 31.634, lng: 74.8723 }, // Amritsar, Punjab
  LUH: { lat: 30.901, lng: 75.8573 }, // Ludhiana, Punjab
  JUC: { lat: 31.326, lng: 75.5762 }, // Jalandhar, Punjab
  PTA: { lat: 30.3398, lng: 76.3869 }, // Patiala, Punjab
  IXC: { lat: 30.7333, lng: 76.7794 }, // Chandigarh
  CHD: { lat: 30.7333, lng: 76.7794 }, // Chandigarh
  SGR: { lat: 34.0837, lng: 74.7973 }, // Srinagar, J&K
  JMU: { lat: 32.7266, lng: 74.857 }, // Jammu, J&K
  BRM: { lat: 34.2017, lng: 74.3436 }, // Baramulla, J&K
  BLR: { lat: 12.9716, lng: 77.5946 }, // Bangalore
  PNQ: { lat: 18.5204, lng: 73.8567 }, // Pune
  DEL: { lat: 28.6139, lng: 77.209 }, // Delhi
  BOM: { lat: 19.076, lng: 72.8777 }, // Mumbai
}

export const CreateServiceZoneModal: React.FC<CreateServiceZoneModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialCityCode = '',
  initialZoneType = 'SERVICE',
  zoneId,
}) => {
  const isEdit = Boolean(zoneId)
  const { data: existingZone, isLoading: isLoadingZone } = useServiceZone(zoneId || '')
  const { data: cities = [] } = useCities(true)
  const createZoneMutation = useCreateServiceZone()
  const updateZoneMutation = useUpdateServiceZone()
  const { success: showToastSuccess } = useToast()

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)

  // Filter out any virtual or global containers
  const validCities = useMemo(() => cities.filter((c) => c.code !== 'GLOBAL'), [cities])

  // Step 1: Zone Information
  const [cityCode, setCityCode] = useState(initialCityCode || '')
  const [zoneType, setZoneType] = useState<ServiceZoneType>(initialZoneType)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [priority, setPriority] = useState<number>(5)
  const [isActive, setIsActive] = useState<boolean>(true)
  const [allowsPickup, setAllowsPickup] = useState<boolean>(true)
  const [allowsDropoff, setAllowsDropoff] = useState<boolean>(true)

  // Step 2: Vehicle Categories (Real DB UUIDs)
  const [vehicleCategoryIds, setVehicleCategoryIds] = useState<string[]>([])

  // Step 3: Define Zone on Map
  const [coordinates, setCoordinates] = useState<number[][][] | null>(null)
  const [isMapValid, setIsMapValid] = useState<boolean>(true)

  // In edit mode: prefill all fields when existingZone is loaded
  useEffect(() => {
    if (isEdit && existingZone) {
      setCityCode(existingZone.cityCode)
      prevCityCodeRef.current = existingZone.cityCode
      setZoneType(existingZone.zoneType)
      setName(existingZone.name)
      setCode(existingZone.code)
      setIsActive(existingZone.isActive ?? true)
      setAllowsPickup(existingZone.allowsPickup ?? true)
      setAllowsDropoff(existingZone.allowsDropoff ?? true)
      if (existingZone.vehicleTypeIds && existingZone.vehicleTypeIds.length > 0) {
        setVehicleCategoryIds(existingZone.vehicleTypeIds)
      }
      if (existingZone.boundary && existingZone.boundary[0]?.length >= 3) {
        setCoordinates(existingZone.boundary)
      }
    }
  }, [isEdit, existingZone])

  // Real existing zones from database for the active city
  const { zones: existingZonesWithBoundaries, zoneList: existingZonesList } =
    useCityZonesWithBoundaries(cityCode)

  // Fetch reference city boundary and center from DB
  const { referenceBoundary: dbCityBoundary, cityCenter: dbCityCenter } = useCityMapContext(
    cityCode,
    cities,
  )

  // Current city metadata
  const currentCityObj = useMemo(() => {
    return validCities.find((c) => c.code === cityCode) || validCities[0] || null
  }, [validCities, cityCode])

  const cityName = currentCityObj?.name || 'Amritsar'

  // Centroid fallback
  const cityCenter: LatLngPoint = useMemo(() => {
    if (dbCityCenter) return dbCityCenter
    if (cityCode && CITY_COORDINATE_FALLBACKS[cityCode]) {
      return CITY_COORDINATE_FALLBACKS[cityCode]
    }
    return { lat: 31.634, lng: 74.8723 }
  }, [dbCityCenter, cityCode])

  // Boundary fallback
  const cityBoundary: number[][][] | null = useMemo(() => {
    if (dbCityBoundary && dbCityBoundary[0]?.length >= 3) return dbCityBoundary
    return generateCirclePolygon(cityCenter, 9.5, 32)
  }, [dbCityBoundary, cityCenter])

  // Generate unique non-colliding zone code
  const getNextAvailableZoneCode = useCallback(
    (cCode: string, zType: ServiceZoneType) => {
      const prefix = cCode.trim().toUpperCase() || 'ZONE'
      const typeTag = zType === 'AIRPORT' ? 'AP' : zType === 'RESTRICTED' ? 'RZ' : 'SZ'
      let index = 1
      while (
        existingZonesList.some(
          (z) =>
            z.code.trim().toUpperCase() ===
            `${prefix}_${typeTag}_${String(index).padStart(2, '0')}`,
        )
      ) {
        index++
      }
      return `${prefix}_${typeTag}_${String(index).padStart(2, '0')}`
    },
    [existingZonesList],
  )

  const prevCityCodeRef = useRef<string>(cityCode)
  const prevZoneTypeRef = useRef<ServiceZoneType>(zoneType)

  // Reset form cleanly whenever creating a fresh zone
  const resetForm = useCallback(() => {
    setCurrentStep(1)
    setErrorBanner(null)
    const activeCode =
      initialCityCode || (validCities.length > 0 ? validCities[0].code : 'ATQ')
    const activeCity = validCities.find((c) => c.code === activeCode) || validCities[0]
    const activeName = activeCity?.name || 'Amritsar'
    const finalCode = activeCity?.code || activeCode

    setCityCode(finalCode)
    prevCityCodeRef.current = finalCode
    setZoneType(initialZoneType)
    prevZoneTypeRef.current = initialZoneType
    setPriority(5)
    setIsActive(true)
    setAllowsPickup(true)
    setAllowsDropoff(true)
    setVehicleCategoryIds([])
    setCoordinates(null)

    const typeLabel =
      initialZoneType === 'AIRPORT'
        ? 'Airport Zone'
        : initialZoneType === 'RESTRICTED'
        ? 'Restricted Zone'
        : 'Service Zone'
    setName(`${activeName} ${typeLabel}`)
    setCode(getNextAvailableZoneCode(finalCode, initialZoneType))
  }, [validCities, initialCityCode, initialZoneType, getNextAvailableZoneCode])

  // Reset form whenever modal opens in create mode
  const wasOpenRef = useRef(false)
  useEffect(() => {
    if (isOpen && !wasOpenRef.current && !isEdit) {
      resetForm()
    }
    wasOpenRef.current = isOpen
  }, [isOpen, isEdit, resetForm])

  // In create mode: update default name, code and coordinates when cityCode or zoneType changes
  useEffect(() => {
    if (!isEdit && cityCode) {
      const cityChanged = prevCityCodeRef.current !== cityCode
      const typeChanged = prevZoneTypeRef.current !== zoneType
      if (cityChanged || typeChanged) {
        const typeLabel =
          zoneType === 'AIRPORT'
            ? 'Airport Zone'
            : zoneType === 'RESTRICTED'
            ? 'Restricted Zone'
            : 'Service Zone'
        setName(`${cityName} ${typeLabel}`)
        setCode(getNextAvailableZoneCode(cityCode, zoneType))
        if (cityChanged) {
          setCoordinates(generateCirclePolygon(cityCenter, 2.0, 8))
        }
        prevCityCodeRef.current = cityCode
        prevZoneTypeRef.current = zoneType
      }
    }
  }, [isEdit, cityCode, cityName, zoneType, cityCenter, getNextAvailableZoneCode])

  // Automatically seed initial 8-point zone polygon when entering Step 3 if not yet drawn
  useEffect(() => {
    if (currentStep === 3 && (!coordinates || !coordinates[0]?.length)) {
      setCoordinates(generateCirclePolygon(cityCenter, 2.0, 8))
    }
  }, [currentStep, cityCenter, coordinates])

  const isPending = isEdit ? updateZoneMutation.isPending : createZoneMutation.isPending

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', onKey)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen, onClose, isPending])

  if (!isOpen) return null

  const steps = [
    { n: 1, label: 'Zone Information' },
    { n: 2, label: 'Vehicle Categories' },
    { n: 3, label: 'Define Zone on Map' },
    { n: 4, label: isEdit ? 'Review & Update' : 'Review & Create' },
  ]

  // Code uniqueness check (excludes self if in edit mode)
  const normalizedCode = code.trim().toUpperCase()
  const isCodeTaken = Boolean(
    normalizedCode &&
      existingZonesList.some(
        (z) => z.code.trim().toUpperCase() === normalizedCode && (!isEdit || z.id !== zoneId),
      ),
  )

  const canProceedStep1 = Boolean(
    cityCode.trim() && name.trim() && code.trim() && !isCodeTaken,
  )
  const canProceedStep3 = Boolean(
    coordinates?.[0]?.length && coordinates[0].length >= 4 && isMapValid,
  )

  const handleSubmit = async () => {
    setErrorBanner(null)
    if (!coordinates?.[0]?.length || coordinates[0].length < 3) {
      setErrorBanner('Please define a valid zone boundary on the map.')
      setCurrentStep(3)
      return
    }

    if (isCodeTaken) {
      setErrorBanner(`Zone code "${code}" already exists for ${cityName}. Please choose a unique code.`)
      setCurrentStep(1)
      return
    }

    // Only pass valid UUID strings to backend
    const validVehicleTypeUuids = vehicleCategoryIds.filter((id) => UUID_REGEX.test(id))

    try {
      if (isEdit && zoneId) {
        const result = await updateZoneMutation.mutateAsync({
          id: zoneId,
          payload: {
            name: name.trim(),
            zoneType,
            coordinates,
            allowsPickup,
            allowsDropoff,
            isActive,
            vehicleTypeIds: validVehicleTypeUuids,
          },
        })
        showToastSuccess(
          'Service Zone Updated',
          `Zone "${name.trim()}" has been updated successfully.`,
        )
        onSuccess?.(result as unknown as ServiceZoneDetail)
        onClose()
      } else {
        const result = await createZoneMutation.mutateAsync({
          cityCode,
          code: code.trim().toUpperCase(),
          name: name.trim(),
          zoneType,
          coordinates,
          allowsPickup,
          allowsDropoff,
          isActive,
          ...(validVehicleTypeUuids.length > 0 ? { vehicleTypeIds: validVehicleTypeUuids } : {}),
        })
        showToastSuccess(
          'Service Zone Created',
          `Zone "${name.trim()}" (${code.trim().toUpperCase()}) has been created successfully for ${cityName}.`,
        )
        resetForm()
        onSuccess?.(result)
        onClose()
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data
              ?.error?.message ?? (isEdit ? 'Failed to update service zone.' : 'Failed to create service zone.')
      setErrorBanner(message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="fixed inset-0"
        onClick={() => {
          if (!isPending) onClose()
        }}
      />

      <div
        className="relative z-10 w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        style={{ height: 'min(94dvh, 780px)' }}
      >
        {/* ── Header with accent bar ──────────────────────────── */}
        <div className="shrink-0 flex items-start justify-between px-6 pt-4 pb-3 border-b border-slate-100 bg-white">
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-6 bg-[#1F2B6D] rounded-full mt-0.5"></div>
            <div>
              <h2 className="text-xl font-bold text-[#1F2B6D]">
                {isEdit ? `Edit Service Zone: ${existingZone?.name || name}` : 'Create Service Zone'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEdit
                  ? 'Update service zone boundary, vehicle categories, and operational rules.'
                  : 'Define a service zone within the city boundary and assign vehicle categories.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── 4-Step Stepper Header ─────────────────────────────── */}
        <div className="shrink-0 px-6 py-2.5 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => {
              const isCompleted = currentStep > s.n
              const isActiveStep = currentStep === s.n
              return (
                <React.Fragment key={s.n}>
                  <button
                    type="button"
                    onClick={() => {
                      if (s.n === 1) setCurrentStep(1)
                      else if (s.n === 2 && canProceedStep1) setCurrentStep(2)
                      else if (s.n === 3 && canProceedStep1) setCurrentStep(3)
                      else if (s.n === 4 && canProceedStep1 && canProceedStep3) setCurrentStep(4)
                    }}
                    className="flex items-center gap-2 shrink-0 cursor-pointer text-left"
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCompleted || isActiveStep
                          ? 'bg-[#1F2B6D] text-white shadow-xs'
                          : 'border border-slate-300 text-slate-500 bg-white'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : s.n}
                    </div>
                    <span
                      className={`text-xs font-bold leading-tight ${
                        isActiveStep ? 'text-slate-900' : 'text-slate-500'
                      }`}
                    >
                      {s.label}
                    </span>
                  </button>
                  {i < steps.length - 1 && (
                    <div
                      className={`h-px flex-1 mx-3 ${
                        isCompleted ? 'bg-[#1F2B6D]' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* ── Error Banner ─────────────────────────────────────── */}
        {errorBanner && (
          <div className="shrink-0 mx-6 mt-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-center justify-between">
            <span>{errorBanner}</span>
            <button type="button" onClick={() => setErrorBanner(null)}>
              <X className="w-3.5 h-3.5 text-red-400" />
            </button>
          </div>
        )}

        {/* ── Body Container ───────────────────────────────────── */}
        <div className="flex-1 min-h-0 px-6 py-3.5 bg-slate-50/60 overflow-y-auto">
          {isEdit && isLoadingZone ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#1F2B6D]" />
              <p className="text-xs font-semibold text-slate-600">Loading service zone details...</p>
            </div>
          ) : (
            <>
              {currentStep === 1 && (
                <Step1ZoneInformation
                  cities={cities}
                  cityCode={cityCode}
                  setCityCode={setCityCode}
                  zoneType={zoneType}
                  setZoneType={setZoneType}
                  name={name}
                  setName={setName}
                  code={code}
                  setCode={setCode}
                  priority={priority}
                  setPriority={setPriority}
                  isActive={isActive}
                  setIsActive={setIsActive}
                  allowsPickup={allowsPickup}
                  setAllowsPickup={setAllowsPickup}
                  allowsDropoff={allowsDropoff}
                  setAllowsDropoff={setAllowsDropoff}
                  cityBoundary={cityBoundary}
                  cityCenter={cityCenter}
                  cityName={cityName}
                  existingZones={existingZonesList}
                />
              )}

              {currentStep === 2 && (
                <Step3VehicleCategories
                  selectedCategoryIds={vehicleCategoryIds}
                  setSelectedCategoryIds={setVehicleCategoryIds}
                  cityName={cityName}
                />
              )}

              {currentStep === 3 && (
                <Step4DefineZoneMap
                  coordinates={coordinates}
                  setCoordinates={setCoordinates}
                  cityBoundary={cityBoundary}
                  cityCenter={cityCenter}
                  cityName={cityName}
                  zoneName={name}
                  zoneType={zoneType}
                  cityCode={cityCode}
                  existingZones={existingZonesWithBoundaries}
                  onValidationChange={setIsMapValid}
                />
              )}

              {currentStep === 4 && (
                <Step5ReviewCreate
                  cityCode={cityCode}
                  cityName={cityName}
                  zoneType={zoneType}
                  name={name}
                  code={code}
                  priority={priority}
                  isActive={isActive}
                  allowsPickup={allowsPickup}
                  allowsDropoff={allowsDropoff}
                  vehicleCategoryIds={vehicleCategoryIds}
                  coordinates={coordinates}
                  cityBoundary={cityBoundary}
                  cityCenter={cityCenter}
                  existingZones={existingZonesWithBoundaries}
                  onEditInfo={() => setCurrentStep(1)}
                  onEditVehicles={() => setCurrentStep(2)}
                  onEditMap={() => setCurrentStep(3)}
                />
              )}
            </>
          )}
        </div>

        {/* ── Footer Actions ───────────────────────────────────── */}
        <div className="shrink-0 flex items-center justify-between px-6 py-3 bg-white border-t border-slate-200">
          {/* Left Actions: Cancel + Back */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((p) => (p - 1) as 1 | 2 | 3)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>← Back</span>
              </button>
            )}
          </div>

          {/* Right Action: Next / Create / Save */}
          <div className="flex items-center gap-2.5">
            {currentStep === 1 && (
              <button
                type="button"
                disabled={!canProceedStep1}
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2 bg-[#1F2B6D] hover:bg-[#182258] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <span>Next: Vehicle Categories →</span>
              </button>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-5 py-2 bg-[#1F2B6D] hover:bg-[#182258] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <span>Next: Define Zone on Map →</span>
              </button>
            )}

            {currentStep === 3 && (
              <button
                type="button"
                disabled={!canProceedStep3}
                onClick={() => setCurrentStep(4)}
                className="px-5 py-2 bg-[#1F2B6D] hover:bg-[#182258] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <span>{isEdit ? 'Next: Review & Update →' : 'Next: Review & Create →'}</span>
              </button>
            )}

            {currentStep === 4 && (
              <button
                type="button"
                disabled={isPending}
                onClick={handleSubmit}
                className="px-6 py-2 bg-[#1F2B6D] hover:bg-[#182258] disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isEdit ? 'Saving Changes...' : 'Creating Zone...'}</span>
                  </>
                ) : (
                  <span>{isEdit ? 'Save Changes' : 'Create Service Zone →'}</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateServiceZoneModal
