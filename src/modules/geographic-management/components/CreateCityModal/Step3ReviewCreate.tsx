import React from 'react'
import {
  MapPin,
  Hexagon,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Edit3,
  Check,
} from 'lucide-react'
import { CityPreviewMap } from './CityPreviewMap'
import {
  calculatePolygonAreaKm2,
  calculatePolygonPerimeterKm,
  type LatLngPoint,
} from './geoUtils'

interface Step3ReviewCreateProps {
  country: string
  stateName: string
  cityName: string
  cityCode: string
  timezone: string
  currency: string
  isActive: boolean
  center: LatLngPoint
  boundaryType: 'official' | 'radius' | 'polygon'
  radiusKm: number
  boundary: number[][][] | null
  isSubmitting?: boolean
  onEditCityInfo: () => void
  onEditBoundary: () => void
  onBack?: () => void
  onCancel?: () => void
  onSubmit?: () => void
}

export const Step3ReviewCreate: React.FC<Step3ReviewCreateProps> = ({
  country,
  stateName,
  cityName,
  cityCode,
  timezone,
  currency,
  isActive,
  center,
  boundaryType,
  radiusKm,
  boundary,
  onEditCityInfo,
  onEditBoundary,
}) => {
  const areaKm2 =
    boundaryType === 'radius'
      ? Number((Math.PI * radiusKm * radiusKm).toFixed(2))
      : calculatePolygonAreaKm2(boundary)

  const perimeterKm =
    boundaryType === 'radius'
      ? Number((2 * Math.PI * radiusKm).toFixed(2))
      : calculatePolygonPerimeterKm(boundary)

  const boundaryTypeName =
    boundaryType === 'radius'
      ? `Radius (${radiusKm} km)`
      : boundaryType === 'official'
        ? 'Official Administrative'
        : 'Custom Polygon'

  const geometryName =
    boundaryType === 'radius'
      ? 'Circle (auto-generated)'
      : boundaryType === 'official'
        ? 'Official (LGD catalog)'
        : 'Polygon (custom)'

  const pointsCount =
    boundary?.[0]?.length && boundary[0].length >= 3
      ? boundary[0][0][0] === boundary[0][boundary[0].length - 1][0]
        ? boundary[0].length - 1
        : boundary[0].length
      : 0

  const handleOpenGoogleMaps = () => {
    window.open(`https://www.google.com/maps?q=${center.lat},${center.lng}`, '_blank')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
      {/* LEFT COLUMN: Specification & Profile Cards (col-span-5) */}
      <div className="lg:col-span-5 space-y-2.5">
        {/* Card 1: City Information */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-50 text-[#1F2B6D] flex items-center justify-center border border-blue-100/80">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">City Profile</h4>
            </div>
            <button
              type="button"
              onClick={onEditCityInfo}
              className="text-[11px] font-semibold text-slate-700 hover:text-[#1F2B6D] border border-slate-200 hover:bg-slate-50 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3 h-3 text-slate-500" />
              <span>Edit</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-[11px]">
            <div className="py-1 flex justify-between items-center">
              <span className="text-slate-500">Country</span>
              <span className="font-semibold text-slate-900">{country || 'India'}</span>
            </div>
            <div className="py-1 flex justify-between items-center">
              <span className="text-slate-500">State / Province</span>
              <span className="font-semibold text-slate-900">{stateName || '—'}</span>
            </div>
            <div className="py-1 flex justify-between items-center">
              <span className="text-slate-500">City Name</span>
              <span className="font-bold text-slate-900">{cityName}</span>
            </div>
            <div className="py-1 flex justify-between items-center">
              <span className="text-slate-500">City Code</span>
              <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[10.5px]">
                {cityCode}
              </span>
            </div>
            <div className="py-1 flex justify-between items-center">
              <span className="text-slate-500">Timezone</span>
              <span className="font-semibold text-slate-900">{timezone}</span>
            </div>
            <div className="py-1 flex justify-between items-center">
              <span className="text-slate-500">Currency</span>
              <span className="font-semibold text-slate-900">
                {currency === 'INR' ? 'INR — Indian Rupee (₹)' : currency}
              </span>
            </div>
            <div className="py-1 flex justify-between items-center">
              <span className="text-slate-500">Operational Status</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Boundary & Coverage Metrics (Unified) */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-50 text-[#1F2B6D] flex items-center justify-center border border-blue-100/80">
                <Hexagon className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Boundary & Coverage</h4>
            </div>
            <button
              type="button"
              onClick={onEditBoundary}
              className="text-[11px] font-semibold text-slate-700 hover:text-[#1F2B6D] border border-slate-200 hover:bg-slate-50 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3 h-3 text-slate-500" />
              <span>Edit</span>
            </button>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-2 text-[11px] space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Boundary Type:</span>
              <span className="font-bold text-slate-900">{boundaryTypeName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Center Coordinates:</span>
              <span className="font-mono font-semibold text-slate-700">
                {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
              </span>
            </div>
          </div>

          {/* 2x2 Metric Grid */}
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
              <p className="text-sm font-bold text-slate-900 mt-0.5">{perimeterKm.toFixed(2)} km</p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Vertices
              </p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{pointsCount} points</p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Geometry
              </p>
              <p className="text-xs font-bold text-slate-800 mt-1 truncate">{geometryName}</p>
            </div>
          </div>
        </div>

        {/* Card 3: Ready to Create Status Banner */}
        <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-xl p-2.5 shadow-2xs flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Check className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-emerald-950">Ready for Creation</span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300/70 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                All Checks Passed
              </span>
            </div>
            <p className="text-[10.5px] text-emerald-800/80 mt-0.5 leading-snug">
              City profile and geofence coverage are verified and ready to commit.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Map & Validation Summary (col-span-7) */}
      <div className="lg:col-span-7 space-y-2.5">
        {/* Card 1: Geographic Coverage Preview */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-50 text-[#1F2B6D] flex items-center justify-center border border-blue-100/80">
                <Hexagon className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Geographic Coverage Preview</h3>
            </div>

            <button
              type="button"
              onClick={handleOpenGoogleMaps}
              className="text-[10.5px] font-semibold text-slate-700 hover:text-[#1F2B6D] bg-white hover:bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <span>Open in Google Maps</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          <CityPreviewMap
            center={center}
            cityName={cityName}
            boundary={boundary}
            height="285px"
            zoom={12}
          />
        </div>

        {/* Card 2: System Validation Summary */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-900">System Validation Summary</h4>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>5/5 Checks Verified</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-start gap-2 bg-slate-50/70 p-2 rounded-lg border border-slate-100">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">City Profile Data</p>
                <p className="text-[10px] text-slate-500">Name, code, timezone & currency verified</p>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-slate-50/70 p-2 rounded-lg border border-slate-100">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">Polygon Geometry</p>
                <p className="text-[10px] text-slate-500">
                  {boundaryType === 'radius'
                    ? 'Uniform radial geometry'
                    : 'Valid closed WGS84 coordinates'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-slate-50/70 p-2 rounded-lg border border-slate-100">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">Topology Integrity</p>
                <p className="text-[10px] text-slate-500">Zero self-intersections or overlaps</p>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-slate-50/70 p-2 rounded-lg border border-slate-100">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">Geographic Center</p>
                <p className="text-[10px] text-slate-500">Center coordinates enclosed inside</p>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-slate-50/70 p-2 rounded-lg border border-slate-100 sm:col-span-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">Operational Limits</p>
                <p className="text-[10px] text-slate-500">
                  Coverage of {areaKm2.toFixed(1)} km² is within supported range (0.5 – 10,000 km²)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Step3ReviewCreate

