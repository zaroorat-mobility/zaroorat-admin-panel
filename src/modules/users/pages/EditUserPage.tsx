import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, Save } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import { PhoneInput } from '@/shared/components/ui/PhoneInput'
import { useToast } from '@/shared/context/toast'
import { useUser, useUpdateUser } from '../hooks'
import { getRbacRoles } from '../api'
import { userEditFormSchema, type UserEditFormData } from '../schemas'

export const EditUserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { success: showSuccess, error: showError } = useToast()
  const { data: user, isLoading, isError } = useUser(id || '')
  const { mutate: updateUser, isPending } = useUpdateUser(id || '')
  const rolesQuery = useQuery({ queryKey: ['rbac', 'roles'], queryFn: getRbacRoles })
  const roleOptions = (rolesQuery.data ?? []).map((role) => ({
    label: role.name,
    value: role.slug,
  }))

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserEditFormData>({
    resolver: zodResolver(userEditFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '+91',
      role: 'admin',
      password: '',
    },
  })

  React.useEffect(() => {
    if (!user) return
    reset({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      password: '',
    })
  }, [user, reset])

  const onSubmit = (formData: UserEditFormData) => {
    if (!id) return
    updateUser(formData, {
      onSuccess: () => {
        showSuccess('User updated', 'Administrative user details were saved.')
        navigate('/users')
      },
      onError: (err) => {
        showError('Could not update user', err instanceof Error ? err.message : 'Request failed')
      },
    })
  }

  if (isLoading) {
    return (
      <PageWrapper>
        <p className="text-slate-500">Loading user details...</p>
      </PageWrapper>
    )
  }

  if (isError || !user) {
    return (
      <PageWrapper>
        <p className="text-slate-500">This administrative user could not be found.</p>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <PageHeader
        title={`Edit User: ${user.name}`}
        description="Update staff account details, role, or password."
        onBack={() => navigate('/users')}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-left max-w-3xl mt-4">
        <Card>
          <CardContent className="p-6 space-y-4 text-xs">
            <div className="border-b pb-3 mb-2">
              <h3 className="font-bold text-slate-800 text-sm">Staff account</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Leave the password blank to keep the current one.
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
              label="New password"
              type="password"
              helperText="Optional. Set only when you want to reset this user's password."
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
            Save changes
          </Button>
        </div>
      </form>
    </PageWrapper>
  )
}

export default EditUserPage
