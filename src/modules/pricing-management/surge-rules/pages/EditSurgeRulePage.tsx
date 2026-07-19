import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSurgeRule, useUpdateSurgeRule } from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { SurgeRuleWizardForm } from '../components/SurgeRuleWizardForm'

export const EditSurgeRulePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: rule, isLoading, isError } = useSurgeRule(id || '')
  const { mutate: updateRule, isPending } = useUpdateSurgeRule()

  const handleFormSubmit = (formData: any) => {
    if (!id) return
    updateRule({ id, updates: formData }, {
      onSuccess: () => {
        navigate('/pricing-management/surge-rules')
      }
    })
  }

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center p-12 text-slate-500 font-medium">
          Fetching surge rule details...
        </div>
      </PageWrapper>
    )
  }

  if (isError || !rule) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center p-12 text-rose-500 font-medium">
          <p>Failed to find surge rule.</p>
          <button onClick={() => navigate('/pricing-management/surge-rules')} className="text-xs underline mt-2 text-slate-650">Back to list</button>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <PageHeader
        title={`Edit Surge Rule: ${rule.ruleName}`}
        description={`Modify parameters. Saving will create Version V${rule.version + 1} and deactivate V${rule.version}.`}
        onBack={() => navigate('/pricing-management/surge-rules')}
      />

      <div className="mt-4">
        <SurgeRuleWizardForm
          initialValues={rule}
          onSubmit={handleFormSubmit}
          loading={isPending}
        />
      </div>
    </PageWrapper>
  )
}

export default EditSurgeRulePage
