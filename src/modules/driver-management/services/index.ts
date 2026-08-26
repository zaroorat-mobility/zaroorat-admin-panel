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
import * as driversApi from '../api'

const MANUAL_APPLICATIONS_DB_KEY = 'zaroorat_manual_applications_db'

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

const getManualApplicationsDb = (): DriverApplicationDetails[] => {
  const raw = localStorage.getItem(MANUAL_APPLICATIONS_DB_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as DriverApplicationDetails[]
  } catch {
    return []
  }
}

const saveManualApplicationsDb = (db: DriverApplicationDetails[]) => {
  localStorage.setItem(MANUAL_APPLICATIONS_DB_KEY, JSON.stringify(db))
}

const toListItem = (item: DriverApplicationDetails): DriverApplicationEntity => ({
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
})

const isManualApplication = (id: string): boolean =>
  getManualApplicationsDb().some((row) => row.id === id)

// ─── Applications ──────────────────────────────────────────────────────────

const getApplications = async (
  params?: QueryParams,
): Promise<PaginatedResponse<DriverApplicationEntity>> => {
  const apiResult = await driversApi.getApplications(params)
  const manual = getManualApplicationsDb().map(toListItem)
  const apiIds = new Set(apiResult.data.map((row) => row.id))
  const merged = [...apiResult.data, ...manual.filter((row) => !apiIds.has(row.id))]

  return {
    data: merged,
    meta: {
      ...apiResult.meta,
      totalCount: merged.length,
      totalPages: Math.max(1, Math.ceil(merged.length / (apiResult.meta.pageSize || 50))),
    },
  }
}

const getApplicationById = async (id: string): Promise<DriverApplicationDetails> => {
  const manual = getManualApplicationsDb().find((row) => row.id === id)
  if (manual) return manual
  return driversApi.getApplicationById(id)
}

const createApplication = async (data: any): Promise<DriverApplicationDetails> => {
  const db = getManualApplicationsDb()
  const driverId = `d-${Math.random().toString(36).slice(2, 11)}`
  const appNum = String(db.length + 1).padStart(4, '0')
  const now = new Date().toISOString()
  const action = data.registrationAction || 'submit_for_review'
  const appStatus: ApplicationStatus = action === 'approve_immediately' ? 'approved' : 'pending_review'

  const vehicle: VehicleInfo = {
    id: `veh-${driverId}`,
    driverId,
    vehicleType: data.vehicleType,
    vehicleCategory: data.vehicleCategory,
    brand: data.brand,
    model: data.model,
    registrationPlate: data.registrationNumber,
    registrationNumber: data.registrationNumber,
    color: data.color,
    seatsCapacity: Number(data.seatCapacity),
    seatCapacity: Number(data.seatCapacity),
    manufacturingYear: Number(data.manufacturingYear),
    rcNumber: data.rcNumber,
    rcUrl: data.rcUrl,
    insuranceNo: data.insuranceNo,
    insuranceExpiry: data.insuranceExpiry,
    insuranceUrl: data.insuranceUrl,
    permitNo: data.permitNo,
    permitExpiry: data.permitExpiry,
    permitUrl: data.permitUrl,
    pollutionNo: data.pollutionNo,
    pollutionExpiry: data.pollutionExpiry,
    pollutionUrl: data.pollutionUrl,
    fitnessNo: data.fitnessNo,
    fitnessExpiry: data.fitnessExpiry,
    fitnessUrl: data.fitnessUrl,
  }

  const newApp: DriverApplicationDetails = {
    id: `app-${Math.random().toString(36).slice(2, 11)}`,
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
    country: data.country,
    state: data.state,
    city: data.city,
    postcode: data.postcode,
    addressLine1: data.addressLine1,
    addressLine2: data.addressLine2,
    landmark: data.landmark,
    emergencyContactName: data.emergencyContactName,
    emergencyContactNumber: data.emergencyContactNumber,
    preferredLanguage: data.preferredLanguage,
    referralCode: data.referralCode,
    panNumber: data.panNumber,
    aadhaarNumber: data.aadhaarNumber,
    bankAccountName: data.bankAccountName,
    bankAccountNumber: data.bankAccountNumber,
    bankIfsc: data.bankIfsc,
    bankName: data.bankName,
    upiId: data.upiId,
    vehicle,
    documents: makeDocs(driverId, appStatus === 'approved' ? 'approved' : 'pending'),
    auditLogs: [
      {
        action:
          action === 'approve_immediately'
            ? 'Application Created & Immediately Approved by Admin'
            : 'Application Manually Created & Submitted for Review',
        operator: 'Admin Operator',
        timestamp: now,
      },
    ],
    timeline: [
      {
        id: 'tl-1',
        action: 'Application Manually Created by Admin',
        actor: 'Admin Operator',
        timestamp: now,
        isSystem: false,
      },
      ...(appStatus === 'approved'
        ? [
            {
              id: 'tl-2',
              action: 'Application Immediately Approved',
              actor: 'Admin Operator',
              timestamp: now,
              isSystem: false,
              notes: 'Approved immediately via manual registration.',
            },
          ]
        : []),
    ],
  }

  db.push(newApp)
  saveManualApplicationsDb(db)
  return newApp
}

const updateApplication = async (id: string, data: any): Promise<DriverApplicationDetails> => {
  const db = getManualApplicationsDb()
  const idx = db.findIndex((row) => row.id === id)
  if (idx === -1) {
    throw new Error('Editing API-backed applications is not available yet')
  }
  const now = new Date().toISOString()
  const found = db[idx]

  const vehicle: VehicleInfo = {
    ...found.vehicle,
    id: found.vehicle?.id || `veh-${found.driverId}`,
    driverId: found.driverId,
    vehicleType: data.vehicleType,
    vehicleCategory: data.vehicleCategory,
    brand: data.brand,
    model: data.model,
    registrationPlate: data.registrationNumber || found.vehicle?.registrationPlate || '',
    registrationNumber: data.registrationNumber,
    color: data.color,
    seatsCapacity: Number(data.seatCapacity) || found.vehicle?.seatsCapacity || 4,
    seatCapacity: Number(data.seatCapacity),
    manufacturingYear: Number(data.manufacturingYear),
    rcNumber: data.rcNumber,
    rcUrl: data.rcUrl,
    insuranceNo: data.insuranceNo,
    insuranceExpiry: data.insuranceExpiry,
    insuranceUrl: data.insuranceUrl,
    permitNo: data.permitNo,
    permitExpiry: data.permitExpiry,
    permitUrl: data.permitUrl,
    pollutionNo: data.pollutionNo,
    pollutionExpiry: data.pollutionExpiry,
    pollutionUrl: data.pollutionUrl,
    fitnessNo: data.fitnessNo,
    fitnessExpiry: data.fitnessExpiry,
    fitnessUrl: data.fitnessUrl,
  }

  db[idx] = {
    ...found,
    driverName: data.fullName,
    mobileNumber: data.mobileNumber,
    vehicleType: data.vehicleType,
    email: data.email,
    gender: data.gender,
    dateOfBirth: data.dateOfBirth,
    licenseNo: data.licenseNo,
    profilePhotoUrl: data.profilePhotoUrl,
    country: data.country,
    state: data.state,
    city: data.city,
    postcode: data.postcode,
    addressLine1: data.addressLine1,
    addressLine2: data.addressLine2,
    landmark: data.landmark,
    emergencyContactName: data.emergencyContactName,
    emergencyContactNumber: data.emergencyContactNumber,
    preferredLanguage: data.preferredLanguage,
    referralCode: data.referralCode,
    panNumber: data.panNumber,
    aadhaarNumber: data.aadhaarNumber,
    bankAccountName: data.bankAccountName,
    bankAccountNumber: data.bankAccountNumber,
    bankIfsc: data.bankIfsc,
    bankName: data.bankName,
    upiId: data.upiId,
    updatedAt: now,
    vehicle,
    auditLogs: [
      ...found.auditLogs,
      { action: 'Application Details Updated by Admin', operator: 'Admin Operator', timestamp: now },
    ],
    timeline: [
      ...(found.timeline || []),
      {
        id: `tl-${Date.now()}`,
        action: 'Application Details Edited by Admin',
        actor: 'Admin Operator',
        timestamp: now,
        isSystem: false,
      },
    ],
  }
  saveManualApplicationsDb(db)
  return db[idx]
}

const deleteApplication = async (id: string): Promise<void> => {
  const db = getManualApplicationsDb()
  if (!db.some((row) => row.id === id)) {
    throw new Error('Deleting API-backed applications is not available yet')
  }
  saveManualApplicationsDb(db.filter((row) => row.id !== id))
}

const approveManualApplication = async (
  id: string,
  notes?: string,
  billingMode?: 'free' | 'commission' | 'subscription',
): Promise<DriverApplicationDetails> => {
  const db = getManualApplicationsDb()
  const idx = db.findIndex((row) => row.id === id)
  if (idx === -1) throw new Error(`Application ${id} not found`)
  const now = new Date().toISOString()
  db[idx].applicationStatus = 'approved'
  if (billingMode) db[idx].billingMode = billingMode
  db[idx].updatedAt = now
  db[idx].documents.forEach((d) => {
    d.verifyStatus = 'approved'
  })
  db[idx].auditLogs.push({
    action: 'Application Approved – Driver Activated',
    operator: 'Admin Auditor',
    timestamp: now,
    notes,
  })
  db[idx].timeline = [
    ...(db[idx].timeline || []),
    {
      id: `tl-${Date.now()}`,
      action: 'Application Approved',
      actor: 'Admin Auditor',
      timestamp: now,
      isSystem: false,
      notes,
    },
  ]
  saveManualApplicationsDb(db)
  return db[idx]
}

const mutateManualStatus = async (
  id: string,
  status: ApplicationStatus,
  action: string,
  notes?: string,
): Promise<DriverApplicationDetails> => {
  const db = getManualApplicationsDb()
  const idx = db.findIndex((row) => row.id === id)
  if (idx === -1) throw new Error(`Application ${id} not found`)
  const now = new Date().toISOString()
  db[idx].applicationStatus = status
  db[idx].updatedAt = now
  db[idx].auditLogs.push({
    action,
    operator: 'Admin Auditor',
    timestamp: now,
    notes,
  })
  db[idx].timeline = [
    ...(db[idx].timeline || []),
    {
      id: `tl-${Date.now()}`,
      action,
      actor: 'Admin Auditor',
      timestamp: now,
      isSystem: false,
      notes,
    },
  ]
  saveManualApplicationsDb(db)
  return db[idx]
}

const approveApplication = async (
  id: string,
  notes?: string,
  billingMode?: 'free' | 'commission' | 'subscription',
): Promise<DriverApplicationDetails> => {
  if (isManualApplication(id)) {
    return approveManualApplication(id, notes, billingMode)
  }
  // Backend verify ignores billing for now; UI still collects the plan for later.
  return driversApi.approveApplication(id, notes)
}

const rejectApplication = async (id: string, notes?: string): Promise<DriverApplicationDetails> => {
  if (isManualApplication(id)) {
    return mutateManualStatus(id, 'rejected', 'Application Rejected', notes)
  }
  return driversApi.rejectApplication(id, notes)
}

const requestResubmission = async (
  id: string,
  notes?: string,
): Promise<DriverApplicationDetails> => {
  if (isManualApplication(id)) {
    return mutateManualStatus(id, 'resubmission_required', 'Resubmission Requested', notes)
  }
  return driversApi.requestApplicationResubmission(id, notes)
}

const verifyApplicationDocument = async (
  applicationId: string,
  documentId: string,
  status: 'approved' | 'rejected' | 'pending' | 'reupload_requested',
  comment?: string,
): Promise<DriverApplicationDetails> => {
  if (isManualApplication(applicationId)) {
    const db = getManualApplicationsDb()
    const idx = db.findIndex((row) => row.id === applicationId)
    if (idx === -1) throw new Error(`Application ${applicationId} not found`)
    const doc = db[idx].documents.find((d) => d.id === documentId)
    if (!doc) throw new Error(`Document ${documentId} not found`)
    doc.verifyStatus = status
    if (comment) doc.comment = comment
    db[idx].updatedAt = new Date().toISOString()
    saveManualApplicationsDb(db)
    return db[idx]
  }
  return driversApi.verifyApplicationDocument(applicationId, documentId, status, comment)
}

// ─── Drivers ───────────────────────────────────────────────────────────────

const getDrivers = async (params?: QueryParams): Promise<PaginatedResponse<DriverEntity>> => {
  return driversApi.getDrivers(params)
}

const getDriverById = async (id: string): Promise<DriverDetails> => {
  const driver = await driversApi.getDriverById(id)
  return {
    ...driver,
    documents: driver.documents ?? [],
    auditLogs: driver.auditLogs ?? [],
    timeline: driver.timeline ?? [],
    ledger: driver.ledger ?? [],
    bgCheckStatus: driver.bgCheckStatus ?? 'not_started',
  }
}

const updateDriverStatus = async (
  id: string,
  status: 'suspended' | 'blocked' | 'active',
  notes?: string,
): Promise<DriverDetails> => {
  if (status === 'active') return driversApi.activateDriver(id, notes)
  if (status === 'blocked') return driversApi.blockDriver(id, notes)
  return driversApi.suspendDriver(id, notes)
}

const updateDriverBillingMode = async (
  _id: string,
  _billingMode: 'free' | 'commission' | 'subscription',
  _subscriptionType?: 'monthly' | 'weekly' | 'daily',
  _notes?: string,
): Promise<DriverDetails> => {
  throw new Error('Billing plan updates are not available from the API yet')
}

const addDriverTimelineNote = async (_id: string, _notes: string): Promise<DriverDetails> => {
  throw new Error('Timeline notes are not available from the API yet')
}

// ─── Vehicles ──────────────────────────────────────────────────────────────

const getVehicles = async (params?: QueryParams): Promise<PaginatedResponse<VehicleEntity>> => {
  return driversApi.getVehicles(params)
}

const getVehicleById = async (
  id: string,
): Promise<VehicleEntity & { vehicle: VehicleInfo; driver: DriverEntity }> => {
  const detail = await driversApi.getVehicleById(id)
  return {
    ...detail,
    vehicle: detail.vehicle as VehicleInfo,
  }
}

const flagVehicleForRenewal = async (id: string, notes?: string) => {
  return driversApi.flagVehicleForRenewal(id, notes)
}

export const DriverManagementService = {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
  approveApplication,
  rejectApplication,
  requestResubmission,
  verifyApplicationDocument,
  getDrivers,
  getDriverById,
  suspendDriver: (id: string, notes?: string) => updateDriverStatus(id, 'suspended', notes),
  blockDriver: (id: string, notes?: string) => updateDriverStatus(id, 'blocked', notes),
  activateDriver: (id: string, notes?: string) => updateDriverStatus(id, 'active', notes),
  updateDriverBillingMode,
  addDriverTimelineNote,
  getVehicles,
  getVehicleById,
  flagVehicleForRenewal,
}

export default DriverManagementService
