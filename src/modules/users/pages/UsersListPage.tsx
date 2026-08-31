import React, { useState } from 'react'
import { Plus, Users, UserCheck, UserX } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUsers, useDeleteUser } from '../hooks'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { ConfirmationModal } from '@/shared/components/ConfirmationModal'
import { Button } from '@/shared/components/ui/Button'
import { InfoCard, InfoCardGrid } from '@/shared/components/InfoCard'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { roleDisplayName } from '@/infrastructure/permissions'
import type { UserEntity } from '../types'

const formatDate = (value?: string | null): string => {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export const UsersListPage: React.FC = () => {
  const navigate = useNavigate()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { data, isLoading, isError, refetch } = useUsers()
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser()

  const columns: DataTableColumn<UserEntity>[] = [
    { key: 'name', label: 'Name', sortable: true, align: 'left' },
    { key: 'email', label: 'Email', sortable: true, align: 'left' },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (value) => (
        <span className="font-medium">{roleDisplayName(String(value))}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: 'lastLogin',
      label: 'Last login',
      sortable: true,
      render: (value) => (
        <span className="text-xs text-muted-foreground">{formatDate(value as string | null)}</span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value) => (
        <span className="text-xs text-muted-foreground">{formatDate(value as string)}</span>
      ),
    },
  ]

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteUser(deleteId, {
        onSuccess: () => {
          setDeleteId(null)
        },
      })
    }
  }

  const activeData = data?.data ?? []
  const totalUsers = activeData.length
  const activeUsers = activeData.filter((u) => u.status === 'active').length
  const inactiveUsers = totalUsers - activeUsers

  return (
    <PageWrapper>
      <PageHeader
        title="Admin Users"
        description="Staff accounts that can sign in to this admin panel."
        actions={
          <Button
            onClick={() => navigate('/access-control/users/new')}
            className="gap-2 text-xs font-semibold h-9 rounded-lg"
          >
            <Plus className="h-4 w-4" />
            <span>Add admin user</span>
          </Button>
        }
      />

      <div className="space-y-6">
      <InfoCardGrid cols={3}>
        <InfoCard
          label="Total admins"
          value={totalUsers}
          icon={<Users className="w-5 h-5" />}
          variant="blue"
          loading={isLoading}
        />
        <InfoCard
          label="Active"
          value={activeUsers}
          icon={<UserCheck className="w-5 h-5" />}
          variant="blue"
          loading={isLoading}
        />
        <InfoCard
          label="Inactive"
          value={inactiveUsers}
          icon={<UserX className="w-5 h-5" />}
          variant="blue"
          loading={isLoading}
        />
      </InfoCardGrid>

      <DataTable
        columns={columns}
        data={activeData}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onRowClick={(row) => navigate(`/access-control/users/${row.id}`)}
        searchPlaceholder="Search admin users..."
        statusKey="status"
        actionConfig={{
          onView: (row) => navigate(`/access-control/users/${row.id}`),
          onEdit: (row) => navigate(`/access-control/users/${row.id}/edit`),
          onDelete: (row) => setDeleteId(row.id),
        }}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyState={{
          title: 'No admin users',
          description: 'Create the first admin user to grant dashboard access.',
          actionLabel: 'Add admin user',
          onAction: () => navigate('/access-control/users/new'),
        }}
      />

      <ConfirmationModal
        isOpen={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete admin user"
        description="This revokes dashboard access for this account. This action cannot be undone."
        itemName={activeData.find((u) => u.id === deleteId)?.name}
        loading={isDeleting}
        variant="danger"
      />
      </div>
    </PageWrapper>
  )
}

export default UsersListPage
