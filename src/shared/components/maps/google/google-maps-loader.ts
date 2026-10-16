let googlePromise: Promise<typeof google> | null = null
let currentLoadedKey: string | null = null
let authFailureHandlerRegistered = false
let callbackSeq = 0

type AuthFailureListener = (errorMsg: string) => void
const authListeners = new Set<AuthFailureListener>()

export function onGoogleMapsAuthError(listener: AuthFailureListener): () => void {
  authListeners.add(listener)
  return () => authListeners.delete(listener)
}

let activeReject: ((reason: Error) => void) | null = null
let activeTimeoutTimer: ReturnType<typeof setTimeout> | null = null
const SCRIPT_ID = 'google-maps-sdk-script'

function removeExistingScript() {
  if (typeof document !== 'undefined') {
    const existing = document.getElementById(SCRIPT_ID)
    if (existing) {
      existing.remove()
    }
  }
}

function cleanupLoadingState() {
  if (activeTimeoutTimer) {
    clearTimeout(activeTimeoutTimer)
    activeTimeoutTimer = null
  }
  removeExistingScript()
  googlePromise = null
  currentLoadedKey = null
  activeReject = null
}

function setupAuthFailureTrap() {
  if (authFailureHandlerRegistered || typeof window === 'undefined') return
  authFailureHandlerRegistered = true

  const win = window as unknown as { gm_authFailure?: () => void }
  const existingHandler = win.gm_authFailure

  win.gm_authFailure = () => {
    const errorMsg =
      'Google Maps authentication failed. Please verify that your API key is active, billing is enabled, and your domain referrer is authorized in Google Cloud Console.'
    console.error(`[GoogleMaps] ${errorMsg}`)
    authListeners.forEach((l) => l(errorMsg))
    if (activeReject) {
      activeReject(new Error(errorMsg))
    }
    cleanupLoadingState()
    if (existingHandler && existingHandler !== win.gm_authFailure) {
      existingHandler()
    }
  }
}

const getEnvApiKey = (): string =>
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_MAPS_API_KEY
    ? String(import.meta.env.VITE_GOOGLE_MAPS_API_KEY).trim()
    : ''

/**
 * Production-ready singleton loader for Google Maps JavaScript API.
 * Uses Google's official async bootstrap (loading=async, v=weekly, libraries=places,geometry,drawing).
 * Features:
 * - Dynamic key upgrades (upgrades keyless in-flight request if real key arrives)
 * - Self-healing cleanup on failure/timeout (prevents infinite timeout loops)
 * - Immediate gm_authFailure trap (rejects instantly on billing/referer/key issues)
 * - 30-second network-tolerant timeout
 */
export async function loadGoogleMapsSdk(apiKey?: string): Promise<typeof google> {
  if (typeof window === 'undefined') {
    throw new Error('Google Maps Web SDK can only be loaded in a browser environment')
  }

  setupAuthFailureTrap()

  // 1. If Google Maps is already fully initialized on window, resolve immediately
  if (window.google?.maps?.Map) {
    return window.google
  }

  const resolvedKey = apiKey?.trim() || getEnvApiKey()

  // 2. If already in flight with the exact same key, return the existing promise
  if (googlePromise && currentLoadedKey === resolvedKey) {
    return googlePromise
  }

  // 3. If an existing script in DOM was loaded without a key (or an obsolete key),
  // but now we have a real key, clean up and reload with the authentic key.
  if (googlePromise && currentLoadedKey !== resolvedKey) {
    cleanupLoadingState()
  }

  // 4. Return active promise if already in flight
  if (googlePromise) {
    return googlePromise
  }

  currentLoadedKey = resolvedKey

  googlePromise = new Promise<typeof google>((resolve, reject) => {
    activeReject = reject

    // Check again in case Map became available
    if (window.google?.maps?.Map) {
      resolve(window.google)
      return
    }

    const callbackName = `__googleMapsInitCallback_${Date.now()}_${++callbackSeq}`

    const handleSuccess = () => {
      if (activeTimeoutTimer) clearTimeout(activeTimeoutTimer)
      activeTimeoutTimer = null
      activeReject = null
      delete (window as unknown as Record<string, () => void>)[callbackName]
      if (window.google?.maps?.Map || window.google?.maps) {
        resolve(window.google)
      } else {
        cleanupLoadingState()
        reject(new Error('Google Maps SDK loaded but google.maps namespace was not initialized'))
      }
    }

    ;(window as unknown as Record<string, () => void>)[callbackName] = handleSuccess

    // Remove any leftover script element before appending new one
    removeExistingScript()

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.type = 'text/javascript'
    script.async = true
    script.defer = true

    const params = new URLSearchParams({
      libraries: 'places,geometry,drawing',
      v: 'weekly',
      loading: 'async',
      callback: callbackName,
    })
    if (resolvedKey) {
      params.set('key', resolvedKey)
    }

    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`

    script.onerror = () => {
      delete (window as unknown as Record<string, () => void>)[callbackName]
      const errorMsg =
        'Failed to load Google Maps script from Google servers. Please check your internet connection or firewall.'
      console.error(`[GoogleMapsLoader] ${errorMsg}`)
      cleanupLoadingState()
      reject(new Error(errorMsg))
    }

    // Generous 30-second timeout for mobile networks / cold CDN caches
    activeTimeoutTimer = setTimeout(() => {
      delete (window as unknown as Record<string, () => void>)[callbackName]
      if (window.google?.maps?.Map) {
        resolve(window.google)
      } else {
        const errorMsg =
          'Google Maps script tag timed out loading (30s exceeded). Please check your internet connection or Google Cloud Console billing/API status.'
        console.error(`[GoogleMapsLoader] ${errorMsg}`)
        cleanupLoadingState()
        reject(new Error(errorMsg))
      }
    }, 30000)

    document.head.appendChild(script)
  })

  return googlePromise
}
