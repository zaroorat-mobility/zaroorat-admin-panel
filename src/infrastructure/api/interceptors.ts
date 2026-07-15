import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/auth.store'

/**
 * Request interceptor to attach authentication token
 */
export const requestAuthInterceptor = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  const token = useAuthStore.getState().token
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}

/**
 * Response interceptor for global status handling and token refreshing
 */
export const responseSuccessInterceptor = (response: AxiosResponse): AxiosResponse => {
  return response
}

export const responseErrorInterceptor = async (error: any): Promise<never> => {
  const originalRequest = error.config

  // Handle Token Expiration (401)
  if (error.response?.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true
    try {
      // Logic for token refresh would go here
      // const nextToken = await refreshAuthToken();
      // useAuthStore.getState().setCredentials(nextToken, user);
      // originalRequest.headers.Authorization = `Bearer ${nextToken}`;
      // return axiosInstance(originalRequest);
    } catch (refreshError) {
      useAuthStore.getState().clearCredentials()
      return Promise.reject(refreshError)
    }
  }

  // Handle Global Server Errors (500)
  if (error.response?.status >= 500) {
    console.error('API Infrastructure critical server error:', error.message)
  }

  return Promise.reject(error)
}
