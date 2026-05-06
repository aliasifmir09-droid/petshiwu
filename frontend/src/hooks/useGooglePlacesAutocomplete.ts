import { useEffect, useRef } from 'react';

interface AddressComponents {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface UseGooglePlacesAutocompleteOptions {
  onAddressSelect: (address: AddressComponents) => void;
}

const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.maps?.places) {
      resolve();
      return;
    }

    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Google Maps script failed to load')));
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      reject(new Error('VITE_GOOGLE_MAPS_API_KEY is not set'));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
};

const parseAddressComponents = (
  components: google.maps.GeocoderAddressComponent[],
  formattedAddress: string
): AddressComponents => {
  const get = (type: string) =>
    components.find(c => c.types.includes(type))?.long_name || '';

  const getShort = (type: string) =>
    components.find(c => c.types.includes(type))?.short_name || '';

  const streetNumber = get('street_number');
  const route = get('route');
  const street = streetNumber && route
    ? `${streetNumber} ${route}`
    : formattedAddress.split(',')[0] || '';

  const city =
    get('locality') ||
    get('sublocality') ||
    get('sublocality_level_1') ||
    get('administrative_area_level_3') ||
    get('postal_town') ||
    '';

  const state = getShort('administrative_area_level_1');
  const zipCode = get('postal_code');
  const countryCode = getShort('country');
  const country = countryCode === 'US' ? 'USA' : get('country');

  return { street, city, state, zipCode, country };
};

export const useGooglePlacesAutocomplete = (
  { onAddressSelect }: UseGooglePlacesAutocompleteOptions
) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    let isMounted = true;

    loadGoogleMapsScript()
      .then(() => {
        if (!isMounted || !inputRef.current) return;

        autocompleteRef.current = new window.google.maps.places.Autocomplete(
          inputRef.current,
          {
            types: ['address'],
            componentRestrictions: { country: 'us' },
            fields: ['address_components', 'formatted_address']
          }
        );

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          if (!place?.address_components) return;

          const parsed = parseAddressComponents(
            place.address_components,
            place.formatted_address || ''
          );
          onAddressSelect(parsed);
        });
      })
      .catch(err => {
        console.warn('Google Places Autocomplete not available:', err.message);
      });

    return () => {
      isMounted = false;
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  return { inputRef };
};
