import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

export const useCurrentLocation = () => {
  const [currentValue, setCurrentValue] = useState<{
    location: Location.LocationObject;
    address?: Location.LocationGeocodedAddress;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      const currentLocation = await Location.getLastKnownPositionAsync({
        requiredAccuracy: 100, //100m
      });
      let address = null;
      if (currentLocation) {
        address = await Location.reverseGeocodeAsync(currentLocation.coords);
        if (address.length > 0) {
          setCurrentValue({
            location: currentLocation,
            address: address[0],
          });
          return;
        } else {
          setCurrentValue({
            location: currentLocation,
          });
          return;
        }
      }
      setCurrentValue(null);
    })();
  }, []);

  return currentValue;
};
