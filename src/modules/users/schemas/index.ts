import { z } from 'zod'
import { emailSchema, phoneSchema, passwordSchema } from '@/shared/schemas'

export const userFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  phone: phoneSchema,
  role: z.string().min(1, 'Select a role'),
  password: passwordSchema,
})

export const userEditFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  phone: phoneSchema,
  role: z.string().min(1, 'Select a role'),
  password: z.union([z.literal(''), passwordSchema]).optional(),
})

export type UserFormData = z.infer<typeof userFormSchema>
export type UserEditFormData = z.infer<typeof userEditFormSchema>
