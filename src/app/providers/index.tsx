import React, { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AppRouter } from '../router'
import { useThemeStore } from '@/store/theme.store'
import { ToastProvider, ToastContainer } from '@/shared/context/toast'

/**
 * Root App Providers Registry configuring React Query, React Router,
 * and the global Toast notification system.
 */
export const AppProviders: React.FC = () => {
  const { theme } = useThemeStore()
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000, // 5 minutes cache
          },
        },
      })
  )

  // Sync theme class on mount and whenever theme shifts
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
        {/* Portal-rendered toast stack — always present at root level */}
        <ToastContainer />
      </ToastProvider>
    </QueryClientProvider>
  )
}

export default AppProviders
