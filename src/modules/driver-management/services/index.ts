import type { QueryParams, PaginatedResponse } from '@/shared/types'
import type {
  DriverApplicationDetails,
  DriverApplicationEntity,
  DriverEntity,
  DriverDetails,
  VehicleEntity,
  VehicleInfo,
  DriverKycDocument,
  ApplicationStatus,
} from '../types'

import { logAuditAction } from '@/shared/services/auditLogger'

const APPLICATIONS_DB_KEY = 'zaroorat_driver_applications_db'
const DRIVERS_DB_KEY = 'zaroorat_drivers_db'

// ─── Mock Data Helpers ─────────────────────────────────────────────────────

const makeDocs = (driverId: string, status: 'pending' | 'approved'): DriverKycDocument[] => [
  { id: `doc-dlf-${driverId}`, driverId, docType: 'license_front', docNumber: 'DL-MH1220150045612', fileUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=600', expiryDate: '2030-12-31', verifyStatus: status },
  { id: `doc-dlb-${driverId}`, driverId, docType: 'license_back', docNumber: 'DL-MH1220150045612', fileUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=600', expiryDate: '2030-12-31', verifyStatus: status },
  { id: `doc-adf-${driverId}`, driverId, docType: 'aadhaar_front', docNumber: '423187652341', fileUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=600', verifyStatus: status },
  { id: `doc-adb-${driverId}`, driverId, docType: 'aadhaar_back', docNumber: '423187652341', fileUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=600', verifyStatus: status },
  { id: `doc-pan-${driverId}`, driverId, docType: 'pan', docNumber: 'ABCDE1234F', fileUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600', verifyStatus: status },
  { id: `doc-selfie-${driverId}`, driverId, docType: 'selfie', fileUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250', verifyStatus: status },
  { id: `doc-rc-${driverId}`, driverId, docType: 'rc', docNumber: 'RC-MH12PQ4567', fileUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600', verifyStatus: status },
  { id: `doc-ins-${driverId}`, driverId, docType: 'insurance', docNumber: 'INS-POL-987654', fileUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=600', expiryDate: '2027-08-20', verifyStatus: status },
  { id: `doc-prm-${driverId}`, driverId, docType: 'permit', docNumber: 'PRM-SRINAGAR-7712', fileUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=600', expiryDate: '2028-03-10', verifyStatus: status },
  { id: `doc-pol-${driverId}`, driverId, docType: 'pollution', docNumber: 'POL-332145', fileUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=600', expiryDate: '2027-02-15', verifyStatus: status },
  { id: `doc-fit-${driverId}`, driverId, docType: 'fitness', docNumber: 'FIT-554321', fileUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=600', expiryDate: '2027-06-30', verifyStatus: status },
]

const makeVehicle = (driverId: string, overrides: Partial<VehicleInfo> = {}): VehicleInfo => ({
  id: `veh-${driverId}`,
  driverId,
  vehicleType: 'cab',
  vehicleCategory: 'Sedan',
  brand: 'Maruti Suzuki',
  model: 'Swift Dzire',
  registrationPlate: 'MH-12-PQ-4567',
  registrationNumber: 'MH-12-PQ-4567',
  color: 'White',
  seatsCapacity: 4,
  seatCapacity: 4,
  manufacturingYear: 2021,
  rcNumber: 'RC-MH12PQ4567',
  insuranceNo: 'INS-POL-987654',
  insuranceExpiry: '2027-08-20',
  permitNo: 'PRM-SRINAGAR-7712',
  permitExpiry: '2028-03-10',
  pollutionNo: 'POL-332145',
  pollutionExpiry: '2027-02-15',
  fitnessNo: 'FIT-554321',
  fitnessExpiry: '2027-06-30',
  ...overrides,
})

const makeSeedApplications = (): DriverApplicationDetails[] => [
  {
    id: 'app-v1',
    applicationId: 'APP-2026-0001',
    driverId: 'd1',
    driverName: 'Rajesh Kumar',
    mobileNumber: '9765432101',
    vehicleType: 'cab',
    email: 'rajesh.k@gmail.com',
    gender: 'MALE',
    dateOfBirth: '1992-04-15',
    licenseNo: 'DL-MH1220150045612',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    applicationStatus: 'approved',
    source: 'driver_app',
    onlineStatus: 'offline',
    bgCheckStatus: 'clear',
    billingMode: 'subscription',
    ratingAvg: 4.9,
    totalTrips: 154,
    isAvailable: true,
    isBlocked: false,
    submittedAt: '2026-07-12T10:00:00Z',
    createdAt: '2026-07-12T10:00:00Z',
    updatedAt: '2026-07-12T10:00:00Z',
    country: 'India', state: 'Maharashtra', city: 'Pune', postcode: '411001',
    addressLine1: 'Flat 402, Shivajinagar', addressLine2: 'Near Shimla Office', landmark: 'Shimla Office',
    emergencyContactName: 'Ramesh Kumar', emergencyContactNumber: '9876543211',
    preferredLanguage: 'Hindi', referralCode: 'ZAROORAT100',
    panNumber: 'ABCDE1234F', aadhaarNumber: '423187652341',
    bankAccountName: 'Rajesh Kumar', bankAccountNumber: '123456789012',
    bankIfsc: 'SBIN0001234', bankName: 'State Bank of India', upiId: 'rajesh@okaxis',
    vehicle: makeVehicle('d1'),
    documents: makeDocs('d1', 'approved'),
    auditLogs: [
      { action: 'Application Submitted via Driver App', operator: 'Rajesh Kumar', timestamp: '2026-07-12T10:00:00Z' },
      { action: 'Application Approved & Driver Activated', operator: 'Admin Auditor', timestamp: '2026-07-13T12:00:00Z', notes: 'All documents verified successfully.' }
    ],
    timeline: [
      { id: 't1', action: 'Application Created', actor: 'Rajesh Kumar', timestamp: '2026-07-12T09:50:00Z', isSystem: true },
      { id: 't2', action: 'Aadhaar Front Uploaded', actor: 'Rajesh Kumar', timestamp: '2026-07-12T09:52:00Z', isSystem: true },
      { id: 't3', action: 'License Documents Uploaded', actor: 'Rajesh Kumar', timestamp: '2026-07-12T09:55:00Z', isSystem: true },
      { id: 't4', action: 'Vehicle Details Added', actor: 'Rajesh Kumar', timestamp: '2026-07-12T09:58:00Z', isSystem: true },
      { id: 't5', action: 'Application Submitted for Review', actor: 'Rajesh Kumar', timestamp: '2026-07-12T10:00:00Z', isSystem: false },
      { id: 't6', action: 'Reviewed by Operations Team', actor: 'Admin Auditor', timestamp: '2026-07-13T11:45:00Z', isSystem: false, notes: 'All documents verified.' },
      { id: 't7', action: 'Application Approved', actor: 'Admin Auditor', timestamp: '2026-07-13T12:00:00Z', isSystem: false, notes: 'Driver account activated.' },
    ],
  },
  {
    id: 'app-v2',
    applicationId: 'APP-2026-0002',
    driverId: 'd2',
    driverName: 'Sunil Verma',
    mobileNumber: '9765432102',
    vehicleType: 'auto',
    email: 'sunil.v@gmail.com',
    gender: 'MALE',
    dateOfBirth: '1995-10-22',
    licenseNo: 'DL-MH1220180012398',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    applicationStatus: 'pending_review',
    source: 'admin_manual',
    onlineStatus: 'offline',
    bgCheckStatus: 'in_progress',
    billingMode: 'commission',
    ratingAvg: 0,
    totalTrips: 0,
    isAvailable: false,
    isBlocked: false,
    submittedAt: '2026-07-14T15:24:00Z',
    createdAt: '2026-07-14T15:24:00Z',
    updatedAt: '2026-07-14T15:24:00Z',
    country: 'India', state: 'Karnataka', city: 'Bengaluru', postcode: '560001',
    addressLine1: 'House 12, Indiranagar 10th Cross', addressLine2: '', landmark: 'Metro Station',
    emergencyContactName: 'Sanjay Verma', emergencyContactNumber: '9876543212',
    preferredLanguage: 'Kannada', referralCode: '',
    panNumber: 'FGHIJ5678K', aadhaarNumber: '987654321012',
    bankAccountName: 'Sunil Verma', bankAccountNumber: '987654321098',
    bankIfsc: 'HDFC0000001', bankName: 'HDFC Bank', upiId: 'sunil@okhdfc',
    vehicle: makeVehicle('d2', { vehicleType: 'auto', vehicleCategory: 'Passenger Auto', brand: 'Bajaj', model: 'RE MaxIMA', registrationPlate: 'KA-03-TR-9876', color: 'Yellow', seatsCapacity: 3, seatCapacity: 3, manufacturingYear: 2020 }),
    documents: makeDocs('d2', 'pending'),
    auditLogs: [
      { action: 'Application Manually Created by Admin', operator: 'Admin Operator', timestamp: '2026-07-14T15:24:00Z' }
    ],
    timeline: [
      { id: 't1', action: 'Application Manually Created by Admin', actor: 'Admin Operator', timestamp: '2026-07-14T15:00:00Z', isSystem: false },
      { id: 't2', action: 'Documents Pre-filled by Admin', actor: 'Admin Operator', timestamp: '2026-07-14T15:20:00Z', isSystem: true },
      { id: 't3', action: 'Application Submitted for Review', actor: 'Admin Operator', timestamp: '2026-07-14T15:24:00Z', isSystem: false },
    ],
  },
  {
    id: 'app-v3',
    applicationId: 'APP-2026-0003',
    driverId: 'd3',
    driverName: 'Priya Mehta',
    mobileNumber: '9876543210',
    vehicleType: 'bike',
    email: 'priya.m@gmail.com',
    gender: 'FEMALE',
    dateOfBirth: '1998-06-15',
    licenseNo: 'DL-DL0420210009876',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    applicationStatus: 'under_review',
    source: 'driver_app',
    onlineStatus: 'offline',
    bgCheckStatus: 'in_progress',
    billingMode: 'commission',
    ratingAvg: 0,
    totalTrips: 0,
    isAvailable: false,
    isBlocked: false,
    submittedAt: '2026-07-15T09:10:00Z',
    createdAt: '2026-07-15T09:10:00Z',
    updatedAt: '2026-07-15T09:10:00Z',
    country: 'India', state: 'Delhi', city: 'New Delhi', postcode: '110001',
    addressLine1: 'B-12 Connaught Place', addressLine2: '', landmark: '',
    emergencyContactName: 'Ravi Mehta', emergencyContactNumber: '9988776655',
    preferredLanguage: 'Hindi', referralCode: '',
    panNumber: 'KLMNO9012P', aadhaarNumber: '123456789012',
    bankAccountName: 'Priya Mehta', bankAccountNumber: '112233445566',
    bankIfsc: 'ICIC0001234', bankName: 'ICICI Bank', upiId: 'priya@okicici',
    vehicle: makeVehicle('d3', { vehicleType: 'bike', vehicleCategory: 'Delivery Bike', brand: 'Honda', model: 'Activa 6G', registrationPlate: 'DL-04-MS-1212', color: 'Black', seatsCapacity: 1, seatCapacity: 1, manufacturingYear: 2022, fitnessNo: undefined, fitnessExpiry: undefined }),
    documents: makeDocs('d3', 'pending'),
    auditLogs: [
      { action: 'Application Submitted via Driver App', operator: 'Priya Mehta', timestamp: '2026-07-15T09:10:00Z' },
      { action: 'Application Picked Up for Review', operator: 'Admin Auditor', timestamp: '2026-07-15T11:30:00Z', notes: 'Starting document verification.' }
    ],
    timeline: [
      { id: 't1', action: 'Application Created', actor: 'Priya Mehta', timestamp: '2026-07-15T08:45:00Z', isSystem: true },
      { id: 't2', action: 'Selfie & Identity Documents Uploaded', actor: 'Priya Mehta', timestamp: '2026-07-15T09:00:00Z', isSystem: true },
      { id: 't3', action: 'Application Submitted for Review', actor: 'Priya Mehta', timestamp: '2026-07-15T09:10:00Z', isSystem: false },
      { id: 't4', action: 'Under Review – Docs Being Verified', actor: 'Admin Auditor', timestamp: '2026-07-15T11:30:00Z', isSystem: false, notes: 'Starting document checks.' },
    ],
  }
]

const makeSeedDrivers = (applications: DriverApplicationDetails[]): DriverDetails[] => {
  const approvedApps = applications.filter(a => a.applicationStatus === 'approved')
  return approvedApps.map(app => ({
    id: `drv-${app.driverId}`,
    applicationId: app.id,
    driverName: app.driverName,
    mobileNumber: app.mobileNumber,
    email: app.email,
    vehicleType: app.vehicleType,
    registrationPlate: app.vehicle?.registrationPlate,
    driverStatus: 'active' as const,
    ratingAvg: app.ratingAvg,
    totalTrips: app.totalTrips,
    walletBalance: 1250.50,
    profilePhotoUrl: app.profilePhotoUrl,
    joinedAt: app.updatedAt,
    lastActiveAt: new Date().toISOString(),
    isOnline: false,
    gender: app.gender,
    dateOfBirth: app.dateOfBirth,
    emergencyContactName: app.emergencyContactName,
    emergencyContactNumber: app.emergencyContactNumber,
    preferredLanguage: app.preferredLanguage,
    bgCheckStatus: app.bgCheckStatus,
    country: app.country,
    state: app.state,
    city: app.city,
    postcode: app.postcode,
    addressLine1: app.addressLine1,
    addressLine2: app.addressLine2,
    vehicle: app.vehicle,
    documents: app.documents,
    auditLogs: app.auditLogs,
    createdAt: app.createdAt,
    updatedAt: app.updatedAt,
  }))
}

// ─── Local DB Operations ───────────────────────────────────────────────────

const initApplicationsDb = (): DriverApplicationDetails[] => {
  const seed = makeSeedApplications()
  localStorage.setItem(APPLICATIONS_DB_KEY, JSON.stringify(seed))
  return seed
}

const getApplicationsDb = (): DriverApplicationDetails[] => {
  const raw = localStorage.getItem(APPLICATIONS_DB_KEY)
  if (!raw) return initApplicationsDb()
  try { return JSON.parse(raw) } catch { return initApplicationsDb() }
}

const saveApplicationsDb = (db: DriverApplicationDetails[]) => {
  localStorage.setItem(APPLICATIONS_DB_KEY, JSON.stringify(db))
}

const getDriversDb = (): DriverDetails[] => {
  const raw = localStorage.getItem(DRIVERS_DB_KEY)
  if (raw) {
    try { return JSON.parse(raw) } catch { /* fall through */ }
  }
  // Seed from approved applications
  const apps = getApplicationsDb()
  const drivers = makeSeedDrivers(apps)
  localStorage.setItem(DRIVERS_DB_KEY, JSON.stringify(drivers))
  return drivers
}

const saveDriversDb = (db: DriverDetails[]) => {
  localStorage.setItem(DRIVERS_DB_KEY, JSON.stringify(db))
}

// ─── Applications Service ──────────────────────────────────────────────────

const getApplications = async (params?: QueryParams): Promise<PaginatedResponse<DriverApplicationEntity>> => {
  const db = getApplicationsDb()
  const search = ((params?.search as string) || '').toLowerCase()
  const statusFilter = params?.status as string
  const sourceFilter = params?.source as string

  let filtered = db.map(item => ({
    id: item.id,
    applicationId: item.applicationId,
    driverId: item.driverId,
    driverName: item.driverName,
    mobileNumber: item.mobileNumber,
    vehicleType: item.vehicleType,
    applicationStatus: item.applicationStatus,
    source: item.source,
    submittedAt: item.submittedAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }))

  if (search) {
    filtered = filtered.filter(i =>
      i.driverName.toLowerCase().includes(search) ||
      i.mobileNumber.includes(search) ||
      i.applicationId.toLowerCase().includes(search)
    )
  }
  if (statusFilter && statusFilter !== 'all') {
    filtered = filtered.filter(i => i.applicationStatus === statusFilter)
  }
  if (sourceFilter && sourceFilter !== 'all') {
    filtered = filtered.filter(i => i.source === sourceFilter)
  }

  return {
    data: filtered,
    meta: { currentPage: 1, totalPages: Math.ceil(filtered.length / 10), pageSize: 10, totalCount: filtered.length }
  }
}

const getApplicationById = async (id: string): Promise<DriverApplicationDetails> => {
  const db = getApplicationsDb()
  const found = db.find(i => i.id === id)
  if (!found) throw new Error(`Application ${id} not found`)
  return found
}

const createApplication = async (data: any): Promise<DriverApplicationDetails> => {
  const db = getApplicationsDb()
  const driverId = `d-${Math.random().toString(36).substr(2, 9)}`
  const appNum = String(db.length + 1).padStart(4, '0')
  const now = new Date().toISOString()
  const action = data.registrationAction || 'submit_for_review'
  const appStatus: ApplicationStatus = action === 'approve_immediately' ? 'approved' : 'pending_review'

  const vehicle: VehicleInfo = {
    id: `veh-${driverId}`, driverId,
    vehicleType: data.vehicleType, vehicleCategory: data.vehicleCategory,
    brand: data.brand, model: data.model,
    registrationPlate: data.registrationNumber, registrationNumber: data.registrationNumber,
    color: data.color, seatsCapacity: Number(data.seatCapacity), seatCapacity: Number(data.seatCapacity),
    manufacturingYear: Number(data.manufacturingYear),
    rcNumber: data.rcNumber, rcUrl: data.rcUrl,
    insuranceNo: data.insuranceNo, insuranceExpiry: data.insuranceExpiry, insuranceUrl: data.insuranceUrl,
    permitNo: data.permitNo, permitExpiry: data.permitExpiry, permitUrl: data.permitUrl,
    pollutionNo: data.pollutionNo, pollutionExpiry: data.pollutionExpiry, pollutionUrl: data.pollutionUrl,
    fitnessNo: data.fitnessNo, fitnessExpiry: data.fitnessExpiry, fitnessUrl: data.fitnessUrl,
  }

  const newApp: DriverApplicationDetails = {
    id: `app-${Math.random().toString(36).substr(2, 9)}`,
    applicationId: `APP-2026-${appNum}`,
    driverId,
    driverName: data.fullName,
    mobileNumber: data.mobileNumber,
    vehicleType: data.vehicleType,
    email: data.email,
    gender: data.gender,
    dateOfBirth: data.dateOfBirth,
    licenseNo: data.licenseNo,
    profilePhotoUrl: data.profilePhotoUrl,
    applicationStatus: appStatus,
    source: 'admin_manual',
    onlineStatus: 'offline',
    bgCheckStatus: 'not_started',
    billingMode: data.billingMode,
    ratingAvg: 0,
    totalTrips: 0,
    isAvailable: false,
    isBlocked: false,
    submittedAt: now,
    createdAt: now,
    updatedAt: now,
    country: data.country, state: data.state, city: data.city, postcode: data.postcode,
    addressLine1: data.addressLine1, addressLine2: data.addressLine2, landmark: data.landmark,
    emergencyContactName: data.emergencyContactName, emergencyContactNumber: data.emergencyContactNumber,
    preferredLanguage: data.preferredLanguage, referralCode: data.referralCode,
    panNumber: data.panNumber, aadhaarNumber: data.aadhaarNumber,
    bankAccountName: data.bankAccountName, bankAccountNumber: data.bankAccountNumber,
    bankIfsc: data.bankIfsc, bankName: data.bankName, upiId: data.upiId,
    vehicle,
    documents: makeDocs(driverId, appStatus === 'approved' ? 'approved' : 'pending'),
    auditLogs: [{ action: action === 'approve_immediately' ? 'Application Created & Immediately Approved by Admin' : 'Application Manually Created & Submitted for Review', operator: 'Admin Operator', timestamp: now }],
    timeline: [
      { id: 'tl-1', action: 'Application Manually Created by Admin', actor: 'Admin Operator', timestamp: now, isSystem: false },
      ...(appStatus === 'approved' ? [{ id: 'tl-2', action: 'Application Immediately Approved', actor: 'Admin Operator', timestamp: now, isSystem: false, notes: 'Approved immediately via manual registration.' }] : []),
    ],
  }

  db.push(newApp)
  saveApplicationsDb(db)

  // If approved immediately, create a driver record
  if (appStatus === 'approved') {
    const drivers = getDriversDb()
    const newDriver: DriverDetails = {
      id: `drv-${driverId}`,
      applicationId: newApp.id,
      driverName: newApp.driverName,
      mobileNumber: newApp.mobileNumber,
      email: newApp.email,
      vehicleType: newApp.vehicleType,
      registrationPlate: vehicle.registrationPlate,
      driverStatus: 'active',
      ratingAvg: 5.0,
      totalTrips: 0,
      walletBalance: 0,
      profilePhotoUrl: newApp.profilePhotoUrl,
      joinedAt: now,
      isOnline: false,
      gender: newApp.gender,
      dateOfBirth: newApp.dateOfBirth,
      emergencyContactName: newApp.emergencyContactName,
      emergencyContactNumber: newApp.emergencyContactNumber,
      preferredLanguage: newApp.preferredLanguage,
      bgCheckStatus: 'not_started',
      country: newApp.country, state: newApp.state, city: newApp.city, postcode: newApp.postcode,
      addressLine1: newApp.addressLine1, addressLine2: newApp.addressLine2,
      vehicle, documents: newApp.documents, auditLogs: newApp.auditLogs,
      createdAt: now, updatedAt: now,
    }
    drivers.push(newDriver)
    saveDriversDb(drivers)
  }

  return newApp
}

const updateApplication = async (id: string, data: any): Promise<DriverApplicationDetails> => {
  const db = getApplicationsDb()
  const idx = db.findIndex(i => i.id === id)
  if (idx === -1) throw new Error(`Application ${id} not found`)
  const now = new Date().toISOString()
  const found = db[idx]

  const vehicle: VehicleInfo = {
    ...found.vehicle,
    id: found.vehicle?.id || `veh-${found.driverId}`,
    driverId: found.driverId,
    vehicleType: data.vehicleType,
    vehicleCategory: data.vehicleCategory,
    brand: data.brand, model: data.model,
    registrationPlate: data.registrationNumber || found.vehicle?.registrationPlate || '',
    registrationNumber: data.registrationNumber,
    color: data.color,
    seatsCapacity: Number(data.seatCapacity) || found.vehicle?.seatsCapacity || 4,
    seatCapacity: Number(data.seatCapacity),
    manufacturingYear: Number(data.manufacturingYear),
    rcNumber: data.rcNumber, rcUrl: data.rcUrl,
    insuranceNo: data.insuranceNo, insuranceExpiry: data.insuranceExpiry, insuranceUrl: data.insuranceUrl,
    permitNo: data.permitNo, permitExpiry: data.permitExpiry, permitUrl: data.permitUrl,
    pollutionNo: data.pollutionNo, pollutionExpiry: data.pollutionExpiry, pollutionUrl: data.pollutionUrl,
    fitnessNo: data.fitnessNo, fitnessExpiry: data.fitnessExpiry, fitnessUrl: data.fitnessUrl,
  }

  db[idx] = {
    ...found,
    driverName: data.fullName, mobileNumber: data.mobileNumber, vehicleType: data.vehicleType,
    email: data.email, gender: data.gender, dateOfBirth: data.dateOfBirth, licenseNo: data.licenseNo,
    profilePhotoUrl: data.profilePhotoUrl,
    country: data.country, state: data.state, city: data.city, postcode: data.postcode,
    addressLine1: data.addressLine1, addressLine2: data.addressLine2, landmark: data.landmark,
    emergencyContactName: data.emergencyContactName, emergencyContactNumber: data.emergencyContactNumber,
    preferredLanguage: data.preferredLanguage, referralCode: data.referralCode,
    panNumber: data.panNumber, aadhaarNumber: data.aadhaarNumber,
    bankAccountName: data.bankAccountName, bankAccountNumber: data.bankAccountNumber,
    bankIfsc: data.bankIfsc, bankName: data.bankName, upiId: data.upiId,
    updatedAt: now, vehicle,
    auditLogs: [...found.auditLogs, { action: 'Application Details Updated by Admin', operator: 'Admin Operator', timestamp: now }],
    timeline: [...(found.timeline || []), { id: `tl-${Date.now()}`, action: 'Application Details Edited by Admin', actor: 'Admin Operator', timestamp: now, isSystem: false }],
  }
  saveApplicationsDb(db)
  return db[idx]
}

const deleteApplication = async (id: string): Promise<void> => {
  const db = getApplicationsDb()
  saveApplicationsDb(db.filter(i => i.id !== id))
}

const approveApplication = async (id: string, notes?: string, billingMode?: 'free' | 'commission' | 'subscription'): Promise<DriverApplicationDetails> => {
  const db = getApplicationsDb()
  const idx = db.findIndex(i => i.id === id)
  if (idx === -1) throw new Error(`Application ${id} not found`)
  const now = new Date().toISOString()

  db[idx].applicationStatus = 'approved'
  if (billingMode) db[idx].billingMode = billingMode
  db[idx].updatedAt = now
  db[idx].documents.forEach(d => d.verifyStatus = 'approved')
  db[idx].auditLogs.push({ action: 'Application Approved – Driver Activated', operator: 'Admin Auditor', timestamp: now, notes })
  db[idx].timeline = [...(db[idx].timeline || []), { id: `tl-${Date.now()}`, action: 'Application Approved', actor: 'Admin Auditor', timestamp: now, isSystem: false, notes }]
  saveApplicationsDb(db)

  logAuditAction(
    'Driver Registration Approved',
    notes || 'All KYC documents successfully verified.',
    db[idx].driverId,
    'driver',
    'Admin Auditor'
  )

  // Create driver record
  const drivers = getDriversDb()
  const app = db[idx]
  const exists = drivers.find(d => d.applicationId === id)
  if (!exists) {
    const newDriver: DriverDetails = {
      id: `drv-${app.driverId}`,
      applicationId: id,
      driverName: app.driverName,
      mobileNumber: app.mobileNumber,
      email: app.email,
      vehicleType: app.vehicleType,
      registrationPlate: app.vehicle?.registrationPlate,
      driverStatus: 'active',
      ratingAvg: 4.8,
      totalTrips: 23,
      walletBalance: 25.5,
      profilePhotoUrl: app.profilePhotoUrl,
      joinedAt: now,
      isOnline: false,
      gender: app.gender,
      dateOfBirth: app.dateOfBirth,
      emergencyContactName: app.emergencyContactName,
      emergencyContactNumber: app.emergencyContactNumber,
      preferredLanguage: app.preferredLanguage,
      bgCheckStatus: 'clear',
      country: app.country,
      state: app.state,
      city: app.city,
      postcode: app.postcode,
      addressLine1: app.addressLine1,
      addressLine2: app.addressLine2,
      vehicle: app.vehicle,
      documents: app.documents,
      billingMode: billingMode || app.billingMode || 'free',
      earningsToday: 350,
      earningsWeek: 1450,
      earningsMonth: 5800,
      outstandingDues: 24.5,
      ratingsBreakdown: { 5: 18, 4: 4, 3: 1, 2: 0, 1: 0 },
      categoryScores: { behaviour: 4.9, driving: 4.7, punctuality: 4.6, cleanliness: 4.8 },
      recentReviews: [
        { id: "rev-1", date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), riderName: "Sana Mir", score: 5, comment: "Polite partner, smooth driving." },
        { id: "rev-2", date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), riderName: "Adil Bhat", score: 4, comment: "On time drop." }
      ],
      ledger: [
        { id: "led-1", date: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), type: "EARNING", amount: 350, balanceAfter: 350, rideId: "RIDE-1002" },
        { id: "led-2", date: new Date(Date.now() - 1000 * 60 * 60 * 2.9).toISOString(), type: "COMMISSION_DUE", amount: -24.5, balanceAfter: 325.5, rideId: "RIDE-1002" },
        { id: "led-3", date: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(), type: "PAYOUT", amount: -300, balanceAfter: 25.5 }
      ],
      timeline: [
        { id: "tl-1", action: "Application Created", actor: app.driverName, timestamp: app.submittedAt || now, isSystem: true },
        { id: "tl-2", action: "KYC Verification Approved", actor: "Admin Auditor", timestamp: now, isSystem: false }
      ],
      auditLogs: app.auditLogs,
      createdAt: now,
      updatedAt: now,
    }
    drivers.push(newDriver)
    saveDriversDb(drivers)
  }

  return db[idx]
}

const rejectApplication = async (id: string, notes?: string): Promise<DriverApplicationDetails> => {
  const db = getApplicationsDb()
  const idx = db.findIndex(i => i.id === id)
  if (idx === -1) throw new Error(`Application ${id} not found`)
  const now = new Date().toISOString()
  db[idx].applicationStatus = 'rejected'
  db[idx].updatedAt = now
  db[idx].auditLogs.push({ action: 'Application Rejected', operator: 'Admin Auditor', timestamp: now, notes })
  db[idx].timeline = [...(db[idx].timeline || []), { id: `tl-${Date.now()}`, action: 'Application Rejected', actor: 'Admin Auditor', timestamp: now, isSystem: false, notes }]
  saveApplicationsDb(db)

  logAuditAction(
    'Driver Registration Rejected',
    notes || 'KYC verification check failed.',
    db[idx].driverId,
    'driver',
    'Admin Auditor'
  )

  return db[idx]
}

const requestResubmission = async (id: string, notes?: string): Promise<DriverApplicationDetails> => {
  const db = getApplicationsDb()
  const idx = db.findIndex(i => i.id === id)
  if (idx === -1) throw new Error(`Application ${id} not found`)
  const now = new Date().toISOString()
  db[idx].applicationStatus = 'resubmission_required'
  db[idx].updatedAt = now
  db[idx].auditLogs.push({ action: 'Resubmission Requested from Driver', operator: 'Admin Auditor', timestamp: now, notes })
  db[idx].timeline = [...(db[idx].timeline || []), { id: `tl-${Date.now()}`, action: 'Resubmission Requested', actor: 'Admin Auditor', timestamp: now, isSystem: false, notes }]
  saveApplicationsDb(db)

  logAuditAction(
    'Driver Application Resubmission Requested',
    notes || 'Re-upload of KYC credentials requested.',
    db[idx].driverId,
    'driver',
    'Admin Auditor'
  )

  return db[idx]
}

const verifyApplicationDocument = async (applicationId: string, docType: string, status: 'approved' | 'rejected' | 'pending' | 'reupload_requested', comment?: string): Promise<DriverApplicationDetails> => {
  const db = getApplicationsDb()
  const idx = db.findIndex(i => i.id === applicationId)
  if (idx === -1) throw new Error(`Application ${applicationId} not found`)
  const now = new Date().toISOString()
  const doc = db[idx].documents.find(d => d.docType === docType)
  if (doc) { doc.verifyStatus = status; doc.comment = comment }
  db[idx].auditLogs.push({ action: `Document "${docType}" ${status}`, operator: 'Admin Auditor', timestamp: now, notes: comment })
  db[idx].timeline = [...(db[idx].timeline || []), { id: `tl-${Date.now()}`, action: `${docType} Document ${status}`, actor: 'Admin Auditor', timestamp: now, isSystem: true }]
  saveApplicationsDb(db)
  return db[idx]
}

// ─── Drivers Service ───────────────────────────────────────────────────────

const getDrivers = async (params?: QueryParams): Promise<PaginatedResponse<DriverEntity>> => {
  const db = getDriversDb()
  const search = ((params?.search as string) || '').toLowerCase()
  const statusFilter = params?.status as string

  let filtered = db.map(d => ({
    id: d.id, applicationId: d.applicationId, driverName: d.driverName,
    mobileNumber: d.mobileNumber, email: d.email, vehicleType: d.vehicleType,
    registrationPlate: d.registrationPlate, driverStatus: d.driverStatus,
    ratingAvg: d.ratingAvg, totalTrips: d.totalTrips, walletBalance: d.walletBalance,
    profilePhotoUrl: d.profilePhotoUrl, joinedAt: d.joinedAt, lastActiveAt: d.lastActiveAt,
    isOnline: d.isOnline, createdAt: d.createdAt, updatedAt: d.updatedAt,
  }))

  if (search) {
    filtered = filtered.filter(d =>
      d.driverName.toLowerCase().includes(search) ||
      d.mobileNumber.includes(search)
    )
  }
  if (statusFilter && statusFilter !== 'all') {
    filtered = filtered.filter(d => d.driverStatus === statusFilter)
  }

  return { data: filtered, meta: { currentPage: 1, totalPages: Math.ceil(filtered.length / 10), pageSize: 10, totalCount: filtered.length } }
}

const getDriverById = async (id: string): Promise<DriverDetails> => {
  const db = getDriversDb()
  const idx = db.findIndex(d => d.id === id)
  if (idx === -1) throw new Error(`Driver ${id} not found`)
  
  const found = db[idx]
  let updated = false
  
  if (!found.ratingsBreakdown) {
    found.ratingsBreakdown = { 5: 18, 4: 4, 3: 1, 2: 0, 1: 0 }
    updated = true
  }
  if (!found.categoryScores) {
    found.categoryScores = { behaviour: 4.9, driving: 4.7, punctuality: 4.6, cleanliness: 4.8 }
    updated = true
  }
  if (!found.recentReviews) {
    found.recentReviews = [
      { id: "rev-1", date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), riderName: "Sana Mir", score: 5, comment: "Polite partner, smooth driving." },
      { id: "rev-2", date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), riderName: "Adil Bhat", score: 4, comment: "On time drop." }
    ]
    updated = true
  }
  if (!found.ledger) {
    found.ledger = [
      { id: "led-1", date: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), type: "EARNING", amount: 350, balanceAfter: 350, rideId: "RIDE-1002" },
      { id: "led-2", date: new Date(Date.now() - 1000 * 60 * 60 * 2.9).toISOString(), type: "COMMISSION_DUE", amount: -24.5, balanceAfter: 325.5, rideId: "RIDE-1002" },
      { id: "led-3", date: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(), type: "PAYOUT", amount: -300, balanceAfter: 25.5 }
    ]
    updated = true
  }
  if (!found.billingMode) {
    found.billingMode = 'free'
    found.outstandingDues = 24.5
    found.earningsToday = 350
    found.earningsWeek = 1450
    found.earningsMonth = 5800
    updated = true
  }
  if (!found.timeline) {
    found.timeline = [
      { id: "tl-1", action: "Application Created", actor: found.driverName, timestamp: found.joinedAt || found.createdAt || new Date().toISOString(), isSystem: true },
      { id: "tl-2", action: "KYC Verification Approved", actor: "Admin Auditor", timestamp: found.joinedAt || found.createdAt || new Date().toISOString(), isSystem: false }
    ]
    updated = true
  }
  
  if (updated) {
    db[idx] = found
    saveDriversDb(db)
  }
  
  return found
}

const updateDriverStatus = async (id: string, status: 'suspended' | 'blocked' | 'active', notes?: string): Promise<DriverDetails> => {
  const db = getDriversDb()
  const idx = db.findIndex(d => d.id === id)
  if (idx === -1) throw new Error(`Driver ${id} not found`)
  const now = new Date().toISOString()
  db[idx].driverStatus = status
  db[idx].updatedAt = now
  db[idx].auditLogs.push({ action: `Driver Status Changed to ${status.toUpperCase()}`, operator: 'Admin Operator', timestamp: now, notes })
  db[idx].timeline = [...(db[idx].timeline || []), { id: `tl-${Date.now()}`, action: `Driver Status Updated to ${status.toUpperCase()}`, actor: 'Admin Operator', timestamp: now, isSystem: false, notes }]
  saveDriversDb(db)

  logAuditAction(
    `Driver Status Updated: ${status.toUpperCase()}`,
    notes || `Account login state adjusted manually to ${status.toUpperCase()}.`,
    id,
    'driver',
    'Admin Operator'
  )

  return db[idx]
}

// ─── Vehicles Service ──────────────────────────────────────────────────────

const getVehicles = async (params?: QueryParams): Promise<PaginatedResponse<VehicleEntity>> => {
  const db = getDriversDb()
  const search = ((params?.search as string) || '').toLowerCase()

  let vehicles: VehicleEntity[] = db
    .filter(d => !!d.vehicle)
    .map(d => ({
      id: d.vehicle!.id,
      driverId: d.id,
      driverName: d.driverName,
      registrationPlate: d.vehicle!.registrationPlate,
      vehicleType: d.vehicle!.vehicleType,
      vehicleCategory: d.vehicle!.vehicleCategory,
      brand: d.vehicle!.brand,
      model: d.vehicle!.model,
      color: d.vehicle!.color,
      manufacturingYear: d.vehicle!.manufacturingYear,
      insuranceExpiry: d.vehicle!.insuranceExpiry,
      permitExpiry: d.vehicle!.permitExpiry,
      fitnessExpiry: d.vehicle!.fitnessExpiry,
      pollutionExpiry: d.vehicle!.pollutionExpiry,
      isActive: d.driverStatus === 'active',
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }))

  if (search) {
    vehicles = vehicles.filter(v =>
      v.registrationPlate.toLowerCase().includes(search) ||
      v.driverName.toLowerCase().includes(search)
    )
  }

  return { data: vehicles, meta: { currentPage: 1, totalPages: Math.ceil(vehicles.length / 10), pageSize: 10, totalCount: vehicles.length } }
}

const getVehicleById = async (id: string): Promise<VehicleEntity & { vehicle: VehicleInfo; driver: DriverEntity }> => {
  const db = getDriversDb()
  const driver = db.find(d => d.vehicle?.id === id)
  if (!driver) throw new Error(`Vehicle ${id} not found`)
  return {
    id: driver.vehicle!.id,
    driverId: driver.id,
    driverName: driver.driverName,
    registrationPlate: driver.vehicle!.registrationPlate,
    vehicleType: driver.vehicle!.vehicleType,
    vehicleCategory: driver.vehicle!.vehicleCategory,
    brand: driver.vehicle!.brand,
    model: driver.vehicle!.model,
    color: driver.vehicle!.color,
    manufacturingYear: driver.vehicle!.manufacturingYear,
    insuranceExpiry: driver.vehicle!.insuranceExpiry,
    permitExpiry: driver.vehicle!.permitExpiry,
    fitnessExpiry: driver.vehicle!.fitnessExpiry,
    pollutionExpiry: driver.vehicle!.pollutionExpiry,
    isActive: driver.driverStatus === 'active',
    createdAt: driver.createdAt,
    updatedAt: driver.updatedAt,
    vehicle: driver.vehicle!,
    driver: {
      id: driver.id, applicationId: driver.applicationId, driverName: driver.driverName,
      mobileNumber: driver.mobileNumber, email: driver.email, vehicleType: driver.vehicleType,
      registrationPlate: driver.registrationPlate, driverStatus: driver.driverStatus,
      ratingAvg: driver.ratingAvg, totalTrips: driver.totalTrips, walletBalance: driver.walletBalance,
      profilePhotoUrl: driver.profilePhotoUrl, joinedAt: driver.joinedAt, lastActiveAt: driver.lastActiveAt,
      isOnline: driver.isOnline, createdAt: driver.createdAt, updatedAt: driver.updatedAt,
    },
  }
}

const updateDriverBillingMode = async (
  id: string,
  billingMode: 'free' | 'commission' | 'subscription',
  subscriptionType?: 'monthly' | 'weekly' | 'daily',
  notes?: string
): Promise<DriverDetails> => {
  const db = getDriversDb()
  const idx = db.findIndex(d => d.id === id)
  if (idx === -1) throw new Error(`Driver ${id} not found`)
  const now = new Date().toISOString()
  db[idx].billingMode = billingMode
  db[idx].subscriptionType = subscriptionType
  db[idx].updatedAt = now
  
  const planLabel = billingMode === 'subscription' && subscriptionType 
    ? `Subscription (${subscriptionType})` 
    : billingMode === 'commission' 
      ? '7% Commission' 
      : 'Free Month'
      
  db[idx].auditLogs.push({
    action: `Monetization Plan Updated to ${planLabel}`,
    operator: 'Admin Operator',
    timestamp: now,
    notes
  })
  db[idx].timeline = [
    ...(db[idx].timeline || []),
    {
      id: `tl-${Date.now()}`,
      action: `Billing Plan Changed to ${planLabel}`,
      actor: 'Admin Operator',
      timestamp: now,
      isSystem: false,
      notes
    }
  ]
  saveDriversDb(db)

  logAuditAction(
    `Monetization Plan Adjusted: ${planLabel}`,
    notes || `Monetization scheme changed to ${planLabel}.`,
    id,
    'driver',
    'Admin Operator'
  )

  return db[idx]
}

const addDriverTimelineNote = async (id: string, notes: string): Promise<DriverDetails> => {
  const db = getDriversDb()
  const idx = db.findIndex(d => d.id === id)
  if (idx === -1) throw new Error(`Driver ${id} not found`)
  const now = new Date().toISOString()
  db[idx].updatedAt = now
  db[idx].timeline = [
    ...(db[idx].timeline || []),
    {
      id: `tl-${Date.now()}`,
      action: 'Admin Support Note Added',
      actor: 'Admin Support',
      timestamp: now,
      isSystem: false,
      notes
    }
  ]
  saveDriversDb(db)
  return db[idx]
}

// ─── Exports ───────────────────────────────────────────────────────────────

export const DriverManagementService = {
  // Applications
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
  approveApplication,
  rejectApplication,
  requestResubmission,
  verifyApplicationDocument,

  // Drivers
  getDrivers,
  getDriverById,
  suspendDriver: (id: string, notes?: string) => updateDriverStatus(id, 'suspended', notes),
  blockDriver: (id: string, notes?: string) => updateDriverStatus(id, 'blocked', notes),
  activateDriver: (id: string, notes?: string) => updateDriverStatus(id, 'active', notes),
  updateDriverBillingMode,
  addDriverTimelineNote,

  // Vehicles
  getVehicles,
  getVehicleById,
}

export default DriverManagementService
