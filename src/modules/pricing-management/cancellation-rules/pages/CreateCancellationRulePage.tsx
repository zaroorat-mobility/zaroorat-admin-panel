import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateCancellationRule } from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { CancellationRuleForm } from '../components/CancellationRuleForm'

export const CreateCancellationRulePage: React.FC = () => {
  const navigate = useNavigate()
  const { mutate: createRule, isPending } = useCreateCancellationRule()

  const handleFormSubmit = (formData: any) => {
    createRule(formData, {
      onSuccess: () => {
        navigate('/pricing-management/cancellation-rules')
      }
    })
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Create Cancellation Penalty"
        description="Establish wallet charges, scenario-based cancellation fees, and actor parameters."
        onBack={() => navigate('/pricing-management/cancellation-rules')}
      />

      <div className="mt-4">
        <CancellationRuleForm
          onSubmit={handleFormSubmit}
          loading={isPending}
        />
      </div>
    </PageWrapper>
  )
}

export default CreateCancellationRulePage
