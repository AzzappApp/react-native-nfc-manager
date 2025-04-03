import { renderHook, act } from '@testing-library/react-hooks';
import Purchases from 'react-native-purchases';
import * as authStore from '#helpers/authStore';
import { useRevenueCat } from '../useRevenueCat';

jest.mock('@sentry/react-native');
jest.mock('react-native-purchases');
jest.mock('#helpers/authStore');

describe('useRevenueCat', () => {
  const mockLogIn = jest.fn();
  const mockLogOut = jest.fn();
  const mockIsAnonymous = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (Purchases.logIn as jest.Mock) = mockLogIn;
    (Purchases.logOut as jest.Mock) = mockLogOut;
    (Purchases.isAnonymous as jest.Mock) = mockIsAnonymous;
  });

  it('logs in user when profileInfos exist and userId has changed', async () => {
    const userId = 'user123';
    (authStore.getAuthState as jest.Mock).mockReturnValue({
      profileInfos: { userId },
    });

    const listeners: any[] = [];
    (authStore.addAuthStateListener as jest.Mock).mockImplementation(cb =>
      listeners.push(cb),
    );

    renderHook(() => useRevenueCat());

    // simulate auth state change
    await act(async () => {
      await listeners[0]();
    });

    expect(mockLogIn).toHaveBeenCalledWith(userId);
    expect(mockLogOut).not.toHaveBeenCalled();
  });

  it('does not log out if user is anonymous', async () => {
    (authStore.getAuthState as jest.Mock).mockReturnValue({
      profileInfos: null,
    });
    mockIsAnonymous.mockResolvedValue(true);

    const listeners: any[] = [];
    (authStore.addAuthStateListener as jest.Mock).mockImplementation(cb =>
      listeners.push(cb),
    );

    renderHook(() => useRevenueCat());

    await act(async () => {
      await listeners[0]();
    });

    expect(mockLogOut).not.toHaveBeenCalled();
  });
});
