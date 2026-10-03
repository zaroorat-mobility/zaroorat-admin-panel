import React, { useState, useEffect } from 'react'
import { X, Check, Loader2 } from 'lucide-react'
import { Step1CityInformation } from './Step1CityInformation'
import { Step2Boundary } from './Step2Boundary'
import { Step3ReviewCreate } from './Step3ReviewCreate'
import type { OfficialCityItem } from './officialCitiesCatalog'
import { generateCirclePolygon, type LatLngPoint } from './geoUtils'
import { useCity, useCreateCity, useStates, useUpdateCity } from '../../hooks'
import type { CityDetail } from '../../types'

interface CreateCityModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (city: CityDetail) => void
  cityId?: string
}

export const CreateCityModal: React.FC<CreateCityModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  cityId,
}) => {
  const isEdit = Boolean(cityId)
  const { data: cityData, isLoading: isLoadingCity } = useCity(cityId || '')
  const { data: statesList = [] } = useStates({ countryCode: 'IN', activeOnly: true })
  const createCityMutation = useCreateCity()
  const updateCityMutation = useUpdateCity()

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)

  // Step 1: City Information
  const [country, setCountry] = useState('India')
  const [stateId, setStateId] = useState('')
  const [selectedStateCode, setSelectedStateCode] = useState('KA')
  const [cityName, setCityName] = useState('Bengaluru')
  const [cityCode, setCityCode] = useState('BLR')
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [currency, setCurrency] = useState('INR')
  const [isActive, setIsActive] = useState(true)
  const [center, setCenter] = useState<LatLngPoint>({ lat: 12.9716, lng: 77.5946 })
  const [selectedOfficialCity, setSelectedOfficialCity] = useState<OfficialCityItem | null>(null)

  // Step 2: Boundary
  const [boundaryType, setBoundaryType] = useState<'official' | 'radius' | 'polygon'>('radius')
  const [radiusKm, setRadiusKm] = useState<number>(5)
  const [boundary, setBoundary] = useState<number[][][] | null>(() =>
    generateCirclePolygon({ lat: 12.9716, lng: 77.5946 }, 5, 64),
  )
  const [isBoundaryValid, setIsBoundaryValid] = useState(true)

  // In edit mode: populate fields when cityData arrives from backend
  useEffect(() => {
    if (isEdit && cityData) {
      setCityName(cityData.name)
      setCityCode(cityData.code)
      setCountry(cityData.country || 'India')
      setStateId(cityData.stateId ?? '')
      setTimezone(cityData.timezone || 'Asia/Kolkata')
      setCurrency(cityData.currency || 'INR')
      setIsActive(cityData.isActive ?? true)

      if (cityData.center) {
        setCenter({ lat: cityData.center.lat, lng: cityData.center.lng })
      }

      if (cityData.boundary && cityData.boundary[0]?.length >= 3) {
        setBoundary(cityData.boundary)
        setBoundaryType('polygon')
      }

      const matchedState = statesList.find((s) => s.id === cityData.stateId)
      if (matchedState) {
        setSelectedStateCode(matchedState.code)
      }
    }
  }, [isEdit, cityData, statesList])

  // In create mode: Auto-select Karnataka & Bengaluru on initial mount
  useEffect(() => {
    if (!isEdit && !stateId && statesList.length > 0) {
      const ka = statesList.find((s) => s.code === 'KA') || statesList[0]
      setStateId(ka.id)
      setSelectedStateCode(ka.code)
    }
  }, [isEdit, statesList, stateId])

  useEffect(() => {
    if (!isEdit && !selectedOfficialCity) {
      setSelectedOfficialCity({
        code: 'BLR',
        name: 'Bengaluru',
        district: 'Bengaluru Urban',
        stateName: 'Karnataka',
        stateCode: 'KA',
        center: { lat: 12.9716, lng: 77.5946 },
      })
    }
  }, [isEdit, selectedOfficialCity])

  const handleSelectOfficialCity = (item: OfficialCityItem) => {
    setSelectedOfficialCity(item)
    setCityName(item.name)
    setCityCode(item.code)
    setCenter(item.center)
    setBoundary(
      item.officialBoundary ?? generateCirclePolygon(item.center, radiusKm, 64),
    )
  }

  // Escape closes modal
  useEffect(() => {
    const isPending = createCityMutation.isPending || updateCityMutation.isPending
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
  }, [isOpen, onClose, createCityMutation.isPending, updateCityMutation.isPending])

  if (!isOpen) return null

  const isPending = isEdit ? updateCityMutation.isPending : createCityMutation.isPending
  const canProceedStep1 = Boolean(cityName.trim() && cityCode.trim())

  const handleSubmit = async () => {
    setErrorBanner(null)
    const payload = {
      code: cityCode.toUpperCase(),
      name: cityName.trim(),
      stateId: stateId || null,
      timezone,
      currency,
      center: { lat: Number(center.lat.toFixed(6)), lng: Number(center.lng.toFixed(6)) },
      boundary,
      isActive,
    }

    try {
      if (isEdit && cityId) {
        const result = await updateCityMutation.mutateAsync({ id: cityId, payload })
        onSuccess?.(result as unknown as CityDetail)
        onClose()
      } else {
        const result = await createCityMutation.mutateAsync(payload)
        onSuccess?.(result)
        onClose()
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            (isEdit ? 'Failed to update city.' : 'Failed to create city.')
      setErrorBanner(message)
    }
  }

  /* ─── Stepper config ─────────────────────────────────────── */
  const steps = [
    { n: 1, label: 'City Information', sub: 'Select country, state & city' },
    { n: 2, label: 'Boundary', sub: 'Define coverage area' },
    {
      n: 3,
      label: isEdit ? 'Review & Update' : 'Review & Create',
      sub: isEdit ? 'Verify details & save changes' : 'Verify details & save',
    },
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      {/* backdrop */}
      <div
        className="fixed inset-0"
        onClick={() => {
          if (!isPending) onClose()
        }}
      />

      <div
        className="relative z-10 w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        style={{ height: 'min(94dvh, 760px)' }}
      >
        {/* ── Header ───────────────────────────────────────────── */}
        <div className="shrink-0 flex items-start justify-between px-7 pt-4 pb-3 border-b border-slate-100 bg-white">
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-6 bg-[#1F2B6D] rounded-full mt-0.5"></div>
            <div>
              <h2 className="text-xl font-bold text-[#1F2B6D]">
                {isEdit ? `Edit City: ${cityData?.name || cityName}` : 'Create City'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEdit
                  ? 'Update city details, center coordinates, and coverage boundary.'
                  : 'Add a new city using official data, radius or custom boundary.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors mt-0.5 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Stepper ──────────────────────────────────────────── */}
        <div className="shrink-0 px-7 py-2.5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-0">
            {steps.map((s, i) => {
              const done = currentStep > s.n
              const active = currentStep === s.n
              return (
                <React.Fragment key={s.n}>
                  <button
                    type="button"
                    onClick={() => {
                      if (s.n === 1) setCurrentStep(1)
                      else if (s.n === 2 && canProceedStep1) setCurrentStep(2)
                      else if (s.n === 3 && canProceedStep1 && isBoundaryValid) setCurrentStep(3)
                    }}
                    className="flex items-center gap-2.5 shrink-0 cursor-pointer text-left"
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        done || active
                          ? 'bg-[#1F2B6D] text-white shadow-xs'
                          : 'border border-slate-300 text-slate-500 bg-white'
                      }`}
                    >
                      {done ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : s.n}
                    </div>
                    <div>
                      <p
                        className={`text-xs font-bold leading-tight ${
                          active ? 'text-slate-900' : 'text-slate-600'
                        }`}
                      >
                        {s.label}
                      </p>
                      <p className="text-[10.5px] text-slate-400 leading-tight">{s.sub}</p>
                    </div>
                  </button>
                  {i < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-4 transition-colors ${
                        done ? 'bg-[#1F2B6D]' : 'bg-slate-200'
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
          <div className="shrink-0 mx-7 mt-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-center justify-between">
            <span>{errorBanner}</span>
            <button type="button" onClick={() => setErrorBanner(null)}>
              <X className="w-3.5 h-3.5 text-red-400" />
            </button>
          </div>
        )}

        {/* ── Body: Swapped per Step ───────────────────────────── */}
        <div className="flex-1 min-h-0 px-7 py-3 bg-slate-50/60 overflow-hidden flex flex-col">
          {isEdit && isLoadingCity ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[#1F2B6D]" />
              <p className="text-xs font-semibold text-slate-600">Loading city details from database...</p>
            </div>
          ) : (
            <>
              {currentStep === 1 && (
                <Step1CityInformation
                  country={country}
                  setCountry={setCountry}
                  stateId={stateId}
                  setStateId={setStateId}
                  selectedStateCode={selectedStateCode}
                  setSelectedStateCode={setSelectedStateCode}
                  statesList={statesList}
                  cityName={cityName}
                  setCityName={setCityName}
                  cityCode={cityCode}
                  setCityCode={setCityCode}
                  timezone={timezone}
                  setTimezone={setTimezone}
                  currency={currency}
                  setCurrency={setCurrency}
                  isActive={isActive}
                  setIsActive={setIsActive}
                  center={center}
                  onSelectOfficialCity={handleSelectOfficialCity}
                />
              )}

              {currentStep === 2 && (
                <Step2Boundary
                  cityName={cityName}
                  cityCode={cityCode}
                  stateName={
                    statesList.find((s) => s.id === stateId)?.name ?? selectedStateCode
                  }
                  country={country}
                  center={center}
                  setCenter={setCenter}
                  boundaryType={boundaryType}
                  setBoundaryType={setBoundaryType}
                  radiusKm={radiusKm}
                  setRadiusKm={setRadiusKm}
                  boundary={boundary}
                  setBoundary={setBoundary}
                  selectedOfficialCity={selectedOfficialCity}
                  onValidationChange={setIsBoundaryValid}
                  onBack={() => setCurrentStep(1)}
                  onCancel={onClose}
                  onNext={() => setCurrentStep(3)}
                />
              )}

              {currentStep === 3 && (
                <Step3ReviewCreate
                  country={country}
                  stateName={
                    statesList.find((s) => s.id === stateId)?.name ?? selectedStateCode
                  }
                  cityName={cityName}
                  cityCode={cityCode}
                  timezone={timezone}
                  currency={currency}
                  isActive={isActive}
                  center={center}
                  boundaryType={boundaryType}
                  radiusKm={radiusKm}
                  boundary={boundary}
                  isSubmitting={isPending}
                  onEditCityInfo={() => setCurrentStep(1)}
                  onEditBoundary={() => setCurrentStep(2)}
                  onBack={() => setCurrentStep(2)}
                  onCancel={onClose}
                  onSubmit={handleSubmit}
                />
              )}
            </>
          )}
        </div>

        {/* ── Footer Actions ───────────────────────────────────── */}
        <div className="shrink-0 flex items-center justify-between px-7 py-3 bg-white border-t border-slate-200">
          {/* Left: Back / Cancel */}
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((p) => (p - 1) as 1 | 2)}
              className="flex items-center gap-1.5 px-5 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              ← Back
            </button>
          ) : (
            <button
              type="button"
              disabled={isPending}
              onClick={onClose}
              className="px-5 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}

          {/* Right: Cancel + Primary action */}
          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <button
                type="button"
                disabled={isPending}
                onClick={onClose}
                className="px-5 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}

            {currentStep === 1 && (
              <button
                type="button"
                disabled={!canProceedStep1}
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2 bg-[#1F2B6D] hover:bg-[#182258] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <span>Next: Define Boundary →</span>
              </button>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                disabled={!isBoundaryValid}
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2 bg-[#1F2B6D] hover:bg-[#182258] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <span>{isEdit ? 'Next: Review & Update →' : 'Next: Review & Create →'}</span>
              </button>
            )}

            {currentStep === 3 && (
              <button
                type="button"
                disabled={isPending}
                onClick={handleSubmit}
                className="px-6 py-2 bg-[#1F2B6D] hover:bg-[#182258] disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isEdit ? 'Saving City...' : 'Creating City...'}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>{isEdit ? 'Save City' : 'Create City'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateCityModal
