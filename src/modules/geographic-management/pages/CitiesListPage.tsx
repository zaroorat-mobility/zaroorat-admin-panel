import React from 'react'
import { useNavigate } from 'react-router-dom'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { Button } from '@/shared/components/ui/Button'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import { useCities } from '../hooks'
import type { CityListItem } from '../types'
import { Plus } from 'lucide-react'

export const CitiesListPage: React.FC = () => {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const canWrite = hasPermission(user, 'geography:write')
  const { data = [], isLoading } = useCities()

  const columns: DataTableColumn<CityListItem>[] = [
    { key: 'code', label: 'Code', render: (v: string) => <span className="font-bold">{v}</span> },
    { key: 'name', label: 'Name' },
    { key: 'state', label: 'State', render: (v: string | null) => v ?? '—' },
    { key: 'zoneCount', label: 'Zones', align: 'center' },
    {
      key: 'hasBoundary',
      label: 'Boundary',
      render: (v: boolean) => (v ? 'Yes' : 'No'),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (v: boolean) => (v ? 'Active' : 'Inactive'),
    },
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Cities"
        description="Operational cities and launch boundaries."
        onBack={() => navigate('/geographic-management')}
        actions={
          canWrite ? (
            <Button onClick={() => navigate('/geographic-management/cities/new')} className="gap-2">
              <Plus className="h-4 w-4" /> Add City
            </Button>
          ) : undefined
        }
      />
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        onRowClick={(row) => navigate(`/geographic-management/cities/${row.id}`)}
      />
    </PageWrapper>
  )
}

export default CitiesListPage
