import type { UseFormRegister, Control, UseFormSetValue, UseFormWatch, UseFormGetValues } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import CustomSelect from '@/shared/components/ui/CustomSelect'
import SearchableDropdown from '@/shared/components/ui/SearchableDropdown'
import DatePicker from '@/shared/components/ui/DatePicker'
import { MapPin, Phone, User } from 'lucide-react'
import type { DriverKycFormData } from '../../schemas'

interface PersonalDetailsStepProps {
  register: UseFormRegister<DriverKycFormData>
  control: Control<DriverKycFormData>
  errors: any
  setValue: UseFormSetValue<DriverKycFormData>
  watch: UseFormWatch<DriverKycFormData>
  getValues: UseFormGetValues<DriverKycFormData>
  countryDropdownItems: { id: string; name: string }[]
  stateDropdownItems: { id: string; name: string }[]
  cityDropdownItems: { id: string; name: string }[]
  countriesLoading: boolean
  statesLoading: boolean
  citiesLoading: boolean
  isPostalLoading: boolean
  fetchStates: (country: string) => void
  fetchCities: (country: string, state: string) => void
  handlePostcodeBlur: () => void
}

export const PersonalDetailsStep: React.FC<PersonalDetailsStepProps> = ({
  register,
  control,
  errors,
  setValue,
  watch,
  getValues,
  countryDropdownItems,
  stateDropdownItems,
  cityDropdownItems,
  countriesLoading,
  statesLoading,
  citiesLoading,
  isPostalLoading,
  fetchStates,
  fetchCities,
  handlePostcodeBlur,
}) => {
  return (
    <Card className="premium-card text-left">
      <CardHeader>
        <CardTitle>Driver Profile & Personal Details</CardTitle>
        <CardDescription>Enter personal identifiers, custom contact numbers, preferred language, and residence details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Profile Photo URL Field */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Profile Photo URL *"
            placeholder="Enter direct photo URL (e.g. https://images.unsplash.com/...)"
            error={errors.profilePhotoUrl?.message}
            {...register('profilePhotoUrl')}
          />
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 border border-dashed border-border p-3 rounded-xl">
            <div className="h-10 w-10 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0 flex items-center justify-center">
              {watch('profilePhotoUrl') ? (
                <img src={watch('profilePhotoUrl')} alt="Profile Preview" className="h-full w-full object-cover" />
              ) : (
                <User className="h-5 w-5 text-slate-400" />
              )}
            </div>
            <div className="text-[10px] text-slate-400 leading-tight">
              Paste a valid URL image link. It will be prefilled inside the final acknowledgements.
            </div>
          </div>
        </div>

        {/* Bio Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Full Name *"
            placeholder="Enter driver legal full name"
            error={errors.fullName?.message}
            {...register('fullName')}
          />

          <Input
            label="Mobile Number *"
            placeholder="Enter 10-digit mobile number"
            error={errors.mobileNumber?.message}
            {...register('mobileNumber')}
          />

          <Input
            label="Email Address"
            placeholder="Enter email address (optional)"
            error={errors.email?.message}
            {...register('email')}
          />

          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <CustomSelect
                label="Gender *"
                options={[
                  { label: 'Male', value: 'MALE' },
                  { label: 'Female', value: 'FEMALE' },
                  { label: 'Other', value: 'OTHER' },
                ]}
                value={field.value}
                onChange={field.onChange}
                error={errors.gender?.message}
              />
            )}
          />

          <Controller
            name="dateOfBirth"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Date of Birth *"
                value={field.value}
                onChange={field.onChange}
                error={errors.dateOfBirth?.message}
              />
            )}
          />

          <Input
            label="Preferred Language *"
            placeholder="e.g. English, Hindi, Punjabi"
            error={errors.preferredLanguage?.message}
            {...register('preferredLanguage')}
          />

          <Input
            label="Referral Code (Optional)"
            placeholder="Enter partner referral code"
            error={errors.referralCode?.message}
            {...register('referralCode')}
          />
        </div>

        {/* Emergency Contact */}
        <div className="border-t border-border pt-6 space-y-6">
          <div className="flex items-center gap-2">
            <Phone className="h-4.5 w-4.5 text-primary" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Emergency Contact Details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Emergency Contact Name *"
              placeholder="Enter emergency contact full name"
              error={errors.emergencyContactName?.message}
              {...register('emergencyContactName')}
            />

            <Input
              label="Emergency Contact Number *"
              placeholder="Enter 10-digit mobile number"
              error={errors.emergencyContactNumber?.message}
              {...register('emergencyContactNumber')}
            />
          </div>
        </div>

        {/* Current Address Details */}
        <div className="border-t border-border pt-6 space-y-6">
          <div className="flex items-center gap-2">
            <MapPin className="h-4.5 w-4.5 text-primary" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Current Address</h3>
          </div>

          {isPostalLoading && (
            <div className="flex items-center gap-2 text-primary font-medium text-xs animate-pulse bg-primary/5 py-1.5 px-3 rounded-lg w-max">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
              <span>Fetching Address Details from PIN Code...</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Controller
              name="country"
              control={control}
              render={({ field }) => (
                <SearchableDropdown
                  label="Country *"
                  items={countryDropdownItems}
                  selectedId={field.value}
                  onSelect={(val) => {
                    field.onChange(val)
                    setValue('state', '')
                    setValue('city', '')
                    fetchStates(val as string)
                  }}
                  placeholder={countriesLoading ? "Loading countries..." : "Search and select country"}
                  error={errors.country?.message}
                />
              )}
            />

            <Input
              label="Postcode / PIN Code *"
              placeholder="Enter postcode (e.g. 560001)"
              error={errors.postcode?.message}
              {...register('postcode')}
              onBlur={handlePostcodeBlur}
            />

            <Controller
              name="state"
              control={control}
              render={({ field }) => (
                <SearchableDropdown
                  label="State *"
                  items={stateDropdownItems}
                  selectedId={field.value}
                  onSelect={(val) => {
                    field.onChange(val)
                    setValue('city', '')
                    fetchCities(getValues('country'), val as string)
                  }}
                  placeholder={statesLoading ? "Loading states..." : "Search and select state"}
                  disabled={!watch('country') || statesLoading}
                  error={errors.state?.message}
                />
              )}
            />

            <Controller
              name="city"
              control={control}
              render={({ field }) => (
                <SearchableDropdown
                  label="City *"
                  items={cityDropdownItems}
                  selectedId={field.value}
                  onSelect={field.onChange}
                  placeholder={citiesLoading ? "Loading cities..." : "Search and select city"}
                  disabled={!watch('state') || citiesLoading}
                  error={errors.city?.message}
                />
              )}
            />

            <Input
              label="Address Line 1 *"
              placeholder="House no, Building, Street name"
              error={errors.addressLine1?.message}
              {...register('addressLine1')}
            />

            <Input
              label="Address Line 2"
              placeholder="Apartment, Suite, Unit, etc."
              error={errors.addressLine2?.message}
              {...register('addressLine2')}
            />

            <Input
              label="Landmark"
              placeholder="Enter landmark (e.g. Near Metro station)"
              error={errors.landmark?.message}
              {...register('landmark')}
            />
          </div>
        </div>

      </CardContent>
    </Card>
  )
}
