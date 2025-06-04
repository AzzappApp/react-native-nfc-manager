import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

export const useCurrentLocation = () => {
  const [currentValue, setCurrentValue] = useState<{
    value: {
      location: Location.LocationObject;
      address?: Location.LocationGeocodedAddress;
    } | null;
    locationSearched: boolean;
  }>({ value: null, locationSearched: false });

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setCurrentValue({ value: null, locationSearched: true });
        return;
      }

      let currentLocation = await Location.getLastKnownPositionAsync({
        requiredAccuracy: 100, //100m
        maxAge: 1000 * 60 * 10, // 10 minutes
      });
      if (!currentLocation) {
        currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.LocationAccuracy.Balanced,
        });
      }
      let address = null;
      if (currentLocation) {
        address = await Location.reverseGeocodeAsync(currentLocation.coords);
        if (address.length > 0) {
          setCurrentValue({
            value: {
              location: currentLocation,
              address: address[0],
            },
            locationSearched: true,
          });
          return;
        } else {
          setCurrentValue({
            value: {
              location: currentLocation,
            },
            locationSearched: true,
          });
          return;
        }
      }
      setCurrentValue({ value: null, locationSearched: true });
    })();
  }, []);

  return currentValue;
};
