import { addGlobalEventListener, dispatchGlobalEvent } from '../globalEvents';

describe('globalEvents', () => {
  test('adds and removes a listener correctly', () => {
    const listener = jest.fn();
    const removeListener = addGlobalEventListener('SIGN_IN', listener);
    expect(removeListener).toBeDefined();
    expect(typeof removeListener).toBe('function');
    void dispatchGlobalEvent({
      type: 'SIGN_IN',
      payload: {
        authTokens: {
          token: 'mockToken',
          refreshToken: 'mockRefreshToken',
        },
        userId: '',
      },
    });
    expect(listener).toHaveBeenCalledTimes(1);
    removeListener();
    void dispatchGlobalEvent({
      type: 'SIGN_IN',
      payload: {
        authTokens: { token: 'mockToken', refreshToken: 'mockRefreshToken' },
        userId: '',
      },
    });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
