import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { X, Check, Loader2 } from 'lucide-react'
import { Step1ZoneInformation } from './Step1ZoneInformation'
import { Step3VehicleCategories } from './Step3VehicleCategories'
import { KNOWN_AIRPORTS, Step4DefineZoneMap } from './Step4DefineZoneMap'
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
import { CityLoadStatus } from './CityLoadStatus'
import {
  seedRingFor,
  zoneAccessDefaults,
  zoneTypeHelp,
  zoneTypeLabel,
} from '../CreateCityModal/geoUtils'
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
  const [isActive, setIsActive] = useState<boolean>(true)
  const [allowsPickup, setAllowsPickup] = useState<boolean>(true)
  const [allowsDropoff, setAllowsDropoff] = useState<boolean>(true)

  // Step 2: Vehicle Categories (Real DB UUIDs)
  const [vehicleMode, setVehicleMode] = useState<'ALL' | 'ONLY'>('ALL')
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
      const vehicleIds = existingZone.vehicleTypeIds ?? []
      setVehicleMode(vehicleIds.length > 0 ? 'ONLY' : 'ALL')
      setVehicleCategoryIds(vehicleIds)
      if (existingZone.boundary && existingZone.boundary[0]?.length >= 3) {
        setCoordinates(existingZone.boundary)
      }
    }
  }, [isEdit, existingZone])

  // Real existing zones from database for the active city
  const { zones: existingZonesWithBoundaries, zoneList: existingZonesList } =
    useCityZonesWithBoundaries(cityCode)

  // Fetch reference city boundary and center from DB
  const {
    referenceBoundary: dbCityBoundary,
    cityCenter: dbCityCenter,
    coverageMode,
    loadedCityCode,
    failed: cityFailed,
    retry: retryCity,
  } = useCityMapContext(cityCode, cities)

  // Current city metadata
  const currentCityObj = useMemo(() => {
    return validCities.find((c) => c.code === cityCode) || null
  }, [validCities, cityCode])

  const cityName = currentCityObj?.name ?? ''
  const cityReady = Boolean(cityCode && loadedCityCode === cityCode)

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
    const activeCity = validCities.find((c) => c.code === initialCityCode) ?? validCities[0]
    const finalCode = activeCity?.code ?? initialCityCode

    setCityCode(finalCode)
    prevCityCodeRef.current = finalCode
    setZoneType(initialZoneType)
    prevZoneTypeRef.current = initialZoneType
    setIsActive(true)
    const access = zoneAccessDefaults(initialZoneType)
    setAllowsPickup(access.allowsPickup)
    setAllowsDropoff(access.allowsDropoff)
    setVehicleMode('ALL')
    setVehicleCategoryIds([])
    setCoordinates(null)

    // Until the city list arrives there is nothing true to say; the effect below fills these in.
    setName(activeCity ? `${activeCity.name} ${zoneTypeLabel(initialZoneType)}` : '')
    setCode(finalCode ? getNextAvailableZoneCode(finalCode, initialZoneType) : '')
  }, [validCities, initialCityCode, initialZoneType, getNextAvailableZoneCode])

  // Reset form whenever modal opens in create mode
  const wasOpenRef = useRef(false)
  useEffect(() => {
    if (isOpen && !wasOpenRef.current && !isEdit) {
      resetForm()
    }
    wasOpenRef.current = isOpen
  }, [isOpen, isEdit, resetForm])

  // The modal can open before the city list has loaded.
  useEffect(() => {
    if (isOpen && !isEdit && !cityCode && validCities.length > 0) {
      setCityCode(validCities[0].code)
    }
  }, [isOpen, isEdit, cityCode, validCities])

  // In create mode: update default name, code and coordinates when cityCode or zoneType changes
  useEffect(() => {
    if (!isEdit && cityCode) {
      const cityChanged = prevCityCodeRef.current !== cityCode
      const typeChanged = prevZoneTypeRef.current !== zoneType
      if (cityChanged || typeChanged) {
        setName(`${cityName} ${zoneTypeLabel(zoneType)}`)
        setCode(getNextAvailableZoneCode(cityCode, zoneType))
        if (cityChanged) setCoordinates(null)
        if (typeChanged) {
          const access = zoneAccessDefaults(zoneType)
          setAllowsPickup(access.allowsPickup)
          setAllowsDropoff(access.allowsDropoff)
        }
        prevCityCodeRef.current = cityCode
        prevZoneTypeRef.current = zoneType
      }
    }
  }, [isEdit, cityCode, cityName, zoneType, getNextAvailableZoneCode])

  // The default zone on the map step. Waits for the selected city, so it can never land in the last one.
  useEffect(() => {
    if (currentStep !== 3 || coordinates?.[0]?.length) return
    const airport = zoneType === 'AIRPORT' ? KNOWN_AIRPORTS[cityCode.toUpperCase()] : undefined
    const ring = seedRingFor({
      cityCode,
      loadedCityCode,
      center: airport ?? dbCityCenter,
      radiusKm: airport?.defaultRadiusKm ?? 2,
    })
    if (ring) setCoordinates(ring)
  }, [currentStep, coordinates, cityCode, loadedCityCode, dbCityCenter, zoneType])

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

  const isRestricted = zoneType === 'RESTRICTED'
  const typeLabel = zoneTypeLabel(zoneType)

  // A restricted zone applies to every vehicle, so there is no vehicle step to show.
  const steps = [
    { n: 1, label: 'Zone Information' },
    { n: 2, label: 'Vehicle Categories' },
    { n: 3, label: 'Define Zone on Map' },
    { n: 4, label: isEdit ? 'Review & Update' : 'Review & Create' },
  ].filter((s) => !(isRestricted && s.n === 2))

  // Code uniqueness check (excludes self if in edit mode)
  const normalizedCode = code.trim().toUpperCase()
  const isCodeTaken = Boolean(
    normalizedCode &&
      existingZonesList.some(
        (z) => z.code.trim().toUpperCase() === normalizedCode && (!isEdit || z.id !== zoneId),
      ),
  )

  const blocksSomething = !allowsPickup || !allowsDropoff
  const canProceedStep1 = Boolean(
    cityReady && name.trim() && code.trim() && !isCodeTaken && (!isRestricted || blocksSomething),
  )
  const canProceedStep2 = isRestricted || vehicleMode === 'ALL' || vehicleCategoryIds.length > 0

  // In a whole-city city a service zone only sets its own fares and vehicles.
  const zoneLeavesCityOpen = cityReady && zoneType === 'SERVICE' && coverageMode === 'WHOLE_CITY'
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
    const validVehicleTypeUuids =
      isRestricted || vehicleMode === 'ALL'
        ? []
        : vehicleCategoryIds.filter((id) => UUID_REGEX.test(id))

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
          `${typeLabel} Updated`,
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
          `${typeLabel} Created`,
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
              ?.error?.message ?? (isEdit ? 'Failed to update this zone.' : 'Failed to create this zone.')
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
                {isEdit ? `Edit ${typeLabel}: ${existingZone?.name || name}` : `Create ${typeLabel}`}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {zoneTypeHelp(zoneType)}
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
                      else if (s.n === 3 && canProceedStep1 && canProceedStep2) setCurrentStep(3)
                      else if (s.n === 4 && canProceedStep1 && canProceedStep2 && canProceedStep3) {
                        setCurrentStep(4)
                      }
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
                      {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : i + 1}
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

        {zoneLeavesCityOpen && (currentStep === 1 || currentStep === 4) && (
          <div className="shrink-0 mx-6 mt-2 p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs font-medium text-slate-800">
            {cityName} takes rides anywhere in its Operating Area, so this zone does not limit where
            rides start. It sets its own fares and vehicles.
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
                  isActive={isActive}
                  setIsActive={setIsActive}
                  allowsPickup={allowsPickup}
                  setAllowsPickup={setAllowsPickup}
                  allowsDropoff={allowsDropoff}
                  setAllowsDropoff={setAllowsDropoff}
                  cityBoundary={cityReady ? dbCityBoundary : null}
                  cityCenter={cityReady ? dbCityCenter : null}
                  cityName={cityName}
                  cityFailed={cityFailed}
                  onRetryCity={retryCity}
                  isEdit={isEdit}
                  existingZones={existingZonesList}
                />
              )}

              {currentStep === 2 && (
                <Step3VehicleCategories
                  mode={vehicleMode}
                  setMode={setVehicleMode}
                  selectedCategoryIds={vehicleCategoryIds}
                  setSelectedCategoryIds={setVehicleCategoryIds}
                  cityName={cityName}
                />
              )}

              {currentStep >= 3 && (!cityReady || !dbCityCenter) && (
                <CityLoadStatus failed={cityFailed} cityName={cityName} onRetry={retryCity} />
              )}

              {currentStep === 3 && cityReady && dbCityCenter && (
                <Step4DefineZoneMap
                  coordinates={coordinates}
                  setCoordinates={setCoordinates}
                  cityBoundary={dbCityBoundary}
                  cityCenter={dbCityCenter}
                  cityName={cityName}
                  zoneName={name}
                  zoneType={zoneType}
                  cityCode={cityCode}
                  existingZones={existingZonesWithBoundaries}
                  onValidationChange={setIsMapValid}
                />
              )}

              {currentStep === 4 && cityReady && dbCityCenter && (
                <Step5ReviewCreate
                  cityCode={cityCode}
                  cityName={cityName}
                  zoneType={zoneType}
                  name={name}
                  code={code}
                  isActive={isActive}
                  allowsPickup={allowsPickup}
                  allowsDropoff={allowsDropoff}
                  vehicleCategoryIds={vehicleMode === 'ALL' ? [] : vehicleCategoryIds}
                  coordinates={coordinates}
                  cityBoundary={dbCityBoundary}
                  cityCenter={dbCityCenter}
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
                onClick={() =>
                  setCurrentStep((p) => (p === 3 && isRestricted ? 1 : ((p - 1) as 1 | 2 | 3)))
                }
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
                onClick={() => setCurrentStep(isRestricted ? 3 : 2)}
                className="px-5 py-2 bg-[#1F2B6D] hover:bg-[#182258] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <span>{isRestricted ? 'Next: Define Zone on Map →' : 'Next: Vehicle Categories →'}</span>
              </button>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                disabled={!canProceedStep2}
                onClick={() => setCurrentStep(3)}
                className="px-5 py-2 bg-[#1F2B6D] hover:bg-[#182258] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
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
                  <span>{isEdit ? 'Save Changes' : `Create ${typeLabel} →`}</span>
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
