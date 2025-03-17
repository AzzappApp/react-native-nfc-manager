import { renderHook } from '@testing-library/react-hooks';
import Toast from 'react-native-toast-message';
import ERRORS from '@azzapp/shared/errors';
import { useRouter } from '#components/NativeRouter';
import { getAuthState } from '#helpers/authStore';
import useOnSubscriptionError from '../useOnSubscriptionError';

// Mock dependencies
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

jest.mock('#components/NativeRouter', () => ({
  useRouter: jest.fn(),
}));

jest.mock('#helpers/authStore', () => ({
  getAuthState: jest.fn(),
}));

jest.mock('react-intl', () => ({
  useIntl: jest.fn(() => ({
    formatMessage: jest.fn(({ defaultMessage }) => defaultMessage), // Mock intl formatter
  })),
}));

describe('useOnSubscriptionError', () => {
  let mockRouterPush: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouterPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockRouterPush });
  });

  test('should show toast and navigate to USER_PAY_WALL for subscription required error (owner)', () => {
    (getAuthState as jest.Mock).mockReturnValue({
      profileInfos: { profileRole: 'owner' },
    });

    const { result } = renderHook(() => useOnSubscriptionError(false));

    result.current(new Error(ERRORS.SUBSCRIPTION_REQUIRED));

    expect(mockRouterPush).toHaveBeenCalledWith({ route: 'USER_PAY_WALL' });
    expect(Toast.show).not.toHaveBeenCalled();
  });

  test('should show toast for non-owner when subscription required', () => {
    (getAuthState as jest.Mock).mockReturnValue({
      profileInfos: { profileRole: 'user' },
    });

    const { result } = renderHook(() => useOnSubscriptionError(false));

    result.current(new Error(ERRORS.SUBSCRIPTION_REQUIRED));

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        text1: expect.stringContaining(
          'Please contact the owner of this WebCard',
        ),
      }),
    );
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  test('should show toast for subscription insufficient seats error (owner, web subscription)', () => {
    (getAuthState as jest.Mock).mockReturnValue({
      profileInfos: { profileRole: 'owner' },
    });

    const { result } = renderHook(() => useOnSubscriptionError(true));

    result.current(new Error(ERRORS.SUBSCRIPTION_INSUFFICIENT_SEATS));

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        text1: expect.stringContaining(
          'Error, not enough users available in you subscription to publish this webcard, please upgrade your subscription',
        ),
      }),
    );
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  test('should show toast for subscription insufficient seats error (non-owner)', () => {
    (getAuthState as jest.Mock).mockReturnValue({
      profileInfos: { profileRole: 'user' },
    });

    const { result } = renderHook(() => useOnSubscriptionError(false));

    result.current(new Error(ERRORS.SUBSCRIPTION_INSUFFICIENT_SEATS));

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        text1: expect.stringContaining(
          'Please contact the owner of this WebCard',
        ),
      }),
    );
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  test('should show unknown error toast for unexpected errors', () => {
    (getAuthState as jest.Mock).mockReturnValue({
      profileInfos: { profileRole: 'owner' },
    });

    const { result } = renderHook(() => useOnSubscriptionError(false));

    result.current(new Error('Some unknown error'));

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        text1: 'Unknown error - Please retry',
      }),
    );
    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});
