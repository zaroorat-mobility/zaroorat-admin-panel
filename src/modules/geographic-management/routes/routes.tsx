import React from 'react'
import { Routes, Route, useParams } from 'react-router-dom'
import GeographicDashboardPage from '../pages/GeographicDashboardPage'
import CitiesListPage from '../pages/CitiesListPage'
import CityFormPage from '../pages/CityFormPage'
import CountriesListPage from '../pages/CountriesListPage'
import StatesListPage from '../pages/StatesListPage'
import ServiceZonesListPage from '../pages/ServiceZonesListPage'
import ServiceZoneFormPage, { ServiceZoneDetailPage, ServiceZoneEditPage } from '../pages/ServiceZonePages'
import SurgeZonesPage from '../pages/SurgeZonesPage'
import { SurgeZoneFormPage, SurgeZoneEditPage } from '../pages/SurgeZonePages'

const ServiceZoneDetailRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  if (!id) return null
  return <ServiceZoneDetailPage zoneId={id} />
}

export const GeographicManagementRoutes: React.FC = () => (
  <Routes>
    <Route index element={<GeographicDashboardPage />} />
    <Route path="countries" element={<CountriesListPage />} />
    <Route path="states" element={<StatesListPage />} />
    <Route path="cities" element={<CitiesListPage />} />
    <Route path="cities/new" element={<CityFormPage />} />
    <Route path="cities/:id" element={<CityFormPage />} />
    <Route path="service-zones" element={<ServiceZonesListPage />} />
    <Route path="service-zones/new" element={<ServiceZoneFormPage />} />
    <Route path="service-zones/:id/edit" element={<ServiceZoneEditPage />} />
    <Route path="service-zones/:id" element={<ServiceZoneDetailRoute />} />
    <Route path="surge-zones" element={<SurgeZonesPage />} />
    <Route path="surge-zones/new" element={<SurgeZoneFormPage />} />
    <Route path="surge-zones/:id/edit" element={<SurgeZoneEditPage />} />
  </Routes>
)

export default GeographicManagementRoutes
