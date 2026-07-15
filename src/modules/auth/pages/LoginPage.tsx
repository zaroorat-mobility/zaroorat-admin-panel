import React, { useState } from 'react'
import {
  LoginForm,
  ForgotPasswordForm,
  VerifyOtpForm,
  ResetPasswordForm,
} from '../components'

type AuthStep = 'LOGIN' | 'FORGOT' | 'OTP' | 'RESET'

export const LoginPage: React.FC = () => {
  const [step, setStep] = useState<AuthStep>('LOGIN')
  const [email, setEmail] = useState('')

  const handleLoginSuccess = () => {
    // Session state triggers navigation automatically via AuthGuard/GuestGuard in router
  }

  return (
    <div className="relative">
      {step === 'LOGIN' && (
        <LoginForm
          onForgotPasswordClick={() => setStep('FORGOT')}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {step === 'FORGOT' && (
        <ForgotPasswordForm
          onBackToLogin={() => setStep('LOGIN')}
          onEmailSubmitted={(submittedEmail) => {
            setEmail(submittedEmail)
            setStep('OTP')
          }}
        />
      )}

      {step === 'OTP' && (
        <VerifyOtpForm
          email={email}
          onBackToLogin={() => setStep('LOGIN')}
          onOtpVerified={() => setStep('RESET')}
        />
      )}

      {step === 'RESET' && (
        <ResetPasswordForm
          onBackToLogin={() => setStep('LOGIN')}
        />
      )}
    </div>
  )
}

export default LoginPage
