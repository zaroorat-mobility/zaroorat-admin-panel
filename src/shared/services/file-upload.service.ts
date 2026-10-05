import axios from 'axios'
import { api, API_ENDPOINTS } from '@/infrastructure/api'

export type FilePurpose = 'PROFILE_IMAGE' | 'DRIVER_DOCUMENT' | 'VEHICLE_DOCUMENT' | 'PROMO_BANNER'

interface CreateUploadResponse {
  fileId: string
  status: 'PENDING'
  upload: {
    method: 'PUT'
    url: string
    headers: Record<string, string>
    expiresAt: string
  }
}

export interface FileReadUrlResponse {
  url: string
  expiresAt: string
  contentType: string
}

export async function getFileReadInfo(
  fileId: string,
  disposition: 'inline' | 'attachment' = 'inline',
): Promise<FileReadUrlResponse> {
  const response = await api.get<FileReadUrlResponse>(API_ENDPOINTS.files.readUrl(fileId), {
    params: { disposition },
  })
  return response.data
}

export async function getFileReadUrl(
  fileId: string,
  disposition: 'inline' | 'attachment' = 'inline',
): Promise<string> {
  const info = await getFileReadInfo(fileId, disposition)
  return info.url
}

function normalizeContentType(file: File): string {
  const type = file.type?.toLowerCase().trim() || ''
  if (type === 'image/jpg') return 'image/jpeg'
  if (!type || type === 'application/octet-stream') {
    const ext = file.name.toLowerCase().split('.').pop()
    if (ext === 'png') return 'image/png'
    if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
    if (ext === 'webp') return 'image/webp'
    if (ext === 'pdf') return 'application/pdf'
  }
  return type
}

export async function uploadFile(
  file: File,
  purpose: FilePurpose,
): Promise<{ fileId: string; readUrl: string }> {
  const contentType = normalizeContentType(file)

  const initResponse = await api.post<CreateUploadResponse>(
    API_ENDPOINTS.files.create,
    {
      purpose,
      fileName: file.name,
      contentType,
      sizeBytes: file.size,
    },
    { headers: { 'Idempotency-Key': crypto.randomUUID() } },
  )

  const { fileId, upload } = initResponse.data
  await axios.put(upload.url, file, { headers: upload.headers })
  await api.post(API_ENDPOINTS.files.complete(fileId))
  const readUrl = await getFileReadUrl(fileId)

  return { fileId, readUrl }
}

