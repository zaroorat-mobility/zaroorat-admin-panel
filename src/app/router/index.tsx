import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthLayout, DashboardLayout } from '../layouts'
import { AuthGuard, GuestGuard } from '../guards'

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
        <Route path="dashboard" element={<DashboardPage />} />

        {/* User Management */}
        <Route path="users/*" element={<UserRoutes />} />

        {/* Rider Management */}
        <Route path="riders/*" element={<RiderRoutes />} />

        {/* Driver Management */}
        <Route path="driver-management/*" element={<DriverManagementRoutes />} />

        {/* Pricing Management */}
        <Route path="pricing-management/*" element={<PricingManagementRoutes />} />

        {/* Audit Log */}
        <Route path="audit-log/*" element={<AuditLogRoutes />} />

        {/* Operations Domain */}
        <Route path="operations/*" element={<OperationsRoutes />} />

        {/* Financial Operations Domain */}
        <Route path="financial-operations/*" element={<FinancialOperationsRoutes />} />

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
