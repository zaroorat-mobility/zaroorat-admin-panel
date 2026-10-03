import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { CreateCityModal } from '../components/CreateCityModal'

export const CityFormPage: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  return (
    <PageWrapper>
      <CreateCityModal
        isOpen={true}
        cityId={id}
        onClose={() => navigate('/geographic-management/cities')}
        onSuccess={() => navigate('/geographic-management/cities')}
      />
    </PageWrapper>
  )
}

export default CityFormPage
