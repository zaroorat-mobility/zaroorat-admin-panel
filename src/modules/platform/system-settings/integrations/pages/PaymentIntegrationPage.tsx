import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { useToast } from '@/shared/context/toast'
import { usePaymentSettings, useTestPaymentIntegration, useUpdatePaymentSettings } from '@/modules/platform/system-settings/hooks'
import type { PaymentGatewayName } from '@/modules/platform/system-settings/types'
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
  const [defaultGateway, setDefaultGateway] = useState<PaymentGatewayName>('mock')
  const [defaultCurrency, setDefaultCurrency] = useState('INR')
  const [razorpayKeyId, setRazorpayKeyId] = useState('')
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('')
  const [stripeSecretKey, setStripeSecretKey] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')

  useEffect(() => {
    if (!data) return
    setDefaultGateway(data.defaultGateway)
    setDefaultCurrency(data.defaultCurrency)
    setRazorpayKeyId(data.razorpay.keyId === '********' ? '********' : '')
    setRazorpayKeySecret(data.razorpay.keySecret)
    setStripeSecretKey(data.stripe.secretKey)
    setWebhookSecret('')
  }, [data])

  const handleSave = () => {
    save(
      {
        defaultGateway,
        defaultCurrency,
        razorpayKeyId: secretForUpdate(razorpayKeyId, data?.razorpay.keyId ?? ''),
        razorpayKeySecret: secretForUpdate(razorpayKeySecret, data?.razorpay.keySecret ?? ''),
        stripeSecretKey: secretForUpdate(stripeSecretKey, data?.stripe.secretKey ?? ''),
        webhookSecret: webhookSecret || undefined,
        expectedVersion: data?.version,
      },
      {
        onSuccess: () => success('Settings saved', 'Payment settings were updated.'),
        onError: (err) =>
          error('Save failed', err instanceof Error ? err.message : 'Could not save settings'),
      },
    )
  }

  const handleTest = () => {
    test(undefined, {
      onSuccess: (result) =>
        result.ok ? success('Test passed', result.message) : error('Test failed', result.message),
      onError: (err) =>
        error('Test failed', err instanceof Error ? err.message : 'Could not test integration'),
    })
  }

  if (isLoading) return <SettingsLoading />
  if (isError || !data) return <SettingsError />

  return (
    <Card className="premium-card max-w-3xl">
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <ConfiguredBadge configured={data.configured} />
          {data.webhookConfigured ? (
            <span className="text-xs text-muted-foreground">Webhook configured</span>
          ) : (
            <span className="text-xs text-amber-600">Webhook not configured</span>
          )}
        </div>
        <SettingFieldRow label="Default gateway">
          <select
            value={defaultGateway}
            onChange={(e) => setDefaultGateway(e.target.value as PaymentGatewayName)}
            className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm dark:bg-slate-900"
          >
            <option value="mock">mock</option>
            <option value="razorpay">razorpay</option>
            <option value="stripe">stripe</option>
          </select>
        </SettingFieldRow>
        <SettingFieldRow label="Default currency">
          <Input value={defaultCurrency} onChange={(e) => setDefaultCurrency(e.target.value)} maxLength={3} />
        </SettingFieldRow>
        <SettingFieldRow label="Razorpay key ID">
          <Input value={razorpayKeyId === '********' ? '' : razorpayKeyId} onChange={(e) => setRazorpayKeyId(e.target.value)} placeholder={data.razorpay.configured ? '••••••••' : 'Enter key ID'} />
        </SettingFieldRow>
        <SecretField
          label="Razorpay key secret"
          value={razorpayKeySecret}
          onChange={setRazorpayKeySecret}
          configured={data.razorpay.configured}
        />
        <SecretField
          label="Stripe secret key"
          value={stripeSecretKey}
          onChange={setStripeSecretKey}
          configured={data.stripe.configured}
        />
        <SecretField
          label="Webhook secret"
          value={webhookSecret}
          onChange={setWebhookSecret}
          configured={data.webhookConfigured}
          placeholder="Enter webhook secret"
        />
        <SettingsFormActions
          onSave={handleSave}
          isSaving={isPending}
          onTest={handleTest}
          isTesting={isTesting}
        />
      </CardContent>
    </Card>
  )
}

export default PaymentIntegrationPage
