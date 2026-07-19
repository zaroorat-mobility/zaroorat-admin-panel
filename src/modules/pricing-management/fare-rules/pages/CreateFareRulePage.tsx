import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateFareRule } from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { FareRuleWizardForm } from '../components/FareRuleWizardForm'

export const CreateFareRulePage: React.FC = () => {
  const navigate = useNavigate()
  const { mutate: createRule, isPending } = useCreateFareRule()

  const handleFormSubmit = (formData: any) => {
    createRule(formData, {
      onSuccess: () => {
        navigate('/pricing-management/fare-rules')
      }
    })
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Create Tariff Rule"
        description="Establish base fares, wait penalty charges, night schedules and surge bounds for vehicle classes."
        onBack={() => navigate('/pricing-management/fare-rules')}
      />

      <div className="mt-4">
        <FareRuleWizardForm
          onSubmit={handleFormSubmit}
          loading={isPending}
        />
      </div>
    </PageWrapper>
  )
}

export default CreateFareRulePage
