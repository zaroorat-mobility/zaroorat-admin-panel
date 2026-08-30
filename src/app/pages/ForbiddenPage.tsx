import React from 'react'
import { Link } from 'react-router-dom'
import { PageWrapper } from '@/app/layouts/PageWrapper'

export const ForbiddenPage: React.FC = () => (
  <PageWrapper>
    <div className="max-w-lg mt-16 space-y-3">
      <h1 className="text-xl font-semibold">You do not have access to this area</h1>
      <p className="text-sm text-slate-600">
        Your role is missing the permission this page needs. Ask a system admin to grant it from
        Role access.
      </p>
      <Link to="/dashboard" className="text-sm font-semibold text-[#2B317A]">
        Back to dashboard
      </Link>
    </div>
  </PageWrapper>
)

export default ForbiddenPage
