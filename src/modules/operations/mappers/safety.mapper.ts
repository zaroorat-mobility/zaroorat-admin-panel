import type { BackendSafetyIncidentListItem, BackendSafetyIncidentDetail } from '../api'
import type { SOSAlert, SosPriority, SosStatus, SosResolutionType } from '../types'

export function mapBackendSeverityToSosPriority(severity: string): SosPriority {
  switch (severity) {
    case 'CRITICAL':
      return 'critical'
    case 'HIGH':
      return 'high'
    case 'MEDIUM':
      return 'medium'
    case 'LOW':
      return 'low'
    default:
      return 'high'
  }
}

export function mapBackendStatusToSosStatus(status: string): SosStatus {
  switch (status) {
    case 'OPEN':
      return 'open'
    case 'ACKNOWLEDGED':
      return 'acknowledged'
    case 'INVESTIGATING':
      return 'escalated'
    case 'RESOLVED':
    case 'CLOSED':
      return 'resolved'
    default:
      return 'open'
  }
}

export function mapBackendResolutionTypeToUi(type?: string | null): SosResolutionType {
  switch (type) {
    case 'FALSE_ALARM':
      return 'False Alarm'
    case 'CUSTOMER_SAFE':
      return 'Customer Safe'
    case 'DRIVER_SAFE':
      return 'Driver Safe'
    case 'EMERGENCY_SERVICES':
    case 'POLICE_ESCALATED':
      return 'Emergency Services Contacted'
    case 'UNREACHABLE':
      return 'Unable To Reach Customer'
    default:
      return 'Other'
  }
}

export function mapBackendIncidentToUiSosAlert(
  inc: BackendSafetyIncidentListItem | BackendSafetyIncidentDetail
): SOSAlert {
  return {
    id: inc.id,
    rideId: inc.ride?.id || inc.ride?.rideCode || 'R-LIVE',
    driverId: 'drv-default',
    driverName: inc.ride?.driverName || (inc.subject?.fullName || 'Driver Partner'),
    riderId: inc.reporter.id,
    riderName: inc.reporter.fullName,
    vehiclePlate: 'JK-01-AB-1234',
    timeRaised: inc.createdAt,
    priority: mapBackendSeverityToSosPriority(inc.severity),
    status: mapBackendStatusToSosStatus(inc.status),
    location: inc.locationAddress || (inc.latitude && inc.longitude ? `${inc.latitude.toFixed(4)}, ${inc.longitude.toFixed(4)}` : 'Srinagar, J&K'),
    acknowledgedBy: (inc as any).acknowledgedBy || (inc.acknowledgedAt ? 'Senior Support Ops' : undefined),
    acknowledgedAt: inc.acknowledgedAt || undefined,
    acknowledgementNotes: undefined,
    resolvedBy: inc.resolvedAt ? ((inc as any).resolvedBy || 'Senior Support Ops') : undefined,
    resolvedAt: inc.resolvedAt || undefined,
    resolutionType: inc.resolutionType ? mapBackendResolutionTypeToUi(inc.resolutionType) : undefined,
    resolutionNotes: inc.resolutionNotes || undefined,
    createdAt: inc.createdAt,
    updatedAt: inc.updatedAt,
  }
}
