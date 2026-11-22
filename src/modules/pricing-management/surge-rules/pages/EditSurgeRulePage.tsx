import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useSurgeRule, useUpdateSurgeRule } from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { SurgeRuleWizardForm } from '../components/SurgeRuleWizardForm'
import { useToast } from '@/shared/context/toast'

export const EditSurgeRulePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { success: showSuccess, error: showError } = useToast()

  const { data: rule, isLoading, isError } = useSurgeRule(id || '')
  const { mutate: updateRule, isPending, error: updateError } = useUpdateSurgeRule()

  const handleFormSubmit = (formData: any) => {
    if (!id) return
    updateRule(
      { id, updates: formData },
      {
        onSuccess: () => {
          showSuccess(
            'Surge Rule Updated Successfully',
            'Surge multiplier updates applied to new bookings in the selected zone.',
          )
          navigate('/pricing-management/surge-rules')
        },
        onError: (err: any) => {
          showError(
            'Failed to Update Surge Rule',
            err?.response?.data?.error?.message || err?.message || 'A conflicting rule or validation error occurred.',
          )
        },
      },
    )
  }

  if (isLoading) {
    return (
      <PageWrapper className="pt-1.5 sm:pt-2 pb-2 sm:pb-3 px-4 sm:px-6 max-w-screen-2xl mx-auto w-full">
        <div className="flex items-center justify-center p-12 text-slate-500 font-medium">
          Fetching surge rule details...
        </div>
      </PageWrapper>
    )
  }

  if (isError || !rule) {
    return (
      <PageWrapper className="pt-1.5 sm:pt-2 pb-2 sm:pb-3 px-4 sm:px-6 max-w-screen-2xl mx-auto w-full">
        <div className="flex flex-col items-center justify-center p-12 text-rose-500 font-medium">
          <p>Failed to find surge rule.</p>
          <button
            onClick={() => navigate('/pricing-management/surge-rules')}
            className="text-xs underline mt-2 text-slate-650 cursor-pointer"
          >
            Back to list
          </button>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper className="pt-1.5 sm:pt-2 pb-2 sm:pb-3 px-4 sm:px-6 max-w-screen-2xl mx-auto w-full">
      {/* Header matching Fare Rule & Pricing Control Center design */}
      <div className="flex items-center gap-3 mb-2.5 sm:mb-3">
        <button
          type="button"
          onClick={() => navigate('/pricing-management/surge-rules')}
          className="p-2 -ml-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          title="Back to Surge Rules"
        >
          <ArrowLeft className="w-5 h-5 text-[#1F2B6D] dark:text-slate-200" strokeWidth={2.2} />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F2B6D] dark:text-white leading-tight">
            Edit Surge Rule: {rule.ruleName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
            Set a dynamic fare multiplier for high demand, peak hours, weather or special events.
          </p>
        </div>
      </div>

      <div>
        <SurgeRuleWizardForm
          initialValues={rule}
          onSubmit={handleFormSubmit}
          loading={isPending}
          error={updateError}
        />
      </div>
    </PageWrapper>
  )
}

export default EditSurgeRulePage