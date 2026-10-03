import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { ActionDropdown, type DropdownAction } from '@/modules/driver-management/components/ActionDropdown'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import { useActivateServiceZone, useCities, useDeactivateServiceZone, useServiceZones } from '../hooks'
import type { ServiceZoneListItem, ServiceZoneType } from '../types'
import { Edit2, Eye, Plus, ToggleLeft, ToggleRight } from 'lucide-react'
import { CreateServiceZoneModal } from '../components/CreateServiceZoneModal'

const TABS: Array<{ id: ServiceZoneType | 'ALL'; label: string }> = [
  { id: 'ALL', label: 'All' },
  { id: 'SERVICE', label: 'Service' },
  { id: 'AIRPORT', label: 'Airport' },
  { id: 'RESTRICTED', label: 'Restricted' },
]

export const ServiceZonesListPage: React.FC = () => {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const canWrite = hasPermission(user, 'geography:write')
  const [tab, setTab] = useState<ServiceZoneType | 'ALL'>('ALL')
  const [cityCode, setCityCode] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editZoneId, setEditZoneId] = useState<string | null>(null)

  const { data: cities = [] } = useCities(true)
  const { data = [], isLoading, refetch } = useServiceZones({
    ...(cityCode ? { cityCode } : {}),
    ...(tab !== 'ALL' ? { zoneType: tab } : {}),
  })
  const activateZone = useActivateServiceZone()
  const deactivateZone = useDeactivateServiceZone()

  const columns: DataTableColumn<ServiceZoneListItem>[] = [
    { key: 'name', label: 'Name', render: (v: string) => <span className="font-bold text-slate-900">{v}</span> },
    { key: 'code', label: 'Code', render: (v: string) => <span className="font-mono text-xs font-semibold">{v}</span> },
    {
      key: 'zoneType',
      label: 'Type',
      render: (v: ServiceZoneType) => {
        if (v === 'AIRPORT') {
          return (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Airport
            </span>
          )
        }
        if (v === 'RESTRICTED') {
          return (
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              Restricted
            </span>
          )
        }
        return (
          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
            Service
          </span>
        )
      },
    },
    { key: 'cityCode', label: 'City', render: (v: string) => <span className="font-bold">{v}</span> },
    { key: 'fareRuleCount', label: 'Fare Rules', align: 'center' },
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
      render: (_, row) => {
        const dropActions: DropdownAction[] = [
          {
            label: 'View Details',
            icon: <Eye className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/geographic-management/service-zones/${row.id}`),
          },
        ]

        if (canWrite) {
          dropActions.push({
            label: 'Edit Zone',
            icon: <Edit2 className="h-3.5 w-3.5" />,
            onClick: () => setEditZoneId(row.id),
          })

          if (row.isActive) {
            dropActions.push({
              label: 'Deactivate Zone',
              icon: <ToggleLeft className="h-3.5 w-3.5" />,
              onClick: async () => {
                await deactivateZone.mutateAsync(row.id)
                refetch()
              },
            })
          } else {
            dropActions.push({
              label: 'Activate Zone',
              icon: <ToggleRight className="h-3.5 w-3.5" />,
              onClick: async () => {
                await activateZone.mutateAsync(row.id)
                refetch()
              },
            })
          }
        }

        return <ActionDropdown actions={dropActions} />
      },
    },
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Service Zones"
        description="Coverage, airport, and restricted geofences."
        onBack={() => navigate('/geographic-management')}
        actions={
          canWrite ? (
            <Button
              onClick={() => {
                setEditZoneId(null)
                setIsCreateModalOpen(true)
              }}
              className="gap-2 bg-[#1F2B6D] hover:bg-[#182258] text-white"
            >
              <Plus className="h-4 w-4" /> Add Zone
            </Button>
          ) : undefined
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                tab === t.id
                  ? 'bg-[#1F2B6D] text-white shadow-2xs'
                  : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <select
          className="border border-slate-200 bg-white rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-[#1F2B6D] cursor-pointer"
          value={cityCode}
          onChange={(e) => setCityCode(e.target.value)}
        >
          <option value="">All cities</option>
          {cities
            .filter((c) => c.code !== 'GLOBAL')
            .map((c) => (
              <option key={c.id} value={c.code}>
                {c.name} ({c.code})
              </option>
            ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        onRowClick={(row) => navigate(`/geographic-management/service-zones/${row.id}`)}
      />

      <CreateServiceZoneModal
        isOpen={isCreateModalOpen || Boolean(editZoneId)}
        zoneId={editZoneId || undefined}
        initialCityCode={cityCode || undefined}
        initialZoneType={tab !== 'ALL' ? tab : undefined}
        onClose={() => {
          setIsCreateModalOpen(false)
          setEditZoneId(null)
        }}
        onSuccess={(savedZone) => {
          setIsCreateModalOpen(false)
          setEditZoneId(null)
          refetch()
          navigate(`/geographic-management/service-zones/${savedZone.id}`)
        }}
      />
    </PageWrapper>
  )
}

export default ServiceZonesListPage
