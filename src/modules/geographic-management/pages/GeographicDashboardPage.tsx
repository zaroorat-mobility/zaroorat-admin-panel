import React from 'react'
import { useNavigate } from 'react-router-dom'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { InfoCard, InfoCardGrid } from '@/shared/components/InfoCard'
import { useCities, useServiceZones } from '../hooks'
import { Globe2, MapPin, Shield } from 'lucide-react'

export const GeographicDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { data: cities = [] } = useCities()
  const { data: serviceZones = [] } = useServiceZones()
  const { data: airportZones = [] } = useServiceZones({ zoneType: 'AIRPORT' })
  const { data: restrictedZones = [] } = useServiceZones({ zoneType: 'RESTRICTED' })

  return (
    <PageWrapper>
      <PageHeader
        title="Geographic Management"
        description="Manage countries, cities, service zones, and coverage boundaries."
      />
      <InfoCardGrid cols={4}>
        <InfoCard label="Cities" value={cities.length} icon={<MapPin />} variant="blue" />
        <InfoCard label="Service Zones" value={serviceZones.filter((z) => z.zoneType === 'SERVICE').length} icon={<Globe2 />} variant="green" />
        <InfoCard label="Airport Zones" value={airportZones.length} icon={<MapPin />} variant="amber" />
        <InfoCard label="Restricted Zones" value={restrictedZones.length} icon={<Shield />} variant="blue" />
      </InfoCardGrid>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <button type="button" onClick={() => navigate('/geographic-management/countries')} className="p-4 rounded-xl border text-left hover:bg-slate-50">
          <p className="font-bold text-sm">Countries</p>
          <p className="text-xs text-muted-foreground mt-1">Reference countries (read-only)</p>
        </button>
        <button type="button" onClick={() => navigate('/geographic-management/states')} className="p-4 rounded-xl border text-left hover:bg-slate-50">
          <p className="font-bold text-sm">States</p>
          <p className="text-xs text-muted-foreground mt-1">States and union territories</p>
        </button>
        <button type="button" onClick={() => navigate('/geographic-management/cities')} className="p-4 rounded-xl border text-left hover:bg-slate-50">
          <p className="font-bold text-sm">Cities</p>
          <p className="text-xs text-muted-foreground mt-1">Launch areas, boundaries, and metadata</p>
        </button>
        <button type="button" onClick={() => navigate('/geographic-management/service-zones')} className="p-4 rounded-xl border text-left hover:bg-slate-50">
          <p className="font-bold text-sm">Service Zones</p>
          <p className="text-xs text-muted-foreground mt-1">Coverage, airport, and restricted polygons</p>
        </button>
        <button type="button" onClick={() => navigate('/geographic-management/surge-zones')} className="p-4 rounded-xl border text-left hover:bg-slate-50">
          <p className="font-bold text-sm">Surge Zones</p>
          <p className="text-xs text-muted-foreground mt-1">Demand multiplier geofences (pricing)</p>
        </button>
      </div>
    </PageWrapper>
  )
}

export default GeographicDashboardPage
