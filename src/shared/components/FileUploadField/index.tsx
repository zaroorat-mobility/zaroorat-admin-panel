import React, { useRef, useState } from 'react'
import { Eye, FileText, Loader2, Upload, User, X } from 'lucide-react'
import { cn } from '@/shared/utils'
import { uploadFile, type FilePurpose } from '@/shared/services/file-upload.service'
import { useFileReadUrl } from '@/shared/hooks/useFileReadUrl'
import { isFileId } from '@/shared/utils/file-ref'

export interface FileUploadFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  purpose: FilePurpose
  error?: string
  helperText?: string
  required?: boolean
  variant?: 'avatar' | 'document'
  accept?: string
  onPreview?: (url: string, title: string) => void
}

const DEFAULT_ACCEPT: Record<FilePurpose, string> = {
  PROFILE_IMAGE: 'image/jpeg,image/png,image/webp',
  DRIVER_DOCUMENT: 'image/jpeg,image/png,image/webp,application/pdf',
  VEHICLE_DOCUMENT: 'image/jpeg,image/png,image/webp,application/pdf',
  PROMO_BANNER: 'image/jpeg,image/png,image/webp',
}

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  label,
  value,
  onChange,
  purpose,
  error,
  helperText,
  required = false,
  variant = 'document',
  accept,
  onPreview,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const { url: previewUrl, loading: previewLoading } = useFileReadUrl(value)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setUploading(true)
    setUploadError(null)
    try {
      const { fileId } = await uploadFile(file, purpose)
      onChange(fileId)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleClear = () => {
    onChange('')
    setUploadError(null)
  }

  const hasValue = Boolean(value)
  const displayError = error || uploadError

  return (
    <div className="w-full space-y-1.5 text-left">
      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
        {required ? ' *' : ''}
      </label>

      <div
        className={cn(
          'rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 transition-colors',
          displayError ? 'border-destructive' : 'border-border',
          variant === 'avatar' ? 'p-3' : 'p-3.5',
        )}
      >
        <div className={cn('flex items-center gap-3', variant === 'avatar' ? 'flex-row' : 'justify-between')}>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className={cn(
                'rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 flex items-center justify-center flex-shrink-0',
                variant === 'avatar' ? 'h-12 w-12' : 'h-10 w-10',
              )}
            >
              {previewLoading || uploading ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              ) : previewUrl ? (
                <img src={previewUrl} alt={label} className="h-full w-full object-cover" />
              ) : hasValue && !isFileId(value) ? (
                <FileText className="h-4 w-4 text-primary" />
              ) : variant === 'avatar' ? (
                <User className="h-5 w-5 text-slate-400" />
              ) : (
                <FileText className="h-4 w-4 text-slate-400" />
              )}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {hasValue ? 'File uploaded' : 'No file uploaded'}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {helperText ?? 'Upload JPG, PNG, WEBP' + (purpose !== 'PROFILE_IMAGE' ? ', or PDF' : '')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {hasValue && previewUrl && onPreview && (
              <button
                type="button"
                onClick={() => onPreview(previewUrl, label)}
                className="p-1.5 rounded-lg border border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                aria-label={`Preview ${label}`}
              >
                <Eye className="h-4 w-4" />
              </button>
            )}
            {hasValue && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 rounded-lg border border-border hover:bg-rose-50 hover:text-rose-600 text-slate-500 transition-colors"
                aria-label={`Remove ${label}`}
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60"
            >
              <Upload className="h-3.5 w-3.5" />
              {hasValue ? 'Replace' : 'Upload'}
            </button>
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept ?? DEFAULT_ACCEPT[purpose]}
        className="hidden"
        onChange={handleFileSelect}
      />

      {displayError ? (
        <p className="text-xs font-medium text-destructive mt-1">{displayError}</p>
      ) : null}
    </div>
  )
}

export default FileUploadField
