import axios, { type AxiosResponse, type InternalAxiosRequestConfig, type AxiosError } from 'axios'
import { refreshSession } from '@/infrastructure/auth/session-refresh'
import { useAuthStore } from '@/store/auth.store'

export const requestAuthInterceptor = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  const token = useAuthStore.getState().token
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}

export const responseSuccessInterceptor = (response: AxiosResponse): AxiosResponse => {
  return response
}

function apiErrorMessage(error: AxiosError): string {
  const data = error.response?.data as Record<string, unknown> | undefined
  const envelope = (data?.error ?? data?.error) as { message?: string } | undefined
  return envelope?.message || error.message || 'Request failed'
}

function isAuthAttempt(url: string): boolean {
  return (
    url.includes('/auth/admin/login') ||
    url.includes('/auth/admin/otp') ||
    url.includes('/auth/otp') ||
    url.includes('/auth/token/refresh')
  )
}

export const responseErrorInterceptor = async (error: AxiosError): Promise<AxiosResponse | never> => {
  const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

  if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
    const url = originalRequest.url ?? ''
    if (!isAuthAttempt(url)) {
      originalRequest._retry = true
      const newToken = await refreshSession({ force: true })
      if (newToken) {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
        }
        return axios.request(originalRequest)
      }
    }
  }

  if ((error.response?.status ?? 0) >= 500) {
    console.error('API Infrastructure critical server error:', error.message)
  }

  return Promise.reject(new Error(apiErrorMessage(error)))
}
