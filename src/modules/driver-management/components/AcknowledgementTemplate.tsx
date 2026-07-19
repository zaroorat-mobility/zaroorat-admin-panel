import React from 'react'
import type { DriverKycFormData } from '../schemas'

interface AcknowledgementTemplateProps {
  id?: string
  formValues: Partial<DriverKycFormData>
}

export const AcknowledgementTemplate: React.FC<AcknowledgementTemplateProps> = ({
  id = 'KYC-NEW',
  formValues
}) => {
  return (
    <div className="printable-acknowledgement hidden text-left max-w-3xl mx-auto p-10 bg-white text-slate-900 border border-slate-300 font-sans">
      {/* PDF Header Logo Banner */}
      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-6 mb-8">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">ZAROORAT MOBILITY</h1>
          <p className="text-[10px] tracking-widest text-slate-500 uppercase font-semibold">Driver Partner KYC Acknowledgement Receipt</p>
        </div>
        <div className="text-right text-xs space-y-0.5">
          <p><strong>Receipt Date:</strong> {new Date().toLocaleDateString('en-IN')}</p>
          <p><strong>Reference ID:</strong> KYC-{id || Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
          <p><strong>Status:</strong> Pre-registered (Audit Pending)</p>
        </div>
      </div>

      {/* Prefilled driver registration details and photo side-by-side */}
      <div className="space-y-8">
        <div>
          <h2 className="text-sm font-bold bg-slate-100 p-2 uppercase border border-slate-200 mb-4">1. Personal Profile Details</h2>
          <div className="flex items-start justify-between border border-slate-200 p-4 rounded-xl mb-4">
            <div className="grid grid-cols-2 gap-y-3 text-xs flex-grow">
              <p><span className="text-slate-500">Driver Partner Name:</span> <strong className="text-slate-800">{formValues.fullName || '—'}</strong></p>
              <p><span className="text-slate-500">Contact Number:</span> <strong className="text-slate-800">{formValues.mobileNumber || '—'}</strong></p>
              <p><span className="text-slate-500">Email Address:</span> <strong className="text-slate-800">{formValues.email || '—'}</strong></p>
              <p><span className="text-slate-500">Gender / Date of Birth:</span> <strong className="text-slate-800">{formValues.gender} / {formValues.dateOfBirth || '—'}</strong></p>
              <p><span className="text-slate-500">Preferred Language:</span> <strong className="text-slate-800">{formValues.preferredLanguage || '—'}</strong></p>
              <p><span className="text-slate-500">Emergency Contact:</span> <strong className="text-slate-800">{formValues.emergencyContactName} ({formValues.emergencyContactNumber})</strong></p>
            </div>
            <div className="h-24 w-24 rounded-lg border border-slate-350 overflow-hidden bg-slate-50 flex-shrink-0 ml-6 flex items-center justify-center">
              {formValues.profilePhotoUrl ? (
                <img src={formValues.profilePhotoUrl} alt="Driver Profile" className="h-full w-full object-cover" />
              ) : (
                <div className="text-[10px] text-slate-400">No Photo</div>
              )}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold bg-slate-100 p-2 uppercase border border-slate-200 mb-4">2. Current Residence Address</h2>
          <div className="grid grid-cols-2 gap-y-3 text-xs px-2">
            <p className="col-span-2"><span className="text-slate-500">Address Line 1:</span> <strong className="text-slate-800">{formValues.addressLine1 || '—'}</strong></p>
            {formValues.addressLine2 && <p className="col-span-2"><span className="text-slate-500">Address Line 2:</span> <strong className="text-slate-800">{formValues.addressLine2}</strong></p>}
            <p><span className="text-slate-500">City / District:</span> <strong className="text-slate-800">{formValues.city || '—'}</strong></p>
            <p><span className="text-slate-500">State / Region:</span> <strong className="text-slate-800">{formValues.state || '—'}</strong></p>
            <p><span className="text-slate-500">Pin Code / Country:</span> <strong className="text-slate-800">{formValues.postcode || '—'} ({formValues.country || '—'})</strong></p>
            {formValues.landmark && <p><span className="text-slate-500">Nearest Landmark:</span> <strong className="text-slate-800">{formValues.landmark}</strong></p>}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold bg-slate-100 p-2 uppercase border border-slate-200 mb-4">3. Transport Asset Specifications</h2>
          <div className="grid grid-cols-2 gap-y-3 text-xs px-2">
            <p><span className="text-slate-500">Vehicle Type Class:</span> <strong className="text-slate-800 uppercase">{formValues.vehicleType || '—'}</strong></p>
            <p><span className="text-slate-500">Brand / Model Variant:</span> <strong className="text-slate-800">{formValues.brand} {formValues.model || '—'}</strong></p>
            <p><span className="text-slate-500">Registration Plate Code:</span> <strong className="text-slate-800 uppercase">{formValues.registrationNumber || '—'}</strong></p>
            <p><span className="text-slate-500">Exterior Color / Seats:</span> <strong className="text-slate-800">{formValues.color || '—'} ({formValues.seatCapacity} seats Capacity)</strong></p>
            <p><span className="text-slate-500">Manufacturing Year:</span> <strong className="text-slate-800">{formValues.manufacturingYear || '—'}</strong></p>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold bg-slate-100 p-2 uppercase border border-slate-200 mb-4">4. Compliance Document Checklists</h2>
          <div className="space-y-2.5 text-xs px-2">
            {[
              { label: 'Driving License Front', file: formValues.licenseFrontUrl, docNum: formValues.licenseNo },
              { label: 'Driving License Back', file: formValues.licenseBackUrl, docNum: formValues.licenseNo },
              { label: 'Aadhaar Card Front', file: formValues.aadhaarFrontUrl, docNum: formValues.aadhaarNumber },
              { label: 'Aadhaar Card Back', file: formValues.aadhaarBackUrl, docNum: formValues.aadhaarNumber },
              { label: 'PAN Card', file: formValues.panUrl, docNum: formValues.panNumber },
              { label: 'Vehicle Registration Certificate (RC)', file: formValues.rcUrl, docNum: formValues.rcNumber },
              { label: 'Vehicle Insurance Cover', file: formValues.insuranceUrl, docNum: formValues.insuranceNo },
              { label: 'Commercial Road Permit', file: formValues.permitUrl, docNum: formValues.permitNo },
              { label: 'Pollution Under Control (PUC) Certificate', file: formValues.pollutionUrl, docNum: formValues.pollutionNo },
              { label: 'Fitness Certificate (only Auto/Cab)', file: formValues.fitnessUrl, docNum: formValues.fitnessNo }
            ].map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-3">
                  <span className="border border-slate-400 rounded h-4 w-4 flex items-center justify-center font-bold text-[10px]">
                    {doc.file ? '✓' : ' '}
                  </span>
                  <span>{doc.label}</span>
                </div>
                <span className="text-slate-500 text-[10px]">Doc No: {doc.docNum || '—'}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold bg-slate-100 p-2 uppercase border border-slate-200 mb-4">5. Bank Details</h2>
          <div className="grid grid-cols-2 gap-y-3 text-xs px-2">
            <p><span className="text-slate-500">Account Holder Name:</span> <strong className="text-slate-800">{formValues.bankAccountName || '—'}</strong></p>
            <p><span className="text-slate-500">Bank Name:</span> <strong className="text-slate-800">{formValues.bankName || '—'}</strong></p>
            <p><span className="text-slate-500">Account Number:</span> <strong className="text-slate-800">XXXXXX{formValues.bankAccountNumber ? formValues.bankAccountNumber.slice(-4) : '—'}</strong></p>
            <p><span className="text-slate-500">IFSC Code:</span> <strong className="text-slate-800 uppercase">{formValues.bankIfsc || '—'}</strong></p>
            {formValues.upiId && <p><span className="text-slate-500">UPI Address:</span> <strong className="text-slate-800">{formValues.upiId}</strong></p>}
          </div>
        </div>
      </div>

      {/* PDF Footer signatures */}
      <div className="grid grid-cols-2 pt-16 mt-16 border-t border-slate-200 text-xs">
        <div>
          <div className="h-10 border-b border-slate-400 w-44 mx-0" />
          <p className="mt-2 text-slate-500 font-medium">Driver Applicant Signature</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="h-10 border-b border-slate-400 w-44" />
          <p className="mt-2 text-slate-500 font-medium">Authorized KYC Officer Signature</p>
        </div>
      </div>
    </div>
  )
}
