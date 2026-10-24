import React, { useRef, useState } from 'react'
import { UploadCloud, RotateCcw, Eye, Smartphone } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Badge } from '@/shared/components/ui/Badge'
import { uploadFile } from '@/shared/services/file-upload.service'
import { useToast } from '@/shared/context/toast'

export interface LogoUploadFieldProps {
  value: string
  onChange: (url: string) => void
  appName?: string
  brandBgColor?: string
  brandLabel?: string
  fallbackBadge?: string
  platformName?: string
  onOpenViewer?: () => void
}

async function convertSvgToPng(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        let svgText = (e.target?.result as string) || ''

        // Ensure xmlns is present if missing
        if (!svgText.includes('xmlns=')) {
          svgText = svgText.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
        }

        // If width or height are missing but viewBox exists, inject width and height for proper rasterization
        const hasWidth = /<svg[^>]*\bwidth\s*=/i.test(svgText)
        const hasHeight = /<svg[^>]*\bheight\s*=/i.test(svgText)
        if (!hasWidth || !hasHeight) {
          svgText = svgText.replace(/<svg\b/i, '<svg width="1024" height="1024"')
        }

        const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const img = new Image()

        img.onload = () => {
          try {
            const MAX_DIM = 1024
            let width = img.naturalWidth || img.width || MAX_DIM
            let height = img.naturalHeight || img.height || MAX_DIM

            if (width > MAX_DIM || height > MAX_DIM) {
              const scale = Math.min(MAX_DIM / width, MAX_DIM / height)
              width = Math.round(width * scale)
              height = Math.round(height * scale)
            }

            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height

            const ctx = canvas.getContext('2d')
            if (!ctx) {
              URL.revokeObjectURL(url)
              reject(new Error('Failed to obtain canvas context'))
              return
            }

            ctx.clearRect(0, 0, width, height)
            ctx.drawImage(img, 0, 0, width, height)

            canvas.toBlob(
              (pngBlob) => {
                URL.revokeObjectURL(url)
                if (!pngBlob) {
                  reject(new Error('PNG conversion failed'))
                  return
                }
                const convertedFile = new File(
                  [pngBlob],
                  file.name.replace(/\.svg$/i, '.png'),
                  { type: 'image/png' },
                )
                resolve(convertedFile)
              },
              'image/png',
              1.0,
            )
          } catch (err) {
            URL.revokeObjectURL(url)
            reject(err)
          }
        }

        img.onerror = () => {
          URL.revokeObjectURL(url)
          reject(new Error('Invalid SVG content cannot be rendered'))
        }

        img.src = url
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Failed to read SVG file'))
    reader.readAsText(file)
  })
}

export const LogoUploadField: React.FC<LogoUploadFieldProps> = ({
  value,
  onChange,
  appName = 'App',
  brandBgColor = '#1F2B6D',
  brandLabel = 'Navy Theme Preview (Login Sheet / Splash)',
  fallbackBadge = 'Bundled AppIcon.svg (Default)',
  platformName = 'Zaroorat',
  onOpenViewer,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [localBlobUrl, setLocalBlobUrl] = useState<string | null>(null)
  const [imgError, setImgError] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showManualUrl, setShowManualUrl] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const { success, error } = useToast()

  // Use local instant preview first if user just selected a file, otherwise saved value
  const effectiveUrl = localBlobUrl || value
  const hasImage = Boolean(effectiveUrl && !imgError)

  const handleFileProcess = async (file: File) => {
    // Validate format
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
    const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')
    if (!validTypes.includes(file.type.toLowerCase()) && !isSvg) {
      error('Invalid format', 'Please upload a PNG, WebP, JPEG, or SVG image.')
      return
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      error('File too large', 'Logo file size must be less than 5 MB.')
      return
    }

    // 1. Instant 0ms local preview
    try {
      const localBlob = URL.createObjectURL(file)
      setLocalBlobUrl(localBlob)
      setImgError(false)
    } catch {
      // fallback
    }

    // 2. Upload to backend/storage
    try {
      setIsUploading(true)
      let fileToUpload = file
      if (isSvg) {
        fileToUpload = await convertSvgToPng(file)
      }
      const { readUrl } = await uploadFile(fileToUpload, 'PROMO_BANNER')
      onChange(readUrl)
      success('Logo Uploaded', 'New logo uploaded to CDN storage. Click "Save changes" to publish.')
    } catch (err: any) {
      const serverMessage =
        err?.response?.data?.error?.message ||
        (err instanceof Error ? err.message : 'Could not upload file to storage.')
      error('Upload failed', serverMessage)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  return (
    <div className="space-y-4">
      {/* Upload Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40'
        } ${isUploading ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileProcess(e.target.files[0])
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {isUploading ? 'Uploading to CDN storage...' : `Click to upload or drag & drop ${appName} logo`}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              PNG, WebP, JPEG, or SVG (Transparent vector or raster, max 5MB)
            </p>
          </div>
        </div>
      </div>

      {/* Live Preview Cards */}
      <div className="bg-slate-100 dark:bg-slate-900/80 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              {appName} Icon & Live Previews
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {onOpenViewer && (
              <button
                type="button"
                onClick={onOpenViewer}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Full iOS & Android Viewer</span>
              </button>
            )}
            {effectiveUrl ? (
              <Badge variant="primary" className="text-xs">
                Custom Upload Active
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                {fallbackBadge}
              </Badge>
            )}
            {effectiveUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setLocalBlobUrl(null)
                  setImgError(false)
                  onChange('')
                }}
                className="h-7 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* 4 Preview Boxes: iOS Squircle Icon | Android Round Icon | Light Header | Dark Theme */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Box 1:  iOS App Icon (Squircle) */}
          <div className="rounded-xl p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col items-center justify-center min-h-[110px] text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">
               iOS Squircle
            </span>
            <div
              className="w-12 h-12 rounded-[22%] shadow-md overflow-hidden flex items-center justify-center border border-black/10 select-none p-1 transition-transform hover:scale-105"
              style={{ backgroundColor: brandBgColor }}
            >
              {hasImage ? (
                <img
                  src={effectiveUrl}
                  alt={`${appName} iOS icon`}
                  className="w-full h-full object-contain"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span className="text-white font-extrabold text-base">
                  {platformName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight max-w-[76px] line-clamp-1 mt-1.5"
              title={appName.toLowerCase().includes('driver') ? `${platformName} Driver` : platformName}
            >
              {appName.toLowerCase().includes('driver') ? `${platformName} Driver` : platformName}
            </span>
          </div>

          {/* Box 2: 🤖 Android App Icon (Circle) */}
          <div className="rounded-xl p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col items-center justify-center min-h-[110px] text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">
              🤖 Android Round
            </span>
            <div
              className="w-12 h-12 rounded-full shadow-md overflow-hidden flex items-center justify-center border border-black/10 select-none p-1 transition-transform hover:scale-105"
              style={{ backgroundColor: brandBgColor }}
            >
              {hasImage ? (
                <img
                  src={effectiveUrl}
                  alt={`${appName} Android icon`}
                  className="w-full h-full object-contain"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span className="text-white font-extrabold text-base">
                  {platformName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight max-w-[76px] line-clamp-1 mt-1.5"
              title={appName.toLowerCase().includes('driver') ? `${platformName} Driver` : platformName}
            >
              {appName.toLowerCase().includes('driver') ? `${platformName} Driver` : platformName}
            </span>
          </div>

          {/* Box 3: Light Header Topbar */}
          <div className="rounded-xl p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col items-center justify-center min-h-[110px]">
            <span className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">
              Light Header
            </span>
            {hasImage ? (
              <img
                src={effectiveUrl}
                alt={`${appName} logo light`}
                className="max-h-9 max-w-[90px] object-contain"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-200 font-bold text-xs tracking-wider">
                <div className="w-5 h-5 rounded-md bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">
                  {platformName.charAt(0).toUpperCase()}
                </div>
                <span className="truncate max-w-[65px]">{platformName}</span>
              </div>
            )}
          </div>

          {/* Box 4: Branded Dark Splash Theme */}
          <div
            className="rounded-xl p-3 text-white shadow-xs flex flex-col items-center justify-center min-h-[110px]"
            style={{ backgroundColor: brandBgColor }}
            title={brandLabel}
          >
            <span className="text-[10px] uppercase font-bold text-white/75 mb-1.5 truncate max-w-[100px]" title={brandLabel}>
              Dark Theme
            </span>
            {hasImage ? (
              <img
                src={effectiveUrl}
                alt={`${appName} logo dark`}
                className="max-h-9 max-w-[90px] object-contain"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex items-center space-x-1.5 text-white font-bold text-xs tracking-wider">
                <div className="w-5 h-5 rounded-md bg-white/20 text-white flex items-center justify-center text-[10px] font-bold">
                  {platformName.charAt(0).toUpperCase()}
                </div>
                <span className="truncate max-w-[65px]">{platformName}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual URL Toggle (for advanced inspection) */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowManualUrl(!showManualUrl)}
          className="text-xs text-primary hover:underline font-medium focus:outline-none"
        >
          {showManualUrl ? 'Hide manual URL' : 'Inspect or edit logo URL directly'}
        </button>
        {showManualUrl && (
          <div className="mt-2">
            <Input
              value={value}
              onChange={(e) => {
                setLocalBlobUrl(null)
                setImgError(false)
                onChange(e.target.value)
              }}
              placeholder="https://cdn.zaroorat.com/..."
              className="text-xs font-mono"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default LogoUploadField
