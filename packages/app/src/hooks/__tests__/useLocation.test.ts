import { renderHook } from '@testing-library/react-hooks';
import * as Location from 'expo-location';
import { useCurrentLocation } from '../useLocation';

// Mocking the entire expo-location module
jest.mock('expo-location');

describe('useCurrentLocation', () => {
  const mockRequestPermissions =
    Location.requestForegroundPermissionsAsync as jest.Mock;
  const mockGetLastKnownPosition =
    Location.getLastKnownPositionAsync as jest.Mock;
  const mockReverseGeocode = Location.reverseGeocodeAsync as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns null if permission is not granted', async () => {
    mockRequestPermissions.mockResolvedValue({ status: 'denied' });

    const { result } = renderHook(() => useCurrentLocation());

    expect(result.current).toEqual({ value: null, locationSearched: false });
    expect(mockGetLastKnownPosition).not.toHaveBeenCalled();
  });

  test('returns null if location is not available', async () => {
    mockRequestPermissions.mockResolvedValue({ status: 'granted' });
    mockGetLastKnownPosition.mockResolvedValue(null);

    const { result } = renderHook(() => useCurrentLocation());

    expect(result.current).toEqual({ value: null, locationSearched: false });
    expect(mockReverseGeocode).not.toHaveBeenCalled();
  });

  test('returns location without address if reverse geocoding fails or returns empty array', async () => {
    const fakeLocation = {
      coords: {
        latitude: 10,
        longitude: 20,
      },
    };

    mockRequestPermissions.mockResolvedValue({ status: 'granted' });
    mockGetLastKnownPosition.mockResolvedValue(fakeLocation);
    mockReverseGeocode.mockResolvedValue([]);

    const { result, waitForNextUpdate } = renderHook(() =>
      useCurrentLocation(),
    );

    await waitForNextUpdate();

    expect(result.current).toEqual({
      value: {
        location: fakeLocation,
      },
      locationSearched: true,
    });
  });

  test('returns location with address if reverse geocoding is successful', async () => {
    const fakeLocation = {
      coords: {
        latitude: 10,
        longitude: 20,
      },
    };

    const fakeAddress = {
      city: 'Test City',
      country: 'Test Country',
    };

    mockRequestPermissions.mockResolvedValue({ status: 'granted' });
    mockGetLastKnownPosition.mockResolvedValue(fakeLocation);
    mockReverseGeocode.mockResolvedValue([fakeAddress]);

    const { result, waitForNextUpdate } = renderHook(() =>
      useCurrentLocation(),
    );

    await waitForNextUpdate();

    expect(result.current).toEqual({
      value: {
        location: fakeLocation,
        address: fakeAddress,
      },
      locationSearched: true,
    });
  });
});
