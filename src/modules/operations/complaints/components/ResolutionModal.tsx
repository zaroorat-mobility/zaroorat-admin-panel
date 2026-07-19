import React, { useState } from 'react'
import { Card, CardHeader, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { X, CheckCircle } from 'lucide-react'

interface ResolutionModalProps {
  isOpen: boolean
  onCancel: () => void
  onConfirm: (notes: string) => void
  title: string
  description: string
  confirmText?: string
  loading?: boolean
}

export const ResolutionModal: React.FC<ResolutionModalProps> = ({
  isOpen,
  onCancel,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm Resolution',
  loading
}) => {
  const [notes, setNotes] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!notes.trim()) return
    onConfirm(notes)
    setNotes('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <Card className="w-full max-w-md premium-card bg-white dark:bg-slate-950 text-left">
        <CardHeader className="border-b border-border pb-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-emerald-500/10 text-emerald-500">
              <CheckCircle className="h-4 w-4" />
            </span>
            <h3 className="font-black text-slate-800 dark:text-white text-sm">{title}</h3>
          </div>
          <button onClick={onCancel} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="p-5 space-y-4 text-xs">
            <p className="text-slate-500 font-medium">{description}</p>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase">Resolution / Closure Summary</label>
              <textarea
                required
                rows={3}
                placeholder="Explain the final action taken to resolve this ticket..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="h-9 px-4 text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !notes.trim()}
                className="h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {loading ? 'Processing...' : confirmText}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}

export default ResolutionModal
