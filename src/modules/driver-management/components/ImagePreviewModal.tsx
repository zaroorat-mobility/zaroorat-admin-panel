import React from 'react'
import { X, ZoomIn, ZoomOut, Download, ExternalLink, FileText } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { isPdfUrl } from '@/shared/utils/file-ref'

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

  React.useEffect(() => {
    if (isOpen) setScale(1)
  }, [isOpen, imageUrl])

  if (!isOpen) return null

  const isPdf = isPdfUrl(imageUrl)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            {isPdf && <FileText className="h-4 w-4 text-rose-500" />}
            <span className="font-bold text-slate-800 dark:text-slate-100 text-sm tracking-wide uppercase">{title}</span>
          </div>
          <div className="flex items-center gap-3">
            {!isPdf && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScale((prev) => Math.max(0.5, prev - 0.2))}
                  className="h-10 w-10 p-0 rounded-xl"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-5 w-5" strokeWidth={2.25} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScale((prev) => Math.min(3, prev + 0.2))}
                  className="h-10 w-10 p-0 rounded-xl"
                  title="Zoom In"
                >
                  <ZoomIn className="h-5 w-5" strokeWidth={2.25} />
                </Button>
              </>
            )}
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border hover:bg-slate-50 dark:hover:bg-slate-850"
              title="Open in new tab"
            >
              <ExternalLink className="h-5 w-5 text-slate-700 dark:text-slate-200" strokeWidth={2.25} />
            </a>
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              download
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border hover:bg-slate-50 dark:hover:bg-slate-850"
              title="Download File"
            >
              <Download className="h-5 w-5 text-slate-700 dark:text-slate-200" strokeWidth={2.25} />
            </a>
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="h-10 w-10 p-0 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors"
              title="Close"
            >
              <X className="h-5 w-5" strokeWidth={2.25} />
            </Button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-auto bg-slate-950 flex items-center justify-center p-4 min-h-[400px]">
          {isPdf ? (
            <div className="w-full h-[70vh] rounded-lg overflow-hidden bg-white shadow-lg">
              <iframe
                src={imageUrl}
                title={title}
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <div className="transition-transform duration-200 ease-out" style={{ transform: `scale(${scale})` }}>
              <img
                src={imageUrl}
                alt={title}
                className="max-w-full max-h-[70vh] rounded-lg object-contain shadow-lg"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

