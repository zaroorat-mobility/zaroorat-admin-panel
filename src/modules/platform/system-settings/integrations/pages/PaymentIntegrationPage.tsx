import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { useToast } from '@/shared/context/toast'
import {
  usePaymentSettings,
  useTestPaymentIntegration,
  useUpdatePaymentSettings,
} from '@/modules/platform/system-settings/hooks'
import type { PaymentEnvironment, PaymentGatewayName } from '@/modules/platform/system-settings/types'
import {
  ConfiguredBadge,
  SecretField,
  SettingFieldRow,
  SettingsError,
  SettingsFormActions,
  SettingsLoading,
  secretForUpdate,
} from '@/modules/platform/system-settings/components'

export const PaymentIntegrationPage: React.FC = () => {
  const { data, isLoading, isError } = usePaymentSettings()
  const { mutate: save, isPending } = useUpdatePaymentSettings()
  const { mutate: test, isPending: isTesting } = useTestPaymentIntegration()
  const { success, error } = useToast()

  const [activeProvider, setActiveProvider] = useState<PaymentGatewayName>('mock')
  const [defaultCurrency, setDefaultCurrency] = useState('INR')

  // Razorpay
  const [razorpayKeyId, setRazorpayKeyId] = useState('')
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('')
  const [razorpayWebhookSecret, setRazorpayWebhookSecret] = useState('')
  const [razorpayEnvironment, setRazorpayEnvironment] = useState<PaymentEnvironment>('sandbox')

  // Stripe
  const [stripeSecretKey, setStripeSecretKey] = useState('')
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState('')
  const [stripeEnvironment, setStripeEnvironment] = useState<PaymentEnvironment>('sandbox')

  // Safely extract normalized configs with guaranteed properties
  const razorpayConfig = {
    keyId: data?.providers?.razorpay?.keyId ?? data?.razorpay?.keyId ?? '',
    keySecret: data?.providers?.razorpay?.keySecret ?? data?.razorpay?.keySecret ?? '',
    webhookSecret: data?.providers?.razorpay?.webhookSecret ?? data?.razorpay?.webhookSecret ?? '',
    configured: Boolean(data?.providers?.razorpay?.configured ?? data?.razorpay?.configured),
    webhookConfigured: Boolean(
      data?.providers?.razorpay?.webhookConfigured ?? data?.razorpay?.webhookConfigured,
    ),
    environment: (data?.providers?.razorpay?.environment ??
      data?.razorpay?.environment ??
      'sandbox') as PaymentEnvironment,
    enabled: Boolean(data?.providers?.razorpay?.enabled ?? data?.razorpay?.enabled ?? true),
  }

  const stripeConfig = {
    secretKey: data?.providers?.stripe?.secretKey ?? data?.stripe?.secretKey ?? '',
    webhookSecret: data?.providers?.stripe?.webhookSecret ?? data?.stripe?.webhookSecret ?? '',
    configured: Boolean(data?.providers?.stripe?.configured ?? data?.stripe?.configured),
    webhookConfigured: Boolean(
      data?.providers?.stripe?.webhookConfigured ?? data?.stripe?.webhookConfigured,
    ),
    environment: (data?.providers?.stripe?.environment ??
      data?.stripe?.environment ??
      'sandbox') as PaymentEnvironment,
    enabled: Boolean(data?.providers?.stripe?.enabled ?? data?.stripe?.enabled ?? true),
  }

  const isConfigured =
    activeProvider === 'mock'
      ? true
      : activeProvider === 'razorpay'
        ? razorpayConfig.configured
        : stripeConfig.configured

  const isWebhookConfigured =
    activeProvider === 'razorpay'
      ? razorpayConfig.webhookConfigured
      : stripeConfig.webhookConfigured

  useEffect(() => {
    if (!data) return
    const currentProvider = data.activeProvider ?? data.defaultGateway ?? 'mock'
    setActiveProvider(currentProvider)
    setDefaultCurrency(data.defaultCurrency ?? 'INR')

    const rzp = data.providers?.razorpay ?? data.razorpay
    if (rzp) {
      setRazorpayKeyId(rzp.keyId === '********' ? '********' : rzp.keyId ?? '')
      setRazorpayKeySecret(rzp.keySecret ?? '')
      setRazorpayWebhookSecret(rzp.webhookSecret ?? '')
      setRazorpayEnvironment(rzp.environment ?? 'sandbox')
    }

    const str = data.providers?.stripe ?? data.stripe
    if (str) {
      setStripeSecretKey(str.secretKey ?? '')
      setStripeWebhookSecret(str.webhookSecret ?? '')
      setStripeEnvironment(str.environment ?? 'sandbox')
    }
  }, [data])

  const handleSave = () => {
    save(
      {
        activeProvider,
        defaultGateway: activeProvider,
        defaultCurrency,
        expectedVersion: data?.version,
        providers: {
          razorpay: {
            environment: razorpayEnvironment,
            keyId: secretForUpdate(razorpayKeyId, razorpayConfig.keyId),
            keySecret: secretForUpdate(razorpayKeySecret, razorpayConfig.keySecret),
            webhookSecret: secretForUpdate(razorpayWebhookSecret, razorpayConfig.webhookSecret),
          },
          stripe: {
            environment: stripeEnvironment,
            secretKey: secretForUpdate(stripeSecretKey, stripeConfig.secretKey),
            webhookSecret: secretForUpdate(stripeWebhookSecret, stripeConfig.webhookSecret),
          },
        },
        // Legacy flat fields for backward compatibility
        razorpayKeyId: secretForUpdate(razorpayKeyId, razorpayConfig.keyId),
        razorpayKeySecret: secretForUpdate(razorpayKeySecret, razorpayConfig.keySecret),
        stripeSecretKey: secretForUpdate(stripeSecretKey, stripeConfig.secretKey),
        webhookSecret: secretForUpdate(razorpayWebhookSecret, razorpayConfig.webhookSecret),
      },
      {
        onSuccess: () => success('Settings saved', 'Payment integration settings were updated.'),
        onError: (err) =>
          error('Save failed', err instanceof Error ? err.message : 'Could not save settings'),
      },
    )
  }

  const handleTest = () => {
    test(
      { provider: activeProvider },
      {
        onSuccess: (result) =>
          result.ok ? success('Test passed', result.message) : error('Test failed', result.message),
        onError: (err) =>
          error('Test failed', err instanceof Error ? err.message : 'Could not test integration'),
      },
    )
  }

  if (isLoading) return <SettingsLoading />
  if (isError || !data) return <SettingsError />

  return (
    <Card className="premium-card max-w-3xl">
      <CardContent className="p-6 space-y-5">
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-border">
          <ConfiguredBadge configured={Boolean(isConfigured)} />
          {isWebhookConfigured ? (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Webhook configured
            </span>
          ) : (
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              Webhook not configured
            </span>
          )}
        </div>

        <SettingFieldRow
          label="Active Payment Gateway"
          hint="The primary gateway used for all new ride transactions, wallet top-ups, and subscriptions."
        >
          <select
            value={activeProvider}
            onChange={(e) => setActiveProvider(e.target.value as PaymentGatewayName)}
            className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm font-medium dark:bg-slate-900 cursor-pointer"
          >
            <option value="mock">mock (Testing without external gateways)</option>
            <option value="razorpay">razorpay (Default for India / UPI / NetBanking)</option>
            <option value="stripe">stripe (International Cards)</option>
          </select>
        </SettingFieldRow>

        <SettingFieldRow label="Default Currency">
          <Input
            value={defaultCurrency}
            onChange={(e) => setDefaultCurrency(e.target.value)}
            maxLength={3}
          />
        </SettingFieldRow>

        {/* Razorpay Configuration */}
        <div className="pt-4 border-t border-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Razorpay Configuration
            </h3>
            <ConfiguredBadge configured={Boolean(razorpayConfig.configured)} />
          </div>

          <SettingFieldRow label="Razorpay Environment">
            <select
              value={razorpayEnvironment}
              onChange={(e) => setRazorpayEnvironment(e.target.value as PaymentEnvironment)}
              className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm font-medium dark:bg-slate-900 cursor-pointer"
            >
              <option value="sandbox">Sandbox / Test</option>
              <option value="live">Live / Production</option>
            </select>
          </SettingFieldRow>

          <SettingFieldRow label="Razorpay Key ID">
            <Input
              value={razorpayKeyId === '********' ? '' : razorpayKeyId}
              onChange={(e) => setRazorpayKeyId(e.target.value)}
              placeholder={
                razorpayConfig.configured ? '••••••••••••••••' : 'Enter Razorpay Key ID (rzp_...)'
              }
            />
          </SettingFieldRow>

          <SecretField
            label="Razorpay Key Secret"
            value={razorpayKeySecret}
            onChange={setRazorpayKeySecret}
            configured={razorpayConfig.configured}
            placeholder="Enter Razorpay Key Secret"
          />

          <SecretField
            label="Razorpay Webhook Secret"
            value={razorpayWebhookSecret}
            onChange={setRazorpayWebhookSecret}
            configured={razorpayConfig.webhookConfigured}
            placeholder="Enter Razorpay Webhook Secret"
          />
        </div>

        {/* Stripe Configuration */}
        <div className="pt-4 border-t border-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Stripe Configuration
            </h3>
            <ConfiguredBadge configured={Boolean(stripeConfig.configured)} />
          </div>

          <SettingFieldRow label="Stripe Environment">
            <select
              value={stripeEnvironment}
              onChange={(e) => setStripeEnvironment(e.target.value as PaymentEnvironment)}
              className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm font-medium dark:bg-slate-900 cursor-pointer"
            >
              <option value="sandbox">Sandbox / Test</option>
              <option value="live">Live / Production</option>
            </select>
          </SettingFieldRow>

          <SecretField
            label="Stripe Secret Key"
            value={stripeSecretKey}
            onChange={setStripeSecretKey}
            configured={stripeConfig.configured}
            placeholder="Enter Stripe Secret Key (sk_...)"
          />

          <SecretField
            label="Stripe Webhook Secret"
            value={stripeWebhookSecret}
            onChange={setStripeWebhookSecret}
            configured={stripeConfig.webhookConfigured}
            placeholder="Enter Stripe Webhook Secret (whsec_...)"
          />
        </div>

        <SettingsFormActions
          onSave={handleSave}
          isSaving={isPending}
          onTest={handleTest}
          isTesting={isTesting}
          testLabel={`Test ${activeProvider}`}
        />
      </CardContent>
    </Card>
  )
}

export default PaymentIntegrationPage

