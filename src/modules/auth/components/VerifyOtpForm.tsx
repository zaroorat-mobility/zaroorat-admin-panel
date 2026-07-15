import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { useToast } from '@/shared/context/toast'

interface VerifyOtpFormProps {
  email: string
  onBackToLogin: () => void
  onOtpVerified: () => void
}

export const VerifyOtpForm: React.FC<VerifyOtpFormProps> = ({
  email,
  onBackToLogin,
  onOtpVerified,
}) => {
  const [otp, setOtp] = useState<string[]>(['', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { success: showSuccessToast } = useToast()
  
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  useEffect(() => {
    // Focus first element on mount
    inputRefs[0].current?.focus()
  }, [])

  const handleChange = (index: number, val: string) => {
    if (isNaN(Number(val))) return // Only allow numbers
    
    const newOtp = [...otp]
    newOtp[index] = val.slice(-1) // Limit to 1 digit
    setOtp(newOtp)
    setError('')

    // Move focus to next input if filled
    if (val && index < 3) {
      inputRefs[index + 1].current?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Focus previous input on backspace if empty
      inputRefs[index - 1].current?.focus()
    }
  }

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()
    const fullOtp = otp.join('')
    if (fullOtp.length < 4) {
      setError('Please enter the complete 4-digit code')
      return
    }

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      showSuccessToast('OTP Verified', 'Code verified successfully. Set your new password.')
      onOtpVerified()
    }, 1000)
  }

  const handleResend = () => {
    showSuccessToast('Code Resent', `A new OTP has been sent to ${email}`)
    setOtp(['', '', '', ''])
    inputRefs[0].current?.focus()
  }

  return (
    <form onSubmit={handleVerify} className="space-y-5 animate-fadeIn">
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-slate-900 dark:text-dark-50">Verify OTP</h3>
        <p className="text-sm text-slate-500 dark:text-dark-400">
          Enter the 4-digit code sent to <strong className="text-slate-800 dark:text-dark-200">{email}</strong>
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex justify-center gap-4 py-2">
        {otp.map((digit, idx) => (
          <input
            key={idx}
            ref={inputRefs[idx]}
            type="text"
            pattern="[0-9]*"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            className="w-12 h-12 text-center text-xl font-extrabold bg-surface border border-border rounded-xl focus:border-[#2B317A] focus:ring-2 focus:ring-[#2B317A]/10 outline-none text-slate-900 dark:text-white transition-all shadow-sm"
          />
        ))}
      </div>

      <div className="space-y-3">
        <Button type="submit" className="w-full bg-[#2B317A] hover:bg-[#1E2258]" loading={loading}>
          Verify OTP Code
        </Button>

        <div className="flex justify-between items-center px-1 text-xs">
          <button
            type="button"
            onClick={handleResend}
            className="font-semibold text-[#2B317A] hover:underline dark:text-brand-400 cursor-pointer"
          >
            Resend OTP
          </button>
          <button
            type="button"
            onClick={onBackToLogin}
            className="font-semibold text-slate-550 hover:text-slate-700 dark:text-dark-400 cursor-pointer"
          >
            Back to Login
          </button>
        </div>
      </div>
    </form>
  )
}

export default VerifyOtpForm
