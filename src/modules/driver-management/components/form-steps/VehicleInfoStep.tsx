import type { UseFormRegister, Control } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import CustomSelect from '@/shared/components/ui/CustomSelect'
import type { DriverKycFormData } from '../../schemas'

interface VehicleInfoStepProps {
  register: UseFormRegister<DriverKycFormData>
  control: Control<DriverKycFormData>
  errors: any
}

export const VehicleInfoStep: React.FC<VehicleInfoStepProps> = ({
  register,
  control,
  errors,
}) => {
  return (
    <Card className="premium-card text-left">
      <CardHeader>
        <CardTitle>Vehicle Specifications</CardTitle>
        <CardDescription>Enter transportation asset metadata, category specifications, make/model, and dimensions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Controller
            name="vehicleType"
            control={control}
            render={({ field }) => (
              <CustomSelect
                label="Vehicle Type Class *"
                options={[
                  { label: 'Bike (2-Wheeler)', value: 'bike' },
                  { label: 'Auto (3-Wheeler)', value: 'auto' },
                  { label: 'Cab (4-Wheeler Car)', value: 'cab' },
                  { label: 'Carpool (Multi-Seat Van)', value: 'carpool' },
                ]}
                value={field.value}
                onChange={field.onChange}
                error={errors.vehicleType?.message}
              />
            )}
          />

          <Input
            label="Vehicle Category Class *"
            placeholder="e.g. Hatchback, Sedan, Cargo Auto, Electric Bike"
            error={errors.vehicleCategory?.message}
            {...register('vehicleCategory')}
          />

          <Input
            label="Brand / Make *"
            placeholder="e.g. Bajaj, Maruti Suzuki, Honda"
            error={errors.brand?.message}
            {...register('brand')}
          />

          <Input
            label="Model Variant *"
            placeholder="e.g. Swift Dzire, RE Maxima, Activa 6G"
            error={errors.model?.message}
            {...register('model')}
          />

          <Input
            label="Exterior Color *"
            placeholder="e.g. Yellow-Black, White, Crimson Red"
            error={errors.color?.message}
            {...register('color')}
          />

          <Input
            label="Registration Plate Number *"
            placeholder="e.g. MH-12-PQ-4567"
            error={errors.registrationNumber?.message}
            {...register('registrationNumber')}
          />

          <Input
            label="Manufacturing Year *"
            placeholder="e.g. 2021"
            type="number"
            error={errors.manufacturingYear?.message}
            {...register('manufacturingYear')}
          />

          <Input
            label="Seats Capacity *"
            placeholder="e.g. 4"
            type="number"
            error={errors.seatCapacity?.message}
            {...register('seatCapacity')}
          />
        </div>
      </CardContent>
    </Card>
  )
}
