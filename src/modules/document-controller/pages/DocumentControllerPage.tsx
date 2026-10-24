import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { CardTableButton } from '@/shared/components/ui/CardTable'
import { ActionDropdown } from '@/modules/driver-management/components/ActionDropdown'
import { Modal } from '@/shared/components/ui/Modal'
import { ImagePreviewModal } from '@/modules/driver-management/components'
import { useToast } from '@/shared/context/toast'
import { useDocumentCompliance, useDocumentSettings, useUpdateDocumentSettings, useReviewDocument } from '../hooks'
import {
  FileText, Eye, Calendar, Settings,
  CheckCircle2, Phone, Search, Download, Bell,
  RotateCcw, ArrowLeft, Filter,
  Car, CreditCard, Award,
  MessageSquare, Clock, MapPin,
  FileCheck, Shield, Send, ExternalLink, RefreshCw,
  FileWarning, ChevronLeft, ChevronRight, X,
  SlidersHorizontal, Check, AlertCircle
} from 'lucide-react'

// Vehicle thumbnails & document preview assets
import bikeIcon from '@/assets/images/vehicles/Bike-icon.jpg'
import autoIcon from '@/assets/images/vehicles/Auto-icon.jpg'
import cabEconomyIcon from '@/assets/images/vehicles/Cab-Economy-icon.jpg'
import cabPremiumIcon from '@/assets/images/vehicles/Cab-Premium-icon.jpg'
import docInsuranceImg from '@/assets/images/vehicle-showcase/doc-insurance.png'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DocExpiryTab = 'all' | 'expired' | 'expiring_7d' | 'expiring_30d'
export type ExpiryStatusType = 'expired' | 'expiring_7d' | 'expiring_30d' | 'valid'
export type VehicleType = 'bike' | 'auto' | 'cab_economy' | 'cab_premium'
export type DocCategory = 'insurance' | 'puc' | 'rc' | 'licence' | 'permit' | 'kyc' | 'id_proof' | 'police'

export interface DocumentExpiryRecord {
  id: string
  driverId: string
  driverName: string
  driverCode: string
  mobile: string
  email?: string
  avatarBg: string
  city: string
  documentCategory: DocCategory
  documentType: string
  documentNumber: string
  vehicleType: VehicleType
  vehiclePlate: string
  vehicleMakeModel: string
  vehicleCategoryLabel: string
  vehicleImg: string
  expiryDate: string
  expiryIso: string
  issueDate: string
  uploadedOn: string
  verifiedOn: string
  verifiedBy: string
  issuedBy: string
  status: ExpiryStatusType
  daysLeft: number | null
  verificationStatus: 'verified' | 'pending' | 'rejected'
  notes: string
  previewImg: string
  totalTrips?: number
  ratingAvg?: number
  joinedDate?: string
  drivingExpYears?: number
  walletBalance?: number
  engineNumber?: string
  chassisNumber?: string
  fuelType?: string
  seatsCapacity?: number
}

// ─── Date Formatter Helper ────────────────────────────────────────────────────

const formatDisplayDate = (dStr?: string | null): string => {
  if (!dStr || dStr === '—') return '—'
  if (/^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$/.test(dStr)) return dStr
  const d = new Date(dStr)
  if (isNaN(d.getTime())) return dStr
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

// ─── Document Types & Issuing Authority Mapping ───────────────────────────────

const DOC_TYPE_LABELS: Record<string, string> = {
  licence: 'Driving Licence',
  driving_licence: 'Driving Licence',
  id_proof: 'Aadhaar / ID Proof',
  aadhaar: 'Aadhaar / ID Proof',
  kyc: 'KYC Verification',
  police_verification: 'Police Verification',
  rc: 'Vehicle Registration (RC)',
  insurance: 'Insurance Certificate',
  permit: 'Commercial Permit',
  fitness: 'Fitness Certificate',
  puc: 'PUC Certificate',
}

const getIssuingAuthority = (docType: string): string => {
  const t = (docType || '').toUpperCase()
  if (t.includes('INSURANCE')) return 'Insurance Provider'
  if (t.includes('PUC')) return 'Authorized Emission Testing Center'
  if (t.includes('RC') || t.includes('REGISTRATION')) return 'Regional Transport Office (RTO)'
  if (t.includes('LICENSE') || t.includes('LICENCE')) return 'Licensing Authority (RTO)'
  if (t.includes('FITNESS') || t.includes('PERMIT')) return 'State Transport Authority (STA)'
  if (t.includes('AADHAAR')) return 'UIDAI'
  if (t.includes('PAN')) return 'Income Tax Department'
  if (t.includes('POLICE')) return 'J&K Police Department'
  return 'Transport Department'
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const DocumentControllerPage: React.FC = () => {
  const navigate = useNavigate()
  const toast = useToast()

  // Tab & Filter States
  const [activeTab, setActiveTab] = useState<DocExpiryTab>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDocType, setSelectedDocType] = useState('all')
  const [selectedExpiryStatus, setSelectedExpiryStatus] = useState('all')
  const [selectedVehicleType, setSelectedVehicleType] = useState('all')
  const [selectedCity, setSelectedCity] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Sorting & Pagination
  const [sortBy] = useState<'nearest' | 'furthest' | 'driver' | 'days_left'>('nearest')
  const [pageSize, setPageSize] = useState<number>(5)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [selectedState, setSelectedState] = useState<string>('all')
  const [showColumnMenu, setShowColumnMenu] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState({
    driver: true,
    docType: true,
    vehicle: true,
    expiryDate: true,
    status: true,
    daysLeft: true,
    actions: true,
  })

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Drawer & Inspection
  const [drawerDoc, setDrawerDoc] = useState<DocumentExpiryRecord | null>(null)
  const [drawerTab, setDrawerTab] = useState<'info' | 'vehicle'>('info')

  // Modals
  const [reminderModalDoc, setReminderModalDoc] = useState<DocumentExpiryRecord | null>(null)
  const [isBulkReminder, setIsBulkReminder] = useState(false)
  const [reminderChannels, setReminderChannels] = useState({
    whatsapp: true,
    sms: true,
    push: true,
  })
  const [reminderUrgency, setReminderUrgency] = useState<'normal' | 'high' | 'urgent'>('high')
  const [customReminderMsg, setCustomReminderMsg] = useState('')

  const [reuploadModalDoc, setReuploadModalDoc] = useState<DocumentExpiryRecord | null>(null)
  const [reuploadReason, setReuploadReason] = useState('Document expired')
  const [reuploadNotes, setReuploadNotes] = useState('')

  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null)
  const [previewModalTitle, setPreviewModalTitle] = useState('')

  // Expiry Settings Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [alertThreshold, setAlertThreshold] = useState<number>(30)
  const [notifyByEmail, setNotifyByEmail] = useState(true)
  const [notifyByPush, setNotifyByPush] = useState(true)

  // Header state
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(() => new Date().toLocaleTimeString())

  // Live Backend Data Integration
  const { data: compliancePage, refetch: refetchCompliance } = useDocumentCompliance({ limit: 100 })
  const { data: settingsData } = useDocumentSettings()
  const { mutate: saveSettings, isPending: isSavingSettings } = useUpdateDocumentSettings()
  const { mutate: reviewDoc, isPending: isReviewing } = useReviewDocument()

  React.useEffect(() => {
    if (settingsData) {
      setAlertThreshold(settingsData.alertThresholdDays)
      setNotifyByEmail(settingsData.notifyEmail)
      setNotifyByPush(settingsData.notifyPush)
    }
  }, [settingsData])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetchCompliance()
    setLastUpdated(new Date().toLocaleTimeString())
    setTimeout(() => setIsRefreshing(false), 500)
    toast.info('Refreshed', 'Document records updated.')
  }

  // Transform live backend compliance records into expiry records
  const allRecords = useMemo(() => {
    const liveSummaries = compliancePage?.data ?? []
    if (!liveSummaries.length) return []

    const vImgMap: Record<string, string> = {
      bike: bikeIcon,
      auto: autoIcon,
      cab_economy: cabEconomyIcon,
      cab_premium: cabPremiumIcon,
    }

    const liveItems: DocumentExpiryRecord[] = []
    liveSummaries.forEach((d) => {
      d.documents.forEach((doc) => {
        const formattedExp = formatDisplayDate(doc.expiryDate)
        const normType = (doc.docType || 'id_proof').toLowerCase()
        const docLabel = doc.documentType || DOC_TYPE_LABELS[normType] || normType.replace(/_/g, ' ').toUpperCase()

        // Calculate accurate days left and expiry status
        const hasExpiry = Boolean(doc.expiryDate && doc.expiryDate !== '—')
        let daysLeft: number | null = null
        let status: ExpiryStatusType = 'valid'

        if (hasExpiry) {
          if (doc.daysUntilExpiry !== undefined && doc.daysUntilExpiry !== null) {
            daysLeft = doc.daysUntilExpiry
          } else if (doc.expiryDate) {
            const expMs = new Date(doc.expiryDate).getTime()
            if (!isNaN(expMs)) {
              daysLeft = Math.ceil((expMs - Date.now()) / 86400000)
            }
          }

          if (daysLeft !== null) {
            if (daysLeft < 0) {
              status = 'expired'
            } else if (daysLeft <= 7) {
              status = 'expiring_7d'
            } else if (daysLeft <= 30) {
              status = 'expiring_30d'
            } else {
              status = 'valid'
            }
          }
        } else {
          // Documents without expiry date (e.g., Aadhaar, PAN card, photo, lifetime valid)
          daysLeft = null
          status = 'valid'
        }

        const vehicleTypeCode = (doc.vehicleType || d.vehicleType || 'cab_economy').toLowerCase() as VehicleType
        const vehiclePlate = doc.vehiclePlate || d.vehiclePlate || '—'
        const vehicleMakeModel = doc.vehicleMakeModel || d.vehicleMakeModel || 'Commercial Vehicle'
        const vehicleCategoryLabel = doc.vehicleCategoryLabel || d.vehicleCategoryLabel || 'Cab Economy'

        const dynamicNotes = doc.rejectionReason
          ? doc.rejectionReason
          : status === 'expired'
          ? 'Document expired'
          : daysLeft !== null
          ? `Document expiring in ${daysLeft} days.`
          : 'Document verified / active.'

        liveItems.push({
          id: doc.id,
          driverId: d.driverId,
          driverName: d.driverName,
          driverCode: d.driverCode ?? d.driverId.slice(0, 8),
          mobile: d.mobile,
          email: d.email || undefined,
          avatarBg: 'bg-[#1F2B6D]',
          city: d.city || 'Srinagar',
          documentCategory: (normType as DocCategory) || 'insurance',
          documentType: docLabel,
          documentNumber: doc.documentNumber || doc.id.slice(0, 10).toUpperCase(),
          vehicleType: vehicleTypeCode,
          vehiclePlate,
          vehicleMakeModel,
          vehicleCategoryLabel,
          vehicleImg: vImgMap[vehicleTypeCode] || cabEconomyIcon,
          expiryDate: formattedExp,
          expiryIso: doc.expiryDate || '',
          issueDate: formatDisplayDate(doc.issueDate),
          uploadedOn: doc.uploadDate ? formatDisplayDate(doc.uploadDate) : '—',
          verifiedOn: doc.verifiedAt ? formatDisplayDate(doc.verifiedAt) : '—',
          verifiedBy: doc.verifiedBy || (doc.verificationStatus === 'verified' ? 'Admin Compliance' : '—'),
          issuedBy: getIssuingAuthority(docLabel),
          status,
          daysLeft,
          verificationStatus: doc.verificationStatus,
          notes: dynamicNotes,
          previewImg: doc.fileUrl || docInsuranceImg,
          totalTrips: d.totalTrips ?? 0,
          ratingAvg: d.ratingAvg ?? 5.0,
          joinedDate: d.onboardedOn,
          drivingExpYears: d.drivingExpYears ?? 0,
          walletBalance: d.walletBalance ?? 0,
          fuelType: d.fuelType || '—',
          seatsCapacity: d.seatsCapacity || undefined,
        })
      })
    })

    return liveItems
  }, [compliancePage])

  // Stat Card Metrics - dynamically computed from compliancePage meta or live records
  const statCounts = useMemo(() => {
    if (compliancePage?.meta?.counts) {
      return compliancePage.meta.counts
    }
    const expired = allRecords.filter((r) => r.status === 'expired').length
    const expiring7d = allRecords.filter((r) => r.status === 'expiring_7d').length
    const expiring30d = allRecords.filter((r) => r.status === 'expiring_30d').length
    const valid = allRecords.filter((r) => r.status === 'valid').length
    return {
      expired,
      expiring7d,
      expiring30d,
      valid,
      total: allRecords.length,
    }
  }, [compliancePage, allRecords])

  const statExpiredCount = statCounts.expired
  const statExpiring7dCount = statCounts.expiring7d
  const statExpiring30dCount = statCounts.expiring30d
  const statValidCount = statCounts.valid

  // Tab count indicators
  const tabCounts = useMemo(() => {
    const expired = allRecords.filter((r) => r.status === 'expired').length
    const exp7d = allRecords.filter((r) => r.status === 'expiring_7d').length
    const exp30d = allRecords.filter((r) => r.status === 'expiring_30d').length
    return {
      all: allRecords.length,
      expired,
      exp7d,
      exp30d,
    }
  }, [allRecords])

  // Filtering Logic
  const filteredRecords = useMemo(() => {
    return allRecords.filter((r) => {
      // 1. Tab filter
      if (activeTab === 'expired' && r.status !== 'expired') return false
      if (activeTab === 'expiring_7d' && r.status !== 'expiring_7d') return false
      if (activeTab === 'expiring_30d' && r.status !== 'expiring_30d') return false

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = r.driverName.toLowerCase().includes(q)
        const matchCode = r.driverCode.toLowerCase().includes(q)
        const matchPhone = r.mobile.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
        const matchPlate = r.vehiclePlate.toLowerCase().includes(q)
        const matchModel = r.vehicleMakeModel.toLowerCase().includes(q)
        const matchDocNo = r.documentNumber.toLowerCase().includes(q)
        if (!matchName && !matchCode && !matchPhone && !matchPlate && !matchModel && !matchDocNo) {
          return false
        }
      }

      // 3. Document Type filter
      if (selectedDocType !== 'all') {
        if (r.documentCategory !== selectedDocType) return false
      }

      // 4. Expiry Status filter
      if (selectedExpiryStatus !== 'all') {
        if (r.status !== selectedExpiryStatus) return false
      }

      // 5. Vehicle Type filter
      if (selectedVehicleType !== 'all') {
        if (r.vehicleType !== selectedVehicleType) return false
      }

      // 6. City filter
      if (selectedCity !== 'all') {
        if (r.city.toLowerCase() !== selectedCity.toLowerCase()) return false
      }

      // 7. Date range filter
      if (dateFrom && r.expiryIso < dateFrom) return false
      if (dateTo && r.expiryIso > dateTo) return false

      return true
    })
  }, [
    allRecords,
    activeTab,
    searchQuery,
    selectedDocType,
    selectedExpiryStatus,
    selectedVehicleType,
    selectedCity,
    dateFrom,
    dateTo,
  ])

  // Sorting Logic
  const sortedRecords = useMemo(() => {
    const list = [...filteredRecords]
    list.sort((a, b) => {
      if (sortBy === 'nearest') {
        const aVal = a.daysLeft ?? Infinity
        const bVal = b.daysLeft ?? Infinity
        return aVal - bVal
      }
      if (sortBy === 'furthest') {
        const aVal = a.daysLeft ?? -Infinity
        const bVal = b.daysLeft ?? -Infinity
        return bVal - aVal
      }
      if (sortBy === 'driver') return a.driverName.localeCompare(b.driverName)
      if (sortBy === 'days_left') {
        const aVal = a.daysLeft ?? Infinity
        const bVal = b.daysLeft ?? Infinity
        return aVal - bVal
      }
      return 0
    })
    return list
  }, [filteredRecords, sortBy])

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize))
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedRecords.slice(start, start + pageSize)
  }, [sortedRecords, currentPage, pageSize])

  // Handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids = new Set(paginatedRecords.map((r) => r.id))
      setSelectedIds(ids)
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedDocType('all')
    setSelectedExpiryStatus('all')
    setSelectedVehicleType('all')
    setSelectedCity('all')
    setDateFrom('')
    setDateTo('')
    setActiveTab('all')
    setCurrentPage(1)
    toast.info('Filters Reset', 'All search and filter parameters have been cleared.')
  }

  const handleOpenReminderModal = (doc: DocumentExpiryRecord) => {
    setReminderModalDoc(doc)
    setIsBulkReminder(false)
    setCustomReminderMsg(
      `Dear ${doc.driverName}, your ${doc.documentType} (No: ${doc.documentNumber}) for vehicle ${doc.vehiclePlate} expired on ${doc.expiryDate} / is expiring soon. Please upload your renewed document in the Zaroorat Driver App immediately to maintain active status.`
    )
  }

  const handleOpenBulkReminderModal = () => {
    if (selectedIds.size === 0) {
      toast.warning('No Documents Selected', 'Please check one or more documents from the table to send reminders.')
      return
    }
    setIsBulkReminder(true)
    setReminderModalDoc(null)
    setCustomReminderMsg(
      `Dear Driver Partner, one or more of your compliance documents have expired or are expiring soon. Please open the Zaroorat Driver App to renew and re-upload your documents to avoid account suspension.`
    )
  }

  const handleSendReminder = () => {
    const channels = []
    if (reminderChannels.whatsapp) channels.push('WhatsApp')
    if (reminderChannels.sms) channels.push('SMS')
    if (reminderChannels.push) channels.push('In-App Notification')

    if (channels.length === 0) {
      toast.error('Select Channel', 'Please select at least one notification channel.')
      return
    }

    if (isBulkReminder) {
      toast.success(
        'Bulk Reminders Sent',
        `Successfully dispatched expiry reminders to ${selectedIds.size} driver partners via ${channels.join(' & ')}.`
      )
      setSelectedIds(new Set())
      setIsBulkReminder(false)
    } else if (reminderModalDoc) {
      toast.success(
        'Reminder Sent',
        `Reminder successfully sent to ${reminderModalDoc.driverName} via ${channels.join(', ')}.`
      )
      setReminderModalDoc(null)
    }
  }

  const handleOpenReuploadModal = (doc: DocumentExpiryRecord) => {
    setReuploadModalDoc(doc)
    setReuploadReason('Document expired')
    setReuploadNotes(`Your ${doc.documentType} has expired on ${doc.expiryDate}. Please upload a clear photo of the renewed original certificate.`)
  }

  const handleConfirmReupload = () => {
    if (!reuploadModalDoc) return
    const combinedReason = reuploadNotes?.trim()
      ? `${reuploadReason}: ${reuploadNotes.trim()}`
      : reuploadReason

    reviewDoc(
      {
        documentId: reuploadModalDoc.id,
        status: 'REJECTED',
        rejectionReason: combinedReason,
      },
      {
        onSuccess: () => {
          toast.success(
            'Re-upload Requested',
            `Re-upload request sent to ${reuploadModalDoc.driverName}. Document status marked as rejected/correction required.`
          )
          setReuploadModalDoc(null)
          refetchCompliance()
        },
        onError: (err: any) => {
          toast.error(
            'Failed to Request Re-upload',
            err?.message || 'Could not update document status on server.'
          )
        },
      }
    )
  }

  const handleVerifyDirectly = (doc: DocumentExpiryRecord) => {
    reviewDoc(
      {
        documentId: doc.id,
        status: 'VERIFIED',
      },
      {
        onSuccess: () => {
          toast.success(
            'Document Verified',
            `${doc.documentType} for ${doc.driverName} verified successfully.`
          )
          if (drawerDoc?.id === doc.id) {
            setDrawerDoc((prev) => (prev ? { ...prev, verificationStatus: 'verified' } : null))
          }
          refetchCompliance()
        },
        onError: (err: any) => {
          toast.error('Verification Failed', err?.message || 'Could not verify document.')
        },
      }
    )
  }

  const handleExportCSV = () => {
    const listToExport = selectedIds.size > 0
      ? allRecords.filter((r) => selectedIds.has(r.id))
      : sortedRecords

    const headers = [
      'Driver ID',
      'Driver Name',
      'Mobile',
      'City',
      'Document Type',
      'Document Number',
      'Vehicle Plate',
      'Vehicle Make & Model',
      'Vehicle Category',
      'Expiry Date',
      'Days Left',
      'Status',
      'Issued By',
      'Uploaded On',
    ]

    const rows = listToExport.map((r) => [
      r.driverCode,
      r.driverName,
      r.mobile,
      r.city,
      r.documentType,
      r.documentNumber,
      r.vehiclePlate,
      r.vehicleMakeModel,
      r.vehicleCategoryLabel,
      r.expiryDate,
      r.daysLeft !== null ? r.daysLeft : 'No expiry',
      r.status,
      r.issuedBy,
      r.uploadedOn,
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `document_expiry_report_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success('Export Complete', `Exported ${listToExport.length} documents to CSV.`)
  }

  const handleSaveSettings = () => {
    saveSettings({
      alertThresholdDays: alertThreshold,
      notifyEmail: notifyByEmail,
      notifyPush: notifyByPush,
    })
    setIsSettingsOpen(false)
    toast.success('Settings Saved', 'Expiry alert threshold and notification channels updated.')
  }

  // ─── Document Meta Helper ───────────────────────────────────────────────────

  const getDocIcon = (category: DocCategory) => {
    switch (category) {
      case 'insurance':
        return <Shield className="w-4 h-4 text-teal-600 dark:text-teal-400" />
      case 'puc':
        return <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
      case 'rc':
        return <Car className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
      case 'licence':
        return <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      case 'permit':
        return <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
      case 'id_proof':
      case 'kyc':
        return <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
      default:
        return <FileText className="w-4 h-4 text-slate-500" />
    }
  }

  return (
    <PageWrapper className="space-y-4 pt-1 pb-6 px-3 sm:px-5">
      {/* ═════════════════════════════════════════════════════════════════════════
          1. HEADER WITH GEOGRAPHIC DASHBOARD & OVERVIEW STYLING
      ═════════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate('/driver-management/drivers')}
            className="mt-1 h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-2xs cursor-pointer"
            title="Back to Driver Management"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F2B6D] dark:text-white">
                Document Expiry
              </h1>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                title="Configure Expiry Alert Window"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Monitor driver and vehicle documents, track upcoming expiries, and take action.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
            Last updated {lastUpdated}
          </span>
          <button
            type="button"
            onClick={handleRefresh}
            title="Refresh data"
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#1F2B6D]' : ''}`} />
          </button>

          <CardTableButton
            variant="outline"
            onClick={handleExportCSV}
            className="gap-1.5 text-xs h-9 px-3.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
            <span>Export</span>
          </CardTableButton>

          <CardTableButton
            variant="primary"
            onClick={handleOpenBulkReminderModal}
            className="gap-1.5 text-xs h-9 px-4"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Send Reminder</span>
          </CardTableButton>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════
          2. TOP 4 METRIC KPI CARDS (Matching Overview Page Architecture)
      ═════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Expired Documents */}
        <div
          onClick={() => setActiveTab('expired')}
          className={`bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm relative overflow-hidden flex flex-col justify-between transition-all cursor-pointer ${
            activeTab === 'expired'
              ? 'border-rose-400 dark:border-rose-600 ring-2 ring-rose-500/20'
              : 'border-slate-200/90 dark:border-slate-800 hover:border-rose-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-rose-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <FileWarning className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {statExpiredCount}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Expired Documents
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1 font-semibold text-rose-600">
              <AlertCircle className="w-3.5 h-3.5" />
              {statExpiredCount > 0 ? `${statExpiredCount} non-compliant` : 'All clear'}
            </span>
            <span className="text-[11px] text-slate-400">Immediate action required</span>
          </div>
        </div>

        {/* Card 2: Expiring in 7 Days */}
        <div
          onClick={() => setActiveTab('expiring_7d')}
          className={`bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm relative overflow-hidden flex flex-col justify-between transition-all cursor-pointer ${
            activeTab === 'expiring_7d'
              ? 'border-amber-400 dark:border-amber-600 ring-2 ring-amber-500/20'
              : 'border-slate-200/90 dark:border-slate-800 hover:border-amber-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-amber-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {statExpiring7dCount}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Expiring in 7 Days
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1 font-semibold text-amber-600">
              <Clock className="w-3.5 h-3.5" />
              {statExpiring7dCount > 0 ? `${statExpiring7dCount} within 7 days` : 'None in 7 days'}
            </span>
            <span className="text-[11px] text-slate-400">Send urgent reminders</span>
          </div>
        </div>

        {/* Card 3: Expiring in 30 Days */}
        <div
          onClick={() => setActiveTab('expiring_30d')}
          className={`bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm relative overflow-hidden flex flex-col justify-between transition-all cursor-pointer ${
            activeTab === 'expiring_30d'
              ? 'border-yellow-400 dark:border-yellow-600 ring-2 ring-yellow-500/20'
              : 'border-slate-200/90 dark:border-slate-800 hover:border-yellow-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-yellow-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {statExpiring30dCount}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Expiring in 30 Days
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1 font-semibold text-yellow-600">
              <Calendar className="w-3.5 h-3.5" />
              {statExpiring30dCount > 0 ? `${statExpiring30dCount} within 30 days` : 'None in 30 days'}
            </span>
            <span className="text-[11px] text-slate-400">Upcoming renewals</span>
          </div>
        </div>

        {/* Card 4: Valid Documents */}
        <div
          onClick={() => setActiveTab('all')}
          className={`bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm relative overflow-hidden flex flex-col justify-between transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'border-blue-400 dark:border-blue-600 ring-2 ring-blue-500/20'
              : 'border-slate-200/90 dark:border-slate-800 hover:border-blue-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {statValidCount}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Valid Documents
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1 font-semibold text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {allRecords.length > 0 ? `${Math.round((statValidCount / allRecords.length) * 100)}% compliance` : '100% compliant'}
            </span>
            <span className="text-[11px] text-slate-400">Fully compliant fleet</span>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════
          3. MULTI-PARAMETER FILTER BAR (Single Clean Row from Screenshot)
      ═════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Document Type Dropdown */}
          <div className="flex-1 min-w-[160px]">
            <select
              value={selectedDocType}
              onChange={(e) => {
                setSelectedDocType(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1F2B6D] cursor-pointer"
            >
              <option value="all">All Document Types</option>
              <option value="insurance">Insurance Certificate</option>
              <option value="puc">PUC Certificate</option>
              <option value="rc">Vehicle Registration (RC)</option>
              <option value="licence">Driving Licence</option>
              <option value="permit">Commercial Permit</option>
            </select>
          </div>

          {/* Expiry Status Dropdown */}
          <div className="flex-1 min-w-[150px]">
            <select
              value={selectedExpiryStatus}
              onChange={(e) => {
                setSelectedExpiryStatus(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1F2B6D] cursor-pointer"
            >
              <option value="all">All Expiry Statuses</option>
              <option value="expired">Expired</option>
              <option value="expiring_7d">Expiring in 7 Days</option>
              <option value="expiring_30d">Expiring in 30 Days</option>
              <option value="valid">Valid Documents</option>
            </select>
          </div>

          {/* Vehicle Type Dropdown */}
          <div className="flex-1 min-w-[140px]">
            <select
              value={selectedVehicleType}
              onChange={(e) => {
                setSelectedVehicleType(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1F2B6D] cursor-pointer"
            >
              <option value="all">All Vehicle Types</option>
              <option value="bike">Bike</option>
              <option value="auto">Auto Rickshaw</option>
              <option value="cab_economy">Cab Economy</option>
              <option value="cab_premium">Cab Premium</option>
            </select>
          </div>

          {/* City / Location Dropdown */}
          <div className="flex-1 min-w-[130px]">
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1F2B6D] cursor-pointer"
            >
              <option value="all">All Locations</option>
              <option value="Srinagar">Srinagar</option>
              <option value="Jammu">Jammu</option>
              <option value="Anantnag">Anantnag</option>
              <option value="Baramulla">Baramulla</option>
              <option value="Budgam">Budgam</option>
            </select>
          </div>

          {/* Date Range Picker (From & To) */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value)
                setCurrentPage(1)
              }}
              title="Expiry Date From"
              className="h-9 px-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-[#1F2B6D] cursor-pointer"
            />
            <span className="text-slate-400 text-xs font-semibold">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value)
                setCurrentPage(1)
              }}
              title="Expiry Date To"
              className="h-9 px-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-[#1F2B6D] cursor-pointer"
            />
          </div>

          {/* Action Buttons: Reset & Apply */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="h-9 px-3 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              className="h-9 px-4 rounded-lg bg-[#1F2B6D] hover:bg-[#18225e] text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Apply</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════
          4. MAIN TABLE CARD (Matching Screenshot with Navy Header & Flawless Alignment)
      ═════════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
        {/* Table Top Toolbar (Tabs on Left, Search + Controls on Right with No Squishing) */}
        <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
          {/* Left: Tab Selection Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { key: 'all', label: `All (${tabCounts.all})` },
              { key: 'expired', label: `Expired (${tabCounts.expired})`, isAlert: true },
              { key: 'expiring_7d', label: `Expiring in 7 Days (${tabCounts.exp7d})`, isWarn: true },
              { key: 'expiring_30d', label: `Expiring in 30 Days (${tabCounts.exp30d})` },
            ].map((tab) => {
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.key as DocExpiryTab)
                    setCurrentPage(1)
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#1F2B6D] text-white shadow-2xs'
                      : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                >
                  {tab.isAlert && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />}
                  {tab.isWarn && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />}
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Right: Search + Action Tools (Never Squished) */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input (Generous width, crisp padding) */}
            <div className="relative w-56 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Search by driver name, phone..."
                className="w-full h-8.5 pl-8 pr-7 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1F2B6D]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Send Reminder Button */}
            <button
              onClick={handleOpenBulkReminderModal}
              disabled={selectedIds.size === 0}
              className="h-8.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition shadow-2xs"
            >
              <Bell className="w-3.5 h-3.5 text-slate-400" />
              <span>Send Reminder{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}</span>
            </button>

            {/* Status Filter Dropdown Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="h-8.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition shadow-2xs"
              >
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Status</span>
              </button>
              {showStatusMenu && (
                <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl z-30 py-1 text-xs">
                  {[
                    { key: 'all', label: 'All Statuses' },
                    { key: 'valid', label: 'Valid Documents' },
                    { key: 'expired', label: 'Expired' },
                    { key: 'expiring_7d', label: 'Expiring in 7 Days' },
                    { key: 'expiring_30d', label: 'Expiring in 30 Days' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => {
                        setSelectedExpiryStatus(item.key)
                        setShowStatusMenu(false)
                        setCurrentPage(1)
                      }}
                      className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                    >
                      <span>{item.label}</span>
                      {selectedExpiryStatus === item.key && <Check className="w-3.5 h-3.5 text-[#1F2B6D]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Columns Toggle Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className="h-8.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition shadow-2xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <span>Columns</span>
              </button>
              {showColumnMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl z-30 py-1.5 text-xs">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    Visible Columns
                  </div>
                  {Object.entries({
                    driver: 'Driver',
                    docType: 'Document Type',
                    vehicle: 'Vehicle Details',
                    expiryDate: 'Expiry Date',
                    status: 'Status',
                    daysLeft: 'Days Left',
                    actions: 'Actions',
                  }).map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center justify-between px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <span className="text-slate-700 dark:text-slate-300">{label}</span>
                      <input
                        type="checkbox"
                        checked={visibleColumns[key as keyof typeof visibleColumns] !== false}
                        onChange={() =>
                          setVisibleColumns((prev) => ({
                            ...prev,
                            [key]: !prev[key as keyof typeof visibleColumns],
                          }))
                        }
                        className="rounded border-slate-300 text-[#1F2B6D] focus:ring-[#1F2B6D]"
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Inline Date Range Picker */}
            <div className="flex items-center gap-1 text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-2 h-8.5 bg-slate-50 dark:bg-slate-950 whitespace-nowrap">
              <span className="text-slate-400 text-[11px] font-semibold">From:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  setCurrentPage(1)
                }}
                className="bg-transparent border-none text-xs outline-none w-24 text-slate-700 dark:text-slate-300"
              />
              <span className="text-slate-400 text-[11px] font-semibold">To:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setCurrentPage(1)
                }}
                className="bg-transparent border-none text-xs outline-none w-24 text-slate-700 dark:text-slate-300"
              />
            </div>

            {/* All States Dropdown */}
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value)
                setCurrentPage(1)
              }}
              className="h-8.5 px-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All States</option>
              <option value="active">Active State</option>
              <option value="suspended">Suspended State</option>
              <option value="blocked">Blocked State</option>
            </select>
          </div>
        </div>

        {/* Bulk Selection Notification Bar */}
        {selectedIds.size > 0 && (
          <div className="bg-indigo-50/90 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/50 px-5 py-2.5 flex items-center justify-between text-xs animate-fadeIn">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-semibold">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <span>{selectedIds.size} documents selected</span>
            </div>
            <div className="flex items-center gap-2">
              <CardTableButton
                variant="primary"
                onClick={handleOpenBulkReminderModal}
                className="h-7 px-3 text-xs gap-1"
              >
                <Send className="w-3 h-3" /> Send Reminder to Selected
              </CardTableButton>
              <CardTableButton
                variant="outline"
                onClick={handleExportCSV}
                className="h-7 px-3 border-indigo-200 dark:border-indigo-800 text-xs font-semibold"
              >
                Export Selected
              </CardTableButton>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-indigo-600 dark:text-indigo-400 hover:underline text-xs font-semibold px-2 cursor-pointer"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Table Section with Dark Navy Header & Crisp Vertical Dividers */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs align-middle border-collapse">
            <thead className="bg-[#1F2B6D] text-white">
              <tr>
                <th className="w-12 text-center py-3.5 px-3 border-r border-white/20">
                  <input
                    type="checkbox"
                    checked={
                      paginatedRecords.length > 0 &&
                      paginatedRecords.every((r) => selectedIds.has(r.id))
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-white/40 accent-[#1F2B6D] cursor-pointer"
                  />
                </th>
                {visibleColumns.driver && (
                  <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider text-left border-r border-white/20 whitespace-nowrap">
                    DRIVER
                  </th>
                )}
                {visibleColumns.docType && (
                  <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider text-left border-r border-white/20 whitespace-nowrap">
                    DOCUMENT TYPE
                  </th>
                )}
                {visibleColumns.vehicle && (
                  <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider text-left border-r border-white/20 whitespace-nowrap">
                    VEHICLE DETAILS
                  </th>
                )}
                {visibleColumns.expiryDate && (
                  <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider text-left border-r border-white/20 whitespace-nowrap">
                    EXPIRY DATE
                  </th>
                )}
                {visibleColumns.status && (
                  <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider text-center border-r border-white/20 whitespace-nowrap">
                    STATUS
                  </th>
                )}
                {visibleColumns.daysLeft && (
                  <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider text-center border-r border-white/20 whitespace-nowrap">
                    DAYS LEFT
                  </th>
                )}
                {visibleColumns.actions && (
                  <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider text-center whitespace-nowrap">
                    ACTIONS
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p className="font-semibold text-xs text-slate-600 dark:text-slate-300">
                        No matching documents found
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Try adjusting your search criteria or reset filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((item) => {
                  const isSelected = selectedIds.has(item.id)
                  const isExpired = item.status === 'expired'
                  const isExp7d = item.status === 'expiring_7d'
                  const isExp30d = item.status === 'expiring_30d'

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="w-12 text-center py-3.5 px-3 border-r border-slate-200 dark:border-slate-800">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.id)}
                          className="rounded border-slate-300 text-[#1F2B6D] focus:ring-[#1F2B6D] cursor-pointer"
                        />
                      </td>

                      {/* Driver */}
                      {visibleColumns.driver && (
                        <td className="py-3.5 px-4 border-r border-slate-200 dark:border-slate-800">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs shrink-0 text-[#1F2B6D] dark:text-blue-300 shadow-2xs">
                              {item.driverName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col text-left min-w-0 leading-tight">
                              <p
                                onClick={() => {
                                  setDrawerDoc(item)
                                  setDrawerTab('info')
                                }}
                                className="font-bold text-xs text-slate-900 dark:text-white hover:text-[#1F2B6D] transition-colors truncate cursor-pointer"
                              >
                                {item.driverName}
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-tight uppercase truncate mt-0.5">
                                {item.driverCode}
                              </p>
                              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                {item.mobile}
                              </p>
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Document Type */}
                      {visibleColumns.docType && (
                        <td className="py-3.5 px-4 border-r border-slate-200 dark:border-slate-800">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700/80 text-blue-600">
                              {getDocIcon(item.documentCategory)}
                            </div>
                            <div className="flex flex-col text-left min-w-0 leading-tight">
                              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase truncate">
                                {item.documentType}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono tracking-tight truncate mt-0.5">
                                {item.documentNumber}
                              </span>
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Vehicle Details */}
                      {visibleColumns.vehicle && (
                        <td className="py-3.5 px-4 border-r border-slate-200 dark:border-slate-800">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-7 rounded bg-slate-50 dark:bg-slate-800 p-0.5 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                              <img
                                src={item.vehicleImg}
                                alt=""
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                            <div className="flex flex-col text-left min-w-0 leading-tight">
                              <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wide truncate">
                                {item.vehiclePlate}
                              </span>
                              <span className="text-[10.5px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                                {item.vehicleMakeModel}
                              </span>
                              <span className="text-[9.5px] text-slate-400 capitalize">
                                {item.vehicleCategoryLabel}
                              </span>
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Expiry Date */}
                      {visibleColumns.expiryDate && (
                        <td className="py-3.5 px-4 border-r border-slate-200 dark:border-slate-800 font-mono font-semibold text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {item.expiryDate}
                        </td>
                      )}

                      {/* Status */}
                      {visibleColumns.status && (
                        <td className="py-3.5 px-4 border-r border-slate-200 dark:border-slate-800 text-center">
                          {isExpired ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse shrink-0" />
                              Expired
                            </span>
                          ) : isExp7d || isExp30d ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                              Expiring Soon
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              Valid
                            </span>
                          )}
                        </td>
                      )}

                      {/* Days Left */}
                      {visibleColumns.daysLeft && (
                        <td className="py-3.5 px-4 border-r border-slate-200 dark:border-slate-800 text-center">
                          {item.daysLeft === null ? (
                            <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400">
                              No expiry
                            </span>
                          ) : isExpired ? (
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold font-mono bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                              {item.daysLeft} days
                            </span>
                          ) : item.daysLeft <= 7 ? (
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold font-mono bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                              {item.daysLeft} days
                            </span>
                          ) : item.daysLeft <= 30 ? (
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold font-mono bg-yellow-50 text-yellow-800 border border-yellow-300 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800">
                              {item.daysLeft} days
                            </span>
                          ) : (
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                              {item.daysLeft} days
                            </span>
                          )}
                        </td>
                      )}

                      {/* Actions */}
                      {visibleColumns.actions && (
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => {
                                setDrawerDoc(item)
                                setDrawerTab('info')
                              }}
                              className="px-3.5 py-1 text-xs font-semibold rounded-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                            >
                              View
                            </button>
                            <ActionDropdown
                              actions={[
                                {
                                  label: 'View Document Info',
                                  icon: <Eye className="w-3.5 h-3.5" />,
                                  onClick: () => {
                                    setDrawerDoc(item)
                                    setDrawerTab('info')
                                  },
                                },
                                ...(item.verificationStatus !== 'verified'
                                  ? [
                                      {
                                        label: 'Approve / Verify',
                                        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
                                        onClick: () => handleVerifyDirectly(item),
                                      },
                                    ]
                                  : []),
                                {
                                  label: 'Send Reminder',
                                  icon: <Bell className="w-3.5 h-3.5" />,
                                  onClick: () => handleOpenReminderModal(item),
                                },
                                {
                                  label: 'Request Re-upload',
                                  icon: <RotateCcw className="w-3.5 h-3.5" />,
                                  onClick: () => handleOpenReuploadModal(item),
                                },
                                {
                                  label: 'View Driver Profile',
                                  icon: <ExternalLink className="w-3.5 h-3.5" />,
                                  onClick: () => navigate(`/driver-management/drivers/${item.driverId}`),
                                },
                              ]}
                            />
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-600 dark:text-slate-400 gap-3 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span>Rows per page</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="h-7 px-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>
            <span>
              Showing {sortedRecords.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, sortedRecords.length)} of {sortedRecords.length} documents
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-7 w-7 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1]
                const showEllipsis = prev && p - prev > 1
                return (
                  <React.Fragment key={p}>
                    {showEllipsis && <span className="px-1 text-slate-400">…</span>}
                    <button
                      onClick={() => setCurrentPage(p)}
                      className={`h-7 w-7 rounded-md text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                        currentPage === p
                          ? 'bg-[#1F2B6D] text-white shadow-2xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                )
              })}
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 w-7 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════
          5. CUSTOM POPUP (CENTERED MODAL): DOCUMENT DETAILS
      ═════════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={!!drawerDoc}
        onClose={() => setDrawerDoc(null)}
        title="Document Details"
        size="xl"
        footer={
          drawerDoc ? (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => handleOpenReuploadModal(drawerDoc)}
                className="h-9 px-4 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Request Re-upload</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDrawerDoc(null)}
                  className="h-9 px-4 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Close
                </button>
                {drawerDoc.verificationStatus !== 'verified' && (
                  <button
                    type="button"
                    disabled={isReviewing}
                    onClick={() => handleVerifyDirectly(drawerDoc)}
                    className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verify Document</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleOpenReminderModal(drawerDoc)}
                  className="h-9 px-4 rounded-lg bg-[#1F2B6D] hover:bg-[#18225e] text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Send Reminder to Driver</span>
                </button>
              </div>
            </div>
          ) : undefined
        }
      >
        {drawerDoc && (
          <div className="space-y-4 text-left text-xs py-1">
            {/* Driver Profile Header Card */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#1F2B6D] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                  {drawerDoc.driverName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {drawerDoc.driverName}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-bold">
                      {drawerDoc.driverCode}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 dark:text-slate-400 text-[11px] font-mono mt-0.5">
                    <a
                      href={`tel:${drawerDoc.mobile}`}
                      className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 hover:text-[#1F2B6D]"
                    >
                      <Phone className="w-3 h-3 text-slate-400" /> {drawerDoc.mobile}
                    </a>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" /> {drawerDoc.city}, J&K
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => navigate(`/driver-management/drivers/${drawerDoc.driverId}`)}
                  className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition cursor-pointer"
                  title="View full profile"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Profile</span>
                </button>
              </div>
            </div>

            {/* Sub-tabs: Document Info vs Driver & Vehicle */}
            <div className="flex border-b border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDrawerTab('info')}
                className={`pb-2 px-4 text-xs font-bold transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
                  drawerTab === 'info'
                    ? 'border-[#1F2B6D] text-[#1F2B6D] dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Document Info</span>
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('vehicle')}
                className={`pb-2 px-4 text-xs font-bold transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
                  drawerTab === 'vehicle'
                    ? 'border-[#1F2B6D] text-[#1F2B6D] dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Driver &amp; Vehicle</span>
              </button>
            </div>

            {/* Sub-tab 1: Document Info */}
            {drawerTab === 'info' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column: Details Grid */}
                <div className="space-y-3">
                  {/* Summary Pill Banner */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-blue-600">
                        {getDocIcon(drawerDoc.documentCategory)}
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900 dark:text-white text-xs">
                          {drawerDoc.documentType}
                        </h5>
                        <p className="text-[10px] text-slate-500 font-mono">
                          No: {drawerDoc.documentNumber}
                        </p>
                      </div>
                    </div>

                    <div>
                      {drawerDoc.status === 'expired' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                          Expired
                        </span>
                      ) : drawerDoc.daysLeft !== null && drawerDoc.daysLeft <= 30 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Expiring Soon
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Valid
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 2-Column Info Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Expiry Date
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5 block">
                        {drawerDoc.expiryDate}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Days Left
                      </span>
                      <span className={`font-mono font-bold mt-0.5 block ${
                        drawerDoc.daysLeft === null
                          ? 'text-slate-500'
                          : drawerDoc.daysLeft < 0
                          ? 'text-rose-600'
                          : drawerDoc.daysLeft <= 30
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}>
                        {drawerDoc.daysLeft === null
                          ? 'No expiry'
                          : drawerDoc.daysLeft < 0
                          ? `${drawerDoc.daysLeft} days (Overdue)`
                          : `${drawerDoc.daysLeft} days remaining`}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Verification Status
                      </span>
                      {drawerDoc.verificationStatus === 'verified' ? (
                        <span className="font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : drawerDoc.verificationStatus === 'rejected' ? (
                        <span className="font-bold text-rose-600 flex items-center gap-1 mt-0.5">
                          <AlertCircle className="w-3.5 h-3.5" /> Rejected
                        </span>
                      ) : (
                        <span className="font-bold text-amber-600 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5" /> Pending Review
                        </span>
                      )}
                    </div>

                    <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Issued By
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
                        {drawerDoc.issuedBy}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Uploaded On
                      </span>
                      <span className="font-mono text-slate-700 dark:text-slate-300 mt-0.5 block text-[11px]">
                        {drawerDoc.uploadedOn}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Verified On
                      </span>
                      <span className="font-mono text-slate-700 dark:text-slate-300 mt-0.5 block text-[11px]">
                        {drawerDoc.verifiedOn}
                      </span>
                    </div>
                  </div>

                  {/* Review Notes */}
                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Compliance Officer Notes
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 text-xs">
                      {drawerDoc.notes}
                    </p>
                    <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                      Verified By: {drawerDoc.verifiedBy}
                    </p>
                  </div>
                </div>

                {/* Right Column: Document Certificate Preview Card with Watermark */}
                <div className="space-y-2 flex flex-col">
                  <div className="flex items-center justify-between">
                    <h6 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                      Certificate Preview
                    </h6>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewModalImg(drawerDoc.previewImg)
                        setPreviewModalTitle(`${drawerDoc.documentType} — ${drawerDoc.driverName}`)
                      }}
                      className="text-[#1F2B6D] dark:text-blue-400 hover:underline text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" /> Full Zoom Preview
                    </button>
                  </div>

                  <div
                    onClick={() => {
                      setPreviewModalImg(drawerDoc.previewImg)
                      setPreviewModalTitle(`${drawerDoc.documentType} — ${drawerDoc.driverName}`)
                    }}
                    className="relative flex-1 min-h-[220px] w-full rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer group shadow-2xs"
                  >
                    <img
                      src={drawerDoc.previewImg}
                      alt={drawerDoc.documentType}
                      className="w-full h-full object-contain p-2 group-hover:scale-102 transition-transform duration-300"
                    />

                    {/* Expired Watermark Stamp */}
                    {drawerDoc.status === 'expired' && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="transform -rotate-12 border-4 border-rose-600/80 bg-rose-600/10 px-8 py-2 rounded-xl text-rose-600 font-black text-2xl tracking-widest uppercase shadow-lg backdrop-blur-[1px]">
                          EXPIRED
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <span className="px-3 py-1.5 rounded-lg bg-white/95 text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-md">
                        <Eye className="w-3.5 h-3.5 text-[#1F2B6D]" /> Inspect Certificate
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Sub-tab 2: Driver & Vehicle Details */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vehicle Details Card */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <img
                      src={drawerDoc.vehicleImg}
                      alt={drawerDoc.vehicleMakeModel}
                      className="w-14 h-11 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <div>
                      <h5 className="font-bold text-slate-900 dark:text-white text-xs">
                        {drawerDoc.vehicleMakeModel}
                      </h5>
                      <span className="font-mono text-xs font-bold text-[#1F2B6D] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded mt-0.5 inline-block">
                        {drawerDoc.vehiclePlate}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Vehicle Type</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{drawerDoc.vehicleCategoryLabel}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Fuel Type</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{drawerDoc.fuelType || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Seats Capacity</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {drawerDoc.seatsCapacity ? `${drawerDoc.seatsCapacity} Seats` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Engine Number</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{drawerDoc.engineNumber || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Driver Partner Profile Card */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
                  <h6 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                    Partner Statistics
                  </h6>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Trips</span>
                      <span className="font-bold text-slate-900 dark:text-white">{drawerDoc.totalTrips ?? 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Driver Rating</span>
                      <span className="font-bold text-amber-600">
                        ★ {drawerDoc.ratingAvg ? Number(drawerDoc.ratingAvg).toFixed(1) : '5.0'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Driving Experience</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {drawerDoc.drivingExpYears ? `${drawerDoc.drivingExpYears} Years` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Wallet Balance</span>
                      <span className="font-bold text-emerald-600">
                        ₹{(drawerDoc.walletBalance ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ═════════════════════════════════════════════════════════════════════════
          6. SEND REMINDER MODAL
      ═════════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={!!reminderModalDoc || isBulkReminder}
        onClose={() => {
          setReminderModalDoc(null)
          setIsBulkReminder(false)
        }}
        title="Send Expiry Reminder"
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <CardTableButton
              variant="outline"
              onClick={() => {
                setReminderModalDoc(null)
                setIsBulkReminder(false)
              }}
              className="h-8"
            >
              Cancel
            </CardTableButton>
            <CardTableButton
              variant="primary"
              onClick={handleSendReminder}
              className="h-8 px-4 gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Reminder</span>
            </CardTableButton>
          </div>
        }
      >
        <div className="space-y-4 text-left text-xs py-1">
          {/* Target Summary */}
          {reminderModalDoc ? (
            <div className="p-3 rounded-lg bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
              <p className="font-bold text-[#1F2B6D] dark:text-blue-300 text-xs">
                Recipient: {reminderModalDoc.driverName} ({reminderModalDoc.driverCode})
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Target: {reminderModalDoc.documentType} · Vehicle: {reminderModalDoc.vehiclePlate} · Expiry: {reminderModalDoc.expiryDate}
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
              <p className="font-bold text-[#1F2B6D] dark:text-blue-300 text-xs">
                Bulk Dispatch to {selectedIds.size} Drivers
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Notifications will be sent simultaneously across all selected channels.
              </p>
            </div>
          )}

          {/* Channel Checkboxes */}
          <div className="space-y-2">
            <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block">
              Notification Channels
            </span>
            <div className="grid grid-cols-1 gap-2">
              <label className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminderChannels.whatsapp}
                  onChange={(e) => setReminderChannels((prev) => ({ ...prev, whatsapp: e.target.checked }))}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-slate-800 dark:text-slate-200">WhatsApp Notification</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminderChannels.sms}
                  onChange={(e) => setReminderChannels((prev) => ({ ...prev, sms: e.target.checked }))}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <Phone className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-slate-800 dark:text-slate-200">SMS Direct Message</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminderChannels.push}
                  onChange={(e) => setReminderChannels((prev) => ({ ...prev, push: e.target.checked }))}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <Bell className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-slate-800 dark:text-slate-200">Driver App Push Banner</span>
              </label>
            </div>
          </div>

          {/* Urgency Selector */}
          <div className="space-y-1.5">
            <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block">
              Urgency Level
            </span>
            <div className="flex items-center gap-2">
              {(['normal', 'high', 'urgent'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setReminderUrgency(level)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition cursor-pointer ${
                    reminderUrgency === level
                      ? level === 'urgent'
                        ? 'bg-rose-50 border-rose-300 text-rose-700'
                        : level === 'high'
                        ? 'bg-amber-50 border-amber-300 text-amber-700'
                        : 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Message Textarea */}
          <div className="space-y-1.5">
            <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block">
              Custom Message Template
            </span>
            <textarea
              rows={4}
              value={customReminderMsg}
              onChange={(e) => setCustomReminderMsg(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-[#1F2B6D]"
            />
          </div>
        </div>
      </Modal>

      {/* ═════════════════════════════════════════════════════════════════════════
          7. REQUEST RE-UPLOAD MODAL
      ═════════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={!!reuploadModalDoc}
        onClose={() => setReuploadModalDoc(null)}
        title="Request Document Re-upload"
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <CardTableButton
              variant="outline"
              onClick={() => setReuploadModalDoc(null)}
              className="h-8"
            >
              Cancel
            </CardTableButton>
            <CardTableButton
              variant="primary"
              disabled={isReviewing}
              onClick={handleConfirmReupload}
              className="h-8 px-4 bg-rose-600 hover:bg-rose-700 text-white gap-1.5 disabled:opacity-50"
            >
              {isReviewing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Send Re-upload Request</span>
                </>
              )}
            </CardTableButton>
          </div>
        }
      >
        {reuploadModalDoc && (
          <div className="space-y-4 text-left text-xs py-1">
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50">
              <p className="font-bold text-rose-800 dark:text-rose-200 text-xs">
                {reuploadModalDoc.documentType}
              </p>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                Driver: {reuploadModalDoc.driverName} · Vehicle: {reuploadModalDoc.vehiclePlate}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Select Rejection / Re-upload Reason
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Document expired',
                  'Blurry / unreadable photo',
                  'Wrong document type uploaded',
                  'Document corners cut off',
                  'Name does not match record',
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => {
                      setReuploadReason(reason)
                      setReuploadNotes(`Your document was rejected: ${reason}. Please upload a clear photo of the original document.`)
                    }}
                    className={`px-2.5 py-1 rounded-md text-[10.5px] border font-medium transition cursor-pointer ${
                      reuploadReason === reason
                        ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold dark:bg-rose-950/60'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Detailed Instructions for Driver
              </label>
              <textarea
                rows={3}
                value={reuploadNotes}
                onChange={(e) => setReuploadNotes(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* ═════════════════════════════════════════════════════════════════════════
          8. EXPIRATION ALERT CONFIG MODAL
      ═════════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Expiry Alert Threshold Configuration"
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <CardTableButton
              variant="outline"
              onClick={() => setIsSettingsOpen(false)}
              className="h-8"
            >
              Cancel
            </CardTableButton>
            <CardTableButton
              variant="primary"
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className="h-8 px-4 gap-1.5"
            >
              {isSavingSettings ? 'Saving…' : 'Save Configuration'}
            </CardTableButton>
          </div>
        }
      >
        <div className="space-y-4 text-left text-xs py-1">
          <p className="text-slate-600 dark:text-slate-400">
            Drivers with documents expiring within this threshold window will be flagged as &apos;Expiring Soon&apos; in all compliance lists and daily audit jobs.
          </p>

          <div className="space-y-1.5">
            <label className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block">
              Warning Window (Days)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={90}
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-28 p-2 text-sm font-bold border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-[#1F2B6D]"
              />
              <span className="text-slate-500 font-medium">days before expiration date</span>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-2.5">
            <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block">
              Automatic Notification Channels
            </span>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyByEmail}
                onChange={(e) => setNotifyByEmail(e.target.checked)}
                className="rounded border-slate-300 text-[#1F2B6D] focus:ring-[#1F2B6D]"
              />
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                Email notification to compliance team upon warning trigger
              </span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyByPush}
                onChange={(e) => setNotifyByPush(e.target.checked)}
                className="rounded border-slate-300 text-[#1F2B6D] focus:ring-[#1F2B6D]"
              />
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                Automated in-app reminder push to driver partner
              </span>
            </label>
          </div>
        </div>
      </Modal>

      {/* ═════════════════════════════════════════════════════════════════════════
          9. FULL DOCUMENT ZOOM & INSPECTION MODAL
      ═════════════════════════════════════════════════════════════════════════ */}
      <ImagePreviewModal
        isOpen={!!previewModalImg}
        onClose={() => {
          setPreviewModalImg(null)
          setPreviewModalTitle('')
        }}
        imageUrl={previewModalImg || ''}
        title={previewModalTitle || 'Document Inspection Preview'}
      />
    </PageWrapper>
  )
}

export default DocumentControllerPage
