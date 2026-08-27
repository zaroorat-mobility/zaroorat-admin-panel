import { storage } from '@/infrastructure/storage'
import type { DriverKycFormInput } from '../schemas'

export type RegistrationDraftTab = 'bio' | 'identity' | 'vehicle' | 'documents' | 'bank' | 'review'

export interface DriverRegistrationDraft {
  form: Partial<DriverKycFormInput>
  activeFormTab: RegistrationDraftTab
  savedAt: string
}

const BASE_KEY = 'zaroorat_driver_kyc_draft'

export function registrationDraftKey(applicationId?: string): string {
  return applicationId ? `${BASE_KEY}:${applicationId}` : `${BASE_KEY}:new`
}

export function saveRegistrationDraft(
  applicationId: string | undefined,
  draft: DriverRegistrationDraft,
): void {
  storage.set(registrationDraftKey(applicationId), draft)
}

export function loadRegistrationDraft(applicationId?: string): DriverRegistrationDraft | null {
  return storage.get<DriverRegistrationDraft>(registrationDraftKey(applicationId))
}

export function clearRegistrationDraft(applicationId?: string): void {
  storage.remove(registrationDraftKey(applicationId))
}

export function notifyDraftRestoredOnce(savedAt: string, showToast: (title: string, message: string) => void): void {
  const flagKey = `zaroorat_kyc_draft_toast:${savedAt}`
  if (sessionStorage.getItem(flagKey)) return
  sessionStorage.setItem(flagKey, '1')
  showToast('Draft restored', 'Your previously saved registration progress has been loaded.')
}
