import React, { useState, useEffect, useMemo } from 'react'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { InfoCard, InfoCardGrid } from '@/shared/components/InfoCard'
import { Button, IconButton } from '@/shared/components/ui/Button'
import { api, API_ENDPOINTS } from '@/infrastructure/api'
import { APP_CONFIG } from '@/app/config'
import { VehicleTypeModal, type VehicleTypeFormData } from './VehicleTypeModal'
import { useToast } from '@/shared/context/toast'
import { cn } from '@/shared/utils'
import {
  Car,
  Bike,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Power,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  Table as TableIcon,
  Users,
  AlertCircle,
  Loader2,
  Snowflake,
  Wind,
  CheckCircle2,
} from 'lucide-react'

export interface VehicleTypeItem {
  id: string
  code: string
  name: string
  category: string
  hasAc: boolean
  badge: string | null
  description: string | null
  imageUrl: string | null
  imageFileId: string | null
  icon: string | null
  passengerCapacity: number | null
  luggageCapacity: number | null
  displayOrder: number
  isActive: boolean
  baseFare?: number | null
  perKmRate?: number | null
}

const VehicleImageThumbnail: React.FC<{
  src: string | null
  alt: string
  category: string
  className?: string
  fallbackClassName?: string
}> = ({
  src,
  alt,
  category,
  className = 'w-full h-full object-contain p-0.5',
  fallbackClassName = 'w-4 h-4 text-slate-400',
}) => {
  const [error, setError] = useState(false)

  useEffect(() => {
    setError(false)
  }, [src])

  if (!src || error) {
    return category === 'bike' ? (
      <Bike className={fallbackClassName} />
    ) : (
      <Car className={fallbackClassName} />
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      loading="lazy"
    />
  )
}

export const VehicleTypesListPage: React.FC = () => {
  const toast = useToast()
  const [services, setServices] = useState<VehicleTypeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<VehicleTypeFormData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<VehicleTypeItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
  const [reordering, setReordering] = useState(false)
  const [filterTab, setFilterTab] = useState<'all' | 'ac' | 'non_ac' | 'other'>('all')

  const fetchServices = async () => {
    setLoading(true)
    setError(null)
    try {
      let response: any
      try {
        response = await api.get<{ data: VehicleTypeItem[] }>(API_ENDPOINTS.vehicleTypes.adminList)
      } catch {
        response = await api.get<{ data: VehicleTypeItem[] }>(API_ENDPOINTS.vehicleTypes.list)
      }
      const data = response.data?.data || response.data || []
      const sorted = [...data].sort((a, b) => a.displayOrder - b.displayOrder)
      setServices(sorted)
    } catch (err: any) {
      setError(err?.message || 'Failed to load vehicle services.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  // Resolve category intelligently
  const resolveCategoryLabel = (item: VehicleTypeItem) => {
    const code = (item.code || '').toUpperCase()
    const cat = (item.category || '').toLowerCase()
    if (code.includes('BIKE') || cat === 'bike') return 'Bike'
    if (code.includes('AUTO') || cat === 'auto') return 'Auto'
    return 'Cab / Car'
  }

  // Resolve badge label
  const resolveBadge = (item: VehicleTypeItem) => {
    const code = (item.code || '').toUpperCase()
    const cat = (item.category || '').toLowerCase()
    const isTwoWheelerOrAuto =
      code.includes('BIKE') || cat === 'bike' || code.includes('AUTO') || cat === 'auto'

    // Bikes and Autos never carry AC or NON AC tags
    if (isTwoWheelerOrAuto) {
      if (item.badge && item.badge !== 'AC' && item.badge !== 'NON AC') {
        return item.badge
      }
      return null
    }

    if (item.badge) return item.badge
    if (item.hasAc || code.includes('_AC')) return 'AC'
    if (code.includes('NON_AC')) return 'NON AC'
    return null
  }

  // Consistent stats matching the dashboard
  const stats = useMemo(() => {
    const total = services.length
    const active = services.filter((s) => s.isActive).length
    const other = services.filter(
      (s) =>
        s.category === 'bike' ||
        s.category === 'auto' ||
        (s.code && (s.code.includes('BIKE') || s.code.includes('AUTO'))),
    ).length
    const ac = services.filter(
      (s) =>
        !s.code.includes('BIKE') &&
        !s.code.includes('AUTO') &&
        s.category !== 'bike' &&
        s.category !== 'auto' &&
        (s.hasAc || (s.badge && s.badge.toUpperCase() === 'AC') || s.code.includes('_AC')),
    ).length
    const nonAc = services.filter(
      (s) =>
        !s.code.includes('BIKE') &&
        !s.code.includes('AUTO') &&
        s.category !== 'bike' &&
        s.category !== 'auto' &&
        (!s.hasAc || s.badge === 'NON AC' || s.code.includes('NON_AC')),
    ).length
    return { total, active, ac, nonAc, other }
  }, [services])

  // Filter services by selected ride tab (All / AC Rides / Non-AC Rides / Other)
  const displayedServices = useMemo(() => {
    if (filterTab === 'all') return services
    if (filterTab === 'other') {
      return services.filter(
        (s) =>
          s.category === 'bike' ||
          s.category === 'auto' ||
          (s.code && (s.code.includes('BIKE') || s.code.includes('AUTO'))),
      )
    }
    if (filterTab === 'ac') {
      return services.filter(
        (s) =>
          !s.code.includes('BIKE') &&
          !s.code.includes('AUTO') &&
          s.category !== 'bike' &&
          s.category !== 'auto' &&
          (s.hasAc || (s.badge && s.badge.toUpperCase() === 'AC') || s.code.includes('_AC')),
      )
    }
    if (filterTab === 'non_ac') {
      return services.filter(
        (s) =>
          !s.code.includes('BIKE') &&
          !s.code.includes('AUTO') &&
          s.category !== 'bike' &&
          s.category !== 'auto' &&
          (!s.hasAc || s.badge === 'NON AC' || s.code.includes('NON_AC')),
      )
    }
    return services
  }, [services, filterTab])

  const handleToggle = async (item: VehicleTypeItem) => {
    try {
      await api.patch(API_ENDPOINTS.vehicleTypes.toggle(item.id))
      const willBeActive = !item.isActive
      setServices((prev) =>
        prev.map((s) => (s.id === item.id ? { ...s, isActive: willBeActive } : s)),
      )
      toast.success(
        willBeActive ? 'Service Activated' : 'Service Deactivated',
        `"${item.name}" is now ${willBeActive ? 'available' : 'hidden'} in mobile apps.`,
      )
    } catch (err: any) {
      toast.error('Action Failed', err?.response?.data?.message || err?.message || 'Failed to toggle service status.')
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirmItem) return
    try {
      setDeleting(true)
      await api.delete(API_ENDPOINTS.vehicleTypes.delete(deleteConfirmItem.id))
      setServices((prev) => prev.filter((s) => s.id !== deleteConfirmItem.id))
      toast.success(
        'Service Deleted',
        `"${deleteConfirmItem.name}" has been permanently removed.`,
      )
      setDeleteConfirmItem(null)
    } catch (err: any) {
      toast.error('Delete Failed', err?.response?.data?.message || err?.message || 'Failed to delete service.')
    } finally {
      setDeleting(false)
    }
  }

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= services.length) return

    const newServices = [...services]
    const temp = newServices[index]
    newServices[index] = newServices[targetIndex]
    newServices[targetIndex] = temp

    const reordered = newServices.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1,
    }))
    setServices(reordered)

    setReordering(true)
    try {
      await api.put(API_ENDPOINTS.vehicleTypes.reorder, {
        orderings: reordered.map((item) => ({
          id: item.id,
          displayOrder: item.displayOrder,
        })),
      })
    toast.info('Priority Order Saved', 'Fleet display order updated.')
    } catch (err: any) {
      toast.error('Reorder Failed', 'Could not save priority order.')
      console.error('Failed to save reordering:', err)
      fetchServices()
    } finally {
      setReordering(false)
    }
  }

  const handleEdit = (item: VehicleTypeItem) => {
    const code = (item.code || '').toUpperCase()
    const cat = (item.category || '').toLowerCase()

    let inferredCategory = item.category || 'car'
    if (code.includes('BIKE') || cat === 'bike') inferredCategory = 'bike'
    else if (code.includes('AUTO') || cat === 'auto') inferredCategory = 'auto'
    else inferredCategory = 'car'

    const isTwoWheelerOrAuto = inferredCategory === 'bike' || inferredCategory === 'auto'

    let cleanBadge = item.badge || ''
    if (isTwoWheelerOrAuto && (cleanBadge === 'AC' || cleanBadge === 'NON AC')) {
      cleanBadge = ''
    }

    setSelectedService({
      id: item.id,
      code: item.code,
      name: item.name,
      category: inferredCategory,
      hasAc: isTwoWheelerOrAuto ? false : Boolean(item.hasAc),
      badge: cleanBadge,
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      imageFileId: item.imageFileId || '',
      icon: item.icon || '',
      passengerCapacity:
        item.passengerCapacity ??
        (inferredCategory === 'bike' ? 1 : inferredCategory === 'auto' ? 3 : 4),
      luggageCapacity:
        item.luggageCapacity ??
        (inferredCategory === 'bike' ? 0 : inferredCategory === 'auto' ? 1 : 2),
      displayOrder: item.displayOrder,
      isActive: item.isActive,
    })
    setIsModalOpen(true)
  }

  const handleCreateNew = () => {
    setSelectedService(null)
    setIsModalOpen(true)
  }

  const resolveImage = (item: VehicleTypeItem) => {
    if (item.imageUrl) {
      if (item.imageUrl.startsWith('http') || item.imageUrl.startsWith('data:')) {
        return item.imageUrl
      }
      const apiHost = APP_CONFIG.api.baseUrl.replace(/\/api\/v1\/?$/, '')
      return `${apiHost}${item.imageUrl.startsWith('/') ? '' : '/'}${item.imageUrl}`
    }
    return null
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Fleet Services & Vehicle Types"
        description="Manage the customer app 2x4 service cards, real image assets, AC/NON AC tags, capacities, and display priority."
        actions={
          <div className="flex items-center gap-2.5">
            {/* Consistent Refresh Button from shared Button component */}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchServices}
              loading={loading}
              className="text-xs font-semibold"
              title="Refresh services"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>

            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-[#1F2B6D] dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-[#1F2B6D] dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                Table
              </button>
            </div>

            {/* Custom Brand Button matching the rest of the Dashboard */}
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateNew}
              className="text-xs font-bold shadow-sm"
              icon={<Plus className="w-4 h-4" />}
            >
              Add New Service
            </Button>
          </div>
        }
      />

      {/* ───── METRIC STATS (Consistent Brand Palette & Distinct Meaningful Icons) ───── */}
      <InfoCardGrid cols={4} className="mb-6">
        <InfoCard
          label="Total Fleet"
          value={stats.total}
          icon={<Car className="w-5 h-5 text-white" />}
          variant="default"
          subtitle="Registered fleet services"
        />
        <InfoCard
          label="AC Rides"
          value={stats.ac}
          icon={<Snowflake className="w-5 h-5 text-white" />}
          variant="info"
          subtitle="Air-conditioned cab options"
        />
        <InfoCard
          label="Non-AC Rides"
          value={stats.nonAc}
          icon={<Wind className="w-5 h-5 text-white" />}
          variant="warning"
          subtitle="Economical cab options"
        />
        <InfoCard
          label="Other Rides"
          value={stats.other}
          icon={<CheckCircle2 className="w-5 h-5 text-white" />}
          variant="success"
          subtitle="Auto Rickshaws & Bikes"
        />
      </InfoCardGrid>

      {/* ───── RIDE CLASSIFICATION TABS (ALL / AC / NON-AC / OTHER) ───── */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {[
            { key: 'all', label: 'All Services', count: stats.total },
            { key: 'ac', label: 'AC Rides', count: stats.ac },
            { key: 'non_ac', label: 'Non-AC Rides', count: stats.nonAc },
            { key: 'other', label: 'Other (Auto & Bike)', count: stats.other },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterTab(tab.key as any)}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shrink-0',
                filterTab === tab.key
                  ? 'bg-[#1F2B6D] text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                  filterTab === tab.key
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchServices}
            className="text-xs font-bold underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-8 h-8 animate-spin text-[#1F2B6D] mb-2" />
          <p className="text-sm text-slate-500">Loading fleet services catalog...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
          <Car className="w-12 h-12 text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            No Services Found
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mt-1">
            Get started by adding your first service (e.g. Auto, Cab Mini, Bike, Cab Economy).
          </p>
          <div className="mt-4">
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateNew}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Service
            </Button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* ───── VISUAL CARD GRID VIEW (MATCHES APP CARDS) ───── */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {displayedServices.map((item, idx) => {
            const imgSrc = resolveImage(item)
            const badge = resolveBadge(item)
            return (
              <div
                key={item.id}
                className={cn(
                  'relative flex flex-col justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 hover:shadow-md',
                  item.isActive
                    ? 'border-slate-200 dark:border-slate-800'
                    : 'border-slate-200/60 dark:border-slate-800/60 opacity-60 bg-slate-50/50',
                )}
              >
                {/* Order & Reorder Controls */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      #{item.displayOrder}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {item.code}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveOrder(idx, 'up')}
                      disabled={idx === 0 || reordering}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                      title="Move up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveOrder(idx, 'down')}
                      disabled={idx === services.length - 1 || reordering}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                      title="Move down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Mobile Preview Visual Card */}
                <div className="flex flex-col items-center justify-center py-4 bg-slate-50/70 dark:bg-slate-950/40 rounded-xl mb-4">
                  <div className="relative w-[74px] h-[61px] rounded-xl border border-[#D4DAE9] dark:border-slate-700 bg-[#F4F6FB] dark:bg-slate-900 overflow-hidden shadow-xs">
                    {badge && (
                      <span className="absolute top-1.5 right-2 font-semibold text-[8.5px] text-[#233464] dark:text-[#93C5FD] tracking-tight z-10 leading-none">
                        {badge}
                      </span>
                    )}

                    <VehicleImageThumbnail
                      src={imgSrc}
                      alt={item.name}
                      category={item.category}
                      className="w-full h-full object-contain p-1"
                      fallbackClassName="w-7 h-7 text-slate-400"
                    />
                  </div>
                  <h4 className="mt-1.5 text-[11px] font-medium leading-none tracking-normal text-[#1E2756] dark:text-slate-100 text-center truncate w-full">
                    {item.name}
                  </h4>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Category:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {resolveCategoryLabel(item)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      Seats:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.passengerCapacity ?? 4}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Map Marker:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                      {item.icon && (item.icon.startsWith('http') || item.icon.startsWith('/')) ? (
                        <span className="text-blue-600 dark:text-blue-400 font-medium">Custom Top-View</span>
                      ) : (
                        <span className="text-slate-400 font-normal">Native Vector</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Status:</span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold',
                        item.isActive
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                      )}
                    >
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          item.isActive ? 'bg-emerald-500' : 'bg-slate-400',
                        )}
                      />
                      {item.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons using custom Button and IconButton */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(item)}
                    icon={<Edit2 className="w-3.5 h-3.5 text-[#1F2B6D]" />}
                    className="flex-1 text-xs font-semibold text-slate-700 hover:text-[#1F2B6D] hover:border-[#1F2B6D]/40"
                  >
                    Edit
                  </Button>
                  <IconButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggle(item)}
                    title={item.isActive ? 'Deactivate' : 'Activate'}
                    className={cn(
                      item.isActive
                        ? 'text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900/60 dark:hover:bg-emerald-950/30'
                        : 'text-slate-400 border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800',
                    )}
                    icon={<Power className="w-3.5 h-3.5" />}
                  />
                  <IconButton
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirmItem(item)}
                    title="Delete Service"
                    className="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/30"
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                  />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ───── DATA TABLE VIEW ───── */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Badge</th>
                <th className="px-4 py-3">Seats</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayedServices.map((item, idx) => {
                const imgSrc = resolveImage(item)
                const badge = resolveBadge(item)
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 font-mono font-bold text-slate-500">
                        <span>#{item.displayOrder}</span>
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => handleMoveOrder(idx, 'up')}
                            disabled={idx === 0 || reordering}
                            className="text-slate-400 hover:text-slate-700 disabled:opacity-20"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveOrder(idx, 'down')}
                            disabled={idx === services.length - 1 || reordering}
                            className="text-slate-400 hover:text-slate-700 disabled:opacity-20"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          <VehicleImageThumbnail
                            src={imgSrc}
                            alt={item.name}
                            category={item.category}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">
                              {item.name}
                            </span>
                            {item.icon && (item.icon.startsWith('http') || item.icon.startsWith('/')) ? (
                              <span className="inline-flex items-center gap-0.5 text-[9.5px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300 font-semibold" title="Custom Top-View GPS Marker Active">
                                📍 Map Icon
                              </span>
                            ) : null}
                          </div>
                          {item.description && (
                            <span className="text-[11px] text-slate-400 truncate max-w-xs block">
                              {item.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-600 dark:text-slate-300">
                      {item.code}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                      {resolveCategoryLabel(item)}
                    </td>
                    <td className="px-4 py-3">
                      {badge ? (
                        <span className="font-semibold text-xs text-[#233464] dark:text-blue-400">
                          {badge}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {item.passengerCapacity ?? 4} seats
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 font-semibold text-xs',
                          item.isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400',
                        )}
                      >
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            item.isActive ? 'bg-emerald-500' : 'bg-slate-400',
                          )}
                        />
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          icon={<Edit2 className="w-3.5 h-3.5 text-[#1F2B6D]" />}
                          className="h-8 px-2.5 text-xs text-slate-700 hover:text-[#1F2B6D] hover:border-[#1F2B6D]/40"
                        >
                          Edit
                        </Button>
                        <IconButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggle(item)}
                          title={item.isActive ? 'Deactivate' : 'Activate'}
                          className={cn(
                            'h-8 w-8',
                            item.isActive
                              ? 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                              : 'text-slate-400 border-slate-200 hover:bg-slate-100',
                          )}
                          icon={<Power className="w-3.5 h-3.5" />}
                        />
                        <IconButton
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteConfirmItem(item)}
                          title="Delete Service"
                          className="h-8 w-8 text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/30"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ───── DRAWER FOR ADD / EDIT ───── */}
      <VehicleTypeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        vehicleType={selectedService}
        servicesCount={services.length}
        existingCodes={services.map((s) => s.code)}
        onSuccess={fetchServices}
      />

      {/* ───── CONFIRM DELETE MODAL ───── */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-2 bg-red-50 dark:bg-red-950/50 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Fleet Service</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-white">&ldquo;{deleteConfirmItem.name}&rdquo;</span> ({deleteConfirmItem.code})? This will remove the service and its rate cards from the system.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmItem(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                loading={deleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? 'Deleting...' : 'Delete Service'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}

export default VehicleTypesListPage
