import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateSurgeRule } from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { SurgeRuleWizardForm } from '../components/SurgeRuleWizardForm'

export const CreateSurgeRulePage: React.FC = () => {
  const navigate = useNavigate()
  const { mutate: createRule, isPending } = useCreateSurgeRule()

  const handleFormSubmit = (formData: any) => {
    createRule(formData, {
      onSuccess: () => {
        navigate('/pricing-management/surge-rules')
      }
    })
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Create Surge Rule"
        description="Establish new multipliers, validity timelines, and active periods for vehicle categories."
        onBack={() => navigate('/pricing-management/surge-rules')}
      />

      <div className="mt-4">
        <SurgeRuleWizardForm
          onSubmit={handleFormSubmit}
          loading={isPending}
        />
      </div>
    </PageWrapper>
  )
}

export default CreateSurgeRulePage
