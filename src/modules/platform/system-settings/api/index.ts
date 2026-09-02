import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type {
  EmailSettingsView,
  FeatureFlag,
  GeneralSettings,
  IntegrationTestInput,
  IntegrationTestResult,
  IntegrationsStatusView,
  MaintenanceSettings,
  MapSettingsView,
  OnboardingSettings,
  OtpSettings,
  PaymentSettingsView,
  PushSettingsView,
  RideSettings,
  SmsSettingsView,
  TestProviderHealthBody,
  TestProviderHealthResult,
  UpdateEmailSettingsBody,
  UpdateFeatureFlagsBody,
  UpdateGeneralSettingsBody,
  UpdateMaintenanceSettingsBody,
  UpdateMapSettingsBody,
  UpdateOnboardingSettingsBody,
  UpdateOtpSettingsBody,
  UpdatePaymentSettingsBody,
  UpdatePushSettingsBody,
  UpdateRideSettingsBody,
  UpdateSmsSettingsBody,
} from '../types'

const unwrap = <T>(res: { data: { data: T } }) => res.data.data

export const getGeneralSettings = async (): Promise<GeneralSettings> => {
  const res = await api.get<{ data: GeneralSettings }>(API_ENDPOINTS.settings.general)
  return unwrap(res)
}

export const updateGeneralSettings = async (body: UpdateGeneralSettingsBody): Promise<GeneralSettings> => {
  const res = await api.put<{ data: GeneralSettings }>(API_ENDPOINTS.settings.general, body)
  return unwrap(res)
}

export const getRideSettings = async (): Promise<RideSettings> => {
  const res = await api.get<{ data: RideSettings }>(API_ENDPOINTS.settings.ride)
  return unwrap(res)
}

export const updateRideSettings = async (body: UpdateRideSettingsBody): Promise<RideSettings> => {
  const res = await api.put<{ data: RideSettings }>(API_ENDPOINTS.settings.ride, body)
  return unwrap(res)
}

export const getOtpSettings = async (): Promise<OtpSettings> => {
  const res = await api.get<{ data: OtpSettings }>(API_ENDPOINTS.settings.otp)
  return unwrap(res)
}

export const updateOtpSettings = async (body: UpdateOtpSettingsBody): Promise<OtpSettings> => {
  const res = await api.put<{ data: OtpSettings }>(API_ENDPOINTS.settings.otp, body)
  return unwrap(res)
}

export const getOnboardingSettings = async (): Promise<OnboardingSettings> => {
  const res = await api.get<{ data: OnboardingSettings }>(API_ENDPOINTS.settings.onboarding)
  return unwrap(res)
}

export const updateOnboardingSettings = async (
  body: UpdateOnboardingSettingsBody,
): Promise<OnboardingSettings> => {
  const res = await api.put<{ data: OnboardingSettings }>(API_ENDPOINTS.settings.onboarding, body)
  return unwrap(res)
}

export const getFeatureFlags = async (): Promise<FeatureFlag[]> => {
  const res = await api.get<{ data: FeatureFlag[] }>(API_ENDPOINTS.settings.featureFlags)
  return unwrap(res)
}

export const updateFeatureFlags = async (body: UpdateFeatureFlagsBody): Promise<FeatureFlag[]> => {
  const res = await api.put<{ data: FeatureFlag[] }>(API_ENDPOINTS.settings.featureFlags, body)
  return unwrap(res)
}

export const getMaintenanceSettings = async (): Promise<MaintenanceSettings> => {
  const res = await api.get<{ data: MaintenanceSettings }>(API_ENDPOINTS.settings.maintenance)
  return unwrap(res)
}

export const updateMaintenanceSettings = async (
  body: UpdateMaintenanceSettingsBody,
): Promise<MaintenanceSettings> => {
  const res = await api.put<{ data: MaintenanceSettings }>(API_ENDPOINTS.settings.maintenance, body)
  return unwrap(res)
}

export const getMapSettings = async (): Promise<MapSettingsView> => {
  const res = await api.get<{ data: MapSettingsView }>(API_ENDPOINTS.settings.maps)
  return unwrap(res)
}

export const updateMapSettings = async (body: UpdateMapSettingsBody): Promise<MapSettingsView> => {
  const res = await api.put<{ data: MapSettingsView }>(API_ENDPOINTS.settings.maps, body)
  return unwrap(res)
}

export const testMapProvider = async (body: TestProviderHealthBody): Promise<TestProviderHealthResult> => {
  const res = await api.post<{ data: TestProviderHealthResult }>(API_ENDPOINTS.settings.mapsTest, body)
  return unwrap(res)
}

export const getPaymentSettings = async (): Promise<PaymentSettingsView> => {
  const res = await api.get<{ data: PaymentSettingsView }>(API_ENDPOINTS.settings.integrations.payment)
  return unwrap(res)
}

export const updatePaymentSettings = async (body: UpdatePaymentSettingsBody): Promise<PaymentSettingsView> => {
  const res = await api.put<{ data: PaymentSettingsView }>(API_ENDPOINTS.settings.integrations.payment, body)
  return unwrap(res)
}

export const testPaymentIntegration = async (body?: IntegrationTestInput): Promise<IntegrationTestResult> => {
  const res = await api.post<{ data: IntegrationTestResult }>(
    API_ENDPOINTS.settings.integrations.paymentTest,
    body ?? {},
  )
  return unwrap(res)
}

export const getSmsSettings = async (): Promise<SmsSettingsView> => {
  const res = await api.get<{ data: SmsSettingsView }>(API_ENDPOINTS.settings.integrations.sms)
  return unwrap(res)
}

export const updateSmsSettings = async (body: UpdateSmsSettingsBody): Promise<SmsSettingsView> => {
  const res = await api.put<{ data: SmsSettingsView }>(API_ENDPOINTS.settings.integrations.sms, body)
  return unwrap(res)
}

export const testSmsIntegration = async (body?: IntegrationTestInput): Promise<IntegrationTestResult> => {
  const res = await api.post<{ data: IntegrationTestResult }>(
    API_ENDPOINTS.settings.integrations.smsTest,
    body ?? {},
  )
  return unwrap(res)
}

export const getPushSettings = async (): Promise<PushSettingsView> => {
  const res = await api.get<{ data: PushSettingsView }>(API_ENDPOINTS.settings.integrations.push)
  return unwrap(res)
}

export const updatePushSettings = async (body: UpdatePushSettingsBody): Promise<PushSettingsView> => {
  const res = await api.put<{ data: PushSettingsView }>(API_ENDPOINTS.settings.integrations.push, body)
  return unwrap(res)
}

export const testPushIntegration = async (body?: IntegrationTestInput): Promise<IntegrationTestResult> => {
  const res = await api.post<{ data: IntegrationTestResult }>(
    API_ENDPOINTS.settings.integrations.pushTest,
    body ?? {},
  )
  return unwrap(res)
}

export const getEmailSettings = async (): Promise<EmailSettingsView> => {
  const res = await api.get<{ data: EmailSettingsView }>(API_ENDPOINTS.settings.integrations.email)
  return unwrap(res)
}

export const updateEmailSettings = async (body: UpdateEmailSettingsBody): Promise<EmailSettingsView> => {
  const res = await api.put<{ data: EmailSettingsView }>(API_ENDPOINTS.settings.integrations.email, body)
  return unwrap(res)
}

export const testEmailIntegration = async (body?: IntegrationTestInput): Promise<IntegrationTestResult> => {
  const res = await api.post<{ data: IntegrationTestResult }>(
    API_ENDPOINTS.settings.integrations.emailTest,
    body ?? {},
  )
  return unwrap(res)
}

export const getIntegrationsStatus = async (): Promise<IntegrationsStatusView> => {
  const res = await api.get<{ data: IntegrationsStatusView }>(API_ENDPOINTS.settings.integrations.status)
  return unwrap(res)
}
