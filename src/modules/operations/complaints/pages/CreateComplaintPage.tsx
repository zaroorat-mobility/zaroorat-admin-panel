import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateComplaint } from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { Save, AlertCircle } from 'lucide-react'
import type { ComplaintCategory, ComplaintPriority } from '../types'

export const CreateComplaintPage: React.FC = () => {
  const navigate = useNavigate()
  const { mutate: createTicket, isPending } = useCreateComplaint()

  const [category, setCategory] = useState<ComplaintCategory>('Driver Behaviour')
  const [priority, setPriority] = useState<ComplaintPriority>('medium')
  const [raisedBy, setRaisedBy] = useState<'rider' | 'driver' | 'admin'>('admin')
  const [raisedByName, setRaisedByName] = useState('')
  const [rideId, setRideId] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) {
      setError('Description is required.')
      return
    }
    if (!raisedByName.trim()) {
      setError('Raised by name is required.')
      return
    }

    setError('')
    createTicket(
      {
        category,
        priority,
        raisedBy,
        raisedByName,
        rideId: rideId.trim() || undefined,
        description,
        status: 'open'
      },
      {
        onSuccess: () => {
          navigate('/operations/complaints')
        }
      }
    )
  }

  return (
    <PageWrapper>
      <PageHeader
        title="File Support Complaint"
        description="Establish ticket logs matching feedback categories, priority SLAs, and operational links."
        onBack={() => navigate('/operations/complaints')}
      />

      <form onSubmit={handleSubmit} className="space-y-6 text-left max-w-3xl mt-4">
        <Card className="premium-card">
          <CardContent className="p-6 space-y-4 text-xs">
            
            <div className="border-b pb-3 mb-2">
              <h3 className="font-bold text-slate-800 text-sm">Complaint Parameters</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Specify who is submitting, category of concern, and optional ride association.</p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                  className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                >
                  <option value="Driver Behaviour">Driver Behaviour</option>
                  <option value="Rider Behaviour">Rider Behaviour</option>
                  <option value="Safety">Safety</option>
                  <option value="SOS Related">SOS Related</option>
                  <option value="Payment">Payment</option>
                  <option value="Fare Dispute">Fare Dispute</option>
                  <option value="Vehicle Condition">Vehicle Condition</option>
                  <option value="Lost Item">Lost Item</option>
                  <option value="App Issue">App Issue</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase">Priority SLA</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
                  className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                >
                  <option value="low">Low (24h response)</option>
                  <option value="medium">Medium (4h response)</option>
                  <option value="high">High (1h response)</option>
                  <option value="critical">Critical (15m response)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase">Raiser Entity</label>
                <select
                  value={raisedBy}
                  onChange={(e) => setRaisedBy(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                >
                  <option value="admin">Admin / Operator</option>
                  <option value="rider">Rider / Passenger</option>
                  <option value="driver">Driver / Partner</option>
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-450 uppercase">Raiser Name</label>
                <input
                  type="text"
                  placeholder="e.g. Aditya Sharma"
                  value={raisedByName}
                  onChange={(e) => setRaisedByName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase">Associated Ride ID (Optional)</label>
              <input
                type="text"
                placeholder="e.g. ride-101"
                value={rideId}
                onChange={(e) => setRideId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase">Description of Incident</label>
              <textarea
                rows={4}
                placeholder="Log details of complaints..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/operations/complaints')}
                className="h-9 px-4 text-xs font-semibold border-border"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="h-9 px-4 text-xs font-semibold bg-primary hover:bg-primary/95 text-white"
              >
                <Save className="h-4 w-4 mr-1.5" />
                <span>{isPending ? 'Logging Ticket...' : 'File Support Ticket'}</span>
              </Button>
            </div>

          </CardContent>
        </Card>
      </form>
    </PageWrapper>
  )
}

export default CreateComplaintPage
