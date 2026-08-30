import { useState, useCallback } from 'react'

interface StateData {
  name: string
  state_code?: string
}

export interface CountryOption {
  name: string
  iso2?: string
  iso3?: string
}

export const useCountriesNow = () => {
  const [statesLoading, setStatesLoading] = useState(false)
  const [citiesLoading, setCitiesLoading] = useState(false)
  const [states, setStates] = useState<string[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [countries, setCountries] = useState<CountryOption[]>([])
  const [countriesLoading, setCountriesLoading] = useState(false)

  const fetchCountries = useCallback(async () => {
    setCountriesLoading(true)
    try {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries')
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data.data)) {
          const normalized: CountryOption[] = data.data
            .map((entry: { country?: string; name?: string; iso2?: string; iso3?: string }) => {
              const name = entry.country || entry.name
              if (!name) return null
              return {
                name,
                iso2: entry.iso2,
                iso3: entry.iso3,
              }
            })
            .filter((entry: CountryOption | null): entry is CountryOption => entry != null)
            .sort((a: CountryOption, b: CountryOption) => a.name.localeCompare(b.name))

          setCountries(normalized)
          return normalized
        }
      }
      setCountries([])
      return []
    } catch {
      setCountries([])
      return []
    } finally {
      setCountriesLoading(false)
    }
  }, [])

  const fetchStates = useCallback(async (countryName: string): Promise<string[]> => {
    if (!countryName) {
      setStates([])
      return []
    }

    setStatesLoading(true)
    try {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: countryName }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.data?.states) {
          const stateNames = data.data.states
            .map((s: StateData) => s.name)
            .filter(Boolean)
            .sort((a: string, b: string) => a.localeCompare(b))
          setStates(stateNames)
          return stateNames
        }
      }
      setStates([])
      return []
    } catch {
      setStates([])
      return []
    } finally {
      setStatesLoading(false)
    }
  }, [])

  const fetchCities = useCallback(async (countryName: string, stateName: string): Promise<string[]> => {
    if (!countryName || !stateName) {
      setCities([])
      return []
    }

    setCitiesLoading(true)
    try {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: countryName, state: stateName }),
      })

      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data.data)) {
          const cityNames = data.data.filter(Boolean).sort((a: string, b: string) => a.localeCompare(b))
          setCities(cityNames)
          return cityNames
        }
      }
      setCities([])
      return []
    } catch {
      setCities([])
      return []
    } finally {
      setCitiesLoading(false)
    }
  }, [])

  const clearStates = useCallback(() => setStates([]), [])
  const clearCities = useCallback(() => setCities([]), [])

  return {
    fetchCountries,
    fetchStates,
    fetchCities,
    clearStates,
    clearCities,
    states,
    cities,
    countries,
    countriesLoading,
    statesLoading,
    citiesLoading,
  }
}
