import React from 'react'
import { User, Edit, Check } from 'lucide-react'
import { FileImage } from '@/shared/components/FileImage'

export interface PersonalInfoCardProps {
  name: string
  phone: string
  email: string
  dob: string
  age?: string | number
  gender: string
  language: string
  address: string
  alternatePhone?: string
  bloodGroup?: string
  drivingExperience?: string | number
  photoUrl?: string
  onEdit?: () => void
  className?: string
  editLabel?: string
  isPhoneVerified?: boolean
  showPhoto?: boolean
}

export const PersonalInfoCard: React.FC<PersonalInfoCardProps> = ({
  name,
  phone,
  email,
  dob,
  age = '—',
  gender,
  language,
  address,
  alternatePhone,
  bloodGroup,
  drivingExperience,
  photoUrl,
  onEdit,
  className = '',
  editLabel = 'Edit/View',
  isPhoneVerified = false,
  showPhoto = true,
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
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px] truncate">
              Personal Information
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

        {/* Profile Snapshot Banner (when showPhoto is enabled) */}
        {showPhoto && (
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 mb-3">
            <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs flex items-center justify-center">
              <FileImage
                src={photoUrl}
                alt={name}
                className="w-full h-full object-cover"
                fallback={<User className="w-5 h-5 text-slate-400" />}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-[#1F2B6D] dark:text-white text-[13px] truncate">
                  {name}
                </h4>
                {isPhoneVerified && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-1 py-0.2 rounded-full">
                    <Check className="w-2.5 h-2.5 stroke-[3]" /> Verified
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                {phone}
              </p>
            </div>
          </div>
        )}

        {/* Key-Value Details List */}
        <div className="space-y-1.5 text-[12px]">
          <div className="flex items-baseline justify-between gap-2 py-0.5 border-b border-slate-100/70 dark:border-slate-800/50">
            <span className="text-slate-500 dark:text-slate-400 shrink-0">Full Name</span>
            <span className="font-semibold text-[#1F2B6D] dark:text-slate-200 text-right truncate max-w-[65%]">
              {name}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2 py-0.5 border-b border-slate-100/70 dark:border-slate-800/50">
            <span className="text-slate-500 dark:text-slate-400 shrink-0">Phone Number</span>
            <span className="font-mono font-semibold text-[#1F2B6D] dark:text-slate-200 text-right">
              {phone}
            </span>
          </div>

          {alternatePhone && alternatePhone !== '—' && (
            <div className="flex items-baseline justify-between gap-2 py-0.5 border-b border-slate-100/70 dark:border-slate-800/50">
              <span className="text-slate-500 dark:text-slate-400 shrink-0">Alternate Phone</span>
              <span className="font-mono font-semibold text-[#1F2B6D] dark:text-slate-200 text-right">
                {alternatePhone}
              </span>
            </div>
          )}

          <div className="flex items-baseline justify-between gap-2 py-0.5 border-b border-slate-100/70 dark:border-slate-800/50">
            <span className="text-slate-500 dark:text-slate-400 shrink-0">Email Address</span>
            <span
              className="font-semibold text-[#1F2B6D] dark:text-slate-200 text-right truncate max-w-[65%]"
              title={email}
            >
              {email}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2 py-0.5 border-b border-slate-100/70 dark:border-slate-800/50">
            <span className="text-slate-500 dark:text-slate-400 shrink-0">Date of Birth</span>
            <span className="font-semibold text-[#1F2B6D] dark:text-slate-200 text-right">
              {dob}{' '}
              {age && age !== '—' ? (
                <span className="text-slate-400 font-normal">
                  ({String(age).includes('year') ? age : `${age} yrs`})
                </span>
              ) : null}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2 py-0.5 border-b border-slate-100/70 dark:border-slate-800/50">
            <span className="text-slate-500 dark:text-slate-400 shrink-0">Gender</span>
            <span className="font-semibold text-[#1F2B6D] dark:text-slate-200 text-right">
              {gender}
            </span>
          </div>

          {bloodGroup && bloodGroup !== '—' && (
            <div className="flex items-baseline justify-between gap-2 py-0.5 border-b border-slate-100/70 dark:border-slate-800/50">
              <span className="text-slate-500 dark:text-slate-400 shrink-0">Blood Group</span>
              <span className="font-semibold text-[#1F2B6D] dark:text-slate-200 text-right">
                {bloodGroup}
              </span>
            </div>
          )}

          {drivingExperience && drivingExperience !== '—' && (
            <div className="flex items-baseline justify-between gap-2 py-0.5 border-b border-slate-100/70 dark:border-slate-800/50">
              <span className="text-slate-500 dark:text-slate-400 shrink-0">Driving Exp</span>
              <span className="font-semibold text-[#1F2B6D] dark:text-slate-200 text-right">
                {String(drivingExperience).includes('year')
                  ? drivingExperience
                  : `${drivingExperience} yrs`}
              </span>
            </div>
          )}

          <div className="flex items-baseline justify-between gap-2 py-0.5 border-b border-slate-100/70 dark:border-slate-800/50">
            <span className="text-slate-500 dark:text-slate-400 shrink-0">Language</span>
            <span className="font-semibold text-[#1F2B6D] dark:text-slate-200 text-right uppercase">
              {language}
            </span>
          </div>

          <div className="flex items-start justify-between gap-2 pt-0.5">
            <span className="text-slate-500 dark:text-slate-400 shrink-0">Address</span>
            <span
              className="font-semibold text-[#1F2B6D] dark:text-slate-200 text-right leading-snug line-clamp-2 max-w-[65%]"
              title={address}
            >
              {address}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
