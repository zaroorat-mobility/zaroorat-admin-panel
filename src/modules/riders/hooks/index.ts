import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryParams } from '@/shared/types'
import { APP_CONFIG } from '@/app/config'
import { useAuthStore } from '@/store/auth.store'
import { socketFactory } from '@/modules/dashboard/realtime'
import { RiderManagementService } from '../services'

export const QK = {
  riders: (params?: QueryParams) => ['rider-management', 'riders', params],
  rider: (id: string) => ['rider-management', 'riders', 'detail', id],
}

export const useRiders = (params?: QueryParams) => {
  return useQuery({
    queryKey: QK.riders(params),
    queryFn: () => RiderManagementService.getRiders(params),
    staleTime: 10_000,
  })
}

export const useRider = (id: string) => {
  return useQuery({
    queryKey: QK.rider(id),
    queryFn: () => RiderManagementService.getRiderById(id),
    enabled: !!id,
    staleTime: 15_000, // 15 seconds fresh cache: avoids spamming API on tab switches
    refetchOnWindowFocus: true, // Automatically sync on window focus
    refetchInterval: 30_000, // 30s background sync
    refetchIntervalInBackground: false, // Strictly pauses when tab is hidden or minimized
  })
}

/**
 * Production-grade real-time listener for customer details.
 * Connects to the platform gateway via WebSocket, listens for ride/status changes,
 * debounces React Query cache invalidations, and cleans up cleanly on unmount (zero memory leaks).
 */
export const useRiderRealtime = (id: string, enabled = true) => {
  const queryClient = useQueryClient()
  const token = useAuthStore((state) => state.token)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled || !id || !token) return

    const baseUrl = new URL(APP_CONFIG.api.baseUrl, window.location.origin).origin
    const socket = socketFactory.connect(baseUrl, {
      path: APP_CONFIG.realtime.path,
      transports: ['websocket'],
      auth: (cb) => cb({ token }),
    })

    const handleRideEvent = () => {
      // Debounce invalidation to prevent burst-thrashing (max 1 invalidation per 2s)
      if (timerRef.current) return
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        void queryClient.invalidateQueries({ queryKey: QK.rider(id) })
        void queryClient.invalidateQueries({ queryKey: ['rider-management', 'riders'] })
      }, 2000)
    }

    socket.on('dashboard.ride.changed', handleRideEvent)
    socket.on('dashboard.ride_request.changed', handleRideEvent)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      socket.off('dashboard.ride.changed', handleRideEvent)
      socket.off('dashboard.ride_request.changed', handleRideEvent)
      socket.disconnect()
    }
  }, [enabled, id, token, queryClient])
}

export const useSuspendRider = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      RiderManagementService.suspendRider(id, notes),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['rider-management', 'riders'] })
      qc.invalidateQueries({ queryKey: QK.rider(id) })
    },
  })
}

export const useBlockRider = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      RiderManagementService.blockRider(id, notes),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['rider-management', 'riders'] })
      qc.invalidateQueries({ queryKey: QK.rider(id) })
    },
  })
}

export const useActivateRider = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      RiderManagementService.activateRider(id, notes),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['rider-management', 'riders'] })
      qc.invalidateQueries({ queryKey: QK.rider(id) })
    },
  })
}
