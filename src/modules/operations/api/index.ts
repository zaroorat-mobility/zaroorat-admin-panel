import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type { QueryParams, PaginatedResponse } from '@/shared/types'

export interface BackendRideListItem {
  id: string
  rideCode: string
  requestId: string
  status: string
  paymentMethod: string
  paymentStatus: string
  bookingTime: string
  acceptedAt: string | null
  startedAt: string | null
  completedAt: string | null
  cancelledAt: string | null
  pickupAddress: string | null
  dropAddress: string | null
  pickupLat: number | null
  pickupLng: number | null
  dropLat: number | null
  dropLng: number | null
  distanceKm: number | null
  durationMin: number | null
  quotedFare: number | null
  finalFare: number | null
  isScheduled: boolean
  scheduledFor: string | null
  customer: {
    id: string
    name: string
    phoneNumber: string
    email: string | null
    ratingAvg: number | null
  }
  driver: {
    id: string
    name: string
    phoneNumber: string
    driverCode: string
    rating: number | null
  } | null
  vehicle: {
    id: string
    plateNumber: string
    make: string | null
    model: string | null
    color: string | null
    vehicleType: {
      id: string
      name: string
      code: string
    }
  } | null
  createdAt: string
  updatedAt: string
}

export interface BackendRideDetails extends BackendRideListItem {
  waitTimeMin: number
  otp?: { verified: boolean; verifiedAt: string | null } | null
  fareBreakdown: {
    currency: string
    baseFare: number
    distanceFare: number
    timeFare: number
    waitingCharge: number
    surgeMultiplier: number
    surgeAmount: number
    subtotal: number
    discountAmount: number
    taxAmount: number
    tollAmount: number
    platformFee: number
    tipAmount: number
    totalFare: number
    driverEarning: number
    platformCommission: number
    lines: Array<{
      id: string
      lineType: string
      label: string | null
      amount: number
      sequence: number | null
    }>
  } | null
  promosApplied: Array<{
    id: string
    promoCode: string
    discountAmount: number
    createdAt: string
  }>
  cancellation: {
    id: string
    cancelledBy: string
    actorId: string | null
    reasonCode: string
    reasonText: string | null
    cancelledAtStatus: string | null
    cancellationFee: number
    feeCharged: boolean
    createdAt: string
  } | null
  receipt: {
    id: string
    receiptNumber: string
    pdfUrl: string | null
    issuedAt: string
  } | null
  payments: Array<{
    id: string
    amount: number
    method: string
    status: string
    settledAt: string | null
    createdAt: string
  }>
  ratings: Array<{
    id: string
    ratedBy: string
    rating: number
    tags: string[]
    comment: string | null
    createdAt: string
  }>
  disputes: Array<{
    id: string
    raisedBy: string
    category: string
    description: string | null
    status: string
    refundAmount: number
    createdAt: string
  }>
  stops: Array<{
    id: string
    sequence: number
    stopType: string
    address: string | null
    arrivedAt: string | null
    departedAt: string | null
  }>
  timeline: Array<{
    id: string
    fromStatus: string | null
    toStatus: string
    actorType: string | null
    actorId: string | null
    reason: string | null
    createdAt: string
  }>
}

export interface BackendLiveSummary {
  activeRidesCount: number
  searchingRequestsCount: number
  assignedCount: number
  inProgressCount: number
  paymentPendingCount: number
  completedTodayCount: number
  cancelledTodayCount: number
  longWaitCount: number
  onlineDriversCount: number
  availableDriversCount: number
  busyDriversCount: number
  offlineDriversCount: number
}

export interface BackendActiveRide {
  id: string
  rideCode: string
  requestId: string
  status: string
  bookingTime: string
  acceptedAt: string | null
  arrivedAt: string | null
  startedAt: string | null
  elapsedMinutes: number
  waitTimeMin: number
  surgeMultiplier: number
  quotedFare: number | null
  totalFare: number | null
  paymentMethod: string
  paymentStatus: string
  customer: {
    id: string
    fullName: string
    phone: string
    avatarUrl: string | null
  }
  driver: {
    id: string
    fullName: string
    phone: string
    avatarUrl: string | null
    ratingAvg: number | null
  } | null
  vehicle: {
    id: string | null
    licensePlate: string | null
    model: string | null
    make: string | null
    typeCode: string
    typeName: string
  }
  pickup: {
    address: string
    lat: number
    lng: number
  }
  drop: {
    address: string
    lat: number
    lng: number
  }
  driverLocation: {
    lat: number
    lng: number
    heading: number | null
    speedKmh: number | null
    updatedAt: string
  } | null
}

export interface BackendLiveMap {
  rides: Array<{
    id: string
    rideCode: string
    status: string
    pickup: { address: string; lat: number; lng: number }
    drop: { address: string; lat: number; lng: number }
    driverLocation: { lat: number; lng: number; heading: number | null } | null
    encodedPolyline: string | null
  }>
  drivers: Array<{
    id: string
    name: string
    phone: string
    status: string
    lat: number
    lng: number
    heading: number | null
    vehicleType: string | null
    currentRideId: string | null
  }>
}

export interface BackendLiveDriver {
  id: string
  driverNumber: string
  fullName: string
  phoneNumber: string
  avatarUrl: string | null
  status: string
  lastOnlineAt: string | null
  lastOfflineAt: string | null
  heartbeatAt: string | null
  batteryLevel: number | null
  appVersion: string | null
  vehicle: {
    licensePlate: string | null
    model: string | null
    type: string
  } | null
  location: {
    lat: number
    lng: number
    heading: number | null
    speedKmh: number | null
    updatedAt: string
  } | null
  currentRide: {
    id: string
    rideCode: string
    status: string
  } | null
}

export interface BackendLiveAlert {
  id: string
  type: 'LONG_WAIT' | 'SEARCHING_DELAY' | 'NO_DRIVERS' | 'PAYMENT_STALLED'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  message: string
  entityId: string
  entityType: 'ride' | 'request'
  timestamp: string
}

export interface BackendDispatchRequestListItem {
  id: string
  customerId: string
  customerName: string
  customerPhone: string
  vehicleTypeId: string
  vehicleTypeName: string
  vehicleTypeCode: string
  pickupAddress: string
  pickupLat: number
  pickupLng: number
  dropAddress: string | null
  dropLat: number | null
  dropLng: number | null
  estimatedDistanceKm: number | null
  estimatedDurationMin: number | null
  quotedFare: number | null
  surgeMultiplier: number
  paymentMethod: string | null
  status: string
  dispatchRoundsCount: number
  totalOffersCount: number
  acceptedDriver: {
    id: string
    fullName: string
    phone: string
  } | null
  rideId: string | null
  rideCode: string | null
  createdAt: string
  expiresAt: string | null
}

export interface BackendDispatchCandidate {
  id: string
  dispatchRound: number
  driver: {
    id: string
    driverNumber: string
    fullName: string
    phone: string
    avatarUrl: string | null
    ratingAvg: number | null
  }
  vehicle: {
    id: string | null
    licensePlate: string | null
    model: string | null
    make: string | null
  } | null
  offeredAt: string
  respondedAt: string | null
  response: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'TIMEOUT' | 'CANCELLED'
  rejectReason: string | null
  driverDistanceM: number | null
  driverEtaSeconds: number | null
  expiresAt: string | null
}

export interface BackendDispatchRequestDetail {
  id: string
  status: string
  customer: {
    id: string
    fullName: string
    phone: string
    avatarUrl: string | null
  }
  vehicleType: {
    id: string
    name: string
    code: string
  }
  pickup: {
    address: string
    lat: number
    lng: number
  }
  drop: {
    address: string | null
    lat: number | null
    lng: number | null
  }
  estimatedDistanceKm: number | null
  estimatedDurationMin: number | null
  quotedFare: number | null
  surgeMultiplier: number
  paymentMethod: string | null
  promoCode: string | null
  createdAt: string
  expiresAt: string | null
  ride: {
    id: string
    rideCode: string
    status: string
    driver: {
      id: string
      fullName: string
      phone: string
    } | null
  } | null
  summary: {
    totalRounds: number
    totalDispatches: number
    pendingCount: number
    acceptedCount: number
    rejectedCount: number
    timeoutCount: number
  }
  candidates: BackendDispatchCandidate[]
}

export interface BackendTicketListItem {
  id: string
  ticketNumber: string
  subject: string
  description: string | null
  status: string
  priority: string
  channel: string
  createdAt: string
  updatedAt: string
  firstResponseAt: string | null
  slaDueAt: string | null
  resolvedAt: string | null
  closedAt: string | null
  user: {
    id: string
    fullName: string
    phone: string
    avatarUrl: string | null
  }
  category: {
    id: string
    code: string
    name: string
  } | null
  assignedAgent: {
    id: string
    displayName: string | null
    status: string
  } | null
  ride: {
    id: string
    rideCode: string
    status: string
    driverName: string | null
    driverPhone: string | null
  } | null
  messagesCount: number
}

export interface BackendTicketDetail extends BackendTicketListItem {
  reopenedCount: number
  messages: Array<{
    id: string
    body: string
    isInternal: boolean
    authorType: string
    authorId: string | null
    authorName: string | null
    attachments: any | null
    createdAt: string
  }>
  assignments: Array<{
    id: string
    agentId: string
    agentName: string | null
    assignedBy: string | null
    reason: string | null
    status: string
    assignedAt: string
    releasedAt: string | null
  }>
}

export interface BackendSupportCategory {
  id: string
  code: string
  name: string
  sortOrder: number
  defaultPriority: string
}

export interface BackendSupportAgent {
  id: string
  userId: string
  displayName: string | null
  status: string
  activeTickets: number
}

export interface BackendSafetyIncidentListItem {
  id: string
  incidentNumber: string
  type: string
  severity: string
  status: string
  description: string | null
  latitude: number | null
  longitude: number | null
  locationAddress: string | null
  acknowledgedAt: string | null
  resolvedAt: string | null
  resolutionType: string | null
  resolutionNotes: string | null
  evidenceFileIds: string[]
  createdAt: string
  updatedAt: string
  reporter: {
    id: string
    fullName: string
    phone: string
    avatarUrl: string | null
  }
  subject: {
    id: string
    fullName: string
    phone: string
  } | null
  ride: {
    id: string
    rideCode: string
    status: string
    driverName: string | null
    driverPhone: string | null
    pickupAddress: string | null
    dropAddress: string | null
  } | null
  eventsCount: number
}

export interface BackendSafetyIncidentDetail extends BackendSafetyIncidentListItem {
  acknowledgedBy: string | null
  resolvedBy: string | null
  events: Array<{
    id: string
    eventType: string
    actorId: string | null
    actorName: string | null
    notes: string | null
    metadata: any
    createdAt: string
  }>
}

export const operationsApi = {
  // Rides
  getRides: async (params?: QueryParams): Promise<PaginatedResponse<BackendRideListItem>> => {
    const response = await api.get<PaginatedResponse<BackendRideListItem>>(API_ENDPOINTS.operations.rides, { params })
    return response.data
  },

  getRideById: async (id: string): Promise<BackendRideDetails> => {
    const response = await api.get<{ data: BackendRideDetails }>(API_ENDPOINTS.operations.rideDetail(id))
    return response.data.data
  },

  getRideTimeline: async (id: string) => {
    const response = await api.get<{ data: any[] }>(API_ENDPOINTS.operations.rideTimeline(id))
    return response.data.data
  },

  getRideFareBreakdown: async (id: string) => {
    const response = await api.get<{ data: any }>(API_ENDPOINTS.operations.rideFareBreakdown(id))
    return response.data.data
  },

  getRidePayments: async (id: string) => {
    const response = await api.get<{ data: any }>(API_ENDPOINTS.operations.ridePayments(id))
    return response.data.data
  },

  getRideDriverLocation: async (id: string) => {
    const response = await api.get<{ data: any }>(API_ENDPOINTS.operations.rideDriverLocation(id))
    return response.data.data
  },

  exportRidesCsv: async (params?: QueryParams): Promise<Blob> => {
    const response = await api.get(API_ENDPOINTS.operations.rideExport, {
      params,
      responseType: 'blob',
    })
    return response.data
  },

  getRideNotes: async (id: string) => {
    const response = await api.get<{ data: any[] }>(API_ENDPOINTS.operations.rideNotes(id))
    return response.data.data
  },

  addRideNote: async (id: string, note: string) => {
    const response = await api.post<{ data: any }>(API_ENDPOINTS.operations.rideNotes(id), { note })
    return response.data.data
  },

  cancelRide: async (id: string, data: { reasonCode?: string; reasonText?: string }) => {
    const response = await api.post<{ data: any }>(API_ENDPOINTS.operations.rideCancel(id), data)
    return response.data.data
  },

  getRideAuditLogs: async (id: string, params?: QueryParams) => {
    const response = await api.get<PaginatedResponse<any>>(API_ENDPOINTS.operations.rideAudit(id), { params })
    return response.data
  },

  // Live Operations
  getLiveSummary: async (params?: { longWaitThresholdMin?: number }): Promise<BackendLiveSummary> => {
    const response = await api.get<BackendLiveSummary>(API_ENDPOINTS.operations.liveSummary, { params })
    return response.data
  },

  getActiveRides: async (params?: QueryParams): Promise<PaginatedResponse<BackendActiveRide>> => {
    const response = await api.get<PaginatedResponse<BackendActiveRide>>(API_ENDPOINTS.operations.liveActiveRides, { params })
    return response.data
  },

  getLiveMap: async (params?: { city?: string; vehicleTypeId?: string }): Promise<BackendLiveMap> => {
    const response = await api.get<BackendLiveMap>(API_ENDPOINTS.operations.liveMap, { params })
    return response.data
  },

  getLiveDrivers: async (params?: QueryParams): Promise<PaginatedResponse<BackendLiveDriver>> => {
    const response = await api.get<PaginatedResponse<BackendLiveDriver>>(API_ENDPOINTS.operations.liveDrivers, { params })
    return response.data
  },

  getLiveAlerts: async (params?: { longWaitThresholdMin?: number }): Promise<BackendLiveAlert[]> => {
    const response = await api.get<BackendLiveAlert[]>(API_ENDPOINTS.operations.liveAlerts, { params })
    return response.data
  },

  // Dispatch & Matching Console
  getDispatchRequests: async (params?: QueryParams): Promise<PaginatedResponse<BackendDispatchRequestListItem>> => {
    const response = await api.get<PaginatedResponse<BackendDispatchRequestListItem>>(API_ENDPOINTS.operations.dispatchRequests, { params })
    return response.data
  },

  getDispatchRequestById: async (id: string): Promise<BackendDispatchRequestDetail> => {
    const response = await api.get<BackendDispatchRequestDetail>(API_ENDPOINTS.operations.dispatchRequestDetail(id))
    return response.data
  },

  getDispatchCandidates: async (id: string): Promise<{ requestId: string; total: number; candidates: BackendDispatchCandidate[] }> => {
    const response = await api.get<{ requestId: string; total: number; candidates: BackendDispatchCandidate[] }>(API_ENDPOINTS.operations.dispatchCandidates(id))
    return response.data
  },

  // Support & Complaints
  getTickets: async (params?: QueryParams): Promise<PaginatedResponse<BackendTicketListItem>> => {
    const response = await api.get<PaginatedResponse<BackendTicketListItem>>(API_ENDPOINTS.operations.tickets, { params })
    return response.data
  },

  getTicketById: async (id: string): Promise<BackendTicketDetail> => {
    const response = await api.get<{ data: BackendTicketDetail }>(API_ENDPOINTS.operations.ticketDetail(id))
    return response.data.data
  },

  createTicket: async (data: any): Promise<BackendTicketDetail> => {
    const response = await api.post<{ data: BackendTicketDetail }>(API_ENDPOINTS.operations.tickets, data)
    return response.data.data
  },

  assignTicket: async (id: string, data: { agentId: string; reason?: string }): Promise<BackendTicketDetail> => {
    const response = await api.post<{ data: BackendTicketDetail }>(API_ENDPOINTS.operations.ticketAssign(id), data)
    return response.data.data
  },

  updateTicketStatus: async (id: string, data: { status: string; notes?: string }): Promise<BackendTicketDetail> => {
    const response = await api.patch<{ data: BackendTicketDetail }>(API_ENDPOINTS.operations.ticketStatus(id), data)
    return response.data.data
  },

  addTicketMessage: async (id: string, data: { body: string; isInternal?: boolean; authorType?: string }): Promise<BackendTicketDetail> => {
    const response = await api.post<{ data: BackendTicketDetail }>(API_ENDPOINTS.operations.ticketMessages(id), data)
    return response.data.data
  },

  resolveTicket: async (id: string, data: { resolutionNotes: string; status?: string }): Promise<BackendTicketDetail> => {
    const response = await api.post<{ data: BackendTicketDetail }>(API_ENDPOINTS.operations.ticketResolve(id), data)
    return response.data.data
  },

  getTicketCategories: async (): Promise<BackendSupportCategory[]> => {
    const response = await api.get<{ data: BackendSupportCategory[] }>(API_ENDPOINTS.operations.ticketCategories)
    return response.data.data
  },

  getTicketAgents: async (): Promise<BackendSupportAgent[]> => {
    const response = await api.get<{ data: BackendSupportAgent[] }>(API_ENDPOINTS.operations.ticketAgents)
    return response.data.data
  },

  // Safety & Incident Management (Safety Center)
  getIncidents: async (params?: QueryParams): Promise<PaginatedResponse<BackendSafetyIncidentListItem>> => {
    const response = await api.get<PaginatedResponse<BackendSafetyIncidentListItem>>(API_ENDPOINTS.operations.incidents, { params })
    return response.data
  },

  getIncidentById: async (id: string): Promise<BackendSafetyIncidentDetail> => {
    const response = await api.get<{ data: BackendSafetyIncidentDetail }>(API_ENDPOINTS.operations.incidentDetail(id))
    return response.data.data
  },

  createIncident: async (data: any): Promise<BackendSafetyIncidentDetail> => {
    const response = await api.post<{ data: BackendSafetyIncidentDetail }>(API_ENDPOINTS.operations.incidents, data)
    return response.data.data
  },

  acknowledgeIncident: async (id: string, notes?: string): Promise<BackendSafetyIncidentDetail> => {
    const response = await api.post<{ data: BackendSafetyIncidentDetail }>(API_ENDPOINTS.operations.incidentAcknowledge(id), { notes })
    return response.data.data
  },

  resolveIncident: async (id: string, data: { resolutionType: string; resolutionNotes: string; status?: string }): Promise<BackendSafetyIncidentDetail> => {
    const response = await api.post<{ data: BackendSafetyIncidentDetail }>(API_ENDPOINTS.operations.incidentResolve(id), data)
    return response.data.data
  },

  escalateIncident: async (id: string, data: { severity: string; notes: string }): Promise<BackendSafetyIncidentDetail> => {
    const response = await api.post<{ data: BackendSafetyIncidentDetail }>(API_ENDPOINTS.operations.incidentEscalate(id), data)
    return response.data.data
  },

  addIncidentNote: async (id: string, notes: string): Promise<BackendSafetyIncidentDetail> => {
    const response = await api.post<{ data: BackendSafetyIncidentDetail }>(API_ENDPOINTS.operations.incidentNotes(id), { notes })
    return response.data.data
  },

  attachIncidentEvidence: async (id: string, fileId: string): Promise<BackendSafetyIncidentDetail> => {
    const response = await api.post<{ data: BackendSafetyIncidentDetail }>(API_ENDPOINTS.operations.incidentEvidence(id), { fileId })
    return response.data.data
  },
}
