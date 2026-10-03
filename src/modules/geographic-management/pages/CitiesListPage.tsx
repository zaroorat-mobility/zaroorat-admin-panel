import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { Button } from '@/shared/components/ui/Button'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import { useCities } from '../hooks'
import type { CityListItem } from '../types'
import { Plus, Edit2 } from 'lucide-react'
import { CreateCityModal } from '../components/CreateCityModal'

export const CitiesListPage: React.FC = () => {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const canWrite = hasPermission(user, 'geography:write')
  const { data = [], isLoading, refetch } = useCities()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null)

  const columns: DataTableColumn<CityListItem>[] = [
    { key: 'code', label: 'Code', render: (v: string) => <span className="font-bold text-slate-900">{v}</span> },
    { key: 'name', label: 'Name' },
    { key: 'state', label: 'State', render: (v: string | null) => v ?? '—' },
    { key: 'zoneCount', label: 'Zones', align: 'center' },
    {
      key: 'hasBoundary',
      label: 'Boundary',
      render: (v: boolean) =>
        v ? (
          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs font-semibold border border-emerald-200">
            Configured
          </span>
        ) : (
          <span className="text-slate-400 bg-slate-50 px-2 py-0.5 rounded text-xs border border-slate-200">
            None
          </span>
        ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (v: boolean) =>
        v ? (
          <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-slate-400 font-semibold text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Inactive
          </span>
        ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (_: unknown, row: CityListItem) =>
        canWrite ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedCityId(row.id)
            }}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-[#1F2B6D] transition-colors cursor-pointer inline-flex items-center gap-1 text-xs font-semibold"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
        ) : null,
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
            <Button
              onClick={() => {
                setSelectedCityId(null)
                setIsCreateModalOpen(true)
              }}
              className="gap-2 bg-[#1F2B6D] hover:bg-[#182258] text-white"
            >
              <Plus className="h-4 w-4" /> Add City
            </Button>
          ) : undefined
        }
      />
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        onRowClick={(row) => setSelectedCityId(row.id)}
      />

      <CreateCityModal
        isOpen={isCreateModalOpen || Boolean(selectedCityId)}
        cityId={selectedCityId || undefined}
        onClose={() => {
          setIsCreateModalOpen(false)
          setSelectedCityId(null)
        }}
        onSuccess={() => {
          setIsCreateModalOpen(false)
          setSelectedCityId(null)
          refetch()
        }}
      />
    </PageWrapper>
  )
}

export default CitiesListPage
