import { useCallback, useEffect, useRef, useState } from 'react'
import { GOOGLE_MAPS_NO_KEY_MESSAGE, loadGooglePlaces } from '@/shared/components/maps/google/google-maps-loader'
import { useGoogleMapsKey } from './useGoogleMapsKey'

export interface PlaceSuggestion {
  placeId: string
  mainText: string
  secondaryText: string
  types: string[]
}

export interface PlaceAddressComponent {
  longText: string
  shortText: string
  types: string[]
}

export interface PlaceDetails {
  placeId: string
  name: string
  address: string
  location: { lat: number; lng: number }
  types: string[]
  addressComponents: PlaceAddressComponent[]
}

export interface PlaceAutocompleteOptions {
  /** Places API (New) primary types to keep, at most 5 (e.g. 'locality'). */
  includedPrimaryTypes?: string[]
  /** Results near this point rank first. */
  bias?: { lat: number; lng: number; radiusMeters: number } | null
}

const DEBOUNCE_MS = 300
const MIN_LENGTH = 2
const DETAIL_FIELDS = ['id', 'displayName', 'formattedAddress', 'location', 'types', 'addressComponents']

function searchErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err)
  if (message === GOOGLE_MAPS_NO_KEY_MESSAGE) return message
  return `Google place search failed. Check that Places API (New) and billing are enabled for the browser key. (${message})`
}

/**
 * Google Places (New) autocomplete for India, run in the browser with the admin's browser key.
 *
 * Typing is debounced and only the latest query's answer is shown. One session token covers the
 * suggestions for one search plus the details of the place picked, so Google bills them as one
 * session; the pick ends the session and the next keystroke starts a new one.
 */
export function usePlaceAutocomplete(query: string, options: PlaceAutocompleteOptions = {}) {
  const { apiKey, isResolving } = useGoogleMapsKey()
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const predictionsRef = useRef(new Map<string, google.maps.places.PlacePrediction>())
  const tokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null)
  const seqRef = useRef(0)

  // Primitives, so callers can pass fresh option objects on every render.
  const typesKey = (options.includedPrimaryTypes ?? []).join(',')
  const biasLat = options.bias?.lat
  const biasLng = options.bias?.lng
  const biasRadius = options.bias?.radiusMeters

  useEffect(() => {
    const input = query.trim()
    const seq = ++seqRef.current
    if (input.length < MIN_LENGTH || isResolving) {
      setSuggestions([])
      setIsSearching(false)
      setError(null)
      return
    }
    if (!apiKey) {
      setSuggestions([])
      setIsSearching(false)
      setError(GOOGLE_MAPS_NO_KEY_MESSAGE)
      return
    }

    setIsSearching(true)
    const timer = setTimeout(async () => {
      try {
        const places = await loadGooglePlaces(apiKey)
        tokenRef.current ??= new places.AutocompleteSessionToken()
        const request: google.maps.places.AutocompleteRequest = {
          input,
          sessionToken: tokenRef.current,
          includedRegionCodes: ['in'],
          language: 'en',
          region: 'in',
        }
        if (typesKey) request.includedPrimaryTypes = typesKey.split(',')
        if (biasLat !== undefined && biasLng !== undefined && biasRadius) {
          request.locationBias = { center: { lat: biasLat, lng: biasLng }, radius: biasRadius }
        }

        const { suggestions: found } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request)
        if (seq !== seqRef.current) return

        predictionsRef.current.clear()
        const next: PlaceSuggestion[] = []
        for (const suggestion of found) {
          const prediction = suggestion.placePrediction
          if (!prediction) continue
          predictionsRef.current.set(prediction.placeId, prediction)
          next.push({
            placeId: prediction.placeId,
            mainText: prediction.mainText?.text ?? prediction.text.text,
            secondaryText: prediction.secondaryText?.text ?? '',
            types: prediction.types,
          })
        }
        setSuggestions(next)
        setError(null)
      } catch (err) {
        if (seq !== seqRef.current) return
        setSuggestions([])
        setError(searchErrorMessage(err))
      } finally {
        if (seq === seqRef.current) setIsSearching(false)
      }
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [query, apiKey, isResolving, typesKey, biasLat, biasLng, biasRadius])

  /** Fetches the picked suggestion's location and address; this ends the billing session. */
  const resolve = useCallback(async (suggestion: PlaceSuggestion): Promise<PlaceDetails> => {
    const prediction = predictionsRef.current.get(suggestion.placeId)
    if (!prediction) throw new Error('This suggestion is no longer current. Search again.')
    const { place } = await prediction.toPlace().fetchFields({ fields: DETAIL_FIELDS })
    tokenRef.current = null
    if (!place.location) throw new Error('Google returned no location for this place.')
    return {
      placeId: place.id,
      name: place.displayName ?? suggestion.mainText,
      address: place.formattedAddress ?? suggestion.secondaryText,
      location: { lat: place.location.lat(), lng: place.location.lng() },
      types: place.types ?? suggestion.types,
      addressComponents: (place.addressComponents ?? []).map((c) => ({
        longText: c.longText ?? '',
        shortText: c.shortText ?? '',
        types: c.types,
      })),
    }
  }, [])

  return { suggestions, isSearching, error, resolve }
}
