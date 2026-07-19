import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCancellationRule, useUpdateCancellationRule } from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { CancellationRuleForm } from '../components/CancellationRuleForm'

export const EditCancellationRulePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: rule, isLoading, isError } = useCancellationRule(id || '')
  const { mutate: updateRule, isPending } = useUpdateCancellationRule()

  const handleFormSubmit = (formData: any) => {
    if (!id) return
    updateRule({ id, updates: formData }, {
      onSuccess: () => {
        navigate('/pricing-management/cancellation-rules')
      }
    })
  }

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center p-12 text-slate-500 font-medium">
          Fetching cancellation rule details...
        </div>
      </PageWrapper>
    )
  }

  if (isError || !rule) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center p-12 text-rose-500 font-medium">
          <p>Failed to find cancellation rule.</p>
          <button onClick={() => navigate('/pricing-management/cancellation-rules')} className="text-xs underline mt-2 text-slate-650">Back to list</button>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <PageHeader
        title={`Edit Rule: ${rule.ruleName}`}
        description={`Modify properties. Submitting will create Version V${rule.version + 1} and deactivate V${rule.version}.`}
        onBack={() => navigate('/pricing-management/cancellation-rules')}
      />

      <div className="mt-4">
        <CancellationRuleForm
          initialValues={rule}
          onSubmit={handleFormSubmit}
          loading={isPending}
        />
      </div>
    </PageWrapper>
  )
}

export default EditCancellationRulePage
