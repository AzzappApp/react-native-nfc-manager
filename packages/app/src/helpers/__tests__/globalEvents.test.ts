import getRuntimeEnvironment from '@azzapp/shared/getRuntimeEnvironment';
import { addGlobalEventListener, dispatchGlobalEvent } from '../globalEvents';

jest.mock('@azzapp/shared/getRuntimeEnvironment', () =>
  jest.fn().mockReturnValue('react-native'),
);

describe('globalEvents', () => {
  it('adds and removes a listener correctly', () => {
    const listener = jest.fn();
    const removeListener = addGlobalEventListener('SIGN_IN', listener);
    expect(removeListener).toBeDefined();
    expect(typeof removeListener).toBe('function');
    dispatchGlobalEvent({
      type: 'SIGN_IN',
      payload: {
        authTokens: { token: 'mockToken', refreshToken: 'mockRefreshToken' },
      },
    });
    expect(listener).toHaveBeenCalledTimes(1);
    removeListener();
    dispatchGlobalEvent({
      type: 'SIGN_IN',
      payload: {
        authTokens: { token: 'mockToken', refreshToken: 'mockRefreshToken' },
      },
    });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('throws an error if used on web', () => {
    (getRuntimeEnvironment as jest.Mock).mockReturnValue('web');

    expect(() =>
      addGlobalEventListener('TOKENS_REFRESHED', jest.fn()),
    ).toThrowError('globalEvents module is not supported on web');
    expect(() => dispatchGlobalEvent({ type: 'SIGN_OUT' })).toThrowError(
      'globalEvents module is not supported on web',
    );
  });
});
