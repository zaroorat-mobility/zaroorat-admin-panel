import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useFareRule, useUpdateFareRule } from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { FareRuleWizardForm } from '../components/FareRuleWizardForm'
import { useToast } from '@/shared/context/toast'

export const EditFareRulePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { success: showSuccess, error: showError } = useToast()

  const { data: rule, isLoading, isError, refetch } = useFareRule(id || '')
  const { mutate: updateRule, isPending, error: updateError } = useUpdateFareRule()

  const handleFormSubmit = (formData: any) => {
    if (!id || !rule) return
    updateRule(
      { id, updates: { ...formData, expectedVersion: rule.version } },
      {
        onSuccess: () => {
          showSuccess(
            'Tariff Updated Successfully',
            `Fare rule updated. New version v${rule.version + 1} published.`,
          )
          navigate('/pricing-management/fare-rules')
        },
        onError: (err: any) => {
          const code = err?.response?.data?.error?.code
          if (code === 'FARE_RULE_STALE') {
            showError(
              'Rule Updated by Another Admin',
              'This fare rule was modified while you were editing. Reloading the latest version.',
            )
            void refetch()
            return
          }
          showError(
            'Failed to Update Fare Rule',
            err?.response?.data?.error?.message || err?.message || 'A conflicting rule or validation error occurred.',
          )
        },
      },
    )
  }

  if (isLoading) {
    return (
      <PageWrapper className="space-y-4 pt-1 pb-6 px-3 sm:px-5 w-full max-w-full overflow-x-hidden">
        <div className="flex items-center justify-center p-12 text-slate-500 font-medium">
          Fetching fare rule details...
        </div>
      </PageWrapper>
    )
  }

  if (isError || !rule) {
    return (
      <PageWrapper className="space-y-4 pt-1 pb-6 px-3 sm:px-5 w-full max-w-full overflow-x-hidden">
        <div className="flex flex-col items-center justify-center p-12 text-rose-500 font-medium">
          <p>Failed to load fare rule.</p>
          <button
            onClick={() => navigate('/pricing-management/fare-rules')}
            className="text-xs underline mt-2 text-slate-650"
          >
            Back to list
          </button>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper className="pt-1.5 sm:pt-2 pb-2 sm:pb-3 px-4 sm:px-6 max-w-screen-2xl mx-auto w-full">
      {/* Header matching Geographic & Pricing Control Center design */}
      <div className="flex items-center gap-3 mb-2.5 sm:mb-3">
        <button
          type="button"
          onClick={() => navigate('/pricing-management/fare-rules')}
          className="p-2 -ml-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          title="Back to Fare Rules"
        >
          <ArrowLeft className="w-5 h-5 text-[#1F2B6D] dark:text-slate-200" strokeWidth={2.2} />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F2B6D] dark:text-white leading-tight">
            Edit Fare Rule: {rule.ruleName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
            Update ride fares, optional charges, and validity window for this vehicle, city, and zone.
          </p>
        </div>
      </div>

      <div>
        <FareRuleWizardForm
          mode="edit"
          initialValues={rule}
          onSubmit={handleFormSubmit}
          loading={isPending}
          error={updateError}
        />
      </div>
    </PageWrapper>
  )
}

export default EditFareRulePage
