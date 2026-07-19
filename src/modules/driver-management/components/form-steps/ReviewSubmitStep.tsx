import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { User, MapPin, Car, FileText, CreditCard, Printer, Eye, Edit2 } from 'lucide-react'
import { ImagePreviewModal } from '../ImagePreviewModal'
import type { DriverKycFormData } from '../../schemas'

interface ReviewSubmitStepProps {
  formValues: Partial<DriverKycFormData>
  onEditSection: (tabName: 'bio' | 'identity' | 'vehicle' | 'documents' | 'bank') => void
  onPrint: () => void
}

export const ReviewSubmitStep: React.FC<ReviewSubmitStepProps> = ({
  formValues,
  onEditSection,
  onPrint,
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState('')

  const handlePreview = (url: string, title: string) => {
    if (url) {
      setPreviewImage(url)
      setPreviewTitle(title)
    }
  }

  return (
    <Card className="premium-card relative text-left">
      <CardHeader className="print:hidden pr-52">
        <div>
          <CardTitle>Review & Verify Registration</CardTitle>
          <CardDescription>Verify all driver compliance parameters prior to final registration submission.</CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPrint}
          className="absolute top-6 right-6 gap-2 h-9 border-border font-semibold text-xs rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <Printer className="h-4 w-4 text-slate-500" />
          <span>Print Acknowledgement</span>
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-6">

        {/* Section 1: Personal Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-1.5">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <User className="h-4 w-4" />
              <span>1. Driver Personal Profile</span>
            </h4>
            <button
              type="button"
              onClick={() => onEditSection('bio')}
              className="flex items-center gap-1 text-[10px] text-primary font-bold hover:underline"
            >
              <Edit2 className="h-3 w-3" />
              <span>Edit</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
            <div className="h-20 w-20 rounded-xl bg-slate-100 dark:bg-slate-900 border border-border overflow-hidden flex items-center justify-center">
              {formValues.profilePhotoUrl ? (
                <img src={formValues.profilePhotoUrl} alt="Photo" className="h-full w-full object-cover" />
              ) : (
                <User className="h-6 w-6 text-slate-350" />
              )}
            </div>
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <p><span className="text-muted-foreground font-medium">Full Name:</span> <strong>{formValues.fullName || '—'}</strong></p>
              <p><span className="text-muted-foreground font-medium">Mobile Phone:</span> <strong>{formValues.mobileNumber || '—'}</strong></p>
              <p><span className="text-muted-foreground font-medium">Email:</span> <strong>{formValues.email || '—'}</strong></p>
              <p><span className="text-muted-foreground font-medium">Gender / DOB:</span> <strong>{formValues.gender} / {formValues.dateOfBirth || '—'}</strong></p>
              <p><span className="text-muted-foreground font-medium">Preferred Language:</span> <strong>{formValues.preferredLanguage || '—'}</strong></p>
              <p><span className="text-muted-foreground font-medium">Emergency Contact:</span> <strong>{formValues.emergencyContactName || '—'} ({formValues.emergencyContactNumber || '—'})</strong></p>
            </div>
          </div>

          <div className="pt-2 text-xs">
            <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mt-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>Address:</span>
              <span className="font-normal text-slate-600 dark:text-slate-400 ml-1">
                {formValues.addressLine1}, {formValues.addressLine2 ? `${formValues.addressLine2}, ` : ''}
                {formValues.city}, {formValues.state} - {formValues.postcode} ({formValues.country})
              </span>
            </p>
          </div>
        </div>

        {/* Section 2: Identity Documents */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-border pb-1.5">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              <span>2. Identity Verification Files</span>
            </h4>
            <button
              type="button"
              onClick={() => onEditSection('identity')}
              className="flex items-center gap-1 text-[10px] text-primary font-bold hover:underline"
            >
              <Edit2 className="h-3 w-3" />
              <span>Edit</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <p><span className="text-muted-foreground font-medium">Aadhaar Card Number:</span> <strong>{formValues.aadhaarNumber || '—'}</strong></p>
            <p><span className="text-muted-foreground font-medium">PAN Card Number:</span> <strong>{formValues.panNumber || '—'}</strong></p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
            {[
              { label: 'Aadhaar Front', url: formValues.aadhaarFrontUrl },
              { label: 'Aadhaar Back', url: formValues.aadhaarBackUrl },
              { label: 'PAN Card Scan', url: formValues.panUrl },
              { label: 'Live Selfie', url: formValues.driverSelfieUrl },
            ].map((doc, idx) => (
              <div key={idx} className="border border-border p-2.5 rounded-lg flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <span className="text-[10px] font-semibold truncate pr-2">{doc.label}</span>
                {doc.url ? (
                  <button type="button" onClick={() => handlePreview(doc.url || '', doc.label)} className="p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 border border-border flex-shrink-0">
                    <Eye className="h-3 w-3" />
                  </button>
                ) : (
                  <span className="text-[9px] text-rose-500 font-bold">Missing</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Vehicle details */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-border pb-1.5">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Car className="h-4 w-4" />
              <span>3. Vehicle Specifications</span>
            </h4>
            <button
              type="button"
              onClick={() => onEditSection('vehicle')}
              className="flex items-center gap-1 text-[10px] text-primary font-bold hover:underline"
            >
              <Edit2 className="h-3 w-3" />
              <span>Edit</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-2 text-xs">
            <p><span className="text-muted-foreground font-medium">Vehicle Class:</span> <strong className="uppercase">{formValues.vehicleType || '—'}</strong></p>
            <p><span className="text-muted-foreground font-medium">Category Class:</span> <strong>{formValues.vehicleCategory || '—'}</strong></p>
            <p><span className="text-muted-foreground font-medium">Brand & Make:</span> <strong>{formValues.brand || '—'}</strong></p>
            <p><span className="text-muted-foreground font-medium">Model Variant:</span> <strong>{formValues.model || '—'}</strong></p>
            <p><span className="text-muted-foreground font-medium">Color:</span> <strong>{formValues.color || '—'}</strong></p>
            <p><span className="text-muted-foreground font-medium">Plate Number:</span> <strong className="uppercase">{formValues.registrationNumber || '—'}</strong></p>
            <p><span className="text-muted-foreground font-medium">Manufacturing Year:</span> <strong>{formValues.manufacturingYear || '—'}</strong></p>
            <p><span className="text-muted-foreground font-medium">Seat Capacity:</span> <strong>{formValues.seatCapacity || '—'} Seats</strong></p>
          </div>
        </div>

        {/* Section 4: Vehicle documents */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-border pb-1.5">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              <span>4. Registry & Compliance Documents</span>
            </h4>
            <button
              type="button"
              onClick={() => onEditSection('documents')}
              className="flex items-center gap-1 text-[10px] text-primary font-bold hover:underline"
            >
              <Edit2 className="h-3 w-3" />
              <span>Edit</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Driving License Front', url: formValues.licenseFrontUrl, details: `No: ${formValues.licenseNo}` },
              { label: 'Driving License Back', url: formValues.licenseBackUrl, details: `Exp: ${formValues.licenseExpiry}` },
              { label: 'Vehicle RC Copy', url: formValues.rcUrl, details: `No: ${formValues.rcNumber}` },
              { label: 'Insurance Policy', url: formValues.insuranceUrl, details: `Exp: ${formValues.insuranceExpiry}` },
              { label: 'Commercial Permit', url: formValues.permitUrl, details: `Exp: ${formValues.permitExpiry}` },
              { label: 'Pollution Certificate', url: formValues.pollutionUrl, details: `Exp: ${formValues.pollutionExpiry}` },
              ...(formValues.vehicleType === 'auto' || formValues.vehicleType === 'cab' ? [
                { label: 'Fitness Certificate', url: formValues.fitnessUrl, details: formValues.fitnessExpiry ? `Exp: ${formValues.fitnessExpiry}` : 'Optional' }
              ] : [])
            ].map((doc, idx) => (
              <div key={idx} className="border border-border p-2.5 rounded-lg flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div className="truncate pr-2">
                  <p className="text-[10px] font-semibold truncate">{doc.label}</p>
                  <p className="text-[8px] text-slate-400 truncate">{doc.details}</p>
                </div>
                {doc.url ? (
                  <button type="button" onClick={() => handlePreview(doc.url || '', doc.label)} className="p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 border border-border flex-shrink-0">
                    <Eye className="h-3 w-3" />
                  </button>
                ) : (
                  <span className="text-[9px] text-rose-500 font-bold">Missing</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Bank Details */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-border pb-1.5">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="h-4 w-4" />
              <span>5. Payout Bank account details</span>
            </h4>
            <button
              type="button"
              onClick={() => onEditSection('bank')}
              className="flex items-center gap-1 text-[10px] text-primary font-bold hover:underline"
            >
              <Edit2 className="h-3 w-3" />
              <span>Edit</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <p><span className="text-muted-foreground font-medium">Account Name:</span> <strong>{formValues.bankAccountName || '—'}</strong></p>
            <p><span className="text-muted-foreground font-medium">Bank Name:</span> <strong>{formValues.bankName || '—'}</strong></p>
            <p><span className="text-muted-foreground font-medium">Account Number:</span> <strong>XXXXXX{formValues.bankAccountNumber ? formValues.bankAccountNumber.slice(-4) : '—'}</strong></p>
            <p><span className="text-muted-foreground font-medium">IFSC Code:</span> <strong className="uppercase">{formValues.bankIfsc || '—'}</strong></p>
            {formValues.upiId && <p><span className="text-muted-foreground font-medium">UPI Address:</span> <strong>{formValues.upiId}</strong></p>}
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
