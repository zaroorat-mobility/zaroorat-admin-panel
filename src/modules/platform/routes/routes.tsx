import { Navigate, Route } from 'react-router-dom'
import { RequirePermission } from '@/app/guards'
import { GeneralSettingsPage } from '../system-settings/platform/pages/GeneralSettingsPage'
import { RideSettingsPage } from '../system-settings/platform/pages/RideSettingsPage'
import { OtpSettingsPage } from '../system-settings/platform/pages/OtpSettingsPage'
import { OnboardingSettingsPage } from '../system-settings/platform/pages/OnboardingSettingsPage'
import { FeatureFlagsPage } from '../system-settings/platform/pages/FeatureFlagsPage'
import { MaintenanceSettingsPage } from '../system-settings/platform/pages/MaintenanceSettingsPage'
import { IntegrationsOverviewPage } from '../system-settings/integrations/pages/IntegrationsOverviewPage'
import { PaymentIntegrationPage } from '../system-settings/integrations/pages/PaymentIntegrationPage'
import { SmsIntegrationPage } from '../system-settings/integrations/pages/SmsIntegrationPage'
import { PushIntegrationPage } from '../system-settings/integrations/pages/PushIntegrationPage'
import { EmailIntegrationPage } from '../system-settings/integrations/pages/EmailIntegrationPage'
import { MapSettingsPage } from '../system-settings/map/pages/MapSettingsPage'
import {
  ComponentStylesPage,
  FontsSettingsPage,
  LocalesSettingsPage,
  ThemeSettingsPage,
  TranslationsPage,
} from '../app-config'
import { HealthPage } from '../monitoring/pages/HealthPage'
import { PerformancePage } from '../monitoring/pages/PerformancePage'
import { ErrorsPage } from '../monitoring/pages/ErrorsPage'
import { AlertsPage } from '../monitoring/pages/AlertsPage'
import { SessionsPage } from '../security/pages/SessionsPage'
import { LoginHistoryPage } from '../security/pages/LoginHistoryPage'
import { SecurityEventsPage } from '../security/pages/SecurityEventsPage'
import { SecurityPolicyPage } from '../security/pages/SecurityPolicyPage'
import { QueuesOverviewPage } from '../jobs/pages/QueuesOverviewPage'
import { QueueJobsPage } from '../jobs/pages/QueueJobsPage'

export const platformChildRoutes = (
  <>
    <Route index element={<Navigate to="settings/general" replace />} />

    <Route
      path="settings/general"
      element={
        <RequirePermission requiredPermission="settings:read">
          <GeneralSettingsPage />
        </RequirePermission>
      }
    />
    <Route
      path="settings/ride"
      element={
        <RequirePermission requiredPermission="settings:read">
          <RideSettingsPage />
        </RequirePermission>
      }
    />
    <Route
      path="settings/otp"
      element={
        <RequirePermission requiredPermission="settings:read">
          <OtpSettingsPage />
        </RequirePermission>
      }
    />
    <Route
      path="settings/onboarding"
      element={
        <RequirePermission requiredPermission="settings:read">
          <OnboardingSettingsPage />
        </RequirePermission>
      }
    />
    <Route
      path="settings/feature-flags"
      element={
        <RequirePermission requiredPermission="settings:read">
          <FeatureFlagsPage />
        </RequirePermission>
      }
    />
    <Route
      path="settings/maintenance"
      element={
        <RequirePermission requiredPermission="settings:read">
          <MaintenanceSettingsPage />
        </RequirePermission>
      }
    />
    <Route
      path="settings/integrations"
      element={<Navigate to="/platform/settings/integrations/overview" replace />}
    />
    <Route
      path="settings/integrations/overview"
      element={
        <RequirePermission requiredPermission="settings:read">
          <IntegrationsOverviewPage />
        </RequirePermission>
      }
    />
    <Route
      path="settings/integrations/payment"
      element={
        <RequirePermission requiredPermission="settings:read">
          <PaymentIntegrationPage />
        </RequirePermission>
      }
    />
    <Route
      path="settings/integrations/sms"
      element={
        <RequirePermission requiredPermission="settings:read">
          <SmsIntegrationPage />
        </RequirePermission>
      }
    />
    <Route
      path="settings/integrations/push"
      element={
        <RequirePermission requiredPermission="settings:read">
          <PushIntegrationPage />
        </RequirePermission>
      }
    />
    <Route
      path="settings/integrations/email"
      element={
        <RequirePermission requiredPermission="settings:read">
          <EmailIntegrationPage />
        </RequirePermission>
      }
    />
    <Route
      path="settings/map"
      element={
        <RequirePermission requiredPermission="settings:read">
          <MapSettingsPage />
        </RequirePermission>
      }
    />

    <Route
      path="settings/app-config"
      element={<Navigate to="/platform/settings/app-config/theme" replace />}
    />
    <Route
      path="settings/app-config/theme"
      element={
        <RequirePermission requiredPermission="settings:read">
          <ThemeSettingsPage />
        </RequirePermission>
      }
    />
    <Route
      path="settings/app-config/components"
      element={
        <RequirePermission requiredPermission="settings:read">
          <ComponentStylesPage />
        </RequirePermission>
      }
    />
    <Route
      path="settings/app-config/fonts"
      element={
        <RequirePermission requiredPermission="settings:read">
          <FontsSettingsPage />
        </RequirePermission>
      }
    />
    <Route
      path="settings/app-config/locales"
      element={
        <RequirePermission requiredPermission="settings:read">
          <LocalesSettingsPage />
        </RequirePermission>
      }
    />
    <Route
      path="settings/app-config/translations"
      element={
        <RequirePermission requiredPermission="settings:read">
          <TranslationsPage />
        </RequirePermission>
      }
    />

    <Route
      path="monitoring"
      element={<Navigate to="/platform/monitoring/health" replace />}
    />
    <Route
      path="monitoring/health"
      element={
        <RequirePermission requiredPermission="monitoring:read">
          <HealthPage />
        </RequirePermission>
      }
    />
    <Route
      path="monitoring/performance"
      element={
        <RequirePermission requiredPermission="monitoring:read">
          <PerformancePage />
        </RequirePermission>
      }
    />
    <Route
      path="monitoring/errors"
      element={
        <RequirePermission requiredPermission="monitoring:read">
          <ErrorsPage />
        </RequirePermission>
      }
    />
    <Route
      path="monitoring/alerts"
      element={
        <RequirePermission requiredPermission="monitoring:read">
          <AlertsPage />
        </RequirePermission>
      }
    />

    <Route
      path="security"
      element={<Navigate to="/platform/security/sessions" replace />}
    />
    <Route
      path="security/sessions"
      element={
        <RequirePermission requiredPermission="security:read">
          <SessionsPage />
        </RequirePermission>
      }
    />
    <Route
      path="security/login-history"
      element={
        <RequirePermission requiredPermission="security:read">
          <LoginHistoryPage />
        </RequirePermission>
      }
    />
    <Route
      path="security/events"
      element={
        <RequirePermission requiredPermission="security:read">
          <SecurityEventsPage />
        </RequirePermission>
      }
    />
    <Route
      path="security/policy"
      element={
        <RequirePermission requiredPermission="security:read">
          <SecurityPolicyPage />
        </RequirePermission>
      }
    />

    <Route
      path="jobs"
      element={
        <RequirePermission requiredPermission="jobs:read">
          <QueuesOverviewPage />
        </RequirePermission>
      }
    />
    <Route
      path="jobs/queues/:queueName"
      element={
        <RequirePermission requiredPermission="jobs:read">
          <QueueJobsPage />
        </RequirePermission>
      }
    />
  </>
)

export default platformChildRoutes
