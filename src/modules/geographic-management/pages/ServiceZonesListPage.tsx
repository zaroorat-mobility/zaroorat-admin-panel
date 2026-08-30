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
  const { data: cities = [] } = useCities(true)
  const { data = [], isLoading } = useServiceZones({
    ...(cityCode ? { cityCode } : {}),
    ...(tab !== 'ALL' ? { zoneType: tab } : {}),
  })
  const activateZone = useActivateServiceZone()
  const deactivateZone = useDeactivateServiceZone()

  const columns: DataTableColumn<ServiceZoneListItem>[] = [
    { key: 'name', label: 'Name', render: (v: string) => <span className="font-bold">{v}</span> },
    { key: 'code', label: 'Code' },
    { key: 'zoneType', label: 'Type' },
    { key: 'cityCode', label: 'City' },
    { key: 'fareRuleCount', label: 'Fare Rules', align: 'center' },
    { key: 'isActive', label: 'Status', render: (v: boolean) => (v ? 'Active' : 'Inactive') },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center',
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
            onClick: () => navigate(`/geographic-management/service-zones/${row.id}/edit`),
          })

          if (row.isActive) {
            dropActions.push({
              label: 'Deactivate Zone',
              icon: <ToggleLeft className="h-3.5 w-3.5" />,
              onClick: () => deactivateZone.mutate(row.id),
            })
          } else {
            dropActions.push({
              label: 'Activate Zone',
              icon: <ToggleRight className="h-3.5 w-3.5" />,
              onClick: () => activateZone.mutate(row.id),
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
          <Button onClick={() => navigate('/geographic-management/service-zones/new')} className="gap-2">
            <Plus className="h-4 w-4" /> Add Zone
          </Button>
        }
      />
      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border ${tab === t.id ? 'bg-primary text-white' : ''}`}
          >
            {t.label}
          </button>
        ))}
        <select className="border rounded-lg px-2 py-1 text-xs" value={cityCode} onChange={(e) => setCityCode(e.target.value)}>
          <option value="">All cities</option>
          {cities.filter((c) => c.code !== 'GLOBAL').map((c) => (
            <option key={c.id} value={c.code}>{c.name}</option>
          ))}
        </select>
      </div>
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        onRowClick={(row) => navigate(`/geographic-management/service-zones/${row.id}`)}
      />
    </PageWrapper>
  )
}

export default ServiceZonesListPage
