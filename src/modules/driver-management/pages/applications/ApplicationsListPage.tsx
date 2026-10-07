import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApplications, useDeleteApplication } from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { ConfirmationModal } from '@/shared/components/ConfirmationModal'
import { useToast } from '@/shared/context/toast'
import {
  ClipboardList,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Trash2,
  Eye,
  Edit,
  RefreshCw,
  Clock,
  Ban,
} from 'lucide-react'
import { ApplicationSourceBadge, ActionDropdown } from '../../components'
import type { DriverApplicationEntity } from '../../types'

export const ApplicationsListPage: React.FC = () => {
  const navigate = useNavigate()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { error: showError } = useToast()

  // Last updated timestamp matching Geographic Dashboard
  const [lastUpdated, setLastUpdated] = useState(() => {
    const now = new Date()
    return (
      now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ', ' +
      now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    )
  })

  const { data, isLoading, isError, refetch } = useApplications()
  const { mutate: deleteApp, isPending: isDeleting } = useDeleteApplication()

  const handleRefresh = () => {
    void refetch()
    const now = new Date()
    setLastUpdated(
      now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ', ' +
      now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    )
  }

  const columns: DataTableColumn<DriverApplicationEntity>[] = [
    {
      key: "applicationId",
      label: "Application ID",
      sortable: true,
      align: "left",
      render: (value) => (
        <span className="font-mono text-xs font-bold text-[#1F2B6D] dark:text-[#8B93D9]">{value}</span>
      ),
    },
    {
      key: "driverName",
      label: "Driver Name",
      sortable: true,
      align: "left",
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1F2B6D] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
            {value.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col text-left min-w-0">
            <p className="font-bold text-xs text-slate-800 dark:text-white hover:text-[#1F2B6D] dark:hover:text-[#8B93D9] transition-colors truncate">
              {value}
            </p>
            <p className="text-[10px] text-slate-400 font-mono truncate">{row.mobileNumber}</p>
          </div>
        </div>
      ),
    },
    {
      key: "vehicleType",
      label: "Vehicle Category",
      sortable: true,
      render: (value) => (
        <span className="capitalize font-semibold text-xs text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded">
          {value}
        </span>
      ),
    },
    {
      key: "source",
      label: "Source",
      sortable: true,
      render: (value) => <ApplicationSourceBadge source={value} />,
    },
    {
      key: "submittedAt",
      label: "Submission Date",
      sortable: true,
      render: (value) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {new Date(value).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: "applicationStatus",
      label: "Review Status",
      sortable: true,
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: "actions",
      label: "Actions",
      align: "center",
      render: (_, row) => (
        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => navigate(`/driver-management/applications/${row.id}`)}
            className="px-3 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-md font-semibold text-slate-700 dark:text-slate-300 hover:border-[#1F2B6D] hover:text-[#1F2B6D] dark:hover:border-[#8B93D9] dark:hover:text-[#8B93D9] hover:bg-[#1F2B6D]/5 transition shadow-2xs cursor-pointer"
          >
            Review
          </button>
          <ActionDropdown
            actions={[
              {
                label: "Review Details",
                icon: <Eye className="h-3.5 w-3.5" />,
                onClick: () => navigate(`/driver-management/applications/${row.id}`),
              },
              {
                label: "Edit Application",
                icon: <Edit className="h-3.5 w-3.5" />,
                onClick: () => navigate(`/driver-management/applications/${row.id}/edit`),
              },
              {
                label: "Delete Record",
                icon: <Trash2 className="h-3.5 w-3.5 text-rose-500" />,
                onClick: () => setDeleteId(row.id),
                variant: 'danger',
              },
            ]}
          />
        </div>
      ),
    },
  ]

  const activeData = data?.data ?? []

  // Metrics funnel calculations
  const totalApps = activeData.length
  const pendingReview = activeData.filter((v) => v.applicationStatus === 'pending_review').length
  const underReview = activeData.filter((v) => v.applicationStatus === 'under_review').length
  const approved = activeData.filter((v) => v.applicationStatus === 'approved').length
  const rejected = activeData.filter((v) => v.applicationStatus === 'rejected').length

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteApp(deleteId, {
        onSuccess: () => {
          setDeleteId(null)
          refetch()
        },
        onError: (err: unknown) => {
          setDeleteId(null)
          showError(
            "Delete unavailable",
            err instanceof Error ? err.message : "Could not delete this application",
          )
        },
      })
    }
  }

  return (
    <PageWrapper className="space-y-4 pt-1 pb-6 px-3 sm:px-5">
      {/* ─── 1. Header with Geographic Dashboard Styling ───────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F2B6D] dark:text-white">
            Driver Applications
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Verify driver partner applications, KYC compliance files, and transport permits.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
            Last updated {lastUpdated}
          </span>
          <button
            type="button"
            onClick={handleRefresh}
            title="Refresh data"
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition shadow-2xs cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#1F2B6D]' : ''}`}
            />
          </button>
          <button
            type="button"
            onClick={() => navigate('/driver-management/applications/new')}
            className="bg-[#1F2B6D] hover:bg-[#182258] active:scale-[0.98] text-white px-4 py-2 rounded-[10px] text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Manual Registration</span>
          </button>
        </div>
      </div>

      {/* ─── 2. Top 5 Metric KPI Cards (Geographic Dashboard Style) ────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Applications */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {isLoading ? '...' : totalApps}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Total Applications
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            All time submitted
          </p>
        </div>

        {/* Card 2: Pending Review */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-amber-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {isLoading ? '...' : pendingReview}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Pending Review
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            Awaiting initial audit
          </p>
        </div>

        {/* Card 3: Under Review */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {isLoading ? '...' : underReview}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Under Review
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            In document verification
          </p>
        </div>

        {/* Card 4: Approved */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {isLoading ? '...' : approved}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Approved
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            Ready for onboarding
          </p>
        </div>

        {/* Card 5: Rejected */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-rose-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {isLoading ? '...' : rejected}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Rejected
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            Needs attention / re-upload
          </p>
        </div>
      </div>

      {/* ─── 3. Applications Table ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden p-1">
        <DataTable
          data={activeData}
          columns={columns}
          isLoading={isLoading}
          isError={isError}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          searchPlaceholder="Search by Driver name, Mobile or Application ID..."
          onRowClick={(row) => navigate(`/driver-management/applications/${row.id}`)}
          resultLabel="applications"
        />
      </div>

      <ConfirmationModal
        isOpen={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Registration Record"
        description="Are you absolutely sure you want to purge this driver registration log? This operation is permanent."
        confirmText="Purge Record"
        variant="danger"
        loading={isDeleting}
      />
    </PageWrapper>
  )
}

export default ApplicationsListPage
