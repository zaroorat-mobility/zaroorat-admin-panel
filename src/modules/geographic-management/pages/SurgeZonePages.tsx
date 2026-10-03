import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { CreateSurgeZoneModal } from '../components/CreateSurgeZoneModal'

export const SurgeZoneFormPage: React.FC = () => {
  const navigate = useNavigate()
  return (
    <PageWrapper>
      <CreateSurgeZoneModal
        isOpen={true}
        isStandalonePage={true}
        onClose={() => navigate('/geographic-management/surge-zones')}
        onSuccess={() => navigate('/geographic-management/surge-zones')}
      />
    </PageWrapper>
  )
}

export const SurgeZoneEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  return (
    <PageWrapper>
      <CreateSurgeZoneModal
        isOpen={true}
        isStandalonePage={true}
        zoneId={id}
        onClose={() => navigate('/geographic-management/surge-zones')}
        onSuccess={() => navigate('/geographic-management/surge-zones')}
      />
    </PageWrapper>
  )
}

