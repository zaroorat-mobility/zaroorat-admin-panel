import React, { useState } from 'react'
import { FileText, Loader2, User } from 'lucide-react'
import { cn } from '@/shared/utils'
import { useFileReadUrl } from '@/shared/hooks/useFileReadUrl'
import { isPdfUrl } from '@/shared/utils/file-ref'

interface FileImageProps {
  src?: string | null
  alt?: string
  className?: string
  fallback?: React.ReactNode
}

export const FileImage: React.FC<FileImageProps> = ({
  src,
  alt = '',
  className,
  fallback = <User className="h-5 w-5 text-slate-400" />,
}) => {
  const { url, loading, isPdf } = useFileReadUrl(src)
  const [loadError, setLoadError] = useState(false)

  React.useEffect(() => {
    setLoadError(false)
  }, [src, url])

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
      </div>
    )
  }

  if (isPdf || isPdfUrl(src)) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center bg-rose-50/70 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 gap-1.5 p-3 select-none',
          className,
        )}
      >
        <FileText className="h-7 w-7 text-rose-500" />
        <span className="text-[10px] font-bold tracking-wider uppercase bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded">
          PDF Document
        </span>
      </div>
    )
  }

  if (!url || loadError) {
    return <div className={cn('flex items-center justify-center', className)}>{fallback}</div>
  }

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      onError={() => setLoadError(true)}
    />
  )
}

export default FileImage

