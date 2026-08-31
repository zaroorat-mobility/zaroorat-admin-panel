import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getEmailSettings,
  getFeatureFlags,
  getGeneralSettings,
  getIntegrationsStatus,
  getMaintenanceSettings,
  getMapSettings,
  getOnboardingSettings,
  getOtpSettings,
  getPaymentSettings,
  getPushSettings,
  getRideSettings,
  getSmsSettings,
  testEmailIntegration,
  testMapProvider,
  testPaymentIntegration,
  testPushIntegration,
  testSmsIntegration,
  updateEmailSettings,
  updateFeatureFlags,
  updateGeneralSettings,
  updateMaintenanceSettings,
  updateMapSettings,
  updateOnboardingSettings,
  updateOtpSettings,
  updatePaymentSettings,
  updatePushSettings,
  updateRideSettings,
  updateSmsSettings,
} from '../api'
import type {
  IntegrationTestInput,
  TestProviderHealthBody,
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

const settingsKey = ['settings'] as const

export const useGeneralSettings = () =>
  useQuery({ queryKey: [...settingsKey, 'general'], queryFn: getGeneralSettings })

export const useUpdateGeneralSettings = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateGeneralSettingsBody) => updateGeneralSettings(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...settingsKey, 'general'] }),
  })
}

export const useRideSettings = () =>
  useQuery({ queryKey: [...settingsKey, 'ride'], queryFn: getRideSettings })

export const useUpdateRideSettings = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateRideSettingsBody) => updateRideSettings(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...settingsKey, 'ride'] }),
  })
}

export const useOtpSettings = () =>
  useQuery({ queryKey: [...settingsKey, 'otp'], queryFn: getOtpSettings })

export const useUpdateOtpSettings = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateOtpSettingsBody) => updateOtpSettings(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...settingsKey, 'otp'] }),
  })
}

export const useOnboardingSettings = () =>
  useQuery({ queryKey: [...settingsKey, 'onboarding'], queryFn: getOnboardingSettings })

export const useUpdateOnboardingSettings = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateOnboardingSettingsBody) => updateOnboardingSettings(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...settingsKey, 'onboarding'] }),
  })
}

export const useFeatureFlags = () =>
  useQuery({ queryKey: [...settingsKey, 'feature-flags'], queryFn: getFeatureFlags })

export const useUpdateFeatureFlags = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateFeatureFlagsBody) => updateFeatureFlags(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...settingsKey, 'feature-flags'] }),
  })
}

export const useMaintenanceSettings = () =>
  useQuery({ queryKey: [...settingsKey, 'maintenance'], queryFn: getMaintenanceSettings })

export const useUpdateMaintenanceSettings = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateMaintenanceSettingsBody) => updateMaintenanceSettings(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...settingsKey, 'maintenance'] }),
  })
}

export const useMapSettings = () =>
  useQuery({ queryKey: [...settingsKey, 'maps'], queryFn: getMapSettings })

export const useUpdateMapSettings = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateMapSettingsBody) => updateMapSettings(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...settingsKey, 'maps'] })
      qc.invalidateQueries({ queryKey: [...settingsKey, 'integrations', 'status'] })
    },
  })
}

export const useTestMapProvider = () =>
  useMutation({ mutationFn: (body: TestProviderHealthBody) => testMapProvider(body) })

export const useIntegrationsStatus = () =>
  useQuery({ queryKey: [...settingsKey, 'integrations', 'status'], queryFn: getIntegrationsStatus })

export const usePaymentSettings = () =>
  useQuery({ queryKey: [...settingsKey, 'integrations', 'payment'], queryFn: getPaymentSettings })

export const useUpdatePaymentSettings = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdatePaymentSettingsBody) => updatePaymentSettings(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...settingsKey, 'integrations', 'payment'] })
      qc.invalidateQueries({ queryKey: [...settingsKey, 'integrations', 'status'] })
    },
  })
}

export const useTestPaymentIntegration = () =>
  useMutation({ mutationFn: (body?: IntegrationTestInput) => testPaymentIntegration(body) })

export const useSmsSettings = () =>
  useQuery({ queryKey: [...settingsKey, 'integrations', 'sms'], queryFn: getSmsSettings })

export const useUpdateSmsSettings = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateSmsSettingsBody) => updateSmsSettings(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...settingsKey, 'integrations', 'sms'] })
      qc.invalidateQueries({ queryKey: [...settingsKey, 'integrations', 'status'] })
    },
  })
}

export const useTestSmsIntegration = () =>
  useMutation({ mutationFn: (body?: IntegrationTestInput) => testSmsIntegration(body) })

export const usePushSettings = () =>
  useQuery({ queryKey: [...settingsKey, 'integrations', 'push'], queryFn: getPushSettings })

export const useUpdatePushSettings = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdatePushSettingsBody) => updatePushSettings(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...settingsKey, 'integrations', 'push'] })
      qc.invalidateQueries({ queryKey: [...settingsKey, 'integrations', 'status'] })
    },
  })
}

export const useTestPushIntegration = () =>
  useMutation({ mutationFn: (body?: IntegrationTestInput) => testPushIntegration(body) })

export const useEmailSettings = () =>
  useQuery({ queryKey: [...settingsKey, 'integrations', 'email'], queryFn: getEmailSettings })

export const useUpdateEmailSettings = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateEmailSettingsBody) => updateEmailSettings(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...settingsKey, 'integrations', 'email'] })
      qc.invalidateQueries({ queryKey: [...settingsKey, 'integrations', 'status'] })
    },
  })
}

export const useTestEmailIntegration = () =>
  useMutation({ mutationFn: (body?: IntegrationTestInput) => testEmailIntegration(body) })
