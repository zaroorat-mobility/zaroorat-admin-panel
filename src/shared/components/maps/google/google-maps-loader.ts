import { importLibrary, setOptions } from '@googlemaps/js-api-loader'

/**
 * Maps JavaScript API release channel. Quarterly moves four times a year, with release notes
 * ahead of each change; weekly takes every change as it ships (that is how the removal of
 * DrawingManager in May 2026 reached this app).
 */
const GOOGLE_MAPS_CHANNEL = 'quarterly'

export const GOOGLE_MAPS_NO_KEY_MESSAGE =
  'Google Maps is not configured. Add a browser (Client SDK) key under Platform → Maps.'

const AUTH_FAILURE_MESSAGE =
  'Google Maps authentication failed. Please verify that your API key is active, billing is enabled, and your domain referrer is authorized in Google Cloud Console.'

type AuthFailureListener = (errorMsg: string) => void
const authListeners = new Set<AuthFailureListener>()
let authFailure: string | null = null
let authTrapInstalled = false
let configuredKey: string | null = null
let sdkPromise: Promise<typeof google> | null = null

/** Calls `listener` when Google rejects the key, at once if it already did on this page. */
export function onGoogleMapsAuthError(listener: AuthFailureListener): () => void {
  authListeners.add(listener)
  if (authFailure) listener(authFailure)
  return () => {
    authListeners.delete(listener)
  }
}

// Google reports a rejected key (bad key, billing, referrer) only through this global.
function installAuthFailureTrap() {
  if (authTrapInstalled) return
  authTrapInstalled = true
  const win = window as unknown as { gm_authFailure?: () => void }
  const previous = win.gm_authFailure
  win.gm_authFailure = () => {
    authFailure = AUTH_FAILURE_MESSAGE
    console.error(`[GoogleMaps] ${AUTH_FAILURE_MESSAGE}`)
    authListeners.forEach((l) => l(AUTH_FAILURE_MESSAGE))
    previous?.()
  }
}

/**
 * Loads the Maps JavaScript API through Google's official loader, once per page.
 * The API accepts one key per page load: a different key passed later is ignored until reload.
 * It never loads without a key.
 */
export function loadGoogleMapsSdk(apiKey: string): Promise<typeof google> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps Web SDK can only be loaded in a browser environment'))
  }
  const key = apiKey.trim()
  if (!key) return Promise.reject(new Error(GOOGLE_MAPS_NO_KEY_MESSAGE))

  if (configuredKey === null) {
    installAuthFailureTrap()
    // region IN: borders and labels as shown in India.
    setOptions({ key, v: GOOGLE_MAPS_CHANNEL, language: 'en', region: 'IN' })
    configuredKey = key
  } else if (key !== configuredKey) {
    console.warn('[GoogleMaps] The Maps API is already loaded with another key; reload the page to use the new one.')
  }

  sdkPromise ??= Promise.all([
    importLibrary('core'),
    importLibrary('maps'),
    importLibrary('marker'),
    importLibrary('geometry'),
  ])
    .then(() => window.google)
    .catch((err: unknown) => {
      // A failed script load can be retried: the loader bootstraps again on the next import.
      sdkPromise = null
      throw err instanceof Error ? err : new Error('Google Maps could not load.')
    })
  return sdkPromise
}

/** The Places library (Places API (New) classes), loaded on first use. */
export async function loadGooglePlaces(apiKey: string): Promise<google.maps.PlacesLibrary> {
  await loadGoogleMapsSdk(apiKey)
  return importLibrary('places')
}
