import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormData } from '../schemas'
import { useLogin } from '../hooks'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { useToast } from '@/shared/context/toast'

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 animate-fadeIn">
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-slate-900 dark:text-dark-50">Welcome Back</h3>
        <p className="text-sm text-slate-500 dark:text-dark-400">
          Sign in to your administrative account
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 dark:bg-red-950/20 dark:text-red-400">
          Authentication failed: {error.message}
        </div>
      )}

      <div className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="admin@zaroorat.in"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-dark-400 cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-dark-700 dark:bg-dark-900"
            {...register('rememberMe')}
          />
          Remember me
        </label>

        <button
          type="button"
          onClick={onForgotPasswordClick}
          className="text-xs text-[#2B317A] hover:underline font-semibold dark:text-brand-400 cursor-pointer"
        >
          Forgot password?
        </button>
      </div>

      <div className="space-y-3">
        <Button type="submit" className="w-full bg-[#2B317A] hover:bg-[#1E2258]" loading={isPending}>
          Sign In
        </Button>

        {import.meta.env.DEV && (
          <Button type="button" variant="outline" className="w-full text-xs" onClick={setMockSession}>
            Demo Quick Login (Superadmin Bypass)
          </Button>
        )}
      </div>
    </form>
  )
}

export default LoginForm
