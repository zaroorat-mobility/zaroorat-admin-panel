import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import AuthService from '../services'
import type { LoginFormData } from '../schemas'
import type { LoginResponse } from '../types'

/**
 * Custom Hook for handling login mutation state
 */
export const useLogin = () => {
  const navigate = useNavigate()
  const setCredentials = useAuthStore((state) => state.setCredentials)
  const setLoading = useAuthStore((state) => state.setLoading)

  return useMutation<LoginResponse, Error, LoginFormData>({
    mutationFn: (data) => AuthService.login(data),
    onMutate: () => {
      setLoading(true)
    },
    onSuccess: (data) => {
      setCredentials(data.token, data.user)
      navigate('/dashboard', { replace: true })
    },
    onError: (error) => {
      console.error('Login error details:', error)
    },
    onSettled: () => {
      setLoading(false)
    },
  })
}
