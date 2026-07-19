import type { UseFormRegister } from 'react-hook-form'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { CreditCard } from 'lucide-react'
import type { DriverKycFormData } from '../../schemas'

interface BankDetailsStepProps {
  register: UseFormRegister<DriverKycFormData>
  errors: any
}

export const BankDetailsStep: React.FC<BankDetailsStepProps> = ({
  register,
  errors,
}) => {
  return (
    <Card className="premium-card text-left">
      <CardHeader>
        <CardTitle>Payout & Banking Details</CardTitle>
        <CardDescription>Enter bank account particulars, confirmation matching, IFSC, and UPI addresses.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Settlement Account Details</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Account Holder Name *"
            placeholder="Enter holder name matching passbook"
            error={errors.bankAccountName?.message}
            {...register('bankAccountName')}
          />

          <Input
            label="Bank Name *"
            placeholder="e.g. State Bank of India, HDFC Bank"
            error={errors.bankName?.message}
            {...register('bankName')}
          />

          <Input
            label="Account Number *"
            placeholder="Enter bank account number"
            type="password"
            error={errors.bankAccountNumber?.message}
            {...register('bankAccountNumber')}
          />

          <Input
            label="Confirm Account Number *"
            placeholder="Re-enter bank account number"
            error={errors.confirmBankAccountNumber?.message}
            {...register('confirmBankAccountNumber')}
          />

          <Input
            label="IFSC Code *"
            placeholder="e.g. SBIN0001234"
            error={errors.bankIfsc?.message}
            {...register('bankIfsc')}
          />

          <Input
            label="UPI Address (Optional)"
            placeholder="e.g. driver@okaxis"
            error={errors.upiId?.message}
            {...register('upiId')}
          />
        </div>
      </CardContent>
    </Card>
  )
}
