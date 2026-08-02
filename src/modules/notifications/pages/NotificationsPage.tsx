import React, { useState } from 'react'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { DataTable } from '@/shared/components/DataTable'
import { Bell, Plus, Calendar, Tag, Users, Clock } from 'lucide-react'

interface NotificationItem {
  id: string
  type: 'coupon' | 'reward' | 'promotion' | 'referral' | 'in_app'
  title: string
  body: string
  audience: string
  startDate: string
  endDate: string
  couponCode?: string
  discount?: string
  usageLimit?: number
  status: 'draft' | 'scheduled' | 'active' | 'expired'
}

export const NotificationsPage: React.FC = () => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: 'NT-101', type: 'coupon', title: 'Monsoon Ride Discount', body: 'Get 20% off up to Rs.50 on your rides this rainy season!', audience: 'Riders · All regions', startDate: '2026-08-01 00:00', endDate: '2026-08-31 23:59', couponCode: 'RAIN20', discount: '20% off, max ₹50', usageLimit: 1000, status: 'active' },
    { id: 'NT-102', type: 'reward', title: 'Driver Weekly Milestone bonus', body: 'Complete 30 trips this week and earn an extra Rs.500 milestone bonus.', audience: 'Drivers · Bengaluru', startDate: '2026-08-10 00:00', endDate: '2026-08-17 00:00', status: 'scheduled' },
    { id: 'NT-103', type: 'promotion', title: 'School vertical Launch', body: 'Zaroorat School mobility is now live in your sector. Book a safe shuttle ride today.', audience: 'Riders · HSR Layout', startDate: '2026-07-15 09:00', endDate: '2026-07-31 18:00', status: 'expired' }
  ])

  const [formData, setFormData] = useState<Omit<NotificationItem, 'id'>>({
    type: 'coupon',
    title: '',
    body: '',
    audience: 'Riders',
    startDate: '',
    endDate: '',
    couponCode: '',
    discount: '',
    usageLimit: undefined,
    status: 'draft'
  })

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const id = `NT-${Math.floor(100 + Math.random() * 900)}`
    setNotifications([ ...notifications, { ...formData, id } ])
    setShowAddForm(false)
    setFormData({
      type: 'coupon',
      title: '',
      body: '',
      audience: 'Riders',
      startDate: '',
      endDate: '',
      couponCode: '',
      discount: '',
      usageLimit: undefined,
      status: 'draft'
    })
  }

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (val: string) => <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{val}</span>
    },
    {
      key: 'title',
      label: 'Notification details',
      render: (val: string, row: NotificationItem) => (
        <div className="max-w-xs space-y-0.5">
          <p className="font-bold text-slate-800 dark:text-white truncate">{val}</p>
          <p className="text-[10px] text-muted-foreground line-clamp-1">{row.body}</p>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (val: string) => (
        <span className="capitalize font-semibold text-slate-655 font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
          {val.replace('_', ' ')}
        </span>
      )
    },
    {
      key: 'audience',
      label: 'Audience / Target',
      render: (val: string) => (
        <span className="text-slate-655 flex items-center gap-1">
          <Users className="h-3.5 w-3.5 text-slate-400" />
          {val}
        </span>
      )
    },
    {
      key: 'startDate',
      label: 'Active Timeline',
      render: (_, row: NotificationItem) => (
        <div className="text-[10px] font-mono text-slate-500 space-y-0.5">
          <p className="flex items-center gap-1"><Calendar className="h-3 w-3 text-slate-400" /> From: {row.startDate}</p>
          <p className="flex items-center gap-1"><Calendar className="h-3 w-3 text-slate-400" /> To: {row.endDate}</p>
        </div>
      )
    },
    {
      key: 'couponCode',
      label: 'Discount / Coupon & Limits',
      render: (val: string | undefined, row: NotificationItem) => (
        <div className="space-y-0.5 text-left">
          {val ? (
            <>
              <div className="flex items-center gap-1">
                <Tag className="h-3 w-3 text-primary" />
                <span className="font-mono font-bold text-primary">{val}</span>
                <span className="text-[9px] text-slate-400">({row.discount})</span>
              </div>
              {row.usageLimit !== undefined && (
                <p className="text-[9px] text-slate-450 font-bold">Limit: {row.usageLimit} uses</p>
              )}
            </>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (val: string) => {
        let style = 'bg-slate-50 text-slate-500 border-slate-100'
        if (val === 'active') style = 'bg-emerald-50 text-emerald-700 border-emerald-100'
        if (val === 'scheduled') style = 'bg-indigo-50 text-indigo-700 border-indigo-100'
        if (val === 'expired') style = 'bg-rose-50 text-rose-700 border-rose-100'
        return (
          <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] border font-black uppercase tracking-wider ${style}`}>
            {val}
          </span>
        )
      }
    }
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Campaigns & Notifications Manager"
        description="Configure dynamic client notifications, scheduling parameters, marketing milestones, and discount codes."
      />

      <div className="space-y-6 text-left">
        {!showAddForm ? (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Active Notifications Ledger</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Edit existing rules or review active marketing coupons live across platforms.</p>
              </div>
              <Button
                onClick={() => setShowAddForm(true)}
                className="gap-1.5 bg-[#2B317A] text-white hover:bg-[#2B317A]/95 text-xs font-semibold h-9 rounded-lg"
              >
                <Plus className="h-4 w-4" /> Create Notification
              </Button>
            </div>

            <DataTable
              columns={columns}
              data={notifications}
              selectable={false}
              resultLabel="notifications"
            />
          </div>
        ) : (
          <div className="max-w-xl animate-fade-in">
            <Card className="premium-card">
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="border-b pb-3 mb-2 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Create New Notification</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Establish campaigns, schedule times, and target user clusters.</p>
                  </div>
                  <Bell className="h-5 w-5 text-primary" />
                </div>

                <form onSubmit={handleAdd} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Campaign Type</label>
                      <select
                        value={formData.type}
                        onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                        className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                      >
                        <option value="coupon">Discount Coupon</option>
                        <option value="reward">Loyalty Reward</option>
                        <option value="promotion">General Promotion</option>
                        <option value="referral">Referral Code</option>
                        <option value="in_app">In-App Notification</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Target Audience Segment</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Riders · Bengaluru, Drivers · HSR Layout"
                        value={formData.audience}
                        onChange={e => setFormData({ ...formData, audience: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Campaign Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Welcome Promo"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Message Body / Contents</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Write message contents to be displayed on user screen..."
                      value={formData.body}
                      onChange={e => setFormData({ ...formData, body: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  {formData.type === 'coupon' && (
                    <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-900 border border-border rounded-lg">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Coupon Code</label>
                        <input
                          type="text"
                          required={formData.type === 'coupon'}
                          placeholder="e.g. MONSOON20"
                          value={formData.couponCode}
                          onChange={e => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                          className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-surface dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Discount Details</label>
                        <input
                          type="text"
                          required={formData.type === 'coupon'}
                          placeholder="e.g. 20% off, max ₹50"
                          value={formData.discount}
                          onChange={e => setFormData({ ...formData, discount: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-surface dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Usage Limit</label>
                        <input
                          type="number"
                          placeholder="e.g. 1000"
                          value={formData.usageLimit !== undefined ? formData.usageLimit : ''}
                          onChange={e => setFormData({ ...formData, usageLimit: parseInt(e.target.value) || undefined })}
                          className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-surface dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Start Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={formData.startDate}
                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none [color-scheme:light]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="h-3 w-3" /> End Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={formData.endDate}
                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none [color-scheme:light]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Status Mode</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                    >
                      <option value="draft">Draft (Inactive)</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="active">Active (Publish immediately)</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 border-t border-border pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddForm(false)}
                      className="h-9 border-border"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-[#2B317A] text-white hover:bg-[#2B317A]/95 text-xs font-semibold h-9 rounded-lg px-4"
                    >
                      Save Notification
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
