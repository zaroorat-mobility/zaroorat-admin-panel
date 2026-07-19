import React from 'react'
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'

interface ImagePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  title?: string
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title = 'Document Preview',
}) => {
  const [scale, setScale] = React.useState(1)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <span className="font-bold text-slate-800 dark:text-slate-100 text-sm tracking-wide uppercase">{title}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScale(prev => Math.max(0.5, prev - 0.2))}
              className="h-8 w-8 p-0 rounded-lg"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScale(prev => Math.min(3, prev + 0.2))}
              className="h-8 w-8 p-0 rounded-lg"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-slate-50 dark:hover:bg-slate-850"
              title="Download File"
            >
              <Download className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </a>
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-auto bg-slate-950 flex items-center justify-center p-6 min-h-[300px]">
          <div className="transition-transform duration-200 ease-out" style={{ transform: `scale(${scale})` }}>
            <img
              src={imageUrl}
              alt={title}
              className="max-w-full max-h-[70vh] rounded-lg object-contain shadow-lg"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
