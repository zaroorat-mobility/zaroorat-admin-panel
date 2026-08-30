const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isFileId(value: string | null | undefined): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value)
}

export function resolveFileRef(fileUrl?: string | null, fileId?: string | null): string {
  if (fileId && isFileId(fileId)) return fileId
  return fileUrl?.trim() ?? ''
}
