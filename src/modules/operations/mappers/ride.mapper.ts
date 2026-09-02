import type { BackendRideListItem, BackendRideDetails } from '../api'
import type { Ride, RideStatus, RideTimelineEvent, RidePaymentStatus, RidePaymentMethod } from '../types'

export function mapBackendStatusToUiStatus(backendStatus: string): RideStatus {
  switch (backendStatus) {
    case 'REQUESTED':
      return 'REQUESTED'
    case 'SEARCHING':
      return 'SEARCHING'
    case 'ACCEPTED':
      return 'DRIVER_ASSIGNED'
    case 'DRIVER_ARRIVING':
      return 'DRIVER_ARRIVED'
    case 'DRIVER_ARRIVED':
      return 'DRIVER_ARRIVED'
    case 'IN_PROGRESS':
      return 'IN_PROGRESS'
    case 'COMPLETED':
      return 'COMPLETED'
    case 'CANCELLED_BY_CUSTOMER':
      return 'CANCELLED_BY_RIDER'
    case 'CANCELLED_BY_DRIVER':
      return 'CANCELLED_BY_DRIVER'
    case 'CANCELLED_BY_SYSTEM':
      return 'CANCELLED_BY_DRIVER'
    case 'NO_DRIVERS_FOUND':
      return 'NO_DRIVER_FOUND'
    default:
      return 'IN_PROGRESS'
  }
}

export function mapBackendPaymentStatus(status: string): RidePaymentStatus {
  const s = status?.toLowerCase()
  if (s === 'paid' || s === 'settled' || s === 'completed') return 'completed'
  if (s === 'failed' || s === 'cancelled') return 'failed'
  return 'pending'
}

export function mapBackendPaymentMethod(method: string): RidePaymentMethod {
  const m = method?.toLowerCase()
  if (m === 'card') return 'card'
  if (m === 'wallet') return 'wallet'
  if (m === 'upi') return 'upi'
  return 'cash'
}

export function mapBackendRideToUiRide(item: BackendRideListItem | BackendRideDetails): Ride {
  const isDetails = 'fareBreakdown' in item

  const timelineEvents: RideTimelineEvent[] = isDetails && item.timeline && item.timeline.length > 0
    ? item.timeline.map((evt) => ({
        stage: evt.toStatus,
        timestamp: evt.createdAt,
        description: evt.reason || `Ride transitioned to ${evt.toStatus}`,
      }))
    : [
        {
          stage: 'REQUESTED',
          timestamp: item.bookingTime || item.createdAt,
          description: 'Ride booking requested.',
        },
        ...(item.acceptedAt
          ? [
              {
                stage: 'DRIVER_ASSIGNED',
                timestamp: item.acceptedAt,
                description: `Driver ${item.driver?.name || ''} assigned.`,
              },
            ]
          : []),
        ...(item.startedAt
          ? [
              {
                stage: 'IN_PROGRESS',
                timestamp: item.startedAt,
                description: 'Trip in progress.',
              },
            ]
          : []),
        ...(item.completedAt
          ? [
              {
                stage: 'COMPLETED',
                timestamp: item.completedAt,
                description: 'Ride completed successfully.',
              },
            ]
          : []),
        ...(item.cancelledAt
          ? [
              {
                stage: 'CANCELLED',
                timestamp: item.cancelledAt,
                description: 'Ride was cancelled.',
              },
            ]
          : []),
      ]

  const vehicleModel = item.vehicle
    ? [item.vehicle.make, item.vehicle.model, item.vehicle.color ? `(${item.vehicle.color})` : null]
        .filter(Boolean)
        .join(' ') || item.vehicle.vehicleType.name
    : undefined

  const fareBreakdown = isDetails ? (item as BackendRideDetails).fareBreakdown : null

  return {
    id: item.id,
    riderId: item.customer.id,
    riderName: item.customer.name,
    riderMobile: item.customer.phoneNumber,
    driverId: item.driver?.id,
    driverName: item.driver?.name,
    driverMobile: item.driver?.phoneNumber,
    vehiclePlate: item.vehicle?.plateNumber,
    vehicleType: (item.vehicle?.vehicleType.code.toLowerCase() as any) || 'cab',
    vehicleModel,
    status: mapBackendStatusToUiStatus(item.status),
    paymentStatus: mapBackendPaymentStatus(item.paymentStatus),
    paymentMethod: mapBackendPaymentMethod(item.paymentMethod),
    pickupLocation: item.pickupAddress || 'Pickup Location',
    dropLocation: item.dropAddress || 'Drop Location',
    pickupLat: item.pickupLat,
    pickupLng: item.pickupLng,
    dropLat: item.dropLat,
    dropLng: item.dropLng,
    distance: item.distanceKm || 0,
    duration: item.durationMin || 0,
    baseFare: fareBreakdown?.baseFare || 50,
    distanceCharge: fareBreakdown?.distanceFare || 0,
    timeCharge: fareBreakdown?.timeFare || 0,
    surgeCharge: fareBreakdown?.surgeAmount || 0,
    discount: fareBreakdown?.discountAmount || 0,
    finalFare: item.finalFare ?? item.quotedFare ?? 0,
    otp: isDetails && (item as BackendRideDetails).otp?.verified ? 'VERIFIED' : '----',
    sosState: 'none',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    timeline: timelineEvents,
    rawStatus: item.status,
    ratings: (item as any).ratings ?? [],
    opsNotes: (item as any).opsNotes ?? [],
  }
}
