import { z } from 'zod'
import { emailSchema, phoneSchema } from '@/shared/schemas'

export const userFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  phone: phoneSchema,
  role: z.enum(['superadmin', 'admin', 'support', 'dispatcher']),
  status: z.enum(['active', 'inactive']).default('active'),
})

export type UserFormData = z.infer<typeof userFormSchema>
