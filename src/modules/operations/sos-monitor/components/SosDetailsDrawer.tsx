import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { SosSeverityBadge } from './SosSeverityBadge'
import { SosTimer } from './SosTimer'
import { useAcknowledgeSOS, useResolveSOS } from '../../hooks'
import {
  X,
  MapPin,
  Shield,
  CheckCircle,
  AlertOctagon
} from 'lucide-react'
import type { SOSAlert, SosResolutionType } from '../types'

interface SosDetailsDrawerProps {
  alert: SOSAlert
  onClose: () => void
}

export const SosDetailsDrawer: React.FC<SosDetailsDrawerProps> = ({ alert, onClose }) => {
  const navigate = useNavigate()
  
  // State for forms
  const [ackNotes, setAckNotes] = useState('')
  const [resolveType, setResolveType] = useState<SosResolutionType>('False Alarm')
  const [resolveNotes, setResolveNotes] = useState('')

  // Mutation hooks
  const { mutate: acknowledge, isPending: isAcking } = useAcknowledgeSOS()
  const { mutate: resolve, isPending: isResolving } = useResolveSOS()

  const handleAcknowledge = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ackNotes.trim()) return

    acknowledge(
      { id: alert.id, notes: ackNotes },
      {
        onSuccess: () => {
          setAckNotes('')
          onClose()
        }
      }
    )
  }

  const handleResolve = (e: React.FormEvent) => {
    e.preventDefault()
    if (!resolveNotes.trim()) return

    resolve(
      { id: alert.id, resolutionType: resolveType, notes: resolveNotes },
      {
        onSuccess: () => {
          setResolveNotes('')
          onClose()
        }
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <Card className="w-full max-w-xl premium-card bg-white dark:bg-slate-950 text-left overflow-hidden flex flex-col max-h-[90vh]">
        <CardHeader className="border-b border-border pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-rose-500/10 text-rose-500">
              <AlertOctagon className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-black text-slate-800 dark:text-white text-sm">SOS Incident #{alert.id}</h3>
              <p className="text-[10px] text-slate-450 mt-0.5">Incident details, escalation, and resolution actions.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </CardHeader>

        <CardContent className="p-5 space-y-5 text-xs overflow-y-auto flex-1">
          {/* Status summary */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 border border-border rounded-xl">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Alert Status</span>
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded font-black text-[10px] uppercase border ${
                  alert.status === 'resolved'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : alert.status === 'acknowledged'
                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                    : 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse'
                }`}>{alert.status}</span>
                <SosSeverityBadge priority={alert.priority} />
              </div>
            </div>
            <div className="text-right space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Elapsed Duration</span>
              <div>
                <SosTimer timeRaised={alert.timeRaised} status={alert.status} />
              </div>
            </div>
          </div>

          {/* Details layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-bold text-slate-450 uppercase text-[10px] tracking-wider border-b pb-1">Telemetry Context</h4>
              <div className="space-y-1.5 font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-500">Location:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold max-w-[150px] text-right truncate" title={alert.location}>
                    <MapPin className="h-3 w-3 inline text-slate-400 mr-0.5" />
                    {alert.location}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Raised At:</span>
                  <strong className="text-slate-850 dark:text-white font-mono">{new Date(alert.timeRaised).toLocaleTimeString('en-IN')}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ride Ref:</span>
                  <button
                    onClick={() => {
                      onClose()
                      navigate(`/operations/ride-monitor/${alert.rideId}`)
                    }}
                    className="text-primary hover:underline font-bold font-mono"
                  >
                    #{alert.rideId}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-450 uppercase text-[10px] tracking-wider border-b pb-1">Participants</h4>
              <div className="space-y-1.5 font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-500">Rider / Passenger:</span>
                  <button
                    onClick={() => {
                      onClose()
                      navigate(`/rider-management/riders/${alert.riderId}`)
                    }}
                    className="text-primary hover:underline font-bold"
                  >
                    {alert.riderName}
                  </button>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Driver / Partner:</span>
                  <button
                    onClick={() => {
                      onClose()
                      navigate(`/driver-management/drivers/${alert.driverId}`)
                    }}
                    className="text-primary hover:underline font-bold"
                  >
                    {alert.driverName}
                  </button>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Plate Number:</span>
                  <strong className="text-slate-850 dark:text-white font-mono uppercase">{alert.vehiclePlate}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Acknowledgement notes displayed if already acknowledged */}
          {alert.acknowledgedBy && (
            <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl space-y-1 text-slate-700">
              <p className="font-bold flex items-center gap-1.5 text-amber-800">
                <Shield className="h-3.5 w-3.5" />
                <span>Operator Acknowledgement Log</span>
              </p>
              <p className="text-[10px] text-slate-500 font-mono">Agent: {alert.acknowledgedBy} @ {new Date(alert.acknowledgedAt || '').toLocaleTimeString('en-IN')}</p>
              <p className="text-[11px] font-medium leading-relaxed italic">"{alert.acknowledgementNotes}"</p>
            </div>
          )}

          {/* Resolution notes displayed if already resolved */}
          {alert.resolvedBy && (
            <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-1 text-slate-700">
              <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Resolution Logs [Type: {alert.resolutionType}]</span>
              </p>
              <p className="text-[10px] text-slate-500 font-mono">Agent: {alert.resolvedBy} @ {new Date(alert.resolvedAt || '').toLocaleTimeString('en-IN')}</p>
              <p className="text-[11px] font-medium leading-relaxed italic">"{alert.resolutionNotes}"</p>
            </div>
          )}

          {/* Action Workflow forms */}
          {alert.status === 'open' || alert.status === 'escalated' ? (
            <form onSubmit={handleAcknowledge} className="space-y-2 border-t pt-4">
              <h4 className="font-bold text-slate-850">Acknowledge Alert Event</h4>
              <p className="text-[10px] text-slate-450">Confirm you are responding to this incident. Notes are required for accountability.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Notes (e.g. Initiating passenger call sequence...)"
                  value={ackNotes}
                  onChange={(e) => setAckNotes(e.target.value)}
                  className="flex-1 p-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none"
                />
                <Button
                  type="submit"
                  disabled={isAcking}
                  className="h-[34px] px-4 font-semibold text-white bg-primary hover:bg-primary/95 text-xs rounded-lg"
                >
                  {isAcking ? 'Saving...' : 'Acknowledge'}
                </Button>
              </div>
            </form>
          ) : alert.status === 'acknowledged' ? (
            <form onSubmit={handleResolve} className="space-y-3 border-t pt-4">
              <h4 className="font-bold text-slate-850">Resolve Incident Ticket</h4>
              <p className="text-[10px] text-slate-450">Document final resolution before closing. This records logs directly to the audit ledgers.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Resolution Type</label>
                  <select
                    value={resolveType}
                    onChange={(e) => setResolveType(e.target.value as SosResolutionType)}
                    className="w-full p-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none h-[34px]"
                  >
                    <option value="False Alarm">False Alarm</option>
                    <option value="Customer Safe">Customer Safe</option>
                    <option value="Driver Safe">Driver Safe</option>
                    <option value="Emergency Services Contacted">Emergency Services Contacted</option>
                    <option value="Unable To Reach Customer">Unable To Reach Customer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Resolution Summary</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Summary notes..."
                      value={resolveNotes}
                      onChange={(e) => setResolveNotes(e.target.value)}
                      className="flex-1 p-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none h-[34px]"
                    />
                    <Button
                      type="submit"
                      disabled={isResolving}
                      className="h-[34px] px-4 font-semibold text-white bg-emerald-600 hover:bg-emerald-500 text-xs rounded-lg flex-shrink-0"
                    >
                      {isResolving ? 'Saving...' : 'Resolve Alert'}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          ) : null}

        </CardContent>
      </Card>
    </div>
  )
}

export default SosDetailsDrawer
