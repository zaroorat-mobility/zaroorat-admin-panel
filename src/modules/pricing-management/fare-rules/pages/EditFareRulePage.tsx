import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useFareRule, useUpdateFareRule } from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { FareRuleWizardForm } from '../components/FareRuleWizardForm'

export const EditFareRulePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: rule, isLoading, isError } = useFareRule(id || '')
  const { mutate: updateRule, isPending } = useUpdateFareRule()

  const handleFormSubmit = (formData: any) => {
    if (!id) return
    updateRule({ id, updates: formData }, {
      onSuccess: () => {
        navigate('/pricing-management/fare-rules')
      }
    })
  }

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center p-12 text-slate-500 font-medium">
          Fetching fare rule details...
        </div>
      </PageWrapper>
    )
  }

  if (isError || !rule) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center p-12 text-rose-500 font-medium">
          <p>Failed to load fare rule.</p>
          <button onClick={() => navigate('/pricing-management/fare-rules')} className="text-xs underline mt-2 text-slate-650">Back to list</button>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <PageHeader
        title={`Edit Tariff: ${rule.ruleName}`}
        description={`Modify properties of the rule. Submitting will publish Version V${rule.version + 1} and deactivate V${rule.version}.`}
        onBack={() => navigate('/pricing-management/fare-rules')}
      />

      <div className="mt-4">
        <FareRuleWizardForm
          initialValues={rule}
          onSubmit={handleFormSubmit}
          loading={isPending}
        />
      </div>
    </PageWrapper>
  )
}

export default EditFareRulePage
