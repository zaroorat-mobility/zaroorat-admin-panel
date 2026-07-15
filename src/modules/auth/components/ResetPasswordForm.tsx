import React, { useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { useToast } from '@/shared/context/toast'

interface ResetPasswordFormProps {
  onBackToLogin: () => void
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  onBackToLogin,
}) => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { success: showSuccessToast } = useToast()

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    
    const newErrors: Record<string, string> = {}
    if (!password) newErrors.password = 'Password is required'
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters'

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      showSuccessToast('Password Reset Complete', 'Your new administrative password has been set.')
      onBackToLogin()
    }, 1000)
  }

  return (
    <form onSubmit={handleReset} className="space-y-5 animate-fadeIn">
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-slate-900 dark:text-dark-50">Reset Password</h3>
        <p className="text-sm text-slate-500 dark:text-dark-400">
          Enter a secure password for your administrative profile
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label="New Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />

        <Input
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
        />
      </div>

      <div className="space-y-3">
        <Button type="submit" className="w-full bg-[#2B317A] hover:bg-[#1E2258]" loading={loading}>
          Save New Password
        </Button>

        <button
          type="button"
          onClick={onBackToLogin}
          className="w-full text-center text-sm font-semibold text-slate-650 hover:text-slate-800 dark:text-dark-400 dark:hover:text-dark-200 mt-2 block cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default ResetPasswordForm
