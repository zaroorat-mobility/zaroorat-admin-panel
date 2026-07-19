import { useState, useCallback } from 'react';

interface StateData {
  name: string;
  state_code?: string;
}

export const useCountriesNow = () => {
  const [statesLoading, setStatesLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);

  const fetchCountries = useCallback(async () => {
    setCountriesLoading(true);
    try {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries');
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setCountries(data.data);
          return data.data;
        }
      }
      setCountries([]);
      return [];
    } catch (error) {
      setCountries([]);
      return [];
    } finally {
      setCountriesLoading(false);
    }
  }, []);

  const fetchStates = useCallback(async (countryName: string): Promise<string[]> => {
    if (!countryName) {
      setStates([]);
      return [];
    }

    setStatesLoading(true);
    try {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: countryName }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data?.states) {
          const stateNames = data.data.states.map((s: StateData) => s.name);
          setStates(stateNames);
          return stateNames;
        }
      }
      setStates([]);
      return [];
    } catch (error) {
      setStates([]);
      return [];
    } finally {
      setStatesLoading(false);
    }
  }, []);

  const fetchCities = useCallback(async (countryName: string, stateName: string): Promise<string[]> => {
    if (!countryName || !stateName) {
      setCities([]);
      return [];
    }

    setCitiesLoading(true);
    try {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: countryName, state: stateName }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setCities(data.data);
          return data.data;
        }
      }
      setCities([]);
      return [];
    } catch (error) {
      setCities([]);
      return [];
    } finally {
      setCitiesLoading(false);
    }
  }, []);

  const clearStates = useCallback(() => setStates([]), []);
  const clearCities = useCallback(() => setCities([]), []);

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
  };
};
