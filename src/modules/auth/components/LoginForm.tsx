import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock } from 'lucide-react'
import { loginSchema, type LoginFormData } from '../schemas'
import { useLogin } from '../hooks'
import { Button } from '@/shared/components/ui/Button'
import { useToast } from '@/shared/context/toast'
import heroLogo from "@/assets/images/hero-logo.jpg"
import { cn } from "@/shared/utils"

interface LoginFormProps {
  onForgotPasswordClick: () => void
  onLoginSuccess: () => void
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onForgotPasswordClick,
  onLoginSuccess,
}) => {
  const { success: showSuccessToast } = useToast()
  const { mutate: login, isPending, error } = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  const onSubmit = (data: LoginFormData) => {
    login(data, {
      onSuccess: () => {
        showSuccessToast('Login Successful', 'Welcome back to Zaroorat Mobility Dashboard!')
        onLoginSuccess()
      },
    })
  }

  // Temporary mock sign-in handler for preview testing
  const setMockSession = () => {
    const mockAuthStore = {
      token: 'mock-token',
      user: {
        id: '1',
        name: 'Mohammed Fardeen',
        email: 'admin@zaroorat.com',
        role: 'superadmin',
        permissions: ['*'],
      },
    }

    import('@/store/auth.store').then(({ useAuthStore }) => {
      useAuthStore.getState().setCredentials(mockAuthStore.token, mockAuthStore.user as any)
      showSuccessToast('Login Successful', 'Bypassed authentication for local preview.')
      onLoginSuccess()
    })
  }

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

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 dark:bg-red-950/20 dark:text-red-400 mb-4 animate-shake">
          Authentication failed: {error.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Address Input */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Email Address</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-450 dark:text-slate-500">
              <Mail className="w-4 h-4" />
            </span>
            <input
              type="email"
              placeholder="Email / Phone"
              className={cn(
                "flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 text-sm text-foreground transition-all placeholder:text-slate-400/80 focus:border-[#2B317A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2B317A]/10 dark:border-slate-800 dark:bg-slate-900/60",
                errors.email ? 'border-destructive focus:border-destructive focus:ring-destructive/10' : ''
              )}
              {...register('email')}
            />
          </div>
          {errors.email?.message && (
            <p className="text-xs font-medium text-destructive mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password Input */}
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
                "flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-11 pr-10 text-sm text-foreground transition-all placeholder:text-slate-400/80 focus:border-[#2B317A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2B317A]/10 dark:border-slate-800 dark:bg-slate-900/60",
                errors.password ? 'border-destructive focus:border-destructive focus:ring-destructive/10' : ''
              )}
              {...register('password')}
            />
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 dark:text-slate-500">
              <Lock className="w-3.5 h-3.5" />
            </span>
          </div>
          {errors.password?.message && (
            <p className="text-xs font-medium text-destructive mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Remember & Forget Row */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-dark-400 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-slate-350 text-[#2B317A] focus:ring-[#2B317A] dark:border-dark-700 dark:bg-dark-900"
              {...register('rememberMe')}
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

        {/* Log In Button */}
        <div className="space-y-3.5 pt-2">
          <Button 
            type="submit" 
            className="w-full h-11 bg-gradient-to-r from-[#2B317A] to-[#1E2258] hover:opacity-95 transition-all text-white font-bold rounded-xl shadow-md cursor-pointer" 
            loading={isPending}
          >
            Log in
          </Button>

          {/* Quick Mock Login for Local Development / Netlify Demo */}
          <Button type="button" variant="outline" className="w-full h-11 text-xs rounded-xl" onClick={setMockSession}>
            Demo Quick Login (Superadmin Bypass)
          </Button>
        </div>
      </form>
    </div>
  )
}

export default LoginForm
