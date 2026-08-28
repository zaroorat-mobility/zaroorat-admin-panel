import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { Button } from '@/shared/components/ui/Button'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import { useCountries, useCreateState, useStates, useUpdateState } from '../hooks'
import type { State } from '../types'
import { Plus } from 'lucide-react'

type ModalMode = 'create' | 'edit' | null

export const StatesListPage: React.FC = () => {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const canWrite = hasPermission(user, 'geography:write')
  const { data: countries = [] } = useCountries()
  const { data = [], isLoading } = useStates({ countryCode: 'IN' })
  const createState = useCreateState()
  const updateState = useUpdateState()

  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [editing, setEditing] = useState<State | null>(null)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [countryCode, setCountryCode] = useState('IN')
  const [isActive, setIsActive] = useState(true)

  const openCreate = () => {
    setModalMode('create')
    setEditing(null)
    setCode('')
    setName('')
    setCountryCode('IN')
    setIsActive(true)
  }

  const openEdit = (row: State) => {
    setModalMode('edit')
    setEditing(row)
    setCode(row.code)
    setName(row.name)
    setCountryCode(row.countryCode)
    setIsActive(row.isActive)
  }

  const closeModal = () => {
    setModalMode(null)
    setEditing(null)
  }

  const handleSave = async () => {
    if (modalMode === 'create') {
      await createState.mutateAsync({
        countryCode,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        isActive,
      })
    } else if (editing) {
      await updateState.mutateAsync({
        id: editing.id,
        payload: { name: name.trim(), isActive },
      })
    }
    closeModal()
  }

  const columns: DataTableColumn<State>[] = [
    { key: 'code', label: 'Code', render: (v: string) => <span className="font-bold">{v}</span> },
    { key: 'name', label: 'Name' },
    { key: 'countryCode', label: 'Country' },
    {
      key: 'isActive',
      label: 'Status',
      render: (v: boolean) => (v ? 'Active' : 'Inactive'),
    },
    ...(canWrite
      ? [
          {
            key: 'id',
            label: '',
            render: (_: string, row: State) => (
              <Button type="button" variant="outline" size="sm" onClick={() => openEdit(row)}>
                Edit
              </Button>
            ),
          } as DataTableColumn<State>,
        ]
      : []),
  ]

  const isSaving = createState.isPending || updateState.isPending

  return (
    <PageWrapper>
      <PageHeader
        title="States"
        description="Add and manage states or union territories for operational cities."
        onBack={() => navigate('/geographic-management')}
        actions={
          canWrite ? (
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Add State
            </Button>
          ) : undefined
        }
      />
      <DataTable columns={columns} data={data} isLoading={isLoading} />
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h3 className="font-bold">
              {modalMode === 'create' ? 'Add State' : `Edit ${editing?.code}`}
            </h3>
            {modalMode === 'create' && (
              <>
                <select
                  className="border rounded-lg p-2 w-full text-sm"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                >
                  {countries.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                  {countries.length === 0 && <option value="IN">India</option>}
                </select>
                <input
                  className="border rounded-lg p-2 w-full text-sm uppercase"
                  placeholder="State code (e.g. MH)"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={10}
                  required
                />
              </>
            )}
            <input
              className="border rounded-lg p-2 w-full text-sm"
              placeholder="State name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Active
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !name.trim() || (modalMode === 'create' && !code.trim())}
              >
                {modalMode === 'create' ? 'Create' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}

export default StatesListPage
