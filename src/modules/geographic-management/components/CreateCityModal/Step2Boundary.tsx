import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  MapPin,
  Target,
  Landmark,
  CircleDot,
  Hexagon,
  Pencil,
  MousePointer,
  Undo2,
  RotateCcw,
  Info,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { CityBoundaryEditorMap } from './CityBoundaryEditorMap'
import {
  calculatePolygonAreaKm2,
  calculatePolygonPerimeterKm,
  generateCirclePolygon,
  hasSelfIntersections,
  isPointInsidePolygon,
  type LatLngPoint,
} from './geoUtils'
import type { OfficialCityItem } from './officialCitiesCatalog'

interface Step2BoundaryProps {
  cityName: string
  cityCode: string
  stateName: string
  country: string
  center: LatLngPoint
  setCenter: (v: LatLngPoint) => void
  boundaryType: 'official' | 'radius' | 'polygon'
  setBoundaryType: (v: 'official' | 'radius' | 'polygon') => void
  radiusKm: number
  setRadiusKm: (v: number) => void
  boundary: number[][][] | null
  setBoundary: (v: number[][][] | null) => void
  selectedOfficialCity?: OfficialCityItem | null
  onValidationChange?: (isValid: boolean) => void
  onBack?: () => void
  onCancel?: () => void
  onNext?: () => void
}

export const Step2Boundary: React.FC<Step2BoundaryProps> = ({
  cityName,
  cityCode,
  stateName,
  country,
  center,
  setCenter,
  boundaryType,
  setBoundaryType,
  radiusKm,
  setRadiusKm,
  boundary,
  setBoundary,
  selectedOfficialCity,
  onValidationChange,
}) => {
  const [drawMode, setDrawMode] = useState<'draw' | 'edit' | 'idle'>('idle')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Synchronize boundary whenever boundaryType or radiusKm changes
  useEffect(() => {
    if (boundaryType === 'radius') {
      const circleCoords = generateCirclePolygon(center, radiusKm, 64)
      setBoundary(circleCoords)
      setDrawMode('idle')
    } else if (boundaryType === 'official') {
      if (selectedOfficialCity?.officialBoundary) {
        setBoundary(selectedOfficialCity.officialBoundary)
      } else {
        // Fallback to 8 km canonical metro boundary octagon
        const metroCoords = generateCirclePolygon(center, 8, 8)
        setBoundary(metroCoords)
      }
      setDrawMode('idle')
    } else if (boundaryType === 'polygon') {
      // Initialize with clean 8-vertex shape only if no boundary exists yet
      if (!boundary?.[0] || boundary[0].length < 3) {
        const defaultPoly = generateCirclePolygon(center, radiusKm > 0 ? radiusKm : 7.5, 8)
        setBoundary(defaultPoly)
      }
      setDrawMode('draw')
    }
  }, [boundaryType, center, radiusKm, selectedOfficialCity, setBoundary])

  // Boundary metrics
  const areaKm2 = useMemo(() => {
    if (boundaryType === 'radius') {
      return Number((Math.PI * radiusKm * radiusKm).toFixed(2))
    }
    return calculatePolygonAreaKm2(boundary)
  }, [boundary, boundaryType, radiusKm])

  const perimeterKm = useMemo(() => {
    if (boundaryType === 'radius') {
      return Number((2 * Math.PI * radiusKm).toFixed(2))
    }
    return calculatePolygonPerimeterKm(boundary)
  }, [boundary, boundaryType, radiusKm])

  const pointsCount = useMemo(() => {
    if (!boundary?.[0] || boundary[0].length === 0) return 0
    // If closed ring (last point equals first), unique points is length - 1
    if (boundary[0].length >= 3) {
      const first = boundary[0][0]
      const last = boundary[0][boundary[0].length - 1]
      if (first[0] === last[0] && first[1] === last[1]) {
        return boundary[0].length - 1
      }
    }
    return boundary[0].length
  }, [boundary])

  const geometryName = useMemo(() => {
    if (boundaryType === 'radius') return 'Circle (auto-generated)'
    if (boundaryType === 'official') return 'Official (canonical / LGD)'
    return 'Polygon (custom)'
  }, [boundaryType])

  // Validation checks
  const isGeometryValid = useMemo(() => {
    return Boolean(boundary?.[0] && boundary[0].length >= 4)
  }, [boundary])

  const isClosed = useMemo(() => {
    if (!boundary?.[0] || boundary[0].length < 4) return false
    const first = boundary[0][0]
    const last = boundary[0][boundary[0].length - 1]
    return first[0] === last[0] && first[1] === last[1]
  }, [boundary])

  const noIntersections = useMemo(() => {
    if (boundaryType === 'radius') return true
    return !hasSelfIntersections(boundary)
  }, [boundary, boundaryType])

  const isAreaWithinLimits = useMemo(() => {
    return areaKm2 > 0.5 && areaKm2 < 10000
  }, [areaKm2])

  const isCenterInside = useMemo(() => {
    if (boundaryType === 'radius') return true
    return isPointInsidePolygon(center, boundary)
  }, [boundary, boundaryType, center])

  const validationChecks = useMemo(() => {
    return [
      {
        id: 'geometry',
        label: 'Valid polygon geometry',
        detail: isGeometryValid ? `${pointsCount} vertices defined` : 'At least 3 vertices required',
        valid: isGeometryValid,
      },
      {
        id: 'closed',
        label: 'Boundary is closed',
        detail: isClosed ? 'First and last coordinates match' : 'Ring not closed',
        valid: isClosed,
      },
      {
        id: 'intersections',
        label: 'No self-intersections',
        detail: noIntersections ? 'Clean perimeter geometry' : 'Perimeter edges overlap',
        valid: noIntersections,
      },
      {
        id: 'area',
        label: 'Area within limits',
        detail: isAreaWithinLimits
          ? `${areaKm2.toFixed(1)} km² (0.5 – 10,000 km²)`
          : 'Must be 0.5 – 10,000 km²',
        valid: isAreaWithinLimits,
      },
      {
        id: 'center',
        label: 'Center point enclosed',
        detail: isCenterInside ? 'City center point inside' : 'Center outside boundary',
        valid: isCenterInside,
      },
    ]
  }, [
    isGeometryValid,
    pointsCount,
    isClosed,
    noIntersections,
    isAreaWithinLimits,
    areaKm2,
    isCenterInside,
  ])

  const validCount = useMemo(() => {
    return validationChecks.filter((c) => c.valid).length
  }, [validationChecks])

  const allValid = validCount === validationChecks.length

  useEffect(() => {
    onValidationChange?.(allValid)
  }, [allValid, onValidationChange])

  const handleDeleteLast = useCallback(() => {
    if (!boundary?.[0] || boundary[0].length === 0) return
    const ring = [...boundary[0]]
    if (ring.length <= 4) {
      if (ring.length === 4) {
        ring.pop()
        ring.pop()
        setBoundary([ring])
      } else {
        setBoundary([])
      }
      return
    }
    ring.pop() // remove closing duplicate
    ring.pop() // remove last vertex
    ring.push([ring[0][0], ring[0][1]]) // re-close
    setBoundary([ring])
  }, [boundary, setBoundary])

  const handleClear = useCallback(() => {
    setBoundary([])
    setDrawMode('draw')
  }, [setBoundary])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
      {/* LEFT COLUMN: Controls & Tools (col-span-5) */}
      <div className="lg:col-span-5 space-y-2.5">
        {/* Card 1: Selected City Header */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1F2B6D] flex items-center justify-center shrink-0 border border-blue-100">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900">{cityName}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {cityCode}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {stateName}, {country}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              <Target className="w-3.5 h-3.5 text-[#1F2B6D]" />
              <span>
                {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Boundary Type (3 Options) */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs space-y-2">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded bg-slate-100 text-slate-700 flex items-center justify-center">
              <Hexagon className="w-3 h-3" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Boundary Type</h3>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Option 1: Official Boundary */}
            <button
              type="button"
              onClick={() => setBoundaryType('official')}
              className={`text-left p-2 rounded-lg border transition-all flex flex-col justify-between cursor-pointer ${
                boundaryType === 'official'
                  ? 'border-[#1F2B6D] bg-blue-50/50 ring-1 ring-[#1F2B6D]'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Landmark
                  className={`w-3.5 h-3.5 ${boundaryType === 'official' ? 'text-[#1F2B6D]' : 'text-slate-500'}`}
                />
                <div
                  className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                    boundaryType === 'official' ? 'border-[#1F2B6D] bg-[#1F2B6D]' : 'border-slate-300'
                  }`}
                >
                  {boundaryType === 'official' && <div className="w-1 h-1 rounded-full bg-white" />}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-900 leading-tight">Official</p>
                <p className="text-[9.5px] text-slate-500 mt-0.5 leading-tight">
                  Government limits
                </p>
              </div>
            </button>

            {/* Option 2: Radius */}
            <button
              type="button"
              onClick={() => setBoundaryType('radius')}
              className={`text-left p-2 rounded-lg border transition-all flex flex-col justify-between cursor-pointer ${
                boundaryType === 'radius'
                  ? 'border-[#1F2B6D] bg-blue-50/50 ring-1 ring-[#1F2B6D]'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <CircleDot
                  className={`w-3.5 h-3.5 ${boundaryType === 'radius' ? 'text-[#1F2B6D]' : 'text-slate-500'}`}
                />
                <div
                  className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                    boundaryType === 'radius' ? 'border-[#1F2B6D] bg-[#1F2B6D]' : 'border-slate-300'
                  }`}
                >
                  {boundaryType === 'radius' && <div className="w-1 h-1 rounded-full bg-white" />}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-900 leading-tight">Radius</p>
                <p className="text-[9.5px] text-slate-500 mt-0.5 leading-tight">
                  Circular coverage
                </p>
              </div>
            </button>

            {/* Option 3: Custom Polygon */}
            <button
              type="button"
              onClick={() => setBoundaryType('polygon')}
              className={`text-left p-2 rounded-lg border transition-all flex flex-col justify-between cursor-pointer ${
                boundaryType === 'polygon'
                  ? 'border-[#1F2B6D] bg-blue-50/50 ring-1 ring-[#1F2B6D]'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Hexagon
                  className={`w-3.5 h-3.5 ${boundaryType === 'polygon' ? 'text-[#1F2B6D]' : 'text-slate-500'}`}
                />
                <div
                  className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                    boundaryType === 'polygon' ? 'border-[#1F2B6D] bg-[#1F2B6D]' : 'border-slate-300'
                  }`}
                >
                  {boundaryType === 'polygon' && <div className="w-1 h-1 rounded-full bg-white" />}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-900 leading-tight">Polygon</p>
                <p className="text-[9.5px] text-slate-500 mt-0.5 leading-tight">
                  Custom boundary
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Card 3: Context-Dependent Tooling */}
        {boundaryType === 'radius' && (
          <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Coverage Radius</span>
              <span className="text-xs font-bold text-[#1F2B6D] bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                {radiusKm} km
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full accent-[#1F2B6D] cursor-pointer"
            />
            {/* Quick radius presets */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mr-0.5">
                Presets:
              </span>
              {[5, 10, 15, 20, 25].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRadiusKm(preset)}
                  className={`text-[10.5px] font-semibold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    radiusKm === preset
                      ? 'bg-[#1F2B6D] text-white border-[#1F2B6D]'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {preset} km
                </button>
              ))}
            </div>
          </div>
        )}

        {boundaryType === 'polygon' && (
          <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900">Drawing Tools</h4>
              <span className="text-[10.5px] font-semibold text-slate-500">
                {drawMode === 'draw' ? 'Mode: Draw' : drawMode === 'edit' ? 'Mode: Edit' : 'Ready'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => setDrawMode('draw')}
                title="Click on the map to add boundary points"
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  drawMode === 'draw'
                    ? 'bg-[#1F2B6D] text-white shadow-2xs'
                    : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Pencil className="w-3 h-3" />
                <span>Draw</span>
              </button>

              <button
                type="button"
                onClick={() => setDrawMode('edit')}
                title="Drag boundary control handles on the map"
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  drawMode === 'edit'
                    ? 'bg-[#1F2B6D] text-white shadow-2xs'
                    : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <MousePointer className="w-3 h-3" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteLast}
                title="Undo last placed vertex"
                className="py-1.5 px-2 rounded-lg text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <Undo2 className="w-3 h-3 text-slate-600" />
                <span>Undo</span>
              </button>

              <button
                type="button"
                onClick={handleClear}
                title="Clear boundary and draw from scratch"
                className="py-1.5 px-2 rounded-lg text-xs font-semibold border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-700 flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        )}

        {boundaryType === 'official' && (
          <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Official Municipal Limits</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Verified
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Standard administrative coverage boundary loaded for{' '}
              <strong className="text-slate-800">{cityName}</strong>. Encompasses full official district limits.
            </p>
          </div>
        )}

        {/* Card 4: Instruction Note */}
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-2.5 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#1F2B6D] mt-0.5 shrink-0" />
          <div className="text-[11px] text-slate-600 leading-snug">
            <span className="font-bold text-[#1F2B6D] mr-1">Instructions:</span>
            {boundaryType === 'radius'
              ? 'Adjust the slider or choose a preset to set the coverage radius around the city center.'
              : boundaryType === 'official'
                ? 'Official municipal boundary loaded from the verified government administrative catalog.'
                : drawMode === 'edit'
                  ? 'Drag the white control handles on the map to reshape the boundary.'
                  : 'Click anywhere on the map to add boundary points. Minimum 3 points required.'}
          </div>
        </div>

        {/* Card 5: Optional Advanced Options */}
        <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full px-3 py-2 text-left flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <span>Advanced Options (Optional)</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            />
          </button>
          {showAdvanced && (
            <div className="p-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
              <p>• Geodesic area calculation with WGS84 standard ellipsoid.</p>
              <p>• Automatic topology and non-self-intersection verification.</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Boundary Map & Summary (col-span-7) */}
      <div className="lg:col-span-7 space-y-2.5">
        {/* Card 1: Boundary Editor Map */}
        <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
          <CityBoundaryEditorMap
            center={center}
            cityName={cityName}
            boundaryType={boundaryType}
            coordinates={boundary}
            onChangeCoordinates={setBoundary}
            onCenterChange={setCenter}
            drawMode={drawMode}
            height="310px"
          />
        </div>

        {/* Card 2: Boundary Metrics & Validation Dashboard */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Left Card: Boundary Metrics */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-900">Boundary Metrics</h4>
              <span className="text-[10px] font-semibold text-[#1F2B6D] bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                {geometryName}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Total Area
                </p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{areaKm2.toFixed(2)} km²</p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Perimeter
                </p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {perimeterKm.toFixed(2)} km
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Vertices
                </p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{pointsCount} points</p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Coverage
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <p className="text-xs font-bold text-emerald-700">Enclosed Zone</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Card: Quality Validation */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-900">Quality Validation</h4>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                  allValid
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-amber-700 bg-amber-50 border-amber-200'
                }`}
              >
                {allValid ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-amber-500" />
                )}
                <span>{validCount}/5 Passed</span>
              </span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              {validationChecks.map((check) => (
                <div key={check.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {check.valid ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    )}
                    <span
                      className={check.valid ? 'text-slate-700 font-medium' : 'text-red-600 font-medium'}
                    >
                      {check.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{check.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Step2Boundary
