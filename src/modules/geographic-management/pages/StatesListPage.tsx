import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { Button } from '@/shared/components/ui/Button'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import { useCountries, useCreateState, useStates, useUpdateState } from '../hooks'
import type { State, StateDivisionType } from '../types'
import { Plus, X } from 'lucide-react'

// Canonical Government of India Master Catalog for instant, reliable autofill
export interface CatalogStateItem {
  code: string
  name: string
  divisionType: StateDivisionType
  lgdCode: number
  isoCode: string
}

export const INDIAN_STATES_CATALOG: CatalogStateItem[] = [
  { code: 'AP', name: 'Andhra Pradesh', divisionType: 'STATE', lgdCode: 28, isoCode: 'IN-AP' },
  { code: 'AR', name: 'Arunachal Pradesh', divisionType: 'STATE', lgdCode: 12, isoCode: 'IN-AR' },
  { code: 'AS', name: 'Assam', divisionType: 'STATE', lgdCode: 18, isoCode: 'IN-AS' },
  { code: 'BR', name: 'Bihar', divisionType: 'STATE', lgdCode: 10, isoCode: 'IN-BR' },
  { code: 'CG', name: 'Chhattisgarh', divisionType: 'STATE', lgdCode: 22, isoCode: 'IN-CG' },
  { code: 'GA', name: 'Goa', divisionType: 'STATE', lgdCode: 30, isoCode: 'IN-GA' },
  { code: 'GJ', name: 'Gujarat', divisionType: 'STATE', lgdCode: 24, isoCode: 'IN-GJ' },
  { code: 'HR', name: 'Haryana', divisionType: 'STATE', lgdCode: 6, isoCode: 'IN-HR' },
  { code: 'HP', name: 'Himachal Pradesh', divisionType: 'STATE', lgdCode: 2, isoCode: 'IN-HP' },
  { code: 'JH', name: 'Jharkhand', divisionType: 'STATE', lgdCode: 20, isoCode: 'IN-JH' },
  { code: 'KA', name: 'Karnataka', divisionType: 'STATE', lgdCode: 29, isoCode: 'IN-KA' },
  { code: 'KL', name: 'Kerala', divisionType: 'STATE', lgdCode: 32, isoCode: 'IN-KL' },
  { code: 'MP', name: 'Madhya Pradesh', divisionType: 'STATE', lgdCode: 23, isoCode: 'IN-MP' },
  { code: 'MH', name: 'Maharashtra', divisionType: 'STATE', lgdCode: 27, isoCode: 'IN-MH' },
  { code: 'MN', name: 'Manipur', divisionType: 'STATE', lgdCode: 14, isoCode: 'IN-MN' },
  { code: 'ML', name: 'Meghalaya', divisionType: 'STATE', lgdCode: 17, isoCode: 'IN-ML' },
  { code: 'MZ', name: 'Mizoram', divisionType: 'STATE', lgdCode: 15, isoCode: 'IN-MZ' },
  { code: 'NL', name: 'Nagaland', divisionType: 'STATE', lgdCode: 13, isoCode: 'IN-NL' },
  { code: 'OD', name: 'Odisha', divisionType: 'STATE', lgdCode: 21, isoCode: 'IN-OD' },
  { code: 'PB', name: 'Punjab', divisionType: 'STATE', lgdCode: 3, isoCode: 'IN-PB' },
  { code: 'RJ', name: 'Rajasthan', divisionType: 'STATE', lgdCode: 8, isoCode: 'IN-RJ' },
  { code: 'SK', name: 'Sikkim', divisionType: 'STATE', lgdCode: 11, isoCode: 'IN-SK' },
  { code: 'TN', name: 'Tamil Nadu', divisionType: 'STATE', lgdCode: 33, isoCode: 'IN-TN' },
  { code: 'TG', name: 'Telangana', divisionType: 'STATE', lgdCode: 36, isoCode: 'IN-TG' },
  { code: 'TR', name: 'Tripura', divisionType: 'STATE', lgdCode: 16, isoCode: 'IN-TR' },
  { code: 'UP', name: 'Uttar Pradesh', divisionType: 'STATE', lgdCode: 9, isoCode: 'IN-UP' },
  { code: 'UK', name: 'Uttarakhand', divisionType: 'STATE', lgdCode: 5, isoCode: 'IN-UK' },
  { code: 'WB', name: 'West Bengal', divisionType: 'STATE', lgdCode: 19, isoCode: 'IN-WB' },
  { code: 'AN', name: 'Andaman and Nicobar Islands', divisionType: 'UNION_TERRITORY', lgdCode: 35, isoCode: 'IN-AN' },
  { code: 'CH', name: 'Chandigarh', divisionType: 'UNION_TERRITORY', lgdCode: 4, isoCode: 'IN-CH' },
  { code: 'DH', name: 'Dadra and Nagar Haveli and Daman and Diu', divisionType: 'UNION_TERRITORY', lgdCode: 26, isoCode: 'IN-DH' },
  { code: 'DL', name: 'Delhi', divisionType: 'UNION_TERRITORY', lgdCode: 7, isoCode: 'IN-DL' },
  { code: 'JK', name: 'Jammu and Kashmir', divisionType: 'UNION_TERRITORY', lgdCode: 1, isoCode: 'IN-JK' },
  { code: 'LA', name: 'Ladakh', divisionType: 'UNION_TERRITORY', lgdCode: 37, isoCode: 'IN-LA' },
  { code: 'LD', name: 'Lakshadweep', divisionType: 'UNION_TERRITORY', lgdCode: 31, isoCode: 'IN-LD' },
  { code: 'PY', name: 'Puducherry', divisionType: 'UNION_TERRITORY', lgdCode: 34, isoCode: 'IN-PY' },
]

type ModalMode = 'create' | 'edit' | null

export const StatesListPage: React.FC = () => {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  // Ensure admins and users with geography:write always have access to add/edit states
  const canWrite =
    !user ||
    user.roles?.includes('system_admin') ||
    user.roles?.includes('admin') ||
    hasPermission(user, 'geography:write')

  const { data: countries = [] } = useCountries()
  const { data: states = [], isLoading } = useStates({ countryCode: 'IN' })
  const createState = useCreateState()
  const updateState = useUpdateState()

  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [editing, setEditing] = useState<State | null>(null)

  // Modal form states
  const [countryCode, setCountryCode] = useState('IN')
  const [selectedCatalogCode, setSelectedCatalogCode] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)

  // Codes of states already present in the database table
  const existingCodes = useMemo(() => new Set(states.map((s) => s.code.toUpperCase())), [states])

  // Catalog items sorted alphabetically
  const catalogList = useMemo(() => {
    return [...INDIAN_STATES_CATALOG].sort((a, b) => a.name.localeCompare(b.name))
  }, [])

  const openCreate = () => {
    setModalMode('create')
    setEditing(null)
    setSelectedCatalogCode('')
    setCode('')
    setName('')
    setCountryCode('IN')
    setIsActive(true)
    setFormError(null)
  }

  const openEdit = (row: State) => {
    setModalMode('edit')
    setEditing(row)
    setSelectedCatalogCode(row.code)
    setCode(row.code)
    setName(row.name)
    setCountryCode(row.countryCode)
    setIsActive(row.isActive)
    setFormError(null)
  }

  const closeModal = () => {
    setModalMode(null)
    setEditing(null)
    setFormError(null)
  }

  // When admin selects a state from the official catalog dropdown, autofill Code and Name!
  const handleCatalogSelect = (catCode: string) => {
    setSelectedCatalogCode(catCode)
    const match = catalogList.find((c) => c.code === catCode)
    if (match) {
      setCode(match.code)
      setName(match.name)
      setIsActive(true)
    }
  }

  const handleSave = async () => {
    setFormError(null)
    try {
      if (modalMode === 'create') {
        const match = catalogList.find((c) => c.code === code.trim().toUpperCase())
        await createState.mutateAsync({
          countryCode,
          code: code.trim().toUpperCase(),
          name: name.trim(),
          divisionType: match?.divisionType ?? 'STATE',
          lgdCode: match?.lgdCode ?? null,
          isoCode: match?.isoCode ?? null,
          isActive,
        })
      } else if (editing) {
        await updateState.mutateAsync({
          id: editing.id,
          payload: { name: name.trim(), isActive },
        })
      }
      closeModal()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save state'
      setFormError(msg)
    }
  }

  const columns: DataTableColumn<State>[] = [
    {
      key: 'code',
      label: 'CODE',
      render: (v: string) => <span className="font-bold text-slate-900 text-sm">{v}</span>,
    },
    {
      key: 'name',
      label: 'NAME',
      render: (v: string) => <span className="text-slate-800 text-sm">{v}</span>,
    },
    {
      key: 'countryCode',
      label: 'COUNTRY',
      render: () => <span className="text-slate-600 text-sm">India</span>,
    },
    {
      key: 'isActive',
      label: 'STATUS',
      render: (v: boolean) => (
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
            v ? 'text-emerald-600' : 'text-rose-500'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${v ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          {v ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    ...(canWrite
      ? [
          {
            key: 'id',
            label: 'ACTIONS',
            render: (_: string, row: State) => (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openEdit(row)}
                className="text-xs px-3 py-1 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg"
              >
                Edit
              </Button>
            ),
          } as DataTableColumn<State>,
        ]
      : []),
  ]

  const isSaving = createState.isPending || updateState.isPending
  const isCreate = modalMode === 'create'

  return (
    <PageWrapper>
      <PageHeader
        title="States"
        description="Add and manage states or union territories for operational cities."
        onBack={() => navigate('/geographic-management')}
        actions={
          canWrite ? (
            <Button
              onClick={openCreate}
              className="gap-2 bg-[#1F2B6D] hover:bg-[#182258] text-white shadow-xs"
            >
              <Plus className="h-4 w-4" /> Add State
            </Button>
          ) : undefined
        }
      />

      <DataTable
        columns={columns}
        data={states}
        isLoading={isLoading}
        searchPlaceholder="Search states..."
        pageSizeOptions={[5, 10, 20]}
      />

      {/* ── Add / Edit State Modal ── */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={closeModal} />

          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200/80 z-10 overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-5 pb-4">
              <div>
                <h3 className="text-[17px] font-bold text-slate-900 leading-tight">
                  {isCreate ? 'Add State' : `Edit ${editing?.name}`}
                </h3>
                <p className="text-[13px] text-slate-400 mt-0.5">
                  {isCreate
                    ? 'Create a new state or union territory.'
                    : 'Update state operational details.'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition flex-shrink-0 mt-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="mx-6 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {formError}
              </div>
            )}

            {/* Form Body */}
            <div className="px-6 pb-2 space-y-4">
              {/* Country Dropdown */}
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                  Country <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <span className="text-base">🇮🇳</span>
                  </div>
                  <select
                    className="w-full border border-slate-200 rounded-lg pl-9 pr-8 py-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/30 focus:border-[#1F2B6D]/50 appearance-none cursor-pointer"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    disabled={!isCreate}
                  >
                    {countries.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                    {countries.length === 0 && <option value="IN">India</option>}
                  </select>
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Master Catalog Dropdown for Autofill */}
              {isCreate && (
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Select State from Official Catalog <span className="text-rose-500">*</span>
                  </label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/30 focus:border-[#1F2B6D]/50 cursor-pointer"
                    value={selectedCatalogCode}
                    onChange={(e) => handleCatalogSelect(e.target.value)}
                  >
                    <option value="">-- Choose state to autofill --</option>
                    {catalogList.map((item) => {
                      const isAdded = existingCodes.has(item.code)
                      return (
                        <option key={item.code} value={item.code}>
                          {item.name} ({item.code}) {isAdded ? '• (Already added)' : ''}
                        </option>
                      )
                    })}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Select any Indian state or UT to automatically populate its code and name.
                  </p>
                </div>
              )}

              {/* State Code Field */}
              {isCreate && (
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    State Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/30 focus:border-[#1F2B6D]/50 uppercase bg-slate-50/50"
                    placeholder="e.g. MH"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={10}
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Use official state code (e.g. MH for Maharashtra)
                  </p>
                </div>
              )}

              {/* State Name Field */}
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                  State Name <span className="text-rose-500">*</span>
                </label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/30 focus:border-[#1F2B6D]/50"
                  placeholder="e.g. Maharashtra"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Status Checkbox */}
              <div>
                <label className="flex items-start gap-2.5 cursor-pointer select-none group mt-1">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#1F2B6D] focus:ring-[#1F2B6D]"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-800">Active</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Inactive states will not be available for operational cities.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 mt-2 bg-slate-50/50 border-t border-slate-100">
              <button
                type="button"
                onClick={closeModal}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !name.trim() || (isCreate && !code.trim())}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#1F2B6D] hover:bg-[#182258] rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                {isSaving ? (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {isCreate ? 'Create State' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}

export default StatesListPage
