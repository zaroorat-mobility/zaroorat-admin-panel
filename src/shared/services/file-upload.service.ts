import axios from 'axios'
import { api, API_ENDPOINTS } from '@/infrastructure/api'

export type FilePurpose = 'PROFILE_IMAGE' | 'DRIVER_DOCUMENT' | 'VEHICLE_DOCUMENT'

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

interface FileReadUrlResponse {
  url: string
  expiresAt: string
  contentType: string
}

export async function getFileReadUrl(
  fileId: string,
  disposition: 'inline' | 'attachment' = 'inline',
): Promise<string> {
  const response = await api.get<FileReadUrlResponse>(API_ENDPOINTS.files.readUrl(fileId), {
    params: { disposition },
  })
  return response.data.url
}

export async function uploadFile(
  file: File,
  purpose: FilePurpose,
): Promise<{ fileId: string; readUrl: string }> {
  const initResponse = await api.post<CreateUploadResponse>(
    API_ENDPOINTS.files.create,
    {
      purpose,
      fileName: file.name,
      contentType: file.type,
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
