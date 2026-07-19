import type { QueryParams, PaginatedResponse } from '@/shared/types'
import type { Ride, SOSAlert, Complaint, SosResolutionType, ComplaintStatus } from '../types'
import { logAuditAction } from '@/shared/services/auditLogger'

const RIDES_KEY = 'zaroorat_rides_db'
const SOS_KEY = 'zaroorat_sos_db'
const COMPLAINTS_KEY = 'zaroorat_complaints_db'

// Helper database getters and setters
const getDb = <T>(key: string, seedFn: () => T[]): T[] => {
  const db = localStorage.getItem(key)
  if (!db) {
    const seed = seedFn()
    localStorage.setItem(key, JSON.stringify(seed))
    return seed
  }
  return JSON.parse(db)
}

const saveDb = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data))
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED GENERATORS
// ─────────────────────────────────────────────────────────────────────────────

const seedRides = (): Ride[] => {
  const baseTime = Date.now()
  return [
    {
      id: 'ride-101',
      riderId: 'rider-1',
      riderName: 'Aditya Sharma',
      riderMobile: '+91 98765 43210',
      driverId: 'driver-1',
      driverName: 'Rajesh Kumar',
      driverMobile: '+91 91234 56789',
      vehiclePlate: 'DL-1CA-1234',
      vehicleType: 'cab',
      vehicleModel: 'Maruti Suzuki Dzire (White)',
      status: 'IN_PROGRESS',
      paymentStatus: 'pending',
      paymentMethod: 'upi',
      pickupLocation: 'Terminal 3, IGI Airport, New Delhi',
      dropLocation: 'Connaught Place, New Delhi',
      distance: 14.5,
      duration: 35,
      baseFare: 60.00,
      distanceCharge: 217.50,
      timeCharge: 52.50,
      surgeCharge: 0.00,
      discount: 25.00,
      finalFare: 305.00,
      otp: '4820',
      sosState: 'raised',
      createdAt: new Date(baseTime - 20 * 60 * 1000).toISOString(),
      updatedAt: new Date(baseTime - 20 * 60 * 1000).toISOString(),
      timeline: [
        { stage: 'REQUESTED', timestamp: new Date(baseTime - 25 * 60 * 1000).toISOString(), description: 'Rider searched for Dzire sedan booking.' },
        { stage: 'DRIVER_ASSIGNED', timestamp: new Date(baseTime - 23 * 60 * 1000).toISOString(), description: 'Driver Rajesh Kumar matched.' },
        { stage: 'DRIVER_ARRIVED', timestamp: new Date(baseTime - 21 * 60 * 1000).toISOString(), description: 'Driver reached terminal gates.' },
        { stage: 'OTP_VERIFIED', timestamp: new Date(baseTime - 20 * 60 * 1000).toISOString(), description: 'Ride started with OTP verification.' }
      ]
    },
    {
      id: 'ride-102',
      riderId: 'rider-2',
      riderName: 'Priya Patel',
      riderMobile: '+91 99988 77766',
      driverId: 'driver-2',
      driverName: 'Vikram Singh',
      driverMobile: '+91 88877 66655',
      vehiclePlate: 'MH-02BD-5678',
      vehicleType: 'auto',
      vehicleModel: 'Bajaj RE Auto (Green-Yellow)',
      status: 'COMPLETED',
      paymentStatus: 'completed',
      paymentMethod: 'cash',
      pickupLocation: 'Andheri Metro Station, Mumbai',
      dropLocation: 'Lokhandwala Complex, Mumbai',
      distance: 4.8,
      duration: 18,
      baseFare: 40.00,
      distanceCharge: 48.00,
      timeCharge: 18.00,
      surgeCharge: 15.00,
      discount: 0.00,
      finalFare: 121.00,
      otp: '1099',
      sosState: 'resolved',
      createdAt: new Date(baseTime - 3 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(baseTime - 2.5 * 60 * 60 * 1000).toISOString(),
      timeline: [
        { stage: 'REQUESTED', timestamp: new Date(baseTime - 3.2 * 60 * 60 * 1000).toISOString(), description: 'Rider Priya requested an Auto-rickshaw.' },
        { stage: 'DRIVER_ASSIGNED', timestamp: new Date(baseTime - 3.1 * 60 * 60 * 1000).toISOString(), description: 'Driver Vikram Singh assigned.' },
        { stage: 'OTP_VERIFIED', timestamp: new Date(baseTime - 3.0 * 60 * 60 * 1000).toISOString(), description: 'OTP confirmed.' },
        { stage: 'COMPLETED', timestamp: new Date(baseTime - 2.7 * 60 * 60 * 1000).toISOString(), description: 'Arrived at drop. Cash payment completed.' }
      ]
    },
    {
      id: 'ride-103',
      riderId: 'rider-3',
      riderName: 'Rohan Mehta',
      riderMobile: '+91 77766 55544',
      vehicleType: 'cab',
      status: 'CANCELLED_BY_RIDER',
      paymentStatus: 'pending',
      paymentMethod: 'wallet',
      pickupLocation: 'HSR Layout Sector 3, Bengaluru',
      dropLocation: 'Indiranagar Double Road, Bengaluru',
      distance: 8.2,
      duration: 0,
      baseFare: 50.00,
      distanceCharge: 0,
      timeCharge: 0,
      surgeCharge: 0,
      discount: 0,
      finalFare: 0,
      otp: '7843',
      sosState: 'none',
      createdAt: new Date(baseTime - 4 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(baseTime - 3.9 * 60 * 60 * 1000).toISOString(),
      timeline: [
        { stage: 'REQUESTED', timestamp: new Date(baseTime - 4 * 60 * 60 * 1000).toISOString(), description: 'Rider Rohan searched for cab.' },
        { stage: 'CANCELLED_BY_RIDER', timestamp: new Date(baseTime - 3.9 * 60 * 60 * 1000).toISOString(), description: 'Cancelled. Reason: Driver was too far.' }
      ]
    },
    {
      id: 'ride-104',
      riderId: 'rider-4',
      riderName: 'Neha Gupta',
      riderMobile: '+91 90011 22334',
      vehicleType: 'cab',
      status: 'SEARCHING',
      paymentStatus: 'pending',
      paymentMethod: 'card',
      pickupLocation: 'Salt Lake Sector V, Kolkata',
      dropLocation: 'Park Street, Kolkata',
      distance: 11.2,
      duration: 32,
      baseFare: 60.00,
      distanceCharge: 168.00,
      timeCharge: 48.00,
      surgeCharge: 0.00,
      discount: 0.00,
      finalFare: 276.00,
      otp: '9150',
      sosState: 'none',
      createdAt: new Date(baseTime - 2 * 60 * 1000).toISOString(),
      updatedAt: new Date(baseTime - 2 * 60 * 1000).toISOString(),
      timeline: [
        { stage: 'REQUESTED', timestamp: new Date(baseTime - 2 * 60 * 1000).toISOString(), description: 'Searching for matches in Salt Lake Sector V area.' }
      ]
    },
    {
      id: 'ride-105',
      riderId: 'rider-5',
      riderName: 'Amit Verma',
      riderMobile: '+91 81122 33445',
      driverId: 'driver-3',
      driverName: 'Sanjay Pal',
      driverMobile: '+91 70099 88776',
      vehiclePlate: 'KA-03HW-8765',
      vehicleType: 'bike',
      vehicleModel: 'Hero Splendor (Black)',
      status: 'DRIVER_ASSIGNED',
      paymentStatus: 'pending',
      paymentMethod: 'wallet',
      pickupLocation: 'Forum Mall, Koramangala, Bengaluru',
      dropLocation: 'Electronic City Phase 1, Bengaluru',
      distance: 12.0,
      duration: 25,
      baseFare: 20.00,
      distanceCharge: 72.00,
      timeCharge: 12.50,
      surgeCharge: 0.00,
      discount: 10.00,
      finalFare: 94.50,
      otp: '2389',
      sosState: 'none',
      createdAt: new Date(baseTime - 8 * 60 * 1000).toISOString(),
      updatedAt: new Date(baseTime - 6 * 60 * 1000).toISOString(),
      timeline: [
        { stage: 'REQUESTED', timestamp: new Date(baseTime - 8 * 60 * 1000).toISOString(), description: 'Rider Amit requested bike trip.' },
        { stage: 'DRIVER_ASSIGNED', timestamp: new Date(baseTime - 6 * 60 * 1000).toISOString(), description: 'Driver Sanjay Pal assigned and moving to pickup.' }
      ]
    },
    {
      id: 'ride-106',
      riderId: 'rider-6',
      riderName: 'Kiran Rao',
      riderMobile: '+91 94455 66778',
      driverId: 'driver-4',
      driverName: 'Dinesh Das',
      driverMobile: '+91 93322 11009',
      vehiclePlate: 'WB-02A-8899',
      vehicleType: 'cab',
      vehicleModel: 'Hyundai Xcent (Silver)',
      status: 'DRIVER_ARRIVED',
      paymentStatus: 'pending',
      paymentMethod: 'upi',
      pickupLocation: 'Howrah Junction, Kolkata',
      dropLocation: 'New Town Action Area 1, Kolkata',
      distance: 18.5,
      duration: 50,
      baseFare: 60.00,
      distanceCharge: 277.50,
      timeCharge: 75.00,
      surgeCharge: 40.00,
      discount: 30.00,
      finalFare: 422.50,
      otp: '3776',
      sosState: 'none',
      createdAt: new Date(baseTime - 15 * 60 * 1000).toISOString(),
      updatedAt: new Date(baseTime - 2 * 60 * 1000).toISOString(),
      timeline: [
        { stage: 'REQUESTED', timestamp: new Date(baseTime - 15 * 60 * 1000).toISOString(), description: 'Rider Kiran booked Dzire.' },
        { stage: 'DRIVER_ASSIGNED', timestamp: new Date(baseTime - 13 * 60 * 1000).toISOString(), description: 'Driver Dinesh Das matched.' },
        { stage: 'DRIVER_ARRIVED', timestamp: new Date(baseTime - 2 * 60 * 1000).toISOString(), description: 'Driver arrived outside Howrah station platform exits.' }
      ]
    },
    {
      id: 'ride-107',
      riderId: 'rider-7',
      riderName: 'Suresh Pillai',
      riderMobile: '+91 92244 88112',
      driverId: 'driver-5',
      driverName: 'Manoj Kumar',
      driverMobile: '+91 95566 77889',
      vehiclePlate: 'MH-03CT-4590',
      vehicleType: 'cab',
      vehicleModel: 'Toyota Etios (White)',
      status: 'PAYMENT_PENDING',
      paymentStatus: 'pending',
      paymentMethod: 'cash',
      pickupLocation: 'Bandra Kurla Complex, Mumbai',
      dropLocation: 'CST Station, Fort, Mumbai',
      distance: 16.2,
      duration: 40,
      baseFare: 60.00,
      distanceCharge: 243.00,
      timeCharge: 60.00,
      surgeCharge: 30.00,
      discount: 0.00,
      finalFare: 393.00,
      otp: '8910',
      sosState: 'none',
      createdAt: new Date(baseTime - 50 * 60 * 1000).toISOString(),
      updatedAt: new Date(baseTime - 10 * 60 * 1000).toISOString(),
      timeline: [
        { stage: 'REQUESTED', timestamp: new Date(baseTime - 50 * 60 * 1000).toISOString(), description: 'Rider requested ride.' },
        { stage: 'DRIVER_ASSIGNED', timestamp: new Date(baseTime - 48 * 60 * 1000).toISOString(), description: 'Driver Manoj Kumar assigned.' },
        { stage: 'OTP_VERIFIED', timestamp: new Date(baseTime - 45 * 60 * 1000).toISOString(), description: 'Ride OTP verified and started.' },
        { stage: 'PAYMENT_PENDING', timestamp: new Date(baseTime - 10 * 60 * 1000).toISOString(), description: 'Trip completed. Awaiting cash verification from rider.' }
      ]
    },
    {
      id: 'ride-108',
      riderId: 'rider-8',
      riderName: 'Deepika Sen',
      riderMobile: '+91 97755 33110',
      driverId: 'driver-6',
      driverName: 'Ramesh Lal',
      driverMobile: '+91 96644 22001',
      vehiclePlate: 'HR-26AT-9988',
      vehicleType: 'cab',
      vehicleModel: 'Honda Amaze (Gold)',
      status: 'IN_PROGRESS',
      paymentStatus: 'pending',
      paymentMethod: 'card',
      pickupLocation: 'Sec 21 Metro, Dwarka, Delhi',
      dropLocation: 'Cyber City Phase 3, Gurugram',
      distance: 18.0,
      duration: 38,
      baseFare: 60.00,
      distanceCharge: 270.00,
      timeCharge: 57.00,
      surgeCharge: 0.00,
      discount: 20.00,
      finalFare: 367.00,
      otp: '4590',
      sosState: 'acknowledged',
      createdAt: new Date(baseTime - 25 * 60 * 1000).toISOString(),
      updatedAt: new Date(baseTime - 25 * 60 * 1000).toISOString(),
      timeline: [
        { stage: 'REQUESTED', timestamp: new Date(baseTime - 30 * 60 * 1000).toISOString(), description: 'Requested.' },
        { stage: 'DRIVER_ASSIGNED', timestamp: new Date(baseTime - 28 * 60 * 1000).toISOString(), description: 'Driver Ramesh Lal assigned.' },
        { stage: 'DRIVER_ARRIVED', timestamp: new Date(baseTime - 26 * 60 * 1000).toISOString(), description: 'Driver waiting at gates.' },
        { stage: 'OTP_VERIFIED', timestamp: new Date(baseTime - 25 * 60 * 1000).toISOString(), description: 'Started with OTP verification.' }
      ]
    }
  ]
}

const seedSosAlerts = (): SOSAlert[] => {
  const baseTime = Date.now()
  return [
    {
      id: 'sos-201',
      rideId: 'ride-101',
      driverId: 'driver-1',
      driverName: 'Rajesh Kumar',
      riderId: 'rider-1',
      riderName: 'Aditya Sharma',
      vehiclePlate: 'DL-1CA-1234',
      timeRaised: new Date(baseTime - 45 * 1000).toISOString(), // Raised 45 seconds ago (will escalate soon)
      priority: 'critical',
      status: 'open',
      location: 'National Highway 8, Mahipalpur Flyover, New Delhi',
      createdAt: new Date(baseTime - 45 * 1000).toISOString(),
      updatedAt: new Date(baseTime - 45 * 1000).toISOString()
    },
    {
      id: 'sos-202',
      rideId: 'ride-108',
      driverId: 'driver-6',
      driverName: 'Ramesh Lal',
      riderId: 'rider-8',
      riderName: 'Deepika Sen',
      vehiclePlate: 'HR-26AT-9988',
      timeRaised: new Date(baseTime - 12 * 60 * 1000).toISOString(),
      priority: 'high',
      status: 'acknowledged',
      location: 'Dwarka Expressway Sector 110, Gurugram',
      acknowledgedBy: 'Support Agent A',
      acknowledgedAt: new Date(baseTime - 10 * 60 * 1000).toISOString(),
      acknowledgementNotes: 'Contacted rider Deepika. She reports vehicle deviation due to bypass road block. Confirmed safe but requested active support trace. Monitoring.',
      createdAt: new Date(baseTime - 12 * 60 * 1000).toISOString(),
      updatedAt: new Date(baseTime - 10 * 60 * 1000).toISOString()
    },
    {
      id: 'sos-203',
      rideId: 'ride-102',
      driverId: 'driver-2',
      driverName: 'Vikram Singh',
      riderId: 'rider-2',
      riderName: 'Priya Patel',
      vehiclePlate: 'MH-02BD-5678',
      timeRaised: new Date(baseTime - 3 * 60 * 60 * 1000).toISOString(),
      priority: 'medium',
      status: 'resolved',
      location: 'Lokhandwala Main Market Rd, Mumbai',
      acknowledgedBy: 'Support Agent B',
      acknowledgedAt: new Date(baseTime - 2.95 * 60 * 60 * 1000).toISOString(),
      acknowledgementNotes: 'SOS trigger received.',
      resolvedBy: 'Support Agent B',
      resolvedAt: new Date(baseTime - 2.8 * 60 * 60 * 1000).toISOString(),
      resolutionType: 'False Alarm',
      resolutionNotes: 'Rider Priya Patel contacted. Verified that her child clicked the SOS button accidentally during the ride. Confirmed rider safety.',
      createdAt: new Date(baseTime - 3 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(baseTime - 2.8 * 60 * 60 * 1000).toISOString()
    }
  ]
}

const seedComplaints = (): Complaint[] => {
  const baseTime = Date.now()
  return [
    {
      id: 'com-301',
      rideId: 'ride-101',
      raisedBy: 'rider',
      raisedByName: 'Aditya Sharma',
      category: 'Driver Behaviour',
      priority: 'high',
      status: 'open',
      description: 'Driver Rajesh Kumar started shouting at me when I requested to take a different route through Dwarka. Very rude behaviour.',
      createdAt: new Date(baseTime - 18 * 60 * 1000).toISOString(),
      updatedAt: new Date(baseTime - 18 * 60 * 1000).toISOString(),
      timeline: [
        { action: 'Ticket Created', actor: 'Rider Client App', timestamp: new Date(baseTime - 18 * 60 * 1000).toISOString(), notes: 'Complaint logged for Ride #ride-101' }
      ]
    },
    {
      id: 'com-302',
      rideId: 'ride-107',
      raisedBy: 'driver',
      raisedByName: 'Manoj Kumar',
      category: 'Payment',
      priority: 'medium',
      status: 'assigned',
      assignedTo: 'Support Agent A',
      assignedAt: new Date(baseTime - 8 * 60 * 1000).toISOString(),
      description: 'Rider left the vehicle at CST without paying the cash amount of ₹393. The rider stated they would pay online but did not do so. Phone is switched off.',
      createdAt: new Date(baseTime - 10 * 60 * 1000).toISOString(),
      updatedAt: new Date(baseTime - 8 * 60 * 1000).toISOString(),
      timeline: [
        { action: 'Ticket Created', actor: 'Driver Client App', timestamp: new Date(baseTime - 10 * 60 * 1000).toISOString() },
        { action: 'Ticket Assigned', actor: 'Support Agent A', timestamp: new Date(baseTime - 8 * 60 * 1000).toISOString(), notes: 'Assigned to Agent A for call trace logs.' }
      ]
    },
    {
      id: 'com-303',
      rideId: 'ride-108',
      raisedBy: 'rider',
      raisedByName: 'Deepika Sen',
      category: 'Safety',
      priority: 'critical',
      status: 'resolved',
      resolvedBy: 'Support Supervisor',
      resolvedAt: new Date(baseTime - 5 * 60 * 1000).toISOString(),
      resolutionNotes: 'Rider contacted during flight SOS event. Divergence route logs verified. Spoke to driver who has been suspended for 24h pending strict safety training audits.',
      description: 'Driver took major route deviation and was driving at high speeds, raising panic and SOS trigger.',
      createdAt: new Date(baseTime - 24 * 60 * 1000).toISOString(),
      updatedAt: new Date(baseTime - 5 * 60 * 1000).toISOString(),
      timeline: [
        { action: 'Ticket Created', actor: 'Rider Client App', timestamp: new Date(baseTime - 24 * 60 * 1000).toISOString() },
        { action: 'Investigation Started', actor: 'Support Supervisor', timestamp: new Date(baseTime - 15 * 60 * 1000).toISOString(), notes: 'Cross-checking with vehicle telemetry.' },
        { action: 'Ticket Resolved', actor: 'Support Supervisor', timestamp: new Date(baseTime - 5 * 60 * 1000).toISOString(), notes: 'Driver temporarily suspended.' }
      ]
    }
  ]
}

// ─────────────────────────────────────────────────────────────────────────────
// ESCALATION AND SLA UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

const checkEscalations = (alerts: SOSAlert[]): boolean => {
  let changed = false
  const now = Date.now()
  alerts.forEach(alert => {
    if (alert.status === 'open') {
      const elapsed = now - new Date(alert.timeRaised).getTime()
      // If open for > 60 seconds, trigger auto-escalation
      if (elapsed > 60000) {
        alert.status = 'escalated'
        alert.updatedAt = new Date().toISOString()
        changed = true
        
        logAuditAction(
          `SOS Alert Auto-Escalated: Ride ${alert.rideId}`,
          `SOS alert ${alert.id} was open for more than 60 seconds. Auto-escalated to critical level.`,
          alert.id,
          'sos',
          'System Processor'
        )
      }
    }
  })
  return changed
}

// ─────────────────────────────────────────────────────────────────────────────
// RIDE MONITOR SERVICES
// ─────────────────────────────────────────────────────────────────────────────

const getRides = async (params?: QueryParams): Promise<PaginatedResponse<Ride>> => {
  const db = getDb(RIDES_KEY, seedRides)
  const search = ((params?.search as string) || '').toLowerCase()
  let filtered = [...db]

  if (search) {
    filtered = filtered.filter(r => 
      r.id.toLowerCase().includes(search) ||
      r.riderName.toLowerCase().includes(search) ||
      (r.driverName && r.driverName.toLowerCase().includes(search)) ||
      (r.vehiclePlate && r.vehiclePlate.toLowerCase().includes(search))
    )
  }

  // Sort by createdAt descending
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

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

const getRideById = async (id: string): Promise<Ride> => {
  const db = getDb(RIDES_KEY, seedRides)
  const found = db.find(r => r.id === id)
  if (!found) throw new Error(`Ride ${id} not found`)
  return found
}

// ─────────────────────────────────────────────────────────────────────────────
// SOS MONITOR SERVICES
// ─────────────────────────────────────────────────────────────────────────────

const getSOSAlerts = async (params?: QueryParams): Promise<PaginatedResponse<SOSAlert>> => {
  const db = getDb(SOS_KEY, seedSosAlerts)
  
  // Run live auto-escalation check
  const changed = checkEscalations(db)
  if (changed) {
    saveDb(SOS_KEY, db)
  }

  const search = ((params?.search as string) || '').toLowerCase()
  let filtered = [...db]

  if (search) {
    filtered = filtered.filter(a => 
      a.id.toLowerCase().includes(search) ||
      a.rideId.toLowerCase().includes(search) ||
      a.riderName.toLowerCase().includes(search) ||
      a.driverName.toLowerCase().includes(search)
    )
  }

  filtered.sort((a, b) => new Date(b.timeRaised).getTime() - new Date(a.timeRaised).getTime())

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

const getSOSAlertById = async (id: string): Promise<SOSAlert> => {
  const db = getDb(SOS_KEY, seedSosAlerts)
  
  const found = db.find(a => a.id === id)
  if (!found) throw new Error(`SOS Alert ${id} not found`)

  // Check escalation
  const list = [found]
  if (checkEscalations(list)) {
    // Save state back to DB
    const fullDb = getDb(SOS_KEY, seedSosAlerts)
    const idx = fullDb.findIndex(a => a.id === id)
    if (idx !== -1) {
      fullDb[idx] = found
      saveDb(SOS_KEY, fullDb)
    }
  }

  return found
}

const acknowledgeSOS = async (id: string, notes: string): Promise<SOSAlert> => {
  const db = getDb(SOS_KEY, seedSosAlerts)
  const idx = db.findIndex(a => a.id === id)
  if (idx === -1) throw new Error(`SOS Alert ${id} not found`)

  const alert = db[idx]
  const now = new Date().toISOString()

  alert.status = 'acknowledged'
  alert.acknowledgedBy = 'Admin Operator'
  alert.acknowledgedAt = now
  alert.acknowledgementNotes = notes
  alert.updatedAt = now

  db[idx] = alert
  saveDb(SOS_KEY, db)

  // Update Ride sosState
  const rides = getDb(RIDES_KEY, seedRides)
  const rideIdx = rides.findIndex(r => r.id === alert.rideId)
  if (rideIdx !== -1) {
    rides[rideIdx].sosState = 'acknowledged'
    rides[rideIdx].updatedAt = now
    rides[rideIdx].timeline.push({
      stage: 'SOS_ACKNOWLEDGED',
      timestamp: now,
      description: `SOS alert acknowledged by agent: ${notes.substring(0, 45)}...`
    })
    saveDb(RIDES_KEY, rides)
  }

  logAuditAction(
    `Acknowledged SOS Alert: ${alert.id}`,
    `Alert for Ride ID ${alert.rideId} acknowledged. Notes: ${notes}`,
    alert.id,
    'sos'
  )

  return alert
}

const resolveSOS = async (id: string, resolutionType: SosResolutionType, notes: string): Promise<SOSAlert> => {
  const db = getDb(SOS_KEY, seedSosAlerts)
  const idx = db.findIndex(a => a.id === id)
  if (idx === -1) throw new Error(`SOS Alert ${id} not found`)

  const alert = db[idx]
  const now = new Date().toISOString()

  alert.status = 'resolved'
  alert.resolvedBy = 'Admin Operator'
  alert.resolvedAt = now
  alert.resolutionType = resolutionType
  alert.resolutionNotes = notes
  alert.updatedAt = now

  db[idx] = alert
  saveDb(SOS_KEY, db)

  // Update Ride sosState
  const rides = getDb(RIDES_KEY, seedRides)
  const rideIdx = rides.findIndex(r => r.id === alert.rideId)
  if (rideIdx !== -1) {
    rides[rideIdx].sosState = 'resolved'
    rides[rideIdx].updatedAt = now
    rides[rideIdx].timeline.push({
      stage: 'SOS_RESOLVED',
      timestamp: now,
      description: `SOS resolved [Type: ${resolutionType}]: ${notes.substring(0, 45)}...`
    })
    saveDb(RIDES_KEY, rides)
  }

  logAuditAction(
    `Resolved SOS Alert: ${alert.id}`,
    `Alert resolved with status ${resolutionType}. Notes: ${notes}`,
    alert.id,
    'sos'
  )

  return alert
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPLAINTS SERVICES
// ─────────────────────────────────────────────────────────────────────────────

const getComplaints = async (params?: QueryParams): Promise<PaginatedResponse<Complaint>> => {
  const db = getDb(COMPLAINTS_KEY, seedComplaints)
  const search = ((params?.search as string) || '').toLowerCase()
  let filtered = [...db]

  if (search) {
    filtered = filtered.filter(c => 
      c.id.toLowerCase().includes(search) ||
      (c.rideId && c.rideId.toLowerCase().includes(search)) ||
      c.raisedByName.toLowerCase().includes(search) ||
      c.category.toLowerCase().includes(search)
    )
  }

  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

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

const getComplaintById = async (id: string): Promise<Complaint> => {
  const db = getDb(COMPLAINTS_KEY, seedComplaints)
  const found = db.find(c => c.id === id)
  if (!found) throw new Error(`Complaint ${id} not found`)
  return found
}

const createComplaint = async (data: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'timeline'>): Promise<Complaint> => {
  const db = getDb(COMPLAINTS_KEY, seedComplaints)
  const now = new Date().toISOString()

  const ticket: Complaint = {
    ...data,
    id: `com-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    timeline: [
      { action: 'Ticket Created', actor: 'Admin Operator', timestamp: now, notes: `Complaint created: ${data.description.substring(0, 45)}...` }
    ]
  }

  db.push(ticket)
  saveDb(COMPLAINTS_KEY, db)

  logAuditAction(
    `Created Complaint Ticket: ${ticket.id}`,
    `Category: ${ticket.category}, Priority: ${ticket.priority}, Description: ${ticket.description}`,
    ticket.id,
    'complaint'
  )

  return ticket
}

const assignComplaint = async (id: string, agentName: string): Promise<Complaint> => {
  const db = getDb(COMPLAINTS_KEY, seedComplaints)
  const idx = db.findIndex(c => c.id === id)
  if (idx === -1) throw new Error(`Complaint ${id} not found`)

  const ticket = db[idx]
  const now = new Date().toISOString()

  ticket.status = 'assigned'
  ticket.assignedTo = agentName
  ticket.assignedAt = now
  ticket.updatedAt = now
  ticket.timeline.push({
    action: 'Ticket Assigned',
    actor: 'Admin Operator',
    timestamp: now,
    notes: `Assigned to ${agentName}`
  })

  db[idx] = ticket
  saveDb(COMPLAINTS_KEY, db)

  logAuditAction(
    `Assigned Complaint: ${ticket.id}`,
    `Ticket assigned to support agent: ${agentName}`,
    ticket.id,
    'complaint'
  )

  return ticket
}

const updateComplaintStatus = async (id: string, status: ComplaintStatus, notes?: string): Promise<Complaint> => {
  const db = getDb(COMPLAINTS_KEY, seedComplaints)
  const idx = db.findIndex(c => c.id === id)
  if (idx === -1) throw new Error(`Complaint ${id} not found`)

  const ticket = db[idx]
  const now = new Date().toISOString()

  const oldStatus = ticket.status
  ticket.status = status
  ticket.updatedAt = now
  ticket.timeline.push({
    action: `Status Changed to ${status}`,
    actor: 'Admin Operator',
    timestamp: now,
    notes: notes
  })

  db[idx] = ticket
  saveDb(COMPLAINTS_KEY, db)

  logAuditAction(
    `Updated Complaint Status: ${ticket.id}`,
    `Shifted status from ${oldStatus} to ${status}. Operator notes: ${notes || 'None'}`,
    ticket.id,
    'complaint'
  )

  return ticket
}

const resolveComplaint = async (id: string, resolutionNotes: string): Promise<Complaint> => {
  const db = getDb(COMPLAINTS_KEY, seedComplaints)
  const idx = db.findIndex(c => c.id === id)
  if (idx === -1) throw new Error(`Complaint ${id} not found`)

  const ticket = db[idx]
  const now = new Date().toISOString()

  ticket.status = 'resolved'
  ticket.resolvedBy = 'Admin Operator'
  ticket.resolvedAt = now
  ticket.resolutionNotes = resolutionNotes
  ticket.updatedAt = now
  ticket.timeline.push({
    action: 'Ticket Resolved',
    actor: 'Admin Operator',
    timestamp: now,
    notes: resolutionNotes
  })

  db[idx] = ticket
  saveDb(COMPLAINTS_KEY, db)

  logAuditAction(
    `Resolved Complaint: ${ticket.id}`,
    `Ticket marked resolved. Notes: ${resolutionNotes}`,
    ticket.id,
    'complaint'
  )

  return ticket
}

const closeComplaint = async (id: string, notes?: string): Promise<Complaint> => {
  const db = getDb(COMPLAINTS_KEY, seedComplaints)
  const idx = db.findIndex(c => c.id === id)
  if (idx === -1) throw new Error(`Complaint ${id} not found`)

  const ticket = db[idx]
  const now = new Date().toISOString()

  ticket.status = 'closed'
  if (!ticket.resolvedAt) {
    ticket.resolvedAt = now
    ticket.resolvedBy = 'Admin Operator'
  }
  ticket.updatedAt = now
  ticket.timeline.push({
    action: 'Ticket Closed',
    actor: 'Admin Operator',
    timestamp: now,
    notes: notes || 'Ticket closed'
  })

  db[idx] = ticket
  saveDb(COMPLAINTS_KEY, db)

  logAuditAction(
    `Closed Complaint: ${ticket.id}`,
    `Ticket finalized and closed. Operator notes: ${notes || 'None'}`,
    ticket.id,
    'complaint'
  )

  return ticket
}

export const OperationsService = {
  // Rides
  getRides,
  getRideById,

  // SOS
  getSOSAlerts,
  getSOSAlertById,
  acknowledgeSOS,
  resolveSOS,

  // Complaints
  getComplaints,
  getComplaintById,
  createComplaint,
  assignComplaint,
  updateComplaintStatus,
  resolveComplaint,
  closeComplaint
}

export default OperationsService
