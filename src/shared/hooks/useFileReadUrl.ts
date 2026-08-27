import { useEffect, useState } from 'react'
import { getFileReadUrl } from '@/shared/services/file-upload.service'
import { isFileId } from '@/shared/utils/file-ref'

export function useFileReadUrl(ref?: string | null) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!ref) {
      setUrl(null)
      return
    }

    if (!isFileId(ref)) {
      setUrl(ref)
      return
    }

    let cancelled = false
    setLoading(true)

    getFileReadUrl(ref)
      .then((resolved) => {
        if (!cancelled) setUrl(resolved)
      })
      .catch(() => {
        if (!cancelled) setUrl(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [ref])

  return { url, loading }
}
