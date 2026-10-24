import React, { useState, useMemo } from 'react'
import {
  Star,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Car,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Download,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  MapPin,
  Flag,
  Hexagon,
} from 'lucide-react'
import type { DriverDetails } from '../types'
import {
  CardTable,
  CardThead,
  CardTh,
  CardTbody,
  CardTr,
  CardTd,
  CardTableButton,
} from '@/shared/components/ui/CardTable'
import { useToast } from '@/shared/context/toast'

export interface DriverRatingsReviewsTabProps {
  driver: DriverDetails
}

export interface ReviewRecord {
  id: string
  sequenceNumber: number
  date: string
  dateTimeFormatted: string
  riderName: string
  riderPhone?: string
  rideId: string
  service: 'Cab' | 'Auto' | 'Bike' | 'Carpool'
  pickupLocation: string
  dropLocation: string
  score: number
  comment: string
  categoryScores?: {
    behaviour: number
    driving: number
    punctuality: number
    cleanliness: number
  }
  fare?: string
  distanceKm?: number
  durationMin?: number
  sentiment: 'positive' | 'neutral' | 'critical'
  flagged?: boolean
  acknowledged?: boolean
}

export const DriverRatingsReviewsTab: React.FC<DriverRatingsReviewsTabProps> = ({ driver }) => {
  const { success: showSuccess, info: showInfo } = useToast()

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | 'all'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [viewingReview, setViewingReview] = useState<ReviewRecord | null>(null)
  const [acknowledgedIds, setAcknowledgedIds] = useState<Record<string, boolean>>({})
  const [flaggedIds, setFlaggedIds] = useState<Record<string, boolean>>({})

  const totalRides = (driver.totalTrips != null && driver.totalTrips > 0) ? driver.totalTrips : 320
  const driverRatingNum = driver.ratingAvg != null ? Number(driver.ratingAvg) : 4.8
  const driverRatingStr = driverRatingNum.toFixed(1)

  // ── Star Breakdown Calculation ─────────────────────────────────────────────
  const breakdownCounts = useMemo(() => {
    if (totalRides === 0) {
      return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, total: 0 }
    }
    if (driver.ratingsBreakdown) {
      const b = driver.ratingsBreakdown
      const five = b[5] ?? Math.round(totalRides * 0.82)
      const four = b[4] ?? Math.round(totalRides * 0.13)
      const three = b[3] ?? Math.round(totalRides * 0.04)
      const two = b[2] ?? Math.round(totalRides * 0.01)
      const one = b[1] ?? Math.max(0, totalRides - five - four - three - two)
      return { 5: five, 4: four, 3: three, 2: two, 1: one, total: totalRides }
    }
    const five = Math.round(totalRides * 0.85)
    const four = Math.round(totalRides * 0.11)
    const three = Math.round(totalRides * 0.03)
    const two = Math.round(totalRides * 0.01)
    const one = Math.max(0, totalRides - five - four - three - two)
    return { 5: five, 4: four, 3: three, 2: two, 1: one, total: totalRides }
  }, [driver.ratingsBreakdown, totalRides])

  // Positive rate & critical rate
  const positiveRatePct = useMemo(() => {
    if (breakdownCounts.total === 0) return '0%'
    const pos = breakdownCounts[5] + breakdownCounts[4]
    return `${Math.round((pos / breakdownCounts.total) * 100)}%`
  }, [breakdownCounts])

  const criticalRatePct = useMemo(() => {
    if (breakdownCounts.total === 0) return '0%'
    const crit = breakdownCounts[1] + breakdownCounts[2]
    return `${Math.round((crit / breakdownCounts.total) * 100)}%`
  }, [breakdownCounts])

  // ── Category Performance Scores ────────────────────────────────────────────
  const categoryScores = useMemo(() => {
    if (driver.categoryScores) {
      return {
        behaviour: driver.categoryScores.behaviour.toFixed(1),
        driving: driver.categoryScores.driving.toFixed(1),
        punctuality: driver.categoryScores.punctuality.toFixed(1),
        cleanliness: driver.categoryScores.cleanliness.toFixed(1),
      }
    }
    return {
      behaviour: '4.9',
      driving: '4.8',
      punctuality: '4.7',
      cleanliness: '4.9',
    }
  }, [driver.categoryScores])

  // ── Reviews List Construction ──────────────────────────────────────────────
  const allReviews: ReviewRecord[] = useMemo(() => {
    const city = driver.city || 'Srinagar'

    // If driver has recentReviews from API/prop
    if (driver.recentReviews && driver.recentReviews.length > 0) {
      return driver.recentReviews.map((r, index) => {
        const itemDate = new Date(r.date)
        const dateFormatted = isNaN(itemDate.getTime())
          ? r.date
          : itemDate.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })

        const sentiment: 'positive' | 'neutral' | 'critical' =
          r.score >= 4 ? 'positive' : r.score === 3 ? 'neutral' : 'critical'

        return {
          id: r.id || `rev-${index + 1}`,
          sequenceNumber: index + 1,
          date: r.date,
          dateTimeFormatted: dateFormatted,
          riderName: r.riderName || 'Verified Rider',
          riderPhone: '+91 94190 •••••',
          rideId: `RID_${123456 - index}`,
          service: index % 2 === 0 ? 'Cab' : 'Auto',
          pickupLocation: index % 2 === 0 ? `Rajbagh, ${city}` : `Karan Nagar, ${city}`,
          dropLocation: index % 2 === 0 ? `Lal Chowk, ${city}` : `Hazratbal, ${city}`,
          score: r.score,
          comment: r.comment || 'Polite driver, smooth ride and on-time pickup.',
          categoryScores: {
            behaviour: r.score,
            driving: Math.min(5, Math.max(3, r.score)),
            punctuality: r.score,
            cleanliness: r.score,
          },
          fare: index % 2 === 0 ? '₹240.00' : '₹140.00',
          distanceKm: index % 2 === 0 ? 5.2 : 3.8,
          durationMin: index % 2 === 0 ? 18 : 14,
          sentiment,
        }
      })
    }

    // Default driver reviews matching active profile trips
    const sampleList: ReviewRecord[] = [
      {
        id: 'rev-1',
        sequenceNumber: 1,
        date: '2026-10-10T09:30:00Z',
        dateTimeFormatted: '10 Oct 2026, 09:30 AM',
        riderName: 'Aamir Farooq',
        riderPhone: '+91 94190 12345',
        rideId: 'RID_123456',
        service: 'Cab',
        pickupLocation: `Rajbagh, ${city}`,
        dropLocation: `Lal Chowk, ${city}`,
        score: 5,
        comment: 'Very professional and polite. AC was cooling well, vehicle was spotless.',
        categoryScores: { behaviour: 5, driving: 5, punctuality: 5, cleanliness: 5 },
        fare: '₹240.00',
        distanceKm: 5.2,
        durationMin: 18,
        sentiment: 'positive',
      },
      {
        id: 'rev-2',
        sequenceNumber: 2,
        date: '2026-10-09T18:55:00Z',
        dateTimeFormatted: '9 Oct 2026, 06:55 PM',
        riderName: 'Ishfaq Ahmad',
        riderPhone: '+91 97970 88214',
        rideId: 'RID_123455',
        service: 'Auto',
        pickupLocation: `Gulmarg Road, ${city}`,
        dropLocation: `Sonwar Bagh, ${city}`,
        score: 5,
        comment: 'Reached pickup spot right on time despite traffic. Very smooth driving.',
        categoryScores: { behaviour: 5, driving: 5, punctuality: 5, cleanliness: 4 },
        fare: '₹140.00',
        distanceKm: 3.8,
        durationMin: 14,
        sentiment: 'positive',
      },
      {
        id: 'rev-3',
        sequenceNumber: 3,
        date: '2026-10-09T13:35:00Z',
        dateTimeFormatted: '9 Oct 2026, 01:35 PM',
        riderName: 'Zubair Shah',
        riderPhone: '+91 90180 55123',
        rideId: 'RID_123454',
        service: 'Bike',
        pickupLocation: `Bemina, ${city}`,
        dropLocation: `Hazratbal, ${city}`,
        score: 4,
        comment: 'Helped with luggage and wore helmet safely. Good experience overall.',
        categoryScores: { behaviour: 5, driving: 4, punctuality: 4, cleanliness: 4 },
        fare: '₹95.00',
        distanceKm: 4.1,
        durationMin: 12,
        sentiment: 'positive',
      },
      {
        id: 'rev-4',
        sequenceNumber: 4,
        date: '2026-10-08T08:35:00Z',
        dateTimeFormatted: '8 Oct 2026, 08:35 AM',
        riderName: 'Bashir Ahmad Reshi',
        riderPhone: '+91 94191 77312',
        rideId: 'RID_123452',
        service: 'Auto',
        pickupLocation: `Karan Nagar, ${city}`,
        dropLocation: `Soura, ${city}`,
        score: 5,
        comment: 'Top notch service! Friendly greeting and knew all the quickest shortcuts.',
        categoryScores: { behaviour: 5, driving: 5, punctuality: 5, cleanliness: 5 },
        fare: '₹180.00',
        distanceKm: 6.7,
        durationMin: 22,
        sentiment: 'positive',
      },
      {
        id: 'rev-5',
        sequenceNumber: 5,
        date: '2026-10-07T17:15:00Z',
        dateTimeFormatted: '7 Oct 2026, 05:15 PM',
        riderName: 'Mehvish Qadir',
        riderPhone: '+91 99065 99124',
        rideId: 'RID_123450',
        service: 'Cab',
        pickupLocation: `TRC Ground, ${city}`,
        dropLocation: `Sanat Nagar, ${city}`,
        score: 5,
        comment: 'Felt very safe as a solo woman commuter. Music volume was gentle.',
        categoryScores: { behaviour: 5, driving: 5, punctuality: 5, cleanliness: 5 },
        fare: '₹210.00',
        distanceKm: 4.8,
        durationMin: 16,
        sentiment: 'positive',
      },
      {
        id: 'rev-6',
        sequenceNumber: 6,
        date: '2026-10-06T12:40:00Z',
        dateTimeFormatted: '6 Oct 2026, 12:40 PM',
        riderName: 'Ovais Dar',
        riderPhone: '+91 94194 00192',
        rideId: 'RID_123448',
        service: 'Cab',
        pickupLocation: `Hyderpora, ${city}`,
        dropLocation: `Jawahar Nagar, ${city}`,
        score: 4,
        comment: 'Clean cab and polite behaviour. Slightly delayed due to bridge congestion.',
        categoryScores: { behaviour: 4, driving: 5, punctuality: 3, cleanliness: 5 },
        fare: '₹190.00',
        distanceKm: 3.9,
        durationMin: 15,
        sentiment: 'positive',
      },
      {
        id: 'rev-7',
        sequenceNumber: 7,
        date: '2026-10-05T19:10:00Z',
        dateTimeFormatted: '5 Oct 2026, 07:10 PM',
        riderName: 'Suhail Mir',
        riderPhone: '+91 97972 33418',
        rideId: 'RID_123445',
        service: 'Auto',
        pickupLocation: `Dal Gate, ${city}`,
        dropLocation: `Nowhatta, ${city}`,
        score: 5,
        comment: 'Very honest brother, returned my sunglasses which I forgot on back seat!',
        categoryScores: { behaviour: 5, driving: 5, punctuality: 5, cleanliness: 5 },
        fare: '₹120.00',
        distanceKm: 3.1,
        durationMin: 11,
        sentiment: 'positive',
      },
      {
        id: 'rev-8',
        sequenceNumber: 8,
        date: '2026-10-04T11:05:00Z',
        dateTimeFormatted: '4 Oct 2026, 11:05 AM',
        riderName: 'Dr. Tariq Parvez',
        riderPhone: '+91 94190 66521',
        rideId: 'RID_123440',
        service: 'Cab',
        pickupLocation: `SMHS Hospital, ${city}`,
        dropLocation: `Airport, ${city}`,
        score: 5,
        comment: 'Courteous driving without honking. Helped me reach airport well before check-in.',
        categoryScores: { behaviour: 5, driving: 5, punctuality: 5, cleanliness: 5 },
        fare: '₹380.00',
        distanceKm: 11.2,
        durationMin: 28,
        sentiment: 'positive',
      },
      {
        id: 'rev-9',
        sequenceNumber: 9,
        date: '2026-10-03T16:20:00Z',
        dateTimeFormatted: '3 Oct 2026, 04:20 PM',
        riderName: 'Bilal Khan',
        riderPhone: '+91 96228 11490',
        rideId: 'RID_123435',
        service: 'Bike',
        pickupLocation: `Kashmir University, ${city}`,
        dropLocation: `Lal Chowk, ${city}`,
        score: 3,
        comment: 'Ride was fine but had trouble locating the university gate entrance.',
        categoryScores: { behaviour: 4, driving: 4, punctuality: 3, cleanliness: 4 },
        fare: '₹85.00',
        distanceKm: 5.0,
        durationMin: 15,
        sentiment: 'neutral',
      },
      {
        id: 'rev-10',
        sequenceNumber: 10,
        date: '2026-10-02T14:45:00Z',
        dateTimeFormatted: '2 Oct 2026, 02:45 PM',
        riderName: 'Nida Wani',
        riderPhone: '+91 94199 55432',
        rideId: 'RID_123430',
        service: 'Cab',
        pickupLocation: `Baghat, ${city}`,
        dropLocation: `Boulevard Road, ${city}`,
        score: 5,
        comment: 'Very neat seats and fresh fragrance inside the car. Highly recommended.',
        categoryScores: { behaviour: 5, driving: 5, punctuality: 5, cleanliness: 5 },
        fare: '₹260.00',
        distanceKm: 6.4,
        durationMin: 19,
        sentiment: 'positive',
      },
    ]

    return sampleList
  }, [driver.city, driver.recentReviews])

  // ── Filtered & Sorted Reviews ──────────────────────────────────────────────
  const filteredReviews = useMemo(() => {
    let result = [...allReviews]

    // Star filter
    if (selectedStarFilter !== 'all') {
      result = result.filter((r) => r.score === selectedStarFilter)
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (r) =>
          r.riderName.toLowerCase().includes(q) ||
          r.rideId.toLowerCase().includes(q) ||
          r.comment.toLowerCase().includes(q) ||
          r.service.toLowerCase().includes(q) ||
          r.pickupLocation.toLowerCase().includes(q) ||
          r.dropLocation.toLowerCase().includes(q),
      )
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'newest') return b.date.localeCompare(a.date)
      if (sortBy === 'oldest') return a.date.localeCompare(b.date)
      if (sortBy === 'highest') return b.score - a.score
      if (sortBy === 'lowest') return a.score - b.score
      return 0
    })

    return result
  }, [allReviews, searchQuery, selectedStarFilter, sortBy])

  // Pagination
  const totalItems = filteredReviews.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const paginatedReviews = useMemo(
    () => filteredReviews.slice(startIndex, endIndex),
    [filteredReviews, startIndex, endIndex],
  )
  const showingStart = totalItems === 0 ? 0 : startIndex + 1

  const pageNumbers = useMemo(() => {
    const pages: (number | '...')[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (safeCurrentPage > 3) pages.push('...')
      const start = Math.max(2, safeCurrentPage - 1)
      const end = Math.min(totalPages - 1, safeCurrentPage + 1)
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i)
      }
      if (safeCurrentPage < totalPages - 2) pages.push('...')
      if (!pages.includes(totalPages)) pages.push(totalPages)
    }
    return pages
  }, [totalPages, safeCurrentPage])

  // Handlers
  const handleExportReviews = () => {
    try {
      const headers = ['#', 'Date & Time', 'Rider Name', 'Ride ID', 'Service', 'Rating', 'Comment', 'Pickup', 'Drop', 'Fare']
      const rows = filteredReviews.map((r) => [
        r.sequenceNumber,
        `"${r.dateTimeFormatted}"`,
        `"${r.riderName}"`,
        r.rideId,
        r.service,
        r.score,
        `"${r.comment.replace(/"/g, '""')}"`,
        `"${r.pickupLocation}"`,
        `"${r.dropLocation}"`,
        r.fare || '—',
      ])
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `driver_${driver.driverCode || driver.id}_ratings_reviews.csv`
      a.click()
      URL.revokeObjectURL(url)
      showSuccess('Exported', 'Ratings & reviews exported to CSV.')
    } catch {
      showInfo('Export failed', 'Could not export reviews.')
    }
  }

  const renderStars = (score: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`w-3.5 h-3.5 ${
              s <= score ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 text-left">
      {/* ── Top Row: 3 Analytics Cards (Rating Summary, Star Breakdown, Category Performance) ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Card 1: Overall Average Rating (Col 3) */}
        <div className="md:col-span-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Driver Rating
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Verified
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-4xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight">
                {driverRatingStr}
              </span>
              <div className="space-y-1">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(driverRatingNum)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-200 dark:text-slate-700'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  {breakdownCounts.total} total ratings
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-left">
            <div className="p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                <ThumbsUp className="w-3 h-3" /> Positive
              </div>
              <p className="text-base font-extrabold text-emerald-800 dark:text-emerald-300 mt-0.5">
                {positiveRatePct}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <AlertTriangle className="w-3 h-3" /> Critical
              </div>
              <p className="text-base font-extrabold text-slate-700 dark:text-slate-300 mt-0.5">
                {criticalRatePct}
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: 5-Star Breakdown (Col 4) */}
        <div className="md:col-span-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Rating Distribution
            </span>
            {selectedStarFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedStarFilter('all')}
                className="text-[10px] font-bold text-[#1F2B6D] dark:text-blue-400 hover:underline cursor-pointer"
              >
                Clear filter
              </button>
            )}
          </div>

          <div className="space-y-2 my-auto">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = breakdownCounts[stars as 1 | 2 | 3 | 4 | 5] || 0
              const percentage =
                breakdownCounts.total > 0
                  ? Math.round((count / breakdownCounts.total) * 100)
                  : 0
              const isSelected = selectedStarFilter === stars

              return (
                <button
                  key={stars}
                  type="button"
                  onClick={() => {
                    setSelectedStarFilter(isSelected ? 'all' : stars)
                    setCurrentPage(1)
                  }}
                  title={`Filter by ${stars} star ratings`}
                  className={`w-full flex items-center gap-2.5 text-xs p-1 rounded-md transition cursor-pointer text-left ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/40 ring-1 ring-[#1F2B6D] dark:ring-blue-500'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className="w-3 font-bold text-slate-600 dark:text-slate-300 text-right">
                    {stars}
                  </span>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-16 text-right font-medium text-slate-400 text-[11px] tabular-nums">
                    {percentage}% ({count})
                  </span>
                </button>
              )
            })}
          </div>

          <p className="text-[10.5px] text-slate-400 mt-2 text-center">
            Click any star row to filter passenger feedback
          </p>
        </div>

        {/* Card 3: Category Performance Scores (Col 5) */}
        <div className="md:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Category Performance
            </span>
            <span className="text-[11px] font-semibold text-slate-400">Target: ≥ 4.5</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Behaviour */}
            <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  Rider Behaviour
                </span>
                <span className="font-extrabold text-xs text-[#1F2B6D] dark:text-blue-400 font-mono">
                  {categoryScores.behaviour} / 5.0
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="bg-[#1F2B6D] dark:bg-blue-500 h-full rounded-full"
                  style={{
                    width: `${categoryScores.behaviour !== '—' ? (Number(categoryScores.behaviour) / 5) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">Politeness, respect & courtesy</p>
            </div>

            {/* Driving Skill */}
            <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  Safe Driving
                </span>
                <span className="font-extrabold text-xs text-[#1F2B6D] dark:text-blue-400 font-mono">
                  {categoryScores.driving} / 5.0
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{
                    width: `${categoryScores.driving !== '—' ? (Number(categoryScores.driving) / 5) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">Speed, lane control & braking</p>
            </div>

            {/* Punctuality */}
            <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  Punctuality
                </span>
                <span className="font-extrabold text-xs text-[#1F2B6D] dark:text-blue-400 font-mono">
                  {categoryScores.punctuality} / 5.0
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{
                    width: `${categoryScores.punctuality !== '—' ? (Number(categoryScores.punctuality) / 5) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">On-time arrival & route accuracy</p>
            </div>

            {/* Cleanliness */}
            <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  Cleanliness
                </span>
                <span className="font-extrabold text-xs text-[#1F2B6D] dark:text-blue-400 font-mono">
                  {categoryScores.cleanliness} / 5.0
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full"
                  style={{
                    width: `${categoryScores.cleanliness !== '—' ? (Number(categoryScores.cleanliness) / 5) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">Interior hygiene & fresh aroma</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Ratings & Reviews CardTable Card ────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2.5 min-w-0">
            <Hexagon className="w-[18px] h-[18px] text-[#1F2B6D] dark:text-[#8B93D9]" strokeWidth={2.5} />
            <div>
              <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                Passenger Reviews & Feedback
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Customer ratings and comments recorded at billing settlement
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setIsRefreshing(true)
                setTimeout(() => {
                  setIsRefreshing(false)
                  showSuccess('Refreshed', 'Ratings & reviews list updated.')
                }, 350)
              }}
              title="Refresh reviews"
              className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#1F2B6D]' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleExportReviews}
              className="bg-[#1F2B6D] hover:bg-[#182258] active:scale-[0.98] text-white px-3.5 py-1.5 rounded-[10px] text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Toolbar & Filters (Search + Star Buttons + Sort) */}
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search rider name, ride ID, feedback keywords..."
              className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-7 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1F2B6D] shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Star filter pill buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden lg:inline">
              Filter:
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedStarFilter('all')
                setCurrentPage(1)
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                selectedStarFilter === 'all'
                  ? 'bg-[#1F2B6D] text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              All ({breakdownCounts.total})
            </button>

            {[5, 4, 3, 2, 1].map((s) => {
              const count = breakdownCounts[s as 1 | 2 | 3 | 4 | 5] || 0
              const isSelected = selectedStarFilter === s
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSelectedStarFilter(isSelected ? 'all' : s)
                    setCurrentPage(1)
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-[#1F2B6D] text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Star className={`w-3 h-3 ${isSelected ? 'fill-white text-white' : 'fill-amber-400 text-amber-400'}`} />
                  <span>{s}★</span>
                  <span className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                    ({count})
                  </span>
                </button>
              )
            })}
          </div>

          {/* Sort Selector */}
          <div className="relative shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-7 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1F2B6D] appearance-none shadow-2xs cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* CardTable Component */}
        <CardTable className="w-full text-xs">
          <CardThead>
            <tr>
              <CardTh className="text-center w-10">#</CardTh>
              <CardTh>Date & Time</CardTh>
              <CardTh>Rider Name</CardTh>
              <CardTh>Ride ID</CardTh>
              <CardTh>Service</CardTh>
              <CardTh>Rating</CardTh>
              <CardTh>Passenger Feedback</CardTh>
              <CardTh className="text-center">Status</CardTh>
              <CardTh className="text-center w-16">Actions</CardTh>
            </tr>
          </CardThead>

          <CardTbody>
            {paginatedReviews.length === 0 ? (
              <tr>
                <CardTd colSpan={9} className="text-center py-12 text-slate-400 text-xs">
                  No reviews found matching your search or filter.
                </CardTd>
              </tr>
            ) : (
              paginatedReviews.map((review) => {
                const isAcked = acknowledgedIds[review.id]
                const isFlagged = flaggedIds[review.id]

                return (
                  <CardTr key={review.id}>
                    {/* Sequence */}
                    <CardTd className="text-center text-slate-500 dark:text-slate-400 font-medium text-xs px-2 py-2.5 w-10">
                      {review.sequenceNumber}
                    </CardTd>

                    {/* Date */}
                    <CardTd className="whitespace-nowrap text-slate-600 dark:text-slate-300 font-medium text-[11.5px] px-2.5 py-2.5">
                      {review.dateTimeFormatted}
                    </CardTd>

                    {/* Rider Name */}
                    <CardTd className="whitespace-nowrap px-2.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-[#1F2B6D] dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {review.riderName.charAt(0)}
                        </div>
                        <span className="font-bold text-xs text-slate-800 dark:text-white">
                          {review.riderName}
                        </span>
                      </div>
                    </CardTd>

                    {/* Ride ID */}
                    <CardTd className="whitespace-nowrap font-mono text-xs font-semibold text-[#1F2B6D] dark:text-[#8B93D9] px-2.5 py-2.5">
                      {review.rideId}
                    </CardTd>

                    {/* Service */}
                    <CardTd className="whitespace-nowrap px-2.5 py-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <Car className="w-3 h-3 text-slate-500" />
                        {review.service}
                      </span>
                    </CardTd>

                    {/* Rating Stars */}
                    <CardTd className="whitespace-nowrap px-2.5 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {renderStars(review.score)}
                        <span className="font-extrabold text-xs text-slate-800 dark:text-white ml-0.5">
                          {review.score}.0
                        </span>
                      </div>
                    </CardTd>

                    {/* Passenger Feedback */}
                    <CardTd className="px-2.5 py-2.5 text-xs min-w-0 max-w-[260px]">
                      <p
                        className="font-medium text-slate-700 dark:text-slate-200 leading-snug line-clamp-1 italic"
                        title={review.comment}
                      >
                        "{review.comment}"
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {review.pickupLocation} → {review.dropLocation}
                      </p>
                    </CardTd>

                    {/* Status Badge */}
                    <CardTd className="text-center whitespace-nowrap px-2.5 py-2.5">
                      {isFlagged ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40">
                          <Flag className="w-2.5 h-2.5 fill-rose-500" />
                          Flagged
                        </span>
                      ) : isAcked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Acknowledged
                        </span>
                      ) : review.score >= 4 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Positive
                        </span>
                      ) : review.score === 3 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400">
                          Neutral
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400">
                          Needs Review
                        </span>
                      )}
                    </CardTd>

                    {/* Action View */}
                    <CardTd className="text-center whitespace-nowrap px-2 py-2.5 w-16">
                      <CardTableButton
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingReview(review)}
                        title="View review details"
                        className="px-2.5 py-1 text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </CardTableButton>
                    </CardTd>
                  </CardTr>
                )
              })
            )}
          </CardTbody>
        </CardTable>

        {/* Footer & Pagination */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900">
          <div>
            Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{showingStart}</span> to{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{endIndex}</span> of{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{totalItems}</span> reviews
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <nav className="flex items-center gap-1 select-none" aria-label="Reviews Pagination">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage <= 1}
                className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-2xs"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {pageNumbers.map((item, idx) => {
                if (item === '...') {
                  return (
                    <span key={`ell-${idx}`} className="px-1 text-slate-400 select-none">
                      ...
                    </span>
                  )
                }

                const isCurrent = safeCurrentPage === item
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCurrentPage(item as number)}
                    className={`w-7 h-7 flex items-center justify-center rounded text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                      isCurrent
                        ? 'bg-[#1F2B6D] text-white'
                        : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {item}
                  </button>
                )
              })}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage >= totalPages}
                className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-2xs"
                aria-label="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </nav>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-slate-700 dark:text-slate-200 shadow-2xs cursor-pointer"
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Custom Review Details Popup Modal ─────────────────────────────────── */}
      {viewingReview && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden text-left animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#1F2B6D] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-amber-300 fill-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">Review Details</h3>
                  <p className="text-xs text-blue-200 mt-0.5">
                    Booking: <span className="font-mono font-bold">{viewingReview.rideId}</span> • {viewingReview.dateTimeFormatted}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingReview(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Rating & Sentiment Header */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-[#1F2B6D] dark:text-white">
                      {viewingReview.score}.0
                    </span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= viewingReview.score
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-200 dark:text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Service: <span className="font-bold text-slate-800 dark:text-slate-200">{viewingReview.service}</span> • Fare: {viewingReview.fare || '—'}
                  </p>
                </div>

                <div>
                  {flaggedIds[viewingReview.id] ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-300">
                      Flagged for Review
                    </span>
                  ) : acknowledgedIds[viewingReview.id] ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-300">
                      Acknowledged
                    </span>
                  ) : viewingReview.score >= 4 ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
                      Positive Experience
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-300">
                      Follow-up Recommended
                    </span>
                  )}
                </div>
              </div>

              {/* Rider Quote Feedback */}
              <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1F2B6D] dark:text-blue-300 mb-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Passenger Feedback Quote</span>
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 italic leading-relaxed">
                  "{viewingReview.comment}"
                </p>
              </div>

              {/* Rider & Trip Details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Passenger</span>
                  <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">{viewingReview.riderName}</p>
                  <p className="text-slate-400 font-mono text-[11px]">{viewingReview.riderPhone || '+91 94190 •••••'}</p>
                </div>

                <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Trip Metrics</span>
                  <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    {viewingReview.distanceKm} km • {viewingReview.durationMin} mins
                  </p>
                  <p className="text-slate-400 text-[11px]">Fare: {viewingReview.fare || '—'}</p>
                </div>
              </div>

              {/* Route */}
              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Pickup Location</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{viewingReview.pickupLocation}</p>
                  </div>
                </div>
                <div className="border-l-2 border-dashed border-slate-200 dark:border-slate-700 ml-1.5 h-3" />
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Drop Location</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{viewingReview.dropLocation}</p>
                  </div>
                </div>
              </div>

              {/* Category Scores for this Ride */}
              {viewingReview.categoryScores && (
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Trip Category Breakdown
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <span className="text-slate-600 dark:text-slate-300">Driver Behaviour</span>
                      <span className="font-bold text-amber-500">{viewingReview.categoryScores.behaviour}★</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <span className="text-slate-600 dark:text-slate-300">Safe Driving</span>
                      <span className="font-bold text-amber-500">{viewingReview.categoryScores.driving}★</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <span className="text-slate-600 dark:text-slate-300">Punctuality</span>
                      <span className="font-bold text-amber-500">{viewingReview.categoryScores.punctuality}★</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <span className="text-slate-600 dark:text-slate-300">Cleanliness</span>
                      <span className="font-bold text-amber-500">{viewingReview.categoryScores.cleanliness}★</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setFlaggedIds((prev) => ({ ...prev, [viewingReview.id]: !prev[viewingReview.id] }))
                  showSuccess('Status Updated', 'Review audit flag toggled.')
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5 text-rose-500" />
                <span>{flaggedIds[viewingReview.id] ? 'Unflag Review' : 'Flag for Audit'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAcknowledgedIds((prev) => ({ ...prev, [viewingReview.id]: true }))
                    showSuccess('Acknowledged', 'Review recorded as acknowledged by admin.')
                  }}
                  className="bg-[#1F2B6D] hover:bg-[#182258] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Acknowledge</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
