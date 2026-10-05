import { useEffect, useState } from 'react'
import { getFileReadInfo } from '@/shared/services/file-upload.service'
import { isFileId, isPdfUrl } from '@/shared/utils/file-ref'

export function useFileReadUrl(ref?: string | null) {
  const [url, setUrl] = useState<string | null>(null)
  const [contentType, setContentType] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!ref) {
      setUrl(null)
      setContentType(null)
      return
    }

    if (!isFileId(ref)) {
      setUrl(ref)
      setContentType(null)
      return
    }

    let cancelled = false
    setLoading(true)

    getFileReadInfo(ref)
      .then((data) => {
        if (!cancelled) {
          setUrl(data.url)
          setContentType(data.contentType)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUrl(null)
          setContentType(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [ref])

  const isPdf = isPdfUrl(url, contentType) || isPdfUrl(ref)

  return { url, loading, contentType, isPdf }
}

