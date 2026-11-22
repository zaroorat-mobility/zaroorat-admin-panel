import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useCreateSurgeRule } from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { SurgeRuleWizardForm } from '../components/SurgeRuleWizardForm'
import { PricingSuccessModal } from '../../components/PricingSuccessModal'
import { useToast } from '@/shared/context/toast'

export const CreateSurgeRulePage: React.FC = () => {
  const navigate = useNavigate()
  const { error: showError } = useToast()
  const { mutate: createRule, isPending, error } = useCreateSurgeRule()
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [formResetKey, setFormResetKey] = useState(0)

  const handleFormSubmit = (formData: Parameters<typeof createRule>[0]) => {
    createRule(formData, {
      onSuccess: () => {
        setShowSuccessModal(true)
      },
      onError: (err: unknown) => {
        const apiErr = err as {
          response?: { status?: number; data?: { error?: { code?: string; message?: string } } }
          message?: string
        }
        if (
          apiErr?.response?.status === 409 ||
          apiErr?.response?.data?.error?.code === 'SURGE_WINDOW_CONFLICT'
        ) {
          return
        }
        showError(
          'Failed to Create Surge Rule',
          apiErr?.response?.data?.error?.message || apiErr?.message || 'A conflicting rule or validation error occurred.',
        )
      },
    })
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
            Create Surge Rule
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
            Set a dynamic fare multiplier for high demand, peak hours, weather or special events.
          </p>
        </div>
      </div>

      <div>
        <SurgeRuleWizardForm
          key={formResetKey}
          onSubmit={handleFormSubmit}
          loading={isPending}
          error={error}
        />
      </div>

      <PricingSuccessModal
        isOpen={showSuccessModal}
        onClose={() => navigate('/pricing-management/surge-rules')}
        onPrimaryAction={() => navigate('/pricing-management/surge-rules')}
        onSecondaryAction={() => {
          setShowSuccessModal(false)
          setFormResetKey((k) => k + 1)
        }}
        title="Surge Rule Created"
        message="Dynamic surge multiplier has been saved to PostgreSQL for the selected scope."
        primaryButtonText="Go to Surge Rules"
        secondaryButtonText="Create Another Surge Rule"
      />
    </PageWrapper>
  )
}

export default CreateSurgeRulePage