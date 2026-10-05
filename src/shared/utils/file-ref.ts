const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isFileId(value: string | null | undefined): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value)
}

export function resolveFileRef(fileUrl?: string | null, fileId?: string | null): string {
  if (fileId && isFileId(fileId)) return fileId
  return fileUrl?.trim() ?? ''
}

export function isPdfUrl(urlOrRef?: string | null, contentType?: string | null): boolean {
  if (contentType?.toLowerCase().includes('application/pdf')) return true
  if (!urlOrRef) return false
  const lower = urlOrRef.toLowerCase()
  return (
    lower.includes('.pdf') ||
    lower.includes('application%2fpdf') ||
    lower.includes('response-content-type=application%2fpdf')
  )
}
