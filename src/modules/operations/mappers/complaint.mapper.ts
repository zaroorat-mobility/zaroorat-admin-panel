import type { BackendTicketListItem, BackendTicketDetail } from '../api'
import type { Complaint, ComplaintCategory, ComplaintPriority, ComplaintStatus, ComplaintTimelineEvent } from '../types'

export function mapBackendStatusToComplaintStatus(status: string): ComplaintStatus {
  switch (status) {
    case 'OPEN':
    case 'REOPENED':
      return 'open'
    case 'IN_PROGRESS':
      return 'investigating'
    case 'WAITING_CUSTOMER':
      return 'investigating'
    case 'RESOLVED':
      return 'resolved'
    case 'CLOSED':
      return 'closed'
    default:
      return 'open'
  }
}

export function mapBackendPriorityToComplaintPriority(priority: string): ComplaintPriority {
  switch (priority) {
    case 'LOW':
      return 'low'
    case 'NORMAL':
      return 'medium'
    case 'HIGH':
      return 'high'
    case 'URGENT':
      return 'critical'
    default:
      return 'medium'
  }
}

export function mapBackendCategoryToComplaintCategory(code?: string, name?: string): ComplaintCategory {
  switch (code) {
    case 'DRIVER_COMPLAINT':
      return 'Driver Behaviour'
    case 'RIDE_ISSUE':
      return 'Fare Dispute'
    case 'PAYMENT':
    case 'BILLING_REFUND':
      return 'Payment'
    case 'SAFETY':
      return 'Safety'
    case 'LOST_ITEM':
      return 'Lost Item'
    case 'APP_ISSUE':
      return 'App Issue'
    default:
      if (name?.toLowerCase().includes('driver')) return 'Driver Behaviour'
      if (name?.toLowerCase().includes('fare') || name?.toLowerCase().includes('ride')) return 'Fare Dispute'
      if (name?.toLowerCase().includes('payment')) return 'Payment'
      if (name?.toLowerCase().includes('safety')) return 'Safety'
      if (name?.toLowerCase().includes('lost')) return 'Lost Item'
      if (name?.toLowerCase().includes('app')) return 'App Issue'
      return 'Other'
  }
}

export function mapBackendTicketToUiComplaint(ticket: BackendTicketListItem | BackendTicketDetail): Complaint {
  const detail = ticket as Partial<BackendTicketDetail>

  const timeline: ComplaintTimelineEvent[] = [
    {
      action: 'Ticket Created',
      actor: ticket.user?.fullName || 'Customer',
      timestamp: ticket.createdAt,
      notes: ticket.description || ticket.subject,
    },
  ]

  if (ticket.firstResponseAt) {
    timeline.push({
      action: 'First Response',
      actor: ticket.assignedAgent?.displayName || 'Support Agent',
      timestamp: ticket.firstResponseAt,
    })
  }

  if (detail.assignments && detail.assignments.length > 0) {
    detail.assignments.forEach((a) => {
      timeline.push({
        action: `Assigned to ${a.agentName || 'Agent'}`,
        actor: a.assignedBy ? 'Admin' : 'System',
        timestamp: a.assignedAt,
        notes: a.reason || undefined,
      })
    })
  }

  if (detail.messages && detail.messages.length > 0) {
    detail.messages.forEach((m) => {
      timeline.push({
        action: m.isInternal ? 'Internal Note Added' : `Reply by ${m.authorName || m.authorType}`,
        actor: m.authorName || m.authorType,
        timestamp: m.createdAt,
        notes: m.body,
      })
    })
  }

  if (ticket.resolvedAt) {
    timeline.push({
      action: 'Ticket Resolved',
      actor: ticket.assignedAgent?.displayName || 'Admin Operator',
      timestamp: ticket.resolvedAt,
    })
  }

  if (ticket.closedAt) {
    timeline.push({
      action: 'Ticket Closed',
      actor: 'Admin Operator',
      timestamp: ticket.closedAt,
    })
  }

  // Sort timeline by timestamp ascending
  timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  return {
    id: ticket.id,
    rideId: ticket.ride?.id || ticket.ride?.rideCode,
    driverName: ticket.ride?.driverName || undefined,
    driverPhone: ticket.ride?.driverPhone || undefined,
    raisedBy: 'rider',
    raisedByName: ticket.user?.fullName || 'Customer',
    category: mapBackendCategoryToComplaintCategory(ticket.category?.code, ticket.category?.name),
    priority: mapBackendPriorityToComplaintPriority(ticket.priority),
    status: mapBackendStatusToComplaintStatus(ticket.status),
    description: ticket.description || ticket.subject,
    assignedTo: ticket.assignedAgent?.displayName || undefined,
    assignedAt: ticket.assignedAgent ? ticket.updatedAt : undefined,
    resolvedBy: ticket.resolvedAt ? (ticket.assignedAgent?.displayName || 'Support Ops') : undefined,
    resolvedAt: ticket.resolvedAt || undefined,
    resolutionNotes: undefined,
    timeline,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  }
}
