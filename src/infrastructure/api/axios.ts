import axios from 'axios'
import { APP_CONFIG } from '@/app/config'
import {
  requestAuthInterceptor,
  responseSuccessInterceptor,
  responseErrorInterceptor,
} from './interceptors'

/**
 * Enterprise Axios Instance Configured for Zaroorat Mobility Admin
 */
const api = axios.create({
  baseURL: APP_CONFIG.api.baseUrl,
  timeout: APP_CONFIG.api.timeout,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Attach interceptors
api.interceptors.request.use(requestAuthInterceptor, (error) => Promise.reject(error))
api.interceptors.response.use(responseSuccessInterceptor, responseErrorInterceptor)

export default api
export { api as axiosInstance }
export * from './endpoints'
export * from './interceptors'
