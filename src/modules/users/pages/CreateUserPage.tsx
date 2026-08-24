import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Save } from 'lucide-react'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import { PhoneInput } from '@/shared/components/ui/PhoneInput'
import { useQuery } from '@tanstack/react-query'
import { useToast } from '@/shared/context/toast'
import { useCreateUser } from '../hooks'
import { getRbacRoles } from '../api'
import { userFormSchema, type UserFormData } from '../schemas'

export const CreateUserPage: React.FC = () => {
  const navigate = useNavigate()
  const { success: showSuccess, error: showError } = useToast()
  const { mutate: createUser, isPending } = useCreateUser()
  const rolesQuery = useQuery({ queryKey: ['rbac', 'roles'], queryFn: getRbacRoles })
  const roleOptions = (rolesQuery.data ?? []).map((role) => ({
    label: role.name,
    value: role.slug,
  }))

  const {
    register,
    control,
    handleSubmit,
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

  const onSubmit = (formData: UserFormData) => {
    createUser(formData, {
      onSuccess: () => {
        showSuccess('Admin user created', 'They can now sign in to the dashboard.')
        navigate('/users')
      },
      onError: (err) => {
        showError('Could not create user', err instanceof Error ? err.message : 'Request failed')
      },
    })
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Add Administrative User"
        description="Provision a staff account that can sign in with email and password."
        onBack={() => navigate('/users')}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-left max-w-3xl mt-4">
        <Card>
          <CardContent className="p-6 space-y-4 text-xs">
            <div className="border-b pb-3 mb-2">
              <h3 className="font-bold text-slate-800 text-sm">Staff account</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Role can be a seeded staff role or any custom role created under Role access.
              </p>
            </div>

            {(errors.name || errors.email || errors.phone || errors.password || errors.role) && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>Please fix the highlighted fields before saving.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full name" error={errors.name?.message} {...register('name')} />
              <Input
                label="Email"
                type="email"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

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
                    required
                  />
                )}
              />
              <Select
                label="Role"
                error={errors.role?.message}
                options={
                  roleOptions.length > 0
                    ? roleOptions
                    : [
                        { label: 'Admin', value: 'admin' },
                        { label: 'Support', value: 'support' },
                        { label: 'Finance', value: 'finance' },
                      ]
                }
                {...register('role')}
              />
            </div>

            <Input
              label="Temporary password"
              type="password"
              helperText="They will use this with their email on the admin login screen."
              error={errors.password?.message}
              {...register('password')}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/users')}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending} className="gap-2">
            <Save className="h-4 w-4" />
            Create user
          </Button>
        </div>
      </form>
    </PageWrapper>
  )
}

export default CreateUserPage
