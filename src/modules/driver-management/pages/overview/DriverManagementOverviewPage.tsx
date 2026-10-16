import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  Layers,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  UserCheck,
  RefreshCw,
  TrendingUp,
  FileWarning,
  Users,
  Hexagon,
  Plus,
  UserPlus,
} from 'lucide-react'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { useApplications, useApplicationStats, useDrivers, useVehicles, useExpiryAlerts } from '../../hooks'
import { useAuditLogs } from '@/modules/audit-log'
import { ActionDropdown } from '../../components'

// Reusable Dashboard Card Table Components
const CardTable = ({ children }: { children: React.ReactNode }) => (
  <div className="overflow-x-auto px-1">
    <table className="w-full text-left text-[12.5px]">{children}</table>
  </div>
)
const CardThead = ({ children }: { children: React.ReactNode }) => (
  <thead className="text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
    {children}
  </thead>
)
const CardTh = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <th className={`pb-3 px-4 font-semibold ${className}`}>{children}</th>
)
const CardTbody = ({ children }: { children: React.ReactNode }) => (
  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{children}</tbody>
)
const CardTr = ({ children, onClick, className = '' }: { children: React.ReactNode; onClick?: () => void; className?: string }) => (
  <tr onClick={onClick} className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}>
    {children}
  </tr>
)
const CardTd = ({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: (e: React.MouseEvent) => void }) => (
  <td className={`py-4 px-4 ${className}`} onClick={onClick}>{children}</td>
)

const ACTION_LABELS: Record<string, string> = {
  APPROVE: 'Approved',
  REJECT: 'Rejected',
  CREATE: 'Created',
  UPDATE: 'Updated',
}

export const DriverManagementOverviewPage: React.FC = () => {
  const navigate = useNavigate()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(() => new Date().toLocaleTimeString())

  // Real hooks data
  const { data: applicationsResponse, refetch: refetchApplications } = useApplications({ limit: 50 })
  const { data: driversResponse, refetch: refetchDrivers } = useDrivers({ limit: 50 })
  const { data: vehiclesResponse, refetch: refetchVehicles } = useVehicles({ limit: 50 })
  const { data: expiryAlertsResponse, refetch: refetchExpiryAlerts } = useExpiryAlerts()
  const { data: applicationStats, refetch: refetchApplicationStats } = useApplicationStats()
  const { data: auditResponse, refetch: refetchAudit } = useAuditLogs({ entityType: 'driver', limit: 5 })

  const liveApplications = applicationsResponse?.data ?? []
  const liveDrivers = driversResponse?.data ?? []
  const liveVehicles = vehiclesResponse?.data ?? []

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.allSettled([
      refetchApplications(),
      refetchDrivers(),
      refetchVehicles(),
      refetchExpiryAlerts(),
      refetchApplicationStats(),
      refetchAudit(),
    ])
    setLastUpdated(new Date().toLocaleTimeString())
    setTimeout(() => setIsRefreshing(false), 500)
  }

  // Application pipeline from the stats endpoint: counts every driver, not just the first page.
  // The backend has no "pending documents" state, so that bucket stays 0.
  const pipelineMetrics = useMemo(() => {
    const s = applicationStats
    if (!s) return { total: 0, underReview: 0, pendingDocs: 0, approved: 0, rejected: 0 }
    return {
      total: s.total,
      underReview: s.pendingReview + s.underReview,
      pendingDocs: 0,
      approved: s.approved,
      rejected: s.rejected,
    }
  }, [applicationStats])

  // Driver Fleet Status Metrics purely from live drivers data (no hardcoded numbers)
  const fleetMetrics = useMemo(() => {
    const total = liveDrivers.length
    if (total === 0) {
      return { total: 0, active: 0, offline: 0, suspended: 0, blocked: 0 }
    }
    const active = liveDrivers.filter(
      (d) => d.driverStatus === 'active' || d.driverStatus === 'online' || d.driverStatus === 'on_trip' || d.isOnline
    ).length
    const suspended = liveDrivers.filter(
      (d) => d.driverStatus === 'suspended' || d.isSuspended
    ).length
    const blocked = liveDrivers.filter(
      (d) => d.driverStatus === 'blocked' || d.isBlocked
    ).length
    const offline = Math.max(0, total - (active + suspended + blocked))

    return { total, active, offline, suspended, blocked }
  }, [liveDrivers])

  // Helper to format phone with spaces: +91 96005 774525
  const formatPhone = (phone?: string) => {
    if (!phone) return '—'
    const clean = phone.trim()
    if (clean.startsWith('+91') && clean.length >= 12) {
      const rest = clean.slice(3)
      return `+91 ${rest.slice(0, 5)} ${rest.slice(5)}`
    }
    if (clean.length === 10) {
      return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`
    }
    return clean
  }

  // "uploaded / required" exactly as the API reports it; unknown stays unknown
  const formatDocs = (count?: number, total?: number) =>
    count === undefined ? '—' : total === undefined ? String(count) : `${count} / ${total}`

  // Dynamic Expiries calculation from live backend API or live documents
  const expiryMetrics = useMemo(() => {
    // 1. If backend expiry-alerts API returned data, use authoritative DB values
    if (expiryAlertsResponse) {
      return {
        expired: expiryAlertsResponse.expired,
        d30: expiryAlertsResponse.d30,
        d60: expiryAlertsResponse.d60,
        d90: expiryAlertsResponse.d90,
      }
    }

    // 2. Otherwise calculate dynamically from live vehicles & drivers
    const now = new Date()
    let expired = 0
    let d30 = 0
    let d60 = 0
    let d90 = 0

    const checkDate = (dStr?: string | null) => {
      if (!dStr) return
      const d = new Date(dStr)
      if (isNaN(d.getTime())) return
      const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays < 0) expired++
      else if (diffDays <= 30) d30++
      else if (diffDays <= 60) d60++
      else if (diffDays <= 90) d90++
    }

    liveVehicles.forEach((v) => {
      checkDate(v.insuranceExpiry)
      checkDate(v.permitExpiry)
      checkDate(v.fitnessExpiry)
      checkDate(v.pollutionExpiry)
    })

    liveDrivers.forEach((d) => {
      checkDate(d.licenseExpiry)
    })

    return { expired, d30, d60, d90 }
  }, [expiryAlertsResponse, liveVehicles, liveDrivers])

  // Recent Applications dynamically merging live applications & drivers
  const recentApplications = useMemo(() => {
    const unified: Array<{
      id: string
      name: string
      phone: string
      photo?: string
      appId: string
      submittedAtRaw: Date
      documents: string
      status: 'under_review' | 'pending_docs' | 'approved' | 'rejected'
      statusLabel: string
      avatarInitial: string
    }> = []

    // 1. Ingest applications
    liveApplications.forEach((app, idx) => {
      const rawDate = new Date(app.submittedAt || app.createdAt)
      let statusKey: 'under_review' | 'pending_docs' | 'approved' | 'rejected' = 'under_review'
      let label = 'Under Review'
      if (app.applicationStatus === 'approved') {
        statusKey = 'approved'
        label = 'Approved'
      } else if (app.applicationStatus === 'rejected') {
        statusKey = 'rejected'
        label = 'Rejected'
      } else if (
        app.applicationStatus === 'draft' ||
        app.applicationStatus === 'resubmission_required'
      ) {
        statusKey = 'pending_docs'
        label = 'Pending Docs'
      }

      let name = app.driverName?.trim()
      if (!name || name === app.mobileNumber || name.startsWith('+')) {
        const idSuffix = (app.applicationId || app.id).replace('DRV_', '').slice(0, 4)
        name = `Applicant ${idSuffix}`
      }

      const initials = name
        .split(' ')
        .filter((part) => part.length > 0 && /^[a-zA-Z]/.test(part))
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase() || `A${idx + 1}`

      unified.push({
        id: app.id,
        name,
        phone: formatPhone(app.mobileNumber),
        photo: app.profilePhotoUrl,
        appId: app.applicationId || `DRV_${app.id.substring(0, 8).toUpperCase()}`,
        submittedAtRaw: !isNaN(rawDate.getTime()) ? rawDate : new Date(),
        documents: formatDocs(app.documentsCount, app.totalDocuments),
        status: statusKey,
        statusLabel: label,
        avatarInitial: initials,
      })
    })

    // 2. Ingest verified/approved drivers not already present
    liveDrivers.forEach((driver) => {
      if (unified.some((u) => u.id === driver.id || u.appId === driver.applicationId || u.appId === driver.driverCode)) {
        return
      }
      const rawDate = new Date(driver.joinedAt || driver.createdAt)
      let statusKey: 'under_review' | 'pending_docs' | 'approved' | 'rejected' = 'approved'
      let label = 'Approved'
      if (driver.verificationStatus?.toLowerCase() === 'rejected' || driver.driverStatus === 'rejected') {
        statusKey = 'rejected'
        label = 'Rejected'
      } else if (driver.verificationStatus?.toLowerCase() === 'document_review' || driver.verificationStatus?.toLowerCase() === 'pending') {
        statusKey = 'under_review'
        label = 'Under Review'
      }

      let name = driver.driverName?.trim()
      if (!name || name === driver.mobileNumber || name.startsWith('+')) {
        const idSuffix = (driver.driverCode || driver.id).replace('DRV_', '').slice(0, 4)
        name = `Driver ${idSuffix}`
      }

      const initials = name
        .split(' ')
        .filter((part) => part.length > 0 && /^[a-zA-Z]/.test(part))
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase() || 'DR'

      unified.push({
        id: driver.id,
        name,
        phone: formatPhone(driver.mobileNumber),
        photo: driver.profilePhotoUrl,
        appId: driver.driverCode || driver.applicationId || `DRV_${driver.id.substring(0, 8).toUpperCase()}`,
        submittedAtRaw: !isNaN(rawDate.getTime()) ? rawDate : new Date(),
        documents: formatDocs(driver.documentsCount, driver.totalDocuments),
        status: statusKey,
        statusLabel: label,
        avatarInitial: initials,
      })
    })

    unified.sort((a, b) => b.submittedAtRaw.getTime() - a.submittedAtRaw.getTime())

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    return unified.slice(0, 5).map((item) => {
      const d = item.submittedAtRaw
      const dateStr = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
      const hours = d.getHours()
      const mins = d.getMinutes().toString().padStart(2, '0')
      const ampm = hours >= 12 ? 'PM' : 'AM'
      const h12 = (hours % 12 || 12).toString().padStart(2, '0')
      const timeStr = `${h12}:${mins} ${ampm}`

      return {
        id: item.id,
        name: item.name,
        phone: item.phone,
        photo: item.photo,
        appId: item.appId,
        submittedDate: dateStr,
        submittedTime: timeStr,
        documents: item.documents,
        status: item.status,
        statusLabel: item.statusLabel,
        avatarInitial: item.avatarInitial,
      }
    })
  }, [liveApplications, liveDrivers])

  // Recent driver verification decisions from the audit log (needs audit:read)
  const recentActivities = useMemo(() => {
    const nameById = new Map<string, string>()
    for (const a of liveApplications) nameById.set(a.id, a.driverName)
    for (const d of liveDrivers) nameById.set(d.id, d.driverName)
    return (auditResponse?.data ?? []).map((log) => {
      const action = log.action.toUpperCase()
      return {
        id: log.id,
        driverId: log.entityId,
        time: new Date(log.timestamp).toLocaleString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
        }),
        admin: log.actor,
        adminInitial: log.actor.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase(),
        action: ACTION_LABELS[action] ?? log.action,
        actionType: action === 'APPROVE' ? 'verified' : action === 'REJECT' ? 'rejected' : action === 'CREATE' ? 'submitted' : 'moved',
        driver: (log.entityId && nameById.get(log.entityId)) || '—',
        details: log.notes || '—',
      }
    })
  }, [auditResponse, liveApplications, liveDrivers])

  // Pipeline Bar Chart Heights - Dynamic based on actual real data
  const maxBarValue = useMemo(() => {
    const maxVal = Math.max(
      pipelineMetrics.total,
      pipelineMetrics.underReview,
      pipelineMetrics.pendingDocs,
      pipelineMetrics.approved,
      pipelineMetrics.rejected,
      1
    )
    if (maxVal <= 5) return 5
    if (maxVal <= 10) return 10
    if (maxVal <= 25) return 25
    return Math.ceil(maxVal / 5) * 5
  }, [pipelineMetrics])

  // Dynamic Y-axis tick intervals (6 ticks from maxBarValue down to 0)
  const yAxisTicks = useMemo(() => {
    const step = maxBarValue / 5
    return [maxBarValue, Math.round(step * 4), Math.round(step * 3), Math.round(step * 2), Math.round(step), 0]
  }, [maxBarValue])

  const getBarHeightPercent = (val: number) => {
    if (!val || val <= 0) return 0
    return Math.min(100, Math.max(8, Math.round((val / maxBarValue) * 100)))
  }

  // Dynamic Percentage Calculation Helper (No hardcoded percent!)
  const calcPercent = (count: number, total: number) => {
    if (!total || total <= 0) return 0
    return Math.round((count / total) * 100)
  }

  // Application Donut slices & percentages
  const appTotal = pipelineMetrics.total || 0
  const appSlices = useMemo(() => [
    { label: 'Under Review', count: pipelineMetrics.underReview, color: '#1B2A6B', percent: calcPercent(pipelineMetrics.underReview, appTotal) },
    { label: 'Pending Documents', count: pipelineMetrics.pendingDocs, color: '#FAC033', percent: calcPercent(pipelineMetrics.pendingDocs, appTotal) },
    { label: 'Approved', count: pipelineMetrics.approved, color: '#00C48C', percent: calcPercent(pipelineMetrics.approved, appTotal) },
    { label: 'Rejected', count: pipelineMetrics.rejected, color: '#F05252', percent: calcPercent(pipelineMetrics.rejected, appTotal) }
  ], [pipelineMetrics, appTotal])

  // Fleet Donut slices & percentages
  const fleetTotal = fleetMetrics.total || 0
  const fleetSlices = useMemo(() => [
    { label: 'Active', count: fleetMetrics.active, color: '#00C48C', percent: calcPercent(fleetMetrics.active, fleetTotal) },
    { label: 'Offline', count: fleetMetrics.offline, color: '#3B82F6', percent: calcPercent(fleetMetrics.offline, fleetTotal) },
    { label: 'Suspended', count: fleetMetrics.suspended, color: '#F77D2C', percent: calcPercent(fleetMetrics.suspended, fleetTotal) },
    { label: 'Blocked', count: fleetMetrics.blocked, color: '#F05252', percent: calcPercent(fleetMetrics.blocked, fleetTotal) }
  ], [fleetMetrics, fleetTotal])

  // Dynamic Donut SVG Slices Renderer (matching Figma proportions with generous inner padding)
  const renderDonutSlices = (
    slices: { label: string; count: number; color: string }[],
    total: number
  ) => {
    const radius = 39
    const circumference = 2 * Math.PI * radius // ~245.044
    const strokeWidth = 9.5

    if (total <= 0) {
      return (
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
      )
    }

    const activeSlices = slices.filter((s) => s.count > 0)
    if (activeSlices.length === 0) {
      return (
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
      )
    }

    // Single active category: render full solid ring
    if (activeSlices.length === 1) {
      return (
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke={activeSlices[0].color}
          strokeWidth={strokeWidth}
          fill="transparent"
          className="transition-all duration-500"
        />
      )
    }

    const sliceSum = activeSlices.reduce((sum, s) => sum + s.count, 0)
    const baseTotal = sliceSum > 0 ? sliceSum : total
    const gap = 2.5
    let accumulatedArc = 0

    return activeSlices.map((slice, idx) => {
      const fraction = slice.count / baseTotal
      const arcLength = fraction * circumference
      const visibleDash = Math.max(1, arcLength - gap)
      const strokeDasharray = `${visibleDash} ${circumference - visibleDash}`
      const strokeDashoffset = -accumulatedArc

      accumulatedArc += arcLength

      return (
        <circle
          key={idx}
          cx="50"
          cy="50"
          r={radius}
          stroke={slice.color}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          fill="transparent"
          className="transition-all duration-500"
        />
      )
    })
  }

  return (
    <PageWrapper>
      <div className="space-y-6">

        {/* ─── Top Header with Date Filter & Geographic Refresh Style ───────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F2B6D] dark:text-white">
              Driver Management Overview
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Complete view of driver onboarding, verification, operations and compliance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
              Last updated {lastUpdated}
            </span>
            <button
              type="button"
              onClick={handleRefresh}
              title="Refresh data"
              className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition shadow-2xs"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#1F2B6D]' : ''}`}
              />
            </button>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>All time</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/driver-management/applications/new')}
              className="bg-[#1F2B6D] hover:bg-[#182258] active:scale-[0.98] text-white px-4 py-2 rounded-[10px] text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register Driver</span>
            </button>
          </div>
        </div>

        {/* ─── SECTION 1: Top 5 Metric Cards (Geographic Dashboard Custom Card) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">

          {/* Card 1: Total Applications */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                    {pipelineMetrics.total}
                  </p>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                    Total Applications
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1 font-semibold text-emerald-600">
                <TrendingUp className="w-3.5 h-3.5" />
                +12% from last month
              </span>
            </div>
          </div>

          {/* Card 2: Under Review */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-[42px] h-[42px] rounded-full bg-amber-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                    {pipelineMetrics.underReview}
                  </p>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                    Under Review
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
              {calcPercent(pipelineMetrics.underReview, pipelineMetrics.total)}% of total pipeline
            </p>
          </div>

          {/* Card 3: Pending Documents */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-[42px] h-[42px] rounded-full bg-orange-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                    {pipelineMetrics.pendingDocs}
                  </p>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                    Pending Documents
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs font-semibold text-orange-600 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
              Require partner attention
            </p>
          </div>

          {/* Card 4: Approved This Month */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                    {pipelineMetrics.approved}
                  </p>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                    Approved This Month
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1 font-semibold text-emerald-600">
                <TrendingUp className="w-3.5 h-3.5" />
                {calcPercent(pipelineMetrics.approved, pipelineMetrics.total)}% approval rate
              </span>
            </div>
          </div>

          {/* Card 5: Active Drivers */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                    {fleetMetrics.active}
                  </p>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                    Active Drivers
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1 font-semibold text-emerald-600">
                <TrendingUp className="w-3.5 h-3.5" />
                {calcPercent(fleetMetrics.active, fleetMetrics.total)}% of driver fleet
              </span>
            </div>
          </div>

        </div>

        {/* ─── SECTION 2: Visualizations (Pipeline Bar Chart & 2 Donut Charts - Dynamic & Pixel-Perfect) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-4">

          {/* 1. Application Pipeline Bar Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-1 mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-5.5 h-5.5 rounded-full bg-[#1B2A6B] text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Layers className="w-3 h-3" />
                </div>
                <h3 className="text-sm sm:text-[15px] font-bold text-[#1B2A6B] dark:text-white">
                  Application Pipeline
                </h3>
              </div>
              <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
                All time
              </span>
            </div>

            {/* Bar Chart Container */}
            <div className="mt-1">
              <div className="relative h-28 sm:h-30 flex items-end">
                {/* Horizontal gridlines with dynamic Y labels */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-0.5">
                  {yAxisTicks.map((val) => (
                    <div key={val} className="flex items-center w-full">
                      <span className="w-5 text-[10px] sm:text-[10.5px] font-medium text-slate-400 text-left shrink-0">
                        {val}
                      </span>
                      <div className="flex-1 border-b border-slate-100 dark:border-slate-800/90" />
                    </div>
                  ))}
                </div>

                {/* 5 Bars Area */}
                <div className="relative z-10 w-full flex items-end justify-between pl-6 pr-1.5 h-full pb-0.5">
                  {/* Bar 1: Total Applications */}
                  <div className="flex flex-col items-center h-full justify-end group">
                    <span className="text-[11px] sm:text-xs font-bold text-[#1B2A6B] dark:text-white mb-1 transition-transform group-hover:scale-110">
                      {pipelineMetrics.total}
                    </span>
                    {pipelineMetrics.total > 0 ? (
                      <div
                        className="w-9 sm:w-10 md:w-11 bg-[#1B2A6B] rounded-t-[3px] shadow-2xs transition-all duration-500"
                        style={{ height: `${getBarHeightPercent(pipelineMetrics.total)}%` }}
                      />
                    ) : (
                      <div className="w-9 sm:w-10 md:w-11 h-1 bg-slate-100 dark:bg-slate-800 rounded-t-[2px]" />
                    )}
                  </div>

                  {/* Bar 2: Under Review */}
                  <div className="flex flex-col items-center h-full justify-end group">
                    <span className="text-[11px] sm:text-xs font-bold text-[#1B2A6B] dark:text-white mb-1 transition-transform group-hover:scale-110">
                      {pipelineMetrics.underReview}
                    </span>
                    {pipelineMetrics.underReview > 0 ? (
                      <div
                        className="w-9 sm:w-10 md:w-11 bg-[#FAC033] rounded-t-[3px] shadow-2xs transition-all duration-500"
                        style={{ height: `${getBarHeightPercent(pipelineMetrics.underReview)}%` }}
                      />
                    ) : (
                      <div className="w-9 sm:w-10 md:w-11 h-1 bg-slate-100 dark:bg-slate-800 rounded-t-[2px]" />
                    )}
                  </div>

                  {/* Bar 3: Pending Documents */}
                  <div className="flex flex-col items-center h-full justify-end group">
                    <span className="text-[11px] sm:text-xs font-bold text-[#1B2A6B] dark:text-white mb-1 transition-transform group-hover:scale-110">
                      {pipelineMetrics.pendingDocs}
                    </span>
                    {pipelineMetrics.pendingDocs > 0 ? (
                      <div
                        className="w-9 sm:w-10 md:w-11 bg-[#F77D2C] rounded-t-[3px] shadow-2xs transition-all duration-500"
                        style={{ height: `${getBarHeightPercent(pipelineMetrics.pendingDocs)}%` }}
                      />
                    ) : (
                      <div className="w-9 sm:w-10 md:w-11 h-1 bg-slate-100 dark:bg-slate-800 rounded-t-[2px]" />
                    )}
                  </div>

                  {/* Bar 4: Approved */}
                  <div className="flex flex-col items-center h-full justify-end group">
                    <span className="text-[11px] sm:text-xs font-bold text-[#1B2A6B] dark:text-white mb-1 transition-transform group-hover:scale-110">
                      {pipelineMetrics.approved}
                    </span>
                    {pipelineMetrics.approved > 0 ? (
                      <div
                        className="w-9 sm:w-10 md:w-11 bg-[#00C48C] rounded-t-[3px] shadow-2xs transition-all duration-500"
                        style={{ height: `${getBarHeightPercent(pipelineMetrics.approved)}%` }}
                      />
                    ) : (
                      <div className="w-9 sm:w-10 md:w-11 h-1 bg-slate-100 dark:bg-slate-800 rounded-t-[2px]" />
                    )}
                  </div>

                  {/* Bar 5: Rejected */}
                  <div className="flex flex-col items-center h-full justify-end group">
                    <span className="text-[11px] sm:text-xs font-bold text-[#1B2A6B] dark:text-white mb-1 transition-transform group-hover:scale-110">
                      {pipelineMetrics.rejected}
                    </span>
                    {pipelineMetrics.rejected > 0 ? (
                      <div
                        className="w-9 sm:w-10 md:w-11 bg-[#F05252] rounded-t-[3px] shadow-2xs transition-all duration-500"
                        style={{ height: `${getBarHeightPercent(pipelineMetrics.rejected)}%` }}
                      />
                    ) : (
                      <div className="w-9 sm:w-10 md:w-11 h-1 bg-slate-100 dark:bg-slate-800 rounded-t-[2px]" />
                    )}
                  </div>
                </div>
              </div>

              {/* X-Axis Category Labels */}
              <div className="flex justify-between items-start pl-6 pr-1.5 mt-2 text-[10px] sm:text-[10.5px] font-medium text-slate-500 dark:text-slate-400 text-center leading-tight">
                <div className="w-9 sm:w-10 md:w-11">
                  <span>Total</span>
                  <br />
                  <span>Applications</span>
                </div>
                <div className="w-9 sm:w-10 md:w-11">
                  <span>Under</span>
                  <br />
                  <span>Review</span>
                </div>
                <div className="w-9 sm:w-10 md:w-11">
                  <span>Pending</span>
                  <br />
                  <span>Documents</span>
                </div>
                <div className="w-9 sm:w-10 md:w-11">
                  <span>Approved</span>
                </div>
                <div className="w-9 sm:w-10 md:w-11">
                  <span>Rejected</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Application Status Distribution Donut Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2 sm:mb-2.5">
              <h3 className="text-sm sm:text-[15px] font-bold text-[#1B2A6B] dark:text-white">
                Application Status Distribution
              </h3>
            </div>

            <div className="flex items-center justify-between gap-3 sm:gap-4 my-auto">
              {/* SVG Donut */}
              <div className="relative w-32 h-32 sm:w-[136px] sm:h-[136px] flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {renderDonutSlices(appSlices, pipelineMetrics.total)}
                </svg>
                {/* Center text with ample circle clearance */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none -translate-y-0.5">
                  <span className="text-2xl sm:text-[26px] font-extrabold text-[#1B2A6B] dark:text-white leading-none">
                    {pipelineMetrics.total}
                  </span>
                  <span className="text-[10px] sm:text-[10.5px] text-slate-400 font-medium mt-1">Applications</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="flex-1 space-y-2 sm:space-y-2.5">
                {appSlices.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-0.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-xs sm:text-[12.5px] font-medium text-slate-700 dark:text-slate-300 truncate">
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 pl-1.5">
                      <span className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white min-w-[18px] text-right">
                        {item.count}
                      </span>
                      <span className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-400 font-normal w-7 text-right">
                        {item.percent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Driver Fleet Status Donut Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2 sm:mb-2.5">
              <h3 className="text-sm sm:text-[15px] font-bold text-[#1B2A6B] dark:text-white">
                Driver Fleet Status
              </h3>
            </div>

            <div className="flex items-center justify-between gap-3 sm:gap-4 my-auto">
              {/* SVG Donut */}
              <div className="relative w-32 h-32 sm:w-[136px] sm:h-[136px] flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {renderDonutSlices(fleetSlices, fleetMetrics.total)}
                </svg>
                {/* Center text with ample circle clearance */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none -translate-y-0.5">
                  <span className="text-2xl sm:text-[26px] font-extrabold text-[#1B2A6B] dark:text-white leading-none">
                    {fleetMetrics.total}
                  </span>
                  <span className="text-[10px] sm:text-[10.5px] text-slate-400 font-medium mt-1">Total Drivers</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="flex-1 space-y-2 sm:space-y-2.5">
                {fleetSlices.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-0.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-xs sm:text-[12.5px] font-medium text-slate-700 dark:text-slate-300 truncate">
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 pl-1.5">
                      <span className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white min-w-[18px] text-right">
                        {item.count}
                      </span>
                      <span className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-400 font-normal w-7 text-right">
                        {item.percent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* ─── SECTION 3, 4, 5: Main Grid (Recent Applications, Expiries, Activities) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

          {/* Left Column (2 Cols): Recent Applications & Recent Activities */}
          <div className="lg:col-span-8 space-y-6 flex flex-col">

            {/* 3. Recent Driver Applications Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-4 flex items-center justify-between bg-white dark:bg-slate-900 z-10">
                <div className="flex items-center gap-2.5">
                  <Hexagon className="w-[18px] h-[18px] text-[#1F2B6D] dark:text-[#8B93D9]" strokeWidth={2.5} />
                  <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">Recent Driver Applications</h3>
                </div>
                <button
                  onClick={() => navigate('/driver-management/applications')}
                  className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                >
                  View All
                </button>
              </div>

              <CardTable>
                <CardThead>
                  <tr>
                    <CardTh>Applicant</CardTh>
                    <CardTh>Application ID</CardTh>
                    <CardTh>Submitted On</CardTh>
                    <CardTh>Documents</CardTh>
                    <CardTh>Status</CardTh>
                    <CardTh className="text-center">Actions</CardTh>
                  </tr>
                </CardThead>
                <CardTbody>
                  {recentApplications.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">No applications yet</td>
                    </tr>
                  )}
                  {recentApplications.map((app) => (
                    <CardTr key={app.id} onClick={() => navigate(`/driver-management/applications/${app.id}`)}>
                      {/* Applicant */}
                      <CardTd>
                        <div className="flex items-center gap-3">
                          {app.photo ? (
                            <img src={app.photo} alt={app.name} className="w-8 h-8 rounded-full object-cover shrink-0 shadow-2xs" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#DBEAFE] text-[#1D4ED8] dark:bg-blue-950/40 dark:text-blue-300 font-bold text-[12.5px] flex items-center justify-center shrink-0">
                              {app.avatarInitial}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{app.name}</p>
                            <p className="text-[11.5px] text-slate-500 font-medium">{app.phone}</p>
                          </div>
                        </div>
                      </CardTd>

                      {/* Application ID */}
                      <CardTd className="font-medium text-slate-600 dark:text-slate-300 font-sans">
                        {app.appId}
                      </CardTd>

                      {/* Submitted On */}
                      <CardTd>
                        <p className="font-semibold text-slate-700 dark:text-slate-200">{app.submittedDate}</p>
                        <p className="text-[11.5px] text-slate-400">{app.submittedTime}</p>
                      </CardTd>

                      {/* Documents */}
                      <CardTd className="font-bold text-slate-700 dark:text-slate-300">
                        {app.documents}
                      </CardTd>

                      {/* Status */}
                      <CardTd>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11.5px] font-bold ${app.status === 'under_review' ? 'bg-[#FFF4EB] text-[#D97706] dark:bg-amber-950/20 dark:text-amber-400' :
                            app.status === 'pending_docs' ? 'bg-[#FFF4EB] text-[#D97706] dark:bg-amber-950/20 dark:text-amber-400' :
                              app.status === 'approved' ? 'bg-[#E8FAF0] text-[#10B981] dark:bg-emerald-950/20 dark:text-emerald-400' :
                                'bg-[#FEE2E2] text-[#EF4444] dark:bg-rose-950/20 dark:text-rose-400'
                          }`}>
                          {app.statusLabel}
                        </span>
                      </CardTd>

                      {/* Actions */}
                      <CardTd className="text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          {app.status === 'under_review' || app.status === 'pending_docs' ? (
                            <button
                              onClick={() => navigate(`/driver-management/applications/${app.id}`)}
                              className="px-4 py-1.5 rounded-md text-[11.5px] font-bold bg-[#1F2B6D] hover:bg-[#182258] text-white shadow-2xs transition-colors"
                            >
                              Review
                            </button>
                          ) : (
                            <button
                              onClick={() => navigate(`/driver-management/applications/${app.id}`)}
                              className="px-4 py-1.5 rounded-md text-[11.5px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1F2B6D] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
                            >
                              View
                            </button>
                          )}

                          <ActionDropdown
                            actions={[
                              {
                                label: 'Review Application',
                                icon: <FileText className="w-3.5 h-3.5" />,
                                onClick: () => navigate(`/driver-management/applications/${app.id}`)
                              },
                              {
                                label: 'View Partner Details',
                                icon: <UserCheck className="w-3.5 h-3.5" />,
                                onClick: () => navigate('/driver-management/drivers')
                              }
                            ]}
                          />
                        </div>
                      </CardTd>
                    </CardTr>
                  ))}
                </CardTbody>
              </CardTable>
            </div>

            {/* 5. Recent Verifications & Activities */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col flex-1">
              <div className="px-5 py-4 flex items-center justify-between bg-white dark:bg-slate-900 z-10">
                <div className="flex items-center gap-2.5">
                  <Hexagon className="w-[18px] h-[18px] text-[#1F2B6D] dark:text-[#8B93D9]" strokeWidth={2.5} />
                  <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">Recent Verifications & Activities</h3>
                </div>
                <button
                  onClick={() => navigate('/driver-management/applications')}
                  className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                >
                  View All
                </button>
              </div>

              <CardTable>
                <CardThead>
                  <tr>
                    <CardTh>Time</CardTh>
                    <CardTh>Admin</CardTh>
                    <CardTh>Action</CardTh>
                    <CardTh>Driver</CardTh>
                    <CardTh>Details</CardTh>
                  </tr>
                </CardThead>
                <CardTbody>
                  {recentActivities.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">No verification activity yet</td>
                    </tr>
                  )}
                  {recentActivities.map((act) => (
                    <CardTr
                      key={act.id}
                      onClick={act.driverId ? () => navigate(`/driver-management/applications/${act.driverId}`) : undefined}
                    >
                      <CardTd className="text-slate-500 font-medium whitespace-nowrap">
                        {act.time}
                      </CardTd>
                      <CardTd>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {act.adminInitial}
                          </div>
                          <span className="font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                            {act.admin}
                          </span>
                        </div>
                      </CardTd>
                      <CardTd>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11.5px] font-bold ${act.actionType === 'verified' ? 'bg-[#E8FAF0] text-[#10B981] dark:bg-emerald-950/20 dark:text-emerald-400' :
                            act.actionType === 'moved' ? 'bg-[#EFF6FF] text-[#2563EB] dark:bg-blue-950/20 dark:text-blue-400' :
                              act.actionType === 'rejected' ? 'bg-[#FEE2E2] text-[#EF4444] dark:bg-rose-950/20 dark:text-rose-400' :
                                'bg-[#F1F5F9] text-[#334155] dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                          {act.action}
                        </span>
                      </CardTd>
                      <CardTd className="font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {act.driver}
                      </CardTd>
                      <CardTd className="text-slate-500 dark:text-slate-400">
                        {act.details}
                      </CardTd>
                    </CardTr>
                  ))}
                </CardTbody>
              </CardTable>
            </div>

          </div>

          {/* Right Column (1 Col): 4. Documents Expiry Alerts (Excluding Quick Actions as requested) */}
          <div className="lg:col-span-4 space-y-6 flex flex-col">

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-4 flex items-center justify-between bg-white dark:bg-slate-900 z-10">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">Documents Expiry Alerts</h3>
                </div>
                <button
                  onClick={() => navigate('/vehicle-management/vehicles')}
                  className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                >
                  View All
                </button>
              </div>

              <div className="p-5">
                {/* 4 Alert Cards */}
                <div className="space-y-3">

                  {/* 1. Expired Documents */}
                  <div
                    onClick={() => navigate('/vehicle-management/vehicles')}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/20 hover:bg-rose-100/60 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <FileWarning className="w-[18px] h-[18px] text-rose-500 shrink-0" fill="currentColor" />
                      <div>
                        <p className="text-xs font-bold text-rose-600 dark:text-rose-400">Expired Documents</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Immediate action required</p>
                      </div>
                    </div>
                    <span className="text-base sm:text-lg font-bold text-rose-600 dark:text-rose-400">
                      {expiryMetrics.expired}
                    </span>
                  </div>

                  {/* 2. Expiring in 30 days */}
                  <div
                    onClick={() => navigate('/vehicle-management/vehicles')}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-orange-50/80 dark:bg-amber-950/20 hover:bg-orange-100/60 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-[18px] h-[18px] rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0 font-bold text-[11px]">
                        !
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1F2B6D] dark:text-slate-100">Expiring in 30 days</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Expire within 30 days</p>
                      </div>
                    </div>
                    <span className="text-base sm:text-lg font-bold text-orange-500 dark:text-orange-400">
                      {expiryMetrics.d30}
                    </span>
                  </div>

                  {/* 3. Expiring in 60 days */}
                  <div
                    onClick={() => navigate('/vehicle-management/vehicles')}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50/50 dark:bg-yellow-950/20 hover:bg-amber-100/60 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <ShieldAlert className="w-[18px] h-[18px] text-amber-400 shrink-0" fill="currentColor" />
                      <div>
                        <p className="text-xs font-bold text-[#1F2B6D] dark:text-slate-100">Expiring in 60 days</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Expire within 60 days</p>
                      </div>
                    </div>
                    <span className="text-base sm:text-lg font-bold text-amber-500 dark:text-amber-400">
                      {expiryMetrics.d60}
                    </span>
                  </div>

                  {/* 4. Expiring in 90 days */}
                  <div
                    onClick={() => navigate('/vehicle-management/vehicles')}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/20 hover:bg-blue-100/60 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <ShieldCheck className="w-[18px] h-[18px] text-blue-500 shrink-0" fill="currentColor" />
                      <div>
                        <p className="text-xs font-bold text-[#1F2B6D] dark:text-slate-100">Expiring in 90 days</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Expire within 90 days</p>
                      </div>
                    </div>
                    <span className="text-base sm:text-lg font-bold text-[#1F2B6D] dark:text-blue-400">
                      {expiryMetrics.d90}
                    </span>
                  </div>

                </div>
              </div>
            </div>

            {/* 6. Quick Actions Card (Geographic Management Consistent Design) */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-sm">
              <h3 className="text-sm font-bold text-[#1F2B6D] dark:text-white mb-3 leading-none">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {/* Review Applications */}
                <button
                  type="button"
                  onClick={() => navigate('/driver-management/applications')}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#1F2B6D]/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-center gap-2.5 bg-white dark:bg-slate-900 cursor-pointer text-left shadow-2xs"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-[#1F2B6D] dark:text-[#8B93D9]">
                    <FileText className="w-[18px] h-[18px]" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-bold text-[#1F2B6D] dark:text-slate-100 leading-tight">
                      Review Apps
                    </p>
                    <p className="text-[11px] text-slate-400 leading-tight truncate">
                      Audit pending files
                    </p>
                  </div>
                </button>

                {/* Register Driver */}
                <button
                  type="button"
                  onClick={() => navigate('/driver-management/applications/new')}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#1F2B6D]/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-center gap-2.5 bg-white dark:bg-slate-900 cursor-pointer text-left shadow-2xs"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-[#1F2B6D] dark:text-[#8B93D9]">
                    <UserPlus className="w-[18px] h-[18px]" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-bold text-[#1F2B6D] dark:text-slate-100 leading-tight">
                      Register Driver
                    </p>
                    <p className="text-[11px] text-slate-400 leading-tight truncate">
                      Add driver partner
                    </p>
                  </div>
                </button>

                {/* Manage Drivers */}
                <button
                  type="button"
                  onClick={() => navigate('/driver-management/drivers')}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#1F2B6D]/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-center gap-2.5 bg-white dark:bg-slate-900 cursor-pointer text-left shadow-2xs"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-[#1F2B6D] dark:text-[#8B93D9]">
                    <Users className="w-[18px] h-[18px]" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-bold text-[#1F2B6D] dark:text-slate-100 leading-tight">
                      Manage Fleet
                    </p>
                    <p className="text-[11px] text-slate-400 leading-tight truncate">
                      Active drivers & duty
                    </p>
                  </div>
                </button>

                {/* Expiry Report */}
                <button
                  type="button"
                  onClick={() => navigate('/vehicle-management/vehicles')}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#1F2B6D]/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-center gap-2.5 bg-white dark:bg-slate-900 cursor-pointer text-left shadow-2xs"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-[#1F2B6D] dark:text-[#8B93D9]">
                    <ShieldAlert className="w-[18px] h-[18px]" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-bold text-[#1F2B6D] dark:text-slate-100 leading-tight">
                      Expiry Alerts
                    </p>
                    <p className="text-[11px] text-slate-400 leading-tight truncate">
                      Document compliance
                    </p>
                  </div>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </PageWrapper>
  )
}

export default DriverManagementOverviewPage
