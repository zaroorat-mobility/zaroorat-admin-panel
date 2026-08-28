import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { Button } from '@/shared/components/ui/Button'
import { ActionDropdown, type DropdownAction } from '@/modules/driver-management/components/ActionDropdown'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import { listSurgeZones, updateSurgeZone, type SurgeZoneListItem } from '../api/surge'
import { Edit2, Plus, ToggleLeft, ToggleRight } from 'lucide-react'

export const SurgeZonesPage: React.FC = () => {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const canWrite = hasPermission(user, 'pricing:write')
  const { data = [], isLoading } = useQuery({
    queryKey: ['surge-zones'],
    queryFn: listSurgeZones,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateSurgeZone(id, { isActive }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['surge-zones'] }),
  })

  const columns: DataTableColumn<SurgeZoneListItem>[] = [
    { key: 'name', label: 'Name', render: (v: string) => <span className="font-bold">{v}</span> },
    { key: 'cityCode', label: 'City' },
    {
      key: 'isActive',
      label: 'Status',
      render: (v: boolean) => (v ? 'Active' : 'Inactive'),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center',
      render: (_, row) => {
        const dropActions: DropdownAction[] = []

        if (canWrite) {
          dropActions.push({
            label: 'Edit Zone',
            icon: <Edit2 className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/geographic-management/surge-zones/${row.id}/edit`),
          })

          if (row.isActive) {
            dropActions.push({
              label: 'Deactivate Zone',
              icon: <ToggleLeft className="h-3.5 w-3.5" />,
              onClick: () => toggleMutation.mutate({ id: row.id, isActive: false }),
            })
          } else {
            dropActions.push({
              label: 'Activate Zone',
              icon: <ToggleRight className="h-3.5 w-3.5" />,
              onClick: () => toggleMutation.mutate({ id: row.id, isActive: true }),
            })
          }
        }

        if (dropActions.length === 0) return null
        return <ActionDropdown actions={dropActions} />
      },
    },
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Surge Zones"
        description="Demand multiplier geofences used by surge windows (pricing module)."
        onBack={() => navigate('/geographic-management')}
        actions={
          canWrite ? (
            <Button onClick={() => navigate('/geographic-management/surge-zones/new')} className="gap-2">
              <Plus className="h-4 w-4" /> Add Surge Zone
            </Button>
          ) : undefined
        }
      />
      <p className="text-xs text-muted-foreground mb-4">
        Service zones define ride coverage; surge zones define where demand multipliers apply.
      </p>
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        onRowClick={(row) => navigate(`/geographic-management/surge-zones/${row.id}/edit`)}
      />
    </PageWrapper>
  )
}

export default SurgeZonesPage
