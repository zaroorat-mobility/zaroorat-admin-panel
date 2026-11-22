import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCreateFareRule, useFareRule } from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { useToast } from '@/shared/context/toast'
import { FareRuleWizardForm } from '../components/FareRuleWizardForm'
import { PricingSuccessModal } from '../../components/PricingSuccessModal'

export const CreateFareRulePage: React.FC = () => {
  const navigate = useNavigate()
  const { error: showError } = useToast()
  const [searchParams] = useSearchParams()
  const presetCityCode = searchParams.get('cityCode') ?? undefined
  const presetServiceZoneId = searchParams.get('serviceZoneId') ?? undefined
  const duplicateId = searchParams.get('duplicateId') ?? ''
  const { data: sourceRule, isLoading: isLoadingSource } = useFareRule(duplicateId)
  const { mutate: createRule, isPending, error: createError } = useCreateFareRule()
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [formResetKey, setFormResetKey] = useState(0)

  const duplicateInitial =
    duplicateId && sourceRule
      ? {
        ...sourceRule,
        ruleName: `${sourceRule.ruleName} (Copy)`,
        effectiveFrom: new Date().toISOString().split('T')[0],
        effectiveTo: undefined,
      }
      : null

  const handleFormSubmit = (formData: Parameters<typeof createRule>[0]) => {
    createRule(formData, {
      onSuccess: () => {
        setShowSuccessModal(true)
      },
      onError: (err: unknown) => {
        const maybe = err as {
          response?: { status?: number; data?: { error?: { code?: string; message?: string }; message?: string } }
          message?: string
        }
        // Duplicate active rule conflicts are presented by the custom FareRuleConflictModal
        if (
          maybe?.response?.status === 409 ||
          maybe?.response?.data?.error?.code === 'FARE_RULE_CONFLICT'
        ) {
          return
        }
        const msg =
          maybe?.response?.data?.error?.message ||
          maybe?.response?.data?.message ||
          maybe?.message ||
          'Could not create fare rule.'
        showError('Cannot Create Fare Rule', msg)
      },
    })
  }

  return (
    <PageWrapper>
      <PageHeader
        title={duplicateId ? 'Duplicate Tariff Rule' : 'Create Tariff Rule'}
        description="Establish base fares, wait penalty charges, and tariff bounds for vehicle classes."
        onBack={() => navigate('/pricing-management/fare-rules')}
      />

      <div className="mt-4">
        {duplicateId && isLoadingSource ? (
          <p className="text-xs text-slate-500">Loading source fare rule…</p>
        ) : (
          <FareRuleWizardForm
            key={`${duplicateInitial?.id ?? 'new'}-${formResetKey}`}
            mode="create"
            initialValues={duplicateInitial}
            presetCityCode={presetCityCode}
            presetServiceZoneId={presetServiceZoneId}
            onSubmit={handleFormSubmit}
            loading={isPending}
            error={createError}
          />
        )}
      </div>

      <PricingSuccessModal
        isOpen={showSuccessModal}
        onClose={() => navigate('/pricing-management/fare-rules')}
        onPrimaryAction={() => navigate('/pricing-management/fare-rules')}
        onSecondaryAction={() => {
          setShowSuccessModal(false)
          setFormResetKey((k) => k + 1)
        }}
        title="Fare Rule Created"
        message="Your new tariff rule has been saved to PostgreSQL and is ready for ride quotes."
        primaryButtonText="Go to Fare Rules"
        secondaryButtonText="Create Another Fare Rule"
      />
    </PageWrapper>
  )
}

export default CreateFareRulePage
