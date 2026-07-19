import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApplications, useDeleteApplication } from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { InfoCard, InfoCardGrid } from '@/shared/components/InfoCard'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmationModal } from '@/shared/components/ConfirmationModal'
import { ClipboardList, ShieldCheck, ShieldAlert, Plus, Trash2, Eye, Edit } from 'lucide-react'
import { ApplicationSourceBadge, ActionDropdown } from '../../components'
import type { DriverApplicationEntity } from '../../types'

export const ApplicationsListPage: React.FC = () => {
  const navigate = useNavigate()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useApplications()
  const { mutate: deleteApp, isPending: isDeleting } = useDeleteApplication()

  const columns: DataTableColumn<DriverApplicationEntity>[] = [
    {
      key: 'applicationId',
      label: 'Application ID',
      sortable: true,
      align: 'left',
      render: (value) => (
        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{value}</span>
      )
    },
    {
      key: 'driverName',
      label: 'Driver Name',
      sortable: true,
      align: 'left',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
            {value.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-100">{value}</p>
            <p className="text-[10px] text-muted-foreground">{row.mobileNumber}</p>
          </div>
        </div>
      )
    },
    {
      key: 'vehicleType',
      label: 'Vehicle Category',
      sortable: true,
      render: (value) => (
        <span className="capitalize font-semibold text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded dark:bg-slate-800 dark:text-slate-400">
          {value}
        </span>
      ),
    },
    {
      key: 'source',
      label: 'Source',
      sortable: true,
      render: (value) => <ApplicationSourceBadge source={value} />,
    },
    {
      key: 'submittedAt',
      label: 'Submission Date',
      sortable: true,
      render: (value) => (
        <span className="text-xs text-muted-foreground">
          {new Date(value).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </span>
      ),
    },
    {
      key: 'applicationStatus',
      label: 'Review Status',
      sortable: true,
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center',
      render: (_, row) => (
        <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <ActionDropdown
            actions={[
              {
                label: 'Review Details',
                icon: <Eye className="h-3.5 w-3.5" />,
                onClick: () => navigate(`/driver-management/applications/${row.id}`)
              },
              {
                label: 'Edit Application',
                icon: <Edit className="h-3.5 w-3.5" />,
                onClick: () => navigate(`/driver-management/applications/${row.id}/edit`)
              },
              {
                label: 'Delete Record',
                icon: <Trash2 className="h-3.5 w-3.5 text-rose-500" />,
                onClick: () => setDeleteId(row.id),
                variant: 'danger'
              }
            ]}
          />
        </div>
      )
    }
  ]

  const activeData = data?.data ?? []

  // Metrics funnel calculations
  const totalApps = activeData.length
  const pendingReview = activeData.filter(v => v.applicationStatus === 'pending_review').length
  const underReview = activeData.filter(v => v.applicationStatus === 'under_review').length
  const approved = activeData.filter(v => v.applicationStatus === 'approved').length
  const rejected = activeData.filter(v => v.applicationStatus === 'rejected').length

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteApp(deleteId, {
        onSuccess: () => {
          setDeleteId(null)
          refetch()
        }
      })
    }
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Driver Applications"
        description="Verify driver partner applications, KYC compliance files, and transport permits."
        actions={
          <Button
            variant="primary"
            className="gap-2 text-xs font-semibold h-9 rounded-lg"
            onClick={() => navigate('/driver-management/applications/new')}
          >
            <Plus className="h-4 w-4" />
            <span>Manual Registration</span>
          </Button>
        }
      />

      <div className="space-y-6">
        <InfoCardGrid cols={5}>
          <InfoCard
            label="Total Applications"
            value={totalApps}
            icon={<ClipboardList className="h-5 w-5 text-slate-500" />}
            variant="blue"
            loading={isLoading}
          />
          <InfoCard
            label="Pending Review"
            value={pendingReview}
            icon={<ShieldAlert className="h-5 w-5 text-amber-500" />}
            variant="amber"
            loading={isLoading}
          />
          <InfoCard
            label="Under Review"
            value={underReview}
            icon={<ShieldAlert className="h-5 w-5 text-indigo-500" />}
            variant="indigo"
            loading={isLoading}
          />
          <InfoCard
            label="Approved"
            value={approved}
            icon={<ShieldCheck className="h-5 w-5 text-emerald-500" />}
            variant="green"
            loading={isLoading}
          />
          <InfoCard
            label="Rejected"
            value={rejected}
            icon={<ShieldAlert className="h-5 w-5 text-rose-500" />}
            variant="red"
            loading={isLoading}
          />
        </InfoCardGrid>

        <DataTable
          data={activeData}
          columns={columns}
          isLoading={isLoading}
          isError={isError}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          searchPlaceholder="Search by Driver name, Mobile or Application ID..."
          onRowClick={(row) => navigate(`/driver-management/applications/${row.id}`)}
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
