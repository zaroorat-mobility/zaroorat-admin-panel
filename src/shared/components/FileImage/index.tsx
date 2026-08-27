import React from 'react'
import { Loader2, User } from 'lucide-react'
import { cn } from '@/shared/utils'
import { useFileReadUrl } from '@/shared/hooks/useFileReadUrl'

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
  const { url, loading } = useFileReadUrl(src)

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!url) {
    return <div className={cn('flex items-center justify-center', className)}>{fallback}</div>
  }

  return <img src={url} alt={alt} className={className} />
}

export default FileImage
