import { useState } from 'react'
import type { UseFormRegister, Control, UseFormWatch } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import DatePicker from '@/shared/components/ui/DatePicker'
import { Eye, FileText } from 'lucide-react'
import { ImagePreviewModal } from '../ImagePreviewModal'
import type { DriverKycFormData } from '../../schemas'

interface VehicleDocsStepProps {
  register: UseFormRegister<DriverKycFormData>
  control: Control<DriverKycFormData>
  errors: any
  watch: UseFormWatch<DriverKycFormData>
}

export const VehicleDocsStep: React.FC<VehicleDocsStepProps> = ({
  register,
  control,
  errors,
  watch,
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState('')

  const handlePreview = (url: string, title: string) => {
    if (url) {
      setPreviewImage(url)
      setPreviewTitle(title)
    }
  }

  // Watch vehicleType to conditionally render Fitness Certificate
  const vehicleType = watch('vehicleType')
  const showFitness = vehicleType === 'auto' || vehicleType === 'cab'

  // Document URLs to show previews
  const dlFront = watch('licenseFrontUrl')
  const dlBack = watch('licenseBackUrl')
  const rcUrl = watch('rcUrl')
  const insuranceUrl = watch('insuranceUrl')
  const permitUrl = watch('permitUrl')
  const pollutionUrl = watch('pollutionUrl')
  const fitnessUrl = watch('fitnessUrl')

  return (
    <Card className="premium-card text-left">
      <CardHeader>
        <CardTitle>Vehicle Compliance Documents</CardTitle>
        <CardDescription>Enter registry document identifiers, validity scopes, and upload digital scans.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Driving License Details */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Driving License Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <Input
              label="License Number *"
              placeholder="e.g. DL-MH1220150045612"
              error={errors.licenseNo?.message}
              {...register('licenseNo')}
            />

            <Controller
              name="licenseIssueDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="License Issue Date *"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.licenseIssueDate?.message}
                />
              )}
            />

            <Controller
              name="licenseExpiry"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="License Expiry Date *"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.licenseExpiry?.message}
                />
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <Input
              label="DL Front Scan URL *"
              placeholder="Enter DL Front image link"
              error={errors.licenseFrontUrl?.message}
              {...register('licenseFrontUrl')}
            />
            <Input
              label="DL Back Scan URL *"
              placeholder="Enter DL Back image link"
              error={errors.licenseBackUrl?.message}
              {...register('licenseBackUrl')}
            />
          </div>

          {/* DL Previews */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="border border-border rounded-xl p-3 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-primary" />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">DL Front Scan</span>
              </div>
              {dlFront && (
                <button type="button" onClick={() => handlePreview(dlFront, 'Driving License Front')} className="p-1 rounded border border-border text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <Eye className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="border border-border rounded-xl p-3 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-primary" />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">DL Back Scan</span>
              </div>
              {dlBack && (
                <button type="button" onClick={() => handlePreview(dlBack, 'Driving License Back')} className="p-1 rounded border border-border text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <Eye className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RC Details */}
        <div className="border-t border-border pt-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Registration Certificate (RC)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <Input
              label="RC Certificate Number *"
              placeholder="e.g. RC-MH12PQ4567"
              error={errors.rcNumber?.message}
              {...register('rcNumber')}
            />
            <Input
              label="RC File URL *"
              placeholder="Enter RC Image Link"
              error={errors.rcUrl?.message}
              {...register('rcUrl')}
            />
          </div>
          {rcUrl && (
            <div className="border border-border rounded-xl p-3 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 max-w-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-primary" />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">RC Document Scan</span>
              </div>
              <button type="button" onClick={() => handlePreview(rcUrl, 'Registration Certificate')} className="p-1 rounded border border-border text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                <Eye className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Insurance details */}
        <div className="border-t border-border pt-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Vehicle Insurance Policy</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <Input
              label="Policy Number *"
              placeholder="e.g. INS-POL-987654"
              error={errors.insuranceNo?.message}
              {...register('insuranceNo')}
            />

            <Controller
              name="insuranceExpiry"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Policy Expiry Date *"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.insuranceExpiry?.message}
                />
              )}
            />

            <Input
              label="Insurance Document URL *"
              placeholder="Enter Insurance Image Link"
              error={errors.insuranceUrl?.message}
              {...register('insuranceUrl')}
            />
          </div>
          {insuranceUrl && (
            <div className="border border-border rounded-xl p-3 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 max-w-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-primary" />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">Insurance Cover Scan</span>
              </div>
              <button type="button" onClick={() => handlePreview(insuranceUrl, 'Insurance Policy Cover')} className="p-1 rounded border border-border text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                <Eye className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Road Permit */}
        <div className="border-t border-border pt-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Commercial Road Permit</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <Input
              label="Permit Number *"
              placeholder="e.g. PRM-SRINAGAR-7712"
              error={errors.permitNo?.message}
              {...register('permitNo')}
            />

            <Controller
              name="permitExpiry"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Permit Expiry Date *"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.permitExpiry?.message}
                />
              )}
            />

            <Input
              label="Permit Document URL *"
              placeholder="Enter Permit Image Link"
              error={errors.permitUrl?.message}
              {...register('permitUrl')}
            />
          </div>
          {permitUrl && (
            <div className="border border-border rounded-xl p-3 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 max-w-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-primary" />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">Road Permit Scan</span>
              </div>
              <button type="button" onClick={() => handlePreview(permitUrl, 'Road Permit')} className="p-1 rounded border border-border text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                <Eye className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Pollution Certificate */}
        <div className="border-t border-border pt-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Pollution Under Control (PUC) Certificate</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <Input
              label="Pollution Certificate Number *"
              placeholder="e.g. POL-332145"
              error={errors.pollutionNo?.message}
              {...register('pollutionNo')}
            />

            <Controller
              name="pollutionExpiry"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Certificate Expiry Date *"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.pollutionExpiry?.message}
                />
              )}
            />

            <Input
              label="Certificate Document URL *"
              placeholder="Enter Pollution Image Link"
              error={errors.pollutionUrl?.message}
              {...register('pollutionUrl')}
            />
          </div>
          {pollutionUrl && (
            <div className="border border-border rounded-xl p-3 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 max-w-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-primary" />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">Pollution Certificate Scan</span>
              </div>
              <button type="button" onClick={() => handlePreview(pollutionUrl, 'Pollution Certificate')} className="p-1 rounded border border-border text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                <Eye className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Fitness Certificate (Only for Auto/Cab) */}
        {showFitness && (
          <div className="border-t border-border pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Vehicle Fitness Certificate</h3>
              <span className="text-[10px] bg-slate-150 text-slate-700 px-2 py-0.5 rounded-full font-bold dark:bg-slate-800 dark:text-slate-300">Auto & Cab Only</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <Input
                label="Fitness Certificate Number"
                placeholder="e.g. FIT-554321"
                error={errors.fitnessNo?.message}
                {...register('fitnessNo')}
              />

              <Controller
                name="fitnessExpiry"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="Certificate Expiry Date"
                    value={field.value || ''}
                    onChange={field.onChange}
                    error={errors.fitnessExpiry?.message}
                  />
                )}
              />

              <Input
                label="Certificate Document URL"
                placeholder="Enter Fitness Image Link"
                error={errors.fitnessUrl?.message}
                {...register('fitnessUrl')}
              />
            </div>
            {fitnessUrl && (
              <div className="border border-border rounded-xl p-3 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 max-w-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4.5 w-4.5 text-primary" />
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200">Fitness Certificate Scan</span>
                </div>
                <button type="button" onClick={() => handlePreview(fitnessUrl, 'Fitness Certificate')} className="p-1 rounded border border-border text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

      </CardContent>

      <ImagePreviewModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage || ''}
        title={previewTitle}
      />
    </Card>
  )
}
