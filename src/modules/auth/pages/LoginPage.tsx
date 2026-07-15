import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormData } from '../schemas'
import { useLogin } from '../hooks'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'

export const LoginPage: React.FC = () => {
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
    login(data)
  }

  // Temporary mock sign-in handler for preview testing
  const setMockSession = () => {
    // In production, this goes through real flow, this is just a fallback mockup trigger
    const mockAuthStore = import.meta.env.DEV ? {
      token: 'mock-token',
      user: {
        id: '1',
        name: 'Mohammed Fardeen',
        email: 'admin@zaroorat.com',
        role: 'superadmin',
        permissions: ['*'],
      }
    } : null
    
    if (mockAuthStore) {
      // Simulate successful mutation callback locally for ease of architectural review
      import('@/store/auth.store').then(({ useAuthStore }) => {
        useAuthStore.getState().setCredentials(mockAuthStore.token, mockAuthStore.user as any)
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
          {...register('register' in register ? 'email' : 'email')}
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
        
        <a href="#forgot" className="text-xs text-brand-600 hover:underline dark:text-brand-400">
          Forgot password?
        </a>
      </div>

      <div className="space-y-3">
        <Button type="submit" className="w-full" loading={isPending}>
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
export default LoginPage
