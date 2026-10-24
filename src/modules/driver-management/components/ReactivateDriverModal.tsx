import React, { useState } from 'react'
import { X, CheckCircle2, Info, ChevronDown } from 'lucide-react'
import { FileImage } from '@/shared/components/FileImage'
import type { DriverEntity, DriverDetails } from '../types'

interface ReactivateDriverModalProps {
  isOpen: boolean
  onClose: () => void
  driver: DriverEntity | DriverDetails | null
  onConfirm: (reason: string, details?: string) => Promise<void> | void
  loading?: boolean
}

export const ReactivateDriverModal: React.FC<ReactivateDriverModalProps> = ({
  isOpen,
  onClose,
  driver,
  onConfirm,
  loading = false,
}) => {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [error, setError] = useState('')

  if (!isOpen || !driver) return null

  const driverCode =
    driver.driverCode || `DRV_${driver.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      setError('Please select a reactivation reason.')
      return
    }
    setError('')
    void onConfirm(reason, details.trim() || undefined)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-base font-bold text-[#1F2B6D] dark:text-white tracking-tight">
            Reactivate Driver
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#1F2B6D] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" strokeWidth={2.2} />
          </button>
        </div>

        {/* Driver Profile Card */}
        <div className="flex items-center gap-3.5 px-6 py-2.5">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex-shrink-0 shadow-2xs">
            <FileImage
              src={driver.profilePhotoUrl}
              alt={driver.driverName}
              className="w-full h-full object-cover"
              fallback={
                <span className="w-full h-full flex items-center justify-center font-bold text-sm text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-700">
                  {driver.driverName?.charAt(0)?.toUpperCase() || 'D'}
                </span>
              }
            />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#1F2B6D] dark:text-white leading-tight">
              {driver.driverName}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-normal tracking-tight mt-0.5">
              Driver ID: {driverCode}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-5 pt-1 space-y-4">
          {/* Success Banner */}
          <div className="bg-[#E8F8EE] dark:bg-emerald-950/40 border border-[#BBF7D0] dark:border-emerald-900/60 rounded-xl p-3 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 leading-snug">
              This will reactivate the driver and allow them to
              <br />
              receive ride requests again.
            </p>
          </div>

          {/* Reactivation Reason Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Reactivation Reason <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value)
                  if (error) setError('')
                }}
                className={`w-full h-10 pl-3 pr-8 text-xs bg-white dark:bg-slate-800 border rounded-xl outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] text-slate-800 dark:text-slate-100 transition shadow-2xs appearance-none cursor-pointer ${
                  error
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <option value="">Select a reason</option>
                <option value="COMPLIANCE_VERIFIED">Compliance Verified / Documents Updated</option>
                <option value="SUSPENSION_COMPLETED">Suspension Period Completed</option>
                <option value="APPEAL_APPROVED">Appeal Approved by Admin</option>
                <option value="FALSE_FLAG_RESOLVED">False Flag / System Resolved</option>
                <option value="VEHICLE_INSPECTED">Vehicle Re-inspection Passed</option>
                <option value="DUES_CLEARED">Outstanding Dues Cleared</option>
                <option value="OTHER">Other / Manual Clearance</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {error && <p className="text-[11px] text-red-500 font-medium mt-1">{error}</p>}
          </div>

          {/* Additional Details Textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Additional Details (Optional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Enter additional details..."
              rows={3}
              className="w-full p-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 transition shadow-2xs resize-none"
            />
          </div>

          {/* Bottom Info Notice */}
          <div className="bg-[#EFF6FF] dark:bg-blue-950/30 border border-[#BFDBFE] dark:border-blue-900/60 rounded-xl p-3 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed font-normal">
              Make sure the driver's documents, subscription, and wallet status meet the eligibility
              requirements.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-7 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-[0.98] shadow-2xs transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-7 py-2.5 text-xs font-semibold rounded-xl bg-[#1F2B6D] hover:bg-[#182258] active:scale-[0.98] text-white shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Reactivating...' : 'Reactivate Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReactivateDriverModal
