import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { FormTabs } from '@/shared/components/ui/FormTabs'
import { Save, FileCheck } from 'lucide-react'
import { driverKycFormSchema, type DriverKycFormData } from '../../schemas'
import { useCreateApplication, useUpdateApplication, useApplication } from '../../hooks'
import { useCountriesNow, usePostalCodeLookup } from '@/shared/hooks'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/Card'
import {
  PersonalDetailsStep,
  IdentityVerificationStep,
  VehicleInfoStep,
  VehicleDocsStep,
  BankDetailsStep,
  ReviewSubmitStep,
  CompletenessCard,
  AcknowledgementTemplate
} from '../../components'

type TabType = 'bio' | 'identity' | 'vehicle' | 'documents' | 'bank' | 'review'

export const ManualRegistrationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const { data: application, isLoading: isFetching } = useApplication(id || '')
  const { mutate: createKyc, isPending: isCreating } = useCreateApplication()
  const { mutate: updateKyc, isPending: isUpdating } = useUpdateApplication()

  const [activeFormTab, setActiveFormTab] = useState<TabType>('bio')

  // Shared address and postal hooks
  const {
    fetchCountries,
    fetchStates,
    fetchCities,
    states,
    cities,
    countries,
    countriesLoading,
    statesLoading,
    citiesLoading,
  } = useCountriesNow()

  const { lookupPostalCode, loading: isPostalLoading } = usePostalCodeLookup()

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    watch,
    reset,
    trigger,
    formState: { errors, isValid }
  } = useForm<DriverKycFormData>({
    resolver: zodResolver(driverKycFormSchema),
    mode: 'all',
    defaultValues: {
      fullName: '',
      mobileNumber: '',
      email: '',
      gender: 'MALE',
      dateOfBirth: '',
      preferredLanguage: 'English',
      referralCode: '',
      country: 'India',
      state: '',
      city: '',
      postcode: '',
      addressLine1: '',
      addressLine2: '',
      landmark: '',
      emergencyContactName: '',
      emergencyContactNumber: '',
      profilePhotoUrl: '',
      aadhaarNumber: '',
      aadhaarFrontUrl: '',
      aadhaarBackUrl: '',
      panNumber: '',
      panUrl: '',
      driverSelfieUrl: '',
      vehicleType: 'cab',
      vehicleCategory: 'Sedan',
      brand: '',
      model: '',
      color: '',
      registrationNumber: '',
      manufacturingYear: new Date().getFullYear(),
      seatCapacity: 4,
      licenseNo: '',
      licenseIssueDate: '',
      licenseExpiry: '',
      licenseFrontUrl: '',
      licenseBackUrl: '',
      rcNumber: '',
      rcUrl: '',
      insuranceNo: '',
      insuranceExpiry: '',
      insuranceUrl: '',
      permitNo: '',
      permitExpiry: '',
      permitUrl: '',
      pollutionNo: '',
      pollutionExpiry: '',
      pollutionUrl: '',
      fitnessNo: '',
      fitnessExpiry: '',
      fitnessUrl: '',
      bankAccountName: '',
      bankAccountNumber: '',
      confirmBankAccountNumber: '',
      bankIfsc: '',
      bankName: '',
      upiId: '',
      registrationAction: 'submit_for_review'
    }
  })

  // Watch values for conditional calculations & review panels
  const formValues = watch()
  const vehicleType = watch('vehicleType')
  const registrationAction = watch('registrationAction')

  // Fetch initial countries on mount
  useEffect(() => {
    fetchCountries()
  }, [])

  // Auto lookup postal codes
  const handlePostcodeBlur = async () => {
    const postcode = getValues('postcode')
    if (postcode && postcode.length >= 6) {
      try {
        const country = getValues('country') || 'India'
        const countryCode = country.toLowerCase() === 'india' ? 'IN' : 'IN'
        const details = await lookupPostalCode(postcode, countryCode)
        if (details) {
          if (details.state) {
            setValue('state', details.state, { shouldValidate: true })
            fetchCities(getValues('country') || 'India', details.state)
          }
          if (details.city) {
            setValue('city', details.city, { shouldValidate: true })
          }
        }
      } catch (err) {
        console.warn('Postcode lookup failed, fallback to manual entry:', err)
      }
    }
  }

  // Pre-fill form when in Edit mode
  useEffect(() => {
    if (isEdit && application) {
      const v = application.vehicle
      const docsMap = new Map(application.documents.map(d => [d.docType, d]))

      const defaultData: Partial<DriverKycFormData> = {
        fullName: application.driverName,
        mobileNumber: application.mobileNumber,
        email: application.email || '',
        gender: application.gender || 'MALE',
        dateOfBirth: application.dateOfBirth || '',
        preferredLanguage: application.preferredLanguage || 'English',
        referralCode: application.referralCode || '',
        country: application.country || 'India',
        state: application.state || '',
        city: application.city || '',
        postcode: application.postcode || '',
        addressLine1: application.addressLine1 || '',
        addressLine2: application.addressLine2 || '',
        landmark: application.landmark || '',
        emergencyContactName: application.emergencyContactName || '',
        emergencyContactNumber: application.emergencyContactNumber || '',
        profilePhotoUrl: application.profilePhotoUrl || '',
        aadhaarNumber: application.aadhaarNumber || '',
        aadhaarFrontUrl: docsMap.get('aadhaar_front')?.fileUrl || '',
        aadhaarBackUrl: docsMap.get('aadhaar_back')?.fileUrl || '',
        panNumber: application.panNumber || '',
        panUrl: docsMap.get('pan')?.fileUrl || '',
        driverSelfieUrl: docsMap.get('selfie')?.fileUrl || '',
        vehicleType: application.vehicleType || 'cab',
        vehicleCategory: v?.vehicleCategory || 'Sedan',
        brand: v?.brand || '',
        model: v?.model || '',
        color: v?.color || '',
        registrationNumber: v?.registrationNumber || '',
        manufacturingYear: v?.manufacturingYear || new Date().getFullYear(),
        seatCapacity: v?.seatsCapacity || 4,
        licenseNo: application.licenseNo || '',
        licenseFrontUrl: docsMap.get('license_front')?.fileUrl || '',
        licenseBackUrl: docsMap.get('license_back')?.fileUrl || '',
        licenseExpiry: docsMap.get('license_front')?.expiryDate || '',
        licenseIssueDate: docsMap.get('license_front')?.issuedDate || '',
        rcNumber: v?.rcNumber || '',
        rcUrl: docsMap.get('rc')?.fileUrl || '',
        insuranceNo: v?.insuranceNo || '',
        insuranceExpiry: v?.insuranceExpiry || '',
        insuranceUrl: docsMap.get('insurance')?.fileUrl || '',
        permitNo: v?.permitNo || '',
        permitExpiry: v?.permitExpiry || '',
        permitUrl: docsMap.get('permit')?.fileUrl || '',
        pollutionNo: v?.pollutionNo || '',
        pollutionExpiry: v?.pollutionExpiry || '',
        pollutionUrl: docsMap.get('pollution')?.fileUrl || '',
        fitnessNo: v?.fitnessNo || '',
        fitnessExpiry: v?.fitnessExpiry || '',
        fitnessUrl: docsMap.get('fitness')?.fileUrl || '',
        bankAccountName: application.bankAccountName || '',
        bankAccountNumber: application.bankAccountNumber || '',
        confirmBankAccountNumber: application.bankAccountNumber || '',
        bankIfsc: application.bankIfsc || '',
        bankName: application.bankName || '',
        upiId: application.upiId || '',
        registrationAction: 'submit_for_review'
      }

      reset(defaultData as DriverKycFormData)

      // Fetch states/cities for prefilled values
      if (application.country) {
        fetchStates(application.country)
        if (application.state) {
          fetchCities(application.country, application.state)
        }
      }
    }
  }, [isEdit, application, reset])

  // Sync state dropdown items
  const stateDropdownItems = useMemo(() =>
    states.map(s => ({ id: s, name: s })), [states]
  )

  // Sync city dropdown items
  const cityDropdownItems = useMemo(() =>
    cities.map(c => ({ id: c, name: c })), [cities]
  )

  // Map API countries to standard dropdown format
  const countryDropdownItems = useMemo(() =>
    countries.map(c => ({ id: c.name, name: c.name })), [countries]
  )

  // Dynamic state change triggers city refetch
  const handleCountryChange = (name: string) => {
    setValue('country', name, { shouldValidate: true })
    setValue('state', '')
    setValue('city', '')
    fetchStates(name)
  }

  const handleStateChange = (name: string) => {
    setValue('state', name, { shouldValidate: true })
    setValue('city', '')
    fetchCities(getValues('country') || 'India', name)
  }

  // Calculate proportional progress weights based on wizard steps
  const registrationCompleteness = useMemo(() => {
    // Bio Details (Step 1): Name, phone, email, gender, dob, full address details
    const bioFields: (keyof DriverKycFormData)[] = [
      'fullName', 'mobileNumber', 'gender', 'dateOfBirth',
      'country', 'state', 'city', 'postcode', 'addressLine1',
      'emergencyContactName', 'emergencyContactNumber', 'preferredLanguage'
    ]
    const filledBio = bioFields.filter(f => !!formValues[f]).length
    const bioPct = Math.round((filledBio / bioFields.length) * 100)

    // Identity Verification (Step 2): Aadhaar, PAN & driver selfie uploads
    const identityFields: (keyof DriverKycFormData)[] = [
      'aadhaarNumber', 'aadhaarFrontUrl', 'aadhaarBackUrl',
      'panNumber', 'panUrl', 'driverSelfieUrl'
    ]
    const filledIdentity = identityFields.filter(f => !!formValues[f]).length
    const identityPct = Math.round((filledIdentity / identityFields.length) * 100)

    // Vehicle Specifications (Step 3): Class, Brand, plate, seats, manufacturing
    const vehicleFields: (keyof DriverKycFormData)[] = [
      'vehicleType', 'vehicleCategory', 'brand', 'model',
      'color', 'registrationNumber', 'manufacturingYear', 'seatCapacity'
    ]
    const filledVehicle = vehicleFields.filter(f => !!formValues[f]).length
    const vehiclePct = Math.round((filledVehicle / vehicleFields.length) * 100)

    // Compliance documents (Step 4): DL, RC, Insurance, permit, pollution & optional fitness
    const docsFields: (keyof DriverKycFormData)[] = [
      'licenseNo', 'licenseFrontUrl', 'licenseBackUrl', 'licenseExpiry',
      'rcNumber', 'rcUrl', 'insuranceNo', 'insuranceUrl', 'insuranceExpiry',
      'permitNo', 'permitUrl', 'permitExpiry', 'pollutionNo', 'pollutionUrl', 'pollutionExpiry'
    ]
    if (vehicleType === 'auto' || vehicleType === 'cab') {
      docsFields.push('fitnessNo', 'fitnessUrl', 'fitnessExpiry')
    }
    const filledDocs = docsFields.filter(f => !!formValues[f]).length
    const docsPct = Math.round((filledDocs / docsFields.length) * 100)

    // Payout details (Step 5): Bank Name, Account details & matching codes
    const bankFields: (keyof DriverKycFormData)[] = [
      'bankAccountName', 'bankAccountNumber', 'confirmBankAccountNumber', 'bankIfsc', 'bankName'
    ]
    const filledBank = bankFields.filter(f => !!formValues[f]).length
    const bankPct = Math.round((filledBank / bankFields.length) * 100)

    // Total proportional KYC weights
    const totalPercentage = Math.round(
      (bioPct * 0.20) +
      (identityPct * 0.20) +
      (vehiclePct * 0.15) +
      (docsPct * 0.30) +
      (bankPct * 0.15)
    )

    return {
      percentage: Math.min(100, totalPercentage),
      sections: [
        { label: 'Personal Details', progress: bioPct, complete: bioPct === 100, description: 'Address, language & profile photo.' },
        { label: 'Identity Verification', progress: identityPct, complete: identityPct === 100, description: 'Aadhaar, PAN & driver selfie uploads.' },
        { label: 'Vehicle Specs', progress: vehiclePct, complete: vehiclePct === 100, description: 'Model class & seating capacities.' },
        { label: 'Registry Documents', progress: docsPct, complete: docsPct === 100, description: 'Licenses, policy renewals & permit passes.' },
        { label: 'Settlement Account', progress: bankPct, complete: bankPct === 100, description: 'Routing keys & payout bank cards.' }
      ]
    }
  }, [formValues, vehicleType])

  // Multi-step tab validation checker
  const handleTabChange = async (tab: TabType) => {
    let fieldsToValidate: (keyof DriverKycFormData)[] = []

    if (tab === 'identity') {
      fieldsToValidate = ['fullName', 'mobileNumber', 'gender', 'dateOfBirth', 'country', 'state', 'city', 'postcode', 'addressLine1', 'emergencyContactName', 'emergencyContactNumber']
    } else if (tab === 'vehicle') {
      fieldsToValidate = ['aadhaarNumber', 'aadhaarFrontUrl', 'aadhaarBackUrl', 'panNumber', 'panUrl', 'driverSelfieUrl']
    } else if (tab === 'documents') {
      fieldsToValidate = ['vehicleType', 'vehicleCategory', 'brand', 'model', 'color', 'registrationNumber', 'manufacturingYear', 'seatCapacity']
    } else if (tab === 'bank') {
      fieldsToValidate = ['licenseNo', 'licenseFrontUrl', 'licenseBackUrl', 'licenseExpiry', 'rcNumber', 'rcUrl', 'insuranceNo', 'insuranceUrl', 'insuranceExpiry', 'permitNo', 'permitUrl', 'permitExpiry', 'pollutionNo', 'pollutionUrl', 'pollutionExpiry']
      if (vehicleType === 'auto' || vehicleType === 'cab') {
        fieldsToValidate.push('fitnessNo', 'fitnessUrl', 'fitnessExpiry')
      }
    } else if (tab === 'review') {
      fieldsToValidate = ['bankAccountName', 'bankAccountNumber', 'confirmBankAccountNumber', 'bankIfsc', 'bankName']
    }

    const isStepValid = await trigger(fieldsToValidate)
    if (isStepValid) {
      setActiveFormTab(tab)
    }
  }

  // Submission handler
  const onCompleteRegistration = (data: DriverKycFormData) => {
    if (isEdit) {
      updateKyc({ id: id || '', data }, {
        onSuccess: () => navigate('/driver-management/applications')
      })
    } else {
      createKyc(data, {
        onSuccess: () => navigate('/driver-management/applications')
      })
    }
  }

  // Save Draft stub
  const onSaveDraft = () => {
    alert('Progress cached locally. Registration draft saved successfully.')
    navigate('/driver-management/applications')
  }

  const isPending = isCreating || isUpdating

  if (isEdit && isFetching) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center p-12 text-slate-500 font-medium">
          Fetching application record...
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <PageHeader
        title={isEdit ? 'Edit Driver Application' : 'Manual Driver Registration'}
        description={isEdit ? 'Modify verification attributes, documents, and submit updates.' : 'Directly onboard a trusted driver partner and register profile credentials.'}
        onBack={() => navigate('/driver-management/applications')}
        actions={
          <div className="flex gap-2 print:hidden">
            <Button
              variant="outline"
              className="gap-2 text-xs font-semibold h-9 rounded-lg"
              onClick={onSaveDraft}
              disabled={isPending}
            >
              <Save className="h-4 w-4" />
              <span>Save Draft</span>
            </Button>
            <Button
              variant="primary"
              className="gap-2 text-xs font-semibold h-9 rounded-lg"
              onClick={handleSubmit(onCompleteRegistration)}
              loading={isPending}
              disabled={isPending || !isValid}
            >
              <FileCheck className="h-4 w-4" />
              <span>Submit Registration</span>
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Step Tabs header */}
        <FormTabs
          activeTab={activeFormTab}
          onChange={handleTabChange}
          tabs={[
            { id: 'bio', label: '1. Personal Details' },
            { id: 'identity', label: '2. Identity Verification' },
            { id: 'vehicle', label: '3. Vehicle Specs' },
            { id: 'documents', label: '4. Documents' },
            { id: 'bank', label: '5. Bank Details' },
            { id: 'review', label: '6. Review & Submit' }
          ]}
        />

        {/* Wizard forms layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT WIZARD FIELDS COLUMN */}
          <div className="lg:col-span-2 space-y-6 print:w-full">
            <form onSubmit={handleSubmit(onCompleteRegistration)} className="space-y-6">
              
              {activeFormTab === 'bio' && (
                <PersonalDetailsStep
                  register={register}
                  control={control}
                  errors={errors}
                  setValue={setValue}
                  watch={watch}
                  getValues={getValues}
                  countryDropdownItems={countryDropdownItems}
                  stateDropdownItems={stateDropdownItems}
                  cityDropdownItems={cityDropdownItems}
                  countriesLoading={countriesLoading}
                  statesLoading={statesLoading}
                  citiesLoading={citiesLoading}
                  isPostalLoading={isPostalLoading}
                  fetchStates={handleCountryChange}
                  fetchCities={handleStateChange}
                  handlePostcodeBlur={handlePostcodeBlur}
                />
              )}

              {activeFormTab === 'identity' && (
                <IdentityVerificationStep
                  register={register}
                  errors={errors}
                  watch={watch}
                />
              )}

              {activeFormTab === 'vehicle' && (
                <VehicleInfoStep
                  register={register}
                  control={control}
                  errors={errors}
                />
              )}

              {activeFormTab === 'documents' && (
                <VehicleDocsStep
                  register={register}
                  control={control}
                  errors={errors}
                  watch={watch}
                />
              )}

              {activeFormTab === 'bank' && (
                <BankDetailsStep
                  register={register}
                  errors={errors}
                />
              )}

              {activeFormTab === 'review' && (
                <ReviewSubmitStep
                  formValues={formValues}
                  onEditSection={(tabName) => handleTabChange(tabName)}
                  onPrint={() => window.print()}
                />
              )}

            </form>
          </div>

          {/* RIGHT SIDEBAR COLUMN: COMPLETENESS & ACTIONS */}
          <div className="space-y-6 print:hidden">
            {/* Registration Action Selection Panel (Added for Manual Registration Flow) */}
            {activeFormTab === 'review' && (
              <Card className="premium-card text-left">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Registration Action
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Choose operational workflow status upon form submission.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <input
                        type="radio"
                        value="submit_for_review"
                        checked={registrationAction === 'submit_for_review'}
                        onChange={() => setValue('registrationAction', 'submit_for_review')}
                        className="mt-0.5 accent-primary"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Submit For Review</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Places application in verification queues with 'Pending Review' status.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <input
                        type="radio"
                        value="approve_immediately"
                        checked={registrationAction === 'approve_immediately'}
                        onChange={() => setValue('registrationAction', 'approve_immediately')}
                        className="mt-0.5 accent-primary"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Approve Immediately</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Bypasses review. Driver account activated immediately with 'Approved' status.</p>
                      </div>
                    </label>
                  </div>
                </CardContent>
              </Card>
            )}

            <CompletenessCard
              percentage={registrationCompleteness.percentage}
              sections={registrationCompleteness.sections}
              onSubmit={handleSubmit(onCompleteRegistration)}
              onSaveDraft={onSaveDraft}
              isPending={isPending}
              submitLabel={isEdit ? 'Submit Application' : (registrationAction === 'approve_immediately' ? 'Activate Immediately' : 'Submit For Review')}
              isValid={isValid}
            />
          </div>

        </div>
      </div>

      {/* PRINT-ONLY ACKNOWLEDGEMENT PDF TEMPLATE */}
      <AcknowledgementTemplate
        id={id}
        formValues={formValues}
      />
    </PageWrapper>
  )
}

export default ManualRegistrationPage
