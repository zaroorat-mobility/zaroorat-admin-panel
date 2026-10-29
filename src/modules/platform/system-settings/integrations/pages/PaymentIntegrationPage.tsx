import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { useToast } from '@/shared/context/toast'
import {
  usePaymentSettings,
  useTestPaymentIntegration,
  useUpdatePaymentSettings,
} from '@/modules/platform/system-settings/hooks'
import type {
  DriverPaymentsSettings,
  PaymentEnvironment,
  PaymentGatewayName,
} from '@/modules/platform/system-settings/types'
import {
  ConfiguredBadge,
  SecretField,
  SettingFieldRow,
  SettingsError,
  SettingsFormActions,
  SettingsLoading,
  secretForUpdate,
} from '@/modules/platform/system-settings/components'

/** The backend's defaults: net banking and wallets on, cards off until PCI DSS. */
const DEFAULT_METHODS: DriverPaymentsSettings['methods'] = { netbanking: true, wallet: true, card: false }
const METHOD_LABELS: [keyof DriverPaymentsSettings['methods'], string][] = [
  ['netbanking', 'Net banking'],
  ['wallet', 'Wallets'],
  ['card', 'Debit and credit cards'],
]
/** A quick check for a clear message; the backend validates the address too. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

  // Driver payments: the company email Razorpay requires, and method switches (UPI always on)
  const [checkoutEmail, setCheckoutEmail] = useState('')
  const [methods, setMethods] = useState(DEFAULT_METHODS)
  const savedEmail = data?.driverPayments?.checkoutEmail ?? ''

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

    setCheckoutEmail(data.driverPayments?.checkoutEmail ?? '')
    setMethods(data.driverPayments?.methods ?? DEFAULT_METHODS)
  }, [data])

  const handleSave = () => {
    const email = checkoutEmail.trim()
    if (email && !EMAIL.test(email)) {
      error('Save failed', 'Enter a valid payment email address, or leave it empty.')
      return
    }
    const turningCardsOn = methods.card && !data?.driverPayments?.methods.card
    if (
      turningCardsOn &&
      razorpayEnvironment === 'live' &&
      !window.confirm(
        'Turn on card payments in LIVE mode? Only do this after the PCI DSS assessment is complete.',
      )
    ) {
      return
    }
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
        driverPayments: { checkoutEmail: email, methods },
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
          {activeProvider === 'razorpay' && !savedEmail ? (
            <span className="text-xs font-semibold text-red-600 dark:text-red-400">
              Driver payments blocked: payment email not set
            </span>
          ) : null}
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

        {/* Driver payments: Driver App wallet recharge */}
        <div className="pt-4 border-t border-border space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Driver Payments</h3>

          <SettingFieldRow
            label="Payment email sent to Razorpay"
            hint="Razorpay needs an email on every payment. Use a company mailbox: Razorpay sends payment receipts here. Drivers never see it; their phone number is sent as before."
          >
            <Input
              type="email"
              value={checkoutEmail}
              onChange={(e) => setCheckoutEmail(e.target.value)}
              placeholder="payments@yourcompany.com"
              maxLength={254}
            />
            {!savedEmail ? (
              <p className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400">
                Driver payments are blocked until an email is set.
              </p>
            ) : null}
          </SettingFieldRow>

          <SettingFieldRow
            label="Payment methods shown to drivers"
            hint="A method that is off is hidden in the Driver App the next time Add Money opens. Payments already made are never affected."
          >
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked disabled className="rounded border-border" />
                UPI apps (always on)
              </label>
              {METHOD_LABELS.map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={methods[key]}
                    onChange={(e) => setMethods((m) => ({ ...m, [key]: e.target.checked }))}
                    className="rounded border-border"
                  />
                  {label}
                </label>
              ))}
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                Turn cards on in live mode only after the PCI DSS assessment is complete.
              </p>
            </div>
          </SettingFieldRow>
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

