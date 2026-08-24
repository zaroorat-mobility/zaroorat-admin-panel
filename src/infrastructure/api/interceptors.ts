import type { AxiosResponse, InternalAxiosRequestConfig, AxiosError } from 'axios'
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
  const data = error.response?.data as { error?: { message?: string; code?: string } } | undefined
  return data?.error?.message || error.message || 'Request failed'
}

export const responseErrorInterceptor = async (error: AxiosError): Promise<never> => {
  const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

  if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
    originalRequest._retry = true
    const url = originalRequest.url ?? ''
    const isAuthAttempt =
      url.includes('/auth/admin/login') ||
      url.includes('/auth/admin/otp') ||
      url.includes('/auth/otp')
    if (!isAuthAttempt) {
      useAuthStore.getState().clearCredentials()
    }
  }

  if ((error.response?.status ?? 0) >= 500) {
    console.error('API Infrastructure critical server error:', error.message)
  }

  return Promise.reject(new Error(apiErrorMessage(error)))
}
