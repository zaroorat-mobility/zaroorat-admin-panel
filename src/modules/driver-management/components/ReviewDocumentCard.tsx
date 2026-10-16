import React from 'react'
import { Check, CheckCircle2, Clock, RefreshCw, X, Eye, MoreVertical, Image as ImageIcon } from 'lucide-react'
import { FileImage } from '@/shared/components/FileImage'

export interface ReviewDocumentCardProps {
  id: string
  name: string
  number?: string
  status: string
  image?: string
  expiryDate?: string
  uploaded?: string
  variant?: 'compact' | 'standard'
  onClick?: () => void
  className?: string
}

export const ReviewDocumentCard: React.FC<ReviewDocumentCardProps> = ({
  name,
  number,
  status,
  image,
  expiryDate,
  uploaded,
  variant = 'compact',
  onClick,
  className = '',
}) => {
  const isVerified = status === 'Verified' || status === 'approved'
  const isPending = status === 'Pending Review' || status === 'pending'
  const isReupload = status === 'Re-upload Required' || status === 'reupload_requested'
  const isRejected = status === 'Rejected' || status === 'rejected'

  if (variant === 'compact') {
    return (
      <div
        onClick={onClick}
        className={`group p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-slate-900 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-xs select-none ${className}`}
      >
        <div className="relative aspect-[16/10] min-h-[88px] rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 mb-2 flex items-center justify-center">
          <FileImage
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            fallback={<ImageIcon className="w-7 h-7 text-slate-300" />}
          />
          <div
            className={`absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center shadow-xs text-white ${
              isVerified
                ? 'bg-emerald-500'
                : isPending
                  ? 'bg-amber-500'
                  : isReupload
                    ? 'bg-orange-500'
                    : 'bg-rose-500'
            }`}
          >
            {isVerified && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            {isPending && <Clock className="w-2.5 h-2.5 stroke-[2.5]" />}
            {isReupload && <RefreshCw className="w-2.5 h-2.5 stroke-[2.5]" />}
            {isRejected && <X className="w-2.5 h-2.5 stroke-[3]" />}
          </div>
        </div>

        <div className="flex items-center justify-between gap-1.5 pt-0.5">
          <span
            className="font-bold text-[#1F2B6D] dark:text-slate-200 text-[11.5px] truncate"
            title={name}
          >
            {name}
          </span>
          <span
            className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0 ${
              isVerified
                ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40'
                : isPending
                  ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/40'
                  : isReupload
                    ? 'text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-800/40'
                    : 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/40'
            }`}
          >
            {isVerified && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            {status}
          </span>
        </div>
      </div>
    )
  }

  // Standard variant for Documents page
  return (
    <div
      onClick={onClick}
      className={`border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white dark:bg-slate-900 flex flex-col group cursor-pointer select-none ${className}`}
    >
      <div className="h-32 bg-slate-50 dark:bg-slate-800/50 p-2 relative flex items-center justify-center border-b border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="w-full h-full bg-white dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity overflow-hidden">
          <FileImage
            src={image}
            alt={name}
            className="w-full h-full object-cover"
            fallback={<ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />}
          />
        </div>
        <div className="absolute top-3 right-3">
          <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center border border-slate-100 dark:border-slate-700">
            {isVerified && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            {isPending && <Clock className="w-4 h-4 text-amber-500" />}
            {isReupload && <RefreshCw className="w-4 h-4 text-orange-500" />}
            {isRejected && <X className="w-4 h-4 text-red-500" />}
          </div>
        </div>
      </div>

      <div className="p-3.5 flex flex-col flex-1">
        <h4 className="font-bold text-[#1F2B6D] dark:text-white text-[13.5px] leading-tight mb-1 truncate">
          {name}
        </h4>
        <div className="text-[12px] text-slate-500 dark:text-slate-400 mb-2 space-y-0.5 font-medium">
          {number && <p className="truncate text-[#1F2B6D] dark:text-slate-300 font-mono">{number}</p>}
          {expiryDate && <p>Expires: {expiryDate}</p>}
        </div>

        <div className="mt-auto flex items-center gap-1.5 mb-2.5">
          <span
            className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
              isVerified
                ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                : isPending
                  ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                  : isReupload
                    ? 'text-orange-600 bg-orange-50 dark:bg-orange-900/20'
                    : 'text-red-600 bg-red-50 dark:bg-red-900/20'
            }`}
          >
            {isVerified && <CheckCircle2 className="w-3 h-3" />}
            {isPending && <Clock className="w-3 h-3" />}
            {isReupload && <RefreshCw className="w-3 h-3" />}
            {isRejected && <X className="w-3 h-3" />}
            {status}
          </span>
        </div>

        {uploaded && (
          <div className="text-[10px] text-slate-400 font-medium mb-3">
            Uploaded: {uploaded}
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-auto">
          <button
            type="button"
            className="text-[#1F2B6D] dark:text-blue-400 font-bold text-[12px] flex items-center gap-1.5 hover:text-blue-600 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              onClick?.()
            }}
          >
            <Eye className="w-3.5 h-3.5" /> View Document
          </button>
          <button
            type="button"
            className="text-slate-400 hover:text-[#1F2B6D] dark:hover:text-white"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
