import { z } from 'zod'
import { emailSchema, passwordSchema, phoneSchema } from '@/shared/schemas'

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  rememberMe: z.boolean().optional(),
})

export const adminOtpSendSchema = z.object({
  phoneNumber: phoneSchema,
})

export const adminOtpVerifySchema = z.object({
  phoneNumber: phoneSchema,
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
  challengeId: z.string().min(1),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type AdminOtpSendData = z.infer<typeof adminOtpSendSchema>
export type AdminOtpVerifyData = z.infer<typeof adminOtpVerifySchema>
