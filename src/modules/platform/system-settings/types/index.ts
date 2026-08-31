export type SettingSource = 'database' | 'default'

export type SettingField<T> = {
  value: T
  source: SettingSource
}

export type MaskedSecret = '********' | ''

export type FeatureFlagStatus = 'ON' | 'OFF' | 'PARTIAL'

export type MapProviderName = 'ola' | 'google' | 'mappls'

export type PaymentGatewayName = 'mock' | 'razorpay' | 'stripe'

export type SmsProviderName = 'mock' | 'msg91'

export type PushProviderName = 'mock'

export type EmailProviderName = 'smtp'

export type IntegrationKind = 'payment' | 'sms' | 'push' | 'email' | 'maps'

export type IntegrationHealthStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'DOWN'

export interface GeneralSettings {
  platformName: SettingField<string>
  logoUrl: SettingField<string>
  supportPhone: SettingField<string>
  supportEmail: SettingField<string>
  defaultLanguage: SettingField<string>
  timezone: SettingField<string>
  currency: SettingField<string>
}

export interface UpdateGeneralSettingsBody {
  platformName?: string
  logoUrl?: string
  supportPhone?: string
  supportEmail?: string
  defaultLanguage?: string
  timezone?: string
  currency?: string
}

export interface RideSettings {
  requestExpiryMinutes: SettingField<number>
  dispatchTimeoutSeconds: SettingField<number>
  dispatchBatchSize: SettingField<number>
  searchRadiusMeters: SettingField<number>
  maxSearchRadiusMeters: SettingField<number>
  cancellationGraceMinutes: SettingField<number>
  defaultCancellationFee: SettingField<number>
}

export interface UpdateRideSettingsBody {
  requestExpiryMinutes?: number
  dispatchTimeoutSeconds?: number
  dispatchBatchSize?: number
  searchRadiusMeters?: number
  maxSearchRadiusMeters?: number
  cancellationGraceMinutes?: number
  defaultCancellationFee?: number
}

export interface OtpSettings {
  enabled: SettingField<boolean>
  codeLength: SettingField<number>
  ttlSeconds: SettingField<number>
  maxVerifyAttempts: SettingField<number>
  lockoutSeconds: SettingField<number>
  resendIntervalSeconds: SettingField<number>
}

export interface UpdateOtpSettingsBody {
  enabled?: boolean
  codeLength?: number
  ttlSeconds?: number
  maxVerifyAttempts?: number
  lockoutSeconds?: number
  resendIntervalSeconds?: number
}

export interface OnboardingSettings {
  driverRequiredDocuments: SettingField<string[]>
  vehicleRequiredDocuments: SettingField<string[]>
  driverDocExpiryWarningDays: SettingField<number>
  requireApprovedDocuments: SettingField<boolean>
}

export interface UpdateOnboardingSettingsBody {
  driverRequiredDocuments?: string[]
  vehicleRequiredDocuments?: string[]
  driverDocExpiryWarningDays?: number
  requireApprovedDocuments?: boolean
}

export interface FeatureFlag {
  id: string
  key: string
  name: string | null
  description: string | null
  status: FeatureFlagStatus
  rolloutPercentage: number
  isActive: boolean
}

export interface UpdateFeatureFlagItem {
  key: string
  status?: FeatureFlagStatus
  rolloutPercentage?: number
  isActive?: boolean
}

export interface UpdateFeatureFlagsBody {
  flags: UpdateFeatureFlagItem[]
}

export interface MaintenanceWindow {
  id: string
  title: string
  description: string | null
  affectedServices: string[]
  startsAt: string
  endsAt: string
  isActive: boolean
  createdAt: string
}

export interface MaintenanceSettings {
  enabled: boolean
  message: string
  allowAdminAccess: boolean
  activeWindow: MaintenanceWindow | null
  scheduled: MaintenanceWindow[]
}

export interface UpdateMaintenanceSettingsBody {
  enabled?: boolean
  message?: string
  allowAdminAccess?: boolean
  schedule?: {
    title: string
    description?: string
    startsAt: string
    endsAt: string
    affectedServices?: string[]
  }
}

export interface MapProviderConfigView {
  enabled: boolean
  configured: boolean
  apiKey?: string
  clientId?: string
  clientSecret?: string
  baseUrl?: string
}

export interface MapSettingsView {
  primaryProvider: string
  fallbackProviders: string[]
  version: number
  providers: {
    ola: MapProviderConfigView
    google: MapProviderConfigView
    mappls: MapProviderConfigView
  }
}

export interface UpdateMapSettingsBody {
  primaryProvider: MapProviderName
  fallbackProviders: MapProviderName[]
  expectedVersion?: number
  providers?: {
    ola?: { enabled?: boolean; apiKey?: string; baseUrl?: string }
    google?: { enabled?: boolean; apiKey?: string; baseUrl?: string }
    mappls?: { enabled?: boolean; clientId?: string; clientSecret?: string; baseUrl?: string }
  }
}

export interface TestProviderHealthBody {
  providerName: MapProviderName
  apiKey?: string
  clientId?: string
  clientSecret?: string
  baseUrl?: string
}

export interface TestProviderHealthResult {
  ok: boolean
  providerName: string
  message: string
  responseTimeMs: number
}

export interface PaymentSettingsView {
  defaultGateway: PaymentGatewayName
  defaultCurrency: string
  configured: boolean
  webhookConfigured: boolean
  version: number
  razorpay: { keyId: MaskedSecret; keySecret: MaskedSecret; configured: boolean }
  stripe: { secretKey: MaskedSecret; configured: boolean }
}

export interface UpdatePaymentSettingsBody {
  defaultGateway?: PaymentGatewayName
  defaultCurrency?: string
  razorpayKeyId?: string
  razorpayKeySecret?: string
  stripeSecretKey?: string
  webhookSecret?: string
  expectedVersion?: number
}

export interface SmsSettingsView {
  provider: SmsProviderName
  configured: boolean
  version: number
  msg91: {
    authKey: MaskedSecret
    senderId: string
    otpTemplateId: string
    timeoutMs: number
    configured: boolean
  }
}

export interface UpdateSmsSettingsBody {
  provider?: SmsProviderName
  msg91AuthKey?: string
  msg91SenderId?: string
  msg91OtpTemplateId?: string
  timeoutMs?: number
  expectedVersion?: number
}

export interface PushSettingsView {
  provider: PushProviderName
  configured: boolean
  version: number
  fcm: { serverKey: MaskedSecret; configured: boolean }
}

export interface UpdatePushSettingsBody {
  provider?: PushProviderName
  fcmServerKey?: string
  expectedVersion?: number
}

export interface EmailSettingsView {
  provider: EmailProviderName
  configured: boolean
  version: number
  smtp: {
    host: string
    port: number
    user: string
    password: MaskedSecret
    fromAddress: string
    configured: boolean
  }
}

export interface UpdateEmailSettingsBody {
  provider?: EmailProviderName
  smtpHost?: string
  smtpPort?: number
  smtpUser?: string
  smtpPassword?: string
  fromAddress?: string
  expectedVersion?: number
}

export interface IntegrationTestInput {
  testPhone?: string
  testEmail?: string
}

export interface IntegrationTestResult {
  ok: boolean
  integration: IntegrationKind
  provider: string
  message: string
  responseTimeMs: number
}

export interface IntegrationHealthSnapshot {
  integration: IntegrationKind
  provider: string
  status: IntegrationHealthStatus
  configured: boolean
  lastSuccessAt: string | null
  lastFailureAt: string | null
  recentFailureCount: number
  p95ResponseTimeMs: number | null
  message: string
  probedAt: string | null
}

export interface IntegrationsStatusView {
  overall: IntegrationHealthStatus
  integrations: IntegrationHealthSnapshot[]
}
