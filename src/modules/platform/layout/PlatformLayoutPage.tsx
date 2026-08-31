import React, { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { cn } from '@/shared/utils'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import {
  getActivePlatformSection,
  getPlatformPageMeta,
  isPlatformNavItemActive,
  shouldShowSectionNav,
  type PlatformSectionNavItem,
} from '../platform-nav'
import { PlatformPageActionsProvider } from './platform-page-context'

const SectionNav: React.FC<{ title: string; items: PlatformSectionNavItem[] }> = ({ title, items }) => {
  const { pathname } = useLocation()

  if (items.length === 0) return null

  return (
    <nav className="space-y-0.5 lg:sticky lg:top-4">
      <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {items.map((item) => {
        const active = isPlatformNavItemActive(pathname, item.to)
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={cn(
              'block rounded-lg px-3 py-2 text-sm font-medium transition-all',
              active
                ? 'bg-[#2B317A] text-white font-semibold shadow-sm'
                : 'text-slate-500 hover:bg-[#2B317A]/[0.06] hover:text-[#2B317A] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white',
            )}
          >
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}

export const PlatformLayoutPage: React.FC = () => {
  const { pathname } = useLocation()
  const { user } = useAuthStore()
  const [pageActions, setPageActions] = useState<React.ReactNode>(null)

  const activeSection = useMemo(() => getActivePlatformSection(pathname), [pathname])

  const visibleItems = useMemo(() => {
    if (!activeSection) return []
    return activeSection.items.filter((item) => hasPermission(user, item.permission))
  }, [activeSection, user])

  const showNav = activeSection ? shouldShowSectionNav(activeSection, visibleItems.length) : false

  const { title, description } = useMemo(
    () => getPlatformPageMeta(pathname, activeSection, showNav),
    [pathname, activeSection, showNav],
  )

  return (
    <PageWrapper>
      <PageHeader title={title} description={description} actions={pageActions} />
      <div
        className={cn(
          'items-start',
          showNav ? 'grid grid-cols-1 lg:grid-cols-[14rem_minmax(0,1fr)] gap-6' : 'block',
        )}
      >
        {showNav && activeSection ? (
          <aside className="w-full lg:w-auto">
            <SectionNav title={activeSection.label} items={visibleItems} />
          </aside>
        ) : null}
        <div className="w-full min-w-0">
          <PlatformPageActionsProvider setActions={setPageActions}>
            <Outlet />
          </PlatformPageActionsProvider>
        </div>
      </div>
    </PageWrapper>
  )
}

export default PlatformLayoutPage
