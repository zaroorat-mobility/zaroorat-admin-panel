import React from 'react'
import { Car, Edit } from 'lucide-react'
import { FileImage } from '@/shared/components/FileImage'
import photoFrontShowcase from '@/assets/images/vehicle-showcase/photo-front.png'

export interface VehicleInfoCardProps {
  vehicleType: string
  brand: string
  model: string
  registrationPlate: string
  color: string
  manufacturingYear: string | number
  fuelType?: string
  seatsCapacity?: string | number
  vehicleCategory?: string
  permitType?: string
  photoUrl?: string
  onEdit?: () => void
  onPreviewPhoto?: () => void
  className?: string
  editLabel?: string
}

export const VehicleInfoCard: React.FC<VehicleInfoCardProps> = ({
  vehicleType,
  brand,
  model,
  registrationPlate,
  color,
  manufacturingYear,
  fuelType,
  seatsCapacity,
  vehicleCategory,
  permitType,
  photoUrl,
  onEdit,
  onPreviewPhoto,
  className = '',
  editLabel = 'Edit/View',
}) => {
  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm flex flex-col justify-between h-full overflow-hidden ${className}`}
    >
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center shadow-2xs shrink-0">
              <Car className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px] truncate">
              Vehicle Information
            </h3>
          </div>
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="px-3 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-md font-semibold text-slate-700 dark:text-slate-300 hover:border-[#1F2B6D] hover:text-[#1F2B6D] dark:hover:border-[#8B93D9] dark:hover:text-[#8B93D9] hover:bg-[#1F2B6D]/5 transition shadow-2xs cursor-pointer shrink-0 flex items-center gap-1"
            >
              <Edit className="w-3 h-3" /> {editLabel}
            </button>
          )}
        </div>

        {/* Vehicle Snapshot Banner with Frontend/Front Vehicle Image */}
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 mb-3">
          <div 
            className={`w-14 h-11 rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 shadow-2xs ${
              onPreviewPhoto ? 'cursor-pointer hover:ring-2 hover:ring-[#1F2B6D]/40 transition' : ''
            }`}
            onClick={onPreviewPhoto}
            title={onPreviewPhoto ? 'Click to inspect vehicle front photo' : undefined}
          >
            <FileImage
              src={photoUrl || photoFrontShowcase}
              alt="Vehicle Front Preview"
              className="w-full h-full object-cover rounded"
              fallback={
                <img
                  src={photoFrontShowcase}
                  alt="Vehicle Front Preview"
                  className="w-full h-full object-cover rounded"
                />
              }
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="px-2 py-0.5 rounded border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-[11px] font-bold font-mono tracking-wider text-[#1F2B6D] dark:text-blue-300 shadow-2xs inline-block">
              {registrationPlate}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate capitalize">
              {brand} {model} {color && color !== '—' ? `• ${color}` : ''}
            </p>
          </div>
        </div>

        {/* Key-Value Details List */}
        <div className="space-y-1.5 text-[12px]">
          <div className="flex items-baseline justify-between gap-2 py-0.5 border-b border-slate-100/70 dark:border-slate-800/50">
            <span className="text-slate-500 dark:text-slate-400 shrink-0">Vehicle Type</span>
            <span className="font-semibold text-[#1F2B6D] dark:text-slate-200 capitalize text-right">
              {vehicleType}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2 py-0.5 border-b border-slate-100/70 dark:border-slate-800/50">
            <span className="text-slate-500 dark:text-slate-400 shrink-0">Make & Model</span>
            <span className="font-semibold text-[#1F2B6D] dark:text-slate-200 capitalize text-right truncate max-w-[65%]">
              {brand} {model}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2 py-0.5 border-b border-slate-100/70 dark:border-slate-800/50">
            <span className="text-slate-500 dark:text-slate-400 shrink-0">Registration Number</span>
            <span className="font-mono font-semibold text-[#1F2B6D] dark:text-slate-200 text-right">
              {registrationPlate}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2 py-0.5 border-b border-slate-100/70 dark:border-slate-800/50">
            <span className="text-slate-500 dark:text-slate-400 shrink-0">Color</span>
            <span className="font-semibold text-[#1F2B6D] dark:text-slate-200 capitalize text-right">
              {color}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2 py-0.5 border-b border-slate-100/70 dark:border-slate-800/50">
            <span className="text-slate-500 dark:text-slate-400 shrink-0">Manufacturing Year</span>
            <span className="font-semibold text-[#1F2B6D] dark:text-slate-200 text-right">
              {manufacturingYear}
            </span>
          </div>

          {fuelType && fuelType !== '—' && (
            <div className="flex items-baseline justify-between gap-2 py-0.5 border-b border-slate-100/70 dark:border-slate-800/50">
              <span className="text-slate-500 dark:text-slate-400 shrink-0">Fuel Type</span>
              <span className="font-semibold text-[#1F2B6D] dark:text-slate-200 capitalize text-right">
                {fuelType}
              </span>
            </div>
          )}

          {seatsCapacity && (
            <div className="flex items-baseline justify-between gap-2 py-0.5 border-b border-slate-100/70 dark:border-slate-800/50">
              <span className="text-slate-500 dark:text-slate-400 shrink-0">Seating Capacity</span>
              <span className="font-semibold text-[#1F2B6D] dark:text-slate-200 text-right">
                {seatsCapacity} Seats
              </span>
            </div>
          )}

          {permitType && (
            <div className="flex items-baseline justify-between gap-2 py-0.5 border-b border-slate-100/70 dark:border-slate-800/50">
              <span className="text-slate-500 dark:text-slate-400 shrink-0">Permit Type</span>
              <span className="font-semibold text-[#1F2B6D] dark:text-slate-200 text-right">
                {permitType}
              </span>
            </div>
          )}

          {vehicleCategory && (
            <div className="flex items-baseline justify-between gap-2 py-0.5 border-b border-slate-100/70 dark:border-slate-800/50">
              <span className="text-slate-500 dark:text-slate-400 shrink-0">Category</span>
              <span className="font-semibold text-[#1F2B6D] dark:text-slate-200 capitalize text-right">
                {vehicleCategory}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
