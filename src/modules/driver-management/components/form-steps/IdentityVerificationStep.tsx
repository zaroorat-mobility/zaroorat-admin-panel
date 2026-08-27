import { useState } from 'react'
import type { Control, UseFormRegister } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { FileUploadField } from '@/shared/components/FileUploadField'
import { ImagePreviewModal } from '../ImagePreviewModal'
import type { DriverKycFormData } from '../../schemas'

interface IdentityVerificationStepProps {
  register: UseFormRegister<DriverKycFormData>
  control: Control<DriverKycFormData>
  errors: any
}

export const IdentityVerificationStep: React.FC<IdentityVerificationStepProps> = ({
  register,
  control,
  errors,
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState('')

  const handlePreview = (url: string, title: string) => {
    setPreviewImage(url)
    setPreviewTitle(title)
  }

  return (
    <Card className="premium-card text-left">
      <CardHeader>
        <CardTitle>Identity Verification</CardTitle>
        <CardDescription>Enter Aadhaar & PAN details and upload clear digital scan copies for identity checks.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Aadhaar Card Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="Aadhaar Number *"
              placeholder="Enter 12-digit Aadhaar number"
              error={errors.aadhaarNumber?.message}
              {...register('aadhaarNumber')}
            />

            <Controller
              name="aadhaarFrontUrl"
              control={control}
              render={({ field }) => (
                <FileUploadField
                  label="Aadhaar Front Scan"
                  value={field.value}
                  onChange={field.onChange}
                  purpose="DRIVER_DOCUMENT"
                  required
                  error={errors.aadhaarFrontUrl?.message}
                  onPreview={handlePreview}
                />
              )}
            />

            <Controller
              name="aadhaarBackUrl"
              control={control}
              render={({ field }) => (
                <FileUploadField
                  label="Aadhaar Back Scan"
                  value={field.value}
                  onChange={field.onChange}
                  purpose="DRIVER_DOCUMENT"
                  required
                  error={errors.aadhaarBackUrl?.message}
                  onPreview={handlePreview}
                />
              )}
            />
          </div>
        </div>

        <div className="border-t border-border pt-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">PAN Card Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="PAN Card Number *"
              placeholder="e.g. ABCDE1234F"
              error={errors.panNumber?.message}
              {...register('panNumber')}
            />

            <Controller
              name="panUrl"
              control={control}
              render={({ field }) => (
                <FileUploadField
                  label="PAN Card Scan"
                  value={field.value}
                  onChange={field.onChange}
                  purpose="DRIVER_DOCUMENT"
                  required
                  error={errors.panUrl?.message}
                  onPreview={handlePreview}
                />
              )}
            />
          </div>
        </div>

        <div className="border-t border-border pt-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Driver Selfie Photo</h3>
          <Controller
            name="driverSelfieUrl"
            control={control}
            render={({ field }) => (
              <FileUploadField
                label="Driver Live Selfie"
                value={field.value}
                onChange={field.onChange}
                purpose="PROFILE_IMAGE"
                variant="avatar"
                required
                error={errors.driverSelfieUrl?.message}
                onPreview={handlePreview}
              />
            )}
          />
        </div>
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
