import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import AuthService from '../services'
import type { LoginFormData, AdminOtpVerifyData } from '../schemas'
import type { LoginResponse, SendOtpResponse } from '../types'

export const useLogin = () => {
  const navigate = useNavigate()
  const setCredentials = useAuthStore((state) => state.setCredentials)
  const setLoading = useAuthStore((state) => state.setLoading)

  return useMutation<LoginResponse, Error, LoginFormData>({
    mutationFn: (data) => AuthService.login(data),
    onMutate: () => {
      setLoading(true)
    },
    onSuccess: (data, variables) => {
      setCredentials(data.token, data.user, data.refreshToken, {
        rememberMe: variables.rememberMe === true,
      })
      navigate('/dashboard', { replace: true })
    },
    onSettled: () => {
      setLoading(false)
    },
  })
}

export const useSendAdminOtp = () => {
  return useMutation<SendOtpResponse, Error, string>({
    mutationFn: (phoneNumber) => AuthService.sendOtp(phoneNumber),
  })
}

export const useVerifyAdminOtp = () => {
  const navigate = useNavigate()
  const setCredentials = useAuthStore((state) => state.setCredentials)
  const setLoading = useAuthStore((state) => state.setLoading)

  return useMutation<LoginResponse, Error, AdminOtpVerifyData>({
    mutationFn: (data) => AuthService.verifyOtp(data),
    onMutate: () => {
      setLoading(true)
    },
    onSuccess: (data) => {
      // OTP logins are session-only unless we add a remember control later.
      setCredentials(data.token, data.user, data.refreshToken, { rememberMe: false })
      navigate('/dashboard', { replace: true })
    },
    onSettled: () => {
      setLoading(false)
    },
  })
}
