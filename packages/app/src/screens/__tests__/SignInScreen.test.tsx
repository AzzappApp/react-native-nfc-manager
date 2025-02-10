import ERRORS from '@azzapp/shared/errors';
import { flushPromises } from '@azzapp/shared/jestHelpers';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import { init as initLocaleHelpers } from '#helpers/localeHelpers';
import { signin } from '#helpers/MobileWebAPI';
import { act, fireEvent, render, screen } from '#helpers/testHelpers';
import SignInScreen from '../SignInScreen';

jest.mock('#helpers/MobileWebAPI');
jest.mock('#helpers/globalEvents');
jest.mock('react-native-keychain', () => ({
  setSharedWebCredentials: jest.fn().mockResolvedValue(true),
}));
jest.mock('#ui/SelectList');

describe('Signin Screen', () => {
  const signinMock = jest.mocked(signin);
  const dispatchGlobalEventMock = jest.mocked(dispatchGlobalEvent);

  beforeAll(() => {
    initLocaleHelpers();
  });

  beforeEach(() => {
    signinMock.mockReset();
    dispatchGlobalEventMock.mockReset();
  });

  // TODO reenable this test
  xtest('submit button should be `disabled` if both credential and password are empty', () => {
    render(<SignInScreen />);

    const credentialInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const buttonComponent = screen.getByTestId('submitButton');

    expect(buttonComponent).toBeDisabled();
    act(() => fireEvent(credentialInput, 'onChangeText', 'myname'));
    expect(credentialInput.props.value).toBe('myname');

    expect(buttonComponent).toBeDisabled();
    act(() => fireEvent(passwordInput, 'onChangeText', 'myPassword'));
    expect(passwordInput.props.value).toBe('myPassword');
  });

  test('should call the `signin` callback if credential and password are filled', async () => {
    render(<SignInScreen />);
    signinMock.mockResolvedValueOnce({
      token: 'fake-token',
      refreshToken: 'fake-refreshToken',
      userId: 'fake-userId',
      profileInfos: {
        profileId: 'fake-profileId',
        webCardId: 'fake-webCardId',
        profileRole: 'editor',
      },
      email: 'fake-email',
      phoneNumber: 'fake-phoneNumber',
    });

    const credentialInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const buttonComponent = screen.getByTestId('submitButton');

    act(() => fireEvent(credentialInput, 'onChangeText', 'myname'));
    act(() => fireEvent(passwordInput, 'onChangeText', 'myPassword'));
    act(() => fireEvent(buttonComponent, 'onPress'));

    expect(signin).toHaveBeenCalledWith({
      credential: 'myname',
      password: 'myPassword',
    });

    expect(buttonComponent).toHaveAccessibilityState({ busy: true });
    await act(flushPromises);
    expect(dispatchGlobalEventMock).toHaveBeenCalledWith({
      type: 'SIGN_IN',
      payload: {
        authTokens: {
          token: 'fake-token',
          refreshToken: 'fake-refreshToken',
        },
        profileInfos: {
          profileId: 'fake-profileId',
          profileRole: 'editor',
          webCardId: 'fake-webCardId',
        },
        email: 'fake-email',
        phoneNumber: 'fake-phoneNumber',
        userId: 'fake-userId',
      },
    });
  });

  test('should display an error message if the `signin` callback fails', async () => {
    render(<SignInScreen />);
    signinMock.mockRejectedValueOnce(new Error(ERRORS.INVALID_CREDENTIALS));

    const credentialInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const buttonComponent = screen.getByTestId('submitButton');

    act(() => fireEvent(credentialInput, 'onChangeText', 'myname'));
    act(() => fireEvent(passwordInput, 'onChangeText', 'myPassword'));

    expect(screen.queryByText('Invalid credentials')).not.toBeTruthy();

    act(() => fireEvent(buttonComponent, 'onPress'));
    await act(flushPromises);
    expect(screen.queryByText('Invalid credentials')).toBeTruthy();
  });
});
