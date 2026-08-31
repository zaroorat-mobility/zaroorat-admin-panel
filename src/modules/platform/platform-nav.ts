import {
  Activity,
  Shield,
  RefreshCw,
  MapPin,
  Plug,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react'

export type PlatformSectionId =
  | 'configuration'
  | 'integrations'
  | 'maps'
  | 'monitoring'
  | 'security'
  | 'jobs'

export interface PlatformSectionNavItem {
  to: string
  label: string
  permission: string
  description?: string
}

export interface PlatformSection {
  id: PlatformSectionId
  label: string
  icon: LucideIcon
  permission: string
  defaultHref: string
  items: PlatformSectionNavItem[]
  isActive: (pathname: string) => boolean
  /** When true, content renders full-width without the in-page section nav. */
  hideSectionNav?: boolean
}

const configurationPaths = /^\/platform\/settings\/(general|ride|otp|onboarding|feature-flags|maintenance)(\/|$)/
const integrationsPaths = /^\/platform\/settings\/integrations(\/|$)/
const mapPaths = /^\/platform\/settings\/map(\/|$)/
const monitoringPaths = /^\/platform\/monitoring(\/|$)/
const securityPaths = /^\/platform\/security(\/|$)/
const jobsPaths = /^\/platform\/jobs(\/|$)/

export const platformSections: PlatformSection[] = [
  {
    id: 'configuration',
    label: 'Configuration',
    icon: SlidersHorizontal,
    permission: 'settings:read',
    defaultHref: '/platform/settings/general',
    isActive: (pathname) => configurationPaths.test(pathname),
    items: [
      { to: '/platform/settings/general', label: 'General', permission: 'settings:read' },
      { to: '/platform/settings/ride', label: 'Ride', permission: 'settings:read' },
      { to: '/platform/settings/otp', label: 'OTP', permission: 'settings:read' },
      { to: '/platform/settings/onboarding', label: 'Onboarding', permission: 'settings:read' },
      { to: '/platform/settings/feature-flags', label: 'Feature Flags', permission: 'settings:read' },
      { to: '/platform/settings/maintenance', label: 'Maintenance', permission: 'settings:read' },
    ],
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: Plug,
    permission: 'settings:read',
    defaultHref: '/platform/settings/integrations/overview',
    isActive: (pathname) => integrationsPaths.test(pathname),
    items: [
      { to: '/platform/settings/integrations/overview', label: 'Overview', permission: 'settings:read' },
      { to: '/platform/settings/integrations/payment', label: 'Payment', permission: 'settings:read' },
      { to: '/platform/settings/integrations/sms', label: 'SMS', permission: 'settings:read' },
      { to: '/platform/settings/integrations/push', label: 'Push', permission: 'settings:read' },
      { to: '/platform/settings/integrations/email', label: 'Email', permission: 'settings:read' },
    ],
  },
  {
    id: 'maps',
    label: 'Maps',
    icon: MapPin,
    permission: 'settings:read',
    defaultHref: '/platform/settings/map',
    isActive: (pathname) => mapPaths.test(pathname),
    hideSectionNav: true,
    items: [
      { to: '/platform/settings/map', label: 'Map Providers', permission: 'settings:read' },
    ],
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    icon: Activity,
    permission: 'monitoring:read',
    defaultHref: '/platform/monitoring/health',
    isActive: (pathname) => monitoringPaths.test(pathname),
    items: [
      {
        to: '/platform/monitoring/health',
        label: 'Health',
        permission: 'monitoring:read',
        description: 'Live readiness checks across API, database, Redis, workers, queues, payment, and map providers.',
      },
      {
        to: '/platform/monitoring/performance',
        label: 'Performance',
        permission: 'monitoring:read',
        description: 'HTTP throughput, error rates, queue backlog, outbox status, and process resource usage.',
      },
      {
        to: '/platform/monitoring/errors',
        label: 'Errors',
        permission: 'monitoring:read',
        description: 'Recent application errors from outbox failures and runtime error tracking.',
      },
      {
        to: '/platform/monitoring/alerts',
        label: 'Alerts',
        permission: 'monitoring:read',
        description: 'Derived alerts from health checks, queue backlogs, outbox status, and API error rates.',
      },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    icon: Shield,
    permission: 'security:read',
    defaultHref: '/platform/security/sessions',
    isActive: (pathname) => securityPaths.test(pathname),
    items: [
      {
        to: '/platform/security/sessions',
        label: 'Sessions',
        permission: 'security:read',
        description: 'Monitor and revoke admin panel login sessions across staff accounts.',
      },
      {
        to: '/platform/security/login-history',
        label: 'Login History',
        permission: 'security:read',
        description: 'Historical record of admin panel authentication events.',
      },
      {
        to: '/platform/security/events',
        label: 'Security Events',
        permission: 'security:read',
        description: 'Audit trail of security-related admin actions and authentication events.',
      },
      {
        to: '/platform/security/policy',
        label: 'Access Policy',
        permission: 'security:read',
        description: 'Configure session limits, MFA requirements, and access controls for the admin panel.',
      },
    ],
  },
  {
    id: 'jobs',
    label: 'Jobs & Queues',
    icon: RefreshCw,
    permission: 'jobs:read',
    defaultHref: '/platform/jobs',
    isActive: (pathname) => jobsPaths.test(pathname),
    hideSectionNav: true,
    items: [
      { to: '/platform/jobs', label: 'Queue Overview', permission: 'jobs:read' },
    ],
  },
]

export function getActivePlatformSection(pathname: string): PlatformSection | undefined {
  return platformSections.find((section) => section.isActive(pathname))
}

export function shouldShowSectionNav(section: PlatformSection, visibleItemCount: number): boolean {
  if (section.hideSectionNav || visibleItemCount <= 1) return false
  return true
}

export function isPlatformNavItemActive(pathname: string, to: string): boolean {
  if (pathname === to) return true
  if (to === '/platform/jobs') return pathname.startsWith('/platform/jobs/')
  return pathname.startsWith(`${to}/`)
}

const sectionDescriptions: Record<PlatformSectionId, string> = {
  configuration: 'Core platform behaviour, ride rules, OTP, onboarding, and feature flags.',
  integrations: 'Payment, SMS, push, and email provider configuration.',
  maps: 'Map provider keys, routing, and geocoding settings.',
  monitoring: 'System health, performance metrics, errors, and alerts.',
  security: 'Sessions, login history, security events, and access policy.',
  jobs: 'BullMQ queue backlogs, scheduled jobs, and worker pipeline health.',
}

export function getActivePlatformNavItem(
  pathname: string,
  section?: PlatformSection,
): PlatformSectionNavItem | undefined {
  if (!section) return undefined
  return section.items.find((item) => isPlatformNavItemActive(pathname, item.to))
}

export function getPlatformPageMeta(
  pathname: string,
  section: PlatformSection | undefined,
  showSectionNav: boolean,
): { title: string; description: string } {
  const queueMatch = pathname.match(/^\/platform\/jobs\/queues\/([^/]+)/)
  if (queueMatch) {
    return {
      title: `Queue: ${queueMatch[1]}`,
      description: 'Browse jobs by status, inspect payloads, and retry or remove failed jobs.',
    }
  }

  if (!section) {
    return {
      title: 'Platform',
      description: 'System configuration, integrations, monitoring, security, and background jobs.',
    }
  }

  const activeItem = getActivePlatformNavItem(pathname, section)

  if (showSectionNav && activeItem) {
    return {
      title: activeItem.label,
      description: activeItem.description ?? sectionDescriptions[section.id] ?? '',
    }
  }

  return {
    title: section.label,
    description: sectionDescriptions[section.id] ?? '',
  }
}
