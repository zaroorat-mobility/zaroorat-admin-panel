import { useState } from 'react'
import type { Control, UseFormRegister, UseFormWatch } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { FileUploadField } from '@/shared/components/FileUploadField'
import DatePicker from '@/shared/components/ui/DatePicker'
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
    setPreviewImage(url)
    setPreviewTitle(title)
  }

  const vehicleType = watch('vehicleType')
  const showFitness = vehicleType === 'auto' || vehicleType === 'cab'

  return (
    <Card className="premium-card text-left">
      <CardHeader>
        <CardTitle>Vehicle Compliance Documents</CardTitle>
        <CardDescription>Enter registry document identifiers, validity scopes, and upload digital scans.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
            <Controller
              name="licenseFrontUrl"
              control={control}
              render={({ field }) => (
                <FileUploadField
                  label="DL Front Scan"
                  value={field.value}
                  onChange={field.onChange}
                  purpose="DRIVER_DOCUMENT"
                  required
                  error={errors.licenseFrontUrl?.message}
                  onPreview={handlePreview}
                />
              )}
            />
            <Controller
              name="licenseBackUrl"
              control={control}
              render={({ field }) => (
                <FileUploadField
                  label="DL Back Scan"
                  value={field.value}
                  onChange={field.onChange}
                  purpose="DRIVER_DOCUMENT"
                  required
                  error={errors.licenseBackUrl?.message}
                  onPreview={handlePreview}
                />
              )}
            />
          </div>
        </div>

        <div className="border-t border-border pt-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Registration Certificate (RC)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <Input
              label="RC Certificate Number *"
              placeholder="e.g. RC-MH12PQ4567"
              error={errors.rcNumber?.message}
              {...register('rcNumber')}
            />
            <Controller
              name="rcUrl"
              control={control}
              render={({ field }) => (
                <FileUploadField
                  label="RC Document Scan"
                  value={field.value}
                  onChange={field.onChange}
                  purpose="VEHICLE_DOCUMENT"
                  required
                  error={errors.rcUrl?.message}
                  onPreview={handlePreview}
                />
              )}
            />
          </div>
        </div>

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

            <Controller
              name="insuranceUrl"
              control={control}
              render={({ field }) => (
                <FileUploadField
                  label="Insurance Document"
                  value={field.value}
                  onChange={field.onChange}
                  purpose="VEHICLE_DOCUMENT"
                  required
                  error={errors.insuranceUrl?.message}
                  onPreview={handlePreview}
                />
              )}
            />
          </div>
        </div>

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

            <Controller
              name="permitUrl"
              control={control}
              render={({ field }) => (
                <FileUploadField
                  label="Permit Document"
                  value={field.value}
                  onChange={field.onChange}
                  purpose="VEHICLE_DOCUMENT"
                  required
                  error={errors.permitUrl?.message}
                  onPreview={handlePreview}
                />
              )}
            />
          </div>
        </div>

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

            <Controller
              name="pollutionUrl"
              control={control}
              render={({ field }) => (
                <FileUploadField
                  label="Pollution Certificate"
                  value={field.value}
                  onChange={field.onChange}
                  purpose="VEHICLE_DOCUMENT"
                  required
                  error={errors.pollutionUrl?.message}
                  onPreview={handlePreview}
                />
              )}
            />
          </div>
        </div>

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

              <Controller
                name="fitnessUrl"
                control={control}
                render={({ field }) => (
                  <FileUploadField
                    label="Fitness Certificate"
                    value={field.value || ''}
                    onChange={field.onChange}
                    purpose="VEHICLE_DOCUMENT"
                    error={errors.fitnessUrl?.message}
                    onPreview={handlePreview}
                  />
                )}
              />
            </div>
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
