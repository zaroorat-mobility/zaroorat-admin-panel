import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock, Phone } from 'lucide-react'
import {
  loginSchema,
  adminOtpSendSchema,
  type LoginFormData,
  type AdminOtpSendData,
} from '../schemas'
import { useLogin, useSendAdminOtp, useVerifyAdminOtp } from '../hooks'
import { Button } from '@/shared/components/ui/Button'
import { useToast } from '@/shared/context/toast'
import heroLogo from "@/assets/images/hero-logo.jpg"
import { cn } from "@/shared/utils"
import { getRememberedEmail } from '@/store/auth.store'

interface LoginFormProps {
  onForgotPasswordClick: () => void
  onLoginSuccess: () => void
}

type LoginMethod = 'password' | 'otp'

export const LoginForm: React.FC<LoginFormProps> = ({
  onForgotPasswordClick,
  onLoginSuccess,
}) => {
  const { success: showSuccessToast } = useToast()
  const [method, setMethod] = useState<LoginMethod>('password')
  const [otpCode, setOtpCode] = useState('')
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [otpPhone, setOtpPhone] = useState('')

  const { mutate: login, isPending, error } = useLogin()
  const sendOtp = useSendAdminOtp()
  const verifyOtp = useVerifyAdminOtp()

  const rememberedEmail = getRememberedEmail()

  const passwordForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: rememberedEmail,
      password: '',
      rememberMe: rememberedEmail.length > 0,
    },
  })

  const otpForm = useForm<AdminOtpSendData>({
    resolver: zodResolver(adminOtpSendSchema),
    defaultValues: { phoneNumber: '+91' },
  })

  const onPasswordSubmit = (data: LoginFormData) => {
    login(data, {
      onSuccess: () => {
        showSuccessToast('Login Successful', 'Welcome back to Zaroorat Mobility Dashboard!')
        onLoginSuccess()
      },
    })
  }

  const onSendOtp = (data: AdminOtpSendData) => {
    sendOtp.mutate(data.phoneNumber, {
      onSuccess: (result) => {
        setOtpPhone(data.phoneNumber)
        setChallengeId(result.challengeId)
        setOtpCode('')
        showSuccessToast('OTP sent', 'Enter the 6-digit code sent to your phone.')
      },
    })
  }

  const onVerifyOtp = (event: React.FormEvent) => {
    event.preventDefault()
    if (!challengeId) return
    verifyOtp.mutate(
      { phoneNumber: otpPhone, code: otpCode, challengeId },
      {
        onSuccess: () => {
          showSuccessToast('Login Successful', 'Welcome back to Zaroorat Mobility Dashboard!')
          onLoginSuccess()
        },
      },
    )
  }

  const formError =
    error?.message ||
    sendOtp.error?.message ||
    verifyOtp.error?.message

  return (
    <div className="pb-2 pt-2 select-none">
      {/* Brand Infinity Logo */}
      <div className="flex flex-col items-center mb-4">
        <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-center bg-white">
          <img src={heroLogo} alt="Zaroorat Mobility" className="w-full h-full object-cover scale-[1.1]" />
        </div>
        <h1 className="text-xl font-black text-[#2B317A] dark:text-white mt-2.5 leading-none tracking-wider uppercase">Zaroorat</h1>
        <span className="text-[9px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">Mobility</span>
      </div>

      {/* Form Headers */}
      <div className="space-y-1 text-center mb-6">
        <h3 className="text-2xl font-black text-slate-900 dark:text-dark-50 tracking-tight">Welcome Back!</h3>
        <p className="text-xs text-slate-500 dark:text-dark-400">
          Log in to continue
        </p>
      </div>

      <div className="grid grid-cols-2 rounded-xl bg-slate-100 dark:bg-slate-900 p-1 mb-5">
        <button
          type="button"
          onClick={() => setMethod('password')}
          className={cn(
            'h-9 rounded-lg text-xs font-bold',
            method === 'password' ? 'bg-white dark:bg-slate-800 text-[#2B317A] shadow-sm' : 'text-slate-500',
          )}
        >
          Email
        </button>
        <button
          type="button"
          onClick={() => setMethod('otp')}
          className={cn(
            'h-9 rounded-lg text-xs font-bold',
            method === 'otp' ? 'bg-white dark:bg-slate-800 text-[#2B317A] shadow-sm' : 'text-slate-500',
          )}
        >
          Mobile OTP
        </button>
      </div>

      {formError && (
        <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 dark:bg-red-950/20 dark:text-red-400 mb-4">
          {formError}
        </div>
      )}

      {method === 'password' && (
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-450 dark:text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                placeholder="admin@zaroorat.com"
                className={cn(
                  "flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 text-sm text-foreground transition-all placeholder:text-slate-400/80 focus:border-[#2B317A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2B317A]/10 dark:border-slate-800 dark:bg-slate-900/60",
                  passwordForm.formState.errors.email ? 'border-destructive focus:border-destructive focus:ring-destructive/10' : ''
                )}
                {...passwordForm.register('email')}
              />
            </div>
            {passwordForm.formState.errors.email?.message && (
              <p className="text-xs font-medium text-destructive mt-1">{passwordForm.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-455 dark:text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="Password"
                className={cn(
                  "flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 text-sm text-foreground transition-all placeholder:text-slate-400/80 focus:border-[#2B317A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2B317A]/10 dark:border-slate-800 dark:bg-slate-900/60",
                  passwordForm.formState.errors.password ? 'border-destructive focus:border-destructive focus:ring-destructive/10' : ''
                )}
                {...passwordForm.register('password')}
              />
            </div>
            {passwordForm.formState.errors.password?.message && (
              <p className="text-xs font-medium text-destructive mt-1">{passwordForm.formState.errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-dark-400 cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-[#2B317A] accent-[#2B317A] focus:ring-[#2B317A] dark:border-dark-700 dark:bg-dark-900 cursor-pointer"
                {...passwordForm.register('rememberMe')}
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={onForgotPasswordClick}
              className="text-xs text-[#2B317A] hover:underline font-bold dark:text-brand-400 cursor-pointer"
            >
              Forget Password?
            </button>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-[#2B317A] to-[#1E2258] hover:opacity-95 transition-all text-white font-bold rounded-xl shadow-md cursor-pointer"
              loading={isPending}
            >
              Log in
            </Button>
          </div>
        </form>
      )}

      {method === 'otp' && !challengeId && (
        <form onSubmit={otpForm.handleSubmit(onSendOtp)} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Mobile number</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-450 dark:text-slate-500">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="tel"
                placeholder="+9198XXXXXXXX"
                className={cn(
                  "flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 text-sm text-foreground transition-all placeholder:text-slate-400/80 focus:border-[#2B317A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2B317A]/10 dark:border-slate-800 dark:bg-slate-900/60",
                  otpForm.formState.errors.phoneNumber ? 'border-destructive' : ''
                )}
                {...otpForm.register('phoneNumber')}
              />
            </div>
            {otpForm.formState.errors.phoneNumber?.message && (
              <p className="text-xs font-medium text-destructive mt-1">{otpForm.formState.errors.phoneNumber.message}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-[#2B317A] to-[#1E2258] text-white font-bold rounded-xl"
            loading={sendOtp.isPending}
          >
            Send OTP
          </Button>
        </form>
      )}

      {method === 'otp' && challengeId && (
        <form onSubmit={onVerifyOtp} className="space-y-4">
          <p className="text-xs text-slate-500 text-center">Code sent to {otpPhone}</p>
          <input
            inputMode="numeric"
            maxLength={6}
            value={otpCode}
            onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit code"
            className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-center text-lg tracking-[0.4em] font-semibold focus:border-[#2B317A] focus:outline-none focus:ring-2 focus:ring-[#2B317A]/10 dark:border-slate-800 dark:bg-slate-900/60"
          />
          <Button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-[#2B317A] to-[#1E2258] text-white font-bold rounded-xl"
            loading={verifyOtp.isPending}
            disabled={otpCode.length !== 6}
          >
            Verify & log in
          </Button>
          <button
            type="button"
            className="w-full text-xs text-[#2B317A] font-bold"
            onClick={() => {
              setChallengeId(null)
              setOtpCode('')
            }}
          >
            Use a different number
          </button>
        </form>
      )}
    </div>
  )
}

export default LoginForm
