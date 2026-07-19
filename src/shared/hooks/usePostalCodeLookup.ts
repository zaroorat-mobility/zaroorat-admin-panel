import { useState } from 'react';

export interface PostalCodeResult {
  city: string;
  state: string;
  success: boolean;
}

export const usePostalCodeLookup = () => {
  const [loading, setLoading] = useState(false);

  // City name mapping for India - add more mappings as needed
  const indianCityMappings: Record<string, string> = {
    'Bangalore': 'Bengaluru',
    'Bombay': 'Mumbai',
    'Calcutta': 'Kolkata',
    'Madras': 'Chennai',
    'Baroda': 'Vadodara',
    'Cuttack City': 'Cuttack',
    'Calicut': 'Kozhikode',
    'Cochin': 'Kochi',
    'Benares': 'Varanasi',
    'Cawnpore': 'Kanpur',
    'Waltair': 'Visakhapatnam',
    'Poona': 'Pune',
    'Gauhati': 'Guwahati',
    'Trivandrum': 'Thiruvananthapuram',
    'Simla': 'Shimla',
    'Allahabad': 'Prayagraj',
    'Gurgaon': 'Gurugram',
    'Pondicherry': 'Puducherry',
  };

  const indianStateMappings: Record<string, string> = {
    'Orissa': 'Odisha',
  };

  const lookupPostalCode = async (
    postalCode: string,
    countryCode: string
  ): Promise<PostalCodeResult> => {
    if (!postalCode || postalCode.length < 3) {
      return { city: '', state: '', success: false };
    }

    setLoading(true);

    try {
      if (countryCode.toUpperCase() === 'IN' && postalCode.length === 6) {
        const response = await fetch(
          `https://api.postalpincode.in/pincode/${postalCode}`
        );
        const data = await response.json();

        if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
          const { District, State } = data[0].PostOffice[0];
          
          // Apply name mappings for India
          const mappedCity = indianCityMappings[District] || District;
          const mappedState = indianStateMappings[State] || State;
          
          return {
            city: mappedCity,
            state: mappedState,
            success: true,
          };
        }
      }

      const zipResponse = await fetch(
        `https://api.zippopotam.us/${countryCode.toLowerCase()}/${postalCode}`
      );

      if (zipResponse.ok) {
        const data = await zipResponse.json();

        if (data && data.places && data.places.length > 0) {
          let selectedPlace = data.places[0];

          if (data.places.length > 1) {
            const cityPlace = data.places.find((place: any) => {
              const placeName = place['place name'] || '';
              return placeName.split(' ').length <= 2;
            });
            if (cityPlace) {
              selectedPlace = cityPlace;
            }
          }

          const city = selectedPlace['place name'] || '';
          const state =
            selectedPlace['state'] || selectedPlace['state abbreviation'] || '';

          return {
            city,
            state,
            success: true,
          };
        }
      }

      return { city: '', state: '', success: false };

    } catch (error) {
      return { city: '', state: '', success: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    lookupPostalCode,
    loading,
  };
};
