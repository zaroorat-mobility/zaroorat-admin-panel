import React, { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Badge } from '@/shared/components/ui/Badge'
import { useToast } from '@/shared/context/toast'
import {
  PERMISSION_CATEGORIES,
  PERMISSION_ACTION_LABELS,
  ROLE_CATALOG,
  permissionActionLabel,
  permissionCategory,
  roleDisplayName,
} from '@/infrastructure/permissions'
import {
  createRbacRole,
  getRbacPermissions,
  getRbacRoles,
  putRbacRolePermissions,
  type RbacPermission,
  type RbacRole,
} from '../api'

const CATEGORY_ORDER = [...PERMISSION_CATEGORIES.map((item) => item.label), 'Other']

export const RoleAccessPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { success: showSuccess, error: showError } = useToast()
  const permissionsQuery = useQuery({ queryKey: ['rbac', 'permissions'], queryFn: getRbacPermissions })
  const rolesQuery = useQuery({ queryKey: ['rbac', 'roles'], queryFn: getRbacRoles })
  const [selectedSlug, setSelectedSlug] = useState<string>('admin')
  const [draft, setDraft] = useState<string[]>([])
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleDescription, setNewRoleDescription] = useState('')

  const roles = rolesQuery.data ?? []
  const selected: RbacRole | undefined = roles.find((role) => role.slug === selectedSlug) ?? roles[0]
  const grouped = useMemo(() => {
    const assignable = (permissionsQuery.data ?? []).filter((permission) => !permission.locked)
    const buckets = new Map<string, RbacPermission[]>()
    for (const permission of assignable) {
      const category = permissionCategory(permission.code, permission.resource)
      const list = buckets.get(category) ?? []
      list.push(permission)
      buckets.set(category, list)
    }
    return CATEGORY_ORDER.filter((label) => buckets.has(label)).map((label) => ({
      label,
      permissions: buckets.get(label) ?? [],
    }))
  }, [permissionsQuery.data])

  useEffect(() => {
    if (selected) setDraft(selected.permissionCodes)
  }, [selected?.slug, selected?.permissionCodes.join('|')])

  const save = useMutation({
    mutationFn: () => putRbacRolePermissions(selected!.slug, draft),
    onSuccess: () => {
      showSuccess('Permissions saved', 'Role grants apply on the next API request.')
      void queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] })
    },
    onError: (err) => {
      showError('Could not save permissions', err instanceof Error ? err.message : 'Request failed')
    },
  })

  const createRole = useMutation({
    mutationFn: () =>
      createRbacRole({
        name: newRoleName,
        ...(newRoleDescription.trim() ? { description: newRoleDescription.trim() } : {}),
      }),
    onSuccess: (role) => {
      showSuccess('Role created', `${role.name} can now receive module access.`)
      setNewRoleName('')
      setNewRoleDescription('')
      setSelectedSlug(role.slug)
      void queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] })
    },
    onError: (err) => {
      showError('Could not create role', err instanceof Error ? err.message : 'Request failed')
    },
  })

  const toggle = (code: string) => {
    setDraft((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code],
    )
  }

  const toggleCategory = (permissions: RbacPermission[]) => {
    const codes = permissions.map((permission) => permission.code)
    const allOn = codes.every((code) => draft.includes(code))
    setDraft((current) =>
      allOn ? current.filter((code) => !codes.includes(code)) : [...new Set([...current, ...codes])],
    )
  }

  const roleCatalogEntry = (slug: string) => ROLE_CATALOG.find((role) => role.slug === slug)

  return (
    <PageWrapper>
      <PageHeader
        title="Roles & Permissions"
        description="Assign module capabilities to staff roles. System admin access cannot be delegated."
      />

      <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Permission actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {Object.entries(PERMISSION_ACTION_LABELS).map(([action, label]) => (
            <Badge key={action} variant="neutral" outline>
              {label} · <span className="font-mono">{action}</span>
            </Badge>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Roles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <form
              className="space-y-2 pb-3 mb-2 border-b border-border"
              onSubmit={(event) => {
                event.preventDefault()
                createRole.mutate()
              }}
            >
              <Input
                label="New role"
                placeholder="Driver Manager"
                value={newRoleName}
                onChange={(event) => setNewRoleName(event.target.value)}
              />
              <Input
                label="Description"
                placeholder="Optional"
                value={newRoleDescription}
                onChange={(event) => setNewRoleDescription(event.target.value)}
              />
              <Button
                type="submit"
                className="w-full h-9 text-xs"
                disabled={!newRoleName.trim() || createRole.isPending}
              >
                Create role
              </Button>
            </form>
            {roles.map((role) => {
              const catalog = roleCatalogEntry(role.slug)
              return (
                <button
                  key={role.slug}
                  type="button"
                  onClick={() => setSelectedSlug(role.slug)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    selected?.slug === role.slug
                      ? 'bg-[#2B317A] text-white'
                      : 'bg-slate-50 text-text-primary hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="font-semibold">{roleDisplayName(role.slug, role.name)}</div>
                  <div className="text-[10px] opacity-80 font-mono">{role.slug}</div>
                  {catalog ? (
                    <div className="text-[10px] opacity-80 mt-1 leading-snug">{catalog.description}</div>
                  ) : role.description ? (
                    <div className="text-[10px] opacity-80 mt-1 leading-snug">{role.description}</div>
                  ) : null}
                </button>
              )
            })}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selected
                ? `Permissions for ${roleDisplayName(selected.slug, selected.name)}`
                : 'Permissions'}
            </CardTitle>
            <Button
              disabled={!selected || !selected.editable || save.isPending}
              onClick={() => save.mutate()}
              className="h-9 text-xs"
            >
              Save grants
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {selected && !selected.editable ? (
              <p className="text-sm text-muted-foreground">
                This system role is locked. Create a custom role to delegate a subset of access.
              </p>
            ) : null}
            {grouped.map((group) => {
              const allOn = group.permissions.every((permission) => draft.includes(permission.code))
              return (
                <section key={group.label} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                      {group.label}
                    </h4>
                    <button
                      type="button"
                      className="text-[11px] font-medium text-[#2B317A] dark:text-[#8B93D9]"
                      onClick={() => toggleCategory(group.permissions)}
                      disabled={selected && !selected.editable}
                    >
                      {allOn ? 'Clear all' : 'Grant all'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.permissions.map((permission) => (
                      <label
                        key={permission.code}
                        className="flex items-start gap-2 rounded-lg border border-border bg-slate-50/60 p-3 text-xs dark:bg-slate-900/40"
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 accent-[#2B317A]"
                          checked={draft.includes(permission.code)}
                          onChange={() => toggle(permission.code)}
                          disabled={selected && !selected.editable}
                        />
                        <span>
                          <span className="font-semibold block text-text-primary">{permission.code}</span>
                          <span className="text-[10px] uppercase tracking-wide text-primary/80">
                            {permissionActionLabel(permission.action)}
                          </span>
                          <span className="text-text-secondary block mt-0.5">{permission.description}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </section>
              )
            })}
          </CardContent>
        </Card>
      </div>
      </div>
    </PageWrapper>
  )
}

export default RoleAccessPage
