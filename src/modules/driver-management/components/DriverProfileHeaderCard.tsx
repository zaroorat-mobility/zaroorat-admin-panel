import React from 'react'
import {
  Phone,
  Mail,
  Copy,
  User,
  Calendar,
  Globe,
  MapPin,
  Check,
  Star,
  IdCard,
} from 'lucide-react'
import { FileImage } from '@/shared/components/FileImage'

export interface DriverProfileHeaderCardProps {
  name: string
  phone: string
  email: string
  gender: string
  dob: string
  age?: string | number
  language: string
  location?: string
  progress?: number
  /// What `progress` counts, shown under the bar (e.g. "1 / 3 documents verified").
  progressLabel?: string
  photoUrl?: string
  className?: string
  onCopyPhone?: () => void

  // Profile-specific props
  variant?: 'application' | 'profile'
  driverId?: string
  joinedOn?: string
  rating?: number | string
  totalRides?: number | string
  statusLabel?: string
  isOnDuty?: boolean
}

export const DriverProfileHeaderCard: React.FC<DriverProfileHeaderCardProps> = ({
  name,
  phone,
  email,
  gender,
  dob,
  age = '—',
  language,
  location = '—',
  progress = 0,
  progressLabel,
  photoUrl,
  className = '',
  onCopyPhone,
  variant,
  driverId,
  joinedOn,
  rating = '4.8',
  totalRides,
  statusLabel = 'Active Driver',
  isOnDuty = true,
}) => {
  const isProfileMode = variant === 'profile' || !!driverId

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-col xl:flex-row items-center justify-between gap-4 ${className}`}
    >
      {/* ─── 1. Identity & Contact Section ───────────────────────────────────── */}
      <div className="flex items-center gap-4 flex-1 w-full xl:w-auto">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border-2 border-slate-100 dark:border-slate-700 shadow-sm shrink-0 relative flex items-center justify-center">
            <FileImage
              src={photoUrl}
              alt={name}
              className="w-full h-full object-cover"
              fallback={<User className="w-7 h-7 text-slate-400" />}
            />
          </div>
          {isProfileMode && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 inline-flex items-center gap-0.5 bg-emerald-600 text-white text-[9.5px] font-bold px-2 py-0.5 rounded-full shadow-2xs whitespace-nowrap">
              <Check className="w-2.5 h-2.5 stroke-[3]" /> Verified
            </span>
          )}
        </div>

        {/* Name, Status Badges & Contacts */}
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl font-bold text-[#1F2B6D] dark:text-white tracking-tight truncate">
              {name}
            </h2>

            {isProfileMode && statusLabel && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {statusLabel}
              </span>
            )}

            {isProfileMode && (
              <div
                className={`relative inline-flex items-center h-6 w-[72px] p-0.5 rounded-full select-none shadow-xs ${
                  isOnDuty ? 'bg-[#22C55E]' : 'bg-[#EF4444]'
                }`}
                title={`Driver is currently ${isOnDuty ? 'Online' : 'Offline'}`}
              >
                {/* The sliding white knob */}
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-xs transition-all duration-300 transform ${
                    isOnDuty ? 'left-[50px]' : 'left-0.5'
                  }`}
                />

                {/* Text labels */}
                <span
                  className={`w-full flex items-center text-white font-bold text-[11px] tracking-wide transition-all duration-200 ${
                    isOnDuty ? 'justify-start pl-2' : 'justify-end pr-2'
                  }`}
                >
                  {isOnDuty ? 'Online' : 'Offline'}
                </span>
              </div>
            )}
          </div>

          {/* Contact Details Matching ApplicationReviewPage */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-blue-600 dark:text-blue-400">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium text-[13px] font-mono">{phone}</span>
              {onCopyPhone && (
                <button
                  type="button"
                  onClick={onCopyPhone}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                  title="Copy Phone Number"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium text-[13px] truncate">{email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. Key Attributes Section (Icons & Styling exactly like ApplicationReviewPage) ─── */}
      <div className="flex items-center gap-6 sm:gap-8 flex-1 justify-center xl:justify-start border-t xl:border-t-0 xl:border-l border-slate-100 dark:border-slate-800 pt-3 xl:pt-0 xl:pl-6 w-full xl:w-auto">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <User className="w-[16px] h-[16px] text-[#1F2B6D] dark:text-blue-400 shrink-0" />
            <span className="font-bold text-[#1F2B6D] dark:text-slate-200 text-[13px]">{gender}</span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-[16px] h-[16px] text-[#1F2B6D] dark:text-blue-400 shrink-0" />
            <span className="font-bold text-[#1F2B6D] dark:text-slate-200 text-[13px]">
              {dob} <span className="text-slate-500 font-medium">({age})</span>
            </span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Globe className="w-[16px] h-[16px] text-[#1F2B6D] dark:text-blue-400 shrink-0" />
            <span className="font-bold text-[#1F2B6D] dark:text-slate-200 text-[13px] truncate max-w-[170px]">{language}</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-[16px] h-[16px] text-[#1F2B6D] dark:text-blue-400 shrink-0" />
            <span className="font-bold text-[#1F2B6D] dark:text-slate-200 text-[13px] truncate max-w-[170px]">{location}</span>
          </div>
        </div>
      </div>

      {/* ─── 3. Right Section: Profile Metadata or Application Progress ───────── */}
      {isProfileMode ? (
        <div className="border-t xl:border-t-0 xl:border-l border-slate-100 dark:border-slate-800 pt-3 xl:pt-0 xl:pl-6 flex flex-col justify-center space-y-2.5 shrink-0 min-w-[210px] w-full xl:w-auto">
          <div className="flex items-center gap-2.5">
            <IdCard className="w-[16px] h-[16px] text-[#1F2B6D] dark:text-blue-400 shrink-0" />
            <span className="text-slate-500 text-[12px] font-medium">Driver ID:</span>
            <span className="font-bold text-[#1F2B6D] dark:text-slate-200 text-[13px] font-mono truncate">{driverId}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Star className="w-[16px] h-[16px] text-amber-500 fill-amber-500 shrink-0" />
            <span className="text-slate-500 text-[12px] font-medium">Rating:</span>
            <span className="font-bold text-[#1F2B6D] dark:text-slate-200 text-[13px]">
              ★ {rating} {totalRides ? <span className="text-slate-500 font-medium text-[11px]">({totalRides} rides)</span> : ''}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <Calendar className="w-[16px] h-[16px] text-[#1F2B6D] dark:text-blue-400 shrink-0" />
            <span className="text-slate-500 text-[12px] font-medium">Joined:</span>
            <span className="font-bold text-[#1F2B6D] dark:text-slate-200 text-[13px]">{joinedOn || '—'}</span>
          </div>
        </div>
      ) : (
        <div className="w-64 border-t xl:border-t-0 xl:border-l border-slate-100 dark:border-slate-800 pt-3 xl:pt-0 xl:pl-6 hidden lg:block">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12.5px] text-slate-500 font-medium">Application Progress</span>
            <span className="font-bold text-[#1F2B6D] dark:text-blue-400 text-[13.5px]">
              {progress}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {progressLabel && (
            <span className="text-[11.5px] text-slate-500 font-medium">{progressLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}
