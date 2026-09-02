import React from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthLayout, DashboardLayout } from '../layouts'
import { AuthGuard, GuestGuard, RequirePermission } from '../guards'
import { ForbiddenPage } from '../pages/ForbiddenPage'

// Module Descendant Route Elements
import { AuthRoutes } from '@/modules/auth'
import { DashboardPage } from '@/modules/dashboard'
import { RiderRoutes } from '@/modules/riders'
import { DriverManagementRoutes, VehicleManagementRoutes } from '@/modules/driver-management'
import { AuditLogRoutes } from '@/modules/audit-log'
import { PricingManagementRoutes } from '@/modules/pricing-management'
import { PromotionsManagementRoutes } from '@/modules/promotions-management'
import { ReferralManagementRoutes } from '@/modules/referral-management'
import { OperationsRoutes } from '@/modules/operations'
import { FinancialOperationsRoutes } from '@/modules/financial-operations'
import { SchoolMobilityRoutes } from '@/modules/school-mobility'
import { CarpoolingRoutes } from '@/modules/carpooling'
import { DocumentControllerRoutes } from '@/modules/document-controller'
<<<<<<< HEAD
import { MapSettingsPage } from '@/modules/system-settings'
=======
import { GeographicManagementRoutes } from '@/modules/geographic-management'
<<<<<<< HEAD
>>>>>>> 9b709dcc78978d4b4b83e1b67acd402f0760b8af
=======
import { CommunicationsRoutes } from '@/modules/communications'
import { PlatformLayoutPage, platformChildRoutes } from '@/modules/platform'
import { accessControlChildRoutes } from '@/modules/access-control'
>>>>>>> 3ebba32dc928d6685aacb415130b2d21b66b13df

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

        {/* Access Control & Admin Users */}
        <Route path="access-control" element={<Outlet />}>
          {accessControlChildRoutes}
        </Route>

        {/* Platform */}
        <Route path="platform" element={<PlatformLayoutPage />}>
          {platformChildRoutes}
        </Route>

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

        {/* Vehicle Management */}
        <Route
          path="vehicle-management/*"
          element={
            <RequirePermission requiredPermission="vehicles:read">
              <VehicleManagementRoutes />
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

        {/* Geographic Management */}
        <Route
          path="geographic-management/*"
          element={
            <RequirePermission requiredPermission="geography:read">
              <GeographicManagementRoutes />
            </RequirePermission>
          }
        />

        {/* Promotions & Campaigns */}
        <Route
          path="promotions-management/*"
          element={
            <RequirePermission requiredPermission="campaigns:read">
              <PromotionsManagementRoutes />
            </RequirePermission>
          }
        />

        {/* Referral & Rewards */}
        <Route
          path="referral-management/*"
          element={
            <RequirePermission requiredPermission="referrals:read">
              <ReferralManagementRoutes />
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

        {/* Communications */}
        <Route
          path="communications/*"
          element={
            <RequirePermission requiredPermission="communications:read">
              <CommunicationsRoutes />
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
<<<<<<< HEAD

        {/* System & Map Provider Settings */}
        <Route path="settings/maps" element={<MapSettingsPage />} />
        <Route path="settings" element={<Navigate to="/settings/maps" replace />} />

        {/* Legacy redirect routes */}
        <Route path="drivers/*" element={<Navigate to="/driver-management/drivers" replace />} />
        <Route path="verification/*" element={<Navigate to="/driver-management/applications" replace />} />
=======
>>>>>>> 3ebba32dc928d6685aacb415130b2d21b66b13df
      </Route>

      {/* Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default AppRouter
