/**
 * Shared Type Declarations for Zaroorat Mobility Admin
 */

export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    currentPage: number
    totalPages: number
    pageSize: number
    totalCount: number
  }
}

export interface ApiErrorResponse {
  message: string
  code: string
  errors?: Record<string, string[]>
}

export type QueryParams = {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  [key: string]: any
}
