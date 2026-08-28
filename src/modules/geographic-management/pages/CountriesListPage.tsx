import React from 'react'
import { useNavigate } from 'react-router-dom'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { useCountries } from '../hooks'
import type { Country } from '../types'

export const CountriesListPage: React.FC = () => {
  const navigate = useNavigate()
  const { data = [], isLoading } = useCountries()

  const columns: DataTableColumn<Country>[] = [
    { key: 'code', label: 'Code', render: (v: string) => <span className="font-bold">{v}</span> },
    { key: 'name', label: 'Name' },
    {
      key: 'isActive',
      label: 'Status',
      render: (v: boolean) => (v ? 'Active' : 'Inactive'),
    },
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Countries"
        description="Reference countries"
        onBack={() => navigate('/geographic-management')}
      />
      <DataTable columns={columns} data={data} isLoading={isLoading} />
    </PageWrapper>
  )
}

export default CountriesListPage
