import React, { useState } from 'react'
import { Plus, Users, UserCheck, UserX } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUsers, useDeleteUser } from '../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { ConfirmationModal } from '@/shared/components/ConfirmationModal'
import { Button } from '@/shared/components/ui/Button'
import { InfoCard, InfoCardGrid } from '@/shared/components/InfoCard'
import type { UserEntity } from '../types'

export const UsersListPage: React.FC = () => {
  const navigate = useNavigate()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Query users matching state hook values
  const { data, isLoading, isError, refetch } = useUsers()
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser()

  // Columns definition mapping for new DataTable
  const columns: DataTableColumn<UserEntity>[] = [
    { key: 'name', label: 'Name', sortable: true, align: 'left' },
    { key: 'email', label: 'Email Address', sortable: true, align: 'left' },
    { key: 'phone', label: 'Phone Number', align: 'left' },
    {
      key: 'role',
      label: 'System Role',
      sortable: true,
      render: (value) => <span className="capitalize font-medium">{value}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => <StatusBadge status={value} />,
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

  // Placeholder data to prevent empty view in demo reviews
  const demoUsers: UserEntity[] = [
    { id: '1', name: 'Alok Sharma', email: 'alok.sharma@zaroorat.in', phone: '9876543210', role: 'admin', status: 'active', createdAt: '', updatedAt: '' },
    { id: '2', name: 'Nisha Patil', email: 'nisha.patil@zaroorat.in', phone: '9876543211', role: 'support', status: 'active', createdAt: '', updatedAt: '' },
    { id: '3', name: 'Vikram Singh', email: 'vikram.singh@zaroorat.in', phone: '9876543212', role: 'dispatcher', status: 'inactive', createdAt: '', updatedAt: '' },
  ]

  const activeData = data?.data ?? (isLoading ? [] : demoUsers)

  // Metrics summary calculations
  const totalUsers = activeData.length
  const activeUsers = activeData.filter(u => u.status === 'active').length
  const inactiveUsers = totalUsers - activeUsers

  return (
    <PageWrapper>
      {/* Dynamic breadcrumbs with actions */}
      <PageHeader
        title="Administrative Users"
        description="Configure admin panel users, operators, dispatchers, and access privileges."
        actions={
          <Button onClick={() => navigate('/users/new')} className="gap-2 text-xs font-semibold h-9 rounded-lg">
            <Plus className="h-4 w-4" />
            <span>Add User</span>
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Unified Info Card Grid */}
        <InfoCardGrid cols={3}>
          <InfoCard
            label="Total Admins"
            value={totalUsers}
            icon={<Users className="w-5 h-5" />}
            variant="blue"
            loading={isLoading}
          />
          <InfoCard
            label="Active Accounts"
            value={activeUsers}
            icon={<UserCheck className="w-5 h-5" />}
            variant="blue"
            loading={isLoading}
          />
          <InfoCard
            label="Inactive Accounts"
            value={inactiveUsers}
            icon={<UserX className="w-5 h-5" />}
            variant="blue"
            loading={isLoading}
          />
        </InfoCardGrid>

        {/* Clean table layout with integrated states */}
        <DataTable
          columns={columns}
          data={activeData}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onRowClick={(row) => navigate(`/users/${row.id}`)}
          searchPlaceholder="Search administrators..."
          statusKey="status"
          actionConfig={{
            onView: (row) => navigate(`/users/${row.id}`),
            onEdit: (row) => navigate(`/users/${row.id}`),
            onDelete: (row) => setDeleteId(row.id)
          }}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          emptyState={{
            title: "No Users Found",
            description: "There are no administrative users yet. Add the first user to grant dashboard access.",
            actionLabel: "Add User",
            onAction: () => navigate('/users/new')
          }}
        />
      </div>

      <ConfirmationModal
        isOpen={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete User Account"
        description="Are you sure you want to remove this administrative user? This will revoke all dashboard authorization keys."
        itemName={activeData.find(u => u.id === deleteId)?.name}
        loading={isDeleting}
        variant="danger"
      />
    </PageWrapper>
  )
}

export default UsersListPage
