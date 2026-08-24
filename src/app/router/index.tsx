import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthLayout, DashboardLayout } from '../layouts'
import { AuthGuard, GuestGuard, RequirePermission } from '../guards'
import { ForbiddenPage } from '../pages/ForbiddenPage'

// Module Descendant Route Elements
import { AuthRoutes } from '@/modules/auth'
import { DashboardPage } from '@/modules/dashboard'
import { UserRoutes } from '@/modules/users'
import { RiderRoutes } from '@/modules/riders'
import { DriverManagementRoutes } from '@/modules/driver-management'
import { AuditLogRoutes } from '@/modules/audit-log'
import { PricingManagementRoutes } from '@/modules/pricing-management'
import { OperationsRoutes } from '@/modules/operations'
import { FinancialOperationsRoutes } from '@/modules/financial-operations'
import { SchoolMobilityRoutes } from '@/modules/school-mobility'
import { NotificationsRoutes } from '@/modules/notifications'
import { CarpoolingRoutes } from '@/modules/carpooling'
import { DocumentControllerRoutes } from '@/modules/document-controller'

/**
 * Main Application Routing Declarations for Zaroorat Mobility
 * Configures top-level layout wrappers and delegates descendant sub-paths
 * directly to the respective module routing components.
 */
export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public / Auth routes */}
      <Route
        element={
          <GuestGuard>
            <AuthLayout />
          </GuestGuard>
        }
      >
        <Route path="/*" element={<AuthRoutes />} />
      </Route>

      {/* Protected Dashboard/Admin Panel routes */}
      <Route
        element={
          <AuthGuard>
            <DashboardLayout />
          </AuthGuard>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="forbidden" element={<ForbiddenPage />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* User Management */}
        <Route path="users/*" element={<UserRoutes />} />

        {/* Rider Management */}
        <Route
          path="riders/*"
          element={
            <RequirePermission requiredPermission="riders:read">
              <RiderRoutes />
            </RequirePermission>
          }
        />

        {/* Driver Management */}
        <Route
          path="driver-management/*"
          element={
            <RequirePermission requiredPermission="drivers:read">
              <DriverManagementRoutes />
            </RequirePermission>
          }
        />

        {/* Pricing Management */}
        <Route
          path="pricing-management/*"
          element={
            <RequirePermission requiredPermission="pricing:read">
              <PricingManagementRoutes />
            </RequirePermission>
          }
        />

        {/* Campaigns & Notifications */}
        <Route
          path="notifications/*"
          element={
            <RequirePermission requiredPermission="campaigns:read">
              <NotificationsRoutes />
            </RequirePermission>
          }
        />

        {/* Document Controller Expiry and Compliance Verification */}
        <Route
          path="document-controller/*"
          element={
            <RequirePermission requiredPermission="documents:read">
              <DocumentControllerRoutes />
            </RequirePermission>
          }
        />

        {/* Carpooling Settings & Monitoring */}
        <Route
          path="carpooling/*"
          element={
            <RequirePermission requiredPermission="carpooling:read">
              <CarpoolingRoutes />
            </RequirePermission>
          }
        />

        {/* Audit Log */}
        <Route
          path="audit-log/*"
          element={
            <RequirePermission requiredPermission="audit:read">
              <AuditLogRoutes />
            </RequirePermission>
          }
        />

        {/* Operations Domain */}
        <Route
          path="operations/*"
          element={
            <RequirePermission requiredPermission="operations:read">
              <OperationsRoutes />
            </RequirePermission>
          }
        />

        {/* Financial Operations Domain */}
        <Route
          path="financial-operations/*"
          element={
            <RequirePermission requiredPermission="finance:read">
              <FinancialOperationsRoutes />
            </RequirePermission>
          }
        />

        {/* School Mobility */}
        <Route
          path="school-mobility/*"
          element={
            <RequirePermission requiredPermission="school:read">
              <SchoolMobilityRoutes />
            </RequirePermission>
          }
        />

        {/* Legacy redirect routes */}
        <Route path="drivers/*" element={<Navigate to="/driver-management/drivers" replace />} />
        <Route path="verification/*" element={<Navigate to="/driver-management/applications" replace />} />
      </Route>

      {/* Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default AppRouter
