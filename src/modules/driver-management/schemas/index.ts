import { z } from 'zod'
import { phoneSchema, emailSchema } from '@/shared/schemas'

// ─── Registration Action ────────────────────────────────────────────────────
export const registrationActionSchema = z.enum(['submit_for_review', 'approve_immediately'])

// ─── Core Driver KYC Form Schema (6 steps) ────────────────────────────────
export const driverKycFormSchema = z.object({
  // Step 1: Personal Details
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  mobileNumber: phoneSchema,
  email: emailSchema.optional().or(z.string().length(0)),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  dateOfBirth: z.string().min(1, 'Date of birth is required').refine((val) => {
    const date = new Date(val)
    const today = new Date()
    let age = today.getFullYear() - date.getFullYear()
    const m = today.getMonth() - date.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
      age--
    }
    return age >= 18
  }, 'Driver must be at least 18 years old'),
  preferredLanguage: z.string().min(1, 'Preferred language is required'),
  referralCode: z.string().optional().or(z.string().length(0)),

  // Address
  country: z.string().min(1, 'Country is required'),
  state: z.string().min(1, 'State is required'),
  city: z.string().min(1, 'City is required'),
  postcode: z.string().min(3, 'Postcode must be at least 3 digits'),
  addressLine1: z.string().min(3, 'Address Line 1 is required'),
  addressLine2: z.string().optional().or(z.string().length(0)),
  landmark: z.string().optional().or(z.string().length(0)),

  // Emergency Contact
  emergencyContactName: z.string().min(2, 'Emergency contact name is required'),
  emergencyContactNumber: phoneSchema,
  profilePhotoUrl: z.string().url('Invalid profile photo URL').or(z.string().length(0)),

  // Step 2: Identity Verification
  aadhaarNumber: z.string().regex(/^\d{12}$/, 'Aadhaar must be exactly 12 digits'),
  aadhaarFrontUrl: z.string().url('Aadhaar front scan is required').or(z.string().length(0)),
  aadhaarBackUrl: z.string().url('Aadhaar back scan is required').or(z.string().length(0)),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN Card format (e.g. ABCDE1234F)'),
  panUrl: z.string().url('PAN scan is required').or(z.string().length(0)),
  driverSelfieUrl: z.string().url('Selfie upload is required').or(z.string().length(0)),

  // Step 3: Vehicle Information
  vehicleType: z.enum(['cab', 'auto', 'bike', 'carpool']),
  vehicleCategory: z.string().min(1, 'Vehicle category is required'),
  brand: z.string().min(1, 'Vehicle brand is required'),
  model: z.string().min(1, 'Vehicle model is required'),
  color: z.string().min(1, 'Color is required'),
  registrationNumber: z.string().min(4, 'Invalid registration number').regex(/^[A-Z]{2}-\d{2}-[A-Z]{1,2}-\d{4}$/, 'Invalid format (e.g. MH-12-PQ-4567)'),
  manufacturingYear: z.coerce.number().min(2000, 'Manufacturing year must be 2000 or later').max(new Date().getFullYear() + 1, 'Invalid manufacturing year'),
  seatCapacity: z.coerce.number().min(1, 'Seats capacity must be at least 1').max(20, 'Seats capacity cannot exceed 20'),

  // Step 4: Vehicle Documents
  licenseNo: z.string().min(5, 'License number is required'),
  licenseIssueDate: z.string().min(1, 'License issue date is required'),
  licenseExpiry: z.string().min(1, 'License expiry date is required').refine((val) => {
    return new Date(val) > new Date()
  }, 'Expiry date must be in the future'),
  licenseFrontUrl: z.string().url('License front scan is required').or(z.string().length(0)),
  licenseBackUrl: z.string().url('License back scan is required').or(z.string().length(0)),

  rcNumber: z.string().min(5, 'RC number is required'),
  rcUrl: z.string().url('RC scan is required').or(z.string().length(0)),

  insuranceNo: z.string().min(5, 'Insurance policy number is required'),
  insuranceExpiry: z.string().min(1, 'Insurance expiry date is required').refine((val) => {
    return new Date(val) > new Date()
  }, 'Expiry date must be in the future'),
  insuranceUrl: z.string().url('Insurance scan is required').or(z.string().length(0)),

  permitNo: z.string().min(5, 'Permit number is required'),
  permitExpiry: z.string().min(1, 'Permit expiry date is required').refine((val) => {
    return new Date(val) > new Date()
  }, 'Expiry date must be in the future'),
  permitUrl: z.string().url('Permit scan is required').or(z.string().length(0)),

  pollutionNo: z.string().min(5, 'Pollution certificate number is required'),
  pollutionExpiry: z.string().min(1, 'Pollution expiry date is required').refine((val) => {
    return new Date(val) > new Date()
  }, 'Expiry date must be in the future'),
  pollutionUrl: z.string().url('Pollution scan is required').or(z.string().length(0)),

  fitnessNo: z.string().optional().or(z.string().length(0)),
  fitnessExpiry: z.string().optional().or(z.string().length(0)),
  fitnessUrl: z.string().optional().or(z.string().length(0)),

  // Step 5: Bank Details
  bankAccountName: z.string().min(2, 'Account holder name is required'),
  bankAccountNumber: z.string().min(5, 'Bank account number is required'),
  confirmBankAccountNumber: z.string().min(5, 'Please confirm bank account number'),
  bankIfsc: z.string().min(4, 'IFSC code is required'),
  bankName: z.string().min(2, 'Bank name is required'),
  upiId: z.string().optional().or(z.string().length(0)),

  // Step 6: Registration Action
  registrationAction: registrationActionSchema.default('submit_for_review'),
}).refine((data) => data.bankAccountNumber === data.confirmBankAccountNumber, {
  message: 'Bank account numbers do not match',
  path: ['confirmBankAccountNumber'],
})

export type DriverKycFormData = z.infer<typeof driverKycFormSchema>
export type RegistrationAction = z.infer<typeof registrationActionSchema>
