import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthLayout, DashboardLayout } from '../layouts'
import { AuthGuard, GuestGuard } from '../guards'

// Module Pages
import { LoginPage } from '@/modules/auth'
import { DashboardPage } from '@/modules/dashboard'
import { UsersListPage, UserDetailPage } from '@/modules/users'
import { RidersListPage, RiderDetailPage } from '@/modules/riders'
import { DriversListPage, DriverDetailPage } from '@/modules/drivers'
import { VerificationListPage, VerificationDetailPage } from '@/modules/verification'

/**
 * Main Application Routing Declarations for Zaroorat MyRide
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
        <Route path="login" element={<LoginPage />} />
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
        <Route path="users" element={<UsersListPage />} />
        <Route path="users/:id" element={<UserDetailPage />} />

        {/* Rider Management */}
        <Route path="riders" element={<RidersListPage />} />
        <Route path="riders/:id" element={<RiderDetailPage />} />

        {/* Driver Management */}
        <Route path="drivers" element={<DriversListPage />} />
        <Route path="drivers/:id" element={<DriverDetailPage />} />

        {/* Verification Reviews */}
        <Route path="verification" element={<VerificationListPage />} />
        <Route path="verification/:id" element={<VerificationDetailPage />} />
      </Route>

      {/* Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
export default AppRouter
