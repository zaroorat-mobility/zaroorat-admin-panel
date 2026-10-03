import React, { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserPlus, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Modal } from '@/shared/components/ui/Modal'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import { PhoneInput } from '@/shared/components/ui/PhoneInput'
import { useToast } from '@/shared/context/toast'
import { roleDisplayName } from '@/infrastructure/permissions'
import { useCreateUser } from '../hooks'
import { getRbacRoles } from '../api'
import { userFormSchema, type UserFormData } from '../schemas'
import type { UserEntity } from '../types'

export interface CreateAdminUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (user: UserEntity) => void
}

export const CreateAdminUserModal: React.FC<CreateAdminUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const { success: showSuccess, error: showError } = useToast()
  const { mutate: createUser, isPending } = useCreateUser()

  const rolesQuery = useQuery({
    queryKey: ['rbac', 'roles'],
    queryFn: getRbacRoles,
    enabled: isOpen,
  })

  const roleOptions = (rolesQuery.data ?? []).map((role) => ({
    label: role.name || roleDisplayName(role.slug),
    value: role.slug,
  }))

  const defaultRoleOptions = [
    { label: 'Operations Admin', value: 'admin' },
    { label: 'Customer Support', value: 'support' },
    { label: 'Finance Manager', value: 'finance' },
  ]

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '+91',
      role: 'admin',
      password: '',
    },
  })

  useEffect(() => {
    if (isOpen) {
      reset({
        name: '',
        email: '',
        phone: '+91',
        role: 'admin',
        password: '',
      })
      setShowPassword(false)
    }
  }, [isOpen, reset])

  const handleClose = () => {
    if (!isPending) {
      reset()
      onClose()
    }
  }

  const onSubmit = (formData: UserFormData) => {
    createUser(formData, {
      onSuccess: (createdUser) => {
        const assignedRole = roleOptions.find((r) => r.value === formData.role)?.label || roleDisplayName(formData.role)
        showSuccess(
          'Admin User Created',
          `${formData.name} was successfully provisioned with ${assignedRole} access.`
        )
        reset()
        onClose()
        onSuccess?.(createdUser)
      },
      onError: (err) => {
        const message = err instanceof Error ? err.message : 'Could not provision staff account'
        showError('User Creation Failed', message)
      },
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      title="Add Admin User"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-left" autoComplete="off">
        {/* Banner with Icon & Context */}
        <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 dark:bg-dark-800/60 border border-slate-200/80 dark:border-dark-700/80">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              Staff Provisioning
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Create an administrative account with password access. The operator can use these credentials to sign in directly to the operations panel.
            </p>
          </div>
        </div>

        {/* Global validation error banner */}
        {(errors.name || errors.email || errors.phone || errors.password || errors.role) && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Please complete all required fields correctly before saving.</span>
          </div>
        )}

        {/* Name & Email Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full name"
            placeholder="e.g. Saqib Ali Mir"
            error={errors.name?.message}
            disabled={isPending}
            required
            autoComplete="off"
            {...register('name')}
          />
          <Input
            label="Email address"
            type="email"
            placeholder="e.g. saqib@zaroorat.com"
            error={errors.email?.message}
            disabled={isPending}
            required
            autoComplete="new-email"
            data-lpignore="true"
            data-form-type="other"
            {...register('email')}
          />
        </div>

        {/* Phone & Role Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <PhoneInput
                label="Phone number"
                value={field.value}
                onChange={(value) => field.onChange(value ?? '')}
                error={errors.phone?.message}
                disabled={isPending}
                required
              />
            )}
          />
          <Select
            label="Role assignment"
            error={errors.role?.message}
            disabled={isPending || rolesQuery.isLoading}
            options={roleOptions.length > 0 ? roleOptions : defaultRoleOptions}
            required
            {...register('role')}
          />
        </div>

        {/* Temporary Password */}
        <div>
          <Input
            label="Temporary password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter minimum 8 characters"
            helperText="The user will use this password to sign in for the first time."
            error={errors.password?.message}
            disabled={isPending}
            required
            autoComplete="new-password"
            data-lpignore="true"
            data-form-type="other"
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            {...register('password')}
          />
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-dark-800">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
            className="px-5 font-medium"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isPending}
            className="gap-2 px-5 font-medium shadow-sm hover:shadow"
          >
            <UserPlus className="h-4 w-4" />
            <span>Create user</span>
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default CreateAdminUserModal
