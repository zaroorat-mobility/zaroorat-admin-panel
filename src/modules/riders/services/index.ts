import type { QueryParams, PaginatedResponse } from '@/shared/types'
import type { RiderEntity, RiderDetails, RiderStatus } from '../types'
import { logAuditAction } from '@/shared/services/auditLogger'

const RIDERS_DB_KEY = 'zaroorat_riders_db'

const getRidersDb = (): RiderDetails[] => {
  const db = localStorage.getItem(RIDERS_DB_KEY)
  if (!db) {
    const seed = makeSeedRiders()
    localStorage.setItem(RIDERS_DB_KEY, JSON.stringify(seed))
    return seed
  }
  return JSON.parse(db)
}

const saveRidersDb = (data: RiderDetails[]) => {
  localStorage.setItem(RIDERS_DB_KEY, JSON.stringify(data))
}

const makeSeedRiders = (): RiderDetails[] => {
  const now = new Date().toISOString()
  return [
    {
      id: 'rid-1',
      riderId: 'RID-2026-0001',
      fullName: 'Aamina Jan',
      mobileNumber: '9596001234',
      email: 'aamina.jan@gmail.com',
      gender: 'FEMALE',
      dateOfBirth: '1998-05-12',
      riderStatus: 'active',
      ratingAvg: 4.9,
      totalRides: 34,
      walletBalance: 450.00,
      joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
      lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      emergencyContacts: [
        { name: 'Mohammad Yusuf (Father)', phone: '9596005678' }
      ],
      country: 'India',
      state: 'Jammu & Kashmir',
      city: 'Srinagar',
      postcode: '190001',
      addressLine1: 'House 45, Lal Bazar',
      addressLine2: 'Near Mughal Darbar',
      preferredPaymentMethod: 'wallet',
      cancelRate: 3,
      noShowCount: 0,
      ledger: [
        { id: 'tx-r1-1', date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), type: 'TOPUP', amount: 500, balanceAfter: 500 },
        { id: 'tx-r1-2', date: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), type: 'PAYMENT', amount: -120, balanceAfter: 380, rideId: 'R-9871' },
        { id: 'tx-r1-3', date: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), type: 'CASHBACK', amount: 70, balanceAfter: 450 }
      ],
      rideHistory: [
        { id: 'R-9871', date: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), pickupAddress: 'Lal Chowk, Srinagar', dropAddress: 'Hazratbal, Srinagar', fare: 120, paymentMethod: 'wallet', status: 'completed' },
        { id: 'R-9812', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), pickupAddress: 'Nishat, Srinagar', dropAddress: 'Karan Nagar, Srinagar', fare: 180, paymentMethod: 'upi', status: 'completed' }
      ],
      timeline: [
        { id: 'tl-r1-1', action: 'Rider Profile Created', actor: 'System', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), isSystem: true },
        { id: 'tl-r1-2', action: 'Mobile OTP Verified', actor: 'Aamina Jan', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), isSystem: true }
      ],
      auditLogs: [
        { action: 'Account Created', operator: 'System', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString() }
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
      updatedAt: now
    },
    {
      id: 'rid-2',
      riderId: 'RID-2026-0002',
      fullName: 'Yawar Ahmad',
      mobileNumber: '7006001234',
      email: 'yawar.ahmad@yahoo.com',
      gender: 'MALE',
      dateOfBirth: '1995-11-20',
      riderStatus: 'active',
      ratingAvg: 4.7,
      totalRides: 12,
      walletBalance: 0.00,
      joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
      lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      emergencyContacts: [
        { name: 'Sajad Ahmad (Brother)', phone: '7006009876' }
      ],
      country: 'India',
      state: 'Jammu & Kashmir',
      city: 'Srinagar',
      postcode: '190008',
      addressLine1: 'B-Block, Jawahar Nagar',
      addressLine2: '',
      preferredPaymentMethod: 'cash',
      cancelRate: 15,
      noShowCount: 1,
      ledger: [],
      rideHistory: [
        { id: 'R-9541', date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), pickupAddress: 'Jawahar Nagar, Srinagar', dropAddress: 'Hyderpora Bypass, Srinagar', fare: 150, paymentMethod: 'cash', status: 'completed' }
      ],
      timeline: [
        { id: 'tl-r2-1', action: 'Rider Profile Created', actor: 'System', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(), isSystem: true }
      ],
      auditLogs: [],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
      updatedAt: now
    },
    {
      id: 'rid-3',
      riderId: 'RID-2026-0003',
      fullName: 'Suhail Malik',
      mobileNumber: '9906009999',
      email: 'suhail.malik@outlook.com',
      gender: 'MALE',
      dateOfBirth: '1992-02-15',
      riderStatus: 'suspended',
      ratingAvg: 4.1,
      totalRides: 45,
      walletBalance: -150.00,
      joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
      lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      emergencyContacts: [
        { name: 'Zahida Malik (Wife)', phone: '9906008888' }
      ],
      country: 'India',
      state: 'Jammu & Kashmir',
      city: 'Srinagar',
      postcode: '190005',
      addressLine1: 'Sector 3, Bemina',
      addressLine2: 'Near Bemina Degree College',
      preferredPaymentMethod: 'cash',
      cancelRate: 40,
      noShowCount: 4,
      ledger: [
        { id: 'tx-r3-1', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), type: 'PAYMENT', amount: -150, balanceAfter: -150, rideId: 'R-9321' }
      ],
      rideHistory: [
        { id: 'R-9321', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), pickupAddress: 'Bemina, Srinagar', dropAddress: 'Batmallo, Srinagar', fare: 150, paymentMethod: 'cash', status: 'completed' },
        { id: 'R-9201', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), pickupAddress: 'Bemina, Srinagar', dropAddress: 'Soura, Srinagar', fare: 250, paymentMethod: 'upi', status: 'completed' }
      ],
      timeline: [
        { id: 'tl-r3-1', action: 'Rider Profile Created', actor: 'System', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(), isSystem: true },
        { id: 'tl-r3-2', action: 'Rider Account Suspended', actor: 'Admin Operator', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), isSystem: false, notes: 'Excessive rider cancellation and negative wallet dues.' }
      ],
      auditLogs: [
        { action: 'Rider Suspended', operator: 'Admin Operator', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), notes: 'Excessive rider cancellation and negative wallet dues.' }
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
      updatedAt: now
    }
  ]
}

const getRiders = async (params?: QueryParams): Promise<PaginatedResponse<RiderEntity>> => {
  const db = getRidersDb()
  const search = ((params?.search as string) || '').toLowerCase()
  const statusFilter = params?.status as string

  let filtered = db.map(r => ({
    id: r.id,
    riderId: r.riderId,
    fullName: r.fullName,
    mobileNumber: r.mobileNumber,
    email: r.email,
    gender: r.gender,
    dateOfBirth: r.dateOfBirth,
    riderStatus: r.riderStatus,
    ratingAvg: r.ratingAvg,
    totalRides: r.totalRides,
    walletBalance: r.walletBalance,
    joinedAt: r.joinedAt,
    lastActiveAt: r.lastActiveAt,
    emergencyContacts: r.emergencyContacts,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt
  }))

  if (search) {
    filtered = filtered.filter(r =>
      r.fullName.toLowerCase().includes(search) ||
      r.mobileNumber.includes(search)
    )
  }

  if (statusFilter && statusFilter !== 'all') {
    filtered = filtered.filter(r => r.riderStatus === statusFilter)
  }

  return {
    data: filtered,
    meta: {
      currentPage: 1,
      totalPages: Math.ceil(filtered.length / 10),
      pageSize: 10,
      totalCount: filtered.length
    }
  }
}

const getRiderById = async (id: string): Promise<RiderDetails> => {
  const db = getRidersDb()
  const found = db.find(r => r.id === id)
  if (!found) throw new Error(`Rider ${id} not found`)
  return found
}

const updateRiderStatus = async (id: string, status: RiderStatus, notes?: string): Promise<RiderDetails> => {
  const db = getRidersDb()
  const idx = db.findIndex(r => r.id === id)
  if (idx === -1) throw new Error(`Rider ${id} not found`)
  
  const now = new Date().toISOString()
  db[idx].riderStatus = status
  db[idx].updatedAt = now
  
  db[idx].auditLogs.push({
    action: `Rider status updated to ${status.toUpperCase()}`,
    operator: 'Admin Operator',
    timestamp: now,
    notes
  })
  
  db[idx].timeline = [
    ...(db[idx].timeline || []),
    {
      id: `tl-status-${Date.now()}`,
      action: `Account status updated to ${status.toUpperCase()}`,
      actor: 'Admin Operator',
      timestamp: now,
      isSystem: false,
      notes
    }
  ]
  
  saveRidersDb(db)

  logAuditAction(
    `Rider Status Updated: ${status.toUpperCase()}`,
    notes || `Account login state adjusted manually to ${status.toUpperCase()}.`,
    id,
    'rider',
    'Admin Operator'
  )

  return db[idx]
}

export const RiderManagementService = {
  getRiders,
  getRiderById,
  suspendRider: (id: string, notes?: string) => updateRiderStatus(id, 'suspended', notes),
  blockRider: (id: string, notes?: string) => updateRiderStatus(id, 'blocked', notes),
  activateRider: (id: string, notes?: string) => updateRiderStatus(id, 'active', notes),
}

export default RiderManagementService
