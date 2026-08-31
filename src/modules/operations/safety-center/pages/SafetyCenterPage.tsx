import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  User,
  Phone,
  Car,
  CheckCircle,
  MapPin,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  FileText,
  Paperclip,
} from 'lucide-react'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { FormTabs } from '@/shared/components/ui/FormTabs'
import { Card } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Drawer } from '@/shared/components/ui/Drawer'
import { Modal } from '@/shared/components/ui/Modal'
import {
  useIncidents,
  useIncident,
  useAcknowledgeIncident,
  useResolveIncident,
  useEscalateIncident,
  useAddIncidentNote,
} from '../../hooks'
import type { BackendSafetyIncidentListItem } from '../../api'

export const SafetyCenterPage: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'all' | 'SOS' | 'ACCIDENT' | 'MISCONDUCT' | 'LOST_FOUND'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null)
  const [refreshInterval, setRefreshInterval] = useState<number>(10000)

  // Modals state
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false)
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false)
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)

  const [resolutionType, setResolutionType] = useState('CUSTOMER_SAFE')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [escalateNotes, setEscalateNotes] = useState('')
  const [escalateSeverity, setEscalateSeverity] = useState('CRITICAL')
  const [newNote, setNewNote] = useState('')

  const {
    data: incidentsData,
    isLoading,
    refetch,
    isFetching,
  } = useIncidents(
    {
      type: activeTab === 'all' ? undefined : activeTab,
      status: statusFilter === 'all' ? undefined : statusFilter,
      search: search.trim() || undefined,
      limit: 50,
    },
    { refetchInterval: (refreshInterval > 0 ? refreshInterval : false) as number | false }
  )

  const { data: incidentDetail, isLoading: isLoadingDetail } = useIncident(
    selectedIncidentId || ''
  )

  const { mutate: acknowledge, isPending: isAcknowledging } = useAcknowledgeIncident()
  const { mutate: resolve, isPending: isResolving } = useResolveIncident()
  const { mutate: escalate, isPending: isEscalating } = useEscalateIncident()
  const { mutate: addNote, isPending: isAddingNote } = useAddIncidentNote()

  const incidents = incidentsData?.data || []

  const handleAcknowledge = (id: string) => {
    acknowledge({ id, notes: 'Operations staff acknowledged safety alert.' })
  }

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedIncidentId || !resolutionNotes.trim()) return
    resolve(
      {
        id: selectedIncidentId,
        resolutionType,
        resolutionNotes,
        status: 'RESOLVED',
      },
      {
        onSuccess: () => {
          setIsResolveModalOpen(false)
          setResolutionNotes('')
        },
      }
    )
  }

  const handleEscalateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedIncidentId || !escalateNotes.trim()) return
    escalate(
      {
        id: selectedIncidentId,
        severity: escalateSeverity,
        notes: escalateNotes,
      },
      {
        onSuccess: () => {
          setIsEscalateModalOpen(false)
          setEscalateNotes('')
        },
      }
    )
  }

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedIncidentId || !newNote.trim()) return
    addNote(
      {
        id: selectedIncidentId,
        notes: newNote,
      },
      {
        onSuccess: () => {
          setIsNoteModalOpen(false)
          setNewNote('')
        },
      }
    )
  }

  const columns: DataTableColumn<BackendSafetyIncidentListItem>[] = [
    {
      key: 'incidentNumber',
      label: 'Incident #',
      align: 'left',
      render: (val: string, row) => (
        <div>
          <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{val || row.id.slice(0, 8)}</span>
          <div className="text-[10px] text-muted-foreground font-mono">
            {new Date(row.createdAt).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      align: 'center',
      render: (val: string) => {
        let variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'secondary'
        if (val === 'SOS') variant = 'danger'
        else if (val === 'ACCIDENT') variant = 'warning'
        else if (val === 'MISCONDUCT') variant = 'neutral'
        return <Badge variant={variant}>{val.replace(/_/g, ' ')}</Badge>
      },
    },
    {
      key: 'severity',
      label: 'Severity',
      align: 'center',
      render: (val: string) => {
        let variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'secondary'
        if (val === 'CRITICAL') variant = 'danger'
        else if (val === 'HIGH') variant = 'warning'
        else if (val === 'MEDIUM') variant = 'neutral'
        return <Badge variant={variant}>{val}</Badge>
      },
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (val: string) => {
        let variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'secondary'
        if (val === 'OPEN') variant = 'danger'
        else if (val === 'ACKNOWLEDGED' || val === 'INVESTIGATING') variant = 'warning'
        else if (val === 'RESOLVED' || val === 'CLOSED') variant = 'success'
        return <Badge variant={variant}>{val}</Badge>
      },
    },
    {
      key: 'reporter',
      label: 'Reporter',
      align: 'left',
      render: (_: any, row) => (
        <div className="space-y-0.5 text-xs text-left">
          <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1">
            <User className="h-3.5 w-3.5 text-slate-400" />
            {row.reporter.fullName}
          </div>
          <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
            <Phone className="h-3 w-3 text-slate-400" />
            {row.reporter.phone}
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Summary / Location',
      align: 'left',
      render: (val: string | null, row) => (
        <div className="space-y-1 text-xs max-w-[220px]">
          <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
            {val || 'No description'}
          </div>
          {row.locationAddress && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
              <MapPin className="h-3 w-3 text-rose-500 shrink-0" />
              <span className="truncate">{row.locationAddress}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'ride',
      label: 'Related Ride',
      align: 'left',
      render: (_: any, row) =>
        row.ride ? (
          <div className="text-xs space-y-0.5">
            <button
              onClick={() => navigate(`/operations/ride-monitor/${row.ride?.id}`)}
              className="font-mono font-bold text-primary hover:underline flex items-center gap-1"
            >
              <Car className="h-3 w-3" />
              {row.ride.rideCode}
            </button>
            {row.ride.driverName && (
              <div className="text-[10px] text-muted-foreground">
                Driver: {row.ride.driverName}
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic">No Ride</span>
        ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center',
      render: (_: any, row) => (
        <div className="flex items-center justify-center gap-1.5">
          {row.status === 'OPEN' && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleAcknowledge(row.id)}
              disabled={isAcknowledging}
              className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white"
            >
              Acknowledge
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedIncidentId(row.id)}
            className="h-7 text-xs flex items-center gap-1"
          >
            Inspect
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ]

  const openCount = incidents.filter((i) => i.status === 'OPEN').length
  const criticalCount = incidents.filter((i) => i.severity === 'CRITICAL' && i.status !== 'RESOLVED' && i.status !== 'CLOSED').length

  return (
    <PageWrapper>
      <PageHeader
        title="Safety Center & Incident Command"
        description="Merged response console for SOS emergency triggers, mishaps, driver misconduct, and road safety escalations."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="bg-card border border-border text-foreground text-xs rounded-md px-2.5 py-1.5 focus:outline-none"
            >
              <option value={5000}>Refresh: 5s</option>
              <option value={10000}>Refresh: 10s</option>
              <option value={30000}>Refresh: 30s</option>
              <option value={0}>Pause</option>
            </select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-1.5 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="p-4 border-l-4 border-l-rose-600 bg-rose-50/10">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-600">
            <span>Critical SOS Alarms</span>
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold mt-2 text-rose-600 dark:text-rose-400">
            {criticalCount}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">Requires immediate dispatch/action</div>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-600">
            <span>Unacknowledged Alerts</span>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold mt-2 text-amber-600 dark:text-amber-400">
            {openCount}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">Awaiting operator acknowledgement</div>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-600">
            <span>Investigating / Dispatched</span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">
            {incidents.filter((i) => i.status === 'ACKNOWLEDGED' || i.status === 'INVESTIGATING').length}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">Active case management</div>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-600">
            <span>Resolved Incidents</span>
            <CheckCircle className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">
            {incidents.filter((i) => i.status === 'RESOLVED' || i.status === 'CLOSED').length}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">Closed with documented resolution</div>
        </Card>
      </div>

      {/* Tabs / Filter */}
      <div className="space-y-4">
        <FormTabs
          tabs={[
            { id: 'all', label: 'All Incidents' },
            { id: 'SOS', label: 'SOS Triggers' },
            { id: 'ACCIDENT', label: 'Accidents & Mishaps' },
            { id: 'MISCONDUCT', label: 'Driver Misconduct' },
            { id: 'LOST_FOUND', label: 'Lost & Found' },
          ]}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as any)}
        />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search incident number, phone, address, summary..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-card border border-border text-foreground text-xs rounded-md px-2.5 py-1.5 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="OPEN">OPEN (Unacknowledged)</option>
              <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
              <option value="INVESTIGATING">INVESTIGATING</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>
        </div>

        <DataTable
          data={incidents}
          columns={columns}
          isLoading={isLoading}
        />
      </div>

      {/* Incident Detail Drawer */}
      <Drawer
        isOpen={!!selectedIncidentId}
        onClose={() => setSelectedIncidentId(null)}
        title={`Safety Command: ${incidentDetail?.incidentNumber || selectedIncidentId?.slice(0, 8)}`}
        size="lg"
      >
        {isLoadingDetail ? (
          <div className="p-8 text-center text-xs text-muted-foreground">Loading incident timeline...</div>
        ) : incidentDetail ? (
          <div className="p-5 space-y-6">
            {/* Header / Badges */}
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {incidentDetail.incidentNumber}
                  </h3>
                  <Badge variant={incidentDetail.type === 'SOS' ? 'danger' : 'warning'}>
                    {incidentDetail.type}
                  </Badge>
                  <Badge variant={incidentDetail.severity === 'CRITICAL' ? 'danger' : 'secondary'}>
                    {incidentDetail.severity}
                  </Badge>
                  <Badge variant={incidentDetail.status === 'RESOLVED' ? 'success' : 'neutral'}>
                    {incidentDetail.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Reported at {new Date(incidentDetail.createdAt).toLocaleString()}
                </div>
              </div>

              {incidentDetail.ride && (
                <Button
                  size="sm"
                  onClick={() => navigate(`/operations/ride-monitor/${incidentDetail.ride?.id}`)}
                  className="text-xs flex items-center gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Ride ({incidentDetail.ride.rideCode})
                </Button>
              )}
            </div>

            {/* Actions Toolbar */}
            <div className="flex flex-wrap items-center gap-2 bg-muted/40 p-3 rounded-lg">
              {incidentDetail.status === 'OPEN' && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleAcknowledge(incidentDetail.id)}
                  disabled={isAcknowledging}
                  className="text-xs bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Acknowledge Incident
                </Button>
              )}
              {incidentDetail.status !== 'RESOLVED' && incidentDetail.status !== 'CLOSED' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEscalateModalOpen(true)}
                    className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                  >
                    Escalate Severity
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsNoteModalOpen(true)}
                    className="text-xs"
                  >
                    Add Investigation Note
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setIsResolveModalOpen(true)}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Resolve Incident
                  </Button>
                </>
              )}
            </div>

            {/* Description & Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-border rounded-lg p-3 space-y-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Incident Details</h4>
                <p className="text-xs text-slate-800 dark:text-slate-200">{incidentDetail.description}</p>
                <div className="text-xs space-y-1 text-muted-foreground pt-2 border-t border-border">
                  <div><span className="font-semibold text-foreground">Reporter:</span> {incidentDetail.reporter.fullName} ({incidentDetail.reporter.phone})</div>
                  {incidentDetail.subject && (
                    <div><span className="font-semibold text-foreground">Subject:</span> {incidentDetail.subject.fullName} ({incidentDetail.subject.phone})</div>
                  )}
                </div>
              </div>

              <div className="border border-border rounded-lg p-3 space-y-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Location Telemetry</h4>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <div><span className="font-semibold text-foreground">Address:</span> {incidentDetail.locationAddress || 'Not specified'}</div>
                  {incidentDetail.latitude && incidentDetail.longitude && (
                    <div className="font-mono text-emerald-600 dark:text-emerald-400">
                      GPS: {incidentDetail.latitude.toFixed(4)}, {incidentDetail.longitude.toFixed(4)}
                    </div>
                  )}
                  {incidentDetail.resolutionType && (
                    <div className="pt-2 border-t border-border">
                      <span className="font-semibold text-emerald-600">Resolution [{incidentDetail.resolutionType}]:</span>
                      <p className="text-xs text-foreground mt-0.5">{incidentDetail.resolutionNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Evidence files */}
            {incidentDetail.evidenceFileIds && incidentDetail.evidenceFileIds.length > 0 && (
              <div className="border border-border rounded-lg p-3 space-y-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5 text-blue-500" /> Evidence Files Attached ({incidentDetail.evidenceFileIds.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {incidentDetail.evidenceFileIds.map((fileId, idx) => (
                    <Badge key={idx} variant="secondary" className="font-mono text-xs">
                      File ID: {fileId.slice(0, 8)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Chronological Event Audit Trail */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" /> Incident Response Timeline ({incidentDetail.events.length})
              </h4>
              <div className="space-y-2 border-l-2 border-primary/40 pl-3 ml-2">
                {incidentDetail.events.map((e) => (
                  <div key={e.id} className="text-xs space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-white">{e.eventType}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(e.createdAt).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-primary font-medium">by {e.actorName}</span>
                    </div>
                    {e.notes && <p className="text-muted-foreground">{e.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>

      {/* Resolve Modal */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title="Resolve Safety Incident"
      >
        <form onSubmit={handleResolveSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Resolution Category</label>
            <select
              value={resolutionType}
              onChange={(e) => setResolutionType(e.target.value)}
              className="w-full bg-card border border-border text-foreground text-xs rounded-md p-2 focus:outline-none"
            >
              <option value="CUSTOMER_SAFE">Customer Safe / Reached Destination</option>
              <option value="DRIVER_SAFE">Driver Safe / Issue Resolved</option>
              <option value="FALSE_ALARM">False Alarm / Accidental Trigger</option>
              <option value="POLICE_ESCALATED">Emergency Services / Police Intervened</option>
              <option value="RETURNED_TO_OWNER">Item Returned to Owner</option>
              <option value="OTHER">Other Resolution</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Resolution Notes & Summary *</label>
            <textarea
              required
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Describe investigation outcome, confirmation details, and any actions taken..."
              className="w-full bg-card border border-border text-foreground text-xs rounded-md p-2 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button size="sm" variant="outline" type="button" onClick={() => setIsResolveModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit" disabled={isResolving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {isResolving ? 'Resolving...' : 'Confirm Resolution'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Escalate Modal */}
      <Modal
        isOpen={isEscalateModalOpen}
        onClose={() => setIsEscalateModalOpen(false)}
        title="Escalate Incident Severity"
      >
        <form onSubmit={handleEscalateSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Severity Level</label>
            <select
              value={escalateSeverity}
              onChange={(e) => setEscalateSeverity(e.target.value)}
              className="w-full bg-card border border-border text-foreground text-xs rounded-md p-2 focus:outline-none"
            >
              <option value="CRITICAL">CRITICAL (Immediate Dispatch / Senior Intervention)</option>
              <option value="HIGH">HIGH (Urgent Response)</option>
              <option value="MEDIUM">MEDIUM (Standard Escalation)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Reason for Escalation *</label>
            <textarea
              required
              rows={3}
              value={escalateNotes}
              onChange={(e) => setEscalateNotes(e.target.value)}
              placeholder="Explain why this incident is being escalated..."
              className="w-full bg-card border border-border text-foreground text-xs rounded-md p-2 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button size="sm" variant="outline" type="button" onClick={() => setIsEscalateModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit" disabled={isEscalating} className="bg-rose-600 hover:bg-rose-700 text-white">
              {isEscalating ? 'Escalating...' : 'Escalate Incident'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Note Modal */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title="Add Investigation Note"
      >
        <form onSubmit={handleAddNoteSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Note Content *</label>
            <textarea
              required
              rows={3}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Enter details from driver call, rider check-in, or telemetry check..."
              className="w-full bg-card border border-border text-foreground text-xs rounded-md p-2 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button size="sm" variant="outline" type="button" onClick={() => setIsNoteModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit" disabled={isAddingNote}>
              {isAddingNote ? 'Saving...' : 'Add Note'}
            </Button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  )
}

export default SafetyCenterPage
