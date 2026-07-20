import React, { useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { useToast } from '@/shared/context/toast'
import { safetyShield } from '@/assets/images/auth'

interface ForgotPasswordFormProps {
  onBackToLogin: () => void
  onEmailSubmitted: (email: string) => void
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onBackToLogin,
  onEmailSubmitted,
}) => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { success: showSuccessToast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email) {
      setError('Email address is required')
      return
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    // Simulate API delay
    setTimeout(() => {
      setLoading(false)
      showSuccessToast('OTP Sent', `Verification code sent to ${email}`)
      onEmailSubmitted(email)
    }, 1000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fadeIn">
      <div className="flex justify-center mb-1">
        <img 
          src={safetyShield} 
          alt="Safety Shield" 
          className="w-20 h-20 object-contain animate-rotate-shield" 
        />
      </div>

      <div className="space-y-1 text-center">
        <h3 className="text-xl font-bold text-slate-900 dark:text-dark-50">Forgot Password</h3>
        <p className="text-sm text-slate-500 dark:text-dark-400">
          Enter your administrative email address to receive an OTP
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="admin@zaroorat.in"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
        />
      </div>

      <div className="space-y-3">
        <Button type="submit" className="w-full bg-[#2B317A] hover:bg-[#1E2258]" loading={loading}>
          Send OTP Code
        </Button>

        <button
          type="button"
          onClick={onBackToLogin}
          className="w-full text-center text-sm font-semibold text-slate-650 hover:text-slate-800 dark:text-dark-400 dark:hover:text-dark-200 mt-2 block cursor-pointer"
        >
          Back to Login
        </button>
      </div>
    </form>
  )
}

export default ForgotPasswordForm
