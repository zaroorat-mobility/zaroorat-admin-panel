import { useState } from 'react'
import type { UseFormRegister, UseFormWatch } from 'react-hook-form'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { Eye, FileText, Image as ImageIcon } from 'lucide-react'
import { ImagePreviewModal } from '../ImagePreviewModal'
import type { DriverKycFormData } from '../../schemas'

interface IdentityVerificationStepProps {
  register: UseFormRegister<DriverKycFormData>
  errors: any
  watch: UseFormWatch<DriverKycFormData>
}

export const IdentityVerificationStep: React.FC<IdentityVerificationStepProps> = ({
  register,
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

  const aadhaarFront = watch('aadhaarFrontUrl')
  const aadhaarBack = watch('aadhaarBackUrl')
  const panUrl = watch('panUrl')
  const selfieUrl = watch('driverSelfieUrl')

  return (
    <Card className="premium-card text-left">
      <CardHeader>
        <CardTitle>Identity Verification</CardTitle>
        <CardDescription>Enter Aadhaar & PAN details and upload clear digital scan copies for identity checks.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Aadhaar Details */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Aadhaar Card Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <Input
              label="Aadhaar Number *"
              placeholder="Enter 12-digit Aadhaar number"
              error={errors.aadhaarNumber?.message}
              {...register('aadhaarNumber')}
            />

            <Input
              label="Aadhaar Front Scan URL *"
              placeholder="Enter image link for Aadhaar front"
              error={errors.aadhaarFrontUrl?.message}
              {...register('aadhaarFrontUrl')}
            />

            <Input
              label="Aadhaar Back Scan URL *"
              placeholder="Enter image link for Aadhaar back"
              error={errors.aadhaarBackUrl?.message}
              {...register('aadhaarBackUrl')}
            />
          </div>

          {/* Aadhaar Previews */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="border border-border rounded-xl p-3.5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Aadhaar Front Scan</p>
                  <p className="text-[10px] text-muted-foreground">{aadhaarFront ? 'Uploaded' : 'No document URL entered'}</p>
                </div>
              </div>
              {aadhaarFront && (
                <button
                  type="button"
                  onClick={() => handlePreview(aadhaarFront, 'Aadhaar Card Front')}
                  className="p-1.5 rounded-lg border border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="border border-border rounded-xl p-3.5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Aadhaar Back Scan</p>
                  <p className="text-[10px] text-muted-foreground">{aadhaarBack ? 'Uploaded' : 'No document URL entered'}</p>
                </div>
              </div>
              {aadhaarBack && (
                <button
                  type="button"
                  onClick={() => handlePreview(aadhaarBack, 'Aadhaar Card Back')}
                  className="p-1.5 rounded-lg border border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* PAN Card Details */}
        <div className="border-t border-border pt-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">PAN Card Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <Input
              label="PAN Card Number *"
              placeholder="e.g. ABCDE1234F"
              error={errors.panNumber?.message}
              {...register('panNumber')}
            />

            <Input
              label="PAN Card Scan URL *"
              placeholder="Enter image link for PAN Card"
              error={errors.panUrl?.message}
              {...register('panUrl')}
            />
          </div>

          {/* PAN Preview Card */}
          <div className="border border-border rounded-xl p-3.5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 max-w-md">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">PAN Card Scan</p>
                <p className="text-[10px] text-muted-foreground">{panUrl ? 'Uploaded' : 'No document URL entered'}</p>
              </div>
            </div>
            {panUrl && (
              <button
                type="button"
                onClick={() => handlePreview(panUrl, 'PAN Card')}
                className="p-1.5 rounded-lg border border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              >
                <Eye className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Driver Selfie */}
        <div className="border-t border-border pt-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Driver Selfie Photo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <Input
              label="Driver Selfie Photo URL *"
              placeholder="Enter image link for selfie"
              error={errors.driverSelfieUrl?.message}
              {...register('driverSelfieUrl')}
            />

            {/* Selfie Preview */}
            <div className="border border-border rounded-xl p-3.5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Driver Live Selfie</p>
                  <p className="text-[10px] text-muted-foreground">{selfieUrl ? 'Uploaded' : 'No selfie URL entered'}</p>
                </div>
              </div>
              {selfieUrl && (
                <button
                  type="button"
                  onClick={() => handlePreview(selfieUrl, 'Driver Live Selfie')}
                  className="p-1.5 rounded-lg border border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
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
